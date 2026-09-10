import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { RepositoryItem } from '../types';

export interface DeleteModalState {
  isOpen: boolean;
  type: 'single' | 'all';
  repo?: RepositoryItem | null;
  totalCount?: number;
}

interface DeleteConfirmModalProps {
  modalState: DeleteModalState;
  onClose: () => void;
  onConfirmDeleteSingle: (repoId: string) => void;
  onConfirmDeleteAll: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  modalState,
  onClose,
  onConfirmDeleteSingle,
  onConfirmDeleteAll,
}) => {
  const { isOpen, type, repo, totalCount } = modalState;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDeleteAll = type === 'all';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 p-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 shrink-0 border border-rose-200 dark:border-rose-900/60">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="flex-1 pr-4">
            <h3
              id="delete-confirm-title"
              className="text-base font-bold text-slate-900 dark:text-slate-100"
            >
              {isDeleteAll
                ? `Apagar Todos os Repositórios?`
                : `Apagar "${repo?.name || 'Repositório'}"?`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              {isDeleteAll ? (
                <>
                  Tem certeza que deseja apagar permanentemente{' '}
                  <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                    todos os {totalCount || 0} repositórios
                  </strong>{' '}
                  do seu painel de controle?
                </>
              ) : (
                <>
                  Tem certeza que deseja remover permanentemente o repositório{' '}
                  <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                    {repo?.fullName || repo?.name}
                  </strong>{' '}
                  do painel?
                </>
              )}
            </p>
          </div>
        </div>

        {/* Details Box */}
        {isDeleteAll ? (
          <div className="mt-4 p-3 bg-rose-50/60 dark:bg-rose-950/30 rounded-xl border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 space-y-1">
            <p className="font-semibold">Esta ação removerá:</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-600 dark:text-rose-400">
              <li>Todos os {totalCount || 0} módulos e aplicações carregadas</li>
              <li>Todos os servidores virtuais e portas ativas</li>
              <li>Todo o histórico de logs do terminal</li>
            </ul>
          </div>
        ) : (
          repo && (
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 font-mono text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Repositório:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[220px]">
                  {repo.fullName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Porta virtual:</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  :{repo.port}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Status:</span>
                <span className="capitalize">{repo.status}</span>
              </div>
            </div>
          )
        )}

        <p className="mt-3 text-[11px] text-slate-400 leading-tight">
          Você poderá adicionar novos repositórios a qualquer momento inserindo o link do GitHub.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            autoFocus
            onClick={() => {
              if (isDeleteAll) {
                onConfirmDeleteAll();
              } else if (repo) {
                onConfirmDeleteSingle(repo.id);
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>
              {isDeleteAll
                ? `Sim, Apagar Todos (${totalCount || 0})`
                : 'Sim, Apagar Repositório'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
