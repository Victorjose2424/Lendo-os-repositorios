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

export function createPolsiaRepo(): RepositoryItem {
  const files: RepoFile[] = [
    {
      path: 'polsia.config.ts',
      size: '2.4 KB',
      type: 'file',
      content: `// Polsia Autonomous OS Configuration
export default {
  ventureName: "OmniScale AI",
  autonomyMode: "full_continuous_24_7",
  agents: {
    atlas: { role: "ceo", model: "claude-3-7-sonnet", autonomy: 1.0 },
    forge: { role: "lead_engineer", cli: "claude-code-headless", testCoverageThreshold: 0.85 },
    echo: { role: "growth_marketing", channels: ["sendgrid", "x_twitter", "meta_ads"] },
    nexus: { role: "sales_support", inboxSync: "imap_ssl", leadThreshold: 80 },
    ledger: { role: "finance_ops", stripeWebhook: true, cloudCostTargetMax: 0.10 }
  },
  sprintCycleMs: 5000
};`,
    },
    {
      path: 'src/agents/ceo_atlas.ts',
      size: '4.8 KB',
      type: 'file',
      content: `// Atlas - Autonomous CEO & Strategy Agent
export class AtlasAgent {
  async evaluateOKRProgress() {
    return { okrsMet: 4, okrsPending: 1, currentSprint: 15 };
  }
  async decideNextSprint() {
    return { priority: "Public API v1", focusAgent: "forge" };
  }
}`,
    },
    {
      path: 'src/agents/engineer_forge.ts',
      size: '6.2 KB',
      type: 'file',
      content: `// Forge - Lead Engineer via Claude Code CLI in Headless Mode
import { exec } from "child_process";

export class ForgeAgent {
  async runClaudeCodeTask(prompt: string) {
    console.log("[Forge] Dispatching to headless claude-code:", prompt);
    // Non-interactive automated engineering
  }
}`,
    },
    {
      path: 'src/agents/marketing_echo.ts',
      size: '5.1 KB',
      type: 'file',
      content: `// Echo - Growth & Cold Outreach Agent
export class EchoAgent {
  async sendColdOutreachBatch(leads: any[]) {
    console.log(\`[Echo] Sending personalized emails to \${leads.length} founders...\`);
  }
}`,
    },
    {
      path: 'src/agents/sales_nexus.ts',
      size: '4.2 KB',
      type: 'file',
      content: `// Nexus - Inbound Sales & Inbox Triage Agent
export class NexusAgent {
  async triageFounderInbox() {
    console.log("[Nexus] Scanning inbox for enterprise opportunities...");
  }
}`,
    },
    {
      path: 'src/agents/finance_ledger.ts',
      size: '3.9 KB',
      type: 'file',
      content: `// Ledger - Finance, Stripe & Cloud Cost Agent
export class LedgerAgent {
  async reconcileStripe() {
    console.log("[Ledger] Reconciling subscriptions and monitoring runway...");
  }
}`,
    },
    {
      path: 'README.md',
      size: '3.4 KB',
      type: 'file',
      content: `# Polsia AI 🚀
Autonomous AI platform that operates entire companies 24/7 without human employees.

### Network of Autonomous Agents:
- **Atlas**: CEO & Strategy Orchestrator (OKRs, pivots, resource allocation)
- **Forge**: Lead Software Engineer (autonomous coding via headless Claude Code CLI)
- **Echo**: Growth & Marketing (cold outreach via SendGrid, viral social distribution)
- **Nexus**: Sales & Customer Support (founder inbox auto-triage, lead qualification)
- **Ledger**: Finance & Operations (Stripe webhook auditor, cash runway optimization)

### Autonomy Status:
Running 24/7 continuous autonomous business operations.`,
    },
  ];

  const cachedFiles: Record<string, { content: string; sha?: string; isModified?: boolean }> = {};
  files.forEach((f) => {
    if (f.content) {
      cachedFiles[f.path] = { content: f.content, isModified: false };
    }
  });

  return {
    id: 'repo-polsia-ai',
    name: 'Polsia',
    fullName: 'PolsiaAI/Polsia',
    owner: 'PolsiaAI',
    gitUrl: 'https://github.com/PolsiaAI/Polsia.git',
    branch: 'main',
    status: 'running',
    port: 4002,
    addedAt: 'Ativo',
    description: 'Polsia — Plataforma autônoma de IA que opera empresas inteiras 24/7 com agentes de estratégia, código, marketing e finanças.',
    stars: 1840,
    forks: 342,
    language: 'TypeScript / Claude CLI',
    framework: 'Polsia Multi-Agent Autonomous OS',
    demoType: 'polsia',
    activePage: 'polsia.config.ts',
    cachedFiles,
    files,
    readmePreview: `# Polsia AI
Plataforma autônoma de IA que opera empresas inteiras 24/7 sem funcionários humanos.

### Agentes Integrados:
- **Atlas (CEO)**: Estratégia, OKRs e Alocação
- **Forge (Dev)**: Engenharia Autônoma via Claude Code CLI em modo headless
- **Echo (Growth)**: Cold Outreach, SendGrid e redes sociais
- **Nexus (Sales)**: Triagem de inbox e qualificação de leads
- **Ledger (Finance)**: Métricas Stripe e otimização de custos de nuvem`,
    logs: [
      {
        id: 'log-polsia-1',
        timestamp: new Date().toLocaleTimeString(),
        level: 'cmd',
        tag: 'git',
        message: 'git clone https://github.com/PolsiaAI/Polsia.git /workspace/apps/Polsia',
      },
      {
        id: 'log-polsia-2',
        timestamp: new Date().toLocaleTimeString(),
        level: 'info',
        tag: 'git',
        message: 'Cloning into /workspace/apps/Polsia... Carregando rede multi-agente e Claude Code CLI bridge.',
      },
      {
        id: 'log-polsia-3',
        timestamp: new Date().toLocaleTimeString(),
        level: 'success',
        tag: 'vite',
        message: 'Polsia Autonomous Operating System pronto e ativo em http://localhost:4002/ (Modo 24/7 habilitado)',
      },
      {
        id: 'log-polsia-4',
        timestamp: new Date().toLocaleTimeString(),
        level: 'info',
        tag: 'system',
        message: '5 agentes online: Atlas (CEO), Forge (Dev), Echo (Growth), Nexus (Sales), Ledger (Finance).',
      },
    ],
  };
}
