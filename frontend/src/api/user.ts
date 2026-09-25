import { http } from './http';
import type { User } from '@/types';

export const userApi = {
  list() {
    return http.get<unknown, User[]>('/users');
  },
  detail(id: string) {
    return http.get<unknown, User>(`/users/${id}`);
  },
  updateMe(payload: Partial<User>) {
    return http.patch<unknown, User>('/users/me/profile', payload);
  }
};
