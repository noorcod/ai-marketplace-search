import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ListingsQueryDto } from './listings-query.dto';
import { RequestSource } from '@modules/listings/dtos/listings-filters.dto';

export class GetFilterByNameDto extends OmitType(ListingsQueryDto, ['sort']) {
  @ApiProperty({
    description: 'Search within filter values (filters the filter options based on search term)',
    required: false,
    example: 'Apple',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Page number for pagination',
    required: false,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of filter values per page',
    required: false,
    default: 50,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  size?: number = 50;

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
}
