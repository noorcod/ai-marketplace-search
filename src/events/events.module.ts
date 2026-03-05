import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { StoreEventsListener } from './listeners/store-events.listener';
import { StoreContactInfoLogger } from './providers/store-contact-info.provider';
import { PublishNotificationsListener } from './listeners/publish-notifications.listener';
import { OrderCreatedListener } from './listeners/order-created.listener';
import { CheckoutCompletedListener } from './listeners/checkout-completed.listener';
import { EventsService } from './events.service';

@Module({
  imports: [EventEmitterModule.forRoot()],
  providers: [
    StoreEventsListener,
    StoreContactInfoLogger,
    PublishNotificationsListener,
    OrderCreatedListener,
    EventsService,
    CheckoutCompletedListener,
  ],
})
export class EventsModule {}
