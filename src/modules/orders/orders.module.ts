import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderSource } from './entities/order-source.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderPayment } from './entities/order-payment.entity';
import { OrderTracking } from './entities/order-tracking.entity';
import { OrderDeliveryAddress } from './entities/order-delivery-address.entity';
import { DeliveryCharges } from './entities/delivery-charges.entity';
import { ShippingService } from './shipping.service';
import { CartModule } from '@modules/carts/cart.module';
import { AuthModule } from '@modules/auth/auth.module';
import { ListingsModule } from '@modules/listings/listings.module';
import { VouchersService } from './vouchers.service';
import { Voucher } from './entities/voucher.entity';
import { VoucherCondition } from './entities/voucher-condition.entity';
import { VoucherUsageLog } from './entities/voucher-usage-log.entity';
import { UserAddress } from '@modules/users/entities/user-address.entity';
import { UserAddressRepository } from '@modules/users/repositories/user-address.repository';
import { SMSService } from '@common/services/sms/sms.service';
import { ApgService } from './apg.service';
import { VouchersController } from './vouchers.controller';
import { ShippingController } from './shipping.controller';
import { PaymentsController } from './payments.controller';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './services/checkout.service';
import { OrderValidationService } from './services/order-validation.service';
import { OrderCreationService } from './services/order-creation.service';
import { OrderNotificationService } from './services/order-notification.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([
      Order,
      OrderSource,
      OrderItem,
      OrderPayment,
      OrderTracking,
      OrderDeliveryAddress,
      DeliveryCharges,
      Voucher,
      VoucherCondition,
      VoucherUsageLog,
      UserAddress,
    ]),
    CartModule,
    AuthModule,
    ListingsModule,
  ],
  controllers: [OrdersController, ShippingController, VouchersController, CheckoutController, PaymentsController],
  providers: [
    OrdersService,
    ShippingService,
    VouchersService,
    CheckoutService,
    OrderValidationService,
    OrderCreationService,
    OrderNotificationService,
    UserAddressRepository,
    SMSService,
    ApgService,
  ],
})
export class OrdersModule {}
