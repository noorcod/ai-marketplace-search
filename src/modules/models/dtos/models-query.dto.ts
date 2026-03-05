import { PaginationQueryDto } from '@common/dtos/pagination-query.dto';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum ModelsSortEnum {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  ALPHABETICAL = 'alphabetical',
  MODEL_NAME_ASC = 'model_name_asc',
  MODEL_NAME_DESC = 'model_name_desc',
  BRAND_NAME_ASC = 'brand_name_asc',
  BRAND_NAME_DESC = 'brand_name_desc',
  MODEL_TITLE_ASC = 'model_title_asc',
  MODEL_TITLE_DESC = 'model_title_desc',
  LAUNCH_PRICE_ASC = 'launch_price_asc',
  LAUNCH_PRICE_DESC = 'launch_price_desc',
  RELEASE_DATE_ASC = 'release_date_asc',
  RELEASE_DATE_DESC = 'release_date_desc',
}

export class ModelsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Search term for filtering models by model title',
    example: 'iPhone 15',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort order for models. Uses meaningful tokens mapped internally to actual sort fields.',
    enum: Object.values(ModelsSortEnum),
    example: ModelsSortEnum.NEWEST,
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().replace(/-/g, '_') : value))
  @IsEnum(ModelsSortEnum)
  sort?: ModelsSortEnum;

  @ApiPropertyOptional({
    description: 'Category name for filtering models',
    example: 'Laptop',
  })
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiPropertyOptional({
    description: 'Brand name for filtering models',
    example: 'Apple',
  })
  @IsOptional()
  @IsString()
  brandName?: string;

  // Laptop & Desktop filters
  @ApiPropertyOptional({
    description: 'Laptop type for filtering models',
    example: 'Gaming',
  })
  @IsOptional()
  @IsString()
  laptopType?: string;

  @ApiPropertyOptional({
    description: 'Desktop type for filtering models',
    example: 'All-in-One',
  })
  @IsOptional()
  @IsString()
  desktopType?: string;

  @ApiPropertyOptional({
    description: 'Processor for filtering models',
    example: 'Intel Core i7',
  })
  @IsOptional()
  @IsString()
  processor?: string;

  @ApiPropertyOptional({
    description: 'Processor generation for filtering models',
    example: '12th Gen',
  })
  @IsOptional()
  @IsString()
  generation?: string;

  @ApiPropertyOptional({
    description: 'RAM type for filtering models',
    example: 'DDR4',
  })
  @IsOptional()
  @IsString()
  ramType?: string;

  @ApiPropertyOptional({
    description: 'RAM capacity for filtering models',
    example: '16GB',
  })
  @IsOptional()
  @IsString()
  ram?: string;

  @ApiPropertyOptional({
    description: 'HDD storage capacity for filtering models',
    example: '1TB',
  })
  @IsOptional()
  @IsString()
  storage?: string;

  @ApiPropertyOptional({
    description: 'SSD storage capacity for filtering models',
    example: '512GB',
  })
  @IsOptional()
  @IsString()
  storageSsd?: string;

  @ApiPropertyOptional({
    description: 'Mobile storage capacity for filtering models',
    example: '256GB',
  })
  @IsOptional()
  @IsString()
  mobileStorage?: string;

  @ApiPropertyOptional({
    description: 'Graphics card name for filtering models',
    example: 'NVIDIA RTX 3060',
  })
  @IsOptional()
  @IsString()
  graphicCardName?: string;

  @ApiPropertyOptional({
    description: 'Graphics card type for filtering models',
    example: 'Dedicated',
  })
  @IsOptional()
  @IsString()
  graphicCardType?: string;

  @ApiPropertyOptional({
    description: 'Graphics card memory for filtering models',
    example: '6GB',
  })
  @IsOptional()
  @IsString()
  graphicCardMemory?: string;

  // Screen & Display filters
  @ApiPropertyOptional({
    description: 'Screen size for filtering models',
    example: '15.6"',
  })
  @IsOptional()
  @IsString()
  screenSize?: string;

  @ApiPropertyOptional({
    description: 'Screen type for filtering models',
    example: 'IPS',
  })
  @IsOptional()
  @IsString()
  screenType?: string;

  @ApiPropertyOptional({
    description: 'Screen resolution for filtering models',
    example: '1920x1080',
  })
  @IsOptional()
  @IsString()
  resolution?: string;

  @ApiPropertyOptional({
    description: 'Refresh rate for filtering models',
    example: '144Hz',
  })
  @IsOptional()
  @IsString()
  refreshRate?: string;

  @ApiPropertyOptional({
    description: 'Screen protection for filtering models',
    example: 'Gorilla Glass',
  })
  @IsOptional()
  @IsString()
  screenProtection?: string;

  @ApiPropertyOptional({
    description: 'Display type for filtering models',
    example: 'OLED',
  })
  @IsOptional()
  @IsString()
  displayType?: string;

  // Audio & Input filters
  @ApiPropertyOptional({
    description: 'Speaker type for filtering models',
    example: 'Stereo',
  })
  @IsOptional()
  @IsString()
  speaker?: string;

  @ApiPropertyOptional({
    description: 'Keyboard type for filtering models',
    example: 'Backlit',
  })
  @IsOptional()
  @IsString()
  keyboard?: string;

  // Camera & Biometric filters
  @ApiPropertyOptional({
    description: 'Camera specifications for filtering models',
    example: '48MP',
  })
  @IsOptional()
  @IsString()
  cameraSpecs?: string;

  @ApiPropertyOptional({
    description: 'Camera type for filtering models',
    example: 'Triple Camera',
  })
  @IsOptional()
  @IsString()
  cameraType?: string;

  @ApiPropertyOptional({
    description: 'Fingerprint sensor type for filtering models',
    example: 'In-Display',
  })
  @IsOptional()
  @IsString()
  fingerPrint?: string;

  // Battery & Power filters
  @ApiPropertyOptional({
    description: 'Battery type for filtering models',
    example: 'Li-Po',
  })
  @IsOptional()
  @IsString()
  battery?: string;

  @ApiPropertyOptional({
    description: 'Battery capacity for filtering models',
    example: '5000mAh',
  })
  @IsOptional()
  @IsString()
  batteryCapacity?: string;

  // Mobile & Tablet specific filters
  @ApiPropertyOptional({
    description: 'Body type for filtering models',
    example: 'Metal',
  })
  @IsOptional()
  @IsString()
  bodyType?: string;

  @ApiPropertyOptional({
    description: 'SIM type for filtering models',
    example: 'Dual SIM',
  })
  @IsOptional()
  @IsString()
  simType?: string;

  @ApiPropertyOptional({
    description: 'Network bands for filtering models',
    example: '5G',
  })
  @IsOptional()
  @IsString()
  networkBands?: string;

  @ApiPropertyOptional({
    description: 'Operating system for filtering models',
    example: 'Android',
  })
  @IsOptional()
  @IsString()
  os?: string;

  // Accessories filter
  @ApiPropertyOptional({
    description: 'Accessory type for filtering models',
    example: 'Mouse',
  })
  @IsOptional()
  @IsString()
  accessoryType?: string;

  // Boolean filters
  @ApiPropertyOptional({
    description: 'Touch screen enabled',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasTouchScreen?: boolean;

  @ApiPropertyOptional({
    description: 'Backlit keyboard enabled',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasBacklitKeyboard?: boolean;

  @ApiPropertyOptional({
    description: 'Webcam enabled',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasWebcam?: boolean;

  @ApiPropertyOptional({
    description: 'Smart TV enabled',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isSmartTv?: boolean;

  @ApiPropertyOptional({
    description: 'TV certification',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasTvCertification?: boolean;

  @ApiPropertyOptional({
    description: 'SIM support enabled',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasSimSupport?: boolean;

  @ApiPropertyOptional({
    description: 'E-SIM enabled',
    type: Boolean,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasESim?: boolean;
}
