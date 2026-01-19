import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  preferences: z.any().optional(), // For MVP, strict typing can come later
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
