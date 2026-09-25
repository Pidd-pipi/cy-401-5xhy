import { defineStore } from 'pinia';
import { ref } from 'vue';
import { bidApi, type BidPayload } from '@/api/bid';
import type { Bid } from '@/types';

export const useBidStore = defineStore('bid', () => {
  const bids = ref<Bid[]>([]);
  const myBids = ref<Bid[]>([]);
  const requirementBids = ref<Bid[]>([]);

  async function fetchBids() {
    bids.value = await bidApi.list();
  }

  async function fetchMine() {
    myBids.value = await bidApi.mine();
  }

  async function fetchByRequirement(requirementId: string) {
    requirementBids.value = await bidApi.byRequirement(requirementId);
  }

  async function submitBid(payload: BidPayload) {
    const bid = await bidApi.submit(payload);
    requirementBids.value.unshift(bid);
    myBids.value.unshift(bid);
    return bid;
  }

  async function acceptBid(id: string) {
    const bid = await bidApi.accept(id);
    await fetchByRequirement(bid.requirementId);
    return bid;
  }

  async function rejectBid(id: string) {
    const bid = await bidApi.reject(id);
    await fetchByRequirement(bid.requirementId);
    return bid;
  }

  async function withdrawBid(id: string) {
    const bid = await bidApi.withdraw(id);
    await fetchMine();
    return bid;
  }

  return {
    bids,
    myBids,
    requirementBids,
    fetchBids,
    fetchMine,
    fetchByRequirement,
    submitBid,
    acceptBid,
    rejectBid,
    withdrawBid
  };
});
