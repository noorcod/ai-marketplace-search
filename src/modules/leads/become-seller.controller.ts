import { Body, Controller, Post } from '@nestjs/common';
import { BecomeSellerService } from './become-seller.service';
import { BecomeSellerDto } from './dto/become-seller.dto';

@Controller('become-seller')
export class BecomeSellerController {
  constructor(private readonly becomeSellerService: BecomeSellerService) {}

  @Post()
  async addBecomeSellerLead(@Body() body: BecomeSellerDto) {
    return this.becomeSellerService.addSellerRegistrationRequests(body);
  }
}
