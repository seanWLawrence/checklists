import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import { BucketConstruct } from "./bucket.construct";

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new BucketConstruct(this, "assets-bucket");
  }
}
