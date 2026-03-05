import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { LegacyOrdersService } from './legacy-orders.service';
import { LegacyOrdersController } from './legacy-orders.controller';
import { LegacyOrder } from './entities/legacy-order.entity';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { LegacyVoucher } from './entities/legacy-voucher.entity';
import { SMSService } from '@common/services/sms/sms.service';
import { LegacyDeliveryCharges } from './entities/legacy-delivery-charges.entity';

@Module({
  imports: [MikroOrmModule.forFeature([LegacyOrder, LegacyVoucher, LegacyDeliveryCharges]), AuthModule],
  controllers: [LegacyOrdersController],
  providers: [LegacyOrdersService, SMSService],
})
export class LegacyOrdersModule {}
