import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

export const loggerTransportConfig = (env: string) => {
  const isDev = env === 'development' || env === 'staging';
  return isDev
    ? [
        new winston.transports.Console({
          level: 'info', // More verbose for development
          format: winston.format.combine(
            winston.format.timestamp({
              format: new Date().toLocaleDateString('en-US', {
                timeZone: 'Asia/Karachi',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              }),
            }),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('api-marketplace', {
              prettyPrint: true,
              appName: true,
              colors: true,
              processId: true,
            }),
          ),
        }),
      ]
    : [
        new DailyRotateFile({
          filename: 'logs/errors-%DATE%.log',
          dirname: './logs',
          level: 'error',
          zippedArchive: true, // Enable compression
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('api-marketplace', {
              prettyPrint: true,
              appName: true,
              processId: true,
            }),
          ),
        }),
        new DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          dirname: './logs',
          zippedArchive: true, // Enable compression
          maxSize: '20m', // Specify max size for rotation
          maxFiles: '14d',
          level: 'info',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('api-marketplace', {
              prettyPrint: true,
              appName: true,
              processId: true,
            }),
          ),
        }),
      ];
};
