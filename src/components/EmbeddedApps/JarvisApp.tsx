import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, Cpu, Activity, Zap, Mic, Send, Radio, CheckCircle, AlertTriangle } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'jarvis';
  text: string;
  time: string;
}

const PRESET_COMMANDS = [
  'Status dos propulsores e reator Arc',
  'Protocolo de defesa e isolamento',
  'Calibrar frequência neural',
  'Diagnóstico térmico dos subsistemas',
];

export const JarvisApp: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'jarvis',
      text: 'Sistemas online. Bem-vindo, senhor. O núcleo J.A.R.V.I.S. está operando com 98.4% de eficiência neural.',
      time: '11:15:02',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [arcPower, setArcPower] = useState(88);
  const [cpuLoad, setCpuLoad] = useState(24);
  const [defenseLevel, setDefenseLevel] = useState<'Normal' | 'Alerta' | 'Máximo'>('Normal');
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Dynamic telemetry simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuLoad(Math.floor(20 + Math.random() * 15));
      setArcPower((prev) => Math.min(100, Math.max(75, prev + (Math.random() * 2 - 1))));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleSendCommand = (textToSend?: string) => {
    const command = (textToSend || inputText).trim();
    if (!command) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: command,
      time: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    setTimeout(() => {
      let jarvisReply = 'Comando registrado e executado nos núcleos auxiliares.';
      const lower = command.toLowerCase();

      if (lower.includes('propulsor') || lower.includes('reator') || lower.includes('arc')) {
        jarvisReply = `Reator Arc estabilizado em ${arcPower.toFixed(1)}% de capacidade. Temperatura dos propulsores em 340 Kelvin. Todos os relés gravitacionais nominais.`;
      } else if (lower.includes('defesa') || lower.includes('protocolo')) {
        setDefenseLevel('Alerta');
        jarvisReply = 'Protocolo de defesa elevado para nível ALERTA. Escudos defletores ativados e varredura de perímetro em execução contínua.';
      } else if (lower.includes('frequência') || lower.includes('neural') || lower.includes('calibrar')) {
        jarvisReply = 'Frequência do oscilador sincronizada com a rede neural quântica. Latência reduzida para 0.4ms.';
      } else if (lower.includes('térmico') || lower.includes('diagnóstico')) {
        jarvisReply = 'Varredura térmica concluída: Todos os setores frios. Refrigeração criogênica operando em modo ecológico silencioso.';
      } else {
        jarvisReply = `Ordem interpretada: "${command}". Vetores de processamento distribuídos nos clusters de alta velocidade.`;
      }

      const replyMsg: ChatMessage = {
        id: `reply-${Date.now()}`,
        sender: 'jarvis',
        text: jarvisReply,
        time: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, replyMsg]);
      setIsProcessing(false);
    }, 700);
  };

  return (
    <div className="w-full h-full min-h-[500px] bg-slate-950 text-cyan-400 font-mono flex flex-col p-4 select-none relative overflow-hidden">
      {/* Background Grid & Cyber HUD Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#08334415_1px,transparent_1px),linear-gradient(to_bottom,#08334415_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Top HUD Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-cyan-900/60 z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full border border-cyan-500/50 bg-cyan-950/40">
            <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
            <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-ping" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wider text-cyan-300">J.A.R.V.I.S. INTERFACE V3.1</h1>
            <p className="text-[10px] text-cyan-600">STARK INDUSTRIES • NEURAL CORE OS</p>
          </div>
        </div>

        {/* Real-time telemetry badges */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Reator: {arcPower.toFixed(1)}%</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>CPU: {cpuLoad}%</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/60 text-emerald-300">
            <Shield className="w-3.5 h-3.5" />
            <span>Defesa: {defenseLevel}</span>
          </div>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 my-3 overflow-hidden z-10">
        {/* Left: Arc Reactor Visualizer & Diagnostics */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-900/60 border border-cyan-900/40 rounded-lg relative overflow-hidden">
          {/* Reactor Rings */}
          <div className="relative w-40 h-40 flex items-center justify-center my-2">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/40 animate-spin [animation-duration:12s]" />
            <div className="absolute inset-2 rounded-full border border-cyan-400/30 animate-spin [animation-duration:6s] [animation-direction:reverse]" />
            <div className="absolute inset-6 rounded-full bg-cyan-500/10 border border-cyan-400/60 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.4)]">
              <Zap className="w-10 h-10 text-cyan-300 animate-pulse" />
            </div>
          </div>

          <span className="text-xs font-semibold text-cyan-300 uppercase tracking-widest mt-2">NÚCLEO ARC ATIVO</span>
          <p className="text-[11px] text-cyan-600 text-center mt-1">Sincronização magnética 99.8% nominal</p>

          <div className="w-full mt-4 space-y-2 text-[11px]">
            <div className="flex justify-between text-cyan-400">
              <span>Fluxo Quântico:</span>
              <span className="text-cyan-200">1.21 GW</span>
            </div>
            <div className="w-full bg-cyan-950 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-400 h-full w-[84%]" />
            </div>
          </div>
        </div>

        {/* Right 2 columns: Neural Terminal / Dialogue */}
        <div className="lg:col-span-2 flex flex-col bg-slate-900/60 border border-cyan-900/40 rounded-lg p-3 overflow-hidden">
          <div className="flex items-center gap-2 pb-2 border-b border-cyan-900/40 text-xs text-cyan-500">
            <Terminal className="w-3.5 h-3.5" />
            <span>REGISTRO DE ORDENS E RESPOSTA COGNITIVA</span>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto space-y-3 p-2 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-500 mb-0.5">
                  {m.sender === 'user' ? 'SENHOR' : 'J.A.R.V.I.S.'} • {m.time}
                </span>
                <div
                  className={`max-w-[85%] rounded-lg p-2.5 leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-cyan-950/80 border border-cyan-700/60 text-cyan-100'
                      : 'bg-slate-800/80 border border-cyan-900/60 text-cyan-300'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-cyan-500 italic p-2">
                <Activity className="w-3.5 h-3.5 animate-spin" />
                <span>Processando resposta neural...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1.5 py-2 border-t border-cyan-900/40 text-[11px]">
            {PRESET_COMMANDS.map((cmd, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendCommand(cmd)}
                className="px-2 py-1 rounded bg-cyan-950/50 hover:bg-cyan-900/70 border border-cyan-800/50 text-cyan-400 transition-colors text-left"
              >
                {cmd}
              </button>
            ))}
          </div>

          {/* Command input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendCommand();
            }}
            className="flex items-center gap-2 mt-1"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Insira um comando de voz ou texto..."
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-cyan-800/60 rounded text-cyan-200 placeholder-cyan-700 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <button
              type="submit"
              disabled={isProcessing || !inputText.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
