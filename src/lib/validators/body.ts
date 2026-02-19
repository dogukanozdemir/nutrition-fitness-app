import { z } from "zod";

export const ingestBodySchema = z.object({
  userEmail: z.string().email(),
  measuredAt: z.string().datetime(),
  weightKg: z.number().positive(),
  bodyFatPercent: z.number().min(0).max(100).optional(),
  leanMassKg: z.number().positive().optional(),
  waistCm: z.number().positive().optional(),
});
