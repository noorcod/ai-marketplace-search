import { Entity, EntityRepositoryType, type Opt, PrimaryKey, Property } from '@mikro-orm/core';
import { IsEmail, IsOptional, IsPhoneNumber, IsString, Length } from 'class-validator';
import { BecomeSellerRepository } from '../become-seller.repository';

@Entity({ repository: () => BecomeSellerRepository })
export class SellerRegistrationRequests {
  [EntityRepositoryType]?: BecomeSellerRepository;
  @PrimaryKey({ unsigned: false, unique: 'id', autoincrement: true })
  id!: number;

  @Property({ type: 'string', length: 100, nullable: false })
  @IsEmail()
  @Length(5, 100)
  email!: string;

  @Property({ type: 'string', length: 100 })
  @IsString()
  @Length(2, 100)
  firstName!: string;

  @Property({ type: 'string', length: 100 })
  @IsString()
  @Length(1, 100)
  lastName!: string;

  @Property({ type: 'string', length: 18 })
  @IsPhoneNumber('PK')
  @Length(15, 15) // eg. +92-300-1234567
  phoneNumber!: string;

  @Property({ type: 'string', length: 150, nullable: true })
  @IsString()
  @IsOptional()
  shopName?: string;

  @Property({ type: 'string', length: 50 })
  @IsString()
  city!: string;

  @Property({ type: 'string', length: 500, nullable: false })
  @IsString()
  address!: string;

  @Property({ type: 'string', length: 100, nullable: true, default: 'UnAssigned' })
  @IsString()
  @IsOptional()
  status?: string & Opt = 'UnAssigned';

  @Property({ type: 'int', nullable: true, index: 'request_handled_by' })
  @IsString()
  @IsOptional()
  requestHandledBy?: number;

  @Property({ type: 'text', length: 500, nullable: true })
  @IsString()
  @IsOptional()
  inquiry?: string;

  @Property({ type: 'datetime', nullable: false, default: 'current_timestamp()' })
  createdAt!: Date;

  @Property({ type: 'datetime', nullable: true })
  @IsOptional()
  updatedAt?: Date;

  @Property({ type: 'datetime', nullable: true })
  @IsOptional()
  deletedAt?: Date;
}
