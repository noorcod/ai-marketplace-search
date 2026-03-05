import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ModelImageDto {
  @ApiProperty({ description: 'Image ID' })
  imagesId?: number;

  @ApiProperty({ description: 'Primary image URL' })
  img0: string;
}

export class ModelListItemDto {
  @ApiProperty({ description: 'Model ID', example: 1 })
  modelId: number;

  @ApiProperty({ description: 'Model title', example: 'Apple MacBook Pro 16" M3 Pro' })
  modelTitle: string;

  @ApiProperty({ description: 'Model name', example: 'MacBook Pro 16"' })
  modelName: string;

  @ApiProperty({ description: 'Brand name', example: 'Apple' })
  brandName: string;

  @ApiProperty({ description: 'Model images', type: [ModelImageDto] })
  images: ModelImageDto[];

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;
}

export class ModelDetailDto extends ModelListItemDto {
  @ApiPropertyOptional({ description: 'Category name', example: 'Laptop' })
  categoryName?: string;

  @ApiPropertyOptional({ description: 'Processor', example: 'Intel Core i7' })
  processor?: string;

  @ApiPropertyOptional({ description: 'RAM capacity', example: '16GB' })
  ram?: string;

  @ApiPropertyOptional({ description: 'Storage capacity', example: '512GB SSD' })
  storage?: string;

  @ApiPropertyOptional({ description: 'Screen size', example: '15.6"' })
  screenSize?: string;

  @ApiPropertyOptional({ description: 'Graphics card', example: 'NVIDIA RTX 3060' })
  graphicCardName?: string;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Release date' })
  releaseDate?: Date;

  @ApiPropertyOptional({ description: 'Launch price' })
  launchPrice?: number;
}

export class FilterValueDto {
  @ApiProperty({ description: 'Filter value', example: 'Intel Core i7' })
  value: string | number | boolean;

  @ApiProperty({ description: 'Whether this value is currently selected', example: false })
  isChecked: boolean;
}

export class ModelFilterDto {
  @ApiProperty({ description: 'Filter values', type: [FilterValueDto] })
  values: FilterValueDto[];

  @ApiProperty({ description: 'Filter key', example: 'processor' })
  key: string;

  @ApiProperty({ description: 'Filter label', example: 'processor' })
  label: string;

  @ApiProperty({ description: 'Filter display alias', example: 'Processor' })
  alias: string;

  @ApiPropertyOptional({ description: 'Unit of measurement', example: 'GB' })
  unit?: string;

  @ApiProperty({ description: 'Input type', example: 'checkbox', enum: ['checkbox', 'radio'] })
  inputType: string;
}

export class ModelFiltersResponseDto {
  // Dynamic object with filter names as keys and ModelFilterDto as values
  // Example: { processor: ModelFilterDto, ram: ModelFilterDto, ... }
  [key: string]: ModelFilterDto;
}

export class ModelVariantDto {
  @ApiProperty({ description: 'Model ID', example: 1 })
  modelId: number;

  @ApiProperty({ description: 'Model title', example: 'Apple iPhone 15 Pro Max 256GB' })
  modelTitle: string;

  @ApiProperty({ description: 'Variant specification', example: '256GB' })
  variant: string;
}

export class AccessoryTypeDto {
  @ApiProperty({ description: 'Accessory type', example: 'Mouse' })
  accessoryType: string;
}
