import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import assert from "node:assert";
import { get } from "@dotenvx/dotenvx";

interface BucketConstructProps {
  readonly role: iam.Role;
}

export class BucketConstruct extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: BucketConstructProps) {
    super(scope, id);

    const productionHost = get("VERCEL_PROJECT_PRODUCTION_URL");
    assert(
      productionHost,
      "VERCEL_PROJECT_PRODUCTION_URL env var is required for S3 CORS.",
    );

    const normalizedHost = productionHost
      .replace(/^https?:\/\//, "")
      .replace(/\/+$/, "");

    const appOrigin = `https://${normalizedHost}`;

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

    this.bucket.grantReadWrite(props.role);
  }
}
