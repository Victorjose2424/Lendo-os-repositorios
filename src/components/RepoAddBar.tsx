import React, { useState, useMemo } from 'react';
import {
  GitBranch,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clipboard,
  ExternalLink,
  Globe,
  Check,
  X,
} from 'lucide-react';
import { parseGitOrWebUrl } from '../utils/urlParser';

export interface AddRepoResult {
  success: boolean;
  message: string;
  isExisting?: boolean;
  repoId?: string;
}

interface RepoAddBarProps {
  onAddRepo: (gitUrl: string) => Promise<AddRepoResult>;
  isImporting: boolean;
}

export const RepoAddBar: React.FC<RepoAddBarProps> = ({ onAddRepo, isImporting }) => {
  const [inputUrl, setInputUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Real-time detection of the entered URL
  const parsedPreview = useMemo(() => {
    if (!inputUrl.trim()) return null;
    return parseGitOrWebUrl(inputUrl);
  }, [inputUrl]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);
    setSuccessBanner(null);

    const trimmed = inputUrl.trim();
    if (!trimmed) {
      setErrorMsg('Por favor, cole um link do GitHub (ex: https://github.com/usuario/repositorio.git).');
      return;
    }

    const parsed = parseGitOrWebUrl(trimmed);
    if (!parsed.isValid) {
      setErrorMsg(parsed.errorMessage || 'Link inválido. Insira um link válido do GitHub ou nome do repositório.');
      return;
    }

    const result = await onAddRepo(trimmed);
    if (result.success) {
      setInputUrl('');
      setErrorMsg(null);
      setSuccessBanner(result.message);
      // Auto-hide success banner after 6 seconds
      setTimeout(() => {
        setSuccessBanner((prev) => (prev === result.message ? null : prev));
      }, 6000);
    } else {
      setErrorMsg(result.message || 'Não foi possível carregar este repositório.');
    }
  };

  const handlePasteClipboard = async () => {
    try {
      setErrorMsg(null);
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text.trim());
        setCopiedNotification(true);
        setTimeout(() => setCopiedNotification(false), 2000);
      }
    } catch {
      // If browser clipboard permission is blocked, focus the input
      const inputEl = document.getElementById('repo-url-input') as HTMLInputElement | null;
      if (inputEl) {
        inputEl.focus();
        setErrorMsg('Pressione Ctrl+V (ou Cmd+V) para colar o link no campo.');
      }
    }
  };

  return (
    <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-xs">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 items-stretch">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <GitBranch className="w-4 h-4 text-indigo-500" />
          </div>

          <input
            id="repo-url-input"
            type="text"
            value={inputUrl}
            onChange={(e) => {
              setInputUrl(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="Cole o link de qualquer repositório do GitHub (ex: https://github.com/usuario/repositorio.git)"
            className={`w-full pl-9 pr-24 py-2.5 text-sm bg-slate-50 dark:bg-slate-950 border rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none transition-colors ${
              errorMsg
                ? 'border-rose-500 focus:border-rose-500'
                : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500'
            }`}
          />

          {/* Action buttons inside input: Paste / Clear */}
          <div className="absolute inset-y-0 right-2 flex items-center gap-1">
            {!inputUrl ? (
              <button
                type="button"
                onClick={handlePasteClipboard}
                title="Colar link da área de transferência"
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 bg-slate-200/60 dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded transition-colors"
              >
                {copiedNotification ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-500 text-[11px]">Colado!</span>
                  </>
                ) : (
                  <>
                    <Clipboard className="w-3 h-3" />
                    <span className="text-[11px]">Colar</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setInputUrl('');
                  setErrorMsg(null);
                }}
                className="px-2 py-1 text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isImporting || !inputUrl.trim()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 disabled:opacity-50 text-white font-semibold text-sm rounded-lg shadow-xs transition-all whitespace-nowrap cursor-pointer"
        >
          {isImporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Importando & Executando...</span>
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Importar e Executar</span>
            </>
          )}
        </button>
      </form>

      {/* Real-time Recognition Preview Indicator */}
      {parsedPreview && parsedPreview.isValid && !errorMsg && (
        <div className="flex items-center gap-2 mt-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 px-3 py-1.5 rounded-lg">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
          <span className="font-medium">Link reconhecido:</span>
          <span className="font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 font-semibold">
            {parsedPreview.fullName}
          </span>
          <span className="text-slate-500 dark:text-slate-400 text-[11px]">
            (branch: {parsedPreview.branch})
          </span>
          <span className="ml-auto text-[11px] text-emerald-600 dark:text-emerald-400">
            Pressione Enter ou clique em &quot;Importar e Executar&quot;
          </span>
        </div>
      )}

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="flex items-center justify-between gap-2 mt-2 text-xs text-emerald-800 dark:text-emerald-200 bg-emerald-100/90 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 px-3 py-2 rounded-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="flex items-center justify-between gap-2 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-3 py-2 rounded-lg mt-2">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-500 hover:text-rose-700 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick Suggestion Pills */}
      <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] overflow-x-auto text-slate-500">
        <span className="font-semibold text-slate-400 shrink-0">Sugestões rápidas:</span>
        <button
          type="button"
          onClick={() => {
            setInputUrl('https://github.com/PolsiaAI/Polsia.git');
            setErrorMsg(null);
          }}
          className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-medium shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <span>🚀 Polsia AI (Autonomous Co-Founder)</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setInputUrl('https://github.com/victormigueladrianojose-hash/renderahouse-max.git');
            setErrorMsg(null);
          }}
          className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0 transition-colors cursor-pointer"
        >
          <span>🏠 Render a House MAX</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setInputUrl('https://github.com/gabrielecirulli/2048.git');
            setErrorMsg(null);
          }}
          className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0 transition-colors cursor-pointer"
        >
          <span>🎮 2048 Game</span>
        </button>
      </div>
    </div>
  );
};
