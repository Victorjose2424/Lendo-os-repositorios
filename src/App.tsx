import React, { useState, useEffect } from 'react';
import { RepositoryItem, LogEntry, RepoStatus, RepoFile } from './types';
import { Navbar } from './components/Navbar';
import { RepoAddBar, AddRepoResult } from './components/RepoAddBar';
import { Sidebar } from './components/Sidebar';
import { AppViewer } from './components/AppViewer';
import { DeleteConfirmModal, DeleteModalState } from './components/DeleteConfirmModal';
import { parseGitOrWebUrl, fetchGitHubRepoDetails } from './utils/urlParser';
import { fetchRepoContents } from './utils/githubService';
import { createRenderahouseRepo } from './utils/repoBootstrap';
import { FolderGit2, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'gitrepo_hub_modules_v1';

export default function App() {
  const [repos, setRepos] = useState<RepositoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    // Auto-seed with the user's renderahouse-max repo ready to run
    return [createRenderahouseRepo()];
  });

  const [selectedRepoId, setSelectedRepoId] = useState<string>(() => {
    return repos[0]?.id || 'repo-renderahouse-max';
  });

  const [isImporting, setIsImporting] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return true; // Default to dark developer atmosphere
  });
  const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
    isOpen: false,
    type: 'single',
    repo: null,
  });
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(repos));
    } catch {
      // ignore
    }
  }, [repos]);

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const selectedRepo = repos.find((r) => r.id === selectedRepoId) || repos[0];

  // Helper to append a log entry
  const appendLog = (
    repoId: string,
    message: string,
    level: LogEntry['level'] = 'info',
    tag?: LogEntry['tag']
  ) => {
    const newLog: LogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      tag,
      message,
    };

    setRepos((prev) =>
      prev.map((r) => (r.id === repoId ? { ...r, logs: [...r.logs, newLog] } : r))
    );
  };

  // Import and execute new repository or activate existing
  const handleAddRepo = async (rawUrl: string): Promise<AddRepoResult> => {
    const parsed = parseGitOrWebUrl(rawUrl);

    if (!parsed.isValid) {
      return {
        success: false,
        message:
          parsed.errorMessage ||
          'Link inválido. Cole uma URL do GitHub válida (ex: https://github.com/usuario/repositorio.git) ou usuário/repositório.',
      };
    }

    // Check if repo ALREADY exists in state
    const existing = repos.find(
      (r) =>
        r.fullName.toLowerCase() === parsed.fullName.toLowerCase() ||
        r.gitUrl.toLowerCase() === parsed.cleanGitUrl.toLowerCase() ||
        (r.name.toLowerCase() === parsed.repoName.toLowerCase() &&
          r.owner.toLowerCase() === parsed.owner.toLowerCase())
    );

    if (existing) {
      // Select it immediately!
      setSelectedRepoId(existing.id);

      // If it was stopped, automatically start it
      if (existing.status !== 'running') {
        handleStart(existing.id);
      } else {
        appendLog(
          existing.id,
          `Repositório "${existing.fullName}" selecionado e ativo no painel de controle (porta :${existing.port}).`,
          'success',
          'system'
        );
      }

      return {
        success: true,
        isExisting: true,
        repoId: existing.id,
        message: `Repositório "${existing.fullName}" já cadastrado! Ativado e selecionado na porta :${existing.port}.`,
      };
    }

    setIsImporting(true);

    // Allocate next virtual port
    const maxPort = repos.reduce((max, r) => Math.max(max, r.port || 4000), 4000);
    const newPort = maxPort + 1;
    const newRepoId = `repo-${Date.now()}`;

    // Detect if this URL corresponds to known interactive apps
    let demoType: RepositoryItem['demoType'] = 'generic-app';
    let demoUrl = parsed.webAppUrl;
    const lower = parsed.cleanGitUrl.toLowerCase();
    if (lower.includes('renderahouse')) {
      demoType = 'web-app';
      demoUrl = `https://${parsed.owner}.github.io/${parsed.repoName}/`;
    } else if (lower.includes('delightful-sparkle-box')) {
      demoType = 'sparkle-box';
    } else if (lower.includes('jarvis')) {
      demoType = 'jarvis';
    } else if (lower.includes('2048')) {
      demoType = 'game-2048';
    } else if (lower.includes('markdown') || lower.includes('editor')) {
      demoType = 'markdown-notes';
    } else if (parsed.type === 'web-app') {
      demoType = 'custom-iframe';
    }

    // Fetch real repository data from GitHub if applicable
    let gitHubData: {
      name?: string;
      fullName?: string;
      description?: string;
      stars?: number;
      forks?: number;
      language?: string;
      defaultBranch?: string;
      homepage?: string;
      readme?: string;
    } | null = null;

    let repoRealFiles: RepoFile[] = lower.includes('renderahouse')
      ? [
          { path: 'index.html', size: '16.5 KB', type: 'file' },
          { path: 'editor.html', size: '30.5 KB', type: 'file' },
          { path: '3d-preview.html', size: '18.0 KB', type: 'file' },
          { path: 'dashboard.html', size: '10.3 KB', type: 'file' },
          { path: 'login.html', size: '7.9 KB', type: 'file' },
        ]
      : [
          { path: 'src/App.tsx', size: '3.6 KB', type: 'file' },
          { path: 'src/main.tsx', size: '1.2 KB', type: 'file' },
          { path: 'package.json', size: '890 B', type: 'file' },
          { path: 'README.md', size: '1.8 KB', type: 'file' },
        ];

    if (parsed.type === 'github') {
      try {
        gitHubData = await fetchGitHubRepoDetails(parsed.owner, parsed.repoName, parsed.branch);
        if (gitHubData?.homepage) {
          demoUrl = gitHubData.homepage;
        }
        const contents = await fetchRepoContents(parsed.owner, parsed.repoName, '', parsed.branch);
        if (contents.length > 0) {
          repoRealFiles = contents.map((c) => ({
            path: c.path,
            size: `${(c.size / 1024).toFixed(1)} KB`,
            type: c.type,
            sha: c.sha,
            downloadUrl: c.download_url || undefined,
          }));
          const hasHtml = contents.some((c) => c.path.toLowerCase().endsWith('.html'));
          if (hasHtml) {
            demoType = 'web-app';
            if (!demoUrl) {
              demoUrl = `https://${parsed.owner}.github.io/${parsed.repoName}/`;
            }
          }
        }
      } catch {
        // Fallback gracefully
      }
    }

    const finalName = gitHubData?.name || parsed.repoName;
    const finalFullName = gitHubData?.fullName || parsed.fullName;

    const newRepo: RepositoryItem = {
      id: newRepoId,
      name: finalName,
      fullName: finalFullName,
      owner: parsed.owner,
      gitUrl: parsed.cleanGitUrl,
      branch: gitHubData?.defaultBranch || parsed.branch,
      status: 'cloning',
      port: newPort,
      addedAt: 'Agora mesmo',
      description:
        gitHubData?.description ||
        (lower.includes('renderahouse')
          ? 'Render a House MAX — Plataforma de Renders Arquitetônicos e Visualizador 3D.'
          : `Módulo importado de ${finalFullName}. Pronto para desenvolvimento e execução dinâmica.`),
      stars: gitHubData?.stars ?? Math.floor(10 + Math.random() * 90),
      forks: gitHubData?.forks ?? Math.floor(2 + Math.random() * 20),
      language: gitHubData?.language || (lower.includes('renderahouse') ? 'HTML / Three.js' : 'TypeScript / React'),
      framework: lower.includes('renderahouse') ? 'HTML5 Multi-Page + Three.js' : 'Vite + React 19',
      demoType: demoType,
      demoUrl: demoUrl,
      activePage: 'index.html',
      logs: [
        {
          id: `log-init-1`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'cmd',
          tag: 'git',
          message: `git clone --depth=1 --branch=${parsed.branch} ${parsed.cleanGitUrl} /workspace/apps/${parsed.repoName}`,
        },
        {
          id: `log-init-2`,
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          tag: 'git',
          message: `Cloning into '/workspace/apps/${parsed.repoName}'...`,
        },
      ],
      files: repoRealFiles,
      readmePreview:
        gitHubData?.readme ||
        `# ${finalName}\n\n${gitHubData?.description || 'Repositório clonado com sucesso através do painel dinâmico GitRepo Hub.'}\n\n### Origem do Código:\n\`${parsed.cleanGitUrl}\`\n\n### Status de Execução:\nInicializado no runtime Vite com porta virtual :${newPort}. Use a Aba de Prompt IA para alterar qualquer arquivo e gravar commits no GitHub.`,
    };

    // Add to list and select it immediately
    setRepos((prev) => [newRepo, ...prev]);
    setSelectedRepoId(newRepoId);

    // Simulate step-by-step terminal logs and transition to running
    setTimeout(() => {
      appendLog(
        newRepoId,
        'remote: Enumerating objects: 112, done. Counting objects: 100% (112/112), done.',
        'info',
        'git'
      );
    }, 500);

    setTimeout(() => {
      appendLog(newRepoId, 'npm install --prefer-offline', 'cmd', 'npm');
      appendLog(newRepoId, 'added 184 packages in 2.15s', 'info', 'npm');
    }, 1100);

    setTimeout(() => {
      appendLog(newRepoId, `vite --port ${newPort} --host 0.0.0.0`, 'cmd', 'vite');
      appendLog(newRepoId, `VITE v5.4.1 ready in 210 ms`, 'success', 'vite');
      appendLog(newRepoId, `➜ Local: http://localhost:${newPort}/`, 'success', 'system');

      setRepos((prev) =>
        prev.map((r) => (r.id === newRepoId ? { ...r, status: 'running' } : r))
      );
      setIsImporting(false);
    }, 1800);

    return {
      success: true,
      isExisting: false,
      repoId: newRepoId,
      message: `Repositório "${finalFullName}" importado e executando na porta :${newPort}!`,
    };
  };

  // Toggle start / stop
  const handleToggleStatus = (repoId: string) => {
    const target = repos.find((r) => r.id === repoId);
    if (!target) return;

    if (target.status === 'running') {
      handleStop(repoId);
    } else {
      handleStart(repoId);
    }
  };

  const handleStart = (repoId: string) => {
    const target = repos.find((r) => r.id === repoId);
    if (!target) return;

    appendLog(repoId, `Starting development server on port ${target.port}...`, 'cmd', 'vite');
    appendLog(repoId, `Server listening on http://localhost:${target.port}/`, 'success', 'system');

    setRepos((prev) =>
      prev.map((r) => (r.id === repoId ? { ...r, status: 'running' } : r))
    );
  };

  const handleStop = (repoId: string) => {
    const target = repos.find((r) => r.id === repoId);
    if (!target) return;

    appendLog(repoId, `SIGINT received. Stopping server on port ${target.port}...`, 'warn', 'system');
    appendLog(repoId, 'Process terminated cleanly (exit code 0).', 'info', 'system');

    setRepos((prev) =>
      prev.map((r) => (r.id === repoId ? { ...r, status: 'stopped' } : r))
    );
  };

  const handleRestart = (repoId: string) => {
    const target = repos.find((r) => r.id === repoId);
    if (!target) return;

    appendLog(repoId, 'Reiniciando processo e limpando cache...', 'warn', 'system');
    setRepos((prev) =>
      prev.map((r) => (r.id === repoId ? { ...r, status: 'building' } : r))
    );

    setTimeout(() => {
      appendLog(repoId, `Vite dev server restarted on http://localhost:${target.port}/`, 'success', 'vite');
      setRepos((prev) =>
        prev.map((r) => (r.id === repoId ? { ...r, status: 'running' } : r))
      );
    }, 700);
  };

  const handleDeleteSingle = (repoId: string) => {
    const target = repos.find((r) => r.id === repoId);
    const targetName = target?.name || 'módulo';

    setRepos((prev) => {
      const remaining = prev.filter((r) => r.id !== repoId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
      } catch {
        // ignore
      }
      if (selectedRepoId === repoId) {
        setSelectedRepoId(remaining[0]?.id || '');
      }
      return remaining;
    });

    setDeleteModal({ isOpen: false, type: 'single', repo: null });
    setDeleteNotice(`O repositório "${targetName}" foi apagado com sucesso.`);
    setTimeout(() => {
      setDeleteNotice((prev) => (prev?.includes(targetName) ? null : prev));
    }, 4500);
  };

  const handleDeleteAll = () => {
    const count = repos.length;
    setRepos([]);
    setSelectedRepoId('');
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch {
      // ignore
    }

    setDeleteModal({ isOpen: false, type: 'all', repo: null });
    setDeleteNotice(`Todos os ${count} repositórios foram apagados com sucesso.`);
    setTimeout(() => {
      setDeleteNotice(null);
    }, 4500);
  };

  const handleClearLogs = (repoId: string) => {
    setRepos((prev) =>
      prev.map((r) => (r.id === repoId ? { ...r, logs: [] } : r))
    );
  };

  const handleExecuteCommand = (repoId: string, cmd: string) => {
    const target = repos.find((r) => r.id === repoId);
    if (!target) return;

    appendLog(repoId, cmd, 'cmd');

    const clean = cmd.trim().toLowerCase();
    setTimeout(() => {
      if (clean === 'clear') {
        handleClearLogs(repoId);
      } else if (clean === 'git status') {
        appendLog(repoId, `On branch ${target.branch}\nYour branch is up to date with 'origin/${target.branch}'.\nnothing to commit, working tree clean`, 'info', 'git');
      } else if (clean === 'git pull') {
        appendLog(repoId, 'Already up to date.', 'success', 'git');
      } else if (clean.startsWith('npm test')) {
        appendLog(repoId, 'PASS src/App.test.tsx\nTest Suites: 1 passed, 1 total\nTests: 6 passed, 6 total\nSnapshots: 0 total\nTime: 1.12s', 'success', 'npm');
      } else if (clean.startsWith('npm run build')) {
        appendLog(repoId, 'vite build --outDir dist\n✓ 42 modules transformed.\ndist/index.html 0.48 kB\ndist/assets/index.js 42.12 kB\n✓ built in 312ms', 'success', 'vite');
      } else if (clean === 'help') {
        appendLog(repoId, 'Comandos disponíveis: git status, git pull, npm test, npm run build, clear, help', 'info', 'system');
      } else {
        appendLog(repoId, `bash: comando não reconhecido: ${cmd}. Digite "help" para lista de utilitários.`, 'warn', 'system');
      }
    }, 200);
  };

  const handleUpdateFileCode = (
    repoId: string,
    filePath: string,
    newCode: string,
    newSha?: string
  ) => {
    setRepos((prev) =>
      prev.map((r) => {
        if (r.id !== repoId) return r;
        const currentCached = r.cachedFiles || {};
        return {
          ...r,
          cachedFiles: {
            ...currentCached,
            [filePath]: {
              content: newCode,
              sha: newSha || currentCached[filePath]?.sha,
              isModified: true,
            },
          },
          files: r.files.map((f) =>
            f.path === filePath
              ? { ...f, content: newCode, sha: newSha || f.sha, isModified: true }
              : f
          ),
        };
      })
    );
  };

  const runningCount = repos.filter((r) => r.status === 'running').length;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        runningCount={runningCount}
        totalCount={repos.length}
      />

      {/* Repository URL Addition Bar */}
      <RepoAddBar onAddRepo={handleAddRepo} isImporting={isImporting} />

      {/* Main Layout Area: Sidebar + Execution Window */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Module Sidebar */}
        <Sidebar
          repos={repos}
          selectedRepoId={selectedRepoId}
          onSelectRepo={(id) => setSelectedRepoId(id)}
          onToggleStatus={handleToggleStatus}
          onRequestDelete={(repo) => setDeleteModal({ isOpen: true, type: 'single', repo })}
          onRequestDeleteAll={() => setDeleteModal({ isOpen: true, type: 'all', totalCount: repos.length })}
          isOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Mobile Sidebar Backdrop */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-xs"
          />
        )}

        {/* Active Application Viewer or Empty State */}
        {selectedRepo ? (
          <AppViewer
            repo={selectedRepo}
            onStart={() => handleStart(selectedRepo.id)}
            onStop={() => handleStop(selectedRepo.id)}
            onRestart={() => handleRestart(selectedRepo.id)}
            onClearLogs={() => handleClearLogs(selectedRepo.id)}
            onExecuteCommand={(cmd) => handleExecuteCommand(selectedRepo.id, cmd)}
            onRequestDelete={() => setDeleteModal({ isOpen: true, type: 'single', repo: selectedRepo })}
            onUpdateFileCode={handleUpdateFileCode}
            onAppendLog={appendLog}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 dark:bg-slate-950">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-4 border border-indigo-500/20">
              <FolderGit2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              Nenhum Repositório no Painel
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-5 leading-relaxed">
              Nenhum módulo carregado. Cole a URL do seu repositório GitHub na barra acima e clique em "Adicionar" para clonar e rodar o projeto.
            </p>
            <button
              type="button"
              onClick={() => {
                const inputEl = document.getElementById('repo-url-input');
                if (inputEl) {
                  inputEl.focus();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <span>Adicionar Repositório</span>
            </button>
          </div>
        )}
      </div>

      {/* Unified In-App Modal for Deleting Single or All Repositories */}
      <DeleteConfirmModal
        modalState={deleteModal}
        onClose={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirmDeleteSingle={handleDeleteSingle}
        onConfirmDeleteAll={handleDeleteAll}
      />

      {/* Floating Deletion Confirmation Toast */}
      {deleteNotice && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 px-4 py-3 rounded-xl shadow-xl text-xs font-medium border border-slate-700/80 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{deleteNotice}</span>
        </div>
      )}
    </div>
  );
}
