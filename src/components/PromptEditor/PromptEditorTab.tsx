import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  GitCommit,
  Play,
  RotateCcw,
  Copy,
  Check,
  FileCode,
  Layers,
  Wand2,
  AlertCircle,
  CheckCircle2,
  Cpu,
  ChevronDown,
  Info,
} from 'lucide-react';
import { RepositoryItem, RepoFile } from '../../types';
import { requestAiPromptEdit, fetchFileContent, getGitHubToken } from '../../utils/githubService';
import { GitHubCommitModal } from './GitHubCommitModal';

interface PromptEditorTabProps {
  repo: RepositoryItem;
  onUpdateFileCode: (filePath: string, newCode: string, newSha?: string) => void;
  onNavigateToPreview: () => void;
  onAppendLog: (message: string, level?: 'info' | 'warn' | 'error' | 'success' | 'cmd', tag?: 'git' | 'npm' | 'vite' | 'system' | 'runtime') => void;
}

export const PromptEditorTab: React.FC<PromptEditorTabProps> = ({
  repo,
  onUpdateFileCode,
  onNavigateToPreview,
  onAppendLog,
}) => {
  // Current active file in the editor
  const [activeFilePath, setActiveFilePath] = useState<string>(() => {
    // Pick first html or js or ts file, default to index.html if present
    const hasIndex = repo.files.some((f) => f.path.toLowerCase() === 'index.html');
    if (hasIndex) return 'index.html';
    return repo.files[0]?.path || 'index.html';
  });

  const [currentCode, setCurrentCode] = useState<string>('');
  const [originalCode, setOriginalCode] = useState<string>('');
  const [fileSha, setFileSha] = useState<string | undefined>(undefined);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  // Prompt AI state
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResultSummary, setAiResultSummary] = useState<string | null>(null);
  const [aiResultExplanation, setAiResultExplanation] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // UI state
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Prompt chips contextualized by file name
  const quickPrompts = useMemo(() => {
    const p = activeFilePath.toLowerCase();
    if (p.includes('editor')) {
      return [
        'Adicionar botão de download do render em alta resolução',
        'Melhorar o visual da barra de ferramentas e botões de estilo',
        'Adicionar opção para mudar a iluminação (dia/tarde/noite)',
        'Corrigir os botões de navegação para dashboard.html e 3d-preview.html',
      ];
    }
    if (p.includes('3d')) {
      return [
        'Adicionar botões para alternar texturas (madeira, concreto, vidro)',
        'Melhorar os controles de câmera orbital e rotação suave',
        'Adicionar botão para simulação de luz solar ao longo do dia',
        'Adicionar botão para retornar à tela inicial (index.html)',
      ];
    }
    if (p.includes('dashboard')) {
      return [
        'Adicionar novos cards de projetos arquitetônicos recentes',
        'Melhorar o visual do painel com tema moderno e limpo',
        'Adicionar botão de Novo Render direcionando para editor.html',
      ];
    }
    if (p.includes('login')) {
      return [
        'Adicionar validação visual nos campos de e-mail e senha',
        'Melhorar o design do formulário com sombras e cantos suaves',
        'Adicionar botão de Voltar para index.html',
      ];
    }
    return [
      'Adicionar botão de destaque chamando para o editor de renders',
      'Melhorar o layout responsivo e contraste de cores',
      'Corrigir links de navegação para editor.html, dashboard.html e login.html',
      'Adicionar seção de recursos avançados de renderização com IA',
    ];
  }, [activeFilePath]);

  // Load active file code (from cached state or GitHub)
  useEffect(() => {
    let isCancelled = false;

    const loadCode = async () => {
      // Check if file is already in repo.cachedFiles
      if (repo.cachedFiles && repo.cachedFiles[activeFilePath]) {
        const cached = repo.cachedFiles[activeFilePath];
        setCurrentCode(cached.content);
        setFileSha(cached.sha);
        if (!originalCode) {
          setOriginalCode(cached.content);
        }
        return;
      }

      // Check if file object has content
      const fileObj = repo.files.find((f) => f.path === activeFilePath);
      if (fileObj?.content) {
        setCurrentCode(fileObj.content);
        setOriginalCode(fileObj.content);
        setFileSha(fileObj.sha);
        return;
      }

      // Otherwise fetch from GitHub
      setIsLoadingFile(true);
      try {
        const res = await fetchFileContent(
          repo.owner,
          repo.name,
          activeFilePath,
          repo.branch
        );
        if (!isCancelled) {
          setCurrentCode(res.content);
          setOriginalCode(res.content);
          setFileSha(res.sha);
          onUpdateFileCode(activeFilePath, res.content, res.sha);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setAiError(`Falha ao carregar arquivo: ${err?.message}`);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingFile(false);
        }
      }
    };

    loadCode();

    return () => {
      isCancelled = true;
    };
  }, [activeFilePath, repo.owner, repo.name, repo.branch]);

  const isModified = currentCode !== originalCode;

  // Handle AI Prompt Execution
  const handleRunAiPrompt = async (instruction?: string) => {
    const textToRun = instruction || promptText;
    if (!textToRun.trim()) {
      alert('Por favor, digite o que deseja alterar no aplicativo.');
      return;
    }

    setIsGenerating(true);
    setAiError(null);
    setAiResultSummary(null);
    setAiResultExplanation(null);

    onAppendLog(`Executando Prompt IA para "${activeFilePath}": "${textToRun.slice(0, 45)}..."`, 'cmd', 'vite');

    const result = await requestAiPromptEdit({
      filePath: activeFilePath,
      fileContent: currentCode,
      prompt: textToRun.trim(),
      repoName: repo.fullName,
    });

    setIsGenerating(false);

    if (result.success && result.updatedCode) {
      setCurrentCode(result.updatedCode);
      setAiResultSummary(result.summary);
      setAiResultExplanation(result.explanation);
      onUpdateFileCode(activeFilePath, result.updatedCode, fileSha);

      showToast('Alteração gerada pela IA aplicada com sucesso ao código!');
      onAppendLog(`Alterações da IA aplicadas em "${activeFilePath}". Pronto para testar ou gravar no GitHub.`, 'success', 'system');
    } else {
      setAiError(result.error || 'Falha ao processar o prompt com IA.');
      onAppendLog(`Erro ao processar prompt IA: ${result.error}`, 'error', 'system');
    }
  };

  const handleManualCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = e.target.value;
    setCurrentCode(newCode);
    onUpdateFileCode(activeFilePath, newCode, fileSha);
  };

  const handleRevertCode = () => {
    if (window.confirm('Tem certeza que deseja reverter as alterações deste arquivo para a versão original?')) {
      setCurrentCode(originalCode);
      onUpdateFileCode(activeFilePath, originalCode, fileSha);
      showToast('Código revertido para a versão original.');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Código copiado para a área de transferência!');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const hasGhToken = Boolean(getGitHubToken());

  return (
    <div className="w-full h-full flex flex-col bg-slate-100 dark:bg-slate-950 font-sans overflow-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-4 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10">
        {/* File Switcher */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <FileCode className="w-4 h-4" />
          </div>

          <div className="relative">
            <select
              value={activeFilePath}
              onChange={(e) => setActiveFilePath(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-mono text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {repo.files && repo.files.length > 0 ? (
                repo.files.map((file) => (
                  <option key={file.path} value={file.path}>
                    {file.path} {file.size ? `(${file.size})` : ''}
                  </option>
                ))
              ) : (
                <>
                  <option value="index.html">index.html (Página Principal)</option>
                  <option value="editor.html">editor.html (Editor de Renders)</option>
                  <option value="3d-preview.html">3d-preview.html (Visualizador 3D)</option>
                  <option value="dashboard.html">dashboard.html (Painel do Usuário)</option>
                  <option value="login.html">login.html (Login)</option>
                </>
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {isModified && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              Modificado
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Test in App Preview */}
          <button
            type="button"
            onClick={onNavigateToPreview}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
            title="Ver o resultado na aba de Aplicação"
          >
            <Play className="w-3.5 h-3.5 fill-current text-emerald-500" />
            <span>Ver na Aplicação</span>
          </button>

          {/* Copy Code */}
          <button
            type="button"
            onClick={handleCopyCode}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Copiar código"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Revert button if modified */}
          {isModified && (
            <button
              type="button"
              onClick={handleRevertCode}
              className="flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 text-xs transition-colors cursor-pointer"
              title="Desfazer alterações"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reverter</span>
            </button>
          )}

          {/* COMMIT TO GITHUB BUTTON (Crucial User Requirement) */}
          <button
            type="button"
            onClick={() => setIsCommitModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <GitCommit className="w-4 h-4" />
            <span>Gravar no GitHub</span>
            {!hasGhToken && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />}
          </button>
        </div>
      </div>

      {/* Main Workspace: Left Prompt AI Panel + Right Code Editor */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Prompt AI Assistant (38% width on large screens) */}
        <div className="w-full lg:w-[420px] xl:w-[460px] bg-white dark:bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 flex flex-col p-4 sm:p-5 overflow-y-auto space-y-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-600 text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Aba de Prompt IA
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-900/60">
              <Cpu className="w-3 h-3" />
              Gemini 3.8 Flash
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Diga o que você quer alterar no arquivo{' '}
            <code className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
              {activeFilePath}
            </code>
            . A IA reescreverá o código e você poderá testar na hora e gravar no GitHub.
          </p>

          {/* Prompt Input Box */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Instrução para a IA:
            </label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Ex: Adicionar um novo botão de exportar imagens em alta resolução, trocar a cor do cabeçalho para azul escuro e corrigir os links de navegação..."
              rows={4}
              className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors placeholder-slate-400 resize-none leading-relaxed"
            />
            <button
              type="button"
              onClick={() => handleRunAiPrompt()}
              disabled={isGenerating || !promptText.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Gerando Alteração via IA...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Gerar Alteração via IA</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Sugestões Rápidas:
            </span>
            <div className="flex flex-col gap-1.5">
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPromptText(q);
                    handleRunAiPrompt(q);
                  }}
                  className="text-left text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer leading-snug"
                >
                  ⚡ {q}
                </button>
              ))}
            </div>
          </div>

          {/* AI Result Card */}
          {aiResultSummary && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Alterações Concluídas pela IA</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {aiResultSummary}
              </p>
              {aiResultExplanation && (
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {aiResultExplanation}
                </p>
              )}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onNavigateToPreview}
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg text-center cursor-pointer transition-colors"
                >
                  Ver Resultado ao Vivo
                </button>
                <button
                  type="button"
                  onClick={() => setIsCommitModalOpen(true)}
                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg text-center cursor-pointer transition-colors"
                >
                  Gravar no GitHub
                </button>
              </div>
            </div>
          )}

          {/* AI Error Alert */}
          {aiError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{aiError}</span>
            </div>
          )}

          {/* Helper Tips */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1 mt-auto">
            <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <Info className="w-3.5 h-3.5 text-indigo-500" />
              <span>Dica de Gravação:</span>
            </div>
            <p>
              Você pode editar o código diretamente no editor à direita ou pedir à IA. Quando terminar, clique em <strong>"Gravar no GitHub"</strong> para enviar um commit real para o seu repositório!
            </p>
          </div>
        </div>

        {/* Right: Code Editor (takes remaining width) */}
        <div className="flex-1 flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
          {/* Editor Sub-Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-indigo-400 font-semibold">{activeFilePath}</span>
              <span>•</span>
              <span>{currentCode.split('\n').length} linhas</span>
              <span>•</span>
              <span>{(new Blob([currentCode]).size / 1024).toFixed(1)} KB</span>
            </div>
            <div className="text-[11px] text-slate-500">
              {isLoadingFile ? 'Carregando do GitHub...' : 'Editor Interativo'}
            </div>
          </div>

          {/* Code Textarea */}
          <div className="flex-1 relative overflow-hidden flex">
            {/* Line numbers indicator */}
            <div className="w-12 py-3 bg-slate-950/80 select-none text-right pr-3 font-mono text-xs text-slate-600 border-r border-slate-800/80 overflow-hidden leading-relaxed">
              {currentCode
                .split('\n')
                .slice(0, 800)
                .map((_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
            </div>

            {/* Textarea */}
            <textarea
              value={currentCode}
              onChange={handleManualCodeChange}
              spellCheck={false}
              className="flex-1 p-3 bg-transparent text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-none overflow-y-auto whitespace-pre selection:bg-indigo-600/40"
              placeholder="Carregando código..."
            />
          </div>
        </div>
      </div>

      {/* GitHub Commit Modal */}
      <GitHubCommitModal
        isOpen={isCommitModalOpen}
        onClose={() => setIsCommitModalOpen(false)}
        owner={repo.owner}
        repo={repo.name}
        branch={repo.branch || 'main'}
        filePath={activeFilePath}
        fileContent={currentCode}
        fileSha={fileSha}
        onCommitSuccess={(res, msg) => {
          if (res.newFileSha) {
            setFileSha(res.newFileSha);
          }
          setOriginalCode(currentCode);
          onAppendLog(`Commit realizado no GitHub (${res.commitSha?.slice(0, 7)}): "${msg}"`, 'success', 'git');
          showToast('Código gravado com sucesso no GitHub!');
        }}
      />
    </div>
  );
};
