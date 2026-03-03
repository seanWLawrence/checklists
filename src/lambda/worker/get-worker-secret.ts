import { EitherAsync } from "purify-ts/EitherAsync";
import { WorkerSecret } from "./job.types";
import { getSecret } from "@/lib/aws/secrets-manager/get-secret";
import { workerEnv } from "./env";
import { workerSecretsManagerClient } from "./aws-clients";

export const getWorkerSecret = (): EitherAsync<unknown, WorkerSecret> => {
  return getSecret({
    secretName: workerEnv.AWS_APP_SECRET_NAME,
    decoder: WorkerSecret,
    client: workerSecretsManagerClient,
  });
};
