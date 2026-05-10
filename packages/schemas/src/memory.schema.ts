import { z } from 'zod';

export const MemoryStatusSchema = z.enum(['suggested', 'accepted', 'rejected', 'superseded']);
export const MemoryOriginSchema = z.enum(['ai-generated', 'human-authored', 'human-approved']);

export const MemoryRecordSchema = z.object({
  id: z.string().min(1),
  sourceText: z.string().min(1),
  translatedText: z.string().min(1),
  sourceRef: z.string().optional(),
  segmentId: z.string().optional(),
  profileId: z.string(),
  profileVersion: z.string().optional(),
  status: MemoryStatusSchema.default('suggested'),
  origin: MemoryOriginSchema.default('ai-generated'),
  createdAt: z.string().datetime(),
  notes: z.string().optional(),
  supersededBy: z.string().optional(),
});

export type MemoryStatus = z.infer<typeof MemoryStatusSchema>;
export type MemoryOrigin = z.infer<typeof MemoryOriginSchema>;
export type MemoryRecord = z.infer<typeof MemoryRecordSchema>;
