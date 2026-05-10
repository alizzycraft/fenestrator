import { z } from 'zod';

export const ProfileMetaSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  name: z.string().min(1),
  version: z.string().default('0.1.0'),
  description: z.string().optional(),
  inheritsFrom: z.string().nullable().default(null),
});

export type ProfileMeta = z.infer<typeof ProfileMetaSchema>;
