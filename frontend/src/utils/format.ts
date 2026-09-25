export function formatCurrency(value: number | string | undefined) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatDate(value?: string) {
  if (!value) {
    return '-';
  }
  return new Intl.DateTimeFormat('zh-CN').format(new Date(value));
}
