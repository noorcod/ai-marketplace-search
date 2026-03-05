import { ApiProperty, getSchemaPath } from '@nestjs/swagger';

export class QuickLinkGroupedLinkDto {
  @ApiProperty({ example: 'laptops-in-lahore' })
  slug!: string;

  @ApiProperty({ example: 'Laptops in Lahore', nullable: true })
  link_text!: string;
}

export class QuickLinksGroupedCategoryDto {
  @ApiProperty({ type: () => [QuickLinkGroupedLinkDto] })
  links!: QuickLinkGroupedLinkDto[];
}

export class FetchQuickLinksGroupedByCategoryResponseDto {
  @ApiProperty({ example: 200 })
  status!: number;

  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Data retrieved successfully' })
  message!: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: { $ref: getSchemaPath(QuickLinksGroupedCategoryDto) },
  })
  data!: Record<string, QuickLinksGroupedCategoryDto>;
}

export class QuickLinkFilterDto {
  @ApiProperty({ example: 1, nullable: true })
  id!: number | null;

  @ApiProperty({ example: 'categoryName', nullable: true })
  key!: string | null;

  @ApiProperty({ example: 'Category' })
  name!: string;

  @ApiProperty({ example: 'Laptop' })
  value!: string;
}

export class QuickLinkDetailDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'laptops-in-lahore' })
  slug!: string;

  @ApiProperty({ example: 'Laptops in Lahore', nullable: true })
  title?: string;

  @ApiProperty({ example: 'Shop Laptops', nullable: true })
  linkText?: string;

  @ApiProperty({ example: 2, nullable: true })
  categoryId?: number | null;

  @ApiProperty({ example: 'Laptop', nullable: true })
  categoryName?: string | null;

  @ApiProperty({ example: 'Best Laptops in Lahore' })
  metaTitle!: string;

  @ApiProperty({ example: 'Find the best laptops in Lahore...' })
  metaDescription!: string;

  @ApiProperty({ example: 'laptops, lahore' })
  metaKeyword!: string;

  @ApiProperty({ example: '<p>Content...</p>' })
  content!: string;

  @ApiProperty({ type: 'array', items: { type: 'object' } })
  faqs!: any[];

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: true })
  isCore!: boolean;

  @ApiProperty({ type: () => [QuickLinkFilterDto] })
  filters!: QuickLinkFilterDto[];
}

export class FetchQuickLinkDetailBySlugResponseDto {
  @ApiProperty({ example: 200 })
  status!: number;

  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Data retrieved successfully' })
  message!: string;

  @ApiProperty({ type: () => QuickLinkDetailDto })
  data!: QuickLinkDetailDto;
}
