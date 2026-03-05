import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { MarketplaceBanner } from './entities/marketplace-banner.entity';
import { BannersController } from './banners.controller';
import { BannersService } from './banners.service';

@Module({
  imports: [MikroOrmModule.forFeature([MarketplaceBanner])],
  controllers: [BannersController],
  providers: [BannersService],
})
export class BannersModule {}
