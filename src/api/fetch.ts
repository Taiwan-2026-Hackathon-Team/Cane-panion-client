import { type } from 'arktype';
import ky, { isHTTPError, SchemaValidationError } from 'ky';

import { getAuthToken } from '../auth/tokenStorage';
import { API_URL } from '../constants';

/** Backend error payloads: `{ success?: false, message: string }`. */
const ApiErrorBody = type({
  message: 'string > 0',
});

/**
 * Shared HTTP client. Pass `context: { auth: false }` to skip the Bearer header
 * (e.g. login). Otherwise the in-memory JWT is attached when present.
 *
 * `beforeError` copies API `message` onto `error.message` when present.
 */
export const api = ky.create({
  prefix: API_URL,
  hooks: {
    beforeRequest: [
      ({ request, options }) => {
        if (options.context.auth === false) return;
        const token = getAuthToken();
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
    beforeError: [
      ({ error }) => {
        if (isHTTPError(error)) {
          const body = ApiErrorBody(error.data);
          if (!(body instanceof type.errors)) {
            error.message = body.message;
          }
        }
        return error;
      },
    ],
  },
});

export { HTTPError, isHTTPError, isKyError, SchemaValidationError } from 'ky';

/**
 * User-facing copy for thrown request/parse errors.
 * HTTP errors already carry API `message` via `beforeError`.
 * Schema failures use `fallback` (avoid leaking validator details).
 */
export function toErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.',
): string {
  if (error instanceof SchemaValidationError) return fallback;
  if (error instanceof Error && error.message.length > 0) return error.message;
  return fallback;
}
