<template>
  <el-card class="bid-card" shadow="never">
    <div class="bid-head">
      <UserAvatar :user="bid.bidder" :size="34" />
      <StatusBadge :status="bid.status" />
    </div>
    <div class="bid-price">{{ formatCurrency(bid.amount) }}</div>
    <p>{{ bid.proposal }}</p>
    <div class="bid-meta">
      <span>工期 {{ bid.durationDays }} 天</span>
      <span v-if="bid.attachments?.length">附件 {{ bid.attachments.length }} 个</span>
    </div>
    <div v-if="showActions" class="actions">
      <el-button size="small" type="success" @click="$emit('accept', bid.id)">采纳</el-button>
      <el-button size="small" @click="$emit('reject', bid.id)">拒绝</el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { Bid } from '@/types';
import { formatCurrency } from '@/utils/format';
import StatusBadge from './StatusBadge.vue';
import UserAvatar from './UserAvatar.vue';

withDefaults(
  defineProps<{
    bid: Bid;
    showActions?: boolean;
  }>(),
  {
    showActions: false
  }
);

defineEmits<{
  accept: [id: string];
  reject: [id: string];
}>();
</script>

<style scoped>
.bid-card {
  margin-bottom: 12px;
}

.bid-head,
.bid-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.bid-price {
  margin-top: 14px;
  color: #0f766e;
  font-size: 22px;
  font-weight: 800;
}

.bid-meta {
  color: #6b7280;
  font-size: 13px;
}

.actions {
  margin-top: 14px;
}
</style>
