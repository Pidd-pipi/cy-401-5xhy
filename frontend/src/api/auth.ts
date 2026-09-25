import { http } from './http';
import type { AuthResponse, LoginPayload, RegisterPayload, User } from '@/types';

export const authApi = {
  login(payload: LoginPayload) {
    return http.post<unknown, AuthResponse>('/auth/login', payload);
  },
  register(payload: RegisterPayload) {
    return http.post<unknown, AuthResponse>('/auth/register', payload);
  },
  me() {
    return http.get<unknown, User>('/auth/me');
  }
};
