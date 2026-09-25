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
            :show-actions="isOwner"
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
            <el-button type="primary" :disabled="!auth.isAuthenticated.value" @click="submitBid">
              提交报价
            </el-button>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import BidCard from '@/components/common/BidCard.vue';
import SkillTag from '@/components/common/SkillTag.vue';
import StatusBadge from '@/components/common/StatusBadge.vue';
import UserAvatar from '@/components/common/UserAvatar.vue';
import { useAuth } from '@/hooks/useAuth';
import { useBidStore } from '@/stores/bid';
import { useRequirementStore } from '@/stores/requirement';
import { formatCurrency } from '@/utils/format';

const props = defineProps<{ id: string }>();
const requirementStore = useRequirementStore();
const bidStore = useBidStore();
const auth = useAuth();
const bidForm = reactive({
  amount: 3000,
  durationDays: 7,
  proposal: '',
  attachments: [] as string[]
});

const requirement = computed(() => requirementStore.currentRequirement);
const isOwner = computed(() => requirement.value?.publisherId === auth.user.value?.id);

async function submitBid() {
  if (!auth.isAuthenticated.value) {
    ElMessage.warning('请先登录');
    return;
  }
  await bidStore.submitBid({ ...bidForm, requirementId: props.id });
  bidForm.proposal = '';
  ElMessage.success('报价已提交');
}

async function acceptBid(id: string) {
  await bidStore.acceptBid(id);
  await requirementStore.fetchDetail(props.id);
  ElMessage.success('已采纳报价');
}

async function rejectBid(id: string) {
  await bidStore.rejectBid(id);
  ElMessage.success('已拒绝报价');
}

onMounted(async () => {
  await Promise.all([requirementStore.fetchDetail(props.id), bidStore.fetchByRequirement(props.id)]);
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
