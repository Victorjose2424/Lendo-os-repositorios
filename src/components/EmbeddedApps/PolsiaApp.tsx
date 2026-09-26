import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Play,
  Pause,
  RefreshCw,
  Zap,
  TrendingUp,
  DollarSign,
  Users,
  Code,
  Mail,
  MessageSquare,
  Shield,
  Terminal,
  Settings,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Copy,
  Check,
  Sparkles,
  Filter,
  ChevronRight,
  Activity,
  Clock,
  Cpu,
  GitBranch,
  GitCommit,
  FileText,
  Send,
  Building,
  ShieldCheck,
  Layers,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { RepositoryItem } from '../../types';

interface AgentInfo {
  id: string;
  name: string;
  codename: string;
  role: string;
  description: string;
  avatarColor: string;
  status: 'active' | 'executing' | 'idle';
  currentTask: string;
  actionsToday: number;
  confidence: number;
  tools: string[];
}

interface ActivityEvent {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  type: 'code' | 'marketing' | 'sales' | 'strategy' | 'finance';
  toolUsed: string;
  title: string;
  description: string;
  payload?: string;
  status: 'completed' | 'in_progress' | 'queued';
}

const INITIAL_AGENTS: AgentInfo[] = [
  {
    id: 'atlas',
    name: 'Atlas',
    codename: 'CEO & Estratégia',
    role: 'Orquestração de Negócios e OKRs',
    description: 'Define direcionamento estratégico, avalia concorrência e aloca recursos entre os agentes autônomos.',
    avatarColor: 'from-amber-500 to-orange-600',
    status: 'active',
    currentTask: 'Avaliando precificação do plano Enterprise ($499/mês) e calculando CAC payback.',
    actionsToday: 48,
    confidence: 99.2,
    tools: ['MarketAnalyzer', 'OKRManager', 'ResourceAllocator', 'DecisionEngine'],
  },
  {
    id: 'forge',
    name: 'Forge',
    codename: 'Lead Engineer',
    role: 'Desenvolvimento Autônomo & Claude Code CLI',
    description: 'Escreve código, executa testes, gerencia PRs e faz deploy contínuo via Claude Code CLI em modo headless.',
    avatarColor: 'from-indigo-500 to-violet-600',
    status: 'executing',
    currentTask: 'Executando Claude Code CLI: Implementando rate limiting distribuído em /src/middleware/throttle.ts.',
    actionsToday: 134,
    confidence: 98.7,
    tools: ['ClaudeCodeHeadless', 'GitAutomation', 'TestRunner', 'DockerCLI'],
  },
  {
    id: 'echo',
    name: 'Echo',
    codename: 'Growth & Marketing',
    role: 'Campanhas Frias, Redes Sociais & Anúncios',
    description: 'Gera e dispara sequências de e-mail frio pelo SendGrid, cria posts virais no X e gerencia campanhas Meta Ads.',
    avatarColor: 'from-rose-500 to-pink-600',
    status: 'active',
    currentTask: 'Disparando sequência #3 de cold outreach para 85 fundadores de SaaS B2B (Taxa de abertura: 61.4%).',
    actionsToday: 212,
    confidence: 96.5,
    tools: ['SendGridAPI', 'XTwitterPublisher', 'MetaAdsManager', 'SEOOptimizer'],
  },
  {
    id: 'nexus',
    name: 'Nexus',
    codename: 'Sales & Atendimento',
    role: 'Triagem de Inbox, Qualificação e Suporte',
    description: 'Monitora a caixa de entrada do fundador via IMAP/SMTP, qualifica leads inbound e responde tickets automaticamente.',
    avatarColor: 'from-emerald-500 to-teal-600',
    status: 'active',
    currentTask: 'Triagem de 12 e-mails inbound. Qualificado lead enterprise da CloudScale Inc (Potencial: $2.4k/mês).',
    actionsToday: 89,
    confidence: 97.8,
    tools: ['IMAPReader', 'LeadScorer', 'ZendeskBridge', 'CalendarScheduler'],
  },
  {
    id: 'ledger',
    name: 'Ledger',
    codename: 'Finance & Ops',
    role: 'Métricas Stripe, Fluxo de Caixa e Custos de Nuvem',
    description: 'Escuta webhooks do Stripe, rastreia MRR/ARR, projeta runway e audita faturas da AWS/GCP para cortar custos.',
    avatarColor: 'from-cyan-500 to-blue-600',
    status: 'idle',
    currentTask: 'Reconciliação diária do Stripe. Detectou economia de $340/mês em instâncias ociosas na nuvem.',
    actionsToday: 32,
    confidence: 99.8,
    tools: ['StripeWebhooks', 'CloudCostAuditor', 'RunwayCalculator', 'InvoiceMatcher'],
  },
];

