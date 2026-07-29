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
