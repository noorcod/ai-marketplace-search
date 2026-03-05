import { MikroORM } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/mysql';
import { Injectable } from '@nestjs/common';
import { dateTime } from 'src/common/utilities/date-time';
import { AppResponse } from 'src/common/responses/app-response';
import { QueryOptions } from 'src/common/interfaces/repository.interface';
import { ReservationsRepository } from './repositories/reservations.repository';
import { CreateReservationDto } from './dtos/create-reservation.dto';
import { Reservations } from './entities/reservations.entity';
import { COLUMNS_FOR_RESERVATIONS } from '@common/constants/column-selections.constants';
import { RESERVATIONS_POPULATE } from '@common/constants/populate-tables.constants';
import { nestedObjectToDotFields } from '@common/utilities/nested-object-to-dot-fields';
import { PaginationOptions } from '@common/utilities/pagination-options';
import { today } from './utilities/today-date';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NewReservationEvent } from 'src/events/types/new-reservation.event';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly orm: MikroORM,
    private readonly em: EntityManager,
    private readonly repo: ReservationsRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}
  async addReservations(reservationsBody: CreateReservationDto) {
    reservationsBody.createdAt = dateTime();
    const whereCondition = {
      listing: reservationsBody.listing,
      location: reservationsBody.location,
      shop: reservationsBody.shop,
      customer: reservationsBody.customer,
      createdAt: today(),
    };
    const recordIsExist = await this.repo.fetchOne(whereCondition);
    if (recordIsExist.success) {
      return AppResponse.Err('You have already reserved this product today!') as AppResponse<Partial<Reservations>>;
    } else {
      const reservations = await this.repo.createEntity(reservationsBody);
      if (!reservations.success) {
        return AppResponse.Err(reservations.message) as AppResponse<Partial<Reservations>>;
      }

      const eventPayload = new NewReservationEvent({
        event: 'newReservation',
        data: {
          reservationId: (reservations.data as Reservations).id,
        },
      });
      // Emit an event for publish reservation notification
      this.eventEmitter.emit('publish-notifications.reservation', eventPayload);
      return AppResponse.OkWithMessage('reserved successfully!', reservations.data) as AppResponse<
        Partial<Reservations>
      >;
    }
  }

  async fetchReservedProducts(userId: string, pagination: PaginationOptions, status: string) {
    const reservationsColumns = nestedObjectToDotFields(COLUMNS_FOR_RESERVATIONS);
    const reservationsPopulatedTables = nestedObjectToDotFields(RESERVATIONS_POPULATE);
    const where = {
      customer: userId,
      deletedAt: null,
      ...(status && status.length > 0 && { status: status }),
      createdAt: today(),
    };

    const options: QueryOptions<Reservations> = {
      populate: reservationsPopulatedTables,
      fields: reservationsColumns,
      limit: pagination.limit(),
      offset: pagination.offset(),
      orderBy: { createdAt: 'DESC' },
    };
    const data = await this.repo.fetch(where, options);
    if (!data.success) {
      return AppResponse.Err(data.message) as AppResponse<Partial<Reservations>[]>;
    }
    return AppResponse.fromDataLayer(data) as AppResponse<Partial<Reservations>[]>;
  }

  async pendingReservationsCount(userId: string) {
    const whereFilter = {
      customer: userId,
      deletedAt: null,
      status: 'Pending',
      createdAt: today(),
    };
    const pendingCount = await this.repo.countEntities(whereFilter);
    if (!pendingCount.success) {
      return AppResponse.Err(pendingCount.message) as AppResponse<Partial<Reservations>>;
    }
    return AppResponse.fromDataLayer(pendingCount) as AppResponse<Partial<Reservations>>;
  }
}
