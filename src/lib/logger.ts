import logger, { LogLevelDesc } from "loglevel";
import prefixer from "loglevel-plugin-prefix";
import { LOG_LEVEL } from "@/lib/env.server";

const DEFAULT_LOG_LEVEL = "info";

logger.setLevel(
  (LOG_LEVEL as LogLevelDesc) ?? DEFAULT_LOG_LEVEL,
);

prefixer.reg(logger);
prefixer.apply(logger);

export { logger };
