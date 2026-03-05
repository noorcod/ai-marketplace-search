import { Entity, OneToOne, type Opt, PrimaryKey, Property, Ref } from '@mikro-orm/core';
import { Listing } from './listing.entity';

@Entity()
export class ListingSpecification {
  @PrimaryKey({ unsigned: false })
  id!: number;

  @OneToOne(() => Listing, listing => listing.listingSpecification, {
    fieldName: 'listing_id',
    owner: true,
  })
  listing!: Ref<Listing>;

  @Property({ length: 300 })
  title!: string;

  @Property({ length: 250 })
  model!: string;

  @Property({ length: 60 })
  brand!: string;

  @Property({ type: 'string', length: 60, nullable: true })
  laptopType?: string = 'ns';

  @Property({ type: 'string', length: 30, nullable: true })
  ramType?: string = 'ns';

  @Property({ type: 'string', length: 8, nullable: true })
  ramCapacity?: string = '-1';

  @Property({ type: 'string', length: 30, nullable: true })
  primaryStorageType?: string = 'ns';

  @Property({ type: 'string', length: 8, nullable: true })
  primaryStorageCapacity?: string = '-1';

  @Property({ type: 'string', length: 30, nullable: true })
  secondaryStorageType?: string = 'ns';

  @Property({ type: 'string', length: 8, nullable: true })
  secondaryStorageCapacity?: string = '-1';

  @Property({ type: 'string', length: 60, nullable: true })
  processor?: string = 'ns';

  @Property({ type: 'string', length: 60, nullable: true })
  generation?: string = 'ns';

  @Property({ type: 'string', length: 60, nullable: true })
  graphicsCardName?: string = 'ns';

  @Property({ type: 'string', length: 15, nullable: true })
  graphicsCardType?: string = 'ns';

  @Property({ type: 'string', length: 8, nullable: true })
  graphicsCardMemory?: string = '-1';

  @Property({ type: 'string', length: 8, nullable: true })
  screenSize?: string = '-1';

  @Property({ type: 'string', length: 60, nullable: true })
  screenType?: string = 'ns';

  @Property({ type: 'string', length: 60, nullable: true })
  screenProtection?: string = 'ns';

  @Property({ type: 'string', length: 60, nullable: true })
  resolution?: string = 'ns';

  @Property({ type: 'string', length: 60, nullable: true })
  keyboard?: string = 'ns';

  @Property({ type: 'string', length: 60, nullable: true })
  speaker?: string = 'ns';

  @Property({ type: 'string', length: 60, nullable: true })
  batteryType?: string = 'ns';

  @Property({ type: 'string', length: 8, nullable: true })
  batteryCapacity?: string = '-1';

  @Property({ type: 'boolean', nullable: true })
  isTouchScreen?: boolean = false;

  @Property({ type: 'boolean', nullable: true })
  isBacklitKeyboard?: boolean = false;

  @Property({ type: 'string', length: 60, nullable: true })
  fingerprint?: string = 'ns';

  @Property({ type: 'boolean', nullable: true })
  isPtaApproved?: boolean = false;

  @Property({ type: 'string', length: 60, nullable: true })
  cameraSpecs?: string = 'ns';

  @Property({ fieldName: 'is_e_sim', type: 'boolean', nullable: true })
  isESim?: boolean = false;

  @Property({ type: 'string', length: 10, nullable: true })
  networkBand?: string = 'ns';

  @Property({ type: 'string', length: 8, nullable: true })
  refreshRate?: string = '-1';

  @Property({ type: 'string', length: 60, nullable: true })
  simType?: string = 'ns';

  @Property({ type: 'string', length: 60, nullable: true })
  bodyType?: string = 'ns';

  @Property({ type: 'boolean', nullable: true })
  isSimSupport?: boolean = false;

  @Property({ type: 'string', length: 60, nullable: true })
  displayType?: string = 'ns';

  @Property({ type: 'string', length: 60, nullable: true })
  operatingSystem?: string = 'ns';

  @Property({ type: 'boolean', nullable: true })
  isSmartTv?: boolean = false;

  @Property({ type: 'boolean', nullable: true })
  isWebcam?: boolean = false;

  @Property({ type: 'boolean', nullable: true })
  isTvCertified?: boolean = false;

  @Property({ type: 'string', length: 60, nullable: true })
  desktopType?: string = 'ns';

  @Property({ type: 'string', length: 60, nullable: true })
  accessoryType?: string = 'ns';

  @Property({ type: 'string', length: 30, nullable: true })
  tvMonitorType?: string = 'ns';

  @Property({ type: 'datetime', defaultRaw: `CURRENT_TIMESTAMP` })
  createdAt!: Date & Opt;

  @Property({ nullable: true })
  updatedAt?: Date;

  @Property({ type: 'boolean' })
  isDeleted: boolean & Opt = false;

  @Property({ nullable: true })
  deletedAt?: Date;
}
