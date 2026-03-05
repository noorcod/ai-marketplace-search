import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from './env.interface';

@Injectable()
export class EnvService {
  constructor(private readonly configService: ConfigService<Env, true>) {}

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV');
  }

  get port(): number {
    return this.configService.get<number>('PORT');
  }

  get databaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL');
  }

  get databaseHost(): string {
    return this.configService.get<string>('DATABASE_HOST');
  }

  get databasePort(): number {
    return this.configService.get<number>('DATABASE_PORT');
  }

  get databaseName(): string {
    return this.configService.get<string>('DATABASE_NAME');
  }

  get databaseUser(): string {
    return this.configService.get<string>('DATABASE_USER');
  }

  get databasePassword(): string {
    return this.configService.get<string>('DATABASE_PASSWORD');
  }

  get databaseDialect(): string {
    return this.configService.get<string>('DATABASE_DIALECT');
  }

  get bcryptSalt(): string {
    return this.configService.get<string>('BCRYPT_SALT');
  }

  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET');
  }

  get jwtExpireIn(): string {
    return this.configService.get<string>('JWT_EXPIRATION');
  }

  get baseUrl(): string {
    return this.configService.get<string>('BASE_URL');
  }

  get sendGridApiKey(): string {
    return this.configService.get<string>('SENDGRID_API_KEY');
  }

  get sendGridFrom(): string {
    return this.configService.get<string>('SENDGRID_FROM_EMAIL');
  }

  get marketplaceDashboardUrl(): string {
    return this.configService.get<string>('MARKETPLACE_DASHBOARD_URL');
  }

  get googleUserInfoUrl(): string {
    return this.configService.get<string>('GOOGLE_USER_INFO_URL');
  }

  get enableLogging(): string {
    return this.configService.get<string>('ENABLE_LOGGING');
  }

  get refreshTokenExpiryTime(): string {
    return this.configService.get<string>('REFRESH_TOKEN_EXPIRY_TIME');
  }

  get recaptchaSecretKey(): string {
    return this.configService.get<string>('RECAPTCHA_SECRET_KEY');
  }

  get swaggerDocumentTitle(): string {
    return this.configService.get<string>('SWAGGER_TITLE');
  }

  get swaggerDocumentDescription(): string {
    return this.configService.get<string>('SWAGGER_DESCRIPTION');
  }

  get swaggerDocumentVersion(): string {
    return this.configService.get<string>('SWAGGER_VERSION');
  }

  get swaggerUser(): string {
    return this.configService.get<string>('SWAGGER_USER');
  }

  get swaggerPassword(): string {
    return this.configService.get<string>('SWAGGER_PASSWORD');
  }

  get redisHost(): string {
    return this.configService.get<string>('REDIS_HOST');
  }

  get redisPort(): number {
    return this.configService.get<number>('REDIS_PORT');
  }

  get redisUser(): string {
    return this.configService.get<string>('REDIS_USER');
  }

  get redisPassword(): string {
    return this.configService.get<string>('REDIS_PASSWORD');
  }

  get redisDatabase(): number {
    return this.configService.get<number>('REDIS_DATABASE');
  }

  get sellerUrl(): string {
    return this.configService.get<string>('SELLER_URL');
  }
  get getGoogleClientId(): string {
    return this.configService.get<string>('GOOGLE_CLIENT_ID');
  }
  get getGoogleClientSecret(): string {
    return this.configService.get<string>('GOOGLE_CLIENT_SECRET');
  }

  get getGoogleCallbackUrl(): string {
    return this.configService.get<string>('GOOGLE_CALLBACK_URL');
  }
  get getEoceanBaseURL(): string {
    return this.configService.get<string>('E_OCEAN_BASE_URL');
  }
  get getEoceanUsername(): string {
    return this.configService.get<string>('E_OCEAN_USERNAME');
  }
  get getEOceanPassword(): string {
    return this.configService.get<string>('E_OCEAN_PASSWORD');
  }
  get getEOceanNumber(): number {
    return this.configService.get<number>('E_OCEAN_NUMBER');
  }
  get SlackOrdersWebhookUrl(): string {
    return this.configService.get<string>('SLACK_ORDERS_WEBHOOK_URL');
  }

  get HMACSecret(): string {
    return this.configService.get<string>('HMAC_SECRET');
  }

  get s3URL(): string {
    return this.configService.get<string>('S3_URL');
  }

  get frontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL');
  }

  get bafBaseUrl(): string {
    return this.configService.get<string>('BAF_BASE_URL');
  }

  get bafHsEndpoint(): string {
    return this.configService.get<string>('BAF_HS_ENDPOINT');
  }

  get bafSsoEndpoint(): string {
    return this.configService.get<string>('BAF_SSO_ENDPOINT');
  }

  get bafKey1(): string {
    return this.configService.get<string>('BAF_KEY1');
  }

  get bafKey2(): string {
    return this.configService.get<string>('BAF_KEY2');
  }

  get bafChannelId(): string {
    return this.configService.get<string>('BAF_CHANNEL_ID');
  }

  get bafIsRedirectionRequest(): string {
    return this.configService.get<string>('BAF_IS_REDIRECTION_REQUEST');
  }

  get bafMerchantId(): string {
    return this.configService.get<string>('BAF_MERCHANT_ID');
  }

  get bafStoreId(): string {
    return this.configService.get<string>('BAF_STORE_ID');
  }

  get bafMerchantHash(): string {
    return this.configService.get<string>('BAF_MERCHANT_HASH');
  }

  get bafMerchantUsername(): string {
    return this.configService.get<string>('BAF_MERCHANT_USERNAME');
  }

  get bafMerchantPassword(): string {
    return this.configService.get<string>('BAF_MERCHANT_PASSWORD');
  }

  get bafReturnUrl(): string {
    return this.configService.get<string>('BAF_RETURN_URL');
  }

  get bafCurrency(): string {
    return this.configService.get<string>('BAF_CURRENCY');
  }
}
