import { useEffect, useRef } from 'react';

/**
 * A LUZ da cerimônia de evolução — gerada em canvas 2D, sem asset de imagem.
 * Substitui o "sun burst" estático. Camadas: raios que giram e pulsam (duas
 * camadas em contra-giro), halo que respira, flash com easing de saída (~0,9 s)
 * e partículas que sobem. Cores lidas dos tokens do tema
 * (`--sm2-viewport-ink` / `--sm2-primary-fill`). O pai só monta este
 * componente fora de movimento reduzido (lá a cerimônia é o quadro parado
 * antes → depois, sem luz animada: reduz o movimento, mantém a pausa).
 */
const RAYS = 12;
const PARTICLES = 34;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function EvolutionLight({ size }: { size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cs = getComputedStyle(canvas);
    const ink = cs.getPropertyValue('--sm2-viewport-ink').trim() || '#e8fffb';
    const accent = cs.getPropertyValue('--sm2-primary-fill').trim() || '#2de2d0';

    // Partículas determinísticas (sem Math.random: o quadro é reproduzível).
    const parts = Array.from({ length: PARTICLES }, (_, i) => ({
      x: ((i * 0.618034) % 1) * size * 0.7 + size * 0.15,
      phase: (i * 0.381966) % 1,
      speed: 0.18 + ((i * 0.7548) % 1) * 0.22,
      r: 1.2 + ((i * 0.5698) % 1) * 2.2,
    }));

    const c = size / 2;
    let raf = 0;
    let last = 0;
    const t0 = performance.now();

    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < 15) return; // teto ~60 fps
      last = now;
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, size, size);
      ctx.globalCompositeOperation = 'lighter';

      // Entrada suave dos raios (0 → 1 em 0,8 s) e pulso contínuo.
      const enter = easeOutCubic(Math.min(1, t / 0.8));
      const pulse = 0.85 + 0.15 * Math.sin(t * 3.2);
      const len = c * enter * pulse;

      for (let layer = 0; layer < 2; layer++) {
        const dir = layer ? -1 : 1;
        const rot = dir * t * (layer ? 0.35 : 0.22);
        ctx.fillStyle = layer ? ink : accent;
        ctx.globalAlpha = (layer ? 0.16 : 0.28) * enter;
        for (let i = 0; i < RAYS; i++) {
          const a = rot + (i / RAYS) * Math.PI * 2 + layer * (Math.PI / RAYS);
          const w = (Math.PI / RAYS) * (layer ? 0.25 : 0.4) * (0.8 + 0.2 * Math.sin(t * 2 + i));
          ctx.beginPath();
          ctx.moveTo(c, c);
          ctx.arc(c, c, len * (layer ? 0.8 : 1), a - w, a + w);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Halo central que respira.
      const g = ctx.createRadialGradient(c, c, 0, c, c, c * 0.7 * pulse);
      g.addColorStop(0, ink);
      g.addColorStop(0.45, accent);
      g.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.35 * enter;
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);

      // Flash de brilho, easing de saída.
      const f = 1 - easeOutCubic(Math.min(1, t / 0.9));
      if (f > 0.01) {
        const fg = ctx.createRadialGradient(c, c, 0, c, c, c);
        fg.addColorStop(0, '#fff');
        fg.addColorStop(1, 'transparent');
        ctx.globalAlpha = f;
        ctx.fillStyle = fg;
        ctx.fillRect(0, 0, size, size);
      }

      // Partículas ascendendo e desvanecendo.
      ctx.fillStyle = ink;
      for (const p of parts) {
        const k = (p.phase + t * p.speed) % 1;
        const y = size * (0.92 - k * 0.85);
        ctx.globalAlpha = Math.sin(k * Math.PI) * 0.9 * enter;
        ctx.beginPath();
        ctx.arc(p.x + Math.sin(t * 2 + p.phase * 9) * 6, y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [size]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      data-cer-burst
      style={{
        position: 'absolute', left: '50%', top: '50%', width: size, height: size,
        margin: `-${size / 2}px 0 0 -${size / 2}px`, pointerEvents: 'none',
      }}
    />
  );
}
