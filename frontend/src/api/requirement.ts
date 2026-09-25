import { http } from './http';
import type { Requirement } from '@/types';
import type { RequirementStatus } from '@/types/enums';

export interface RequirementFilters {
  keyword?: string;
  status?: RequirementStatus | '';
  skill?: string;
  minBudget?: number;
  maxBudget?: number;
}

export interface RequirementPayload {
  title: string;
  description: string;
  budgetMin: number;
  budgetMax: number;
  deadline: string;
  skillTags: string[];
  status?: RequirementStatus;
}

export const requirementApi = {
  list(params: RequirementFilters) {
    return http.get<unknown, Requirement[]>('/requirements', { params });
  },
  mine() {
    return http.get<unknown, Requirement[]>('/requirements/mine');
  },
  detail(id: string) {
    return http.get<unknown, Requirement>(`/requirements/${id}`);
  },
  create(payload: RequirementPayload) {
    return http.post<unknown, Requirement>('/requirements', payload);
  },
  update(id: string, payload: Partial<RequirementPayload>) {
    return http.patch<unknown, Requirement>(`/requirements/${id}`, payload);
  },
  changeStatus(id: string, status: RequirementStatus) {
    return http.patch<unknown, Requirement>(`/requirements/${id}/status`, { status });
  }
};
