import { Options } from '@mikro-orm/core';
import { MySqlDriver } from '@mikro-orm/mysql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

const config: Options = {
  host: '62.72.29.235',
  port: 3306,
  user: 'root',
  password: '1OtVcJqWHzMgqnX',
  dbName: 'live_090425',
  driver: MySqlDriver,
  // entities: ['./dist/**/*.entity.js'],
  entitiesTs: ['./tmp-entities/*.entity.ts'],
  metadataProvider: TsMorphMetadataProvider,
  debug: true,
  discovery: {
    alwaysAnalyseProperties: false,
  },
};

export default config;
