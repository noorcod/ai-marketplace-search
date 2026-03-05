import { Module } from '@nestjs/common';
import { ModelsController } from './models.controller';
import { ModelsService } from './models.service';
import { ModelsFilterService } from './models-filter.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Model } from './entities/Model.entity';
import { ListingsModule } from '@modules/listings/listings.module';

@Module({
  imports: [MikroOrmModule.forFeature([Model]), ListingsModule],
  controllers: [ModelsController],
  providers: [ModelsService, ModelsFilterService],
})
export class ModelsModule {}