const INITIAL_EVENTS: ActivityEvent[] = [
  {
    id: 'ev-1',
    timestamp: '11:42:05',
    agentId: 'forge',
    agentName: 'Forge (Dev)',
    type: 'code',
    toolUsed: 'ClaudeCode CLI',
    title: 'Commit autônomo gerado: feat(auth): add JWT refresh token rotation',
    description: 'Claude Code headless executou testes unitários (18/18 passaram) e abriu o PR #42 no GitHub.',
    payload: `// /src/auth/jwt.ts
export async function rotateRefreshToken(token: string) {
  const decoded = await verifyToken(token);
  const newAccessToken = generateToken({ sub: decoded.sub }, '15m');
  const newRefreshToken = generateToken({ sub: decoded.sub }, '7d');
  await storeSession(decoded.sub, newRefreshToken);
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}`,
    status: 'completed',
  },
  {
    id: 'ev-2',
    timestamp: '11:41:18',
    agentId: 'echo',
    agentName: 'Echo (Growth)',
    type: 'marketing',
    toolUsed: 'SendGrid Engine',
    title: 'Disparo de 50 emails frios para Diretores de TI com oferta de piloto gratuito',
    description: 'Campanha "AI Ops Automation Q3" atingiu 64% de taxa de abertura e 4 agendamentos de demo gerados.',
    payload: `Assunto: Automatize 80% do suporte técnico da sua equipe em 48 horas

Olá {{first_name}},

Vi que você lidera a engenharia na {{company}}. Desenvolvemos um orquestrador multi-agente que resolve tickets técnicos e monitora servidores 24/7 sem intervenção manual.

Gostaria de rodar um piloto de 7 dias com a sua equipe?`,
    status: 'completed',
  },
  {
    id: 'ev-3',
    timestamp: '11:39:50',
    agentId: 'nexus',
    agentName: 'Nexus (Sales)',
    type: 'sales',
    toolUsed: 'LeadScorer AI',
    title: 'Lead Inbound Qualificado: Apex Dynamics (Score: 94/100)',
    description: 'Ticket classificado como alta prioridade. Demo agendada automaticamente para quinta-feira às 14:00.',
    payload: `Lead: Apex Dynamics (120 funcionários)
Interesse: Automação completa de atendimento e faturamento
Orçamento estimado: $1,200/mês
Status: Reunião agendada via Google Meet`,
    status: 'completed',
  },
  {
    id: 'ev-4',
    timestamp: '11:38:12',
    agentId: 'ledger',
    agentName: 'Ledger (Finance)',
    type: 'finance',
    toolUsed: 'Stripe Webhooks',
    title: 'Nova Assinatura Stripe: Plano Pro Anual (+$1,440.00)',
    description: 'Webhook checkout.session.completed processado com sucesso. MRR atualizado para $18,940.',
    payload: `Customer: techflow-studios@example.com
Amount: $1,440.00 (Anual)
Stripe Invoice ID: in_1Nx82...
MRR Impact: +$120.00/mês`,
    status: 'completed',
  },
  {
    id: 'ev-5',
    timestamp: '11:35:40',
    agentId: 'atlas',
    agentName: 'Atlas (CEO)',
    type: 'strategy',
    toolUsed: 'DecisionEngine',
    title: 'Aprovação de Sprint #15: Foco em Expansão de Integrações e API Pública',
    description: 'Alocados 60% dos ciclos de processamento de Forge para desenvolvimento da API pública v1.',
    payload: `Sprint Goal: Lançamento da Polsia Public API v1
Expected MRR boost: +25%
Target release: 7 dias
Supervisão: 100% Autônomo`,
    status: 'completed',
  },
];

interface PolsiaAppProps {
  repo?: RepositoryItem;
}

