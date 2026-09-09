/**
 * Desenho programático das peças de decoração que o gerador não pôde entregar.
 *
 * Por que existe: o Chrome bloqueou os downloads do Gemini no meio da rodada
 * (provado pelo `Default/History`: zero tentativas registradas depois das
 * 14:09) e o desbloqueio depende de ação humana na janela do navegador. Estas
 * peças são objetos geométricos simples, e pixel art de 4-6 cores neste tamanho
 * sai mais confiável desenhada do que gerada — em especial a estante e o pódio,
 * que TÊM de sair vazios porque o jogo desenha os troféus reais por cima, e que
 * o gerador enche de troféu falso se deixarem.
 *
 * Cada peça é desenhada numa grade lógica pequena e ampliada por NEAREST num
 * fator inteiro até o tamanho do slot × 2 — a mesma regra de grade que o guard
 * cobra e que as peças geradas seguem (28×28 ×4 = 112×112).
 *
 * A paleta é amostrada das peças já aprovadas desta rodada, para o lote inteiro
 * fechar como um conjunto só.
 */
import sharp from 'sharp';
import path from 'node:path';

const OUT = process.argv[2] || 'D:/Soulmon/_gemini_out/decor-v2/out';

const P = {
  o: [39, 11, 23],     // contorno quase-preto
  m: [130, 55, 36],    // cobre escuro
  b: [182, 88, 36],    // cobre base
  l: [219, 133, 48],   // cobre claro
  h: [244, 181, 84],   // realce quente
  g: [76, 73, 82],     // cinza escuro
  G: [107, 102, 108],  // cinza médio
  W: [144, 135, 136],  // cinza claro
  t: [22, 128, 124],   // teal
  c: [52, 198, 188],   // ciano
  d: [16, 40, 46],     // vão escuro
  a: [213, 171, 60],   // ouro
  A: [247, 218, 120],  // ouro claro
  f: [252, 176, 42],   // chama
  F: [253, 231, 120],  // chama clara
  r: [196, 62, 46],    // vermelho (fita)
  // Paleta arcano-tech, amostrada do lote gerado no Gemini (08/09/2026), para
  // as peças desenhadas fecharem com as geradas.
  T: [47, 111, 110],   // teal médio (corpo)
  D: [20, 63, 70],     // teal escuro (trama, sombra)
  C: [110, 255, 248],  // ciano néon (cristal)
};

/** Tela lógica com primitivas mínimas; (0,0) no canto superior esquerdo. */
class Tela {
  constructor(w, h) { this.w = w; this.h = h; this.px = new Array(w * h).fill(null); }
  set(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.px[y * this.w + x] = c;
  }
  get(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? null : this.px[y * this.w + x]; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  /** Retângulo preenchido com contorno de 1px. */
  caixa(x, y, w, h, dentro, borda = 'o') {
    this.rect(x, y, w, h, borda);
    if (w > 2 && h > 2) this.rect(x + 1, y + 1, w - 2, h - 2, dentro);
  }
  hline(x, y, w, c) { this.rect(x, y, w, 1, c); }
  vline(x, y, h, c) { this.rect(x, y, 1, h, c); }
  /** Contorno escuro de 1px em volta de tudo que está pintado. */
  contornar(cor = 'o') {
    const novo = this.px.slice();
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y) !== null) continue;
      let vizinho = false;
      for (let dy = -1; dy <= 1 && !vizinho; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const v = this.get(x + dx, y + dy);
        if (v !== null && v !== cor) { vizinho = true; break; }
      }
      if (vizinho) novo[y * this.w + x] = cor;
    }
    this.px = novo;
  }
  async gravar(arquivo, escala) {
    const buf = Buffer.alloc(this.w * this.h * 4, 0);
    for (let i = 0; i < this.px.length; i++) {
      const c = this.px[i]; if (!c) continue;
      const [r, g, b] = P[c];
      buf[i * 4] = r; buf[i * 4 + 1] = g; buf[i * 4 + 2] = b; buf[i * 4 + 3] = 255;
    }
    await sharp(buf, { raw: { width: this.w, height: this.h, channels: 4 } })
      .resize(this.w * escala, this.h * escala, { kernel: 'nearest' })
      .png().toFile(arquivo);
  }
}

const PECAS = {};

