import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { authApi } from '@/api/auth';
import { userApi } from '@/api/user';
import type { LoginPayload, RegisterPayload, User } from '@/types';

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('cyfreelance_token') || '');
  const currentUser = ref<User | null>(null);
  const users = ref<User[]>([]);
  const isAuthenticated = computed(() => Boolean(token.value));

  async function login(payload: LoginPayload) {
    const result = await authApi.login(payload);
    token.value = result.token;
    currentUser.value = result.user;
    localStorage.setItem('cyfreelance_token', result.token);
    return result.user;
  }

  async function register(payload: RegisterPayload) {
    const result = await authApi.register(payload);
    token.value = result.token;
    currentUser.value = result.user;
    localStorage.setItem('cyfreelance_token', result.token);
    return result.user;
  }

  async function fetchMe() {
    if (!token.value) {
      return null;
    }
    currentUser.value = await authApi.me();
    return currentUser.value;
  }

  async function fetchUsers() {
    users.value = await userApi.list();
  }

  async function fetchUser(id: string) {
    return userApi.detail(id);
  }

  async function updateMe(payload: Partial<User>) {
    currentUser.value = await userApi.updateMe(payload);
    return currentUser.value;
  }

  function logout() {
    token.value = '';
    currentUser.value = null;
    localStorage.removeItem('cyfreelance_token');
  }

  return {
    token,
    user: currentUser,
    users,
    isAuthenticated,
    login,
    register,
    fetchMe,
    fetchUsers,
    fetchUser,
    updateMe,
    logout
  };
});
