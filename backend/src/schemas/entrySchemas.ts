import { z } from 'zod';

export const createEntrySchema = z.object({
  mood: z.number().min(0).max(10),
  stress: z.number().min(0).max(10),
  energy: z.number().min(0).max(10),
  text: z.string().max(10000, "Text is too long").optional(),
  tags: z.array(z.string().max(50, "Tag is too long")).max(10, "Too many tags").default([])
    .transform((tags) => [...new Set(tags.map((t) => t.trim().toLowerCase()))].filter(Boolean)),
});

export const entryQuerySchema = z.object({
  from: z.string().datetime().optional(), // ISO date string
  to: z.string().datetime().optional(),   // ISO date string
});
