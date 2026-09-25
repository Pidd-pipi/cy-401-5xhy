<template>
  <section class="page">
    <h1 class="page-title">需求大厅</h1>
    <FilterBar :model="filters" @search="loadRequirements" />
    <el-skeleton v-if="store.loading" :rows="5" animated />
    <template v-else>
      <div class="grid">
        <RequirementCard
          v-for="requirement in pagedRequirements"
          :key="requirement.id"
          :requirement="requirement"
        />
      </div>
      <el-empty v-if="!store.requirements.length" description="暂无需求" />
      <el-pagination
        v-if="store.requirements.length"
        class="section"
        layout="prev, pager, next, sizes"
        :current-page="pagination.page.value"
        :page-size="pagination.pageSize.value"
        :total="pagination.total.value"
        @current-change="pagination.changePage"
        @size-change="pagination.changePageSize"
      />
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue';
import type { RequirementFilters } from '@/api/requirement';
import FilterBar from '@/components/common/FilterBar.vue';
import RequirementCard from '@/components/common/RequirementCard.vue';
import { usePagination } from '@/hooks/usePagination';
import { useRequirementStore } from '@/stores/requirement';

const store = useRequirementStore();
const pagination = usePagination(6);
const filters = reactive<RequirementFilters>({
  keyword: '',
  status: '',
  skill: '',
  minBudget: undefined,
  maxBudget: undefined
});

const pagedRequirements = computed(() =>
  store.requirements.slice(
    pagination.offset.value,
    pagination.offset.value + pagination.pageSize.value
  )
);

async function loadRequirements() {
  await store.fetchRequirements(filters);
  pagination.setTotal(store.requirements.length);
}

watch(() => store.requirements.length, value => pagination.setTotal(value));
onMounted(loadRequirements);
</script>
