/**
 * Dokploy Automation Manager for DevMatrix-Core Agent
 * Automatically creates applications, sets environment variables, and triggers deployments in Dokploy.
 */

const fs = require('fs');
const path = require('path');

// 1. Load .env.agent
function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env.agent');
  if (!fs.existsSync(envPath)) {
    throw new Error(`.env.agent not found at ${envPath}`);
  }
  const content = fs.readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const env = loadEnv();
const DOKPLOY_URL = env.DOKPLOY_URL || 'https://dokploy.akstack.com';
const API_KEY = env.DOKPLOY_API_KEY;
const DEFAULT_ENV_ID = env.DOKPLOY_ENVIRONMENT_ID;

if (!API_KEY) {
  console.error("Error: DOKPLOY_API_KEY is not defined in .env.agent");
  process.exit(1);
}

async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `${DOKPLOY_URL}/api/${endpoint}`;
  const headers = {
    'x-api-key': API_KEY,
    'accept': 'application/json',
  };
  if (body) {
    headers['content-type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }

  if (!response.ok) {
    throw new Error(`Dokploy API request to ${endpoint} failed with HTTP ${response.status}: ${typeof json === 'object' ? JSON.stringify(json) : json}`);
  }

  return json;
}

async function main() {
  const [,, command, ...args] = process.argv;

  try {
    switch (command) {
      case 'create-app': {
        const [appName] = args;
        if (!appName) {
          console.error("Usage: node dokploy-manager.js create-app <app-name>");
          process.exit(1);
        }
        console.log(`Creating application "${appName}" in environment ${DEFAULT_ENV_ID}...`);
        const result = await apiRequest('application.create', 'POST', {
          name: appName,
          environmentId: DEFAULT_ENV_ID,
          sourceType: 'github'
        });
        console.log(`Application created successfully!`);
        console.log(`Application ID: ${result.applicationId}`);
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'set-env': {
        const [appId, envFilePath] = args;
        if (!appId || !envFilePath) {
          console.error("Usage: node dokploy-manager.js set-env <appId> <envFilePath>");
          process.exit(1);
        }
        const envContent = fs.readFileSync(path.resolve(process.cwd(), envFilePath), 'utf8');
        console.log(`Setting environment variables for application ${appId}...`);
        const result = await apiRequest('application.saveEnvironment', 'POST', {
          applicationId: appId,
          env: envContent,
          buildArgs: null,
          buildSecrets: null,
          createEnvFile: true
        });
        console.log(`Environment variables saved for application ${appId}`);
        break;
      }

      case 'add-domain': {
        const [appId, domainHost] = args;
        if (!appId || !domainHost) {
          console.error("Usage: node dokploy-manager.js add-domain <appId> <domainHost>");
          process.exit(1);
        }
        console.log(`Adding domain ${domainHost} to application ${appId}...`);
        const result = await apiRequest('domain.create', 'POST', {
          host: domainHost,
          port: 3000,
          path: '/',
          https: true,
          certificateType: 'letsencrypt',
          applicationId: appId
        });
        console.log(`Domain created successfully:`, result);
        break;
      }

      case 'link-github': {
        const [appId, owner, repo, branch = 'main'] = args;
        if (!appId || !owner || !repo) {
          console.error("Usage: node dokploy-manager.js link-github <appId> <owner> <repo> [branch]");
          process.exit(1);
        }
        const githubId = env.DOKPLOY_GITHUB_ID || 'Pv2FSdTA4zaVCFs5CyQCX';
        console.log(`Linking GitHub repository ${owner}/${repo} (${branch}) with githubId ${githubId} to application ${appId}...`);
        const result = await apiRequest('application.saveGithubProvider', 'POST', {
          applicationId: appId,
          owner: owner,
          repository: repo,
          branch: branch,
          githubId: githubId,
          buildPath: ""
        });
        console.log(`GitHub repository linked successfully!`);
        break;
      }

      case 'link-git': {
        const [appId, gitUrl, branch = 'main'] = args;
        if (!appId || !gitUrl) {
          console.error("Usage: node dokploy-manager.js link-git <appId> <gitUrl> [branch]");
          process.exit(1);
        }
        console.log(`Linking Git URL ${gitUrl} (${branch}) to application ${appId}...`);
        const result = await apiRequest('application.saveGitProvider', 'POST', {
          applicationId: appId,
          customGitUrl: gitUrl,
          customGitBranch: branch,
          customGitBuildPath: "",
          watchPaths: []
        });
        console.log(`Git URL linked successfully!`);
        break;
      }

      case 'update-build-type': {
        const [appId, buildType = 'dockerfile', dockerfile = 'Dockerfile'] = args;
        if (!appId) {
          console.error("Usage: node dokploy-manager.js update-build-type <appId> [buildType] [dockerfile]");
          process.exit(1);
        }
        console.log(`Updating application ${appId} buildType to "${buildType}"...`);
        const result = await apiRequest('application.update', 'POST', {
          applicationId: appId,
          buildType: buildType,
          dockerfile: dockerfile
        });
        console.log(`Application buildType updated successfully:`, result);
        break;
      }

      case 'deploy': {
        const [appId] = args;
        if (!appId) {
          console.error("Usage: node dokploy-manager.js deploy <appId>");
          process.exit(1);
        }
        console.log(`Triggering deployment for application ${appId}...`);
        const result = await apiRequest('application.deploy', 'POST', {
          applicationId: appId
        });
        console.log(`Deployment triggered successfully:`, result);
        break;
      }

      case 'get-app': {
        const [appId] = args;
        if (!appId) {
          console.error("Usage: node dokploy-manager.js get-app <appId>");
          process.exit(1);
        }
        const result = await apiRequest(`application.one?applicationId=${encodeURIComponent(appId)}`, 'GET');
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      case 'read-logs': {
        const [depId] = args;
        if (!depId) {
          console.error("Usage: node dokploy-manager.js read-logs <deploymentId>");
          process.exit(1);
        }
        const result = await apiRequest(`deployment.readLogs?deploymentId=${encodeURIComponent(depId)}`, 'GET');
        console.log(result);
        break;
      }

      case 'list-projects': {
        const result = await apiRequest('project.all', 'GET');
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      default:
        console.log(`Available commands:
  list-projects
  create-app <name>
  set-env <appId> <envFilePath>
  deploy <appId>
  get-app <appId>
        `);
        break;
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
