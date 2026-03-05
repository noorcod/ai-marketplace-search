import { Module } from '@nestjs/common';
import { LookupsController } from './lookups.controller';
import { CategoriesService } from './categories.service';
import { ConditionsService } from './conditions.service';
import { AreasService } from './areas.service';
import { BrandsService } from './brands.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { City } from './entities/city.entity';
import { Condition } from './entities/condition.entity';
import { Categories } from './entities/categories.entity';
import { Brand } from './entities/brand.entity';
import { Province } from './entities/province.entity';

@Module({
  imports: [MikroOrmModule.forFeature([City, Condition, Categories, Brand, Province])],
  controllers: [LookupsController],
  providers: [CategoriesService, ConditionsService, AreasService, BrandsService],
})
export class LookupsModule {}
