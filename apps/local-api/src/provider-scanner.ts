import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CliProvider {
  id: string;
  name: string;
  command: string;
  version?: string;
  isAvailable: boolean;
  type: 'cli';
}

const POTENTIAL_CLIS = [
  { id: 'claude-cli', name: 'Claude CLI', command: 'claude' },
  { id: 'codex-cli', name: 'Codex CLI', command: 'codex' },
  { id: 'opencode-cli', name: 'OpenCode CLI', command: 'opencode' },
];

export async function scanForCliProviders(): Promise<CliProvider[]> {
  const results: CliProvider[] = [];

  for (const cli of POTENTIAL_CLIS) {
    try {
      // Run the command with --version or --help to see if it exists
      const { stdout } = await execAsync(`${cli.command} --version`);
      results.push({
        ...cli,
        version: stdout.trim(),
        isAvailable: true,
        type: 'cli'
      });
    } catch (error) {
      // Command failed or not found, try --help as fallback
      try {
        await execAsync(`${cli.command} --help`);
        results.push({
          ...cli,
          isAvailable: true,
          type: 'cli'
        });
      } catch (e) {
        // Not found
        results.push({
          ...cli,
          isAvailable: false,
          type: 'cli'
        });
      }
    }
  }

  return results;
}
