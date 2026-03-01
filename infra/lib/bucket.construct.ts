import { Construct } from "constructs";
import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import { BASE_URL } from "./env";

interface BucketConstructProps {
  readonly role: iam.Role;
}

export class BucketConstruct extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: BucketConstructProps) {
    super(scope, id);

    const normalizedHost = BASE_URL.replace(/^https?:\/\//, "").replace(
      /\/+$/,
      "",
    );

    const appOrigin = normalizedHost.startsWith("localhost")
      ? `http://${BASE_URL}`
      : `https://${normalizedHost}`;

    this.bucket = new s3.Bucket(this, "bucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
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

    this.bucket.grantReadWrite(props.role);

    new cdk.CfnOutput(this, "bucket-name", {
      value: this.bucket.bucketName,
    });
  }
}
