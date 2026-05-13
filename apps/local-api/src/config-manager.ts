import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

export interface ProviderConfig {
  activeProviderId: string;
}

const CONFIG_PATH = path.join(process.cwd(), 'runtime-config.json');
const ENV_PATH = path.join(__dirname, '..', '.env');

export async function getConfig(): Promise<ProviderConfig> {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(data) as ProviderConfig;
  } catch (error) {
    // Return default if not exists
    return { activeProviderId: 'anthropic-api' };
  }
}

export async function saveConfig(config: ProviderConfig): Promise<void> {
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

export async function saveEnvVariables(envVars: Record<string, string>): Promise<void> {
  let existingEnv = '';
  try {
    existingEnv = await fs.readFile(ENV_PATH, 'utf-8');
  } catch (e) {
    // File might not exist
  }

  const parsed = dotenv.parse(existingEnv);
  
  // Merge
  const merged = { ...parsed, ...envVars };
  
  // Reconstruct file
  const newEnvContent = Object.entries(merged)
    .filter(([_, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  await fs.writeFile(ENV_PATH, newEnvContent, 'utf-8');
  
  // Update process.env so it's immediately available without restart
  for (const [k, v] of Object.entries(merged)) {
    if (v) process.env[k] = v;
  }
}
