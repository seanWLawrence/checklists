#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import { InfraStack } from "../lib/infra.stack";

import { get } from "@dotenvx/dotenvx";
import assert from "node:assert";

const account = get("AWS_ACCOUNT");
const region = get("AWS_REGION");
const nodeEnv = get("NODE_ENV");
const isProduction = nodeEnv === "production";
const stackId = isProduction ? "infra-prod" : "infra-dev";

assert(account, "Missing AWS_ACCOUNT in CDK");
assert(region, "Missing AWS_REGION in CDK");

const app = new cdk.App();

new InfraStack(app, stackId, {
  env: {
    account,
    region,
  },
});
