import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { Injectable } from '@nestjs/common';
import { UserEventsRepository } from './repositories/user-events.repository';
import { AppResponse } from 'src/common/responses/app-response';
import { CreateUserEventDto } from './dtos/create-user-event.dto';
import { QueryWhere } from 'src/common/interfaces/repository.interface';
import { UserEvents } from './entities/user-events.entity';
import { MarketplaceUser } from './entities/marketplace-user.entity';

@Injectable()
export class UserEventsService {
  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
    private readonly userEventsRepository: UserEventsRepository,
  ) {}

  async addUserEvent(userEvent: CreateUserEventDto) {
    // there are three possibilities for the user
    //  1. user is logged in and we have userId
    //  2. user is not logged in and we have ip
    //  3. user is logged in and we have both userId and ip
    // Let's prepare the where clause based on the above possibilities
    let whereCondition: QueryWhere<UserEvents> = {};
    if (userEvent.userId) {
      whereCondition = {
        userId: userEvent.userId,
        eventName: userEvent.eventName,
      };
    } else {
      whereCondition = {
        eventName: userEvent.eventName,
        ip: userEvent.ip,
      };
    }
    if (userEvent.listingId) {
      whereCondition['listingId'] = userEvent.listingId;
    } else if (userEvent.modelId) {
      whereCondition['modelId'] = userEvent.modelId;
    } else if (userEvent.shopId) {
      whereCondition['shopId'] = userEvent.shopId;
    }
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const startOfDay = new Date(today);
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    whereCondition.createdAt = {
      $gte: startOfDay,
      $lt: endOfDay,
    };
    const eventsByCondition = await this.userEventsRepository.exists(whereCondition);
    if (eventsByCondition.data) {
      return AppResponse.Generic(202, true, 'Event already exists', eventsByCondition.data) as AppResponse<
        Partial<CreateUserEventDto>
      >;
    } else {
      const result = await this.userEventsRepository.createEntity(userEvent);
      if (!result) {
        return AppResponse.Err('Failed to add user event') as AppResponse<Partial<CreateUserEventDto>>;
      }
      return AppResponse.fromDataLayer(result) as AppResponse<Partial<CreateUserEventDto>>;
    }
  }
}
