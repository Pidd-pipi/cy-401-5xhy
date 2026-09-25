<template>
  <el-card class="filter-bar" shadow="never">
    <el-form :inline="true" :model="model" label-position="top">
      <el-form-item label="关键词">
        <el-input v-model="model.keyword" clearable placeholder="搜索标题" />
      </el-form-item>
      <el-form-item label="状态">
        <el-select v-model="model.status" clearable placeholder="全部状态" style="width: 150px">
          <el-option label="待报价" :value="RequirementStatus.Open" />
          <el-option label="报价中" :value="RequirementStatus.Bidding" />
          <el-option label="进行中" :value="RequirementStatus.InProgress" />
          <el-option label="待验收" :value="RequirementStatus.PendingReview" />
        </el-select>
      </el-form-item>
      <el-form-item label="技能">
        <el-input v-model="model.skill" clearable placeholder="Vue / 法律 / 设计" />
      </el-form-item>
      <el-form-item label="最低预算">
        <el-input-number v-model="model.minBudget" :min="0" :step="500" controls-position="right" />
      </el-form-item>
      <el-form-item label="最高预算">
        <el-input-number v-model="model.maxBudget" :min="0" :step="500" controls-position="right" />
      </el-form-item>
      <el-form-item label=" ">
        <el-button type="primary" @click="$emit('search')">筛选</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import type { RequirementFilters } from '@/api/requirement';
import { RequirementStatus } from '@/types/enums';

defineProps<{ model: RequirementFilters }>();
defineEmits<{ search: [] }>();
</script>

<style scoped>
.filter-bar {
  margin-bottom: 20px;
}
</style>
