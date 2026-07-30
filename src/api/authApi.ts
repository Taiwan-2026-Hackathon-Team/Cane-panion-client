import { type } from 'arktype';

import { api } from './fetch';

export const AuthUser = type({
  id: 'string',
  role: 'string',
  'username?': 'string',
  'email?': 'string',
  'created_at?': 'string',
  'updated_at?': 'string',
});
export type AuthUser = typeof AuthUser.infer;

export const LoginResponse = type({
  message: 'string',
  user: AuthUser,
  token: 'string > 0',
});
export type LoginResponse = typeof LoginResponse.infer;

const LogoutResponse = type({
  message: 'string',
});

export interface LoginRequest {
  email: string;
  password: string;
}

export function login(body: LoginRequest): Promise<LoginResponse> {
  return api
    .post('api/v1/auth/login', {
      json: body,
      context: { auth: false },
    })
    .json(LoginResponse);
}

export function getUser(): Promise<AuthUser> {
  return api.get('api/v1/auth/me').json(AuthUser);
}

export function logout(): Promise<typeof LogoutResponse.infer> {
  return api.post('api/v1/auth/logout').json(LogoutResponse);
}
