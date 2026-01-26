import { z } from 'zod';

export const preferencesSchema = z.object({
  reminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)").optional(),
  timezone: z.string().max(50).optional(),
  checkInEnabled: z.boolean().optional(),
}).strict();

export const signupSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(100),
  preferences: preferencesSchema.optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
