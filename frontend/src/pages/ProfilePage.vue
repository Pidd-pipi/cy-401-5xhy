<template>
  <section class="page">
    <el-row :gutter="18">
      <el-col :xs="24" :lg="9">
        <el-card v-if="profile" shadow="never">
          <UserAvatar :user="profile" :size="64" />
          <p class="muted">{{ profile.bio || '尚未填写简介' }}</p>
          <div>
            <SkillTag v-for="skill in profile.skillTags || []" :key="skill" :skill="skill" />
          </div>
          <el-rate :model-value="Number(profile.rating)" disabled />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="15">
        <el-card shadow="never">
          <template #header>编辑个人资料</template>
          <el-form label-position="top">
            <el-form-item label="用户名">
              <el-input v-model="form.username" />
            </el-form-item>
            <el-form-item label="技能标签（逗号分隔）">
              <el-input v-model="skillInput" />
            </el-form-item>
            <el-form-item label="简介">
              <el-input v-model="form.bio" type="textarea" :rows="4" />
            </el-form-item>
            <el-form-item label="联系方式">
              <el-input v-model="form.contact" />
            </el-form-item>
            <el-button type="primary" @click="save">保存资料</el-button>
          </el-form>
        </el-card>

        <div class="section">
          <h2>历史项目</h2>
          <div class="grid">
            <RequirementCard
              v-for="requirement in requirementStore.myRequirements"
              :key="requirement.id"
              :requirement="requirement"
            />
          </div>
          <div class="grid section">
            <ContractCard
              v-for="contract in contractStore.myContracts"
              :key="contract.id"
              :contract="contract"
            />
          </div>
        </div>
      </el-col>
    </el-row>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import ContractCard from '@/components/common/ContractCard.vue';
import RequirementCard from '@/components/common/RequirementCard.vue';
import SkillTag from '@/components/common/SkillTag.vue';
import UserAvatar from '@/components/common/UserAvatar.vue';
import { useContractStore } from '@/stores/contract';
import { useRequirementStore } from '@/stores/requirement';
import { useUserStore } from '@/stores/user';
import type { User } from '@/types';

const props = defineProps<{ id: string }>();
const userStore = useUserStore();
const requirementStore = useRequirementStore();
const contractStore = useContractStore();
const profile = ref<User | null>(null);
const skillInput = ref('');
const form = reactive({
  username: '',
  bio: '',
  contact: ''
});

async function save() {
  const updated = await userStore.updateMe({
    ...form,
    skillTags: skillInput.value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
  });
  profile.value = updated;
  ElMessage.success('资料已保存');
}

onMounted(async () => {
  const [user] = await Promise.all([
    userStore.fetchUser(props.id),
    requirementStore.fetchMine(),
    contractStore.fetchMine()
  ]);
  profile.value = user;
  form.username = user.username;
  form.bio = user.bio || '';
  form.contact = user.contact || '';
  skillInput.value = (user.skillTags || []).join(', ');
});
</script>
