import React, { useState, useEffect } from 'react';
import {
  X,
  GitCommit,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  GitBranch,
} from 'lucide-react';
import {
  getGitHubToken,
  setGitHubToken,
  clearGitHubToken,
  verifyGitHubToken,
  commitFileToGitHub,
  GitHubCommitResult,
  GitHubUser,
} from '../../utils/githubService';

interface GitHubCommitModalProps {
  isOpen: boolean;
  onClose: () => void;
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
  fileContent: string;
  fileSha?: string;
  onCommitSuccess: (result: GitHubCommitResult, message: string) => void;
}

export const GitHubCommitModal: React.FC<GitHubCommitModalProps> = ({
  isOpen,
  onClose,
  owner,
  repo,
  branch,
  filePath,
  fileContent,
  fileSha,
  onCommitSuccess,
}) => {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [verifiedUser, setVerifiedUser] = useState<GitHubUser | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [commitMessage, setCommitMessage] = useState(
    `feat(${filePath}): atualizar interface via Prompt IA`
  );
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitResult, setCommitResult] = useState<GitHubCommitResult | null>(null);

  // Load existing token on mount
  useEffect(() => {
    if (isOpen) {
      const stored = getGitHubToken();
      setToken(stored);
      setCommitResult(null);
      setTokenError(null);
      setCommitMessage(`feat(${filePath}): atualizar via Prompt IA`);

      if (stored) {
        checkToken(stored);
      }
    }
  }, [isOpen, filePath]);

  const checkToken = async (tok: string) => {
    setIsVerifying(true);
    setTokenError(null);
    const res = await verifyGitHubToken(tok);
    setIsVerifying(false);
    if (res.isValid && res.user) {
      setVerifiedUser(res.user);
    } else {
      setVerifiedUser(null);
      setTokenError(res.error || 'Token inválido ou expirado.');
    }
  };

  const handleSaveToken = async () => {
    if (!token.trim()) {
      clearGitHubToken();
      setVerifiedUser(null);
      return;
    }
    setGitHubToken(token.trim());
    await checkToken(token.trim());
  };

  const handleRemoveToken = () => {
    clearGitHubToken();
    setToken('');
    setVerifiedUser(null);
    setTokenError(null);
  };

  const handleExecuteCommit = async () => {
    if (!commitMessage.trim()) {
      alert('Por favor, informe uma mensagem de commit.');
      return;
    }

    setIsCommitting(true);
    setCommitResult(null);

    const result = await commitFileToGitHub({
      owner,
      repo,
      path: filePath,
      content: fileContent,
      message: commitMessage.trim(),
      sha: fileSha,
      branch: branch || 'main',
      token: token.trim(),
    });

    setIsCommitting(false);
    setCommitResult(result);

    if (result.success) {
      onCommitSuccess(result, commitMessage.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                Gravar no GitHub (Commit & Push)
              </h3>
              <p className="text-xs text-slate-500">
                Repositório: <span className="font-semibold text-slate-700 dark:text-slate-300">{owner}/{repo}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* File & Branch Info Chip */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">Arquivo:</span>
              <code className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                {filePath}
              </code>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-mono">
              <GitBranch className="w-3.5 h-3.5 text-indigo-500" />
              <span>{branch}</span>
            </div>
          </div>

          {/* GitHub Token Section */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>Autenticação no GitHub</span>
              </div>
              {verifiedUser && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Conectado como @{verifiedUser.login}
                </span>
              )}
            </div>

            {!verifiedUser ? (
              <div>
                <p className="text-xs text-slate-500 mb-2 leading-relaxed">
                  Para gravar arquivos diretamente no repositório do GitHub, insira o seu Personal Access Token (Classic ou Fine-grained com permissão de escrita).
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="ghp_... ou github_pat_..."
                      className="w-full pl-8 pr-9 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveToken}
                    disabled={isVerifying || !token.trim()}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    {isVerifying ? 'Verificando...' : 'Salvar'}
                  </button>
                </div>
                {tokenError && (
                  <p className="text-[11px] text-rose-500 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{tokenError}</span>
                  </p>
                )}
                <div className="mt-2 text-[11px] text-slate-500">
                  <span>Não tem um token? </span>
                  <a
                    href="https://github.com/settings/tokens?type=beta"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    <span>Criar token no GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-2">
                  <img
                    src={verifiedUser.avatar_url}
                    alt={verifiedUser.login}
                    className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-700"
                  />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">
                    {verifiedUser.name || verifiedUser.login}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveToken}
                  className="text-slate-400 hover:text-rose-500 text-[11px] underline"
                >
                  Trocar Token
                </button>
              </div>
            )}
          </div>

          {/* Commit Message Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
              Mensagem de Commit (O que foi alterado)
            </label>
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Ex: feat(editor): adicionar novo botão de renderização"
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Result Alert */}
          {commitResult && (
            <div
              className={`p-4 rounded-xl text-xs border ${
                commitResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200'
              }`}
            >
              {commitResult.success ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Gravação Realizada com Sucesso!</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    O arquivo <strong>{filePath}</strong> foi atualizado e commitado diretamente no branch{' '}
                    <strong>{branch}</strong> do repositório.
                  </p>
                  {commitResult.commitUrl && (
                    <a
                      href={commitResult.commitUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold underline mt-1"
                    >
                      <span>Visualizar Commit no GitHub</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Falha ao Gravar no GitHub</span>
                    <span>{commitResult.error}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            {commitResult?.success ? 'Fechar' : 'Cancelar'}
          </button>

          {!commitResult?.success && (
            <button
              type="button"
              onClick={handleExecuteCommit}
              disabled={isCommitting || !token.trim() || !commitMessage.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <GitCommit className="w-4 h-4" />
              <span>{isCommitting ? 'Gravando no GitHub...' : 'Confirmar e Gravar no GitHub'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
