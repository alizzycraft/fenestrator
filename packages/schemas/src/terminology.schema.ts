import { z } from 'zod';

export const TerminologyEntrySchema = z.object({
  preferred: z.string().min(1),
  alternatives: z.array(z.string()).default([]),
  avoid: z.array(z.string()).default([]),
  notes: z.string().optional(),
  examples: z.array(z.string()).optional(),
  profileId: z.string().optional(),
  inherited: z.boolean().default(false),
});

export const TerminologyMapSchema = z.record(z.string(), TerminologyEntrySchema);

export type TerminologyEntry = z.infer<typeof TerminologyEntrySchema>;
export type TerminologyMap = z.infer<typeof TerminologyMapSchema>;
