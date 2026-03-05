import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { MarketplaceUser } from './entities/marketplace-user.entity';
import { UserWishlist } from './entities/user-wishlist.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserEvents } from './entities/user-events.entity';
import { UserWishlistService } from './user-wishlist.service';
import { UserEventsService } from './user-events.service';
import { Reservations } from './entities/reservations.entity';
import { ReservationsService } from './reservations.service';
import { AddressTag } from './entities/address-tag.entity';
import { UserAddress } from './entities/user-address.entity';
import { AddressesService } from './addresses.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([MarketplaceUser, UserWishlist, UserEvents, Reservations, UserAddress, AddressTag]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UserWishlistService, UserEventsService, ReservationsService, AddressesService],
  exports: [UsersService],
})
export class UsersModule {}
