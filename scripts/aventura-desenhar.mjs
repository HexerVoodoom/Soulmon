/**
 * Desenho programático das 12 cenas RARAS e LENDÁRIAS da aventura da noite.
 *
 * Por que existe: a folha E não pôde ser gerada. Comprovado no `Default/History`
 * do Chrome e na barra lateral do Gemini — o dono estava gerando na MESMA conta
 * ao mesmo tempo (a conversa "Criação de Imagem do Corvinho" nasceu no meio das
 * tentativas), e nenhum envio meu criava conversa. Cinco rotas falharam:
 * conversa nova, conversa nova com a folha D anexada como âncora, continuação
 * dentro da conversa da folha D, prompt compacto e reenvio depois de recarregar.
 *
 * Por que desenhar é aceitável AQUI, e não era antes: o alvo mudou para
 * arcano-tech, que é silhueta chapada de 4-6 cores com sombreamento em degraus
 * — e o tamanho de uso é 28 px no relatório e 24 px no diário. Nesse orçamento
 * de detalhe, um sino de cobre, uma escada, uma carta lacrada e uma aurora saem
 * mais confiáveis desenhados do que gerados. A paleta é a MESMA amostrada do
 * lote gerado, para as 24 fecharem como um conjunto só.
 *
 * ⚠️ Estas 12 são DESENHADAS. Se a folha E for gerada depois, ela substitui
 * estas — o mapa em `utils/adventureArt.ts` não muda, só o arquivo.
 *
 * Grade lógica de 24×24 ampliada por NEAREST ×4 = 96×96, que é o formato das 30
 * cenas de sonho já no jogo e das 12 comuns geradas nesta rodada.
 *
 *   node scripts/aventura-desenhar.mjs [destino/] [id ...]
 */
import sharp from 'sharp';
import path from 'node:path';

const OUT = process.argv[2] || 'D:/Soulmon/repo/src/assets/soulmon/adventures';

// Paleta arcano-tech, amostrada do lote gerado (folhas A-D).
const P = {
  o: [16, 24, 28],     // contorno quase-preto
  T: [47, 111, 110],   // teal médio
  t: [30, 78, 80],     // teal escuro
  D: [20, 45, 52],     // teal profundo (vão, sombra)
  C: [110, 255, 248],  // ciano néon
  c: [64, 190, 190],   // ciano médio
  b: [182, 100, 46],   // cobre base
  l: [222, 140, 62],   // cobre claro
  m: [130, 66, 36],    // cobre escuro
  G: [122, 132, 134],  // pedra clara
  g: [82, 92, 96],     // pedra média
  n: [12, 20, 26],     // noite
  W: [226, 236, 236],  // branco frio
};

class Tela {
  constructor(w, h) { this.w = w; this.h = h; this.px = new Array(w * h).fill(null); }
  set(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.px[y * this.w + x] = c;
  }
  get(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? null : this.px[y * this.w + x]; }
  rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c); }
  caixa(x, y, w, h, dentro, borda = 'o') {
    this.rect(x, y, w, h, borda);
    if (w > 2 && h > 2) this.rect(x + 1, y + 1, w - 2, h - 2, dentro);
  }
  hline(x, y, w, c) { this.rect(x, y, w, 1, c); }
  vline(x, y, h, c) { this.rect(x, y, 1, h, c); }
  /** Elipse preenchida, centro (cx,cy), raios rx/ry. */
  elipse(cx, cy, rx, ry, c) {
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) this.set(cx + x, cy + y, c);
    }
  }
  contornar(cor = 'o') {
    const novo = this.px.slice();
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (this.get(x, y) !== null) continue;
      const viz = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const v = this.get(x + dx, y + dy);
        return v !== null && v !== cor;
      });
      if (viz) novo[y * this.w + x] = cor;
    }
    this.px = novo;
  }
}

const CENAS = {};

// ── RARAS ──────────────────────────────────────────────────────────────────
CENAS['adv-porta-arvore'] = () => {                 // porta de cobre num tronco
  const t = new Tela(24, 24);
  t.rect(4, 2, 16, 22, 't');                        // tronco
  t.vline(5, 2, 22, 'T'); t.vline(18, 2, 22, 'D');  // volume do tronco
  t.caixa(9, 11, 7, 13, 'b');                       // porta
  t.rect(10, 12, 5, 2, 'l');                        // topo iluminado
  t.set(14, 17, 'C');                               // maçaneta
  t.contornar();
  return t;
};

