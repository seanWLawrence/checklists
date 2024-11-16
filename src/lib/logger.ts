import logger, { LogLevelDesc } from "loglevel";
import prefixer from "loglevel-plugin-prefix";

const DEFAULT_LOG_LEVEL = "info";

logger.setLevel(
  (process.env.LOG_LEVEL?.toLocaleLowerCase() as LogLevelDesc) ??
    DEFAULT_LOG_LEVEL,
);

prefixer.reg(logger);
prefixer.apply(logger);

export { logger };
