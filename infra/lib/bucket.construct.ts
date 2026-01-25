import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsManager from "aws-cdk-lib/aws-secretsmanager";
import { Stack } from "aws-cdk-lib/core";

export class BucketConstruct extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly role: iam.Role;
  public readonly user: iam.User;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.user = new iam.User(this, "user", {});
    this.role = new iam.Role(this, "role", { assumedBy: this.user });

    this.bucket = new s3.Bucket(this, "bucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    this.bucket.grantDelete(this.role);
    this.bucket.grantPut(this.role);
    this.bucket.grantRead(this.role);

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
