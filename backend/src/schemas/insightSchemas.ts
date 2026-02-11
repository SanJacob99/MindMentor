import { z } from 'zod';

export const patternQuerySchema = z.object({
  range: z.enum(['30d', '90d']).default('30d'),
});
