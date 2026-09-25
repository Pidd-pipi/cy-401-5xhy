<template>
  <el-card class="requirement-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <RouterLink :to="`/requirements/${requirement.id}`">{{ requirement.title }}</RouterLink>
        <StatusBadge :status="requirement.status" />
      </div>
    </template>
    <p class="description">{{ requirement.description }}</p>
    <div class="meta-row">
      <span>{{ formatCurrency(requirement.budgetMin) }} - {{ formatCurrency(requirement.budgetMax) }}</span>
      <span>截止 {{ formatDate(requirement.deadline) }}</span>
    </div>
    <div class="skills">
      <SkillTag v-for="skill in requirement.skillTags || []" :key="skill" :skill="skill" />
    </div>
    <div class="publisher">
      <UserAvatar :user="requirement.publisher" :size="32" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import type { Requirement } from '@/types';
import { formatCurrency, formatDate } from '@/utils/format';
import SkillTag from './SkillTag.vue';
import StatusBadge from './StatusBadge.vue';
import UserAvatar from './UserAvatar.vue';

defineProps<{ requirement: Requirement }>();
</script>

<style scoped>
.requirement-card {
  height: 100%;
}

.card-header,
.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-header a {
  color: #111827;
  font-weight: 700;
}

.description {
  min-height: 48px;
  color: #4b5563;
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.meta-row {
  color: #374151;
  font-size: 13px;
}

.skills,
.publisher {
  margin-top: 14px;
}
</style>
