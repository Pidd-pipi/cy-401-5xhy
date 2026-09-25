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
        <el-descriptions-item label="甲方（需求方）"><UserAvatar :user="contract.buyer" /></el-descriptions-item>
        <el-descriptions-item label="乙方（承接方）"><UserAvatar :user="contract.freelancer" /></el-descriptions-item>
        <el-descriptions-item label="甲方签署">
          <span v-if="contract.buyerSignedAt" class="signed">
            已签署 · {{ formatDateTime(contract.buyerSignedAt) }}
          </span>
          <el-tag v-else type="info" size="small" round>未签署</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="乙方签署">
          <span v-if="contract.freelancerSignedAt" class="signed">
            已签署 · {{ formatDateTime(contract.freelancerSignedAt) }}
          </span>
          <el-tag v-else type="info" size="small" round>未签署</el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <div class="section">
        <ProgressSteps :stages="contract.stages" />
      </div>

      <div v-if="contract.status === ContractStatus.PendingSign" class="section sign-panel">
        <el-alert
          v-if="iHaveSigned"
          type="warning"
          :closable="false"
          show-icon
          title="已完成签署，等待对方确认后合同生效"
        />
        <el-alert
          v-else-if="isParty"
          type="info"
          :closable="false"
          show-icon
          title="合同待双方签署，双方均确认后才会生效并推进需求"
        />
        <el-alert
          v-else
          type="info"
          :closable="false"
          show-icon
          title="仅合同双方可签署，当前账号无权操作"
        />
        <el-button
          v-if="isParty && !iHaveSigned"
          type="primary"
          :loading="signing"
          class="sign-btn"
          @click="sign"
        >
          签署确认
        </el-button>
      </div>

      <div v-if="contract.status === ContractStatus.Active" class="section">
        <el-button type="success" @click="complete">完成确认</el-button>
      </div>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import ProgressSteps from '@/components/common/ProgressSteps.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import UserAvatar from '@/components/common/UserAvatar.vue';
import { useAuth } from '@/hooks/useAuth';
import { useContractStore } from '@/stores/contract';
import { ContractStatus, PaymentMode } from '@/types/enums';
import { formatCurrency } from '@/utils/format';

const props = defineProps<{ id: string }>();
const contractStore = useContractStore();
const auth = useAuth();
const signing = ref(false);
const contract = computed(() => contractStore.currentContract);
const paymentLabel = computed(() =>
  contract.value?.paymentMode === PaymentMode.OneTime ? '一次性付款' : '分阶段付款'
);

const isParty = computed(() => {
  const current = contract.value;
  const userId = auth.user.value?.id;
  return Boolean(current && userId && (current.buyerId === userId || current.freelancerId === userId));
});

const iHaveSigned = computed(() => {
  const current = contract.value;
  const userId = auth.user.value?.id;
  if (!current || !userId) {
    return false;
  }
  return current.buyerId === userId
    ? Boolean(current.buyerSignedAt)
    : current.freelancerId === userId
      ? Boolean(current.freelancerSignedAt)
      : false;
});

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
}

async function sign() {
  signing.value = true;
  try {
    const updated = await contractStore.signContract(props.id);
    ElMessage.success(
      updated.status === ContractStatus.Active ? '双方已签署，合同生效' : '签署成功，等待对方确认'
    );
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '签署失败，请稍后重试');
  } finally {
    signing.value = false;
  }
}

async function complete() {
  try {
    await contractStore.completeContract(props.id);
    ElMessage.success('合同已完成');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '操作失败，请稍后重试');
  }
}

onMounted(async () => {
  try {
    await contractStore.fetchDetail(props.id);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '合同加载失败');
  }
});
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

.signed {
  color: #0f766e;
  font-weight: 600;
}

.sign-panel {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
}

.sign-btn {
  margin-top: 2px;
}
</style>
