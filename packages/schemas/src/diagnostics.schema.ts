import { z } from 'zod';

export const DiagnosticSeveritySchema = z.enum(['error', 'warning', 'info']);

export const DiagnosticSchema = z.object({
  code: z.string(),
  severity: DiagnosticSeveritySchema,
  message: z.string(),
  sourceTerm: z.string().optional(),
  outputTerm: z.string().optional(),
  profileRule: z.string().optional(),
  segmentId: z.string().optional(),
  runId: z.string().optional(),
});

export type DiagnosticSeverity = z.infer<typeof DiagnosticSeveritySchema>;
export type Diagnostic = z.infer<typeof DiagnosticSchema>;
