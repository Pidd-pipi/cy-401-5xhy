<template>
  <section class="page">
    <el-page-header @back="$router.push('/dashboard')">
      <template #content>
        <span>{{ contract?.contractNo || '合同详情' }}</span>
      </template>
    </el-page-header>

    <el-card v-if="contract" class="section" shadow="never">
      <template #header>
        <div class="contract-header">
          <div>
            <h1>{{ contract.contractNo }}</h1>
            <p class="muted">{{ contract.requirement?.title }}</p>
          </div>
          <StatusBadge :status="contract.status" />
        </div>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="总金额">{{ formatCurrency(contract.totalAmount) }}</el-descriptions-item>
        <el-descriptions-item label="付款方式">{{ paymentLabel }}</el-descriptions-item>
        <el-descriptions-item label="甲方"><UserAvatar :user="contract.buyer" /></el-descriptions-item>
        <el-descriptions-item label="乙方"><UserAvatar :user="contract.freelancer" /></el-descriptions-item>
      </el-descriptions>

      <div class="section">
        <ProgressSteps :stages="contract.stages" />
      </div>

      <div class="section">
        <el-button type="primary" @click="contractStore.signContract(contract.id)">签署确认</el-button>
        <el-button type="success" @click="contractStore.completeContract(contract.id)">完成确认</el-button>
      </div>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import ProgressSteps from '@/components/common/ProgressSteps.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import UserAvatar from '@/components/common/UserAvatar.vue';
import { useContractStore } from '@/stores/contract';
import { PaymentMode } from '@/types/enums';
import { formatCurrency } from '@/utils/format';

const props = defineProps<{ id: string }>();
const contractStore = useContractStore();
const contract = computed(() => contractStore.currentContract);
const paymentLabel = computed(() =>
  contract.value?.paymentMode === PaymentMode.OneTime ? '一次性付款' : '分阶段付款'
);

onMounted(() => contractStore.fetchDetail(props.id));
</script>

<style scoped>
.contract-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.contract-header h1 {
  margin: 0;
  font-size: 24px;
}
</style>
