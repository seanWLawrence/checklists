import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsManager from "aws-cdk-lib/aws-secretsmanager";
import assert from "node:assert";

export class BucketConstruct extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly role: iam.Role;
  public readonly user: iam.User;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    assert(
      productionHost,
      "VERCEL_PROJECT_PRODUCTION_URL env var is required for S3 CORS.",
    );

    const appOrigin = `https://${productionHost}`;

    this.user = new iam.User(this, "user", {});
    this.role = new iam.Role(this, "role", { assumedBy: this.user });
    this.role.grantAssumeRole(this.user);

    this.bucket = new s3.Bucket(this, "bucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
    this.bucket.addCorsRule({
      allowedMethods: [
        s3.HttpMethods.GET,
        s3.HttpMethods.PUT,
        s3.HttpMethods.POST,
        s3.HttpMethods.DELETE,
        s3.HttpMethods.HEAD,
      ],
      allowedOrigins: [appOrigin],
      allowedHeaders: ["*"],
      exposedHeaders: ["ETag"],
      maxAge: 3600,
    });

    this.bucket.grantReadWrite(this.role);

    const accessKey = new iam.AccessKey(this, "access-key", {
      user: this.user,
    });

    const secret = new secretsManager.Secret(this, "access-key-secret", {
      secretObjectValue: {
        AWS_ACCESS_KEY_ID: cdk.SecretValue.unsafePlainText(
          accessKey.accessKeyId,
        ),
        AWS_SECRET_ACCESS_KEY: accessKey.secretAccessKey,
        AWS_ROLE_ARN: cdk.SecretValue.unsafePlainText(this.role.roleArn),
        AWS_BUCKET_NAME: cdk.SecretValue.unsafePlainText(
          this.bucket.bucketName,
        ),
      },
    });

    new cdk.CfnOutput(this, "access-key-secret-output", {
      value: secret.secretName,
    });
  }
}
