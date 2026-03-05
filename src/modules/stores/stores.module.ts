import { Module } from '@nestjs/common';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Shop } from './entities/shop.entity';
import { ShopOption } from './entities/shop-option.entity';
import { Location } from './entities/location.entity';
import { ListingReview } from '@modules/listings/entities/listing-review.entity';

@Module({
  imports: [MikroOrmModule.forFeature([Shop, ShopOption, Location, ListingReview])],
  controllers: [StoresController],
  providers: [StoresService],
})
export class StoresModule {}