// ── BARRACA — floor-left, grade 28×28 ×4 = 112×112 ──────────────────────────
PECAS['furn-tent'] = () => {
  const t = new Tela(28, 28);
  for (let y = 5; y <= 24; y++) {
    const meia = Math.round((y - 4) * 0.60);
    if (meia < 1) continue;
    t.rect(14 - meia, y, meia * 2, 1, y > 22 ? 'm' : 'b');
    t.set(13, y, 'l'); t.set(14, y, 'l');       // faixa clara da cumeeira
  }
  for (let y = 14; y <= 24; y++) {              // abertura escura
    const meia = Math.max(1, Math.round((y - 13) * 0.40));
    t.rect(14 - meia, y, meia * 2, 1, 'd');
  }
  t.vline(4, 23, 3, 'm'); t.vline(23, 23, 3, 'm');   // estacas
  t.contornar();
  return { tela: t, escala: 4 };
};

// ── FOGUEIRA — floor-left, grade 28×28 ×4 = 112×112 ─────────────────────────
PECAS['furn-campfire'] = () => {
  const t = new Tela(28, 28);
  for (let i = 0; i < 13; i++) {                // gravetos cruzados
    const y = 21 - Math.round(i * 0.42);
    t.set(7 + i, y, 'm'); t.set(7 + i, y + 1, 'b');
    t.set(20 - i, y, 'm'); t.set(20 - i, y + 1, 'b');
  }
  const chama = [[14, 5, 1], [14, 6, 1], [13, 7, 2], [13, 8, 2], [12, 9, 4], [12, 10, 4],
                 [11, 11, 6], [11, 12, 6], [10, 13, 8], [10, 14, 8], [9, 15, 10], [9, 16, 10],
                 [10, 17, 8], [11, 18, 6]];
  for (const [x, y, w] of chama) t.rect(x, y, w, 1, 'f');
  for (const [x, y, w] of chama) if (w > 2) t.rect(x + Math.floor(w / 2) - 1, y, 2, 1, 'F');
  for (const [x, y] of [[3, 21], [8, 22], [13, 23], [18, 22], [22, 21]]) {
    t.caixa(x, y, 4, 3, 'G'); t.rect(x + 1, y + 1, 2, 1, 'W');
  }
  t.contornar();
  return { tela: t, escala: 4 };
};

// ── QUADRO — wall, grade 28×20 ×4 = 112×80 ──────────────────────────────────
PECAS['furn-picture'] = () => {
  const t = new Tela(28, 20);
  t.caixa(2, 1, 24, 17, 'b');
  t.hline(3, 2, 22, 'l');
  t.hline(3, 16, 22, 'm');
  t.caixa(5, 4, 18, 11, 'h');
  const corpo = [[12, 6, 4], [11, 7, 6], [10, 8, 8], [10, 9, 8], [10, 10, 8], [10, 11, 8], [11, 12, 6]];
  for (const [x, y, w] of corpo) t.rect(x, y, w, 1, 't');
  t.set(12, 9, 'o'); t.set(15, 9, 'o');
  t.contornar();
  return { tela: t, escala: 4 };
};

// ── ESTANDARTE — wall, grade 28×20 ×4 = 112×80 ──────────────────────────────
PECAS['furniture-champion-banner'] = () => {
  const t = new Tela(28, 20);
  t.caixa(3, 0, 22, 3, 'G');
  t.rect(7, 3, 14, 12, 'a');
  t.rect(9, 3, 2, 12, 'A');
  for (let i = 0; i < 7; i++) {
    const w = 14 - i * 2;
    if (w > 0) t.rect(7 + i, 15 + i, w, 1, 'a');
  }
  t.caixa(13, 6, 6, 6, 'm', 'o');
  t.rect(15, 8, 2, 2, 'A');
  t.contornar();
  return { tela: t, escala: 4 };
};

// ── MURAL DE MEDALHAS — wall, grade 28×20 ×4 = 112×80 ───────────────────────
PECAS['furniture-medal-wall'] = () => {
  const t = new Tela(28, 20);
  t.caixa(2, 2, 24, 15, 'b');
  t.hline(3, 3, 22, 'l');
  t.hline(3, 15, 22, 'm');
  // Fita de 2px de largura: a 1px ela desaparece no tamanho final (56×40, onde
  // cada pixel lógico vale 2 px de tela) — medido na primeira versão.
  for (const cx of [7, 14, 21]) {
    t.rect(cx - 2, 5, 2, 4, 'r'); t.rect(cx + 1, 5, 2, 4, 'r');
    t.rect(cx - 2, 5, 5, 2, 'r');
    t.caixa(cx - 3, 9, 7, 6, 'a');
    t.rect(cx - 2, 10, 5, 4, 'A');
    t.rect(cx - 1, 11, 3, 2, 'a');
  }
  t.contornar();
  return { tela: t, escala: 4 };
};

