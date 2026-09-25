import { storeToRefs } from 'pinia';
import { useUserStore } from '@/stores/user';
import type { LoginPayload, RegisterPayload } from '@/types';

export function useAuth() {
  const store = useUserStore();
  const { user, token, isAuthenticated } = storeToRefs(store);

  return {
    user,
    token,
    isAuthenticated,
    login: (payload: LoginPayload) => store.login(payload),
    register: (payload: RegisterPayload) => store.register(payload),
    refreshUser: () => store.fetchMe(),
    logout: () => store.logout()
  };
}
