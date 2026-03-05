import { Module } from '@nestjs/common';
import { SaleEventsController } from './sale-events.controller';
import { SaleEventsService } from './sale-events.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Sale } from '@modules/sale-events/entities/sale.entity';
import { SaleBanner } from '@modules/sale-events/entities/sale-banner.entity';
import { ListingsModule } from '@modules/listings/listings.module';

@Module({
  imports: [MikroOrmModule.forFeature([Sale, SaleBanner]), ListingsModule],
  controllers: [SaleEventsController],
  providers: [SaleEventsService],
})
export class SaleEventsModule {}
