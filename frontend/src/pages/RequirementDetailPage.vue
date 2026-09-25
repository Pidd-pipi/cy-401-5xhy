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

        <div class="section">
          <h2>已提交报价</h2>
          <BidCard
            v-for="bid in bidStore.requirementBids"
            :key="bid.id"
            :bid="bid"
            :show-actions="isOwner && !biddingClosed"
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
              {{ biddingClosed ? '该需求已决标' : '提交报价' }}
            </el-button>
          </el-form>
        </el-card>

        <el-card v-if="pendingContract" shadow="never" class="section">
          <template #header>中标合同</template>
          <p class="muted">报价已采纳，合同待双方签署生效。</p>
          <RouterLink :to="`/contracts/${pendingContract.id}`">
            <el-button type="primary">前往签署 {{ pendingContract.contractNo }}</el-button>
          </RouterLink>
        </el-card>
      </el-col>
    </el-row>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { contractApi } from '@/api/contract';
import BidCard from '@/components/common/BidCard.vue';
import SkillTag from '@/components/common/SkillTag.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import UserAvatar from '@/components/common/UserAvatar.vue';
import { useAuth } from '@/hooks/useAuth';
import { useBidStore } from '@/stores/bid';
import { useRequirementStore } from '@/stores/requirement';
import type { Contract } from '@/types';
import { ContractStatus, RequirementStatus } from '@/types/enums';
import { formatCurrency } from '@/utils/format';

const props = defineProps<{ id: string }>();
const router = useRouter();
const requirementStore = useRequirementStore();
const bidStore = useBidStore();
const auth = useAuth();
const requirementContracts = ref<Contract[]>([]);
const bidForm = reactive({
  amount: 3000,
  durationDays: 7,
  proposal: '',
  attachments: [] as string[]
});

const requirement = computed(() => requirementStore.currentRequirement);
const isOwner = computed(() => requirement.value?.publisherId === auth.user.value?.id);
const biddingClosed = computed(() =>
  [
    RequirementStatus.PendingSign,
    RequirementStatus.InProgress,
    RequirementStatus.PendingReview,
    RequirementStatus.Completed,
    RequirementStatus.Cancelled
  ].includes(requirement.value?.status as RequirementStatus)
);
const pendingContract = computed(
  () =>
    requirementContracts.value.find(c => c.status === ContractStatus.PendingSign) ||
    requirementContracts.value[0]
);

async function submitBid() {
  if (!auth.isAuthenticated.value) {
    ElMessage.warning('请先登录');
    return;
  }
  try {
    await bidStore.submitBid({ ...bidForm, requirementId: props.id });
    bidForm.proposal = '';
    ElMessage.success('报价已提交');
  } catch (error) {
    ElMessage.error((error as Error).message || '报价提交失败');
  }
}

async function acceptBid(id: string) {
  try {
    const bid = await bidStore.acceptBid(id);
    await requirementStore.fetchDetail(props.id);
    await loadContracts();
    ElMessage.success('已采纳报价，待签合同已生成');
    if (pendingContract.value) {
      void router.push(`/contracts/${pendingContract.value.id}`);
    }
    return bid;
  } catch (error) {
    ElMessage.error((error as Error).message || '采纳失败，请稍后重试');
  }
}

async function rejectBid(id: string) {
  try {
    await bidStore.rejectBid(id);
    ElMessage.success('已拒绝报价');
  } catch (error) {
    ElMessage.error((error as Error).message || '操作失败，请稍后重试');
  }
}

async function loadContracts() {
  requirementContracts.value = await contractApi.byRequirement(props.id);
}

onMounted(async () => {
  try {
    await Promise.all([
      requirementStore.fetchDetail(props.id),
      bidStore.fetchByRequirement(props.id),
      loadContracts()
    ]);
  } catch (error) {
    ElMessage.error((error as Error).message || '详情加载失败');
  }
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
</style>
