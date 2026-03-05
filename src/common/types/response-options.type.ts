export type ResponseOpts<T> = {
  status: number;
  success: boolean;
  message?: string | Record<string, any>;
  data?: T;
  meta?: Record<string, any>;
};
