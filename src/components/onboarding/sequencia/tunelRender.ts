/**
 * Túnel pseudo-3D da cena 2 (D-04): paredes laterais em perspectiva, estilo corrida do SNES.
 * Canvas 2D de software (sem WebGL): 320x180, um buffer de pixels por quadro. Chão e teto quase
 * invisíveis (os dois triângulos escuros acima e abaixo do "funil" das paredes). Pura e determinística:
 * o desenho depende só de `t` (segundos) e da textura, então dá para testar e medir sem navegador.
 *
 * Identidade (REGRA-IDENTIDADE-SOULMON, "mapas/cenários da narrativa = USAR"): turquesa escuro, cristais
 * da alma, cobre, folhinhas e desenhos digitais tipo rupestres, tudo por cabo; sem engrenagem.
 */
export const TUNEL_W = 320;
export const TUNEL_H = 180;
const TEX = 64;

const rgb = (r: number, g: number, b: number): number => ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;

/** Textura repetível da parede (64x64), gerada de forma determinística. Little-endian: 0xAABBGGRR. */
export function criarTextura(): Uint32Array {
  const tex = new Uint32Array(TEX * TEX);
  let seed = 1234567;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const put = (x: number, y: number, c: number) => { tex[(((y % TEX) + TEX) % TEX) * TEX + (((x % TEX) + TEX) % TEX)] = c; };
  // base turquesa escuro com ruído fino
  for (let y = 0; y < TEX; y++) for (let x = 0; x < TEX; x++) {
    const n = Math.floor(rnd() * 10);
    tex[y * TEX + x] = rgb(8 + n, 40 + n * 2, 46 + n * 2);
  }
  // cano de cobre horizontal (duas faixas) com fio de brilho
  for (let x = 0; x < TEX; x++) {
    for (let k = 0; k < 3; k++) { put(x, 10 + k, rgb(150 - k * 28, 88 - k * 16, 46 - k * 8)); put(x, 52 + k, rgb(150 - k * 28, 88 - k * 16, 46 - k * 8)); }
    put(x, 10, rgb(214, 140, 80));
    put(x, 52, rgb(214, 140, 80));
  }
  // cristais da alma: losangos com miolo claro
  for (const [cx, cy] of [[14, 30], [46, 24], [34, 42]] as const) {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const d = Math.abs(dx) + Math.abs(dy);
      if (d <= 4) put(cx + dx, cy + dy, d <= 1 ? rgb(210, 255, 248) : d <= 2 ? rgb(90, 232, 214) : rgb(32, 150, 150));
    }
  }
  // folhinhas: hastes finas com folhas verdes
  for (const [bx, top] of [[6, 20], [28, 18], [56, 30]] as const) {
    for (let y = top; y < top + 14; y++) put(bx, y, rgb(40, 120, 76));
    for (let i = 0; i < 4; i++) { put(bx - 1, top + 2 + i * 3, rgb(70, 180, 100)); put(bx + 1, top + 3 + i * 3, rgb(70, 180, 100)); }
  }
  // desenhos digitais tipo rupestres: figuras de traço e pontos de circuito
  const traco = rgb(70, 205, 192);
  for (const [fx, fy] of [[20, 56], [44, 6]] as const) {
    put(fx, fy, traco); put(fx, fy + 1, traco); put(fx, fy + 2, traco); // corpo
    put(fx - 1, fy + 1, traco); put(fx + 1, fy + 1, traco); // braços
    put(fx - 1, fy + 3, traco); put(fx + 1, fy + 3, traco); // pernas
    put(fx, fy - 1, rgb(160, 240, 232)); // cabeça
  }
  for (let x = 4; x < 60; x += 4) put(x, 36, rgb(48, 140, 140));
  return tex;
}

/**
 * Desenha um quadro em `buf` (TUNEL_W x TUNEL_H). `movimento=false` = quadro estático (movimento reduzido):
 * sem rolagem, sem oscilação.
 */
export function desenharTunel(buf: Uint32Array, tex: Uint32Array, t: number, movimento = true): void {
  const W = TUNEL_W, H = TUNEL_H;
  const sway = movimento ? Math.sin(t * 0.9) * 10 : 0;
  const bob = movimento ? Math.sin(t * 2.3) * 2 : 0;
  const cx = W / 2 + sway;
  const cy = H / 2 + bob;
  const scroll = movimento ? t * 2.6 : 0;
  const fundo = rgb(3, 12, 14);
  const A = H * 0.62;
  for (let x = 0; x < W; x++) {
    const dx = (x + 0.5 - cx) / (W / 2);
    const a = Math.abs(dx);
    const d = 1 / Math.max(a, 0.035); // profundidade da parede nesta coluna
    const half = Math.min(H, A * a);
    const y0 = Math.max(0, Math.floor(cy - half));
    const y1 = Math.min(H, Math.ceil(cy + half));
    const u = (Math.floor((d * 0.9 + scroll) * TEX) + (dx < 0 ? 32 : 0)) & (TEX - 1);
    const luz = Math.min(1, Math.max(0.1, 1.15 - d * 0.045)); // névoa: o fundo do túnel escurece
    const topo = cy - half;
    const passo = TEX / Math.max(1, 2 * half);
    for (let y = 0; y < y0; y++) buf[y * W + x] = fundo;
    for (let y = y1; y < H; y++) buf[y * W + x] = fundo;
    for (let y = y0; y < y1; y++) {
      const v = Math.min(TEX - 1, Math.max(0, Math.floor((y - topo) * passo)));
      const c = tex[v * TEX + u];
      const r = ((c & 255) * luz) | 0;
      const g = (((c >>> 8) & 255) * luz) | 0;
      const b = (((c >>> 16) & 255) * luz) | 0;
      buf[y * W + x] = ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
    }
  }
}
