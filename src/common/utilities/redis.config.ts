import { EnvService } from '../../global-modules/env/env.service';
import { RedisModuleOptions } from '@liaoliaots/nestjs-redis';

export const createRedisOptions = (env: EnvService): RedisModuleOptions => ({
  readyLog: true,
  errorLog: true,
  config: {
    host: env.redisHost,
    port: env.redisPort,
    username: env.redisUser,
    password: env.redisPassword,
    db: env.redisDatabase,
    retryStrategy: times => {
      const baseDelay = 1000;
      const maxDelay = 10000;
      const delay = Math.min(baseDelay * Math.pow(2, times), maxDelay);
      return times > 5 ? null : delay + Math.random() * 500;
    },
    reconnectOnError: err => {
      const nonRetriable = ['NOAUTH', 'NOPERM'];
      return !nonRetriable.some(code => err.message.includes(code));
    },
    commandTimeout: 2000,
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false, // Disable queuing when disconnected
  },
});
