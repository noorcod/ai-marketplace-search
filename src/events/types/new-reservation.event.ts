export interface NewReservationMessage {
  event: string;
  data: {
    reservationId: number;
  };
}

export class NewReservationEvent {
  constructor(public readonly message: NewReservationMessage) {}
}
