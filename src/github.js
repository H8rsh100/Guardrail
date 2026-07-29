import fs from 'fs';
import path from 'path';

/**
 * GitHub API Wrapper for Guardrail
 */

/**
 * Helper to retrieve headers for GitHub API requests
 */
function getHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'Guardrail-App',
    'Content-Type': 'application/json'
  };
}

/**
 * Create a new public repository on GitHub
 * @param {string} repoName - Name of the repository to create
 * @param {string} token - GitHub PAT
 * @returns {Promise<{ cloneUrl: string, defaultBranch: string, owner: string, htmlUrl: string }>}
 */
export async function createRepo(repoName, token) {
  const url = 'https://api.github.com/user/repos';
  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({
      name: repoName,
      auto_init: true,
      private: false
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to create repository "${repoName}": ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  return {
    cloneUrl: data.clone_url,
    defaultBranch: data.default_branch || 'main',
    owner: data.owner.login,
    htmlUrl: data.html_url
  };
}
