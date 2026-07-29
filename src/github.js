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

/**
 * Recursively walk a directory to collect file paths and UTF-8 content
 * @param {string} dirPath - Absolute path to directory
 * @param {string} baseDir - Base path for relative resolution
 * @returns {Array<{ path: string, content: string }>}
 */
export function collectTemplateFiles(dirPath, baseDir = dirPath) {
  let results = [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(collectTemplateFiles(fullPath, baseDir));
    } else {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const content = fs.readFileSync(fullPath, 'utf-8');
      results.push({ path: relativePath, content });
    }
  }

  return results;
}

/**
 * Push an array of files sequentially to GitHub repo using Contents API
 * @param {string} owner - Repo owner username
 * @param {string} repoName - Target repo name
 * @param {Array<{ path: string, content: string }>} files - List of files to commit
 * @param {string} token - GitHub PAT
 */
export async function pushFiles(owner, repoName, files, token) {
  for (const file of files) {
    const url = `https://api.github.com/repos/${owner}/${repoName}/contents/${file.path}`;
    
    // Check if file already exists to obtain blob SHA if overwriting
    let existingSha;
    try {
      const checkRes = await fetch(url, { method: 'GET', headers: getHeaders(token) });
      if (checkRes.ok) {
        const existingData = await checkRes.json();
        existingSha = existingData.sha;
      }
    } catch {
      // File does not exist yet, proceed with creation
    }

    const base64Content = Buffer.from(file.content).toString('base64');
    const body = {
      message: `Initial commit via Guardrail (${file.path})`,
      content: base64Content
    };
    if (existingSha) {
      body.sha = existingSha;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to push file "${file.path}" to ${owner}/${repoName}: ${response.status} - ${errorText}`);
    }

    console.log(`[+] Pushed file: ${file.path}`);
  }
}

/**
 * Fetch GitHub Actions workflow runs for a repository
 * @param {string} owner - Repo owner username
 * @param {string} repoName - Target repo name
 * @param {string} token - GitHub PAT
 * @returns {Promise<Array<object>>} - List of workflow run objects
 */
export async function getWorkflowRuns(owner, repoName, token) {
  const url = `https://api.github.com/repos/${owner}/${repoName}/actions/runs`;
  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(token)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch workflow runs for ${owner}/${repoName}: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.workflow_runs || [];
}

/**
 * Poll getWorkflowRuns until a run appears, completes, and returns the result
 * @param {string} owner - Repo owner username
 * @param {string} repoName - Target repo name
 * @param {string} token - GitHub PAT
 * @param {number} timeoutMs - Maximum poll time in milliseconds (default 60s)
 * @param {number} pollIntervalMs - Interval between polls in milliseconds (default 5s)
 * @returns {Promise<object>} - Completed workflow run object
 */
export async function pollWorkflowRuns(owner, repoName, token, timeoutMs = 60000, pollIntervalMs = 5000) {
  const startTime = Date.now();
  let lastLoggedStatus = null;

  console.log(`[*] Waiting for GitHub Actions workflow to trigger...`);

  while (Date.now() - startTime < timeoutMs) {
    const runs = await getWorkflowRuns(owner, repoName, token);

    if (runs.length > 0) {
      const latestRun = runs[0];
      const statusKey = `${latestRun.status}:${latestRun.conclusion || 'pending'}`;

      if (statusKey !== lastLoggedStatus) {
        console.log(`[*] Workflow Run #${latestRun.run_number} (${latestRun.name}) - Status: [${latestRun.status}] Conclusion: [${latestRun.conclusion || 'in_progress'}]`);
        lastLoggedStatus = statusKey;
      }

      if (latestRun.status === 'completed') {
        return latestRun;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Timed out after ${timeoutMs / 1000}s waiting for workflow run to complete.`);
}


