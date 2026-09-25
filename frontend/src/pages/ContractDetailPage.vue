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
        <el-descriptions-item label="甲方">
          <div class="party-line">
            <UserAvatar :user="contract.buyer" />
            <el-tag :type="contract.buyerSignedAt ? 'success' : 'info'" size="small">
              {{ contract.buyerSignedAt ? `已签署 ${formatDateTime(contract.buyerSignedAt)}` : '待签署' }}
            </el-tag>
          </div>
        </el-descriptions-item>
        <el-descriptions-item label="乙方">
          <div class="party-line">
            <UserAvatar :user="contract.freelancer" />
            <el-tag :type="contract.freelancerSignedAt ? 'success' : 'info'" size="small">
              {{ contract.freelancerSignedAt ? `已签署 ${formatDateTime(contract.freelancerSignedAt)}` : '待签署' }}
            </el-tag>
          </div>
        </el-descriptions-item>
      </el-descriptions>

      <div class="section">
        <ProgressSteps :stages="contract.stages" />
      </div>

      <el-alert
        v-if="contract.status === ContractStatus.PendingSign"
        :title="waitingTitle"
        :type="iSigned ? 'warning' : 'info'"
        :closable="false"
        show-icon
        class="section"
      />

      <div class="section actions">
        <el-button
          v-if="contract.status === ContractStatus.PendingSign"
          type="primary"
          :loading="signing"
          @click="handleSign"
        >
          {{ iSigned ? '我已签署（等待对方确认）' : '签署确认' }}
        </el-button>
        <template v-if="canOperate && [ContractStatus.PendingSign, ContractStatus.Active].includes(contract.status)">
          <el-button type="success" :disabled="contract.status !== ContractStatus.Active" @click="handleComplete">
            完成确认
          </el-button>
          <el-button type="danger" plain @click="handleTerminate">终止合同</el-button>
        </template>
        <el-button
          v-if="contract.status === ContractStatus.PendingSign && !isParty"
          disabled
        >
          仅合同双方可签署
        </el-button>
      </div>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import ProgressSteps from '@/components/common/ProgressSteps.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import UserAvatar from '@/components/common/UserAvatar.vue';
import { useAuth } from '@/hooks/useAuth';
import { useContractStore } from '@/stores/contract';
import { ContractStatus, PaymentMode } from '@/types/enums';
import { formatCurrency, formatDateTime } from '@/utils/format';

const props = defineProps<{ id: string }>();
const contractStore = useContractStore();
const auth = useAuth();
const signing = ref(false);

const contract = computed(() => contractStore.currentContract);
const paymentLabel = computed(() =>
  contract.value?.paymentMode === PaymentMode.OneTime ? '一次性付款' : '分阶段付款'
);

const partyRole = computed<'buyer' | 'freelancer' | null>(() => {
  if (!contract.value || !auth.user.value) return null;
  if (contract.value.buyerId === auth.user.value.id) return 'buyer';
  if (contract.value.freelancerId === auth.user.value.id) return 'freelancer';
  return null;
});

const isParty = computed(() => partyRole.value !== null);
const canOperate = computed(() => isParty.value);

const iSigned = computed(() => {
  if (!contract.value || !partyRole.value) return false;
  return partyRole.value === 'buyer'
    ? !!contract.value.buyerSignedAt
    : !!contract.value.freelancerSignedAt;
});

const waitingTitle = computed(() => {
  if (!isParty.value) {
    return '合同待双方签署，签署完成后自动生效';
  }
  if (iSigned.value) {
    return '你已签署，正在等待另一方确认签署';
  }
  return '合同待签署，你和另一方都确认后合同生效并推进需求';
});

async function handleSign() {
  if (!contract.value) return;
  const wasSigned = iSigned.value;
  signing.value = true;
  try {
    const updated = await contractStore.signContract(contract.value.id);
    if (wasSigned) {
      ElMessage.info('你已完成签署，请勿重复操作，正在等待另一方签署');
    } else if (updated.status === ContractStatus.Active) {
      ElMessage.success('双方已签署，合同生效');
    } else {
      ElMessage.success('签署成功，等待另一方确认');
    }
  } catch (error) {
    ElMessage.error((error as Error).message || '签署失败，请稍后重试');
  } finally {
    signing.value = false;
  }
}

async function handleComplete() {
  if (!contract.value) return;
  try {
    await ElMessageBox.confirm('确认合同已履行完毕并完成验收？', '完成确认', {
      type: 'warning',
      confirmButtonText: '确认完成',
      cancelButtonText: '取消'
    });
  } catch {
    return;
  }
  try {
    await contractStore.completeContract(contract.value.id);
    ElMessage.success('合同已完成');
  } catch (error) {
    ElMessage.error((error as Error).message || '操作失败，请稍后重试');
  }
}

async function handleTerminate() {
  if (!contract.value) return;
  try {
    await ElMessageBox.confirm('终止后合同不再继续履行，确认终止该合同？', '终止合同', {
      type: 'warning',
      confirmButtonText: '确认终止',
      cancelButtonText: '取消'
    });
  } catch {
    return;
  }
  try {
    await contractStore.terminateContract(contract.value.id);
    ElMessage.success('合同已终止');
  } catch (error) {
    ElMessage.error((error as Error).message || '操作失败，请稍后重试');
  }
}

onMounted(async () => {
  try {
    await contractStore.fetchDetail(props.id);
  } catch (error) {
    ElMessage.error((error as Error).message || '合同详情加载失败');
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

.party-line {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
</style>
