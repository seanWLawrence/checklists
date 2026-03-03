import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambdaEventSources from "aws-cdk-lib/aws-lambda-event-sources";
import * as logs from "aws-cdk-lib/aws-logs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import * as cloudwatchActions from "aws-cdk-lib/aws-cloudwatch-actions";
import type * as sns from "aws-cdk-lib/aws-sns";
import type * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as customResources from "aws-cdk-lib/custom-resources";
import * as cdk from "aws-cdk-lib";
import path from "node:path";
import {
  OPENAI_TRANSCRIPTION_MODEL,
  OPENAI_TRANSCRIPTION_STRUCTURING_MODEL,
} from "./env";

const TIMEOUT_IN_MIN = 10;

interface WorkerConstructProps {
  readonly role: iam.Role;
  readonly bucket: s3.Bucket;
  readonly alarmTopic: sns.ITopic;
  readonly table: dynamodb.ITable;
  readonly secret: secretsmanager.Secret;
}

export class WorkerConstruct extends Construct {
  public readonly jobsQueue: sqs.Queue;
  public readonly jobsDlq: sqs.Queue;
  public readonly worker: lambdaNodejs.NodejsFunction;

  constructor(scope: Construct, id: string, props: WorkerConstructProps) {
    super(scope, id);
    const maxReceiveAttempts = 3;

    this.jobsDlq = new sqs.Queue(this, "jobs-dlq", {
      retentionPeriod: cdk.Duration.days(14),
    });

    this.jobsQueue = new sqs.Queue(this, "jobs-queue", {
      visibilityTimeout: cdk.Duration.minutes(11),
      deadLetterQueue: {
        queue: this.jobsDlq,
        maxReceiveCount: maxReceiveAttempts,
      },
    });

    const secretUpdater = new lambda.Function(
      this,
      "secret-queue-url-updater",
      {
        runtime: lambda.Runtime.NODEJS_24_X,
        handler: "index.handler",
        timeout: cdk.Duration.minutes(1),
        code: lambda.Code.fromInline(`
        const { SecretsManagerClient, GetSecretValueCommand, UpdateSecretCommand } = require("@aws-sdk/client-secrets-manager");
        const client = new SecretsManagerClient({});
        exports.handler = async (event) => {
          const props = event.ResourceProperties || {};
          const secretId = props.SecretId;
          const queueUrl = props.QueueUrl;
          const key = props.SecretKey || "AWS_JOBS_QUEUE_URL";
          if (!secretId || !queueUrl) {
            throw new Error("SecretId and QueueUrl are required");
          }
          if (event.RequestType === "Delete") {
            return { PhysicalResourceId: \`\${secretId}:\${key}\` };
          }
          const current = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
          if (typeof current.SecretString !== "string") {
            throw new Error("SecretString is required for secret update");
          }
          const parsed = JSON.parse(current.SecretString);
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new Error("SecretString must be a JSON object");
          }
          if (parsed[key] === queueUrl) {
            return { PhysicalResourceId: \`\${secretId}:\${key}\` };
          }
          const nextValue = { ...parsed, [key]: queueUrl };
          await client.send(new UpdateSecretCommand({
            SecretId: secretId,
            SecretString: JSON.stringify(nextValue),
          }));
          return { PhysicalResourceId: \`\${secretId}:\${key}\` };
        };
      `),
      },
    );

    props.secret.grantRead(secretUpdater);
    props.secret.grantWrite(secretUpdater);

    const secretUpdaterProvider = new customResources.Provider(
      this,
      "secret-queue-url-updater-provider",
      {
        onEventHandler: secretUpdater,
      },
    );

    const secretQueueUrlSync = new cdk.CustomResource(
      this,
      "secret-queue-url-sync",
      {
        serviceToken: secretUpdaterProvider.serviceToken,
        properties: {
          SecretId: props.secret.secretArn,
          QueueUrl: this.jobsQueue.queueUrl,
          SecretKey: "AWS_JOBS_QUEUE_URL",
        },
      },
    );

    const workerLogGroup = new logs.LogGroup(this, "worker-log-group", {
      retention: logs.RetentionDays.ONE_WEEK,
    });

    this.worker = new lambdaNodejs.NodejsFunction(this, "worker", {
      runtime: lambda.Runtime.NODEJS_24_X,
      architecture: lambda.Architecture.ARM_64,
      entry: path.join(__dirname, "../../src/lambda/worker/index.ts"),
      handler: "handler",
      timeout: cdk.Duration.minutes(TIMEOUT_IN_MIN),
      memorySize: 1024,
      logGroup: workerLogGroup,
      depsLockFilePath: path.join(__dirname, "../../package-lock.json"),
      projectRoot: path.join(__dirname, "../.."),
      bundling: {
        minify: true,
        sourceMap: true,
        target: "node24",
      },
      environment: {
        AWS_BUCKET_NAME: props.bucket.bucketName,
        AWS_TABLE_NAME: props.table.tableName,
        AWS_APP_SECRET_NAME: props.secret.secretName,
        MAX_RECEIVE_ATTEMPTS: String(maxReceiveAttempts),
        TIMEOUT_IN_MIN: String(TIMEOUT_IN_MIN),

        // Transcription job
        OPENAI_TRANSCRIPTION_MODEL,
        OPENAI_TRANSCRIPTION_STRUCTURING_MODEL:
          OPENAI_TRANSCRIPTION_STRUCTURING_MODEL,
      },
    });

    this.worker.addEventSource(
      new lambdaEventSources.SqsEventSource(this.jobsQueue, {
        batchSize: 1,
      }),
    );

    const workerErrorsAlarm = new cloudwatch.Alarm(
      this,
      "worker-errors-alarm",
      {
        metric: this.worker.metricErrors({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription:
          "Worker Lambda reported one or more errors in 5 minutes.",
      },
    );

    const jobsDlqVisibleAlarm = new cloudwatch.Alarm(
      this,
      "jobs-dlq-visible-alarm",
      {
        metric: this.jobsDlq.metricApproximateNumberOfMessagesVisible({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription:
          "Worker DLQ has one or more visible messages (failed jobs need review).",
      },
    );

    const jobsQueueOldestMessageAlarm = new cloudwatch.Alarm(
      this,
      "jobs-queue-oldest-message-alarm",
      {
        metric: this.jobsQueue.metricApproximateAgeOfOldestMessage({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 300,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription:
          "Worker queue oldest message is older than 5 minutes (backlog or stuck processing).",
      },
    );

    const workerThrottlesAlarm = new cloudwatch.Alarm(
      this,
      "worker-throttles-alarm",
      {
        metric: this.worker.metricThrottles({
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription:
          "Worker Lambda was throttled one or more times in 5 minutes.",
      },
    );

    const alarmAction = new cloudwatchActions.SnsAction(props.alarmTopic);
    workerErrorsAlarm.addAlarmAction(alarmAction);
    jobsDlqVisibleAlarm.addAlarmAction(alarmAction);
    jobsQueueOldestMessageAlarm.addAlarmAction(alarmAction);
    workerThrottlesAlarm.addAlarmAction(alarmAction);

    props.bucket.grantRead(this.worker);
    props.secret.grantRead(this.worker);
    props.table.grantReadWriteData(this.worker);
    this.jobsQueue.grantConsumeMessages(this.worker);

    props.table.grantReadWriteData(props.role);
    this.jobsQueue.grantSendMessages(props.role);

    secretQueueUrlSync.node.addDependency(this.jobsQueue);
    secretQueueUrlSync.node.addDependency(props.secret);
  }
}
