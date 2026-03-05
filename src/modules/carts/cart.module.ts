import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { AuthModule } from '@modules/auth/auth.module';
import { ListingsModule } from '@modules/listings/listings.module';

@Module({
  imports: [MikroOrmModule.forFeature([Cart, CartItem]), AuthModule, ListingsModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
