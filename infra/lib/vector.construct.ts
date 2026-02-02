import { Construct } from "constructs";
import * as s3Vector from "aws-cdk-lib/aws-s3vectors";
import * as iam from "aws-cdk-lib/aws-iam";
import assert from "node:assert/strict";
import { get } from "@dotenvx/dotenvx";

interface VectorConstructProps {
  readonly role: iam.Role;
}

export class VectorConstruct extends Construct {
  public readonly vectorBucket: s3Vector.CfnVectorBucket;
  public readonly index: s3Vector.CfnIndex;

  constructor(scope: Construct, id: string, props: VectorConstructProps) {
    super(scope, id);

    this.vectorBucket = new s3Vector.CfnVectorBucket(this, "bucket", {});

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
    });

    const policyDocument = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: ["s3vectors:QueryVectors", "s3vectors:GetVectors"],
          resources: [this.vectorBucket.attrVectorBucketArn],
        }),
      ],
    });

    new iam.Policy(this, "policy", {
      document: policyDocument,
      roles: [props.role],
    });
  }
}
