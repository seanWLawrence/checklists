#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import { InfraStack } from "../lib/infra.stack";
import { AWS_ACCOUNT, AWS_REGION } from "../lib/env";

const app = new cdk.App();

new InfraStack(app, "infra", {
  env: {
    account: AWS_ACCOUNT,
    region: AWS_REGION,
  },
});