// ── ESTANTE DE TROFÉUS (VAZIA) — trophy, grade 23×25 ×4 = 92×100 ────────────
PECAS['furniture-trophy-shelf'] = () => {
  const t = new Tela(23, 25);
  t.caixa(2, 1, 19, 21, 'b');
  t.rect(4, 3, 15, 7, 'd');              // vão de cima, VAZIO
  t.rect(4, 12, 15, 7, 'd');             // vão de baixo, VAZIO
  t.hline(3, 2, 17, 'l');
  t.hline(3, 10, 17, 'l');
  t.hline(3, 19, 17, 'l');
  t.hline(3, 20, 17, 'm');
  t.vline(3, 22, 2, 'm'); t.vline(19, 22, 2, 'm');
  t.contornar();
  return { tela: t, escala: 4 };
};

// ── PÓDIO (VAZIO) — trophy, grade 23×25 ×4 = 92×100 ─────────────────────────
PECAS['furniture-podium'] = () => {
  const t = new Tela(23, 25);
  // Degraus largos e encostados: a versão anterior, com 7 de largura e vãos,
  // lia como três postes finos em 46×50 em vez de um pódio.
  t.caixa(0, 11, 8, 12, 'b'); t.rect(1, 12, 6, 2, 'l');   // 2º lugar (esquerda)
  t.caixa(7, 6, 9, 17, 'b');  t.rect(8, 7, 7, 2, 'l');    // 1º lugar (centro, mais alto)
  t.caixa(15, 14, 8, 9, 'b'); t.rect(16, 15, 6, 2, 'l');  // 3º lugar (direita)
  t.rect(1, 21, 6, 1, 'm'); t.rect(8, 21, 7, 1, 'm'); t.rect(16, 21, 6, 1, 'm');
  // Numeração por marcas, sem troféu nenhum em cima.
  t.rect(3, 16, 2, 3, 'h');
  t.rect(10, 11, 2, 4, 'h');
  t.rect(18, 18, 2, 2, 'h');
  t.contornar();
  return { tela: t, escala: 4 };
};

// ── TAPETE arcano-tech (VAZIO de personagem) — rug, grade 52×8 ×4 = 208×32 ──
// Desenhado, e não gerado, porque foi a única peça em que o Gemini não acertou
// a proporção em três rodadas (saiu 3,2:1 e 3,5:1 onde a caixa é 6,5:1) e
// porque na quarta tentativa a UI parou de aceitar envio. A paleta é amostrada
// do lote arcano-tech gerado, para o tapete fechar com as outras 13.
PECAS['furn-rug'] = () => {
  const t = new Tela(52, 8);
  const T = { o: 'o', teal: 'T', tealE: 'D', cobre: 'b', cobreC: 'l', cy: 'C' };
  // corpo oval achatado: largura por linha, mais estreita nas pontas
  const largPorLinha = [30, 42, 48, 50, 50, 48, 42, 30];
  for (let y = 0; y < 8; y++) {
    const w = largPorLinha[y], x0 = Math.round((52 - w) / 2);
    t.rect(x0, y, w, 1, y === 0 || y === 7 ? T.cobre : T.teal);
  }
  // aro de cobre em volta do miolo teal
  for (let y = 1; y < 7; y++) {
    const w = largPorLinha[y], x0 = Math.round((52 - w) / 2);
    t.set(x0, y, T.cobre); t.set(x0 + w - 1, y, T.cobre);
  }
  // trama: patinhas em teal escuro, espaçadas, só no miolo
  for (const [px, py] of [[14, 3], [22, 2], [30, 3], [38, 2], [18, 5], [26, 4], [34, 5]]) {
    t.set(px, py, T.tealE); t.set(px + 1, py, T.tealE); t.set(px, py + 1, T.tealE);
  }
  // cravos de cristal ciano no aro
  for (const px of [8, 26, 43]) { t.set(px, 1, T.cy); t.set(px, 6, T.cy); }
  // franja nas duas pontas
  for (const y of [2, 3, 4, 5]) {
    t.set(3, y, T.cobreC); t.set(2, y, T.cobreC);
    t.set(48, y, T.cobreC); t.set(49, y, T.cobreC);
  }
  t.contornar();
  return { tela: t, escala: 4 };
};

const alvo = process.argv[3];
for (const [id, fn] of Object.entries(PECAS)) {
  if (alvo && alvo !== id) continue;
  const { tela, escala } = fn();
  const arquivo = path.join(OUT, `${id}.png`);
  await tela.gravar(arquivo, escala);
  const m = await sharp(arquivo).metadata();
  console.log(id.padEnd(28), `${m.width}x${m.height}`, `(grade ${tela.w}x${tela.h} x${escala})`);
}
