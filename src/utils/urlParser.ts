/**
 * Robust URL and Git Repository parser for GitRepo Hub
 * Supports:
 * - https://github.com/owner/repo.git
 * - https://github.com/owner/repo
 * - https://github.com/owner/repo/ (trailing slashes)
 * - https://github.com/owner/repo/tree/branch-name
 * - git clone https://github.com/owner/repo.git
 * - git@github.com:owner/repo.git
 * - github.com/owner/repo
 * - owner/repo (shorthand)
 * - Direct Web App URLs (https://example.com, https://*.github.io/*, https://*.vercel.app)
 */

export interface ParsedUrlInfo {
  isValid: boolean;
  type: 'github' | 'git' | 'web-app';
  owner: string;
  repoName: string;
  fullName: string;
  cleanGitUrl: string;
  branch: string;
  webAppUrl?: string;
  rawInput: string;
  errorMessage?: string;
}

export interface GitHubApiData {
  name?: string;
  fullName?: string;
  description?: string;
  stars?: number;
  forks?: number;
  language?: string;
  defaultBranch?: string;
  homepage?: string;
  readme?: string;
  isRealGitHub?: boolean;
}

export function parseGitOrWebUrl(raw: string): ParsedUrlInfo {
  if (!raw || typeof raw !== 'string') {
    return {
      isValid: false,
      type: 'git',
      owner: '',
      repoName: '',
      fullName: '',
      cleanGitUrl: '',
      branch: 'main',
      rawInput: raw,
      errorMessage: 'Por favor, insira um link ou nome de repositório.',
    };
  }

  let text = raw.trim();

  // Strip wrapping quotes
  text = text.replace(/^["']+|["']+$/g, '').trim();

  // Strip git clone command prefix if present (e.g. "git clone https://...")
  text = text.replace(/^git\s+clone(\s+--?[a-zA-Z0-9_-]+(\s+[^\s]+)?)*\s+/i, '').trim();

  // Convert SSH format: git@github.com:owner/repo.git -> https://github.com/owner/repo.git
  if (text.startsWith('git@github.com:')) {
    text = 'https://github.com/' + text.substring('git@github.com:'.length);
  } else if (text.startsWith('git@gitlab.com:')) {
    text = 'https://gitlab.com/' + text.substring('git@gitlab.com:'.length);
  }

  // Handle github.com/owner/repo without protocol
  if (text.startsWith('github.com/') || text.startsWith('www.github.com/')) {
    text = 'https://' + text.replace(/^www\./, '');
  }

  // Extract branch if user pasted a tree/blob URL (e.g. https://github.com/owner/repo/tree/main)
  let extractedBranch = 'main';
  const treeMatch = text.match(/\/tree\/([^/]+)/) || text.match(/\/blob\/([^/]+)/);
  if (treeMatch) {
    extractedBranch = treeMatch[1];
    text = text.replace(/\/(tree|blob)\/[^/]+.*$/, '');
  }

  // Clean trailing slash & .git
  text = text.replace(/\/+$/, '');

  // Case 1: Standard GitHub URL (https://github.com/owner/repo)
  const githubRegex = /^https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/i;
  const githubMatch = text.match(githubRegex);
  if (githubMatch) {
    const owner = githubMatch[1];
    let repoName = githubMatch[2].replace(/\.git$/i, '');
    const fullName = `${owner}/${repoName}`;
    const cleanGitUrl = `https://github.com/${owner}/${repoName}.git`;

    return {
      isValid: true,
      type: 'github',
      owner,
      repoName,
      fullName,
      cleanGitUrl,
      branch: extractedBranch,
      rawInput: raw,
    };
  }

  // Case 2: Shorthand owner/repo format (e.g. "facebook/react" or "usuario/projeto")
  const shorthandRegex = /^([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)$/;
  const shorthandMatch = text.match(shorthandRegex);
  if (shorthandMatch && !text.includes('://')) {
    const owner = shorthandMatch[1];
    const repoName = shorthandMatch[2].replace(/\.git$/i, '');
    const fullName = `${owner}/${repoName}`;
    const cleanGitUrl = `https://github.com/${owner}/${repoName}.git`;

    return {
      isValid: true,
      type: 'github',
      owner,
      repoName,
      fullName,
      cleanGitUrl,
      branch: extractedBranch,
      rawInput: raw,
    };
  }

  // Case 3: Other Git hosting (GitLab, Bitbucket, self-hosted git)
  if (text.includes('.git') || text.includes('gitlab.com') || text.includes('bitbucket.org')) {
    const cleanNoGit = text.replace(/\.git$/i, '');
    const parts = cleanNoGit.split('/').filter(Boolean);
    const repoName = parts[parts.length - 1] || 'modulo';
    const owner = parts[parts.length - 2] || 'git';
    const fullName = `${owner}/${repoName}`;
    const cleanGitUrl = text.endsWith('.git') ? text : `${text}.git`;

    return {
      isValid: true,
      type: 'git',
      owner,
      repoName,
      fullName,
      cleanGitUrl,
      branch: extractedBranch,
      rawInput: raw,
    };
  }

  // Case 4: Web Application Live Link (e.g. GitHub Pages, Vercel, deployed URL)
  if (text.startsWith('http://') || text.startsWith('https://')) {
    try {
      const parsedUrl = new URL(text);
      const hostParts = parsedUrl.hostname.split('.');
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);

      // Check if it is a github.io URL: https://owner.github.io/repo
      if (parsedUrl.hostname.endsWith('github.io')) {
        const owner = hostParts[0];
        const repoName = pathParts[0] || 'web-app';
        return {
          isValid: true,
          type: 'web-app',
          owner,
          repoName,
          fullName: `${owner}/${repoName}`,
          cleanGitUrl: `https://github.com/${owner}/${repoName}.git`,
          webAppUrl: text,
          branch: 'gh-pages',
          rawInput: raw,
        };
      }

      const domainName = hostParts.length >= 2 ? hostParts[hostParts.length - 2] : 'app';
      const appName = pathParts[pathParts.length - 1] || domainName;
      return {
        isValid: true,
        type: 'web-app',
        owner: domainName,
        repoName: appName,
        fullName: `${domainName}/${appName}`,
        cleanGitUrl: text,
        webAppUrl: text,
        branch: 'main',
        rawInput: raw,
      };
    } catch {
      // Fall through to error
    }
  }

  return {
    isValid: false,
    type: 'git',
    owner: '',
    repoName: '',
    fullName: '',
    cleanGitUrl: '',
    branch: 'main',
    rawInput: raw,
    errorMessage:
      'Link inválido. Cole um link do GitHub (ex: https://github.com/usuario/repositorio.git) ou usuário/repositório.',
  };
}

/**
 * Fetch real details from GitHub API with graceful timeout & fallback
 */
export async function fetchGitHubRepoDetails(
  owner: string,
  repoName: string,
  defaultBranch = 'main'
): Promise<GitHubApiData> {
  const result: GitHubApiData = {
    name: repoName,
    fullName: `${owner}/${repoName}`,
    language: 'TypeScript / React',
    defaultBranch: defaultBranch,
    isRealGitHub: false,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.github.v3+json',
      },
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      result.name = data.name || repoName;
      result.fullName = data.full_name || `${owner}/${repoName}`;
      result.description = data.description || '';
      result.stars = data.stargazers_count ?? 0;
      result.forks = data.forks_count ?? 0;
      result.language = data.language || 'JavaScript / TypeScript';
      result.defaultBranch = data.default_branch || defaultBranch;
      result.homepage = data.homepage || '';
      result.isRealGitHub = true;

      // Try fetching README from raw.githubusercontent.com
      try {
        const readmeBranch = data.default_branch || defaultBranch;
        const readmeRes = await fetch(
          `https://raw.githubusercontent.com/${owner}/${repoName}/${readmeBranch}/README.md`
        );
        if (readmeRes.ok) {
          result.readme = await readmeRes.text();
        }
      } catch {
        // Ignore readme fetch error
      }
    }
  } catch {
    // Graceful fallback when rate-limited or offline
    clearTimeout(timeoutId);
  }

  return result;
}
