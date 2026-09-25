<template>
  <section class="page">
    <h1 class="page-title">我的工作台</h1>
    <el-row :gutter="18">
      <el-col :xs="24" :lg="12">
        <h2>我发布/中标的需求</h2>
        <RequirementCard
          v-for="requirement in requirementStore.myRequirements"
          :key="requirement.id"
          :requirement="requirement"
          class="section"
        />
      </el-col>
      <el-col :xs="24" :lg="12">
        <h2>我的报价</h2>
        <BidCard
          v-for="bid in bidStore.myBids"
          :key="bid.id"
          :bid="bid"
          class="section"
        />
      </el-col>
    </el-row>

    <div class="section">
      <h2>进行中合同</h2>
      <div class="grid">
        <ContractCard v-for="contract in contractStore.myContracts" :key="contract.id" :contract="contract" />
      </div>
      <el-empty v-if="!contractStore.myContracts.length" description="暂无合同" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import BidCard from '@/components/common/BidCard.vue';
import ContractCard from '@/components/common/ContractCard.vue';
import RequirementCard from '@/components/common/RequirementCard.vue';
import { useBidStore } from '@/stores/bid';
import { useContractStore } from '@/stores/contract';
import { useRequirementStore } from '@/stores/requirement';

const requirementStore = useRequirementStore();
const bidStore = useBidStore();
const contractStore = useContractStore();

onMounted(async () => {
  await Promise.all([
    requirementStore.fetchMine(),
    bidStore.fetchMine(),
    contractStore.fetchMine()
  ]);
});
</script>
