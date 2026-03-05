export interface ErrorPayload {
  // a machine‐readable code, e.g. 'USER_NOT_FOUND'
  code: string;
  // a human‐readable message, e.g. 'User with ID 42 does not exist'
  message: string;
  // any extra context (e.g. field errors, trace IDs, validation details)
  details?: Record<string, any>;
}
