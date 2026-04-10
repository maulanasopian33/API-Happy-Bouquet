import { z } from 'zod';

export const createManualTransactionSchema = z.object({
  fund_account_id: z.number().int().positive('ID kas wajib diisi'),
  amount: z.number().positive('Jumlah harus lebih dari 0'),
  type: z.enum(['credit', 'debit']),
  description: z.string().min(3, 'Deskripsi minimal 3 karakter'),
});

export const updateManualTransactionSchema = z.object({
  amount: z.number().positive('Jumlah harus lebih dari 0').optional(),
  type: z.enum(['credit', 'debit']).optional(),
  description: z.string().min(3, 'Deskripsi minimal 3 karakter').optional(),
});
