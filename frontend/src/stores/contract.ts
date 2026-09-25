import { defineStore } from 'pinia';
import { ref } from 'vue';
import { contractApi, type ContractPayload } from '@/api/contract';
import type { Contract } from '@/types';

export const useContractStore = defineStore('contract', () => {
  const contracts = ref<Contract[]>([]);
  const myContracts = ref<Contract[]>([]);
  const currentContract = ref<Contract | null>(null);

  async function fetchContracts() {
    contracts.value = await contractApi.list();
  }

  async function fetchMine() {
    myContracts.value = await contractApi.mine();
  }

  async function fetchDetail(id: string) {
    currentContract.value = await contractApi.detail(id);
    return currentContract.value;
  }

  async function createContract(payload: ContractPayload) {
    const contract = await contractApi.create(payload);
    myContracts.value.unshift(contract);
    return contract;
  }

  async function signContract(id: string) {
    currentContract.value = await contractApi.sign(id);
  }

  async function completeContract(id: string) {
    currentContract.value = await contractApi.complete(id);
  }

  return {
    contracts,
    myContracts,
    currentContract,
    fetchContracts,
    fetchMine,
    fetchDetail,
    createContract,
    signContract,
    completeContract
  };
});
