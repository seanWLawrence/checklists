#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import { resolve } from "node:path";
import { InfraStack } from "../lib/infra.stack";

import { config } from "@dotenvx/dotenvx";
import assert from "node:assert";

config({
  path: resolve(__dirname, "../../.env.local"),
});

assert(process.env.AWS_ACCOUNT, "Missing AWS_ACCOUNT in CDK");
assert(process.env.AWS_REGION, "Missing AWS_REGION in CDK");

const app = new cdk.App();

new InfraStack(app, "infra", {
  env: {
    account: process.env.AWS_ACCOUNT,
    region: process.env.AWS_REGION,
  },
});
