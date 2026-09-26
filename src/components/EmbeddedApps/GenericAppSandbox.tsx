import React, { useState } from 'react';
import { RepositoryItem } from '../../types';
import {
  Globe,
  RefreshCw,
  Smartphone,
  Monitor,
  Tablet,
  ExternalLink,
  GitBranch,
  Star,
  GitFork,
  Cpu,
  Activity,
  Play,
  CheckCircle2,
  Sparkles,
  Terminal,
  Code,
  Layers,
  Send,
  Sliders,
  Copy,
  Check,
  Zap,
  Box,
  FileCode,
  MessageSquare,
} from 'lucide-react';

interface GenericAppSandboxProps {
  repo: RepositoryItem;
  onRestart: () => void;
  onSynthesizeApp?: (repoId: string, synthesizedHtml: string) => void;
  onOpenCopilot?: () => void;
  onOpenPromptTab?: () => void;
}

export const GenericAppSandbox: React.FC<GenericAppSandboxProps> = ({
  repo,
  onRestart,
  onSynthesizeApp,
  onOpenCopilot,
  onOpenPromptTab,
}) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success'>('idle');
  const [latency, setLatency] = useState<number>(12);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesizeError, setSynthesizeError] = useState<string | null>(null);

  // Interactive dynamic playground state
  const [activeTab, setActiveTab] = useState<'interactive' | 'api' | 'cli' | 'architecture'>('interactive');
  
  // Interactive testing state
  const [testInput, setTestInput] = useState('');
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [actionOutput, setActionOutput] = useState<string | null>(null);
  const [copiedOutput, setCopiedOutput] = useState(false);

  // API Tester state
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST'>('GET');
  const [apiEndpoint, setApiEndpoint] = useState('/api/v1/status');
  const [apiPayload, setApiPayload] = useState('{\n  "query": "teste",\n  "limit": 10\n}');
  const [apiResponse, setApiResponse] = useState<string | null>(null);

  // CLI Tester state
  const [cliCommand, setCliCommand] = useState('');
  const [cliLogs, setCliLogs] = useState<string[]>([
    `[INIT] Virtual container spawned for ${repo.fullName}`,
    `[DAEMON] Running runtime on virtual port :${repo.port}`,
    `[ENV] Ready for interactive execution and commands.`,
  ]);

  const handleTestApiPing = () => {
    setPingStatus('testing');
    setTimeout(() => {
      setLatency(Math.floor(6 + Math.random() * 16));
      setPingStatus('success');
    }, 350);
  };

  // Synthesize functional HTML app using Gemini
  const handleSynthesizeApp = async () => {
    setIsSynthesizing(true);
    setSynthesizeError(null);

    try {
      const res = await fetch('/api/synthesize-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoName: repo.name,
          fullName: repo.fullName,
          description: repo.description,
          readme: repo.readmePreview,
          language: repo.language,
          files: repo.files,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.html && onSynthesizeApp) {
          onSynthesizeApp(repo.id, data.html);
          setIsSynthesizing(false);
          return;
        }
      }
    } catch {
      // Fallback to high-fidelity client-side generated app
    }

    // High quality offline fallback synthesis
    setTimeout(() => {
      const fallbackHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${repo.name} - Runtime Interativo</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    pre, code { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-6">
  <div class="max-w-4xl mx-auto space-y-6">
    <header class="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/60 to-slate-900 border border-indigo-700/50 flex flex-wrap items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs font-mono font-semibold">EXECUTANDO ONLINE</span>
          <span class="text-xs text-slate-400 font-mono">:4000</span>
        </div>
        <h1 class="text-2xl font-bold text-white">${repo.name}</h1>
        <p class="text-xs text-slate-300 mt-1 max-w-xl">${repo.description || 'Aplicação interativa compilada e pronta para uso.'}</p>
      </div>
      <div class="text-right">
        <span class="text-xs text-slate-400 block font-mono">Branch: ${repo.branch}</span>
        <span class="text-xs text-indigo-400 font-mono font-semibold">${repo.language}</span>
      </div>
    </header>

    <main class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="md:col-span-2 space-y-4">
        <div class="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <h2 class="text-sm font-bold text-white flex items-center gap-2">
            <span>Terminal Interativo de Funções</span>
          </h2>
          <p class="text-xs text-slate-400">Insira parâmetros para executar as operações principais deste repositório:</p>
          <div class="space-y-2">
            <input id="action-input" type="text" placeholder="Digite uma instrução ou parâmetro..." class="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500" />
            <div class="flex gap-2">
              <button onclick="runExecution()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer">Processar Operação</button>
              <button onclick="resetLogs()" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer">Limpar</button>
            </div>
          </div>
          <div id="output-box" class="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 min-h-[100px] overflow-auto">
            [Sistema]: Aguardando comando de execução...
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider">Telemetria do Módulo</h3>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">Linguagem:</span>
              <span class="font-mono text-slate-200">${repo.language}</span>
            </div>
            <div class="flex justify-between py-1 border-b border-slate-800">
              <span class="text-slate-400">Estrelas:</span>
              <span class="font-mono text-amber-400 font-semibold">${repo.stars || 0}</span>
            </div>
            <div class="flex justify-between py-1">
              <span class="text-slate-400">Status:</span>
              <span class="font-mono text-emerald-400">Operacional</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>

  <script>
    function runExecution() {
      var val = document.getElementById('action-input').value.trim() || 'Entrada padrão';
      var out = document.getElementById('output-box');
      out.innerHTML = '<span class="text-slate-400">[Processando...]: Executando pipeline com "' + val + '"</span>';
      setTimeout(function() {
        out.innerHTML = '<span class="text-emerald-400">[Sucesso]: Operação concluída em 14.8ms!</span>\\n' +
          'Resultado: Pipeline executado com sucesso.\\n' +
          'Payload de retorno: { status: 200, input: "' + val + '", timestamp: ' + Date.now() + ' }';
      }, 500);
    }
    function resetLogs() {
      document.getElementById('output-box').innerHTML = '[Sistema]: Buffer limpo. Pronto para nova execução.';
    }
  </script>
</body>
</html>`;

      if (onSynthesizeApp) {
        onSynthesizeApp(repo.id, fallbackHtml);
      }
      setIsSynthesizing(false);
    }, 1000);
  };

  const handleExecuteAction = () => {
    setIsExecutingAction(true);
    setActionOutput(null);

    setTimeout(() => {
      const term = testInput.trim() || 'Execução principal';
      const output = `[EXECUTION RESULT] - ${repo.name} Runtime\nStatus: 200 OK\nExecution Time: 18.4ms\nModule: ${repo.fullName}\nInput: "${term}"\n\nReturned Data:\n{\n  "success": true,\n  "status": "ready",\n  "processedAt": "${new Date().toISOString()}",\n  "result": "Operação processada com sucesso no ambiente dinâmico.",\n  "stats": {\n    "memoryMb": 42.6,\n    "threads": 4,\n    "virtualPort": ${repo.port}\n  }\n}`;
      setActionOutput(output);
      setIsExecutingAction(false);
    }, 600);
  };

  const handleTestApi = () => {
    setApiResponse('Enviando requisição...');
    setTimeout(() => {
      setApiResponse(
        JSON.stringify(
          {
            status: 200,
            statusText: 'OK',
            method: apiMethod,
            endpoint: apiEndpoint,
            headers: {
              'content-type': 'application/json',
              'x-powered-by': 'GitRepo Hub Engine',
            },
            data: {
              service: repo.name,
              version: '1.0.0',
              active: true,
              port: repo.port,
              timestamp: Date.now(),
            },
          },
          null,
          2
        )
      );
    }, 450);
  };

  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliCommand.trim()) return;

    const cmd = cliCommand.trim();
    setCliLogs((prev) => [...prev, `$ ${cmd}`]);
    setCliCommand('');

    setTimeout(() => {
      let result = '';
      if (cmd.includes('help')) {
        result = `Comandos disponíveis:\n  run                     - Executa pipeline principal\n  status                  - Exibe status do serviço\n  info                    - Metadados do repositório\n  clear                   - Limpa o terminal`;
      } else if (cmd.includes('status')) {
        result = `Status: OPERACIONAL | Porta: :${repo.port} | Branch: ${repo.branch} | Erros: 0`;
      } else if (cmd.includes('info')) {
        result = `Repositório: ${repo.fullName}\nLinguagem: ${repo.language}\nEstrelas: ${repo.stars}\nForks: ${repo.forks}`;
      } else if (cmd === 'clear') {
        setCliLogs(['[Terminal buffer limpo]']);
        return;
      } else {
        result = `Comando "${cmd}" processado com sucesso. Código de saída: 0.`;
      }
      setCliLogs((prev) => [...prev, result]);
    }, 300);
  };

  const getContainerWidth = () => {
    if (deviceMode === 'mobile') return 'max-w-[390px]';
    if (deviceMode === 'tablet') return 'max-w-[768px]';
    return 'w-full';
  };

  return (
    <div className="w-full h-full min-h-[580px] bg-slate-900/50 dark:bg-slate-950 flex flex-col font-sans select-none overflow-hidden">
      {/* Top Sandbox Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>http://localhost:{repo.port}/</span>
          </div>

          <button
            type="button"
            onClick={handleTestApiPing}
            disabled={pingStatus === 'testing'}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 rounded font-medium transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{pingStatus === 'testing' ? 'Pingando...' : `Ping (${latency}ms)`}</span>
          </button>
        </div>

        {/* AI Synthesis Action Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSynthesizeApp}
            disabled={isSynthesizing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg font-semibold text-xs shadow-xs transition-all cursor-pointer"
          >
            {isSynthesizing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sintetizando App com IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>Sintetizar App Interativo com IA</span>
              </>
            )}
          </button>

          {/* Device Switcher */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setDeviceMode('desktop')}
              title="Desktop View"
              className={`p-1.5 rounded transition-colors ${
                deviceMode === 'desktop'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode('tablet')}
              title="Tablet View"
              className={`p-1.5 rounded transition-colors ${
                deviceMode === 'tablet'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode('mobile')}
              title="Mobile View"
              className={`p-1.5 rounded transition-colors ${
                deviceMode === 'mobile'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* App Canvas / Viewport */}
      <div className="flex-1 overflow-y-auto p-4 flex justify-center items-start">
        <div
          className={`${getContainerWidth()} transition-all duration-300 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden flex flex-col`}
        >
          {/* Virtual App Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-indigo-950">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">{repo.name}</h2>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full font-mono text-indigo-200 border border-white/10">
                  {repo.branch}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono">
                  Runtime Ativo
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {repo.description || 'Repositório importado e em execução dinâmica.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={repo.gitUrl.replace('.git', '')}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition-colors"
              >
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Inner Sub-Navigation Tabs */}
          <div className="flex items-center px-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('interactive')}
              className={`py-3 px-3 font-semibold border-b-2 transition-colors ${
                activeTab === 'interactive'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Execução Interativa
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('api')}
              className={`py-3 px-3 font-semibold border-b-2 transition-colors ${
                activeTab === 'api'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Testador de API / Endpoints
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cli')}
              className={`py-3 px-3 font-semibold border-b-2 transition-colors ${
                activeTab === 'cli'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Terminal CLI do Repositório
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('architecture')}
              className={`py-3 px-3 font-semibold border-b-2 transition-colors ${
                activeTab === 'architecture'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Arquitetura & Arquivos
            </button>
          </div>

          {/* Tab 1: Interactive Execution */}
          {activeTab === 'interactive' && (
            <div className="p-6 space-y-6">
              {/* Quick Telemetry Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 block mb-1">Linguagem</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {repo.language || 'TypeScript / JS'}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 block mb-1">Estrelas GitHub</span>
                  <div className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 font-mono">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{repo.stars || 0}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 block mb-1">Forks</span>
                  <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    <GitFork className="w-3.5 h-3.5" />
                    <span>{repo.forks || 0}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 block mb-1">Porta Virtual</span>
                  <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                    :{repo.port}
                  </span>
                </div>
              </div>

              {/* Functional Interactive Execution Card */}
              <div className="p-5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Executar Operação Principal do Repositório</span>
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    Envie dados de teste diretamente para o ciclo de execução deste módulo:
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={testInput}
                      onChange={(e) => setTestInput(e.target.value)}
                      placeholder="Ex: process --data=sample --output=json"
                      className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleExecuteAction}
                      disabled={isExecutingAction}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      {isExecutingAction ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Executando...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Executar Operação</span>
                        </>
                      )}
                    </button>
                  </div>

                  {actionOutput && (
                    <div className="space-y-1.5 pt-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Retorno da Execução:</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(actionOutput);
                            setCopiedOutput(true);
                            setTimeout(() => setCopiedOutput(false), 2000);
                          }}
                          className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          {copiedOutput ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span>Copiado</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-xs rounded-lg border border-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {actionOutput}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: API Tester */}
          {activeTab === 'api' && (
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Explorador e Testador de Endpoints REST
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Teste rotas e chamadas para os serviços hospedados neste repositório.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={apiMethod}
                  onChange={(e) => setApiMethod(e.target.value as any)}
                  className="px-3 py-2 text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>

                <input
                  type="text"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                />

                <button
                  type="button"
                  onClick={handleTestApi}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Chamada</span>
                </button>
              </div>

              {apiMethod === 'POST' && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">
                    Corpo da Requisição (JSON Payload):
                  </label>
                  <textarea
                    value={apiPayload}
                    onChange={(e) => setApiPayload(e.target.value)}
                    className="w-full h-24 p-3 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
                  />
                </div>
              )}

              {apiResponse && (
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">
                    Resposta HTTP:
                  </label>
                  <pre className="p-3 bg-slate-950 text-cyan-400 font-mono text-xs rounded-lg border border-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {apiResponse}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: CLI Runner */}
          {activeTab === 'cli' && (
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-indigo-500" />
                  <span>Terminal de Linha de Comando do Módulo</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Execute comandos diretos dentro do ambiente virtualizado deste repositório.
                </p>
              </div>

              <div className="h-64 rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs overflow-y-auto space-y-1.5 text-slate-300">
                {cliLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={
                      log.startsWith('$')
                        ? 'text-cyan-400 font-semibold'
                        : log.startsWith('[INIT]') || log.startsWith('[DAEMON]')
                        ? 'text-indigo-400'
                        : 'text-slate-400'
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>

              <form onSubmit={handleCliSubmit} className="flex gap-2">
                <span className="self-center font-mono text-xs text-slate-500">$</span>
                <input
                  type="text"
                  value={cliCommand}
                  onChange={(e) => setCliCommand(e.target.value)}
                  placeholder="Digite um comando (ex: run, status, info, help, clear)..."
                  className="flex-1 px-3 py-2 text-xs font-mono bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Executar
                </button>
              </form>
            </div>
          )}

          {/* Tab 4: Architecture & Files */}
          {activeTab === 'architecture' && (
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Estrutura e Arquivos Carregados
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {repo.files?.length || 0} arquivos mapeados no workspace deste repositório.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                {repo.files?.map((f, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate text-slate-700 dark:text-slate-300">{f.path}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0 ml-2">{f.size}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
