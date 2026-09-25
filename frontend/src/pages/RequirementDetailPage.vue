<template>
  <section class="page">
    <el-page-header @back="$router.push('/requirements')">
      <template #content>
        <span>{{ requirement?.title || '需求详情' }}</span>
      </template>
    </el-page-header>

    <el-row v-if="requirement" :gutter="18" class="section">
      <el-col :xs="24" :lg="15">
        <el-card shadow="never">
          <template #header>
            <div class="detail-header">
              <h1>{{ requirement.title }}</h1>
              <StatusBadge :status="requirement.status" />
            </div>
          </template>
          <p>{{ requirement.description }}</p>
          <p class="muted">
            预算 {{ formatCurrency(requirement.budgetMin) }} - {{ formatCurrency(requirement.budgetMax) }}
          </p>
          <div>
            <SkillTag v-for="skill in requirement.skillTags || []" :key="skill" :skill="skill" />
          </div>
          <div class="section">
            <UserAvatar :user="requirement.publisher" />
          </div>
        </el-card>

        <el-alert
          v-if="pendingContract"
          class="section"
          type="warning"
          show-icon
          :closable="false"
          :title="`已生成待签合同 ${pendingContract.contractNo}，双方签署后生效`"
        >
          <div class="contract-entry">
            <span>
              合同金额 {{ formatCurrency(pendingContract.totalAmount) }} ·
              {{ pendingContract.status === ContractStatus.PendingSign ? '等待双方签署' : '已生效' }}
            </span>
            <RouterLink :to="`/contracts/${pendingContract.id}`">前往签署</RouterLink>
          </div>
        </el-alert>

        <div class="section">
          <h2>已提交报价</h2>
          <BidCard
            v-for="bid in bidStore.requirementBids"
            :key="bid.id"
            :bid="bid"
            :show-actions="isOwner && canManageBids"
            @accept="acceptBid"
            @reject="rejectBid"
          />
          <el-empty v-if="!bidStore.requirementBids.length" description="暂无报价" />
        </div>
      </el-col>

      <el-col :xs="24" :lg="9">
        <el-card shadow="never">
          <template #header>提交报价</template>
          <el-form label-position="top">
            <el-form-item label="报价金额">
              <el-input-number v-model="bidForm.amount" :min="0" :step="500" style="width: 100%" />
            </el-form-item>
            <el-form-item label="工期（天）">
              <el-input-number v-model="bidForm.durationDays" :min="1" style="width: 100%" />
            </el-form-item>
            <el-form-item label="提案内容">
              <el-input v-model="bidForm.proposal" type="textarea" :rows="5" />
            </el-form-item>
            <el-button
              type="primary"
              :disabled="!auth.isAuthenticated.value || biddingClosed"
              @click="submitBid"
            >
              {{ biddingClosed ? '报价已截止' : '提交报价' }}
            </el-button>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import { RouterLink } from 'vue-router';
import { ElMessage } from 'element-plus';
import BidCard from '@/components/common/BidCard.vue';
import SkillTag from '@/components/common/SkillTag.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import UserAvatar from '@/components/common/UserAvatar.vue';
import { useAuth } from '@/hooks/useAuth';
import { useBidStore } from '@/stores/bid';
import { useContractStore } from '@/stores/contract';
import { useRequirementStore } from '@/stores/requirement';
import { ContractStatus, RequirementStatus } from '@/types/enums';
import { formatCurrency } from '@/utils/format';

const props = defineProps<{ id: string }>();
const requirementStore = useRequirementStore();
const bidStore = useBidStore();
const contractStore = useContractStore();
const auth = useAuth();
const bidForm = reactive({
  amount: 3000,
  durationDays: 7,
  proposal: '',
  attachments: [] as string[]
});

const requirement = computed(() => requirementStore.currentRequirement);
const isOwner = computed(() => requirement.value?.publisherId === auth.user.value?.id);

const pendingContract = computed(
  () =>
    contractStore.requirementContracts.find(
      contract => contract.status !== ContractStatus.Terminated
    ) || null
);

const canManageBids = computed(() => {
  const status = requirement.value?.status;
  return Boolean(
    status &&
      ![
        RequirementStatus.PendingContract,
        RequirementStatus.InProgress,
        RequirementStatus.Completed,
        RequirementStatus.Cancelled
      ].includes(status)
  );
});

const biddingClosed = computed(() => !canManageBids.value);

async function submitBid() {
  if (!auth.isAuthenticated.value) {
    ElMessage.warning('请先登录');
    return;
  }
  if (biddingClosed.value) {
    ElMessage.warning('该需求已选定报价或已结束，无法继续报价');
    return;
  }
  try {
    await bidStore.submitBid({ ...bidForm, requirementId: props.id });
    bidForm.proposal = '';
    ElMessage.success('报价已提交');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '报价提交失败');
  }
}

async function acceptBid(id: string) {
  try {
    await bidStore.acceptBid(id);
    await Promise.all([
      requirementStore.fetchDetail(props.id),
      bidStore.fetchByRequirement(props.id),
      contractStore.fetchByRequirement(props.id)
    ]);
    ElMessage.success('已采纳报价，待签合同已生成');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '采纳失败，请稍后重试');
  }
}

async function rejectBid(id: string) {
  try {
    await bidStore.rejectBid(id);
    ElMessage.success('已拒绝报价');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '操作失败，请稍后重试');
  }
}

onMounted(async () => {
  await Promise.all([
    requirementStore.fetchDetail(props.id),
    bidStore.fetchByRequirement(props.id),
    contractStore.fetchByRequirement(props.id)
  ]);
});
</script>

<style scoped>
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.detail-header h1 {
  margin: 0;
  font-size: 24px;
}

.contract-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.contract-entry a {
  font-weight: 600;
}
</style>
