import React, { useState, useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal as TerminalIcon, Copy, Trash2, Search, ArrowDown, Check, Play, RefreshCw } from 'lucide-react';

interface TerminalLogsProps {
  logs: LogEntry[];
  repoName: string;
  onClearLogs: () => void;
  onExecuteCommand: (cmd: string) => void;
}

export const TerminalLogs: React.FC<TerminalLogsProps> = ({
  logs,
  repoName,
  onClearLogs,
  onExecuteCommand,
}) => {
  const [filterTag, setFilterTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copied, setCopied] = useState(false);
  const [customCommand, setCustomCommand] = useState('');
  const terminalBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (autoScroll) {
      terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter((log) => {
    const matchesTag = filterTag === 'all' || log.tag === filterTag;
    const matchesSearch =
      !searchQuery ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.tag?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  const handleCopyLogs = () => {
    const text = logs.map((l) => `[${l.timestamp}] [${l.tag || 'log'}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCommand.trim()) return;
    onExecuteCommand(customCommand.trim());
    setCustomCommand('');
  };

  const getTagColor = (tag?: string) => {
    switch (tag) {
      case 'git':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/60';
      case 'npm':
        return 'text-rose-400 bg-rose-950/60 border-rose-800/60';
      case 'vite':
        return 'text-indigo-400 bg-indigo-950/60 border-indigo-800/60';
      case 'system':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60';
      case 'runtime':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
      default:
        return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="w-full h-full min-h-[500px] bg-slate-950 text-slate-200 font-mono flex flex-col select-text overflow-hidden">
      {/* Terminal Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs z-10">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-1 text-slate-400 font-semibold">
            <TerminalIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>bash — /workspace/apps/{repoName}</span>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tag selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded border border-slate-700">
            {['all', 'git', 'npm', 'vite', 'system'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setFilterTag(tag)}
                className={`px-2 py-0.5 rounded text-[11px] uppercase tracking-wider font-semibold transition-colors ${
                  filterTag === tag
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filtrar logs..."
              className="pl-7 pr-2 py-1 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 w-28 sm:w-36"
            />
          </div>

          {/* Action buttons */}
          <button
            type="button"
            onClick={handleCopyLogs}
            title="Copiar histórico de logs"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors text-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copiado!' : 'Copiar'}</span>
          </button>

          <button
            type="button"
            onClick={() => setAutoScroll(!autoScroll)}
            title={autoScroll ? 'Desativar auto-rolagem' : 'Ativar auto-rolagem'}
            className={`p-1.5 rounded border text-xs transition-colors ${
              autoScroll
                ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                : 'bg-slate-850 text-slate-400 border-slate-700'
            }`}
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClearLogs}
            title="Limpar logs"
            className="p-1.5 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5 text-xs leading-relaxed font-mono">
        {filteredLogs.length === 0 ? (
          <div className="text-slate-600 italic p-4 text-center">Nenhum log encontrado para o filtro selecionado.</div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 hover:bg-slate-900/40 px-1 py-0.5 rounded">
              <span className="text-slate-600 text-[11px] shrink-0 select-none">
                {log.timestamp}
              </span>

              {log.tag && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold uppercase tracking-wider shrink-0 select-none ${getTagColor(
                    log.tag
                  )}`}
                >
                  {log.tag}
                </span>
              )}

              <span
                className={`break-all ${
                  log.level === 'cmd'
                    ? 'text-cyan-300 font-semibold'
                    : log.level === 'error'
                    ? 'text-rose-400 font-bold'
                    : log.level === 'warn'
                    ? 'text-amber-300'
                    : log.level === 'success'
                    ? 'text-emerald-400'
                    : 'text-slate-300'
                }`}
              >
                {log.level === 'cmd' && <span className="text-slate-500 mr-1">$</span>}
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={terminalBottomRef} />
      </div>

      {/* Interactive Command Input */}
      <form
        onSubmit={handleCommandSubmit}
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 border-t border-slate-800 text-xs"
      >
        <span className="text-emerald-400 font-bold select-none">developer@gitserver:~$</span>
        <input
          type="text"
          value={customCommand}
          onChange={(e) => setCustomCommand(e.target.value)}
          placeholder="Ex: npm test, git status, git pull, help, clear..."
          className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 outline-none font-mono text-xs"
        />
        <button
          type="submit"
          disabled={!customCommand.trim()}
          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded text-xs font-medium transition-colors"
        >
          Executar
        </button>
      </form>
    </div>
  );
};
