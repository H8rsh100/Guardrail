import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;

/**
 * Validate required environment variables
 */
function validateEnvironment() {
  if (!GITHUB_TOKEN) {
    console.error('Error: GITHUB_TOKEN environment variable is missing in .env file.');
    process.exit(1);
  }
  if (!GITHUB_USERNAME) {
    console.error('Error: GITHUB_USERNAME environment variable is missing in .env file.');
    process.exit(1);
  }
}

validateEnvironment();

console.log('[*] Environment validation passed.');

import { createRepo } from './github.js';

async function main() {
  const repoName = `guardrail-${Date.now()}`;
  console.log(`[*] Generating repository: ${repoName}...`);

  const repo = await createRepo(repoName, GITHUB_TOKEN);
  console.log(`[+] Repository created successfully: ${repo.htmlUrl}`);
}

main().catch((err) => {
  console.error('[!] Orchestrator error:', err.message);
  process.exit(1);
});

