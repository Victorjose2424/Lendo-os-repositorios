import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Globe,
  RefreshCw,
  Smartphone,
  Monitor,
  Tablet,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { RepositoryItem } from '../../types';
import { fetchFileContent } from '../../utils/githubService';
import { RENDERAHOUSE_FILES } from '../../data/renderahouseFiles';

interface WebAppRunnerProps {
  repo: RepositoryItem;
  onOpenPromptTab: (filePath?: string) => void;
  onOpenChatTab?: (filePath?: string) => void;
  onPageChange?: (newPage: string) => void;
}

export const WebAppRunner: React.FC<WebAppRunnerProps> = ({
  repo,
  onOpenPromptTab,
  onOpenChatTab,
  onPageChange,
}) => {
  const [activePage, setActivePage] = useState<string>(repo.activePage || 'index.html');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [pageHistory, setPageHistory] = useState<string[]>(['index.html']);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [pageHtml, setPageHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Navigate to page
  const navigateToPage = (targetPage: string, addToHistory = true) => {
    const clean = targetPage.replace(/^\/+/, '').split('?')[0].split('#')[0];
    setActivePage(clean);
    if (onPageChange) {
      onPageChange(clean);
    }
    if (addToHistory) {
      const newHist = pageHistory.slice(0, historyIndex + 1);
      newHist.push(clean);
      setPageHistory(newHist);
      setHistoryIndex(newHist.length - 1);
    }
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const prev = pageHistory[historyIndex - 1];
      setHistoryIndex(historyIndex - 1);
      setActivePage(prev);
    }
  };

  const handleForward = () => {
    if (historyIndex < pageHistory.length - 1) {
      const next = pageHistory[historyIndex + 1];
      setHistoryIndex(historyIndex + 1);
      setActivePage(next);
    }
  };

  // Listen to navigation events from inside iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'GITREPO_NAVIGATE') {
        const target = e.data.page;
        if (target) {
          navigateToPage(target);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [historyIndex, pageHistory]);

  // Load content for activePage
  useEffect(() => {
    let isCancelled = false;

    const loadContent = async () => {
      setIsLoading(true);
      setLoadError(null);

      // 1. Check live modified files
      if (repo.cachedFiles && repo.cachedFiles[activePage]?.content) {
        if (!isCancelled) {
          setPageHtml(repo.cachedFiles[activePage].content);
          setIsLoading(false);
        }
        return;
      }

      // 2. Check repo.files
      const found = repo.files?.find((f) => f.path.toLowerCase() === activePage.toLowerCase());
      if (found?.content) {
        if (!isCancelled) {
          setPageHtml(found.content);
          setIsLoading(false);
        }
        return;
      }

      // 3. Check preloaded static files for renderahouse-max
      if (RENDERAHOUSE_FILES[activePage]) {
        if (!isCancelled) {
          setPageHtml(RENDERAHOUSE_FILES[activePage]);
          setIsLoading(false);
        }
        return;
      }

      // 4. Fetch from GitHub / Proxy
      try {
        const res = await fetchFileContent(
          repo.owner,
          repo.name,
          activePage,
          repo.branch || 'main'
        );
        if (!isCancelled) {
          if (res.content) {
            setPageHtml(res.content);
          } else if (RENDERAHOUSE_FILES['index.html']) {
            setPageHtml(RENDERAHOUSE_FILES['index.html']);
          } else {
            setLoadError(`Arquivo ${activePage} não encontrado.`);
          }
        }
      } catch (err: any) {
        if (!isCancelled) {
          if (RENDERAHOUSE_FILES[activePage]) {
            setPageHtml(RENDERAHOUSE_FILES[activePage]);
          } else {
            setLoadError(`Não foi possível carregar ${activePage}: ${err?.message}`);
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadContent();

    return () => {
      isCancelled = true;
    };
  }, [activePage, repo.owner, repo.name, repo.branch, repo.cachedFiles, reloadKey]);

  // Generate safe srcdoc with injected link interceptor
  const injectedSrcdoc = useMemo(() => {
    if (!pageHtml) return '';

    const interceptorScript = `
<script>
(function() {
  document.addEventListener('click', function(e) {
    var a = e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || href === '#' || href.startsWith('javascript:')) return;
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return;

    // Keep all navigation inside the runner - avoid opening new browser tabs
    e.preventDefault();
    e.stopPropagation();

    var clean = href.replace(/^(\\.\\/|\\/)/, '').split('?')[0].split('#')[0];
    if (!clean.includes('.') || clean.endsWith('.html')) {
      if (!clean.endsWith('.html')) clean = clean + '.html';
      window.parent.postMessage({ type: 'GITREPO_NAVIGATE', page: clean }, '*');
    }
  }, true);

  // Prevent popups or new browser tabs
  window.open = function(url) {
    if (url && typeof url === 'string') {
      var clean = url.replace(/^(\\.\\/|\\/)/, '').split('?')[0].split('#')[0];
      if (clean && (clean.endsWith('.html') || !clean.includes('.'))) {
        if (!clean.endsWith('.html')) clean = clean + '.html';
        window.parent.postMessage({ type: 'GITREPO_NAVIGATE', page: clean }, '*');
      }
    }
    return null;
  };
})();
</script>
`;

    // Inject before </head> or at start
    if (pageHtml.includes('</head>')) {
      return pageHtml.replace('</head>', `${interceptorScript}</head>`);
    } else if (pageHtml.includes('<body>')) {
      return pageHtml.replace('<body>', `<body>${interceptorScript}`);
    }
    return interceptorScript + pageHtml;
  }, [pageHtml]);

  const getContainerWidth = () => {
    if (deviceMode === 'mobile') return 'max-w-[420px] shadow-2xl';
    if (deviceMode === 'tablet') return 'max-w-[768px] shadow-xl';
    return 'w-full';
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 dark:bg-slate-950 font-sans overflow-hidden">
      {/* Streamlined Top Navigation Bar */}
      <div className="flex items-center justify-between gap-3 px-3 sm:px-5 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs z-10 shrink-0">
        {/* Navigation & Refresh */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleBack}
            disabled={historyIndex <= 0}
            title="Voltar página anterior"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleForward}
            disabled={historyIndex >= pageHistory.length - 1}
            title="Avançar página"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            title="Recarregar aplicação"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-500' : ''}`} />
          </button>
        </div>

        {/* Clean URL / Page Indicator */}
        <div className="flex-1 max-w-lg flex items-center justify-between gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono">
          <div className="flex items-center gap-2 truncate">
            <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="text-slate-500 shrink-0">localhost:{repo.port}/</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
              {activePage}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-sans font-semibold">
              Ao Vivo
            </span>
          </div>
        </div>

        {/* Right Tools: Chat Copilot Button & Device Switcher */}
        <div className="flex items-center gap-2">
          {onOpenChatTab && (
            <button
              type="button"
              onClick={() => onOpenChatTab(activePage)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
              title="Abrir Chat Copilot para pedir melhorias no repositório"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chat de Melhorias</span>
            </button>
          )}

          {/* Device Switcher */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setDeviceMode('desktop')}
              title="Visão Desktop"
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
              title="Visão Tablet"
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
              title="Visão Mobile"
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
      </div>

      {/* Main Application Viewport */}
      <div className="flex-1 overflow-auto p-2 sm:p-4 flex justify-center items-start bg-slate-200/50 dark:bg-slate-950">
        <div
          className={`${getContainerWidth()} h-full min-h-[600px] w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl overflow-hidden transition-all duration-300 flex flex-col`}
        >
          {isLoading && (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Carregando {activePage}...
              </p>
            </div>
          )}

          {loadError && !isLoading && (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Aviso de Carregamento
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">{loadError}</p>
              <button
                type="button"
                onClick={() => {
                  setLoadError(null);
                  setActivePage('index.html');
                }}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 cursor-pointer"
              >
                Voltar para Página Inicial (index.html)
              </button>
            </div>
          )}

          {!isLoading && !loadError && (
            <iframe
              ref={iframeRef}
              key={`${activePage}-${reloadKey}`}
              srcDoc={injectedSrcdoc}
              title={`${repo.name} - ${activePage}`}
              className="w-full h-full flex-1 border-0 bg-white"
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
            />
          )}
        </div>
      </div>
    </div>
  );
};
