import { Body, Controller, Delete, Get, Ip, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CreateUserEventDto } from './dtos/create-user-event.dto';
import { UserEventsService } from './user-events.service';
import { ApiBearerAuth, ApiHeader, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateUserWishlistDto } from './dtos/create-user-wishlist.dto';
import { UserWishlistService } from './user-wishlist.service';
import { PaginationQueryDto } from 'src/common/dtos/pagination-query.dto';
import { CreateReservationDto } from './dtos/create-reservation.dto';
import { ReservationsService } from './reservations.service';
import { PaginationOptions } from '@common/utilities/pagination-options';
import { User } from '@common/decorators/user.decorator';
import { UserAddressDto } from './dtos/user-address.dto';
import { UpdateUserAddressDto } from './dtos/update-user-address.dto';
import { AddressesService } from './addresses.service';
import { OptionalJwtAuthGuard } from '@common/guards/optional-auth.guard';

@Controller('users')
export class UsersController {
  constructor(
    private readonly userEventsService: UserEventsService,
    private readonly userWishlistService: UserWishlistService,
    private readonly reservationsService: ReservationsService,
    private readonly addressesService: AddressesService,
  ) {}
  // TODO: user searches are associated with listings

  // user event route
  @Post('add-events')
  @ApiHeader({
    name: 'X-Forwarded-For',
    description: 'Client IP for testing (overrides actual client IP)',
    required: false,
    schema: { type: 'string', example: '192.168.100.1' },
  })
  async addUserEvent(@Body() userEvent: CreateUserEventDto, @Req() req: Request, @Ip() ip: string) {
    const userIp = req.headers['x-forwarded-for'] || ip;
    userEvent.ip = userIp as string;
    return this.userEventsService.addUserEvent(userEvent);
  }

  //user wishlist routes

  @Post('wishlist')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async addProductToWishlist(@Body() body: CreateUserWishlistDto, @User('userId') userId: string) {
    return this.userWishlistService.addProductToWishlist(body, userId);
  }

  @Get('wishlist')
  @ApiBearerAuth()
  @ApiQuery({
    name: 'returnIds',
    description: 'Set to 1 to return only listing IDs',
    required: false,
  })
  @UseGuards(AuthGuard('jwt'))
  async fetchProductsFromWishlist(
    @Query() pagination: PaginationQueryDto,
    @User('userId') userId: string,
    @Query('returnIds') returnIds?: number,
  ) {
    const { page, size } = pagination;
    const paginationOptions = new PaginationOptions(page, size);
    return this.userWishlistService.fetchProductsFromWishlist(userId, paginationOptions, returnIds == 1 ? true : false);
  }

  @Delete('wishlist/:id')
  @ApiParam({ name: 'id', description: 'Enter the listing id' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async removeProductFromWishlist(@Param('id') listingId: string, @User('userId') userId: string) {
    return this.userWishlistService.removeProductFromWishlist(Number(listingId), userId);
  }

  // reservations routes

  @Post('add-reservations')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async addReservations(@Body() body: CreateReservationDto) {
    return this.reservationsService.addReservations(body);
  }

  @Get('reservations')
  @ApiQuery({
    name: 'status',
    enum: ['Pending', 'Done', 'Cancelled'],
    description: 'Reservation status',
    required: false,
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async fetchReservedProducts(
    @Query('status') status: string,
    @Query() pagination: PaginationQueryDto,
    @User('userId') userId: string,
  ) {
    const { page, size } = pagination;
    const paginationOptions = new PaginationOptions(page, size);
    return this.reservationsService.fetchReservedProducts(userId, paginationOptions, status);
  }

  @Get('/reservations-count')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async pendingReservationsCount(@User('userId') userId: string) {
    return this.reservationsService.pendingReservationsCount(userId);
  }

  @Get('/address-tags')
  @ApiBearerAuth()
  @UseGuards(OptionalJwtAuthGuard)
  async fetchAddressTags() {
    return this.addressesService.fetchAddressTags();
  }

  @Get('/addresses')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async fetchUserAddresses(@User('userId') userId: string, @Query() pagination: PaginationQueryDto) {
    const { page, size } = pagination;
    const paginationOptions = new PaginationOptions(page, size);
    return this.addressesService.fetchUserAddresses(userId, paginationOptions);
  }

  @Get('/main-address')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async fetchUserMainAddress(@User('userId') userId: string) {
    return this.addressesService.fetchUserMainAddress(userId);
  }

  @Post('/add-address')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async addUserAddress(@User('userId') userId: string, @Body() body: UserAddressDto) {
    return this.addressesService.addUserAddress(userId, body);
  }

  @Patch('/addresses/:id')
  @ApiParam({ name: 'id', description: 'User Address ID' })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  async updateUserAddress(@User('userId') userId: string, @Param('id') id: string, @Body() body: UpdateUserAddressDto) {
    return this.addressesService.updateUserAddress(userId, id, body);
  }
}
