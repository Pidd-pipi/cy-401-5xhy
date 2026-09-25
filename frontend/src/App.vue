<template>
  <el-config-provider>
    <div class="app-shell">
      <el-container>
        <el-header class="app-header">
          <RouterLink class="brand" to="/requirements">CyFreelance</RouterLink>
          <nav class="top-nav">
            <RouterLink to="/requirements">需求大厅</RouterLink>
            <RouterLink to="/dashboard">我的工作台</RouterLink>
            <RouterLink :to="profileLink">个人资料</RouterLink>
          </nav>
          <div class="header-actions">
            <el-button v-if="isLoggedIn" text @click="logout">退出</el-button>
            <el-button v-else type="primary" @click="$router.push('/login')">登录</el-button>
          </div>
        </el-header>
        <el-main>
          <RouterView />
        </el-main>
      </el-container>
    </div>
  </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { useAuth } from './hooks/useAuth';

const router = useRouter();
const auth = useAuth();
const isLoggedIn = computed(() => auth.isAuthenticated.value);
const profileLink = computed(() => (auth.user.value?.id ? `/profile/${auth.user.value.id}` : '/login'));

function logout() {
  auth.logout();
  router.push('/requirements');
}
</script>
