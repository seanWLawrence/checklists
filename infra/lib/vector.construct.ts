import { Construct } from "constructs";
import * as s3Vector from "aws-cdk-lib/aws-s3vectors";
import * as iam from "aws-cdk-lib/aws-iam";
import assert from "node:assert/strict";
import { get } from "@dotenvx/dotenvx";
import * as cdk from "aws-cdk-lib";

interface VectorConstructProps {
  readonly role: iam.Role;
}

export class VectorConstruct extends Construct {
  public readonly vectorBucket: s3Vector.CfnVectorBucket;
  public readonly index: s3Vector.CfnIndex;

  constructor(scope: Construct, id: string, props: VectorConstructProps) {
    super(scope, id);

    const stack = cdk.Stack.of(this);
    const stackSlug = stack.stackName
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const vectorBucketName =
      `${stackSlug}-${stack.account}-${stack.region}-journal-vectors`
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 63);

    const indexName = `${stackSlug}-journal-index`
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 63);

    this.vectorBucket = new s3Vector.CfnVectorBucket(this, "bucket", {
      vectorBucketName,
    });

    const dimensionRaw = get("AWS_JOURNAL_VECTOR_DIMENSION");
    assert(dimensionRaw, "AWS_JOURNAL_VECTOR_DIMENSION must be set");

    const dimension = Number(dimensionRaw);
    assert(
      Number.isFinite(dimension),
      "AWS_JOURNAL_VECTOR_DIMENSION must be a number",
    );

    this.index = new s3Vector.CfnIndex(this, "cosine-index", {
      dataType: "float32",
      dimension,
      distanceMetric: "cosine",
      vectorBucketArn: this.vectorBucket.attrVectorBucketArn,
      indexName,
    });

    const policyDocument = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: [
            "s3vectors:QueryVectors",
            "s3vectors:GetVectors",
            "s3vectors:PutVectors",
          ],
          resources: [
            this.vectorBucket.attrVectorBucketArn,
            this.index.attrIndexArn,
          ],
        }),
      ],
    });

    new iam.Policy(this, "policy", {
      document: policyDocument,
      roles: [props.role],
    });
  }
}
