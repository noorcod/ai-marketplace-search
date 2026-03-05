import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { EnvService } from '../../../global-modules/env/env.service';

@Injectable()
export class SMSService {
  private readonly logger = new Logger(SMSService.name);
  token: string;
  constructor(
    private envService: EnvService,
    private jwtService: JwtService,
    private readonly httpService: HttpService,
  ) {
    this.token = null; // Initialize as null instead of undefined
  }
  async getToken() {
    try {
      const authHeader =
        'Basic ' +
        Buffer.from(`${this.envService.getEoceanUsername}:${this.envService.getEOceanPassword}`).toString('base64');

      const response = await firstValueFrom(
        this.httpService
          .post(
            `${this.envService.getEoceanBaseURL}/auth`,
            {},
            {
              headers: {
                Authorization: authHeader,
              },
            },
          )
          .pipe(
            catchError(err => {
              this.logger.error(err.message);
              throw new Error(err.message);
            }),
          ),
      );

      if (!response) {
        throw new InternalServerErrorException(`SMS service error! Status: ${response.status}`);
      }
      this.token = response.data.Authtoken;
      return this.token;
    } catch (error) {
      this.logger.error(error.message);
      throw new InternalServerErrorException(error.message);
    }
  }

  isTokenExpired(token?: string): boolean {
    if (!token) {
      return true; // No token means it's expired
    }
    try {
      const decoded = this.jwtService.decode(token) as any;
      if (!decoded || !decoded.exp) {
        return true; // Invalid token format
      }
      const currentTime = Math.floor(Date.now() / 1000); // Convert to seconds
      return currentTime >= decoded.exp; // Return true if current time is past expiry
    } catch (error) {
      this.logger.error('Error decoding token:', error);
      return true; // Assume expired if there's an error
    }
  }

  async sendSMS(to: string, message: string, channel: string, authToken: string) {
    try {
      const payload = {
        to: to.replace(/[+-]/g, ''),
        from: this.envService.getEOceanNumber,
        text: message,
        channel: channel,
      };
      const response = await firstValueFrom(
        this.httpService
          .post(`${this.envService.getEoceanBaseURL}/send`, payload, {
            headers: {
              'Content-Type': 'application/json',
              'x-access-token': authToken,
            },
          })
          .pipe(
            catchError(err => {
              this.logger.error(err.message);
              throw new InternalServerErrorException(err.message);
            }),
          ),
      );
      if (response.status !== 200) {
        this.logger.error(`SMS service! Status: ${response.status} - ${response.statusText}`);
        throw new InternalServerErrorException(`SMS service! Status: ${response.status} - ${response.statusText}`);
      }
      const { statusCode, messageId } = response.data;
      return messageId;
    } catch (error) {
      this.logger.error(`SMS service! Status: ${error}`);
      throw new InternalServerErrorException(`SMS service! Status: ${error}`);
    }
  }
}
