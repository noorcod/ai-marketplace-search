import { Injectable, Logger } from '@nestjs/common';
import { MikroOrmModuleOptions, MikroOrmOptionsFactory } from '@mikro-orm/nestjs';
import { EnvService } from '../env/env.service';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { MySqlDriver } from '@mikro-orm/mysql';
import { BaseRepository } from '../../common/database/base.repository';

@Injectable()
export class MikroOrmConfigService implements MikroOrmOptionsFactory {
  private readonly logger = new Logger(MikroOrmConfigService.name);

  constructor(private readonly envService: EnvService) {}

  createMikroOrmOptions(): MikroOrmModuleOptions {
    return {
      host: this.envService.databaseHost,
      port: this.envService.databasePort,
      user: this.envService.databaseUser,
      password: this.envService.databasePassword,
      dbName: this.envService.databaseName,
      entities: ['dist/**/*.entity.js'],
      entitiesTs: ['src/**/*.entity.ts'],
      debug: this.envService.nodeEnv === 'development',
      metadataProvider: TsMorphMetadataProvider,
      extensions: [EntityGenerator],
      driver: MySqlDriver,
      logger: this.logger.log.bind(this.logger),
      entityRepository: BaseRepository,
    };
  }
}
