import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ThemeConfigDto {
  @ApiProperty()
  @IsString()
  themeType: string;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        bannerType: {
          type: 'string',
          enum: ['primaryImage', 'secondaryImage'],
        },
        images: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string', nullable: true },
              originalname: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BannerConfigInline)
  bannerConfig: BannerConfigInline[];

  @ApiProperty({ type: [Object], description: 'Top categories (define properly if known)' })
  @IsArray()
  topCategories: any[];

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        sectionName: { type: 'string' },
        sectionItems: { type: 'array', items: { type: 'number' } },
      },
    },
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ListingSectionInline)
  listingSectionConfig: ListingSectionInline[];
}

// Flattened inline class for bannerConfig
export class BannerConfigInline {
  @ApiProperty({ enum: ['primaryImage', 'secondaryImage'] })
  @IsString()
  bannerType: 'primaryImage' | 'secondaryImage' | string;

  @ApiPropertyOptional({
    type: 'array',
    items: {
      type: 'object',
      properties: {
        key: { type: 'string', nullable: true },
        originalname: { type: 'string', nullable: true },
      },
    },
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BannerImageInline)
  images?: BannerImageInline[];
}

// Flattened inline class for image objects
export class BannerImageInline {
  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  key: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  @IsOptional()
  @IsString()
  originalname: string | null;
}

// Flattened inline class for listing sections
export class ListingSectionInline {
  @ApiProperty()
  @IsString()
  sectionName: string;

  @ApiProperty({ type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  sectionItems: number[];
}
