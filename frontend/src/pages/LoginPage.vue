<template>
  <section class="page auth-page">
    <el-card class="auth-panel" shadow="never">
      <h1 class="page-title">{{ isRegister ? '创建账号' : '登录账号' }}</h1>
      <el-form label-position="top" @submit.prevent>
        <el-form-item v-if="isRegister" label="用户名">
          <el-input v-model="form.username" autocomplete="name" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" autocomplete="email" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" autocomplete="current-password" show-password />
        </el-form-item>
        <el-form-item v-if="isRegister" label="角色">
          <el-select v-model="form.role" style="width: 100%">
            <el-option label="需求方" :value="UserRole.Client" />
            <el-option label="自由职业者" :value="UserRole.Freelancer" />
            <el-option label="双角色" :value="UserRole.Dual" />
          </el-select>
        </el-form-item>
        <el-button type="primary" :loading="loading" class="full-button" @click="submit">
          {{ isRegister ? '注册并进入' : '登录' }}
        </el-button>
        <el-button text class="full-button" @click="isRegister = !isRegister">
          {{ isRegister ? '已有账号，去登录' : '没有账号，去注册' }}
        </el-button>
      </el-form>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/enums';

const router = useRouter();
const route = useRoute();
const auth = useAuth();
const isRegister = ref(false);
const loading = ref(false);
const form = reactive({
  username: '',
  email: 'demo@cyfreelance.test',
  password: '123456',
  role: UserRole.Dual
});

async function submit() {
  loading.value = true;
  try {
    if (isRegister.value) {
      await auth.register(form);
    } else {
      await auth.login({ email: form.email, password: form.password });
    }
    ElMessage.success('认证成功');
    router.push((route.query.redirect as string) || '/dashboard');
  } catch (error) {
    ElMessage.error((error as Error).message);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  display: grid;
  min-height: calc(100vh - 80px);
  place-items: center;
}

.auth-panel {
  width: min(420px, 100%);
}

.full-button {
  width: 100%;
  margin: 8px 0 0;
}
</style>
