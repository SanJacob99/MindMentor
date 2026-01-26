import { z } from 'zod';

export const createEntrySchema = z.object({
  mood: z.number().min(0).max(10),
  stress: z.number().min(0).max(10),
  energy: z.number().min(0).max(10),
  text: z.string().max(20000).optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
});

export const entryQuerySchema = z.object({
  from: z.string().optional(), // ISO date string
  to: z.string().optional(),   // ISO date string
});
