import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Play,
  GitCommit,
  FileCode,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  Wand2,
  ExternalLink,
  Code2,
  Trash2,
  HelpCircle,
  Flame,
} from 'lucide-react';
import { RepositoryItem, RepoFile, ChatMessage } from '../../types';
import { requestRepoChatCopilot, fetchFileContent, getGitHubToken } from '../../utils/githubService';
import { GitHubCommitModal } from '../PromptEditor/GitHubCommitModal';

interface RepoCopilotChatProps {
  repo: RepositoryItem;
  onUpdateFileCode: (filePath: string, newCode: string, newSha?: string) => void;
  onNavigateToPreview: () => void;
  onAppendLog: (
    message: string,
    level?: 'info' | 'warn' | 'error' | 'success' | 'cmd',
    tag?: 'git' | 'npm' | 'vite' | 'system' | 'runtime'
  ) => void;
  onOpenSplitView?: () => void;
  isSplitViewActive?: boolean;
}

export const RepoCopilotChat: React.FC<RepoCopilotChatProps> = ({
  repo,
  onUpdateFileCode,
  onNavigateToPreview,
  onAppendLog,
  onOpenSplitView,
  isSplitViewActive = false,
}) => {
  // Target file selection (or 'auto' for auto-detection)
  const [targetFile, setTargetFile] = useState<string>('auto');

  // Input prompt
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Commit Modal
  const [commitTargetFile, setCommitTargetFile] = useState<string>('index.html');
  const [commitTargetCode, setCommitTargetCode] = useState<string>('');
  const [commitInitialMessage, setCommitInitialMessage] = useState<string>('');
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);

  // Accordion open states for code previews (messageId -> boolean)
  const [expandedCodeMessages, setExpandedCodeMessages] = useState<Record<string, boolean>>({});

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Default welcome message for the repository
  const initialMessages = useMemo<ChatMessage[]>(() => {
    return [
      {
        id: `welcome-${repo.id}`,
        sender: 'assistant',
        timestamp: 'Agora',
        text: `Olá! Sou o **Copilot IA** do seu repositório clonado **${repo.fullName}**.\n\nEscreva abaixo o que você deseja melhorar ou adicionar. Posso alterar o design, criar novos botões, adicionar modo escuro, novos componentes interativos ou ajustar o código das páginas. Ao gerar, você pode **aplicar diretamente no repositório clonado** e ver o resultado imediatamente!`,
        suggestedPrompts: [
          '✨ Melhorar o visual e espaçamentos com estilo moderno',
          '🌙 Adicionar Modo Escuro com botão alternador',
          '🚀 Adicionar botão de download / exportar projeto',
          '🎨 Modernizar a paleta de cores e tipografia',
        ],
      },
    ];
  }, [repo.id, repo.fullName]);

  // Messages state (stored in localStorage or memory)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(`gitrepo_chat_${repo.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return initialMessages;
  });

  // Save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`gitrepo_chat_${repo.id}`, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages, repo.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Available files list in repo
  const availableFiles = useMemo(() => {
    if (repo.files && repo.files.length > 0) {
      return repo.files.filter((f) => f.type === 'file');
    }
    return [
      { path: 'index.html', size: '16.5 KB', type: 'file' as const },
      { path: 'editor.html', size: '30.5 KB', type: 'file' as const },
      { path: '3d-preview.html', size: '18.0 KB', type: 'file' as const },
      { path: 'dashboard.html', size: '10.3 KB', type: 'file' as const },
      { path: 'login.html', size: '7.9 KB', type: 'file' as const },
    ];
  }, [repo.files]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to get file content (from cachedFiles, files or fetch)
  const getFileContent = async (filePath: string): Promise<string> => {
    if (repo.cachedFiles && repo.cachedFiles[filePath]) {
      return repo.cachedFiles[filePath].content;
    }
    const found = repo.files?.find((f) => f.path === filePath);
    if (found?.content) {
      return found.content;
    }
    try {
      const res = await fetchFileContent(repo.owner, repo.name, filePath, repo.branch);
      return res.content;
    } catch {
      return '';
    }
  };

  // Send message to Copilot
  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputText).trim();
    if (!prompt) return;

    setInputText('');

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: prompt,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);

    onAppendLog(`[Copilot IA] Processando solicitação: "${prompt.slice(0, 45)}..."`, 'cmd', 'system');

    try {
      // Determine file to target
      let determinedFile = targetFile;
      if (determinedFile === 'auto') {
        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes('editor')) {
          determinedFile = 'editor.html';
        } else if (lowerPrompt.includes('3d') || lowerPrompt.includes('preview')) {
          determinedFile = '3d-preview.html';
        } else if (lowerPrompt.includes('dashboard') || lowerPrompt.includes('painel')) {
          determinedFile = 'dashboard.html';
        } else if (lowerPrompt.includes('login') || lowerPrompt.includes('auth')) {
          determinedFile = 'login.html';
        } else if (lowerPrompt.includes('index') || lowerPrompt.includes('inicio') || lowerPrompt.includes('início') || lowerPrompt.includes('home')) {
          determinedFile = 'index.html';
        } else {
          // Default to index.html if present or first html file
          const hasIndex = availableFiles.some((f) => f.path.toLowerCase() === 'index.html');
          determinedFile = hasIndex ? 'index.html' : availableFiles[0]?.path || 'index.html';
        }
      }

      // Fetch current code of target file
      const currentCode = await getFileContent(determinedFile);

      // Call API
      const result = await requestRepoChatCopilot({
        userMessage: prompt,
        repoName: repo.fullName,
        targetFile: determinedFile,
        fileContent: currentCode,
        availableFiles: availableFiles.map((f) => ({ path: f.path, size: f.size })),
        chatHistory: messages.map((m) => ({
          sender: m.sender === 'user' ? 'user' : 'assistant',
          text: m.text,
        })),
      });

      setIsGenerating(false);

      if (result.success && result.updatedCode) {
        const assistantMsgId = `assistant-${Date.now()}`;
        const finalTargetFile = result.targetFile || determinedFile;

        // Auto-apply directly to cloned repo!
        onUpdateFileCode(finalTargetFile, result.updatedCode);

        const assistantMsg: ChatMessage = {
          id: assistantMsgId,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: result.replyText,
          targetFile: finalTargetFile,
          applied: true,
          summary: result.summary,
          explanation: result.explanation,
          previousCode: currentCode,
          updatedCode: result.updatedCode,
          suggestedPrompts: result.suggestedFollowUps,
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // Auto-expand preview
        setExpandedCodeMessages((prev) => ({ ...prev, [assistantMsgId]: false }));

        showToast(`Alterações aplicadas automaticamente em "${finalTargetFile}"!`);
        onAppendLog(
          `[Copilot IA] Alterações aplicadas com sucesso no arquivo "${finalTargetFile}".`,
          'success',
          'system'
        );
      } else {
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `Não consegui processar a alteração: ${result.error || 'Ocorreu um erro no modelo de IA.'}`,
          error: result.error,
        };
        setMessages((prev) => [...prev, errorMsg]);
        onAppendLog(`[Copilot IA] Erro: ${result.error}`, 'error', 'system');
      }
    } catch (err: any) {
      setIsGenerating(false);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Erro ao comunicar com a IA: ${err?.message || 'Falha na conexão.'}`,
        error: err?.message,
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  // Reapply code from a previous message
  const handleApplyMessageCode = (msg: ChatMessage) => {
    if (!msg.targetFile || !msg.updatedCode) return;
    onUpdateFileCode(msg.targetFile, msg.updatedCode);
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, applied: true } : m))
    );
    showToast(`Código de "${msg.targetFile}" reaplicado no repositório clonado!`);
    onAppendLog(`[Copilot IA] Código reaplicado em "${msg.targetFile}".`, 'success', 'system');
  };

  // Revert code from a previous message
  const handleRevertMessageCode = (msg: ChatMessage) => {
    if (!msg.targetFile || !msg.previousCode) return;
    if (window.confirm(`Deseja desfazer as alterações e restaurar a versão anterior de "${msg.targetFile}"?`)) {
      onUpdateFileCode(msg.targetFile, msg.previousCode);
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, applied: false } : m))
      );
      showToast(`Alterações desfeitas em "${msg.targetFile}".`);
      onAppendLog(`[Copilot IA] Alterações desfeitas em "${msg.targetFile}".`, 'warn', 'system');
    }
  };

  // Open Commit Modal for a generated code
  const handleOpenCommit = (msg: ChatMessage) => {
    if (!msg.targetFile || !msg.updatedCode) return;
    setCommitTargetFile(msg.targetFile);
    setCommitTargetCode(msg.updatedCode);
    setCommitInitialMessage(msg.summary || `feat: melhorias via Copilot IA em ${msg.targetFile}`);
    setIsCommitModalOpen(true);
  };

  const handleClearHistory = () => {
    if (window.confirm('Deseja limpar todo o histórico de mensagens deste chat?')) {
      setMessages(initialMessages);
      localStorage.removeItem(`gitrepo_chat_${repo.id}`);
      showToast('Histórico do chat limpo.');
    }
  };

  const toggleCodeAccordion = (msgId: string) => {
    setExpandedCodeMessages((prev) => ({
      ...prev,
      [msgId]: !prev[msgId],
    }));
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                Copilot do Repositório
              </h2>
              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Gemini 3.6 Ativo
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate">
              Digite o que melhorar para alterar o código do repositório clonado em tempo real
            </p>
          </div>
        </div>

        {/* Target File & View Controls */}
        <div className="flex items-center gap-2">
          {/* Target File Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Arquivo:</span>
            <select
              value={targetFile}
              onChange={(e) => setTargetFile(e.target.value)}
              className="bg-transparent text-xs font-mono font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="auto">✨ Auto-detectar pelo prompt</option>
              {availableFiles.map((f) => (
                <option key={f.path} value={f.path}>
                  📄 {f.path}
                </option>
              ))}
            </select>
          </div>

          {/* Split View Toggle if available */}
          {onOpenSplitView && (
            <button
              type="button"
              onClick={onOpenSplitView}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                isSplitViewActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
              title="Visualizar o Chat e a Aplicação lado a lado"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Split View</span>
            </button>
          )}

          {/* Clear History Button */}
          <button
            type="button"
            onClick={handleClearHistory}
            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            title="Limpar histórico do chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          const isExpanded = Boolean(expandedCodeMessages[msg.id]);

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gradient-to-tr from-violet-600 to-indigo-600 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble Content */}
              <div className={`space-y-2 min-w-0 ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs'
                  }`}
                >
                  {/* Text formatted */}
                  <div className="whitespace-pre-wrap font-sans">
                    {msg.text.split('\n').map((paragraph, idx) => (
                      <p key={idx} className={idx > 0 ? 'mt-2' : ''}>
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  {/* Badges for Assistant if code was produced */}
                  {!isUser && msg.targetFile && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono text-[11px] font-semibold">
                        <FileCode className="w-3.5 h-3.5" />
                        {msg.targetFile}
                      </span>

                      {msg.applied && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aplicado no Repositório Clonado
                        </span>
                      )}

                      {msg.summary && (
                        <span className="text-[11px] text-slate-500 italic block w-full mt-1">
                          “{msg.summary}”
                        </span>
                      )}
                    </div>
                  )}

                  {/* Code Accordion Toggle */}
                  {!isUser && msg.updatedCode && (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => toggleCodeAccordion(msg.id)}
                        className="flex items-center justify-between w-full px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          <Code2 className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Ver Código Atualizado ({msg.updatedCode.split('\n').length} linhas)</span>
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 max-h-60 overflow-y-auto rounded-lg bg-slate-900 text-slate-100 p-3 font-mono text-[11px] border border-slate-700 select-all">
                          <pre className="whitespace-pre">{msg.updatedCode}</pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Bar for Generated Changes */}
                  {!isUser && msg.updatedCode && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={onNavigateToPreview}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Ver na Aplicação Ao Vivo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenCommit(msg)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        title="Enviar este código como commit no GitHub"
                      >
                        <GitCommit className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Gravar no GitHub</span>
                      </button>

                      {!msg.applied && (
                        <button
                          type="button"
                          onClick={() => handleApplyMessageCode(msg)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>Aplicar no Repositório</span>
                        </button>
                      )}

                      {msg.previousCode && (
                        <button
                          type="button"
                          onClick={() => handleRevertMessageCode(msg)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg text-xs font-medium transition-colors cursor-pointer ml-auto"
                          title="Restaurar versão anterior deste arquivo"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Desfazer</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div
                    className={`text-[10px] mt-2 font-sans ${
                      isUser ? 'text-indigo-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {/* Suggested Prompts pills */}
                {!isUser && msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 max-w-2xl">
                    {msg.suggestedPrompts.map((suggestion, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => handleSendMessage(suggestion)}
                        disabled={isGenerating}
                        className="text-xs bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 px-3 py-1.5 rounded-full transition-all text-left shadow-2xs cursor-pointer"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isGenerating && (
          <div className="flex gap-3 max-w-xl mr-auto animate-in fade-in">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-tl-xs shadow-xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>Copilot analisando código e gerando melhorias...</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Construindo a solução com Gemini 3.6 e preparando a aplicação no repositório clonado.
              </p>
              <div className="flex gap-1.5 mt-3">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar above input */}
      <div className="px-4 sm:px-6 py-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
        <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0 flex items-center gap-1">
          <Flame className="w-3 h-3 text-amber-500" />
          Rápido:
        </span>
        {[
          'Mude a cor dos botões para verde esmeralda',
          'Adicione modo escuro completo',
          'Crie um botão para baixar os renders em PDF',
          'Adicione animações suaves nos cards',
          'Melhore a barra de navegação',
        ].map((quick, qIdx) => (
          <button
            key={qIdx}
            type="button"
            onClick={() => handleSendMessage(quick)}
            disabled={isGenerating}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 text-[11px] font-medium transition-colors cursor-pointer"
          >
            {quick}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2 bg-slate-100 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
        >
          <textarea
            ref={inputRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Escreva aqui o que deseja melhorar no repositório clonado (ex: adicione modo escuro, mude o estilo dos botões, adicione download...)"
            rows={2}
            className="flex-1 bg-transparent text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none focus:outline-none px-2 py-1 leading-relaxed"
          />

          <button
            type="submit"
            disabled={isGenerating || !inputText.trim()}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-xs transition-all cursor-pointer shrink-0"
            title="Enviar solicitação de melhoria (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-slate-400">
          <span>
            Pressione <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">Enter</kbd> para enviar • <kbd className="font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">Shift+Enter</kbd> para nova linha
          </span>
          <span className="hidden sm:inline">
            ⚡ Alterações aplicadas automaticamente ao repositório clonado
          </span>
        </div>
      </div>

      {/* GitHub Commit Modal */}
      <GitHubCommitModal
        isOpen={isCommitModalOpen}
        onClose={() => setIsCommitModalOpen(false)}
        repo={repo}
        filePath={commitTargetFile}
        fileContent={commitTargetCode}
        currentSha={repo.cachedFiles?.[commitTargetFile]?.sha}
        initialCommitMessage={commitInitialMessage}
        onCommitSuccess={(commitUrl, commitSha, newFileSha) => {
          setIsCommitModalOpen(false);
          showToast('Commit gravado com sucesso no GitHub!');
          onAppendLog(
            `Commit realizado no branch ${repo.branch} (${commitSha.slice(0, 7)}): ${commitUrl}`,
            'success',
            'git'
          );
        }}
      />
    </div>
  );
};
