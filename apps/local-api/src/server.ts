import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import path from 'path';
import simpleGit from 'simple-git';

// Load .env
dotenv.config();

const server = Fastify({ logger: true });

// Setup CORS so the desktop-ui can hit this API
server.register(cors, {
  origin: '*',
});

server.get('/api/health', async (request, reply) => {
  return { status: 'ok', mode: 'desktop' };
});

const git = simpleGit(process.cwd());

server.get('/api/git/status', async (request, reply) => {
  try {
    const status = await git.status();
    const changedFiles = status.files.map(f => {
      let state = 'modified';
      if (f.index === 'A' || f.working_dir === 'A') state = 'added';
      if (f.index === 'D' || f.working_dir === 'D') state = 'deleted';
      if (f.index === '?' || f.working_dir === '?') state = 'untracked';
      
      let area = 'root';
      if (f.path.startsWith('profiles/')) area = 'profile';
      else if (f.path.startsWith('memory/')) area = 'memory';
      else if (f.path.startsWith('source/')) area = 'source';
      else if (f.path.startsWith('apps/')) area = 'app';
      
      return { path: f.path, state, area };
    });
    
    return {
      branch: status.current,
      isDirty: !status.isClean(),
      changedFiles
    };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Git status failed' });
  }
});

server.post<{ Body: { message: string } }>('/api/git/commit', async (request, reply) => {
  try {
    const { message } = request.body;
    await git.add('.');
    await git.commit(message);
    return { success: true };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Git commit failed' });
  }
});

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

server.post<{ Body: { request: any } }>('/api/runtime/translate', async (request, reply) => {
  try {
    const { request: req } = request.body;
    
    // We'll use tool use to force Anthropic to output our schema
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1024,
      system: "You are a specialized translation engine. Your goal is to modernize texts based on specific interpretation rules. Output your translation result using the 'submit_translation' tool.",
      messages: [
        { role: 'user', content: `Source text: ${req.sourceText}\n\nPlease translate this.` }
      ],
      tools: [
        {
          name: 'submit_translation',
          description: 'Submits the translation outputs, explanations, diagnostics, and memory suggestions.',
          input_schema: {
            type: 'object',
            properties: {
              outputs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    kind: { type: 'string', enum: ['literal', 'modernized', 'opinionated', 'alternative'] },
                    text: { type: 'string' }
                  },
                  required: ['kind', 'text']
                }
              },
              explanations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    category: { type: 'string', enum: ['terminology', 'style', 'framing', 'memory', 'conflict', 'validation'] },
                    description: { type: 'string' },
                    sourceTerm: { type: 'string' }
                  },
                  required: ['category', 'description']
                }
              },
              diagnostics: { type: 'array', items: { type: 'object' } },
              memorySuggestions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    sourceText: { type: 'string' },
                    translatedText: { type: 'string' }
                  },
                  required: ['sourceText', 'translatedText']
                }
              }
            },
            required: ['outputs', 'explanations', 'diagnostics', 'memorySuggestions']
          }
        }
      ],
      tool_choice: { type: 'tool', name: 'submit_translation' }
    });

    const toolCall = response.content.find((c: any) => c.type === 'tool_use') as any;
    if (!toolCall) throw new Error("No tool call returned");

    const payload = toolCall.input;
    
    // Format memory suggestions
    const memorySuggestions = payload.memorySuggestions.map((m: any, i: number) => ({
      id: `msug-${Date.now()}-${i}`,
      sourceText: m.sourceText,
      translatedText: m.translatedText,
      origin: 'claude-3.7-sonnet'
    }));

    return {
      contractVersion: 1,
      runId: `run-${Date.now()}`,
      profileId: req.profileId,
      outputs: payload.outputs,
      diagnostics: payload.diagnostics,
      memorySuggestions,
      explanations: payload.explanations
    };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Translation failed' });
  }
});

const start = async () => {
  try {
    await server.listen({ port: 3000, host: '127.0.0.1' });
    console.log('Local API running at http://127.0.0.1:3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
