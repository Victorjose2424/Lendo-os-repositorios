import React, { useState } from 'react';
import { RepositoryItem } from '../../types';
import { Globe, RefreshCw, Smartphone, Monitor, Tablet, ExternalLink, GitBranch, Star, GitFork, Cpu, Activity, Play, CheckCircle2 } from 'lucide-react';

interface GenericAppSandboxProps {
  repo: RepositoryItem;
  onRestart: () => void;
}

export const GenericAppSandbox: React.FC<GenericAppSandboxProps> = ({ repo, onRestart }) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success'>('idle');
  const [latency, setLatency] = useState<number>(14);
  const [counter, setCounter] = useState(0);
  const [customUrl, setCustomUrl] = useState(repo.demoUrl || '');

  const handleTestApi = () => {
    setPingStatus('testing');
    setTimeout(() => {
      setLatency(Math.floor(8 + Math.random() * 20));
      setPingStatus('success');
    }, 400);
  };

  const getContainerWidth = () => {
    if (deviceMode === 'mobile') return 'max-w-[375px]';
    if (deviceMode === 'tablet') return 'max-w-[768px]';
    return 'w-full';
  };

  return (
    <div className="w-full h-full min-h-[520px] bg-slate-100 dark:bg-slate-950 flex flex-col font-sans overflow-hidden">
      {/* Sandbox Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>http://localhost:{repo.port}/</span>
          </div>

          <button
            type="button"
            onClick={handleTestApi}
            disabled={pingStatus === 'testing'}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded font-medium transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{pingStatus === 'testing' ? 'Pingando...' : `Ping API (${latency}ms)`}</span>
          </button>
        </div>

        {/* Device Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setDeviceMode('desktop')}
            title="Desktop View"
            className={`p-1.5 rounded transition-colors ${
              deviceMode === 'desktop'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('tablet')}
            title="Tablet View"
            className={`p-1.5 rounded transition-colors ${
              deviceMode === 'tablet'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('mobile')}
            title="Mobile View"
            className={`p-1.5 rounded transition-colors ${
              deviceMode === 'mobile'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* App Canvas / Viewport */}
      <div className="flex-1 overflow-y-auto p-4 flex justify-center items-start">
        <div
          className={`${getContainerWidth()} transition-all duration-300 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden`}
        >
          {/* Virtual App Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">{repo.name}</h2>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
                  {repo.branch}
                </span>
              </div>
              <p className="text-xs text-indigo-100 mt-1">
                {repo.description || 'Aplicação inicializada com sucesso no ambiente dinâmico.'}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-white/10 backdrop-blur">
              <Cpu className="w-5 h-5 text-indigo-200" />
            </div>
          </div>

          {/* Interactive Live Content */}
          <div className="p-6 space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-slate-500 block mb-1">Linguagem</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{repo.language || 'JavaScript/TS'}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-slate-500 block mb-1">Estrelas GitHub</span>
                <div className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{repo.stars || 0}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-slate-500 block mb-1">Forks</span>
                <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                  <GitFork className="w-3.5 h-3.5" />
                  <span>{repo.forks || 0}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <span className="text-slate-500 block mb-1">Porta Alocada</span>
                <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">:{repo.port}</span>
              </div>
            </div>

            {/* Interactive Functional Widget for the dynamic repo */}
            <div className="p-4 rounded-xl border border-indigo-100 dark:border-indigo-950 bg-indigo-50/40 dark:bg-indigo-950/20">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Módulo Interativo de Teste de Estado</span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                Você pode testar a reatividade de componentes renderizados pelo runtime deste repositório:
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCounter((c) => c + 1)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs rounded-lg transition-transform"
                >
                  Incrementar Contador (+1)
                </button>
                <div className="text-xs font-mono px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                  Estado Atual: <span className="font-bold text-indigo-600 dark:text-indigo-400">{counter}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCounter(0)}
                  className="px-3 py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Resetar
                </button>
              </div>
            </div>

            {/* Git Link & Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              <a
                href={repo.gitUrl.replace('.git', '')}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                <span>Ver repositório no GitHub</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onRestart}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Recarregar Módulo</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
