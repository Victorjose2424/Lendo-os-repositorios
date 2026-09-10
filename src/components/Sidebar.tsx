import React, { useState } from 'react';
import { RepositoryItem, RepoStatus } from '../types';
import {
  FolderGit2,
  Play,
  Square,
  RefreshCw,
  Trash2,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface SidebarProps {
  repos: RepositoryItem[];
  selectedRepoId: string;
  onSelectRepo: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onRequestDelete: (repo: RepositoryItem) => void;
  onRequestDeleteAll: () => void;
  isOpen: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  repos,
  selectedRepoId,
  onSelectRepo,
  onToggleStatus,
  onRequestDelete,
  onRequestDeleteAll,
  isOpen,
  onCloseMobile,
}) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const runningCount = repos.filter((r) => r.status === 'running').length;

  const filteredRepos = repos.filter((repo) => {
    const matchesSearch =
      repo.name.toLowerCase().includes(search.toLowerCase()) ||
      repo.fullName.toLowerCase().includes(search.toLowerCase()) ||
      repo.language.toLowerCase().includes(search.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && repo.status === filterStatus;
  });

  const getStatusBadge = (status: RepoStatus, port: number) => {
    switch (status) {
      case 'running':
        return (
          <div className="flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400 font-medium text-[11px]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Rodando</span>
            <span className="text-slate-400 text-[10px] font-mono">:{port}</span>
          </div>
        );
      case 'cloning':
      case 'building':
        return (
          <div className="flex items-center gap-1.5 text-amber-500 text-[11px] font-medium">
            <div className="w-2.5 h-2.5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <span>Clonando...</span>
          </div>
        );
      case 'stopped':
        return (
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <span className="h-2 w-2 rounded-full bg-slate-400/60" />
            <span>Parado</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-rose-500 text-[11px] font-medium">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>Erro</span>
          </div>
        );
    }
  };

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-30 w-72 sm:w-80 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Sidebar Header & Stats */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Módulos Ativos
              </h2>
              <p className="text-[11px] text-slate-500">Repositórios Git em execução</p>
            </div>
          </div>

          <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
            {runningCount} online
          </div>
        </div>

        {/* Search input */}
        <div className="relative mt-3">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar repositórios..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center gap-1 mt-2.5 text-[11px]">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-2 py-0.5 rounded transition-colors ${
              filterStatus === 'all'
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Todos ({repos.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('running')}
            className={`px-2 py-0.5 rounded transition-colors ${
              filterStatus === 'running'
                ? 'bg-emerald-600 text-white font-medium'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Rodando ({runningCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('stopped')}
            className={`px-2 py-0.5 rounded transition-colors ${
              filterStatus === 'stopped'
                ? 'bg-slate-700 text-white font-medium'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Parados ({repos.length - runningCount})
          </button>
        </div>
      </div>

      {/* List Header with Actions */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between text-xs">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Módulos ({filteredRepos.length})
        </span>

        {repos.length > 0 && (
          <button
            type="button"
            onClick={onRequestDeleteAll}
            className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-100/80 dark:hover:bg-rose-950/60 rounded border border-rose-200/80 dark:border-rose-900/60 transition-colors cursor-pointer"
            title="Apagar todos os repositórios da lista"
          >
            <Trash2 className="w-3 h-3" />
            <span>Apagar Todos</span>
          </button>
        )}
      </div>

      {/* Repositories List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredRepos.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-400 text-xs">
            <FolderGit2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p>Nenhum repositório encontrado.</p>
          </div>
        ) : (
          filteredRepos.map((repo) => {
            const isSelected = repo.id === selectedRepoId;
            return (
              <div
                key={repo.id}
                onClick={() => {
                  onSelectRepo(repo.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-slate-800/90 border-indigo-500 dark:border-indigo-500 shadow-sm ring-1 ring-indigo-500/20'
                    : 'bg-white/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Header with Name & Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3
                      className={`text-xs font-bold truncate ${
                        isSelected
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-800 dark:text-slate-200 group-hover:text-indigo-500'
                      }`}
                      title={repo.fullName}
                    >
                      {repo.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                      {repo.owner}
                    </p>
                  </div>

                  {/* Inline Play/Stop and Delete buttons */}
                  <div className="flex items-center gap-1 opacity-90">
                    {repo.status === 'running' ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStatus(repo.id);
                        }}
                        title="Parar aplicação"
                        className="p-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Square className="w-3 h-3 fill-current" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleStatus(repo.id);
                        }}
                        title="Iniciar aplicação"
                        className="p-1 rounded bg-slate-100 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-emerald-950 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestDelete(repo);
                      }}
                      title={`Apagar repositório ${repo.name}`}
                      className="p-1 rounded-md hover:bg-rose-100 dark:hover:bg-rose-950/80 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Status Indicator & Language badge */}
                <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                  {getStatusBadge(repo.status, repo.port)}

                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                    {repo.language.split('/')[0]}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer info */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
        <span>Ambiente Node & Vite</span>
        <span className="font-mono text-emerald-600 dark:text-emerald-400">Pronto</span>
      </div>
    </aside>
  );
};
