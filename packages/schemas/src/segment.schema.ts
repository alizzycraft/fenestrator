import { z } from 'zod';

export const SegmentMetadataSchema = z.record(z.string(), z.unknown());

export const SegmentSchema = z.object({
  id: z.string().min(1),
  sourcePath: z.string(),
  position: z.number().int().nonnegative(),
  text: z.string(),
  metadata: SegmentMetadataSchema.default({}),
  status: z.enum(['new', 'draft', 'reviewed', 'accepted', 'warning']).default('new'),
});

export type Segment = z.infer<typeof SegmentSchema>;
