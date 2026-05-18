import { z } from 'zod';

export const transactionFormSchema = z.object({
  amount: z.string().min(1),
  categoryName: z.string().min(1),
  comment: z.string().optional(),
  currency: z.string().min(3),
  date: z.string().min(1),
  kind: z.enum(['income', 'expense']),
  paymentMethod: z.string().optional(),
});
