import Fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import path from 'path';
import simpleGit from 'simple-git';
import { scanForCliProviders } from './provider-scanner';
import { getConfig, saveConfig, saveEnvVariables } from './config-manager';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

server.get('/api/settings/providers', async (request, reply) => {
  try {
    const clis = await scanForCliProviders();
    const config = await getConfig();
    
    // Add online providers
    const providers = [
      ...clis,
      { id: 'anthropic-api', name: 'Anthropic API (Online)', type: 'online', isAvailable: true }
    ];

    return {
      activeProviderId: config.activeProviderId,
      providers,
      hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY
    };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Failed to fetch providers' });
  }
});

server.post<{ Body: { activeProviderId: string; anthropicKey?: string } }>('/api/settings/providers', async (request, reply) => {
  try {
    const { activeProviderId, anthropicKey } = request.body;
    
    await saveConfig({ activeProviderId });
    
    if (anthropicKey) {
      await saveEnvVariables({ ANTHROPIC_API_KEY: anthropicKey });
      if (anthropic) {
        anthropic.apiKey = anthropicKey;
      }
    }

    return { success: true };
  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Failed to save provider config' });
  }
});

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

server.post<{ Body: { request: any } }>('/api/runtime/translate', async (request, reply) => {
  try {
    const { request: req } = request.body;
    const config = await getConfig();

    let payload: any;

    if (config.activeProviderId === 'anthropic-api') {
      // Use Anthropic API
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

      payload = toolCall.input;
    } else {
      // Use CLI
      const clis = await scanForCliProviders();
      const activeCli = clis.find(c => c.id === config.activeProviderId);
      
      if (!activeCli || !activeCli.isAvailable) {
        throw new Error(`CLI provider ${config.activeProviderId} is not available.`);
      }

      // Build monolithic prompt
      const systemPrompt = `You are a specialized translation engine. Your goal is to modernize texts based on specific interpretation rules.
Return ONLY valid JSON and no other text. Do not include markdown formatting, conversational text, or any explanations outside of the JSON structure.
The JSON must match this structure:
{
  "outputs": [{ "kind": "literal"|"modernized"|"opinionated"|"alternative", "text": "..." }],
  "explanations": [{ "category": "terminology"|"style"|"framing"|"memory"|"conflict"|"validation", "description": "...", "sourceTerm": "..." }],
  "diagnostics": [],
  "memorySuggestions": [{ "sourceText": "...", "translatedText": "..." }]
}`;
      const userPrompt = `Source text: ${req.sourceText}\n\nPlease translate this.`;
      
      // Escape prompt for shell
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`.replace(/"/g, '\\"');
      
      // Execute
      const { stdout } = await execAsync(`${activeCli.command} -p "${fullPrompt}"`);
      
      // Parse JSON
      let jsonStr = stdout;
      const match = stdout.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        jsonStr = match[1];
      } else {
        const start = stdout.indexOf('{');
        const end = stdout.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end >= start) {
          jsonStr = stdout.substring(start, end + 1);
        }
      }

      payload = JSON.parse(jsonStr);
    }

    // Format memory suggestions
    const memorySuggestions = payload.memorySuggestions?.map((m: any, i: number) => ({
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
