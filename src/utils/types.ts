import { z } from 'zod';
import { registerSchema } from './validation';

export type RegisterInput = z.infer<typeof registerSchema>;

export interface LoginInput {
  email: string;
  password: string;
}