export const PolsiaApp: React.FC<PolsiaAppProps> = ({ repo }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stream' | 'dispatcher' | 'terminal' | 'integrations' | 'financials'>('overview');
  const [isAutonomous, setIsAutonomous] = useState(true);
  const [companyName, setCompanyName] = useState('OmniScale AI');
  const [mrr, setMrr] = useState(18940);
  const [totalActions, setTotalActions] = useState(2419);
  const [agents, setAgents] = useState<AgentInfo[]>(INITIAL_AGENTS);
  const [events, setEvents] = useState<ActivityEvent[]>(INITIAL_EVENTS);
  const [streamFilter, setStreamFilter] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<ActivityEvent | null>(INITIAL_EVENTS[0]);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Dispatcher state
  const [selectedAgentId, setSelectedAgentId] = useState<string>('forge');
  const [promptText, setPromptText] = useState('');
  const [isExecutingPrompt, setIsExecutingPrompt] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    agent: string;
    actionTitle: string;
    thinking: string;
    toolCalls: string[];
    output: string;
  } | null>(null);

  // Terminal state
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[POLSIA-BOOT] Initializing Polsia Autonomous OS v2.4...',
    '[POLSIA-BOOT] Loaded 5 agents: Atlas, Forge, Echo, Nexus, Ledger.',
    '[CLAUDE-CLI] Connected to Claude Code Headless CLI socket on /var/run/claude.sock',
    '[INTEGRATIONS] SendGrid: Connected | Stripe: Listening (whsec_live) | GitHub: PolsiaAI/Polsia',
    '[24/7-DAEMON] Autonomy daemon online. Periodic task cycles active (interval: 5000ms).',
    '[FORGE-CLI] > claude-code --non-interactive "run security audit on /src"',
    '[FORGE-CLI] Scanning 42 files... 0 vulnerabilities found. Clean AST.',
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (activeTab === 'terminal') {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs, activeTab]);

  // Periodic autonomous event generator (simulates continuous 24/7 business execution)
  useEffect(() => {
    if (!isAutonomous) return;

    const interval = setInterval(() => {
      const sampleEvents: Omit<ActivityEvent, 'id' | 'timestamp'>[] = [
        {
          agentId: 'forge',
          agentName: 'Forge (Dev)',
          type: 'code',
          toolUsed: 'ClaudeCode CLI',
          title: 'Refatoração autônoma de query de alto desempenho em /src/db/analytics.ts',
          description: 'Tempo de resposta de analytics reduzido de 142ms para 18ms. PR aprovado e mesclado na branch main.',
          payload: `// /src/db/analytics.ts
export async function getAggregatedKpis(tenantId: string) {
  return await db.query(
    sql\`SELECT SUM(amount) as mrr, COUNT(*) as customers FROM subscriptions WHERE tenant_id = \${tenantId} AND status = 'active'\`
  );
}`,
          status: 'completed',
        },
        {
          agentId: 'echo',
          agentName: 'Echo (Growth)',
          type: 'marketing',
          toolUsed: 'XTwitterPublisher',
          title: 'Post viral publicado no X sobre autonomia multi-agente',
          description: 'Obteve 184 retweets e gerou 92 novos visitantes únicos para a página inicial nos últimos 15 min.',
          payload: `Como nossa empresa roda 24/7 sem nenhum funcionário humano usando agentes autônomos e Claude Code:

1. Forge cuida do código e PRs
2. Echo orquestra outbound e social
3. Nexus fecha os leads no inbox
4. Ledger monitora cada centavo do Stripe

A era das empresas de 1 pessoa com faturamento de $1M chegou. 🧵👇`,
          status: 'completed',
        },
        {
          agentId: 'nexus',
          agentName: 'Nexus (Sales)',
          type: 'sales',
          toolUsed: 'IMAPReader',
          title: 'Auto-resposta de suporte técnico enviada para cliente Enterprise',
          description: 'Identificado problema de CORS na configuração de webhook do cliente. Solução com snippet enviada em 4.2s.',
          payload: `De: Nexus AI <support@polsia.ai>
Para: dev@novatech.io
Assunto: Re: Webhook Signature Verification Error

Olá time da NovaTech! Detectamos o header 'x-polsia-signature' no seu payload. Certifique-se de validar o HMAC usando sha256 com sua secret key. Exemplo em anexo.`,
          status: 'completed',
        },
        {
          agentId: 'ledger',
          agentName: 'Ledger (Finance)',
          type: 'finance',
          toolUsed: 'StripeWebhooks',
          title: 'Stripe Payout reconciliado: $3,450.00 transferido para conta bancária',
          description: 'Receita líquida processada sem contestações. Taxa de churn atual mantida em 1.1% (excelente).',
          payload: `Payout ID: po_1Oa...
Status: In Transit
Gross Volume: $3,620.00
Stripe Fees: $170.00
Net Transferred: $3,450.00`,
          status: 'completed',
        },
        {
          agentId: 'atlas',
          agentName: 'Atlas (CEO)',
          type: 'strategy',
          toolUsed: 'MarketAnalyzer',
          title: 'Análise competitiva de mercado concluída: oportunidade de expansão detectada',
          description: 'Identificado gap no mercado europeu para conformidade com GDPR em agentes autônomos. Requisitos criados.',
          payload: `Análise: Concorrentes demoram 14 dias para deploy GDPR.
Polsia V2 implementa data residency em Frankfurt com 1 clique.
Previsão de crescimento: +35% de captação na UE.`,
          status: 'completed',
        },
      ];

      const chosen = sampleEvents[Math.floor(Math.random() * sampleEvents.length)];
      const newEvent: ActivityEvent = {
        ...chosen,
        id: `ev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: new Date().toLocaleTimeString(),
      };

      setEvents((prev) => [newEvent, ...prev.slice(0, 39)]);
      setTotalActions((c) => c + 1);

      // Increment MRR randomly sometimes
      if (Math.random() > 0.6) {
        const delta = Math.floor(10 + Math.random() * 80);
        setMrr((m) => m + delta);
      }

      // Add to terminal logs
      setTerminalLogs((prev) => [
        ...prev.slice(-80),
        `[${chosen.agentName.toUpperCase()}] [${chosen.toolUsed}] ${chosen.title}`,
      ]);
    }, 5500);

    return () => clearInterval(interval);
  }, [isAutonomous]);

  // Handle command dispatch to an agent
  const handleDispatch = async (customInstruction?: string) => {
    const text = customInstruction || promptText;
    if (!text.trim()) return;

    setIsExecutingPrompt(true);
    setExecutionResult(null);

    const targetAgent = agents.find((a) => a.id === selectedAgentId) || agents[0];

    // Try calling backend server API
    try {
      const res = await fetch('/api/polsia-agent-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName: targetAgent.name,
          agentRole: targetAgent.role,
          instruction: text,
          companyName: companyName,
          mrr: mrr,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setExecutionResult({
          agent: data.agent || targetAgent.name,
          actionTitle: data.actionTitle || `Execução de: ${text.slice(0, 50)}...`,
          thinking: data.thinking || `Agente ${targetAgent.name} planejou a execução com base nos objetivos estratégicos de ${companyName}.`,
          toolCalls: data.toolCalls || [targetAgent.tools[0], 'ResultValidator'],
          output: data.output || 'Tarefa executada com êxito e entregável gerado.',
        });

        // Add event
        const newEvent: ActivityEvent = {
          id: `ev-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString(),
          agentId: targetAgent.id,
          agentName: `${targetAgent.name} (${targetAgent.codename})`,
          type: (targetAgent.id === 'forge' ? 'code' : targetAgent.id === 'echo' ? 'marketing' : targetAgent.id === 'nexus' ? 'sales' : targetAgent.id === 'ledger' ? 'finance' : 'strategy') as any,
          toolUsed: targetAgent.tools[0],
          title: data.actionTitle || `Comando do usuário executado: ${text.slice(0, 45)}...`,
          description: data.thinking || `Entregável gerado e integrado ao ambiente autônomo.`,
          payload: data.output,
          status: 'completed',
        };
        setEvents((prev) => [newEvent, ...prev]);
        setSelectedEvent(newEvent);
        setTotalActions((c) => c + 1);
        setIsExecutingPrompt(false);
        return;
      }
    } catch {
      // Fallback to high-quality client-side agent synthesis
    }

    // Client-side fallback simulator with domain-specific realistic output
    setTimeout(() => {
      let outputSnippet = '';
      let thinking = '';
      let toolCalls: string[] = [];

      if (targetAgent.id === 'forge') {
        toolCalls = ['ClaudeCode CLI', 'GitAutomation', 'JestRunner'];
        thinking = `Analisou a base de código do repositório PolsiaAI/Polsia. Identificou arquivos relacionados. Gerou implementação modular em TypeScript com tipagem estrita e testes automatizados.`;
        outputSnippet = `// Solução gerada por Forge via Claude Code CLI:
import { z } from 'zod';

export const ActionPayloadSchema = z.object({
  id: z.string().uuid(),
  agent: z.enum(['atlas', 'forge', 'echo', 'nexus', 'ledger']),
  command: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  timestamp: z.number().default(() => Date.now()),
});

export async function executeAutonomousAction(input: z.infer<typeof ActionPayloadSchema>) {
  console.log(\`[Polsia:Forge] Executing \${input.command} for \${input.agent}\`);
  // Processamento autônomo via bridge CLI
  return { success: true, latencyMs: 14.2, timestamp: Date.now() };
}`;
      } else if (targetAgent.id === 'echo') {
        toolCalls = ['SendGrid Engine', 'OpenAI Copywriter', 'XPublisher'];
        thinking = `Estruturou estratégia de captação B2B. Otimizou gatilhos de dor de fundadores (tempo gasto com tarefas manuais) e call-to-action de baixo atrito.`;
        outputSnippet = `🎯 SEQUÊNCIA DE COLD EMAIL - CONVERSÃO ESTIMADA: 42%

Assunto: Reduzindo 15h semanais de tarefas operacionais na {{company}}

Oi {{first_name}},

Percebi que você está expandindo o time de operações da {{company}}. 
Nosso orquestrador autônomo (Polsia) assume triagem de emails, emissão de cobranças no Stripe e resolução de tickets de código sem precisar contratar mais ninguém.

Podemos rodar um teste no seu ambiente amanhã por 10 minutos?

Um abraço,
Equipe Polsia AI`;
      } else if (targetAgent.id === 'atlas') {
        toolCalls = ['OKRManager', 'MarketIntelligence', 'UnitEconomics'];
        thinking = `Calculou projeção de MRR baseada na velocidade atual. Identificou oportunidade de aumentar LTV em 28% através de planos anuais com desconto de 2 meses.`;
        outputSnippet = `📊 RELATÓRIO ESTRATÉGICO & OKRs - POLSIA OS

Objetivo 1: Acelerar MRR de $18.9k para $30k em 60 dias
- KR1: Aumentar conversão de cold outbound para 8% (Agente Echo)
- KR2: Implementar 4 novas integrações no marketplace (Agente Forge)
- KR3: Manter taxa de churn mensal abaixo de 1.5% (Agente Nexus)

Diretriz de Execução:
Manter modo 100% autônomo ativo. Todos os PRs com cobertura de testes >90% serão mesclados automaticamente.`;
      } else if (targetAgent.id === 'nexus') {
        toolCalls = ['IMAPReader', 'LeadScorer', 'ZendeskBridge'];
        thinking = `Analisou o funil de leads inbound. Classificou intenção de compra e gerou template de qualificação consultiva.`;
        outputSnippet = `📋 ROTEIRO DE QUALIFICAÇÃO INBOUND & TRIAGEM

1. Identificação do Perfil de Cliente Ideal (ICP):
   - Empresas B2B SaaS de 10 a 200 funcionários
   - Volume de tickets > 300/mês
   - Stack: TypeScript, React, Stripe, AWS/GCP

2. Resposta Automatizada de Alto Impacto:
   "Recebemos sua solicitação! Seu ambiente de demonstração da Polsia foi provisionado em http://sandbox.polsia.ai/trial. Um agente virtual já começou a catalogar seus fluxos."`;
      } else {
        toolCalls = ['StripeWebhooks', 'CloudCostAuditor', 'RunwayCalculator'];
        thinking = `Auditoria de custos em tempo real concluída. Detectou otimização tributária e alocação de servidores sob demanda.`;
        outputSnippet = `💰 AUDITORIA FINANCEIRA & BALANÇO POLSIA

- MRR Atual: $18,940 (+18.4% MoM)
- ARR Projetado: $227,280
- Custo de Servidores / Nuvem: $1,420/mês (7.5% da receita)
- Margem Bruta: 92.5%
- Runway Estimado com Saldo em Caixa: 26 meses (Zero risco de insolvência)`;
      }

      setExecutionResult({
        agent: targetAgent.name,
        actionTitle: `Execução de: "${text.slice(0, 50)}..."`,
        thinking,
        toolCalls,
        output: outputSnippet,
      });

      const newEvent: ActivityEvent = {
        id: `ev-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        agentId: targetAgent.id,
        agentName: `${targetAgent.name} (${targetAgent.codename})`,
        type: (targetAgent.id === 'forge' ? 'code' : targetAgent.id === 'echo' ? 'marketing' : targetAgent.id === 'nexus' ? 'sales' : targetAgent.id === 'ledger' ? 'finance' : 'strategy') as any,
        toolUsed: toolCalls[0],
        title: `Ação solicitada executada: ${text.slice(0, 40)}...`,
        description: thinking,
        payload: outputSnippet,
        status: 'completed',
      };
      setEvents((prev) => [newEvent, ...prev]);
      setSelectedEvent(newEvent);
      setTotalActions((c) => c + 1);
      setIsExecutingPrompt(false);
    }, 1200);
  };

  // Run terminal command
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    setTerminalLogs((prev) => [...prev, `user@polsia:~$ ${cmd}`]);
    setTerminalInput('');

    setTimeout(() => {
      const lower = cmd.toLowerCase();
      let reply = '';
      if (lower.includes('status')) {
        reply = `Polsia System Status: HEALTHY\nAutonomy: ACTIVE (24/7)\nActive Agents: 5/5 online\nMRR: $${mrr.toLocaleString()}\nActions Today: ${totalActions}\nClaude Code CLI: Connected`;
      } else if (lower.includes('agents')) {
        reply = `Active Agents:\n- Atlas (CEO & Strategy) [Status: Active]\n- Forge (Lead Engineer) [Status: Active, CLI: claude-code]\n- Echo (Growth & Marketing) [Status: Active, SendGrid: OK]\n- Nexus (Sales & Support) [Status: Active, IMAP: OK]\n- Ledger (Finance & Ops) [Status: Active, Stripe: OK]`;
      } else if (lower.includes('claude') || lower.includes('code')) {
        reply = `[Claude Code CLI Headless]\nRunning non-interactive execution...\nCreating feature branch: feature/ai-autonomous-pipeline\nTests passing: 34/34\nCommit created: c89f1b2 "feat: automated pipeline execution"`;
      } else if (lower.includes('help')) {
        reply = `Available commands:\n  polsia status          - Display full system status\n  polsia agents          - List all autonomous agents\n  polsia cycle           - Trigger an immediate autonomous cycle\n  claude <prompt>        - Run headless Claude Code CLI\n  clear                  - Clear terminal buffer`;
      } else if (lower === 'clear') {
        setTerminalLogs(['[Terminal buffer cleared]']);
        return;
      } else {
        reply = `Executed: "${cmd}". Return code: 0 (Success). Agent notification dispatched.`;
      }
      setTerminalLogs((prev) => [...prev, reply]);
    }, 400);
  };

  const handleCopyPayload = () => {
    if (!selectedEvent?.payload) return;
    navigator.clipboard.writeText(selectedEvent.payload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const filteredEvents = events.filter((ev) => {
    if (streamFilter === 'all') return true;
    return ev.agentId === streamFilter || ev.type === streamFilter;
  });

  return (
    <div className="w-full h-full min-h-[620px] bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-hidden relative">
      {/* Background Subtle Cyber Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Polsia Header & Mission Telemetry */}
      <header className="px-4 sm:px-6 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 z-10">
        {/* Brand & Venture Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-wider bg-gradient-to-r from-white via-slate-200 to-cyan-300 bg-clip-text text-transparent">
                POLSIA AI
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono font-semibold">
                AUTONOMOUS CO-FOUNDER
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Empresa:</span>
              <strong className="text-slate-200 font-semibold">{companyName}</strong>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 flex items-center gap-1 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                24/7 Autônomo
              </span>
            </p>
          </div>
        </div>

        {/* Live Business Telemetry Badges */}
        <div className="flex items-center gap-2 sm:gap-4 text-xs">
          {/* MRR Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="text-[10px] text-slate-400 block leading-none">MRR (Recorrência)</span>
              <span className="font-mono font-bold text-emerald-300 text-sm">
                ${mrr.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Autonomous Actions Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/80">
            <Zap className="w-4 h-4 text-amber-400" />
            <div>
              <span className="text-[10px] text-slate-400 block leading-none">Ações Autônomas</span>
              <span className="font-mono font-bold text-amber-300 text-sm">
                {totalActions.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Autonomy Toggle Button */}
          <button
            type="button"
            onClick={() => setIsAutonomous(!isAutonomous)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              isAutonomous
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {isAutonomous ? (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                <span>Ciclo 24/7 Ativo</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>Modo Pausado</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Navigation Sub-Bar */}
      <nav aria-label="Navegação da Plataforma Polsia" className="flex items-center justify-between px-4 sm:px-6 bg-slate-900/60 border-b border-slate-800 text-xs overflow-x-auto">
        <div className="flex items-center gap-1 sm:gap-2 py-2">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Painel Executivo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('stream')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors relative ${
              activeTab === 'stream'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Stream de Atividades</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dispatcher')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'dispatcher'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Despacho de Agentes IA</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'terminal'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Claude Code CLI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('financials')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'financials'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Finanças & Pipeline</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('integrations')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'integrations'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Integrações (Stripe, GitHub, etc.)</span>
          </button>
        </div>

        {/* Rapid Cycle Trigger */}
        <button
          type="button"
          onClick={() => {
            const agent = agents[Math.floor(Math.random() * agents.length)];
            handleDispatch(`Executar otimização de ciclo autônomo para o agente ${agent.name}`);
          }}
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 rounded text-[11px] font-medium transition-colors"
        >
          <Zap className="w-3 h-3 text-cyan-400" />
          <span>Disparar Ciclo Imediato</span>
        </button>
      </nav>

      {/* Main Tab Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6">
        {/* TAB 1: EXECUTIVE OVERVIEW (PAINEL EXECUTIVO) */}
        {activeTab === 'overview' && (
          <div className="space-y-6 max-w-7xl mx-auto">
            {/* Top Mission Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-800/40 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono font-semibold">
                      SISTEMA OPERANDO EM AUTONOMIA TOTAL
                    </span>
                    <span className="text-xs text-slate-400">• Sprint #15</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">
                    Rede Multi-Agente Polsia Operando 24 Horas
                  </h2>
                  <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
                    Sua empresa conta com 5 agentes autônomos especializados em estratégia, engenharia (via Claude Code CLI),
                    marketing frio pelo SendGrid, qualificação de leads no inbox e gestão financeira Stripe.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('dispatcher')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span>Dar Nova Ordem aos Agentes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('stream')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Ver Atividades ao Vivo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 5 Autonomous Agents Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <span>Esquadrão de Agentes Autônomos Ativos (5/5)</span>
                </h3>
                <span className="text-xs text-slate-400">Status em tempo real</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Agent Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${agent.avatarColor} p-0.5 flex items-center justify-center shadow-md`}
                          >
                            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
                              {agent.id === 'forge' ? (
                                <Code className="w-4 h-4 text-indigo-400" />
                              ) : agent.id === 'echo' ? (
                                <Mail className="w-4 h-4 text-rose-400" />
                              ) : agent.id === 'nexus' ? (
                                <MessageSquare className="w-4 h-4 text-emerald-400" />
                              ) : agent.id === 'ledger' ? (
                                <DollarSign className="w-4 h-4 text-cyan-400" />
                              ) : (
                                <ShieldCheck className="w-4 h-4 text-amber-400" />
                              )}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-bold text-sm text-white">{agent.name}</h4>
                              <span className="text-[10px] text-slate-400 font-mono">
                                ({agent.codename})
                              </span>
                            </div>
                            <span className="text-[11px] text-indigo-400">{agent.role}</span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                          {agent.confidence}% conf.
                        </span>
                      </div>

                      {/* Current Action */}
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 mb-3 text-xs">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block mb-1">
                          Ação em Andamento
                        </span>
                        <p className="text-slate-200 leading-relaxed text-[11px]">
                          {agent.currentTask}
                        </p>
                      </div>

                      {/* Tools Stack */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {agent.tools.map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">
                        ⚡ <strong>{agent.actionsToday}</strong> ações hoje
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAgentId(agent.id);
                          setActiveTab('dispatcher');
                        }}
                        className="text-indigo-400 hover:text-indigo-300 font-medium text-[11px] flex items-center gap-1 transition-colors"
                      >
                        <span>Comandar</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick KPI Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Taxa de Abertura Cold Email</span>
                <span className="text-xl font-bold text-white font-mono">61.4%</span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> +14.2% vs média de mercado
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">PRs Mesclados no GitHub</span>
                <span className="text-xl font-bold text-white font-mono">48 PRs</span>
                <span className="text-[11px] text-indigo-400 flex items-center gap-1 mt-1">
                  <GitBranch className="w-3 h-3" /> 100% Claude Code CLI
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Leads Inbound Qualificados</span>
                <span className="text-xl font-bold text-white font-mono">142 Leads</span>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                  <Users className="w-3 h-3" /> 38 demos agendadas
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Runway Autônomo</span>
                <span className="text-xl font-bold text-white font-mono">26 Meses</span>
                <span className="text-[11px] text-cyan-400 flex items-center gap-1 mt-1">
                  <ShieldCheck className="w-3 h-3" /> Cash Flow Positivo
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LIVE ACTIVITY STREAM (STREAM DE ATIVIDADES EM TEMPO REAL) */}
        {activeTab === 'stream' && (
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 cols: Events List */}
            <div className="lg:col-span-7 space-y-3">
              {/* Stream Control & Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-400 text-[11px] font-medium mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Filtrar:
                  </span>
                  {['all', 'forge', 'echo', 'nexus', 'ledger', 'atlas'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setStreamFilter(f)}
                      className={`px-2 py-1 rounded capitalize transition-colors ${
                        streamFilter === f
                          ? 'bg-indigo-600 text-white font-medium'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {f === 'all' ? 'Todos' : f}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    Streaming ativo
                  </span>
                </div>
              </div>

              {/* Feed of events */}
              <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
                {filteredEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      selectedEvent?.id === ev.id
                        ? 'bg-slate-900 border-indigo-500 shadow-md shadow-indigo-500/10'
                        : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                            ev.type === 'code'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                              : ev.type === 'marketing'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : ev.type === 'sales'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : ev.type === 'finance'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {ev.agentName}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{ev.toolUsed}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{ev.timestamp}</span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-100 mb-1">{ev.title}</h4>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {ev.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 cols: Event Deep Inspector */}
            <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between overflow-hidden">
              {selectedEvent ? (
                <div className="space-y-4 overflow-y-auto">
                  <div className="border-b border-slate-800 pb-3">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>INSPETOR DE AÇÃO AUTÔNOMA</span>
                      <span className="font-mono text-indigo-400">{selectedEvent.timestamp}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{selectedEvent.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                        Agente: <strong>{selectedEvent.agentName}</strong>
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 font-mono">
                        {selectedEvent.toolUsed}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Descrição & Raciocínio
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
                      {selectedEvent.description}
                    </p>
                  </div>

                  {selectedEvent.payload && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Entregável / Payload Gerado
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyPayload}
                          className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
                        >
                          {copiedPayload ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar Código/Texto</span>
                            </>
                          )}
                        </button>
                      </div>

                      <pre className="text-[11px] font-mono p-3 rounded-lg bg-slate-950 text-indigo-200 border border-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-80">
                        {selectedEvent.payload}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Selecione uma atividade para inspecionar os detalhes do payload.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: AGENT DISPATCHER & PROMPT STUDIO */}
        {activeTab === 'dispatcher' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  <span>Despacho Direto de Tarefas aos Agentes Polsia</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Envie instruções em linguagem natural para qualquer um dos seus agentes autônomos.
                  Eles executarão a tarefa, utilizarão as ferramentas necessárias e entregarão a solução.
                </p>
              </div>

              {/* Agent Selection Tabs */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-2">
                  Selecione o Agente de Destino:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {agents.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelectedAgentId(a.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedAgentId === a.id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-xs'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-xs">{a.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{a.codename}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Prompt Input Box */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-2">
                  Instrução ou Missão para o Agente:
                </label>
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder={`Ex: "${
                    selectedAgentId === 'forge'
                      ? 'Implemente um webhook de checkout Stripe com retry automático e validação de assinatura'
                      : selectedAgentId === 'echo'
                      ? 'Crie uma sequência de 3 e-mails frios para fundadores SaaS B2B com taxa alta de resposta'
                      : selectedAgentId === 'atlas'
                      ? 'Defina a estratégia de precificação para atingir $50k de MRR nos próximos 3 meses'
                      : selectedAgentId === 'nexus'
                      ? 'Qualifique leads inbound e monte resposta automática para clientes que pedem desconto'
                      : 'Audite os custos da AWS e identifique desperdícios de servidores'
                  }"`}
                  className="w-full h-28 p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
                />
              </div>

              {/* Preset Quick Chips */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-[11px] text-slate-500 self-center">Sugestões rápidas:</span>
                {[
                  'Forge: Criar rota de autenticação com JWT e MFA',
                  'Echo: Gerar 5 posts para o X sobre automação de empresas',
                  'Atlas: Analisar concorrência e sugerir diferenciais',
                  'Nexus: Criar script de suporte para dúvidas de faturamento',
                  'Ledger: Simular receita com aumento de preço de 20%',
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPromptText(preset.split(': ')[1]);
                      if (preset.startsWith('Forge')) setSelectedAgentId('forge');
                      if (preset.startsWith('Echo')) setSelectedAgentId('echo');
                      if (preset.startsWith('Atlas')) setSelectedAgentId('atlas');
                      if (preset.startsWith('Nexus')) setSelectedAgentId('nexus');
                      if (preset.startsWith('Ledger')) setSelectedAgentId('ledger');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Dispatch Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleDispatch()}
                  disabled={isExecutingPrompt || !promptText.trim()}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {isExecutingPrompt ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Agente Executando Tarefa...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Despachar Ordem ao Agente</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Execution Result Card */}
            {executionResult && (
              <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/50 space-y-4 shadow-xl shadow-indigo-500/5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {executionResult.actionTitle}
                      </h4>
                      <span className="text-[11px] text-indigo-400">
                        Executado com sucesso pelo agente {executionResult.agent}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {executionResult.toolCalls.map((t, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Cadeia de Raciocínio do Agente (Reasoning Chain)
                  </span>
                  <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 leading-relaxed">
                    {executionResult.thinking}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Entregável Autônomo Produzido
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(executionResult.output);
                        setCopiedPayload(true);
                        setTimeout(() => setCopiedPayload(false), 2000);
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      {copiedPayload ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Entregável</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="text-xs font-mono p-4 rounded-xl bg-slate-950 text-emerald-300 border border-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {executionResult.output}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CLAUDE CODE CLI TERMINAL */}
        {activeTab === 'terminal' && (
          <div className="max-w-5xl mx-auto h-[620px] rounded-2xl bg-slate-950 border border-slate-800 flex flex-col font-mono text-xs overflow-hidden shadow-2xl">
            {/* Terminal Header */}
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                </div>
                <span className="text-slate-400 text-xs font-sans ml-2">
                  claude-code --headless --non-interactive (Polsia Forge Bridge)
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Socket Conectado
              </span>
            </div>

            {/* Terminal Screen */}
            <div className="flex-1 p-4 overflow-y-auto space-y-1.5 text-slate-300">
              {terminalLogs.map((log, idx) => (
                <div
                  key={idx}
                  className={`leading-relaxed ${
                    log.startsWith('user@polsia')
                      ? 'text-cyan-400 font-bold'
                      : log.includes('ERROR') || log.includes('error')
                      ? 'text-rose-400'
                      : log.includes('PASS') || log.includes('Success') || log.includes('HEALTHY')
                      ? 'text-emerald-400'
                      : log.includes('[CLAUDE-CLI]') || log.includes('[FORGE-CLI]')
                      ? 'text-indigo-300'
                      : 'text-slate-400'
                  }`}
                >
                  {log}
                </div>
              ))}
              <div ref={terminalEndRef} />
            </div>

            {/* Terminal Command Input */}
            <form
              onSubmit={handleTerminalSubmit}
              className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2"
            >
              <span className="text-cyan-400 font-bold text-xs">user@polsia:~$</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="Digite comandos (ex: polsia status, polsia agents, claude 'fix auth bug', help)"
                className="flex-1 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none text-xs font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-medium"
              >
                Executar
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: FINANCIALS & PIPELINE */}
        {activeTab === 'financials' && (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Receita Recorrente Mensal (MRR)</span>
                <div className="text-2xl font-black text-emerald-400 font-mono">
                  ${mrr.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Crescimento de <strong>+24.5%</strong> nos últimos 30 dias operados exclusivamente por agentes autônomos.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Receita Anual Projetada (ARR)</span>
                <div className="text-2xl font-black text-white font-mono">
                  ${(mrr * 12).toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Projeção de atingir $500k ARR no Q4 com o lançamento do plano Enterprise.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Custo Operacional Total (Burn)</span>
                <div className="text-2xl font-black text-cyan-400 font-mono">
                  $1,420<span className="text-sm font-normal text-slate-400">/mês</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Custos 100% de infraestrutura de nuvem e APIs. Zero despesas com folha salarial.
                </p>
              </div>
            </div>

            {/* Deals Pipeline */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
                <span>Pipeline de Vendas Automatizado (Agente Nexus)</span>
                <span className="text-xs text-slate-400">Valor em Negociação: $24,800/ano</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                {/* Stage 1 */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="font-semibold text-slate-300 mb-2 flex items-center justify-between">
                    <span>Leads Frios (Echo)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      240
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] mb-2">
                    <strong className="text-slate-200">ScaleVibe Inc</strong>
                    <p className="text-slate-400 text-[10px]">Email frio aberto 3x</p>
                  </div>
                </div>

                {/* Stage 2 */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="font-semibold text-slate-300 mb-2 flex items-center justify-between">
                    <span>Qualificados (Nexus)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400">
                      18
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] mb-2">
                    <strong className="text-slate-200">Apex Dynamics</strong>
                    <p className="text-indigo-400 text-[10px]">$1,200/mês • 120 usuários</p>
                  </div>
                </div>

                {/* Stage 3 */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="font-semibold text-slate-300 mb-2 flex items-center justify-between">
                    <span>Demo Agendada</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400">
                      7
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] mb-2">
                    <strong className="text-slate-200">CloudFlow Global</strong>
                    <p className="text-amber-400 text-[10px]">Quinta-feira às 14h</p>
                  </div>
                </div>

                {/* Stage 4 */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="font-semibold text-slate-300 mb-2 flex items-center justify-between">
                    <span>Fechados / Stripe</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400">
                      34
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] mb-2">
                    <strong className="text-slate-200">TechFlow Studios</strong>
                    <p className="text-emerald-400 text-[10px]">$1,440/ano pago via Stripe</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: INTEGRATIONS MATRIX */}
        {activeTab === 'integrations' && (
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-1">
                Conectores & Integrações do Ecossistema Polsia
              </h3>
              <p className="text-xs text-slate-400">
                Os agentes autônomos utilizam estas APIs e pontes de software para operar seu negócio.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {[
                {
                  name: 'GitHub (PolsiaAI/Polsia)',
                  role: 'Repositório de Código e PRs',
                  status: 'Conectado & Sincronizado',
                  badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
                  desc: 'Permite que o agente Forge crie branches, commits e aprove pull requests automaticamente.',
                },
                {
                  name: 'Claude Code Headless CLI',
                  role: 'Motor de Desenvolvimento Autônomo',
                  status: 'Online (Socket /var/run/claude.sock)',
                  badgeColor: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
                  desc: 'Executa o Claude Code CLI em modo headless para refatorar e escrever código sem intervenção humana.',
                },
                {
                  name: 'Stripe Billing & Subscriptions',
                  role: 'Processamento de Pagamentos e Webhooks',
                  status: 'Escuta Ativa (whsec_live)',
                  badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
                  desc: 'Recebe webhooks de pagamentos, gerencia cancelamentos e provisiona novas contas.',
                },
                {
                  name: 'SendGrid Email Engine',
                  role: 'Disparo de Cold Outreach & Notificações',
                  status: 'Configurado (Taxa de entrega 99.2%)',
                  badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
                  desc: 'Agente Echo envia e-mails hiper-personalizados para fundadores e tomadores de decisão.',
                },
                {
                  name: 'Meta Ads & Google Ads API',
                  role: 'Otimização de Tráfego Pago',
                  status: 'Otimizador de ROI Ativo',
                  badgeColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
                  desc: 'Ajusta orçamentos diários e gera novas variações de criativos com base em conversão.',
                },
                {
                  name: 'X (Twitter) & LinkedIn API',
                  role: 'Presença Social e Distribuição',
                  status: 'Postagens Programadas Ativas',
                  badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
                  desc: 'Publica threads técnicas e atualizações de produto que convertem em tráfego orgânico.',
                },
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-100">{item.name}</h4>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${item.badgeColor}`}>
                      {item.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono block mb-1.5">{item.role}</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
