<template>
  <el-steps :active="activeIndex" finish-status="success" align-center>
    <el-step
      v-for="stage in stages"
      :key="stage.title"
      :title="stage.title"
      :description="`${formatCurrency(stage.amount)} · ${stage.dueDate}`"
    />
  </el-steps>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ContractStage } from '@/types';
import { formatCurrency } from '@/utils/format';

const props = defineProps<{ stages: ContractStage[] }>();
const activeIndex = computed(() => props.stages.filter(stage => stage.completed).length);
</script>
