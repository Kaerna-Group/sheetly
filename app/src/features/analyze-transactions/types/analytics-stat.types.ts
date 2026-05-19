export type MonthlyStats = {
  balance: number;
  expense: number;
  income: number;
  label: string;
  month: string;
};

export type CategoryStats = {
  categoryName: string;
  expense: number;
  income: number;
  total: number;
};

export type TopCategoryStats = {
  categoryName: string;
  total: number;
};
