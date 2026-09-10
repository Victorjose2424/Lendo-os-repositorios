import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, RotateCcw, Zap, Sliders, Volume2, Shield } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  sparkleSpeed: number;
}

const PALETTES = {
  Cosmic: ['#a855f7', '#ec4899', '#6366f1', '#38bdf8', '#fbbf24'],
  Cyberpunk: ['#06b6d4', '#f43f5e', '#eab308', '#10b981', '#ffffff'],
  Solar: ['#f97316', '#ef4444', '#facc15', '#fb923c', '#ffffff'],
  Emerald: ['#10b981', '#34d399', '#059669', '#6ee7b7', '#a7f3d0'],
};

export const SparkleBoxApp: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [paletteKey, setPaletteKey] = useState<keyof typeof PALETTES>('Cosmic');
  const [gravity, setGravity] = useState(true);
  const [particleCount, setParticleCount] = useState(0);
  const [fps, setFps] = useState(60);
  const [sparkleIntensity, setSparkleIntensity] = useState(1.5);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  const colors = PALETTES[paletteKey];

  const spawnParticles = (x: number, y: number, count = 25) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 5 + 2) * sparkleIntensity;
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.015 + 0.008,
        sparkleSpeed: Math.random() * 0.2 + 0.05,
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles].slice(-400);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Initial burst
    spawnParticles(width / 2, height / 2, 80);

    let lastTime = performance.now();
    let frameCounter = 0;
    let fpsTimer = performance.now();

    const render = (time: number) => {
      frameCounter++;
      if (time - fpsTimer >= 1000) {
        setFps(frameCounter);
        frameCounter = 0;
        fpsTimer = time;
      }

      ctx.fillStyle = 'rgba(10, 15, 29, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // Ambient background glow
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        10,
        width / 2,
        height / 2,
        Math.max(width, height) / 1.5
      );
      gradient.addColorStop(0, 'rgba(88, 28, 135, 0.08)');
      gradient.addColorStop(1, 'rgba(10, 15, 29, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (gravity) {
          p.vy += 0.08;
        }

        p.vx *= 0.985;
        p.vy *= 0.985;
        p.alpha -= p.decay;

        // Bounce off walls
        if (p.x <= 0 || p.x >= width) p.vx *= -0.8;
        if (p.y >= height) {
          p.y = height;
          p.vy *= -0.7;
        }

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Draw glowing particle
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.shadowBlur = 12 * sparkleIntensity;
        ctx.shadowColor = p.color;
        ctx.fillStyle = p.color;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Cross sparkle effect
        if (p.size > 3.5) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          const s = p.size * 1.6;
          ctx.beginPath();
          ctx.moveTo(p.x - s, p.y);
          ctx.lineTo(p.x + s, p.y);
          ctx.moveTo(p.x, p.y - s);
          ctx.lineTo(p.x, p.y + s);
          ctx.stroke();
        }

        ctx.restore();
      }

      setParticleCount(particles.length);
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [gravity, colors, sparkleIntensity]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    spawnParticles(x, y, 40);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.buttons === 1) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      spawnParticles(x, y, 6);
    }
  };

  const clearParticles = () => {
    particlesRef.current = [];
  };

  const superNova = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    spawnParticles(canvas.width / 2, canvas.height / 2, 160);
  };

  return (
    <div id="sparkle-box-root" className="relative w-full h-full min-h-[460px] bg-slate-950 text-slate-100 flex flex-col select-none overflow-hidden font-sans">
      {/* HUD Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur z-10 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-slate-100 tracking-wide">Delightful Sparkle Box</span>
            <span className="ml-2 text-[10px] text-slate-400 font-mono">v1.4.0 • Live Physics</span>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="flex items-center gap-4 text-slate-400 font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{fps} FPS</span>
          </div>
          <div className="hidden sm:block">
            <span>Partículas: </span>
            <span className="text-amber-400 font-semibold">{particleCount}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <select
            aria-label="Paleta de Cores"
            value={paletteKey}
            onChange={(e) => setPaletteKey(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 outline-none focus:border-amber-500 cursor-pointer"
          >
            {Object.keys(PALETTES).map((k) => (
              <option key={k} value={k}>
                Paleta: {k}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setGravity(!gravity)}
            className={`px-2.5 py-1 rounded border text-xs font-medium transition-colors ${
              gravity
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            Gravidade: {gravity ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={superNova}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-gradient-to-r from-amber-500 to-pink-500 hover:from-amber-600 hover:to-pink-600 text-white font-medium text-xs shadow-sm transition-transform active:scale-95"
          >
            <Zap className="w-3.5 h-3.5" />
            Supernova!
          </button>

          <button
            type="button"
            onClick={clearParticles}
            title="Limpar tela"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Interactive Canvas Area */}
      <div className="relative flex-1 w-full h-full cursor-crosshair">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          className="w-full h-full block"
        />

        {/* Floating Instruction overlay */}
        <div className="absolute bottom-3 left-4 pointer-events-none text-slate-400 text-xs bg-slate-900/80 px-3 py-1.5 rounded-full border border-slate-800 backdrop-blur">
          💡 Clique ou arraste o cursor na tela para gerar faíscas estelares
        </div>
      </div>
    </div>
  );
};
