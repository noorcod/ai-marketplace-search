import { PaginationQueryDto } from '@common/dtos/pagination-query.dto';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsOptional, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export enum ListingsSortEnum {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  DISCOUNT_ASC = 'discount_asc',
  DISCOUNT_DESC = 'discount_desc',
  POPULARITY = 'popularity',
  MOST_POPULAR = 'most_popular',
  RATING = 'rating',
  NEWEST = 'newest',
}

export class ListingsQueryDto extends PaginationQueryDto {
  @ApiProperty({
    description: 'Search term for filtering listings',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(3, 150)
  search?: string;

  @ApiProperty({
    description: 'Sort order for listings',
    required: false,
    enum: Object.values(ListingsSortEnum),
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().replace(/-/g, '_') : value))
  @IsEnum(ListingsSortEnum)
  sort?: ListingsSortEnum;

  @ApiProperty({
    description: 'Store ID for filtering listings by Store',
    required: false,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  store?: number;

  @ApiProperty({
    description: 'Category for filtering listings',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  categoryName?: string;

  @ApiProperty({
    description: 'City(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  cityName?: string[];

  @ApiProperty({
    description: 'Condition(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  conditionName?: string[];

  @ApiProperty({
    description: 'Brand(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  brandName?: string[];

  @ApiProperty({
    description: 'Minimum price for filtering listings',
    required: false,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiProperty({
    description: 'Maximum price for filtering listings',
    required: false,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiProperty({
    description: 'Model(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  model?: string[];

  @ApiProperty({
    description: 'Color(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  colorName?: string[];

  @ApiProperty({
    description: 'Laptop type(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  laptopType?: string[];

  @ApiProperty({
    description: 'RAM type(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  ramType?: string[];

  @ApiProperty({
    description: 'RAM capacity(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  ramCapacity?: string[];

  @ApiProperty({
    description: 'Primary storage type(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  primaryStorageType?: string[];

  @ApiProperty({
    description: 'Primary storage capacity(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  primaryStorageCapacity?: string[];

  @ApiProperty({
    description: 'Secondary storage type(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  secondaryStorageType?: string[];

  @ApiProperty({
    description: 'Secondary storage capacity(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  secondaryStorageCapacity?: string[];

  @ApiProperty({
    description: 'Processor(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  processor?: string[];

  @ApiProperty({
    description: 'Processor generation(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  generation?: string[];

  @ApiProperty({
    description: 'Graphics card name(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  graphicsCardName?: string[];

  @ApiProperty({
    description: 'Graphics card type(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  graphicsCardType?: string[];

  @ApiProperty({
    description: 'Graphics card memory size(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  graphicsCardMemory?: string[];

  @ApiProperty({
    description: 'Screen size(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  screenSize?: string[];

  @ApiProperty({
    description: 'Screen type(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  screenType?: string[];

  @ApiProperty({
    description: 'Screen protection(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  screenProtection?: string[];

  @ApiProperty({
    description: 'Screen resolution(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  resolution?: string[];

  @ApiProperty({
    description: 'Keyboard type(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  keyboard?: string[];

  @ApiProperty({
    description: 'Speaker type(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  speaker?: string[];

  @ApiProperty({
    description: 'Battery type(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  batteryType?: string[];

  @ApiProperty({
    description: 'Battery capacity(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  batteryCapacity?: string[];

  @ApiProperty({
    description: 'Has Touch Screen Support for filtering listings',
    required: false,
    type: Number,
    enum: [0, 1],
  })
  @IsOptional()
  @Transform(({ value }) => (value === '1' || value === 1 ? true : value === '0' || value === 0 ? false : value))
  @IsBoolean()
  isTouchScreen?: boolean;

  @ApiProperty({
    description: 'Has Backlit Keyboard for filtering listings',
    required: false,
    type: Number,
    enum: [0, 1],
  })
  @IsOptional()
  @Transform(({ value }) => (value === '1' || value === 1 ? true : value === '0' || value === 0 ? false : value))
  @IsBoolean()
  isBacklitKeyboard?: boolean;

  @ApiProperty({
    description: 'Has Fingerprint Sensor for filtering listings',
    required: false,
  })
  @IsOptional()
  @IsString()
  fingerprint?: string;

  @ApiProperty({
    description: 'Has PTA Approval for filtering listings',
    required: false,
    type: Number,
    enum: [0, 1],
  })
  @IsOptional()
  @Transform(({ value }) => (value === '1' || value === 1 ? true : value === '0' || value === 0 ? false : value))
  @IsBoolean()
  isPtaApproved?: boolean;

  @ApiProperty({
    description: 'Camera Specs(s) for filtering listings',
    required: false,
  })
  @IsOptional()
  @IsString()
  cameraSpecs?: string;

  @ApiProperty({
    description: 'Has E-SIM Support for filtering listings',
    required: false,
    type: Number,
    enum: [0, 1],
  })
  @IsOptional()
  @Transform(({ value }) => (value === '1' || value === 1 ? true : value === '0' || value === 0 ? false : value))
  @IsBoolean()
  isESim?: boolean;

  @ApiProperty({
    description: 'Network Band(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  networkBand?: string[];

  @ApiProperty({
    description: 'Refresh Rate(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  refreshRate?: string[];

  @ApiProperty({
    description: 'SIM Type(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  simType?: string[];

  @ApiProperty({
    description: 'Body Type(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  bodyType?: string[];

  @ApiProperty({
    description: 'Has SIM Support for filtering listings',
    required: false,
    type: Number,
    enum: [0, 1],
  })
  @IsOptional()
  @Transform(({ value }) => (value === '1' || value === 1 ? true : value === '0' || value === 0 ? false : value))
  @IsBoolean()
  isSimSupport?: boolean;

  @ApiProperty({
    description: 'Display Type(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  displayType?: string[];

  @ApiProperty({
    description: 'Operating System(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  operatingSystem?: string[];

  @ApiProperty({
    description: 'Has Smart TV Support for filtering listings',
    required: false,
    type: Number,
    enum: [0, 1],
  })
  @IsOptional()
  @Transform(({ value }) => (value === '1' || value === 1 ? true : value === '0' || value === 0 ? false : value))
  @IsBoolean()
  isSmartTv?: boolean;

  @ApiProperty({
    description: 'Has Webcam Support for filtering listings',
    required: false,
    type: Number,
    enum: [0, 1],
  })
  @IsOptional()
  @Transform(({ value }) => (value === '1' || value === 1 ? true : value === '0' || value === 0 ? false : value))
  @IsBoolean()
  isWebcam?: boolean;

  @ApiProperty({
    description: 'Has TV Certification for filtering listings',
    required: false,
    type: Number,
    enum: [0, 1],
  })
  @IsOptional()
  @Transform(({ value }) => (value === '1' || value === 1 ? true : value === '0' || value === 0 ? false : value))
  @IsBoolean()
  isTvCertified?: boolean;

  @ApiProperty({
    description: 'Desktop Type(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  desktopType?: string[];

  @ApiProperty({
    description: 'Form Factor(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  accessoryType?: string[];

  @ApiProperty({
    description: 'Monitor Type(s) for filtering listings',
    required: false,
    isArray: true,
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(v => v.trim())
          .filter(Boolean),
  )
  @IsArray()
  @IsString({ each: true })
  tvMonitorType?: string[];
}
