import { ListingsQueryDto } from '@modules/listings/dtos/listings-query.dto';
import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export enum RequestSource {
  WEB = 'web',
  MOBILE = 'mobile',
}

export class ListingsFiltersDto extends OmitType(ListingsQueryDto, ['page', 'size']) {
  @ApiProperty({
    description: 'Source of the request',
    enum: RequestSource,
    required: false,
    default: RequestSource.MOBILE,
    example: RequestSource.WEB,
  })
  @IsOptional()
  @IsEnum(RequestSource)
  source: RequestSource = RequestSource.MOBILE;

  @ApiProperty({
    description: 'Maximum number of values to return per filter. Default: 10 for web, 5 for mobile',
    required: false,
    example: 10,
    minimum: 5,
    maximum: 20,
  })
  @IsOptional()
  @IsNumber()
  @Max(20)
  @Min(5)
  perFilterMaxValues?: number;

  @ApiProperty({
    description: 'Include count of items for each filter value',
    required: false,
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeCount?: boolean = true;

  @ApiProperty({
    description: 'Include filters with zero count',
    required: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeZeroCount?: boolean = false;

  @ApiProperty({
    description: 'Include filters that have no available values',
    required: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeEmpty?: boolean = false;
}
