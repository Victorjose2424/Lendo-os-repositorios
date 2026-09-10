export type RepoStatus = 'cloning' | 'building' | 'running' | 'stopped' | 'error';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'cmd';
  message: string;
  tag?: 'git' | 'npm' | 'vite' | 'system' | 'runtime';
}

export interface RepoFile {
  path: string;
  size: string;
  type: 'file' | 'dir';
}

export interface RepositoryItem {
  id: string;
  name: string;
  fullName: string; // e.g. "usuario/repositorio"
  owner: string;
  gitUrl: string;
  branch: string;
  status: RepoStatus;
  port: number;
  addedAt: string;
  description: string;
  stars: number;
  forks: number;
  language: string;
  framework?: string;
  demoType: 'sparkle-box' | 'jarvis' | 'game-2048' | 'markdown-notes' | 'custom-iframe' | 'generic-app';
  demoUrl?: string;
  logs: LogEntry[];
  files: RepoFile[];
  readmePreview: string;
  envVars?: Record<string, string>;
  dependencies?: Record<string, string>;
}
