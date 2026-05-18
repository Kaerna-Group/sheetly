export function normalizeCategoryName(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}
