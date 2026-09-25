<template>
  <el-tag :type="tagType" effect="light" round>{{ label }}</el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BidStatus, ContractStatus, RequirementStatus } from '@/types/enums';

const props = defineProps<{
  status: RequirementStatus | BidStatus | ContractStatus | string;
}>();

const labels: Record<string, string> = {
  [RequirementStatus.Draft]: '草稿',
  [RequirementStatus.Open]: '待报价',
  [RequirementStatus.Bidding]: '报价中',
  [RequirementStatus.InProgress]: '进行中',
  [RequirementStatus.PendingReview]: '待验收',
  [RequirementStatus.Completed]: '已完成',
  [RequirementStatus.Cancelled]: '已取消',
  [BidStatus.Pending]: '待审',
  [BidStatus.Accepted]: '已采纳',
  [BidStatus.Rejected]: '已拒绝',
  [BidStatus.Withdrawn]: '已撤回',
  [ContractStatus.PendingSign]: '待签署',
  [ContractStatus.Active]: '执行中',
  [ContractStatus.Terminated]: '已终止'
};

const normalizedStatus = computed(() => String(props.status));
const label = computed(() => labels[normalizedStatus.value] || normalizedStatus.value);
const tagType = computed(() => {
  if (
    [RequirementStatus.Completed, BidStatus.Accepted, ContractStatus.Completed].includes(
      normalizedStatus.value as never
    )
  ) {
    return 'success';
  }
  if (
    [RequirementStatus.Cancelled, BidStatus.Rejected, ContractStatus.Terminated].includes(
      normalizedStatus.value as never
    )
  ) {
    return 'danger';
  }
  if ([RequirementStatus.InProgress, ContractStatus.Active].includes(normalizedStatus.value as never)) {
    return 'warning';
  }
  return 'info';
});
</script>
