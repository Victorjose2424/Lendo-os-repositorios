import React, { useState } from 'react';
import { RepositoryItem } from '../types';
import {
  Play,
  Square,
  RotateCcw,
  Terminal,
  ExternalLink,
  Code,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  BookOpen,
  Maximize2,
  Minimize2,
  RefreshCw,
  FolderGit2,
  Trash2,
} from 'lucide-react';
import { SparkleBoxApp } from './EmbeddedApps/SparkleBoxApp';
import { JarvisApp } from './EmbeddedApps/JarvisApp';
import { Game2048App } from './EmbeddedApps/Game2048App';
import { MarkdownNotesApp } from './EmbeddedApps/MarkdownNotesApp';
import { GenericAppSandbox } from './EmbeddedApps/GenericAppSandbox';
import { IframeAppViewer } from './EmbeddedApps/IframeAppViewer';
import { TerminalLogs } from './TerminalLogs';

interface AppViewerProps {
  repo: RepositoryItem;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onClearLogs: () => void;
  onExecuteCommand: (cmd: string) => void;
  onRequestDelete: () => void;
}

export const AppViewer: React.FC<AppViewerProps> = ({
  repo,
  onStart,
  onStop,
  onRestart,
  onClearLogs,
  onExecuteCommand,
  onRequestDelete,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'terminal' | 'readme'>('preview');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const handleRefreshApp = () => {
    setReloadKey((k) => k + 1);
  };

  const renderActiveApp = () => {
    switch (repo.demoType) {
      case 'sparkle-box':
        return <SparkleBoxApp key={reloadKey} />;
      case 'jarvis':
        return <JarvisApp key={reloadKey} />;
      case 'game-2048':
        return <Game2048App key={reloadKey} />;
      case 'markdown-notes':
        return <MarkdownNotesApp key={reloadKey} />;
      case 'custom-iframe':
        return <IframeAppViewer url={repo.demoUrl || `http://localhost:${repo.port}`} repoName={repo.name} key={reloadKey} />;
      default:
        if (repo.demoUrl) {
          return <IframeAppViewer url={repo.demoUrl} repoName={repo.name} key={reloadKey} />;
        }
        return <GenericAppSandbox repo={repo} onRestart={onRestart} key={reloadKey} />;
    }
  };

  return (
    <main
      className={`flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-950' : 'relative'
      }`}
    >
      {/* Top Application Bar with Controls */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
        {/* Repo Title & Status */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60">
            <FolderGit2 className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                {repo.name}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {repo.branch}
              </span>
            </div>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {repo.fullName} • <span className="font-mono text-indigo-500">http://localhost:{repo.port}</span>
            </p>
          </div>
        </div>

        {/* Center: Execution Action Controls */}
        <div className="flex items-center gap-2">
          {/* Start Button */}
          <button
            type="button"
            onClick={onStart}
            disabled={repo.status === 'running' || repo.status === 'cloning'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Iniciar</span>
          </button>

          {/* Restart Button */}
          <button
            type="button"
            onClick={onRestart}
            disabled={repo.status === 'cloning'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-medium rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>

          {/* Stop Button */}
          <button
            type="button"
            onClick={onStop}
            disabled={repo.status !== 'running'}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 disabled:opacity-40 disabled:cursor-not-allowed text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Parar</span>
          </button>
        </div>

        {/* Right: View Switcher Tabs & Utility Buttons */}
        <div className="flex items-center gap-2">
          {/* View Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Aplicação</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('terminal')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'terminal'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Terminal ({repo.logs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('readme')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'readme'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">README</span>
            </button>
          </div>

          {/* Quick utility buttons */}
          <button
            type="button"
            onClick={handleRefreshApp}
            title="Recarregar tela da aplicação"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <a
            href={repo.gitUrl.replace('.git', '')}
            target="_blank"
            rel="noreferrer"
            title="Abrir no GitHub"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onRequestDelete}
            title="Apagar este repositório do painel"
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer text-xs font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Apagar</span>
          </button>
        </div>
      </header>

      {/* Main Content Area based on Tab & Status */}
      <div className="flex-1 relative overflow-hidden bg-slate-50 dark:bg-slate-950">
        {activeTab === 'preview' && (
          <>
            {repo.status === 'running' && renderActiveApp()}

            {(repo.status === 'cloning' || repo.status === 'building') && (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-4">
                  <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Clonando e Construindo {repo.name}...
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                  Sincronizando árvore de objetos Git, resolvendo dependências npm e alocando porta virtual.
                </p>
                <div className="w-full max-w-md bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className="bg-indigo-600 h-full w-[70%] animate-pulse" />
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('terminal')}
                  className="mt-6 text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Acompanhar logs no terminal em tempo real</span>
                </button>
              </div>
            )}

            {repo.status === 'stopped' && (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
                  <Square className="w-6 h-6 fill-current" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Módulo Parado
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1 mb-6">
                  O servidor na porta <span className="font-mono font-semibold">:{repo.port}</span> foi interrompido. Clique no botão abaixo para reativar.
                </p>
                <button
                  type="button"
                  onClick={onStart}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Iniciar Servidor Dinâmico</span>
                </button>
              </div>
            )}

            {repo.status === 'error' && (
              <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-500">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Falha ao Executar o Repositório
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
                  Ocorreu um erro durante a compilação ou execução do código. Verifique a aba de logs para diagnosticar o problema.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onRestart}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Tentar Novamente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('terminal')}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-lg"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Ver Logs de Erro</span>
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'terminal' && (
          <TerminalLogs
            logs={repo.logs}
            repoName={repo.name}
            onClearLogs={onClearLogs}
            onExecuteCommand={onExecuteCommand}
          />
        )}

        {activeTab === 'readme' && (
          <div className="w-full h-full overflow-y-auto p-6 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 font-mono">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <span>README.md — {repo.branch}</span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">UTF-8 Markdown</span>
              </div>

              <div className="prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-sans">
                {repo.readmePreview || '# Sem README fornecido para este repositório.'}
              </div>

              {/* Files section */}
              {repo.files && repo.files.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                    <FileCode className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Estrutura de Arquivos Detectada</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                    {repo.files.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300"
                      >
                        <span className="truncate">{file.path}</span>
                        <span className="text-slate-400 text-[11px] shrink-0 ml-2">{file.size}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
