import { createLogger, format, transports, Logger } from 'winston';
import { DailyRotateFile } from 'winston/lib/winston/transports';

export function createCustomLogger(logFileName: string): Logger {
  const logDir = process.env.LOG_DIR || './event-logs';
  const logLevel = process.env.LOG_LEVEL || 'info';

  return createLogger({
    level: logLevel,
    format: format.combine(format.timestamp(), format.json()),
    transports: [
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.timestamp(),
          format.printf(info => `${info.timestamp} [${info.level}] ${info.message}`),
        ),
      }),
      new DailyRotateFile({
        filename: `${logDir}/${logFileName}-%DATE%.log`,
        datePattern: 'YYYY-MM',
        maxSize: '20m',
        zippedArchive: true,
        maxFiles: '12m',
        //   zippedArchive: true,
        //   maxFiles: '14d',
      }),
    ],
  });
}
