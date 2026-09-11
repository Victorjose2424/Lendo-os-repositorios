/**
 * GitHub API and AI Prompt Service for GitRepo Hub
 */

const TOKEN_STORAGE_KEY = 'gitrepo_gh_token';

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  html_url: string;
}

export interface GitHubCommitResult {
  success: boolean;
  commitSha?: string;
  commitUrl?: string;
  newFileSha?: string;
  error?: string;
}

export interface AiPromptResult {
  success: boolean;
  updatedCode: string;
  summary: string;
  explanation: string;
  error?: string;
}

export interface RepoFileInfo {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
  download_url: string | null;
  content?: string;
}

export function getGitHubToken(): string {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setGitHubToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token.trim());
  } catch {
    // ignore
  }
}

export function clearGitHubToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Verify GitHub token and fetch authenticated user info
 */
export async function verifyGitHubToken(token: string): Promise<{ isValid: boolean; user?: GitHubUser; error?: string }> {
  if (!token || !token.trim()) {
    return { isValid: false, error: 'Token não fornecido.' };
  }

  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (res.ok) {
      const data = (await res.json()) as GitHubUser;
      return { isValid: true, user: data };
    } else {
      const errData = await res.json().catch(() => ({}));
      return {
        isValid: false,
        error: errData.message || `Falha na autenticação (${res.status} ${res.statusText}).`,
      };
    }
  } catch (err: any) {
    return {
      isValid: false,
      error: err?.message || 'Erro de conexão com o GitHub.',
    };
  }
}

/**
 * Fetch list of files in a repository directory
 */
export async function fetchRepoContents(
  owner: string,
  repo: string,
  path = '',
  branch = 'main',
  token?: string
): Promise<RepoFileInfo[]> {
  const cleanPath = path.replace(/^\/+/, '');
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${cleanPath}?ref=${branch}`;

  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  };
  const activeToken = token || getGitHubToken();
  if (activeToken) {
    headers.Authorization = `Bearer ${activeToken}`;
  }

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      return [];
    }
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        name: item.name,
        path: item.path,
        sha: item.sha,
        size: item.size || 0,
        type: item.type === 'dir' ? 'dir' : 'file',
        download_url: item.download_url,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Fetch raw file content with fallback
 */
export async function fetchFileContent(
  owner: string,
  repo: string,
  filePath: string,
  branch = 'main',
  token?: string
): Promise<{ content: string; sha?: string }> {
  const activeToken = token || getGitHubToken();

  // Try GitHub API first to get both SHA and content
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (activeToken) {
      headers.Authorization = `Bearer ${activeToken}`;
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`;
    const apiRes = await fetch(apiUrl, { headers });

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data.content && data.encoding === 'base64') {
        const decoded = decodeBase64Utf8(data.content);
        return { content: decoded, sha: data.sha };
      }
    }
  } catch {
    // fallback to raw
  }

  // Fallback to raw.githubusercontent.com
  try {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
    const rawRes = await fetch(rawUrl);
    if (rawRes.ok) {
      const text = await rawRes.text();
      return { content: text };
    }
  } catch {
    // ignore
  }

  // Fallback to server-side proxy
  try {
    const proxyUrl = `/api/proxy-github-file?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(filePath)}&branch=${encodeURIComponent(branch)}`;
    const proxyRes = await fetch(proxyUrl);
    if (proxyRes.ok) {
      const pData = await proxyRes.json();
      if (pData.content) {
        return { content: pData.content };
      }
    }
  } catch {
    // ignore
  }

  return { content: '' };
}

/**
 * Commit and push a modified file directly to GitHub
 */
