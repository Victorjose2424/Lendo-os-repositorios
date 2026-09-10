import React from 'react';
import { Layers, GitBranch, Menu, Moon, Sun, Info, Activity, Terminal, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  runningCount: number;
  totalCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileSidebar,
  darkMode,
  onToggleDarkMode,
  runningCount,
  totalCount,
}) => {
  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between z-20 select-none">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Alternar Menu"
          className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 tracking-tight">
                GitRepo Hub
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60 font-semibold">
                Dynamic Hub
              </span>
            </div>
            <p className="hidden md:block text-[10px] text-slate-500 -mt-0.5">
              Gerenciador & Runtime Dinâmico de Repositórios
            </p>
          </div>
        </div>
      </div>

      {/* Center / Right stats & utilities */}
      <div className="flex items-center gap-3">
        {/* Status Pills */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-medium">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>{totalCount} Repositórios</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{runningCount} Rodando</span>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={onToggleDarkMode}
          title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>
      </div>
    </header>
  );
};
