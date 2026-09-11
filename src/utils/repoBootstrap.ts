import { RepositoryItem, RepoFile } from '../types';
import { RENDERAHOUSE_FILES } from '../data/renderahouseFiles';

export function createRenderahouseRepo(): RepositoryItem {
  const cachedFiles: Record<string, { content: string; sha?: string; isModified?: boolean }> = {};
  Object.entries(RENDERAHOUSE_FILES).forEach(([path, content]) => {
    cachedFiles[path] = { content, isModified: false };
  });

  const files: RepoFile[] = [
    { path: 'index.html', size: '16.5 KB', type: 'file', content: RENDERAHOUSE_FILES['index.html'] },
    { path: 'editor.html', size: '30.5 KB', type: 'file', content: RENDERAHOUSE_FILES['editor.html'] },
    { path: '3d-preview.html', size: '18.0 KB', type: 'file', content: RENDERAHOUSE_FILES['3d-preview.html'] },
    { path: 'dashboard.html', size: '10.3 KB', type: 'file', content: RENDERAHOUSE_FILES['dashboard.html'] },
    { path: 'login.html', size: '7.9 KB', type: 'file', content: RENDERAHOUSE_FILES['login.html'] },
  ];

  return {
    id: 'repo-renderahouse-max',
    name: 'renderahouse-max',
    fullName: 'victormigueladrianojose-hash/renderahouse-max',
    owner: 'victormigueladrianojose-hash',
    gitUrl: 'https://github.com/victormigueladrianojose-hash/renderahouse-max.git',
    branch: 'main',
    status: 'running',
    port: 4001,
    addedAt: 'Ativo',
    description: 'Render a House MAX — Transforme desenhos em renders foto-realistas e visualizações arquitetônicas 3D interativas.',
    stars: 1,
    forks: 0,
    language: 'HTML / JavaScript / Three.js',
    framework: 'HTML5 Multi-Page + Three.js',
    demoType: 'web-app',
    demoUrl: 'https://victormigueladrianojose-hash.github.io/renderahouse-max/',
    activePage: 'index.html',
    cachedFiles,
    files,
    readmePreview: `# Render a House MAX
Plataforma web para transformação de desenhos e plantas em renders foto-realistas de alta fidelidade e visualizações 3D em tempo real.

### Módulos Integrados:
- **index.html**: Página inicial com conversor de estilos arquitetônicos
- **editor.html**: Estúdio completo de edição de renders e iluminação
- **3d-preview.html**: Visualizador 3D interativo com Three.js e órbita
- **dashboard.html**: Galeria de projetos e histórico de renderizações
- **login.html**: Autenticação e perfil

### Status de Execução:
Servidor dinâmico ativo na porta :4001. Suporta modificações em tempo real via **Chat Copilot IA** com gravação direta de commits no GitHub.`,
    logs: [
      {
        id: 'log-rh-1',
        timestamp: new Date().toLocaleTimeString(),
        level: 'cmd',
        tag: 'git',
        message: 'git clone https://github.com/victormigueladrianojose-hash/renderahouse-max.git /workspace/apps/renderahouse-max',
      },
      {
        id: 'log-rh-2',
        timestamp: new Date().toLocaleTimeString(),
        level: 'info',
        tag: 'git',
        message: 'Cloning into /workspace/apps/renderahouse-max... Resolvendo 5 páginas HTML e assets Three.js.',
      },
      {
        id: 'log-rh-3',
        timestamp: new Date().toLocaleTimeString(),
        level: 'success',
        tag: 'vite',
        message: 'Servidor multi-páginas pronto em http://localhost:4001/ (index.html, editor.html, 3d-preview.html, dashboard.html, login.html)',
      },
      {
        id: 'log-rh-4',
        timestamp: new Date().toLocaleTimeString(),
        level: 'info',
        tag: 'system',
        message: 'Chat Copilot IA ativado. Pronto para alterar o código e gravar commits no GitHub.',
      },
    ],
  };
}
