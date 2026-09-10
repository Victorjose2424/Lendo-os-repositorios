import React, { useState } from 'react';
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink, Globe, ShieldCheck } from 'lucide-react';

interface IframeAppViewerProps {
  url: string;
  repoName: string;
}

export const IframeAppViewer: React.FC<IframeAppViewerProps> = ({ url, repoName }) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [currentUrl, setCurrentUrl] = useState(url);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const getContainerWidth = () => {
    if (deviceMode === 'mobile') return 'max-w-[380px] h-[680px]';
    if (deviceMode === 'tablet') return 'max-w-[768px] h-[820px]';
    return 'w-full h-full';
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 dark:bg-slate-950 overflow-hidden font-sans">
      {/* Top Browser Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs z-10">
        <div className="flex items-center gap-2 flex-1 max-w-xl min-w-[200px]">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-lg w-full text-slate-700 dark:text-slate-300 font-mono text-xs">
            <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <input
              type="text"
              value={currentUrl}
              onChange={(e) => setCurrentUrl(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-xs truncate"
              placeholder="https://..."
            />
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans flex items-center gap-0.5 shrink-0">
              <ShieldCheck className="w-3 h-3" />
              Live
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              setReloadKey((k) => k + 1);
            }}
            title="Recarregar aplicação"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <a
            href={currentUrl}
            target="_blank"
            rel="noreferrer"
            title="Abrir em nova aba"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Device Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setDeviceMode('desktop')}
            className={`p-1.5 rounded transition-colors ${
              deviceMode === 'desktop'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Desktop"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('tablet')}
            className={`p-1.5 rounded transition-colors ${
              deviceMode === 'tablet'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Tablet"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('mobile')}
            className={`p-1.5 rounded transition-colors ${
              deviceMode === 'mobile'
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title="Mobile"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 overflow-auto p-3 sm:p-4 flex justify-center items-start">
        <div
          className={`${getContainerWidth()} w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md overflow-hidden relative flex flex-col transition-all duration-300`}
        >
          {isLoading && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex flex-col items-center justify-center z-10 text-white">
              <div className="w-8 h-8 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs font-medium">Carregando {repoName}...</p>
            </div>
          )}

          <iframe
            key={reloadKey}
            src={currentUrl}
            title={repoName}
            className="w-full h-full flex-1 border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            onLoad={() => setIsLoading(false)}
          />
        </div>
      </div>
    </div>
  );
};