CENAS['adv-lago-espelho'] = () => {                 // lago refletindo estrelas
  const t = new Tela(24, 24);
  t.rect(0, 0, 24, 12, 'n');                        // céu encoberto
  t.hline(0, 10, 24, 'D');
  for (const [x, y] of [[4, 3], [9, 5], [14, 2], [19, 6], [7, 8], [17, 8]]) t.set(x, y, 'C');
  t.rect(0, 12, 24, 12, 't');                       // água
  for (const [x, y] of [[4, 15], [9, 17], [14, 14], [19, 18]]) t.set(x, y, 'c');
  t.hline(0, 12, 24, 'c');                          // linha do espelho
  for (let x = 2; x < 22; x += 5) t.hline(x, 20, 3, 'T');
  t.contornar();
  return t;
};

CENAS['adv-mapa-rasgado'] = () => {                 // metade de um mapa velho
  const t = new Tela(24, 24);
  const borda = [7, 5, 4, 6, 5, 7, 6, 5, 4, 6, 7, 5, 6, 4];  // rasgo à direita
  for (let y = 0; y < 14; y++) t.rect(4, 5 + y, 20 - 4 - borda[y], 1, 'l');
  for (let y = 0; y < 14; y += 3) t.rect(4, 5 + y, 3, 1, 'b');
  t.set(8, 9, 'C'); t.set(12, 14, 'C');             // marcas
  t.set(9, 10, 'm'); t.set(10, 11, 'm'); t.set(11, 12, 'm');  // trilha pontilhada
  t.contornar();
  return t;
};

CENAS['adv-sino'] = () => {                         // sino de cobre sem badalo
  const t = new Tela(24, 24);
  t.rect(11, 3, 2, 3, 'm');                         // alça
  for (let y = 0; y < 10; y++) {
    const w = 6 + y;
    t.rect(12 - Math.floor(w / 2), 6 + y, w, 1, y < 3 ? 'l' : 'b');
  }
  t.rect(4, 16, 16, 2, 'm');                        // aro
  t.rect(6, 18, 12, 1, 'l');
  t.set(9, 9, 'C');                                 // brilho arcano
  t.contornar();
  return t;
};

CENAS['adv-escada'] = () => {                       // escada de cobre em pé
  const t = new Tela(24, 24);
  t.rect(6, 2, 2, 21, 'b'); t.rect(16, 2, 2, 21, 'b');
  t.vline(6, 2, 21, 'l'); t.vline(17, 2, 21, 'm');
  for (let y = 5; y < 22; y += 4) { t.rect(8, y, 8, 2, 'l'); t.hline(8, y + 1, 8, 'm'); }
  t.contornar();
  return t;
};

CENAS['adv-carta'] = () => {                        // carta lacrada
  const t = new Tela(24, 24);
  t.caixa(3, 7, 18, 11, 'W');
  t.rect(4, 8, 16, 1, 'G');                         // dobra superior
  for (let i = 0; i < 8; i++) { t.set(4 + i, 9 + i, 'G'); t.set(19 - i, 9 + i, 'G'); }
  t.elipse(12, 13, 2, 2, 'C');                      // lacre ciano
  t.set(12, 13, 'c');
  t.contornar();
  return t;
};

CENAS['adv-flor-fora'] = () => {                    // flor ciano em galhos secos
  const t = new Tela(24, 24);
  t.rect(11, 10, 2, 14, 't');                       // haste
  for (const [x, y, dx] of [[11, 14, -1], [13, 17, 1], [11, 20, -1]]) {
    for (let i = 1; i <= 4; i++) t.set(x + dx * i, y - i, 't');
  }
  t.elipse(12, 7, 4, 4, 'c');                       // corola
  t.elipse(12, 7, 2, 2, 'C');
  t.set(12, 7, 'W');
  t.contornar();
  return t;
};

CENAS['adv-trilha-antiga'] = () => {                // casa de pedra abandonada
  const t = new Tela(24, 24);
  for (let y = 0; y < 8; y++) t.rect(4 + y, 4 + y, 16 - y * 2, 1, y < 3 ? 'G' : 'g');  // telhado
  t.caixa(5, 12, 14, 12, 'g');
  t.rect(6, 13, 12, 1, 'G');
  t.caixa(10, 16, 5, 8, 'D');                       // vão escuro
  t.set(7, 16, 'D'); t.set(17, 16, 'D');            // janelas
  t.set(11, 22, 'C');                               // luzinha dentro
  t.contornar();
  return t;
};

// ── LENDÁRIAS ──────────────────────────────────────────────────────────────
CENAS['adv-cometa'] = () => {                       // risco de cometa de dia
  const t = new Tela(24, 24);
  t.rect(0, 0, 24, 24, 'T');                        // céu claro do dia
  for (let i = 0; i < 14; i++) t.set(3 + i, 17 - i, i < 4 ? 'c' : 'C');  // cauda
  t.elipse(18, 4, 2, 2, 'W');                       // núcleo
  t.set(18, 4, 'C');
  for (const [x, y] of [[5, 6], [9, 3], [20, 14]]) t.set(x, y, 'W');
  t.contornar();
  return t;
};

