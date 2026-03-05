import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { BecomeSellerRepository } from './become-seller.repository';
import { BecomeSellerDto } from './dto/become-seller.dto';
import { AppResponse } from 'src/common/responses/app-response';
import { dateTime } from 'src/common/utilities/date-time';

@Injectable()
export class BecomeSellerService {
  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
    private readonly repo: BecomeSellerRepository,
  ) {}

  async addSellerRegistrationRequests(body: BecomeSellerDto) {
    body.createdAt = dateTime();
    const sellerRequestsResult = await this.repo.createEntity(body);
    if (!sellerRequestsResult) {
      return AppResponse.Err('Failed to add seller request') as AppResponse<Partial<BecomeSellerDto>>;
    }
    return AppResponse.fromDataLayer(sellerRequestsResult) as AppResponse<Partial<BecomeSellerDto>>;
  }
}
