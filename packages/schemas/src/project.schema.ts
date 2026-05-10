import { z } from 'zod';

export const ProjectAuthorSchema = z.object({
  email: z.string().email(),
  role: z.enum(['owner', 'collaborator']),
  name: z.string().optional(),
});

export const ProjectManifestSchema = z.object({
  schemaVersion: z.literal(1),
  projectName: z.string().min(1),
  description: z.string().optional(),
  sourceLanguage: z.string().min(2),
  targetLanguage: z.string().min(2),
  defaultProfile: z.string().default('default'),
  createdWith: z.literal('fenestrator'),
  profileSchemaVersion: z.number().int().positive(),
  authors: z.array(ProjectAuthorSchema).default([]),
  createdAt: z.string().datetime().optional(),
});

export type ProjectAuthor = z.infer<typeof ProjectAuthorSchema>;
export type ProjectManifest = z.infer<typeof ProjectManifestSchema>;
