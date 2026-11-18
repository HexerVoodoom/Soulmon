import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../hooks/useRewardReveal';

// A tela do Fliperama de Canto (REGISTRO §480): um jogo de poucos bits (invasores + nave + tiro) em turquesa médio, com interferência
// (linhas de varredura, faixa que desce, ruído, tremida de linha). Contraste BAIXO de propósito: a tela vira um brilho vivo, não um anúncio.
// Canvas 40×40 (a tela da arte mede ~41×40 px), ~10 fps, pausa em aba oculta; movimento reduzido ou pet dormindo = quadro parado/escurecido.
const N = 40;
const FUNDO = 'hsl(176 52% 40%)';
const ESCURO = 'hsl(180 55% 27%)';
const CLARO = 'hsl(172 70% 52%)';
const APAGADA = 'hsl(184 40% 17%)';
const ALIEN: readonly (readonly string[])[] = [
  ['..#.....#..', '...#...#...', '..#######..', '.##.###.##.', '###########', '#.#######.#', '#.#.....#.#', '...##.##...'],
  ['..#.....#..', '#..#...#..#', '#.#######.#', '###.###.###', '###########', '.#########.', '..#.....#..', '.#.......#.'],
];

function desenha(ctx: CanvasRenderingContext2D, t: number, dormindo: boolean): void {
  ctx.fillStyle = dormindo ? APAGADA : FUNDO;
  ctx.fillRect(0, 0, N, N);
  if (dormindo) return;
  const f = Math.floor(t / 500) % 2;
  const ox = Math.round(5 + 4 * Math.sin(t / 1400)) - 4;
  ctx.fillStyle = ESCURO;
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
    const sp = ALIEN[f];
    for (let y = 0; y < sp.length; y++) for (let x = 0; x < 11; x++) if (sp[y][x] === '#') ctx.fillRect(ox + 3 + c * 12 + x, 5 + r * 10 + y, 1, 1);
  }
  const nx = Math.round(18 + 13 * Math.sin(t / 1900));
  ctx.fillRect(nx - 3, 34, 7, 2); ctx.fillRect(nx - 1, 32, 3, 2); ctx.fillRect(nx, 31, 1, 1);
  ctx.fillStyle = CLARO;
  const by = 31 - ((t / 40) % 26);
  if (by > 3) ctx.fillRect(nx, Math.round(by), 1, 3);
  // interferência: varredura, faixa que desce, linhas que tremem, ruído
  ctx.fillStyle = 'hsl(180 60% 20% / .18)';
  for (let y = 0; y < N; y += 2) ctx.fillRect(0, y, N, 1);
  const faixa = Math.floor(((t / 60) % 160) - 20);
  ctx.fillStyle = 'hsl(172 80% 70% / .16)';
  ctx.fillRect(0, faixa, N, 4);
  if (Math.floor(t / 90) % 23 === 0) { const y = (Math.floor(t / 90) * 7) % N; const d = (Math.floor(t / 90) % 3) - 1; ctx.drawImage(ctx.canvas, 0, y, N, 2, d * 2, y, N, 2); }
  ctx.fillStyle = 'hsl(172 70% 62% / .5)';
  for (let k = 0; k < 6; k++) ctx.fillRect(Math.floor(Math.random() * N), Math.floor(Math.random() * N), 1, 1);
}

export function ArcadeTela({ dormindo }: { dormindo: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    if (dormindo || prefersReducedMotion()) { desenha(ctx, 0, dormindo); return; }
    const t0 = performance.now();
    const id = setInterval(() => { if (!document.hidden) desenha(ctx, performance.now() - t0, false); }, 100);
    return () => clearInterval(id);
  }, [dormindo]);
  return <canvas ref={ref} width={N} height={N} className="sm-decor-tela" data-decor-tela aria-hidden="true" />;
}
