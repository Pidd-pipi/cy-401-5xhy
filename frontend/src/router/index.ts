import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/stores/user';
import ContractDetailPage from '@/pages/ContractDetailPage.vue';
import DashboardPage from '@/pages/DashboardPage.vue';
import LoginPage from '@/pages/LoginPage.vue';
import ProfilePage from '@/pages/ProfilePage.vue';
import RequirementDetailPage from '@/pages/RequirementDetailPage.vue';
import RequirementsPage from '@/pages/RequirementsPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/requirements' },
    { path: '/login', component: LoginPage },
    { path: '/requirements', component: RequirementsPage },
    { path: '/requirements/:id', component: RequirementDetailPage, props: true },
    { path: '/dashboard', component: DashboardPage, meta: { requiresAuth: true } },
    { path: '/contracts/:id', component: ContractDetailPage, props: true },
    { path: '/profile/:id', component: ProfilePage, props: true, meta: { requiresAuth: true } }
  ]
});

router.beforeEach(async to => {
  const userStore = useUserStore();
  if (userStore.token && !userStore.user) {
    try {
      await userStore.fetchMe();
    } catch {
      userStore.logout();
    }
  }

  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }

  return true;
});

export default router;