CENAS['adv-guardiao'] = () => {                     // cabeça de estátua com musgo
  // Os olhos são o único traço que sobrevive a 28 px, então são BLOCOS de 3×2
  // com moldura escura — a versão de 1 px sumia por completo no tamanho de uso.
  const t = new Tela(24, 24);
  t.caixa(4, 5, 16, 19, 'g');
  t.rect(5, 6, 14, 3, 'G');                         // testa iluminada
  t.rect(2, 9, 20, 2, 'g');                         // aba de pedra
  t.rect(3, 9, 18, 1, 'G');
  t.rect(6, 13, 5, 4, 'D');                         // órbitas fundas
  t.rect(13, 13, 5, 4, 'D');
  t.rect(7, 14, 3, 2, 'C');                         // olhos acesos
  t.rect(14, 14, 3, 2, 'C');
  t.rect(9, 20, 6, 2, 'D');                         // boca
  for (const [x, y] of [[5, 5], [6, 5], [12, 4], [17, 5], [18, 6]]) t.set(x, y, 't');  // musgo
  t.contornar();
  return t;
};

CENAS['adv-ponte'] = () => {                        // ponte de pedra na neblina
  // O ARCO é o que faz "ponte" ser lida a 28 px; a versão anterior era só uma
  // barra horizontal e podia ser qualquer coisa. A neblina come o lado direito.
  const t = new Tela(24, 24);
  t.rect(0, 10, 24, 3, 'g');                        // tabuleiro
  t.hline(0, 10, 24, 'G');
  t.rect(0, 13, 3, 11, 'g');                        // encontro esquerdo
  t.rect(0, 13, 1, 11, 'G');
  // vão em arco sob o tabuleiro
  const arco = [[3, 5], [4, 7], [5, 8], [6, 9], [7, 9], [8, 9], [9, 8], [10, 7], [11, 5]];
  for (const [x, h] of arco) t.rect(x, 13, 1, 11 - h, 'g');
  t.rect(11, 13, 3, 11, 'g');                       // pilar central
  for (let x = 14; x < 24; x++) {                   // some na neblina
    const a = (x - 14) / 10;
    if (a < 0.5) { t.rect(x, 13, 1, 8, 'g'); }
    else if (a < 0.8) { t.rect(x, 13, 1, 5, 'G'); }
  }
  t.rect(14, 15, 10, 9, 'T');                       // banco de neblina
  t.rect(17, 12, 7, 4, 'T');
  t.contornar();
  return t;
};

CENAS['adv-aurora'] = () => {                       // aurora — SÓ teal e ciano
  const t = new Tela(24, 24);
  t.rect(0, 0, 24, 24, 'n');                        // céu noturno
  const cortinas = [[2, 3, 9], [6, 1, 12], [10, 4, 10], [14, 2, 13], [18, 5, 8], [21, 3, 11]];
  for (const [x, y0, h] of cortinas) {
    for (let j = 0; j < h; j++) t.set(x, y0 + j, j < 2 ? 'C' : j < h - 3 ? 'c' : 'T');
    for (let j = 0; j < h - 2; j++) t.set(x + 1, y0 + j + 1, j < 2 ? 'c' : 'T');
  }
  for (const [x, y] of [[4, 16], [12, 18], [20, 17], [8, 20]]) t.set(x, y, 'W');  // estrelas
  t.rect(0, 22, 24, 2, 'D');                        // horizonte
  return t;                                          // sem contorno: é céu, não objeto
};

const alvos = process.argv.slice(3);
const ids = alvos.length ? alvos : Object.keys(CENAS);
for (const id of ids) {
  const fn = CENAS[id];
  if (!fn) { console.error(`cena desconhecida: ${id}`); process.exitCode = 1; continue; }
  const t = fn();
  const ESC = 4;                                     // 24 × 4 = 96
  const W = t.w * ESC, H = t.h * ESC;
  const buf = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = t.get(Math.floor(x / ESC), Math.floor(y / ESC));
    const i = (y * W + x) * 4;
    if (!c) { buf[i + 3] = 0; continue; }
    const [r, g, b] = P[c];
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;
  }
  await sharp(buf, { raw: { width: W, height: H, channels: 4 } }).png()
    .toFile(path.join(OUT, `${id}.png`));
  console.log(`${id.padEnd(22)} ${W}x${H} (grade ${t.w}x${t.h} x${ESC})`);
}
