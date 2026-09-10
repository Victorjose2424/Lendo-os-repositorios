import React, { useState } from 'react';
import { Bold, Italic, List, Code, Download, FileText, CheckSquare } from 'lucide-react';

const DEFAULT_MARKDOWN = `# Projeto Flow Notes 📝

Um aplicativo dinâmico importado diretamente do repositório Git!

### Recursos em Tempo Real:
- [x] Sincronização instantânea entre código e visualização
- [x] Contagem de palavras e caracteres integrada
- [ ] Exportação com um clique para arquivo \`.md\`

### Exemplo de Código:
\`\`\`typescript
const greeting = "Hello from dynamic Git repo!";
console.log(greeting);
\`\`\`

> *A inovação acontece quando o código ganha vida em tempo real.*`;

export const MarkdownNotesApp: React.FC = () => {
  const [content, setContent] = useState(DEFAULT_MARKDOWN);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const insertText = (prefix: string, suffix = '') => {
    setContent((prev) => prev + `\n${prefix}Texto${suffix}`);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'notas-gitrepo.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Simple clean markdown parser for quick inline rendering
  const renderSimpleMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('# ')) {
        return (
          <h1 key={idx} className="text-xl font-bold text-slate-900 dark:text-slate-100 my-2">
            {line.replace('# ', '')}
          </h1>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-3 mb-1">
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('- [x] ')) {
        return (
          <div key={idx} className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 my-0.5">
            <CheckSquare className="w-4 h-4" />
            <span className="line-through">{line.replace('- [x] ', '')}</span>
          </div>
        );
      }
      if (line.startsWith('- [ ] ')) {
        return (
          <div key={idx} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 my-0.5">
            <div className="w-4 h-4 border border-slate-400 rounded" />
            <span>{line.replace('- [ ] ', '')}</span>
          </div>
        );
      }
      if (line.startsWith('> ')) {
        return (
          <blockquote key={idx} className="border-l-4 border-amber-500 pl-3 italic text-slate-600 dark:text-slate-400 my-2 text-sm">
            {line.replace('> ', '')}
          </blockquote>
        );
      }
      if (line.startsWith('```')) {
        return (
          <div key={idx} className="text-xs font-mono bg-slate-900 text-amber-300 px-2 py-1 rounded my-1">
            {line}
          </div>
        );
      }
      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }
      return (
        <p key={idx} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed my-0.5">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="w-full h-full min-h-[480px] bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => insertText('**', '**')}
            title="Negrito"
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('*', '*')}
            title="Itálico"
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('- ')}
            title="Lista"
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertText('```typescript\n', '\n```')}
            title="Bloco de Código"
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-500 text-xs">
            {wordCount} palavras • {charCount} carac.
          </span>
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar .md</span>
          </button>
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 overflow-hidden">
        {/* Input Textarea */}
        <textarea
          aria-label="Conteúdo Markdown"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva seu Markdown aqui..."
          className="w-full h-full p-4 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-none"
        />

        {/* Live Preview */}
        <div className="p-4 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/40">
          <div className="max-w-prose">{renderSimpleMarkdown(content)}</div>
        </div>
      </div>
    </div>
  );
};
