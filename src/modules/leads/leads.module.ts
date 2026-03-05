import { Module } from '@nestjs/common';
import { BecomeSellerController } from './become-seller.controller';
import { BecomeSellerService } from './become-seller.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SellerRegistrationRequests } from './entities/seller-registration-requests.entity';

@Module({
  imports: [MikroOrmModule.forFeature([SellerRegistrationRequests])],
  controllers: [BecomeSellerController],
  providers: [BecomeSellerService],
})
export class LeadsModule {}
