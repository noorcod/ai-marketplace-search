import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { MarketplaceUser } from '../users/entities/marketplace-user.entity';
import { AppResponse } from 'src/common/responses/app-response';
import { CreateUserDto } from '../users/dtos/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import { COOLDOWN, MAX_ATTEMPTS, OTP_EXPIRY, OTP_HASH_EXPIRY, parseOtpHash } from 'src/common/utilities/otp';
import { RedisService } from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import { SMSService } from 'src/common/services/sms/sms.service';
import { VerifyOtpDto } from './dto/otp.dto';
import * as moment from 'moment';
import { PHONE_NUMBER_AUTH_TYPE } from 'src/common/constants/auth.constants';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private redisClient: Redis | null;
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
    private readonly smsService: SMSService,
    private readonly redisService: RedisService,
  ) {
    this.redisClient = this.redisService.getOrNil();
  }
  async validateOrCreateUser(user: CreateUserDto): Promise<AppResponse<Partial<MarketplaceUser>>> {
    const userExists = await this.userService.fetchUser({ email: user.email, authType: 'g' });
    if (userExists.success) {
      return await this.login(userExists.data as MarketplaceUser);
    }
    const createdUser = await this.userService.createUser(user);
    if (!createdUser.success) {
      return AppResponse.Err(createdUser.message) as AppResponse<Partial<MarketplaceUser>>;
    }
    return await this.login(createdUser.data as MarketplaceUser);
  }

  async login(user: MarketplaceUser) {
    const payload = { sub: user.id, email: user.email };
    return AppResponse.Ok({
      access_token: this.jwtService.sign(payload),
      user,
    }) as AppResponse<Partial<MarketplaceUser>>;
  }

  async getCurrentUser(userId: string): Promise<AppResponse<Partial<MarketplaceUser>>> {
    const user = await this.userService.fetchUser({ id: userId });
    if (!user.success) {
      return AppResponse.Err('User not found') as AppResponse<Partial<MarketplaceUser>>;
    }
    return AppResponse.Ok(user.data) as AppResponse<Partial<MarketplaceUser>>;
  }

  async sendOtp(phoneNumber: string) {
    const userExists = await this.userService.fetchUser({ phoneNumber });
    const key = `marketplace:login:${phoneNumber}`;
    const now = moment().utc().unix();
    let otp: string;
    // we check if an otp was already sent to the user's contact number
    const raw = await this.redisClient.hgetall(key);
    if (Object.keys(raw).length > 0) {
      const otpHash = parseOtpHash(raw);
      // if the otp is still valid, we do not send a new one
      if (otpHash.lastGeneratedAt && now - parseInt(otpHash.lastGeneratedAt) < COOLDOWN) {
        return AppResponse.Err('Otp already sent');
      }

      // we check attempts to avoid misuse
      if (otpHash.attempts && otpHash.attempts >= MAX_ATTEMPTS) {
        return AppResponse.Err('Maximum attempts reached');
      }

      // if the otp is expired, we generate a new one
      otp = Math.floor(1000 + Math.random() * 9000).toString();

      // we update the otp hash
      await this.redisClient.hmset(
        key,
        'otp',
        otp,
        'lastGeneratedAt',
        now.toString(),
        'attempts',
        (otpHash.attempts + 1).toString(),
        'expiryTime',
        (now + OTP_EXPIRY).toString(),
      );
    } else {
      // if no otp was sent, we generate a new one
      otp = Math.floor(1000 + Math.random() * 9000).toString();

      // we create a new otp hash
      await this.redisClient.hmset(
        key,
        'otp',
        otp,
        'lastGeneratedAt',
        now.toString(),
        'attempts',
        '1',
        'expiryTime',
        (now + OTP_EXPIRY).toString(),
      );

      // we set the expiry time to 1 hour
      await this.redisClient.expire(key, OTP_HASH_EXPIRY);
    }

    const message = `Your OTP code for the Techbazaar App is ${otp}. \nIn case of any issues, please contact us at 0327-2707779. \n\ntechbazaar.pk`;

    let token = this.smsService.token;
    if (!token || this.smsService.isTokenExpired(token)) {
      token = await this.smsService.getToken();
    }
    const data = await this.smsService.sendSMS(String(phoneNumber), message, 'login-otp', token);
    if (data.error) {
      return AppResponse.Err(data.error);
    }

    if (userExists.success) {
      return AppResponse.Ok({
        message: 'OTP send successfully on your registered phone number',
        registeredUser: true,
      });
    } else {
      return AppResponse.Ok({
        message: 'OTP send successfully on your registered phone number',
        registeredUser: false,
      });
    }
  }

  async verifyOtp(body: VerifyOtpDto) {
    const userExists = await this.userService.fetchUser({ phoneNumber: body.phoneNumber });
    const key = `marketplace:login:${body.phoneNumber}`;
    const raw = await this.redisClient.hgetall(key);
    if (Object.keys(raw).length === 0) {
      return AppResponse.Err('No otp found');
    }
    const data = parseOtpHash(raw);
    const now = moment().utc().unix();

    if (now > parseInt(data.expiryTime)) {
      return AppResponse.Err('Otp expired');
    }
    if (data.otp !== body.otp) {
      return AppResponse.Err('Invalid otp');
    } else {
      await this.redisClient.del(key);

      if (userExists.success) {
        return await this.login(userExists.data as MarketplaceUser);
      } else {
        const userObj = {
          authType: PHONE_NUMBER_AUTH_TYPE,
          isPhoneNumberVerified: true,
          phoneNumber: body.phoneNumber,
          firstName: body.firstName ?? 'guest',
          lastName: body.lastName ?? crypto.randomUUID(),
          isEmailVerified: false,
          email: null,
        };
        const newUser = await this.userService.createUser(userObj);
        if (!newUser.success) {
          return AppResponse.Err(newUser.message) as AppResponse<Partial<MarketplaceUser>>;
        } else {
          return await this.login(newUser.data as MarketplaceUser);
        }
      }
    }
  }

  async checkUserPhoneNumberStatus(token: string, phoneNumber: string) {
    // 1. decode the token and fetch id
    const decodedToken = this.jwtService.decode(token);
    if (!decodedToken) {
      return AppResponse.Err('Invalid Token');
    }
    // 2. fetch user by id
    const userExists = await this.userService.fetchUser({ id: decodedToken['id'] });
    if (!userExists.success) {
      return AppResponse.Err('User does not exist');
    } else {
      // 3. check if the phone number is already verified for the current user
      if (!Array.isArray(userExists.data) && userExists.data.isPhoneNumberVerified) {
        return AppResponse.Ok({ verified: true, message: 'Phone Number already verified' });
      }
      // 4. check if the phone number already exists in the database for another user
      const phoneNumberExistsResponse = await this.userService.fetchUser({ phoneNumber });
      if (
        phoneNumberExistsResponse.success &&
        !Array.isArray(phoneNumberExistsResponse.data) &&
        phoneNumberExistsResponse.data.id !== decodedToken['id']
      ) {
        let message: string;
        if (phoneNumberExistsResponse.data.authType === 'p') {
          message = 'You already have an account with this phone number, try signing in with your phone number.';
        } else {
          message = 'This Phone Number already exists and is associated with another account';
        }
        return AppResponse.Err(message);
      }
      return AppResponse.Ok({ verified: false, message: 'Phone Number not verified' });
    }
  }

  async updateUserPhoneNumber(token: string, phoneNumber: string) {
    // 1. decode the token and fetch id
    const decodedToken = this.jwtService.decode(token);
    if (!decodedToken) {
      return AppResponse.Err('Invalid Token');
    }
    // 2. fetch user by id
    const userExists = await this.userService.fetchUser({ id: decodedToken['id'] });
    if (!userExists.success) {
      return AppResponse.Err('User does not exist');
    } else {
      const updateUserObject = {
        ...userExists.data,
        phoneNumber: phoneNumber,
        isPhoneNumberVerified: true,
      };
      const result = await this.userService.updateUser({ id: decodedToken['id'] }, updateUserObject);
      if (result.success) {
        return AppResponse.Ok({ verified: true, message: 'Phone Number updated successfully' });
      } else {
        return AppResponse.Err('Failed to update Phone Number');
      }
    }
  }
}
