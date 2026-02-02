import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import { BucketConstruct } from "./bucket.construct";
import { SecretConstruct } from "./secret.construct";
import { IamConstruct } from "./iam.construct";
import { VectorConstruct } from "./vector.construct";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const { role, accessKey } = new IamConstruct(this, "iam");

    const { bucket } = new BucketConstruct(this, "assets-bucket", { role });

    const journalVector = new VectorConstruct(this, "journal-vector", { role });

    new SecretConstruct(this, "secret", {
      bucket,
      role,
      accessKey,
      journalVectorBucket: journalVector.vectorBucket,
      journalVectorIndexName: journalVector.index,
    });
  }
}
