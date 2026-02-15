import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsManager from "aws-cdk-lib/aws-secretsmanager";
import * as s3Vector from "aws-cdk-lib/aws-s3vectors";
import * as s3 from "aws-cdk-lib/aws-s3";
import assert from "node:assert";
import { get } from "@dotenvx/dotenvx";

interface SecretConstructProps {
  bucket: s3.Bucket;
  role: iam.Role;
  accessKey: iam.AccessKey;
  journalVectorBucket: s3Vector.CfnVectorBucket;
  journalVectorIndexName: s3Vector.CfnIndex;
}

export class SecretConstruct extends Construct {
  public readonly secret: secretsManager.Secret;

  constructor(scope: Construct, id: string, props: SecretConstructProps) {
    super(scope, id);

    const journalVectorBucketName =
      props.journalVectorBucket.vectorBucketName ??
      props.journalVectorBucket.ref;

    const journalVectorIndexName =
      props.journalVectorIndexName.indexName ??
      cdk.Fn.select(
        1,
        cdk.Fn.split("/index/", props.journalVectorIndexName.attrIndexArn),
      );

    assert(journalVectorBucketName, "Vector bucket name is required");

    this.secret = new secretsManager.Secret(this, "secret", {
      secretObjectValue: {
        AWS_ACCOUNT: cdk.SecretValue.unsafePlainText(
          cdk.Stack.of(this).account,
        ),
        AWS_REGION: cdk.SecretValue.unsafePlainText(cdk.Stack.of(this).region),
        AWS_ACCESS_KEY_ID: cdk.SecretValue.unsafePlainText(
          props.accessKey.accessKeyId,
        ),
        AWS_SECRET_ACCESS_KEY: props.accessKey.secretAccessKey,
        AWS_ROLE_ARN: cdk.SecretValue.unsafePlainText(props.role.roleArn),
        AWS_BUCKET_NAME: cdk.SecretValue.unsafePlainText(
          props.bucket.bucketName,
        ),

        AWS_JOURNAL_VECTOR_BUCKET_NAME: cdk.SecretValue.unsafePlainText(
          journalVectorBucketName,
        ),
        AWS_JOURNAL_VECTOR_INDEX_NAME: cdk.SecretValue.unsafePlainText(
          journalVectorIndexName,
        ),
        AWS_JOURNAL_VECTOR_DIMENSION: cdk.SecretValue.unsafePlainText(
          get("AWS_JOURNAL_VECTOR_DIMENSION")!,
        ),
      },
    });

    new cdk.CfnOutput(this, "secret-name", {
      value: this.secret.secretName,
    });
  }
}
