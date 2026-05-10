import { z } from 'zod';

export const TranslationOutputKindSchema = z.enum(['literal', 'modernized', 'opinionated', 'alternative']);

export const TranslationOutputSchema = z.object({
  kind: TranslationOutputKindSchema,
  text: z.string(),
  score: z.number().nullable().optional(),
});

export const TranslationExplanationSchema = z.object({
  category: z.enum(['terminology', 'style', 'framing', 'memory', 'conflict', 'validation']),
  sourceTerm: z.string().optional(),
  appliedRule: z.string().optional(),
  description: z.string(),
  profileRule: z.string().optional(),
  memoryRef: z.string().optional(),
});

export const TranslationRequestSchema = z.object({
  contractVersion: z.literal(1),
  projectRoot: z.string(),
  profileId: z.string(),
  sourceText: z.string().min(1),
  sourceRef: z.string().optional(),
  segmentId: z.string().optional(),
  mode: z.enum(['sandbox', 'draft', 'batch']),
  options: z.object({
    variantCount: z.number().int().positive().default(2),
    includeDiagnostics: z.boolean().default(true),
    persistMemorySuggestions: z.boolean().default(false),
  }),
});

export const TranslationResponseSchema = z.object({
  contractVersion: z.literal(1),
  runId: z.string(),
  profileId: z.string(),
  outputs: z.array(TranslationOutputSchema),
  diagnostics: z.array(z.any()),
  memorySuggestions: z.array(z.any()),
  explanations: z.array(TranslationExplanationSchema),
});

export type TranslationOutputKind = z.infer<typeof TranslationOutputKindSchema>;
export type TranslationOutput = z.infer<typeof TranslationOutputSchema>;
export type TranslationExplanation = z.infer<typeof TranslationExplanationSchema>;
export type TranslationRequest = z.infer<typeof TranslationRequestSchema>;
export type TranslationResponse = z.infer<typeof TranslationResponseSchema>;
