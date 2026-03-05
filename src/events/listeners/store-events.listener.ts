import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Logger as WinstonLogger } from 'winston';

type StoresFetchedCellNumberPayload = {
  username: string;
  ip: string;
  userInfo: unknown;
};
@Injectable()
export class StoreEventsListener {
  constructor(
    @Inject('StoreContactInfoLogger')
    private readonly logger: WinstonLogger,
  ) {}

  @OnEvent('stores.fetched-cell-number', { async: true })
  fetchCellNumber({ username, ip, userInfo }: StoresFetchedCellNumberPayload) {
    this.logger.info({ username, ip, userInfo });
  }
}
