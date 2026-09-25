<template>
  <div class="user-avatar">
    <el-avatar :src="user?.avatar" :size="size">{{ fallback }}</el-avatar>
    <div v-if="showInfo" class="user-info">
      <strong>{{ user?.username || '匿名用户' }}</strong>
      <span>{{ roleLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { User } from '@/types';
import { UserRole } from '@/types/enums';

const props = withDefaults(
  defineProps<{
    user?: User;
    size?: number;
    showInfo?: boolean;
  }>(),
  {
    size: 40,
    showInfo: true
  }
);

const fallback = computed(() => props.user?.username?.slice(0, 1).toUpperCase() || 'U');
const roleLabel = computed(() => {
  const map: Record<UserRole, string> = {
    [UserRole.Client]: '需求方',
    [UserRole.Freelancer]: '自由职业者',
    [UserRole.Dual]: '双角色'
  };
  return props.user?.role ? map[props.user.role] : '未设置角色';
});
</script>

<style scoped>
.user-avatar {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}

.user-info span {
  color: #6b7280;
  font-size: 12px;
}
</style>
