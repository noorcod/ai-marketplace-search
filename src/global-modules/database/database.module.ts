import { Global, Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MikroOrmConfigService } from './mikro-orm-config.service';
import { EnvService } from '../env/env.service';

@Global()
@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      imports: [],
      useClass: MikroOrmConfigService,
      inject: [EnvService],
      providers: [],
    }),
  ],
  providers: [],
  exports: [],
})
export class DatabaseModule {}
