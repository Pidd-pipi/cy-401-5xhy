import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  requirementApi,
  type RequirementFilters,
  type RequirementPayload
} from '@/api/requirement';
import type { Requirement } from '@/types';
import type { RequirementStatus } from '@/types/enums';

export const useRequirementStore = defineStore('requirement', () => {
  const requirements = ref<Requirement[]>([]);
  const myRequirements = ref<Requirement[]>([]);
  const currentRequirement = ref<Requirement | null>(null);
  const loading = ref(false);

  async function fetchRequirements(filters: RequirementFilters = {}) {
    loading.value = true;
    try {
      requirements.value = await requirementApi.list(filters);
    } finally {
      loading.value = false;
    }
  }

  async function fetchMine() {
    myRequirements.value = await requirementApi.mine();
  }

  async function fetchDetail(id: string) {
    currentRequirement.value = await requirementApi.detail(id);
    return currentRequirement.value;
  }

  async function createRequirement(payload: RequirementPayload) {
    const created = await requirementApi.create(payload);
    requirements.value.unshift(created);
    return created;
  }

  async function updateRequirement(id: string, payload: Partial<RequirementPayload>) {
    const updated = await requirementApi.update(id, payload);
    currentRequirement.value = updated;
    return updated;
  }

  async function changeStatus(id: string, status: RequirementStatus) {
    const updated = await requirementApi.changeStatus(id, status);
    currentRequirement.value = updated;
    return updated;
  }

  return {
    requirements,
    myRequirements,
    currentRequirement,
    loading,
    fetchRequirements,
    fetchMine,
    fetchDetail,
    createRequirement,
    updateRequirement,
    changeStatus
  };
});
