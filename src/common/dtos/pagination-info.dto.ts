import { ApiProperty } from '@nestjs/swagger';

export class PaginationInfoDto {
  @ApiProperty({ example: 1 })
  totalItems!: number;

  @ApiProperty({ example: 1 })
  currentPage!: number;

  @ApiProperty({ example: 10 })
  perPage!: number;

  @ApiProperty({ example: 1 })
  totalPages!: number;
}
