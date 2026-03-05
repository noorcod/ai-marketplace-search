import { RedisService } from '@liaoliaots/nestjs-redis';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import Redis from 'ioredis';
import { NewReservationEvent } from '../types/new-reservation.event';

@Injectable()
export class PublishNotificationsListener {
  private readonly logger = new Logger(PublishNotificationsListener.name);

  private readonly pubsubClient: Redis | null;
  constructor(private readonly redisService: RedisService) {
    this.pubsubClient = this.redisService.getOrNil();
  }

  @OnEvent('publish-notifications.reservation', { async: true })
  async reservation(payload: NewReservationEvent) {
    try {
      if (!this.pubsubClient) {
        this.logger.warn('Redis client is not available; skipping publish for reservation event');
        return;
      }

      await this.pubsubClient.publish('newReservation', JSON.stringify(payload.message));
    } catch (error) {
      this.logger.error('Error while publishing the reservation event', error as any);
    }
  }
}