export async function commitFileToGitHub(options: {
  owner: string;
  repo: string;
  path: string;
  content: string;
  message: string;
  sha?: string;
  branch?: string;
  token?: string;
}): Promise<GitHubCommitResult> {
  const token = options.token || getGitHubToken();
  if (!token) {
    return {
      success: false,
      error: 'Token do GitHub não configurado. Adicione o seu Personal Access Token para gravar no repositório.',
    };
  }

  const branch = options.branch || 'main';
  const cleanPath = options.path.replace(/^\/+/, '');

  try {
    // Step 1: Ensure we have the latest SHA for the file to prevent conflicts
    let fileSha = options.sha;
    try {
      const checkRes = await fetch(
        `https://api.github.com/repos/${options.owner}/${options.repo}/contents/${cleanPath}?ref=${branch}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      if (checkRes.ok) {
        const existingData = await checkRes.json();
        fileSha = existingData.sha;
      }
    } catch {
      // Continue with provided sha
    }

    // Step 2: Encode content safely to UTF-8 base64
    const base64Content = encodeBase64Utf8(options.content);

    // Step 3: Put contents
    const putUrl = `https://api.github.com/repos/${options.owner}/${options.repo}/contents/${cleanPath}`;
    const payload: any = {
      message: options.message || `Update ${cleanPath} via GitRepo Hub AI`,
      content: base64Content,
      branch: branch,
    };
    if (fileSha) {
      payload.sha = fileSha;
    }

    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (putRes.ok) {
      const resultData = await putRes.json();
      const commitSha = resultData.commit?.sha;
      const commitUrl =
        resultData.commit?.html_url ||
        `https://github.com/${options.owner}/${options.repo}/commit/${commitSha}`;
      const newFileSha = resultData.content?.sha;

      return {
        success: true,
        commitSha,
        commitUrl,
        newFileSha,
      };
    } else {
      const errorJson = await putRes.json().catch(() => ({}));
      return {
        success: false,
        error: errorJson.message || `Erro ao gravar no GitHub (${putRes.status} ${putRes.statusText}).`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Erro inesperado de comunicação com a API do GitHub.',
    };
  }
}

/**
 * Call Server-Side Gemini API to modify file code based on natural language prompt
 */
export async function requestAiPromptEdit(params: {
  filePath: string;
  fileContent: string;
  prompt: string;
  repoName: string;
}): Promise<AiPromptResult> {
  try {
    const res = await fetch('/api/prompt-edit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        updatedCode: params.fileContent,
        summary: '',
        explanation: '',
        error: errData.error || `Erro no servidor (${res.status} ${res.statusText})`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      updatedCode: data.updatedCode,
      summary: data.summary,
      explanation: data.explanation,
    };
  } catch (err: any) {
    return {
      success: false,
      updatedCode: params.fileContent,
      summary: '',
      explanation: '',
      error: err?.message || 'Falha ao comunicar com o serviço de IA.',
    };
  }
}

export interface ChatCopilotResult {
  success: boolean;
  targetFile: string;
  replyText: string;
  summary: string;
  explanation: string;
  updatedCode: string;
  suggestedFollowUps?: string[];
  error?: string;
}

/**
 * Call Server-Side Gemini Chat Copilot to converse and generate improvements directly on cloned repos
 */
export async function requestRepoChatCopilot(params: {
  userMessage: string;
  repoName: string;
  targetFile?: string;
  fileContent?: string;
  availableFiles?: { path: string; size?: string }[];
  chatHistory?: { sender: 'user' | 'assistant'; text: string }[];
}): Promise<ChatCopilotResult> {
  try {
    const res = await fetch('/api/chat-copilot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return {
        success: false,
        targetFile: params.targetFile || 'index.html',
        replyText: 'Desculpe, ocorreu um erro ao gerar as melhorias com a IA.',
        summary: '',
        explanation: '',
        updatedCode: params.fileContent || '',
        error: errData.error || `Erro no servidor (${res.status} ${res.statusText})`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      targetFile: data.targetFile || params.targetFile || 'index.html',
      replyText: data.replyText,
      summary: data.summary,
      explanation: data.explanation,
      updatedCode: data.updatedCode,
      suggestedFollowUps: data.suggestedFollowUps,
    };
  } catch (err: any) {
    return {
      success: false,
      targetFile: params.targetFile || 'index.html',
      replyText: 'Falha de comunicação com o servidor de IA.',
      summary: '',
      explanation: '',
      updatedCode: params.fileContent || '',
      error: err?.message || 'Erro de conexão com o Copilot.',
    };
  }
}

// Helpers for safe Base64 UTF-8 handling
function encodeBase64Utf8(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function toSolidBytes(_match, p1) {
      return String.fromCharCode(parseInt(p1, 16));
    })
  );
}

function decodeBase64Utf8(base64: string): string {
  const clean = base64.replace(/\s+/g, '');
  return decodeURIComponent(
    atob(clean)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );
}
