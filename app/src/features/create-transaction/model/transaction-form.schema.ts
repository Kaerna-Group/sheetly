import { z } from 'zod';

export const transactionFormSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required.')
    .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, {
      message: 'Amount must be greater than 0.',
    }),
  categoryId: z.string().min(1, 'Category is required.'),
  categoryName: z.string().min(1, 'Category is required.'),
  comment: z.string().optional(),
  currency: z.string().min(3, 'Currency is required.'),
  date: z.string().min(1, 'Date is required.'),
  kind: z.enum(['income', 'expense']),
  paymentMethod: z.string().optional(),
});
