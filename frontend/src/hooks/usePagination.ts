import { computed, ref } from 'vue';

export function usePagination(initialPageSize = 8) {
  const page = ref(1);
  const pageSize = ref(initialPageSize);
  const total = ref(0);

  const offset = computed(() => (page.value - 1) * pageSize.value);

  function setTotal(value: number) {
    total.value = value;
  }

  function changePage(value: number) {
    page.value = value;
  }

  function changePageSize(value: number) {
    pageSize.value = value;
    page.value = 1;
  }

  return {
    page,
    pageSize,
    total,
    offset,
    setTotal,
    changePage,
    changePageSize
  };
}
