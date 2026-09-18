import { join } from "node:path";
import pino, { type Logger, type TransportTargetOptions } from "pino";
import { env } from "../config/envs.ts";

const { NODE_ENV, LOG_LEVEL: level } = env;

const LOG_FILE_PATH = join(import.meta.dirname, "../../logs/app.log");

const targets: TransportTargetOptions[] = [];

if (NODE_ENV === "dev") {
  targets.push(
    {
      level,
      options: { colorize: true, destination: 1 },
      target: "pino-pretty",
    },
    {
      level,
      options: { append: true, destination: LOG_FILE_PATH, mkdir: true },
      target: "pino/file",
    }
  );
}

export const logger: Logger =
  targets.length === 0
    ? pino({ level: "silent" })
    : pino({}, pino.transport({ targets }));

process.on("exit", () => logger.flush());
