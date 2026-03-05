import { PaginationQueryDto } from '@common/dtos/pagination-query.dto';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum RequestSource {
  WEB = 'web',
  MOBILE = 'mobile',
}

export class ModelFiltersQueryDto extends PaginationQueryDto {
  // Request source to control defaults (web: 10, mobile: 5)
  @ApiPropertyOptional({
    description: 'Source of the request',
    enum: RequestSource,
    default: RequestSource.MOBILE,
  })
  @IsOptional()
  @IsEnum(RequestSource)
  source?: RequestSource = RequestSource.MOBILE;

  @ApiPropertyOptional({
    description: 'Maximum number of values to return per filter. Default: 10 for web, 5 for mobile',
    example: 10,
    minimum: 5,
    maximum: 20,
  })
  @IsOptional()
  @IsNumber()
  @Max(20)
  @Min(5)
  perFilterMaxValues?: number;

  @ApiPropertyOptional({
    description: 'Include filters that have no available values',
    required: false,
    default: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  includeEmpty?: boolean = false;
  @ApiPropertyOptional({
    description: 'Search term for filtering within filter values',
    example: 'Intel',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Category name to get category-specific filters',
    example: 'Laptop',
  })
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiPropertyOptional({
    description: 'Brand name(s) for interdependent filtering. Supports repeated params or comma-separated values.',
    example: ['Apple', 'Samsung'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : String(value).split(',').filter(Boolean)))
  @IsString({ each: true })
  brandName?: string[];

  // Laptop & Desktop filters
  @ApiPropertyOptional({
    description: 'Laptop type for interdependent filtering',
    example: 'Gaming',
  })
  @IsOptional()
  @IsString()
  laptopType?: string;

  @ApiPropertyOptional({
    description: 'Desktop type for interdependent filtering',
    example: 'All-in-One',
  })
  @IsOptional()
  @IsString()
  desktopType?: string;

  @ApiPropertyOptional({
    description: 'Processor for interdependent filtering',
    example: 'Intel Core i7',
  })
  @IsOptional()
  @IsString()
  processor?: string;

  @ApiPropertyOptional({
    description: 'Processor generation for interdependent filtering',
    example: '12th Gen',
  })
  @IsOptional()
  @IsString()
  generation?: string;

  @ApiPropertyOptional({
    description: 'RAM type for interdependent filtering',
    example: 'DDR4',
  })
  @IsOptional()
  @IsString()
  ramType?: string;

  @ApiPropertyOptional({
    description: 'RAM capacity for interdependent filtering',
    example: '16GB',
  })
  @IsOptional()
  @IsString()
  ram?: string;

  @ApiPropertyOptional({
    description: 'HDD storage capacity for interdependent filtering',
    example: '1TB',
  })
  @IsOptional()
  @IsString()
  storage?: string;

  @ApiPropertyOptional({
    description: 'SSD storage capacity for interdependent filtering',
    example: '512GB',
  })
  @IsOptional()
  @IsString()
  storageSsd?: string;

  @ApiPropertyOptional({
    description: 'Mobile storage capacity for interdependent filtering',
    example: '256GB',
  })
  @IsOptional()
  @IsString()
  mobileStorage?: string;

  @ApiPropertyOptional({
    description: 'Graphics card name for interdependent filtering',
    example: 'NVIDIA RTX 3060',
  })
  @IsOptional()
  @IsString()
  graphicCardName?: string;

  @ApiPropertyOptional({
    description: 'Graphics card type for interdependent filtering',
    example: 'Dedicated',
  })
  @IsOptional()
  @IsString()
  graphicCardType?: string;

  @ApiPropertyOptional({
    description: 'Graphics card memory for interdependent filtering',
    example: '6GB',
  })
  @IsOptional()
  @IsString()
  graphicCardMemory?: string;

  // Screen & Display filters
  @ApiPropertyOptional({
    description: 'Screen size for interdependent filtering',
    example: '15.6"',
  })
  @IsOptional()
  @IsString()
  screenSize?: string;

  @ApiPropertyOptional({
    description: 'Screen type for interdependent filtering',
    example: 'IPS',
  })
  @IsOptional()
  @IsString()
  screenType?: string;

  @ApiPropertyOptional({
    description: 'Screen resolution for interdependent filtering',
    example: '1920x1080',
  })
  @IsOptional()
  @IsString()
  resolution?: string;

  @ApiPropertyOptional({
    description: 'Refresh rate for interdependent filtering',
    example: '144Hz',
  })
  @IsOptional()
  @IsString()
  refreshRate?: string;

  @ApiPropertyOptional({
    description: 'Screen protection for interdependent filtering',
    example: 'Gorilla Glass',
  })
  @IsOptional()
  @IsString()
  screenProtection?: string;

  @ApiPropertyOptional({
    description: 'Display type for interdependent filtering',
    example: 'OLED',
  })
  @IsOptional()
  @IsString()
  displayType?: string;

  // Audio & Input filters
  @ApiPropertyOptional({
    description: 'Speaker type for interdependent filtering',
    example: 'Stereo',
  })
  @IsOptional()
  @IsString()
  speaker?: string;

  @ApiPropertyOptional({
    description: 'Keyboard type for interdependent filtering',
    example: 'Backlit',
  })
  @IsOptional()
  @IsString()
  keyboard?: string;

  // Camera & Biometric filters
  @ApiPropertyOptional({
    description: 'Camera specifications for interdependent filtering',
    example: '48MP',
  })
  @IsOptional()
  @IsString()
  cameraSpecs?: string;

  @ApiPropertyOptional({
    description: 'Camera type for interdependent filtering',
    example: 'Triple Camera',
  })
  @IsOptional()
  @IsString()
  cameraType?: string;

  @ApiPropertyOptional({
    description: 'Fingerprint sensor type for interdependent filtering',
    example: 'In-Display',
  })
  @IsOptional()
  @IsString()
  fingerPrint?: string;

  // Battery & Power filters
  @ApiPropertyOptional({
    description: 'Battery type for interdependent filtering',
    example: 'Li-Po',
  })
  @IsOptional()
  @IsString()
  battery?: string;

  @ApiPropertyOptional({
    description: 'Battery capacity for interdependent filtering',
    example: '5000mAh',
  })
  @IsOptional()
  @IsString()
  batteryCapacity?: string;

  // Mobile & Tablet specific filters
  @ApiPropertyOptional({
    description: 'Body type for interdependent filtering',
    example: 'Metal',
  })
  @IsOptional()
  @IsString()
  bodyType?: string;

  @ApiPropertyOptional({
    description: 'SIM type for interdependent filtering',
    example: 'Dual SIM',
  })
  @IsOptional()
  @IsString()
  simType?: string;

  @ApiPropertyOptional({
    description: 'Network bands for interdependent filtering',
    example: '5G',
  })
  @IsOptional()
  @IsString()
  networkBands?: string;

  @ApiPropertyOptional({
    description: 'Operating system for interdependent filtering',
    example: 'Android',
  })
  @IsOptional()
  @IsString()
  os?: string;

  // Accessories filter
  @ApiPropertyOptional({
    description: 'Accessory type for interdependent filtering',
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
