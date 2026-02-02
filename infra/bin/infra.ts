#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import { InfraStack } from "../lib/infra.stack";

import { get } from "@dotenvx/dotenvx";
import assert from "node:assert";

assert(get("AWS_ACCOUNT"), "Missing AWS_ACCOUNT in CDK");
assert(get("AWS_REGION"), "Missing AWS_REGION in CDK");

const app = new cdk.App();

new InfraStack(app, "infra", {
  env: {
    account: process.env.AWS_ACCOUNT,
    region: process.env.AWS_REGION,
  },
});
