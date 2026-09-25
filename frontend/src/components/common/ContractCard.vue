<template>
  <el-card class="contract-card" shadow="hover">
    <template #header>
      <div class="contract-head">
        <RouterLink :to="`/contracts/${contract.id}`">{{ contract.contractNo }}</RouterLink>
        <StatusBadge :status="contract.status" />
      </div>
    </template>
    <p>{{ contract.requirement?.title || '关联需求' }}</p>
    <div class="amount">{{ formatCurrency(contract.totalAmount) }}</div>
    <div class="party">
      <UserAvatar :user="contract.buyer" :size="30" />
      <span>与</span>
      <UserAvatar :user="contract.freelancer" :size="30" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router';
import type { Contract } from '@/types';
import { formatCurrency } from '@/utils/format';
import StatusBadge from './StatusBadge.vue';
import UserAvatar from './UserAvatar.vue';

defineProps<{ contract: Contract }>();
</script>

<style scoped>
.contract-head,
.party {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.contract-head a {
  font-weight: 700;
}

.amount {
  margin: 12px 0;
  color: #0f766e;
  font-weight: 800;
}
</style>
