import { http } from './http';
import type { Bid } from '@/types';

export interface BidPayload {
  requirementId: string;
  amount: number;
  durationDays: number;
  proposal: string;
  attachments: string[];
}

export const bidApi = {
  list() {
    return http.get<unknown, Bid[]>('/bids');
  },
  mine() {
    return http.get<unknown, Bid[]>('/bids/mine');
  },
  byRequirement(requirementId: string) {
    return http.get<unknown, Bid[]>(`/bids/requirement/${requirementId}`);
  },
  submit(payload: BidPayload) {
    return http.post<unknown, Bid>('/bids', payload);
  },
  accept(id: string) {
    return http.patch<unknown, Bid>(`/bids/${id}/accept`);
  },
  reject(id: string) {
    return http.patch<unknown, Bid>(`/bids/${id}/reject`);
  },
  withdraw(id: string) {
    return http.patch<unknown, Bid>(`/bids/${id}/withdraw`);
  }
};
