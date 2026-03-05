import { createCustomLogger } from '../utilities/winston.config';

export const StoreContactInfoLogger = {
  provide: 'StoreContactInfoLogger',
  useFactory: () => createCustomLogger('store-contact-info'),
};
