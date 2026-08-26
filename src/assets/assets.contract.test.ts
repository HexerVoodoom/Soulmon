/**
 * GUARD MECÂNICO DE ASSET — a fronteira `asset ↔ renderer`.
 *
 * Contexto: as três falhas que motivaram esta rodada (checkbox de 2px, overlay
 * que nunca gravou, `save.js` sem teste) eram fronteiras sem dono. Apareceu uma
 * quarta, na única dimensão que ninguém tinha listado: **a arte**. Nenhum teste
 * deste projeto jamais abriu um PNG.
 *
 * O que este arquivo cobre, e por que cada item é um bug de verdade:
 *
 * 1. **Xadrez de transparência assado nos pixels.** O editor/gerador mostra
 *    transparência como um xadrez cinza; quando a exportação achata a camada, o
 *    xadrez vira PIXEL OPACO. Em produção isso é um retângulo cinza atrás da
 *    arte. Encontrado assim em `soulmon/icons/icon-reset.png` (98,2% opaco,
 *    26,8% de cinza de xadrez), que é o ícone de "Refazer o ritual" do menu do
 *    `BottomNav` — visível para qualquer usuário que abrisse o menu.
 * 2. **Arquivo ilegível / 0 byte.** O footgun 4 do CLAUDE.md já registra PNGs de
 *    0 byte no histórico. Existe um hoje: `icons/gemini-raw/icon-star.png`.
 * 3. **Pixel fora da paleta declarada.** Os PNGs `button-hover-*`/`button-active-*`
 *    carregam magenta/roxo da paleta ANTIGA. A decisão de não ligá-los está
 *    escrita num comentário do `PixelKit.tsx` — comentário não é guard. Aqui é.
 *
 * Todo guard tem casos de AUTOVERIFICAÇÃO (§ "autoverificação"): imagens
 * sintéticas provando que o detector acusa o que deve acusar e não acusa o que
 * não deve. Sem isso um guard passa sempre, pelo motivo errado.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ts, fonteDe } from '../test/tsAst';
import sharp from 'sharp';

const SRC = path.resolve(process.cwd(), 'src');
const ASSETS = path.join(SRC, 'assets');

// ───────────────────────────────────────────────────────────── utilidades

function walk(dir: string, re: RegExp): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p, re));
    else if (re.test(e.name)) out.push(p);
  }
  return out;
}

const rel = (f: string) => path.relative(ASSETS, f).replace(/\\/g, '/');

/** Assets efetivamente importados pelo código de `src/` (o que vai ao bundle). */
function referencedBySrc(): Set<string> {
  const used = new Set<string>();
  for (const f of walk(SRC, /\.(ts|tsx)$/)) {
    const s = fs.readFileSync(f, 'utf8');
    for (const m of s.matchAll(/['"`](\.{1,2}\/[^'"`]*?\.(?:png|jpg|jpeg|webp))['"`]/g)) {
      const abs = path.resolve(path.dirname(f), m[1]);
      if (fs.existsSync(abs)) used.add(abs);
    }
    // alias `figma:asset/<hash>.png` → src/assets/<hash>.png (vite.config.ts)
    for (const m of s.matchAll(/['"`]figma:asset\/([a-f0-9]+\.png)['"`]/g)) {
      const abs = path.join(ASSETS, m[1]);
      if (fs.existsSync(abs)) used.add(abs);
    }
  }
  return used;
}

interface Metrics {
  w: number; h: number; opaquePct: number; checkerPct: number; magentaPct: number;
  /** Transparência real — o discriminador que falta ao `checkerPct` sozinho. */
  transparentPct: number;
  /** Xadrez de verdade: cinza neutro E sem alfa E alternando em blocos. */
  bakedChecker: boolean;
}

async function metricsOf(buf: Buffer | string): Promise<Metrics> {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const n = info.width * info.height;
  let opaque = 0, checker = 0, magenta = 0, transparent = 0;
  for (let i = 0; i < n; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3];
    if (a === 0) transparent++;
    if (a <= 200) continue;
    opaque++;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    // xadrez: cinza NEUTRO de meio-tom. Preto/branco puros ficam de fora de
    // propósito — contorno e brilho da arte são neutros e legítimos.
    if (mx - mn < 18 && r >= 100 && r <= 205) checker++;
    // magenta/roxo: vermelho e azul bem acima do verde
    if (mx >= 60 && r > g + 40 && b > g + 40) magenta++;
  }
  /**
   * `checkerPct` sozinho mede COR, não padrão — e por isso acusa arte que é
   * legitimamente cinza. Medido no repositório: `button-disabled-small.png`
   * dá 9,7% (é dessaturado de propósito), `icon-trophy-silver.png` 8,5%
   * (prata é cinza), e vários mascotes candidatos passam de 40%. Nenhum deles
   * tem xadrez. Só não quebravam o guard porque o escopo `PIXEL_ART` os deixava
   * de fora — ou seja, o guard estava certo por acidente. No dia em que alguém
   * importasse um botão desabilitado, ele falharia pelo motivo errado, e a
   * reação natural (subir o teto) mataria a checagem.
   *
   * O xadrez REAL tem três marcas juntas: cinza neutro, **alfa praticamente
   * inexistente** (o padrão substituiu a transparência) e **alternância
   * regular entre poucos patamares** ao varrer uma linha. Arte cinza legítima
   * falha em pelo menos uma — normalmente a transparência.
   */
  const transparentPct = (100 * transparent) / n;
  const y = Math.min(3, info.height - 1);
  const linha: number[] = [];
  for (let x = 0; x < Math.min(info.width, 160); x++) {
    const i = (y * info.width + x) * 4;
    const mx = Math.max(data[i], data[i + 1], data[i + 2]);
    const mn = Math.min(data[i], data[i + 1], data[i + 2]);
    linha.push(mx - mn < 18 ? Math.round(data[i] / 16) * 16 : -1);
  }
  const niveis = new Set(linha.filter(v => v >= 0)).size;
  let trocas = 0;
  for (let i = 1; i < linha.length; i++) if (linha[i] !== linha[i - 1]) trocas++;
  const checkerPct = (100 * checker) / n;

  return {
    w: info.width, h: info.height,
    opaquePct: (100 * opaque) / n,
    checkerPct,
    magentaPct: (100 * magenta) / n,
    transparentPct,
    bakedChecker:
      checkerPct > CHECKER_LIMIT && transparentPct < 1 && niveis <= 3 && trocas >= 6,
  };
}

/** PNG sintético a partir de uma função de cor — base dos casos de autoverificação. */
async function synth(w: number, h: number, fn: (x: number, y: number) => [number, number, number, number]) {
  const buf = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const [r, g, b, a] = fn(x, y);
    const i = (y * w + x) * 4;
    buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = a;
  }
  return sharp(buf, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
}

// Limiar. Ícones limpos do projeto medem ≤1% de cinza de xadrez; o defeito real
// media 26,8%. 5% é folgado dos dois lados e foi escolhido DEPOIS de medir.
const CHECKER_LIMIT = 5;

/** Escopo do guard de xadrez: a arte de UI em pixel. Cenários de fundo são
 *  opacos por natureza e não entram. */
const PIXEL_ART = /^soulmon\/(icons\/|ui\/|nest-base|lines\/|progress\/)/;

/**
 * QUARENTENA — arquivos que existem no repo com defeito conhecido. A regra que
 * torna isto honesto: cada entrada é verificada duas vezes — o defeito ainda
 * precisa estar lá (senão a entrada é removida) **e** o arquivo não pode estar
 * importado por `src/`. Lista que só cresce vira cemitério.
 */
const QUARANTINE = {
  // Vazia de propósito. A única entrada era `icons/gemini-raw/icon-star.png`,
  // que não era um PNG corrompido: era uma PÁGINA HTML (`<!DOCTYPE html>`)
  // salva com extensão .png — um download do gerador que falhou e gravou a
  // página de erro. A pasta inteira não tinha mais nada e ninguém a importava,
  // então foi removida em vez de quarentenada. Com a exceção fora do caminho,
  // a checagem de decodificação abaixo passou a valer para TODO asset, não só
  // para os importados — que é o que teria pego este arquivo no dia em que
  // ele entrou.
  unreadable: [] as string[],
  /**
   * Esvaziada em 18/08/2026, e a regra da própria quarentena é quem mandou
   * esvaziar: "cada entrada é verificada duas vezes — o defeito ainda precisa
   * estar lá E o arquivo não pode estar importado". Os seis `hover`/`active`
   * foram REESCRITOS a partir do `normal` (derivação por faixa de cor +
   * inpainting do resíduo ameixa, ver o cabeçalho do `PixelKit.tsx`), medem
   * 0,0000% de magenta e agora estão no bundle. Manter a lista faria o teste
   * exigir que continuassem quebrados.
   */
  magenta: [] as string[],
};

const allAssets = walk(ASSETS, /\.(png|jpe?g|webp)$/i);
const referenced = referencedBySrc();

// ──────────────────────────────────────────────────────── autoverificação

describe('guard de asset — autoverificação (o detector enxerga?)', () => {
  it('ACUSA um xadrez de transparência assado', async () => {
    const png = await synth(64, 64, (x, y) => {
      const on = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0;
      return on ? [255, 255, 255, 255] : [153, 153, 153, 255];
    });
    const m = await metricsOf(png);
    expect(m.checkerPct).toBeGreaterThan(CHECKER_LIMIT);
    expect(m.bakedChecker).toBe(true);
  });

  it('NÃO acusa cinza chapado sem padrão (o critério é padrão, não cor)', async () => {
    // Um retângulo cinza uniforme e opaco: alto `checkerPct`, zero alternância.
    // É o formato de arte dessaturada legítima, e não pode disparar o guard.
    const png = await synth(64, 64, () => [150, 150, 150, 255]);
    const m = await metricsOf(png);
    expect(m.checkerPct).toBeGreaterThan(CHECKER_LIMIT);
    expect(m.bakedChecker).toBe(false);
  });

  it('NÃO acusa arte limpa com fundo transparente e contorno preto', async () => {
    const png = await synth(64, 64, (x, y) => {
      const inside = (x - 32) ** 2 + (y - 32) ** 2 < 20 ** 2;
      const edge = Math.abs(Math.hypot(x - 32, y - 32) - 20) < 2;
      if (edge) return [0, 0, 0, 255];          // contorno neutro, legítimo
      if (inside) return [45, 212, 191, 255];   // teal da paleta
      return [0, 0, 0, 0];
    });
    const m = await metricsOf(png);
    expect(m.checkerPct).toBeLessThanOrEqual(CHECKER_LIMIT);
  });

  it('ACUSA magenta/roxo fora da paleta e NÃO acusa teal/cobre', async () => {
    const roxo = await metricsOf(await synth(32, 32, () => [180, 60, 200, 255]));
    expect(roxo.magentaPct).toBeGreaterThan(50);
    const teal = await metricsOf(await synth(32, 32, () => [45, 212, 191, 255]));
    const cobre = await metricsOf(await synth(32, 32, () => [185, 123, 82, 255]));
    expect(teal.magentaPct).toBe(0);
    expect(cobre.magentaPct).toBe(0);
  });

  it('ACUSA arquivo ilegível (não confunde com arquivo limpo)', async () => {
    await expect(metricsOf(Buffer.from('isto não é um png'))).rejects.toThrow();
  });

  it('a varredura achou assets de verdade (não uma pasta vazia)', () => {
    expect(allAssets.length).toBeGreaterThan(150);
    // O piso caiu de 100 para 80 no revamp de design: 13 PNGs de ÍCONE
    // deixaram de ser importados de uma vez ao virarem glifo do Material
    // Symbols, e o número de referenciados caiu para 91.
    //
    // Este número é autoverificação do scanner ("não estou lendo uma pasta
    // vazia"), não regra de produto — e é esperado que ele siga CAINDO
    // enquanto a migração de ícone avança, porque cada ícone que vira glifo
    // é um asset a menos referenciado. Se um dia cair perto de 80 de novo, a
    // resposta certa é olhar o que sobrou antes de baixar o piso outra vez:
    // o que resta referenciado deveria ser sprite de criatura e arte de
    // cenário, nunca ícone de interface.
    expect(referenced.size).toBeGreaterThan(80);
    // e a lista de referenciados é um subconjunto real, não "tudo"
    expect(referenced.size).toBeLessThan(allAssets.length);
  });
});

// ─────────────────────────────────────────────────────────────── o guard

describe('guard de asset — integridade dos arquivos', () => {
  it('nenhum asset do repositório tem 0 byte', () => {
    const zero = allAssets.filter(f => fs.statSync(f).size === 0).map(rel);
    expect(zero).toEqual([]);
  });

  /**
   * Vale para TODO asset do repositório, não só para os importados. O caso que
   * motivou o alargamento não era um PNG corrompido — era uma página HTML
   * salva como `.png` (download do gerador que falhou e gravou o erro). Um
   * arquivo assim passa por "existe e tem bytes", passa por revisão de código,
   * e só aparece quando alguém tenta usá-lo. Checar só o que já está importado
   * pega tarde demais: pega depois de alguém ter ligado o arquivo quebrado.
   */
  it('todo asset do repositório é decodificável como imagem', async () => {
    const bad: string[] = [];
    for (const f of allAssets) {
      try { await sharp(f).metadata(); } catch { bad.push(rel(f)); }
    }
    expect(bad).toEqual([]);
  });

  it('os arquivos ilegíveis conhecidos continuam ilegíveis E fora do bundle', async () => {
    for (const q of QUARANTINE.unreadable) {
      const abs = path.join(ASSETS, q);
      expect(fs.existsSync(abs), `${q} sumiu — tire da quarentena`).toBe(true);
      // ainda quebrado? se alguém consertar, a entrada tem que sair da lista
      await expect(sharp(abs).metadata(), `${q} agora abre — tire da quarentena`).rejects.toThrow();
      // e o que importa de verdade: ninguém importou o arquivo quebrado
      expect([...referenced].map(rel)).not.toContain(q);
    }
  });
});

describe('guard de asset — xadrez de transparência assado', () => {
  const alvos = [...referenced].filter(f => PIXEL_ART.test(rel(f)));

  it('o escopo do guard não está vazio (senão ele passaria por omissão)', () => {
    expect(alvos.length).toBeGreaterThan(30);
  });

  it('nenhuma arte de UI importada por src/ tem xadrez assado', async () => {
    const sujos: string[] = [];
    for (const f of alvos) {
      const m = await metricsOf(f);
      if (m.bakedChecker) sujos.push(`${rel(f)} (${m.checkerPct.toFixed(1)}% de cinza, ${m.transparentPct.toFixed(1)}% transparente)`);
    }
    expect(sujos).toEqual([]);
  });

  /**
   * O escopo `PIXEL_ART` deixa `buttons/` de fora, e era só isso que impedia o
   * guard de acusar arte legitimamente cinza. Agora que o critério exige o
   * PADRÃO e não só a cor, o guard sobrevive fora do próprio escopo — este caso
   * prova isso com arquivos reais do repositório, não sintéticos.
   */
  /**
   * `button-disabled-small.png` saiu desta lista em 18/08/2026: a arte foi
   * reescrita e o novo desabilitado dessatura na direção do cinza-TEAL do tema
   * (2,2% de cinza neutro), não do cinza puro de antes (9,7%) — deixou de ser
   * um exemplo válido de "arte legitimamente cinza". O troféu de prata sozinho
   * sustenta o caso, e continua sendo arquivo real do repositório.
   */
  it('não acusa arte que é legitimamente cinza (dessaturada, prata)', async () => {
    for (const q of ['icons/icon-trophy-silver.png']) {
      const abs = path.join(ASSETS, q);
      if (!fs.existsSync(abs)) continue;
      const m = await metricsOf(abs);
      expect(m.checkerPct, `${q} deveria ser cinza o bastante para ser um teste real`).toBeGreaterThan(CHECKER_LIMIT);
      expect(m.bakedChecker, `${q} é arte cinza legítima, não xadrez`).toBe(false);
    }
  });

  it('REGRESSÃO: icon-reset.png ficou com opacidade de ícone, não de retângulo', async () => {
    // Antes do conserto: 98,2% opaco / 26,8% de xadrez, com o quadriculado
    // inteiro visível atrás do ícone no menu do BottomNav.
    const m = await metricsOf(path.join(ASSETS, 'soulmon/icons/icon-reset.png'));
    expect(m.checkerPct).toBeLessThan(2);
    expect(m.opaquePct).toBeLessThan(70);
  });
});

/**
 * TERCEIRA classe de asset sujo, e a que mais aparecia para o usuário: ruído
 * pontilhado assado no sprite. `lumel-rookie.png` tinha **961 ilhas** de 1–2
 * pixels espalhadas pela tela — resto de um fundo mal removido — e o pet do
 * jogador aparecia dentro de uma nuvem de sujeira na Home.
 *
 * Os dois guards anteriores NÃO pegavam: o de xadrez exige transparência quase
 * zero (aqui a imagem é quase toda transparente) e o de paleta olha cor, não
 * geometria. Cada instrumento novo achou uma safra nova — é o padrão da sessão
 * inteira (docs/STATUS.md §5).
 *
 * O critério é ESTRUTURAL, não de cor: arte de pixel é feita de regiões
 * conectadas. Ilha minúscula e solta no meio do nada é ruído.
 */
describe('guard de asset — ruído pontilhado (fundo mal removido)', () => {
  /** % de pixels visíveis que vivem em ilhas menores que `minIlha`. */
  async function ruidoPct(buf: Buffer | string, minIlha = 24) {
    const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const W = info.width, H = info.height;
    const on = (i: number) => data[i * 4 + 3] > 25;
    const comp = new Int32Array(W * H).fill(-1);
    const tam: number[] = [];
    for (let k = 0; k < W * H; k++) {
      if (comp[k] !== -1 || !on(k)) continue;
      const id = tam.length; let n = 0; const st = [k]; comp[k] = id;
      while (st.length) {
        const c = st.pop()!; n++;
        const cx = c % W, cy = (c - cx) / W;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
          const kk = ny * W + nx;
          if (comp[kk] !== -1 || !on(kk)) continue;
          comp[kk] = id; st.push(kk);
        }
      }
      tam.push(n);
    }
    let vis = 0, ruido = 0;
    for (let k = 0; k < W * H; k++) {
      if (comp[k] === -1) continue;
      vis++;
      if (tam[comp[k]] < minIlha) ruido++;
    }
    return (100 * ruido) / Math.max(vis, 1);
  }

  it('ACUSA ruído espalhado e NÃO acusa arte sólida (autoverificação)', async () => {
    // Sujo: um quadrado sólido + 400 pontos isolados espalhados.
    const sujo = await synth(64, 64, (x, y) => {
      if (x > 20 && x < 44 && y > 20 && y < 44) return [45, 212, 191, 255];
      return (x * 7 + y * 13) % 23 === 0 ? [30, 30, 30, 255] : [0, 0, 0, 0];
    });
    expect(await ruidoPct(sujo)).toBeGreaterThan(10);

    // Limpo: o mesmo quadrado, sem os pontos.
    const limpo = await synth(64, 64, (x, y) =>
      x > 20 && x < 44 && y > 20 && y < 44 ? [45, 212, 191, 255] : [0, 0, 0, 0],
    );
    expect(await ruidoPct(limpo)).toBe(0);
  });

  it('nenhum sprite de criatura tem nuvem de ruído', async () => {
    const linhas = [...referenced].filter(f => /soulmon[\\/]lines[\\/]/.test(rel(f)));
    expect(linhas.length, 'escopo vazio — o guard passaria por omissão').toBeGreaterThan(10);
    const sujos: string[] = [];
    for (const f of linhas) {
      const p = await ruidoPct(f);
      // Medido depois da limpeza: o pior sprite limpo fica em 0,9%. 3% dá folga
      // para detalhe legítimo (brilho de olho, partícula) sem deixar passar a
      // nuvem — o `lumel-rookie` sujo media 12,5%.
      if (p > 3) sujos.push(`${rel(f)} (${p.toFixed(1)}% em ilhas soltas)`);
    }
    expect(sujos).toEqual([]);
  });
});

/**
 * QUARTA classe de asset sujo, e a mais grave que sobrou: **DUAS GRADES DE
 * PIXEL DENTRO DO MESMO VISOR**.
 *
 * O visor inteiro do Soulmon existe sob uma regra: escala INTEIRA. O sprite do
 * pet foi corrigido para ela (256 → 128 = 2:1, 384 → 128 = 3:1) e o
 * `image-rendering: pixelated` virou decisão em vez de remendo. Só que o pet
 * não é a única coisa desenhada lá dentro — e nada mede o resto:
 *
 *   · `soulmon/nest-base.png` é **360×201** numa caixa de **148×83**
 *     (`BASE_SLOTS.nest`): 2,43× na horizontal e 2,40× na vertical. Fracionário
 *     **e anisotrópico** — a mesma peça esmaga de um jeito em X e de outro em Y;
 *   · as **14 peças de mobília** (`assets/decor/*.png`) são todas 256×256 e
 *     caem em caixas de 56×56, 104×16, 46×50, 48×52, 56×40 — fatores de 4,57×
 *     a 16×, nenhum inteiro, e a do tapete (256×256 → 104×16) é 2,46× em X
 *     contra 16× em Y.
 *
 * O efeito é exatamente o que a regra do sprite descreve, mas ao lado dele: com
 * `pixelated`, o navegador não borra — ele DERRUBA linhas de forma desigual.
 * Então o pet tem um pixel de um tamanho e o berço em que ele está sentado tem
 * um pixel de outro, com espessura de traço variando dentro da mesma peça. É a
 * assinatura de "arte reunida de fontes diferentes", que é o oposto do que o
 * visor deveria comunicar.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * POR QUE O GUARD FALTAVA, e por que ele é o item importante desta rodada:
 * este arquivo tem guard para xadrez assado, arquivo morto, ruído pontilhado e
 * contaminação de paleta — quatro dimensões — e **nenhum para a escala em que a
 * arte é DESENHADA na tela**. Foi por isso que o sprite foi corrigido à mão e
 * catorze peças de mobília não: o defeito só era visível para quem estivesse
 * olhando aquele arquivo naquele dia. Guard é o que transforma "alguém reparou"
 * em "não passa mais".
 *
 * O conserto NÃO é código: é REDESENHAR a arte para as caixas (nest-base em
 * 296×166 = 2:1, ou 444×249 = 3:1; mobília exportada no tamanho do slot × 2).
 * `utils/petStage.ts` e os PNGs não são desta rodada, então o caso do
 * repositório fica **`skip`, com a lista medida impressa na mensagem** — o
 * valor aqui é travar o problema e documentá-lo, não pintar o CI de vermelho
 * por uma dívida de arte. **Quem redesenhar as peças tira o `.skip` no mesmo
 * commit** — e a partir daí a próxima peça fora da grade não entra.
 */
describe('guard de asset — escala de render (uma grade de pixel só)', () => {
  /** Fator de ampliação de um PNG dentro da caixa em que ele é desenhado. */
  function escala(src: { w: number; h: number }, box: { w: number; h: number }) {
    return { x: box.w / src.w, y: box.h / src.h };
  }
  /** Inteiro nos dois eixos (ampliação ou redução) E o MESMO nos dois. */
  function naGrade(e: { x: number; y: number }): boolean {
    const inteiro = (v: number) => Number.isInteger(v) || Number.isInteger(1 / v);
    return inteiro(e.x) && inteiro(e.y) && e.x === e.y;
  }

  it('AUTOVERIFICAÇÃO: o detector separa 2:1 de 2,43× e pega anisotropia', () => {
    // O caso bom, que é o do sprite do pet: 256 de origem em caixa de 128.
    expect(naGrade(escala({ w: 256, h: 256 }, { w: 128, h: 128 }))).toBe(true);
    expect(naGrade(escala({ w: 384, h: 384 }, { w: 128, h: 128 }))).toBe(true);
    // Ampliação inteira também vale (arte 16px desenhada em 64px).
    expect(naGrade(escala({ w: 16, h: 16 }, { w: 64, h: 64 }))).toBe(true);
    // O berço de hoje: fracionário nos dois eixos.
    expect(naGrade(escala({ w: 360, h: 201 }, { w: 148, h: 83 }))).toBe(false);
    // Anisotropia pura: inteiro em cada eixo, mas fatores DIFERENTES — a peça
    // sai esticada, e um teste que olhasse um eixo só deixaria isto passar.
    expect(naGrade(escala({ w: 64, h: 64 }, { w: 32, h: 16 }))).toBe(false);
  });

  /** Todo PNG que o visor desenha, com a caixa em px em que ele é desenhado. */
  async function pecasDoVisor(): Promise<Array<{ nome: string; src: { w: number; h: number }; box: { w: number; h: number } }>> {
    const { BASE_SLOTS, DECOR_SLOTS } = await import('../utils/petStage');
    const { ALL_SHOP_ITEMS } = await import('../utils/shop');
    const pecas: Array<{ nome: string; src: { w: number; h: number }; box: { w: number; h: number } }> = [];

    const medir = async (arquivo: string) => {
      const m = await sharp(arquivo).metadata();
      return { w: m.width ?? 0, h: m.height ?? 0 };
    };

    // A mobília base (o berço), que fica DEBAIXO do pet — o pior vizinho
    // possível para uma grade divergente.
    const berco = path.join(ASSETS, 'soulmon/nest-base.png');
    pecas.push({ nome: 'soulmon/nest-base.png', src: await medir(berco), box: { w: BASE_SLOTS.nest.w, h: BASE_SLOTS.nest.h } });

    // A decoração: id do item da loja → `decor/<id>.png` (a convenção de nome
    // é do `utils/decorArt.ts`; arquivo faltando aqui é achado por si só).
    for (const item of ALL_SHOP_ITEMS) {
      if (item.kind !== 'furniture' || !item.slot) continue;
      const arquivo = path.join(ASSETS, 'decor', `${item.id}.png`);
      if (!fs.existsSync(arquivo)) continue;
      const slot = DECOR_SLOTS[item.slot];
      pecas.push({ nome: `decor/${item.id}.png`, src: await medir(arquivo), box: { w: slot.w, h: slot.h } });
    }
    return pecas;
  }

  it('o inventário de peças do visor não está vazio (senão o guard passa por omissão)', async () => {
    const pecas = await pecasDoVisor();
    expect(pecas.length).toBeGreaterThan(10);
  });

  it('REGRESSÃO (passa hoje): o sprite do pet cai em escala inteira', async () => {
    // O que JÁ foi consertado, e a prova de que o guard mede a coisa certa:
    // toda arte de linha é 256 ou 384 e é desenhada em `PET_RENDER` (128).
    // Importado, nunca digitado: número copiado é número que diverge (footgun 9).
    //
    // ⚠️ FLAKE MEDIDO (25/08/2026) — importa-se de `utils/petStage`, o DONO da
    // constante, e não do `CompanionHUD` que a reexporta. O componente tem 1469
    // linhas e um grafo de 23 imports (React, react-dom, sprites, backgrounds);
    // transformá-lo custava ~600ms com a máquina ociosa e passava de 4,4s sob
    // contenção de CPU, estourando o orçamento de 5s DESTE teste — reproduzido
    // em 5005ms. O guard não perde nada: `petStage` é o dono do número, o
    // `CompanionHUD` o consome de lá, e continua não havendo literal digitado.
    const { PET_RENDER } = await import('../utils/petStage');
    const linhas = [...referenced].filter(f => /soulmon[\\/]lines[\\/]/.test(rel(f)));
    expect(linhas.length).toBeGreaterThan(10);
    const fora: string[] = [];
    for (const f of linhas) {
      const m = await sharp(f).metadata();
      const e = escala({ w: m.width ?? 0, h: m.height ?? 0 }, { w: PET_RENDER, h: PET_RENDER });
      if (!naGrade(e)) fora.push(`${rel(f)} (${m.width}×${m.height} → ${PET_RENDER}px)`);
    }
    expect(fora).toEqual([]);
  });

  /**
   * REGRESSÃO DE FLAKE (25/08/2026) — "o guard de escala não paga o import do
   * renderer". O teste acima estourava o timeout de 5s porque lia `PET_RENDER`
   * de `components/CompanionHUD`, arrastando o grafo React inteiro para dentro
   * do orçamento do teste. Reproduzido em 5005ms sob contenção de CPU.
   *
   * O conserto foi mover a constante para o dono da geometria; o que pode
   * desfazê-lo em silêncio é alguém voltar a importar o componente aqui. Este
   * teste é o cadeado — e ele é textual de propósito: verificar importando o
   * componente seria pagar exatamente o custo que se quer proibir.
   */
  it('REGRESSÃO DE FLAKE: o guard de asset não importa componente React (o custo que estourava 5s)', () => {
    const fonte = fs.readFileSync(path.join(SRC, 'assets/assets.contract.test.ts'), 'utf8');
    const importsDeComponente = [...fonte.matchAll(/import\(\s*['"]([^'"]*components\/[^'"]+)['"]\s*\)/g)]
      .map(m => m[1]);
    expect(importsDeComponente, 'importe a constante do módulo-dono (utils/), nunca do componente').toEqual([]);
  });

  /**
   * Lê o `CompanionHUD.tsx` como TEXTO (AST, sem executar nada) e responde três
   * perguntas que o regex não sabia responder: onde `PET_RENDER` é DECLARADO,
   * onde é USADO, e com que valor o `<img>` do sprite é dimensionado.
   *
   * Comentário não é nó de AST — nenhuma das três respostas pode ser satisfeita
   * por um bloco de comentário, que era exatamente o buraco do guard anterior.
   *
   * MEMOIZADO: os dois guards abaixo leem a MESMA análise. Parsear duas vezes
   * pagaria o custo duas vezes num arquivo cujo defeito histórico é timeout.
   */
  let analise: ReturnType<typeof analisaHud> | null = null;
  const elosDoPetRender = () => (analise ??= analisaHud());

  async function analisaHud() {
    const arquivo = path.join(SRC, 'components/CompanionHUD.tsx');
    const sf = fonteDe(arquivo);
    const ln = (n: import('typescript').Node) =>
      sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;

    /* Toda forma de DECLARAR um nome, enumerada pelo parser em vez de por um
       regex escrito contra a variante que o autor acabou de ver. */
    const DECLARA = new Set<number>([
      ts.SyntaxKind.VariableDeclaration, ts.SyntaxKind.BindingElement,
      ts.SyntaxKind.Parameter, ts.SyntaxKind.FunctionDeclaration,
      ts.SyntaxKind.ClassDeclaration, ts.SyntaxKind.EnumDeclaration,
      ts.SyntaxKind.ModuleDeclaration, ts.SyntaxKind.TypeAliasDeclaration,
      ts.SyntaxKind.InterfaceDeclaration, ts.SyntaxKind.PropertyDeclaration,
      ts.SyntaxKind.MethodDeclaration, ts.SyntaxKind.ImportClause,
      ts.SyntaxKind.NamespaceImport, ts.SyntaxKind.ImportEqualsDeclaration,
    ]);

    const vinculos: string[] = [];
    const usos: number[] = [];
    const literais: Array<{ valor: number; linha: number }> = [];
    const spriteBox: Record<string, string> = {};
    let achouSpriteImg = false;

    const atributo = (el: import('typescript').JsxOpeningLikeElement, nome: string) =>
      el.attributes.properties.find(
        (a): a is import('typescript').JsxAttribute =>
          ts.isJsxAttribute(a) && a.name.getText(sf) === nome);
    const valorDe = (a?: import('typescript').JsxAttribute) =>
      a?.initializer && ts.isJsxExpression(a.initializer) ? a.initializer.expression : undefined;

    const visita = (node: import('typescript').Node): void => {
      if (ts.isIdentifier(node) && node.text === 'PET_RENDER') {
        const p = node.parent;
        if (ts.isImportSpecifier(p) && p.name === node) {
          const decl = p.parent.parent.parent;
          const de = ts.isImportDeclaration(decl) && ts.isStringLiteral(decl.moduleSpecifier)
            ? decl.moduleSpecifier.text : '?';
          vinculos.push(`import de '${de}'`);
        } else if (ts.isExportSpecifier(p)) {
          /* `export { PET_RENDER } from '…'` não cria vínculo local NEM é uso —
             é só o reexport que mantém quem importava daqui. */
        } else if (ts.isBindingElement(p) && p.propertyName === node) {
          /* `const { PET_RENDER: outroNome } = …` declara `outroNome`, não este. */
        } else if (DECLARA.has(p.kind) && (p as { name?: unknown }).name === node) {
          vinculos.push(`${ts.SyntaxKind[p.kind]} na linha ${ln(node)}`);
        } else if (
          (ts.isPropertyAssignment(p) || ts.isPropertySignature(p) || ts.isEnumMember(p))
          && p.name === node
        ) {
          /* chave de objeto: nomeia um campo, não lê a constante. */
        } else if (ts.isPropertyAccessExpression(p) && p.name === node) {
          /* `X.PET_RENDER`: propriedade de outro objeto, não a constante daqui. */
        } else {
          usos.push(ln(node));
        }
      }
      if (ts.isNumericLiteral(node)) literais.push({ valor: Number(node.text), linha: ln(node) });
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        if (node.tagName.getText(sf) === 'img') {
          const src = valorDe(atributo(node, 'src'));
          if (src && ts.isIdentifier(src) && src.text === 'sprite') {
            achouSpriteImg = true;
            const style = valorDe(atributo(node, 'style'));
            if (style && ts.isObjectLiteralExpression(style)) {
              for (const prop of style.properties) {
                if (!ts.isPropertyAssignment(prop)) continue;
                const chave = prop.name.getText(sf);
                if (chave === 'width' || chave === 'height') {
                  spriteBox[chave] = prop.initializer.getText(sf);
                }
              }
            }
          }
        }
      }
      ts.forEachChild(node, visita);
    };
    visita(sf);
    return { vinculos, usos, literais, achouSpriteImg, spriteBox };
  }

  /**
   * O cadeado do outro lado: `PET_RENDER` só vale como guard se for o MESMO
   * número que o renderer desenha. Como o teste acima passou a lê-lo de
   * `utils/petStage`, o elo que precisa continuar existindo é o `CompanionHUD`
   * consumir de lá em vez de redeclarar o seu. Redeclarar não daria erro nenhum
   * — o guard passaria a medir um número que ninguém renderiza, que é a forma
   * exata de "suíte verde que não prova o que você acha".
   *
   * ⚠️ ENDURECIDO em 26/08/2026 — achado **F-2** do gate da fatia 2. O guard
   * anterior eram três `expect` TEXTUAIS, e DOIS deles já eram satisfeitos sem
   * elo nenhum:
   *   - a regex do import era satisfeita pelo import de `PET_BOX`, que não tem
   *     nada a ver com escala;
   *   - `/PET_RENDER/.test(hud)` era satisfeita pelo BLOCO DE COMENTÁRIO do topo
   *     do `CompanionHUD`, que cita a constante três vezes;
   *   - e a regex de redeclaração simplesmente não casava com destructuring.
   *
   * MEDIDO na branch antes de trocar, com a variante do gate aplicada ao
   * componente (import de `PET_RENDER` removido, `PET_BOX` mantido):
   *     const LOCAL_GEOM = { PET_RENDER: 144 };
   *     const { PET_RENDER } = LOCAL_GEOM;
   *   → `npx tsc --noEmit` exit 0 e ESTE arquivo passava 24/24, com o app
   *   renderizando 144 e o guard de escala medindo 128. Verde provando nada.
   *
   * O que mudou: a pergunta deixou de ser textual e passou a ser de VÍNCULO,
   * respondida no AST. As formas de declarar um nome passam a ser enumeradas
   * pelo PARSER, não por um regex escrito contra a variante que o autor acabou
   * de ver (a sexta lição de método do run `soulmon-02`).
   *
   * Por que AST estático e não importar o componente: importar `CompanionHUD`
   * aqui é o custo que causou o flake (guard acima), e o reexport de
   * `CompanionHUD.tsx:49` NÃO é saída — importar dele executa o módulo inteiro
   * e o grafo React atrás dele. O parser lê o arquivo como TEXTO: não resolve
   * import nenhum. O parser vem de `src/test/tsAst.ts`, com `import` ESTÁTICO:
   * o custo de carregar o `typescript` (~490ms) é pago na fase de import do
   * arquivo, e não dentro do orçamento deste caso — ver o cabeçalho de lá.
   */
  it('REGRESSÃO (F-2): PET_RENDER tem UM vínculo no CompanionHUD, e é o import de utils/petStage', async () => {
    const elo = await elosDoPetRender();
    expect(
      elo.vinculos,
      'PET_RENDER declarado dentro do CompanionHUD (const, destructuring, parâmetro, import de outro módulo…): '
      + 'o guard de escala passaria a medir um número que ninguém renderiza',
    ).toEqual(["import de '../utils/petStage'"]);
    expect(
      elo.usos.length,
      'PET_RENDER não é USADO em lugar nenhum do código do CompanionHUD — citar a constante em comentário não é elo',
    ).toBeGreaterThan(0);
    /* O TETO LOCAL DE 15s SAIU — e sair não é afrouxar, é parar de ter duas
       réguas para a mesma pergunta (footgun 9). Quando ele foi escrito, o
       default da suíte era 5s e este caso media 514ms, dos quais ~490ms eram
       o `await import('typescript')` DENTRO do relógio. Hoje duas coisas
       mudaram: o piso global é 15s (`vitest.budget.mjs`, dono único do
       número), e o parser é carregado na fase de import do arquivo
       (`src/test/tsAst.ts`). Medido depois da mudança: 56ms — 0,37% do
       orçamento, contra 726ms antes. Nenhum expect foi tocado. */
  });

  /**
   * A outra metade do elo: provar que o número medido aqui é o número que
   * chega ao `<img>` do pet. O vínculo (teste acima) diz de onde vem o VALOR;
   * este diz que é ele que é DESENHADO — e que ninguém digitou o número.
   */
  it('REGRESSÃO (F-2): o <img> do sprite é dimensionado pela constante, e o número não é digitado', async () => {
    const { PET_RENDER } = await import('../utils/petStage');
    const elo = await elosDoPetRender();
    expect(
      elo.achouSpriteImg,
      'não achei o `<img src={sprite}>` do pet — o guard perdeu o alvo; aponte-o para o elemento que desenha o sprite',
    ).toBe(true);
    expect(
      elo.spriteBox,
      'o sprite do pet é desenhado com um valor que não é `PET_RENDER` — o guard de escala mede outra coisa',
    ).toEqual({ width: 'PET_RENDER', height: 'PET_RENDER' });
    expect(
      elo.literais.filter(l => l.valor === PET_RENDER),
      `${PET_RENDER} digitado no CompanionHUD: número copiado é número que diverge (footgun 9)`,
    ).toEqual([]);
    /* A memoização de `elosDoPetRender` continua valendo: quem rodar primeiro
       paga o parse (não mais o carregamento do compilador) e o outro lê o
       resultado. Sem teto local, pelo mesmo motivo da nota acima. */
  });

  /**
   * ⚠️ `skip` DE DÍVIDA DE ARTE, não de teste quebrado. Ele falha hoje, e deve
   * falhar: são 15 peças fora da grade (o berço + as 14 mobílias). Tirar o
   * `skip` sem redesenhar os PNGs só quebra o CI; redesenhar os PNGs sem tirar
   * o `skip` deixa o buraco reaberto para a próxima peça. Os dois no mesmo
   * commit. A lista exata sai na mensagem da falha quando rodado.
   */
  it.skip('DÍVIDA DE ARTE: toda peça do visor é desenhada em escala inteira', async () => {
    const fora: string[] = [];
    for (const p of await pecasDoVisor()) {
      const e = escala(p.src, p.box);
      if (!naGrade(e)) {
        // Impresso como REDUÇÃO (origem ÷ caixa), que é como a peça é lida:
        // "esta arte é 2,43× maior que o buraco onde ela entra".
        fora.push(`${p.nome}: ${p.src.w}×${p.src.h} numa caixa de ${p.box.w}×${p.box.h} (÷${(1 / e.x).toFixed(2)} por ÷${(1 / e.y).toFixed(2)})`);
      }
    }
    expect(fora, 'peças com grade de pixel própria dentro do visor').toEqual([]);
  });
});

describe('guard de asset — paleta (magenta/roxo da paleta antiga)', () => {
  it('os PNGs contaminados continuam contaminados E continuam fora do bundle', async () => {
    const referenciados = new Set([...referenced].map(rel));
    for (const q of QUARANTINE.magenta) {
      const m = await metricsOf(path.join(ASSETS, q));
      expect(m.magentaPct, `${q} está limpo agora — ligue o PNG e tire da lista`).toBeGreaterThan(1);
      expect(
        referenciados.has(q),
        `${q} tem ${m.magentaPct.toFixed(1)}% de magenta e foi IMPORTADO — reintroduz roxo na UI`,
      ).toBe(false);
    }
  });

  /**
   * ACHADO desta rodada, e ele contraria o que estava escrito: o relatório da
   * UI (`ui/frontend-kit-round1.md` §2a) afirma que só os PNGs `hover`/`active`
   * trazem o halo magenta e que por isso o `normal` foi ligado. Medindo, o
   * `normal` TAMBÉM tem — pouco, mas tem, e é a arte que está no bundle:
   * uma linha de contorno ameixa (~rgb(98,21,86)) na borda superior.
   * `btn-sm.png` é a mais afetada (0,65% dos pixels) e é justamente a fatia do
   * `PixelButton size="sm"`.
   *
   * RESOLVIDO depois que este teste foi escrito, e o próprio teste é quem
   * corrigiu o conserto: a primeira limpeza usou um critério de magenta mais
   * frouxo (exigia azul > 90) e declarou `btn-sm` zerado quando o guard ainda
   * media 0,55% — o resíduo é ameixa escura, `rgb(98,21,86)`, com azul 86.
   * Refeito com EXATAMENTE o critério do `metricsOf` acima:
   * `btn-sm` 1690px→7, `btn-md` 1518px→62, `btn-lg` 82px→7.
   *
   * O que sobra é anti-aliasing na borda do bisel, não elemento de design.
   * O inpainting (média iterativa dos vizinhos limpos) preserva a vizinhança —
   * escolher uma cor nova ali mudaria o bisel de cobre.
   *
   * Os `hover`/`active` de `buttons/` NÃO são recuperáveis assim: lá o magenta
   * é área (halo), não contorno, e não há vizinho limpo de onde puxar cor.
   * Continuam em quarentena e fora do bundle, esperando regeração.
   */
  const TETO_MAGENTA: Record<string, number> = {
    'soulmon/ui/btn-md.png': 0.02,
  };

  it('a arte de botão do bundle não ganha mais magenta do que já tem', async () => {
    const alvos = [...referenced].filter(f => /^soulmon\/(ui|buttons)\//.test(rel(f)));
    expect(alvos.length).toBeGreaterThan(0);
    for (const f of alvos) {
      const m = await metricsOf(f);
      const teto = TETO_MAGENTA[rel(f)] ?? 0.01;
      expect(m.magentaPct, `${rel(f)} tem ${m.magentaPct.toFixed(2)}% de magenta (teto ${teto}%)`)
        .toBeLessThanOrEqual(teto);
    }
  });

  /**
   * O invariante que faz os estados do botão funcionarem, e que NÃO é óbvio
   * olhando os arquivos: as fatias 9-slice (`--sm-px-slice`: 82/66/43) foram
   * medidas na arte `normal` e são aplicadas aos QUATRO estados. Se um estado
   * tiver dimensão diferente, a mesma fatia cai noutro ponto do desenho e a
   * moldura pula no hover — que é exatamente o frame em que o olho está no
   * botão. Foi por isso que os PNGs antigos não podiam ser ligados: além do
   * magenta, o `disabled` tinha enquadramento próprio.
   *
   * Derivar do `normal` garante isso por construção; este caso é quem impede
   * que alguém volte a soltar arte desenhada à parte na pasta.
   */
  it('os quatro estados do botão dividem a mesma geometria (a fatia é uma só)', async () => {
    for (const [tam, curto] of [['small', 'sm'], ['medium', 'md'], ['large', 'lg']] as const) {
      const base = await sharp(path.join(ASSETS, `soulmon/ui/btn-${curto}.png`)).metadata();
      for (const estado of ['hover', 'active', 'disabled']) {
        const p = `soulmon/buttons/button-${estado}-${tam}.png`;
        const m = await sharp(path.join(ASSETS, p)).metadata();
        expect(
          { w: m.width, h: m.height },
          `${p} tem ${m.width}×${m.height} e o normal tem ${base.width}×${base.height} — a fatia 9-slice não serve para os dois`,
        ).toEqual({ w: base.width, h: base.height });
      }
    }
  });

  it('REGRESSÃO: a arte de botão do bundle está limpa de magenta', async () => {
    // Este caso substitui o antigo "o resíduo é REAL", que existia para provar
    // que o teto não era decoração. O resíduo deixou de existir, então a prova
    // agora é a contrária: as três fatias do PixelButton medem zero.
    // 0,55% / 0,25% / 0,05% antes; agora resíduo de anti-aliasing na casa de
    // dezenas de pixels. O teto de 0,02% deixa margem para recompressão sem
    // deixar passar um halo de volta (o menor halo real medido foi 2,7%).
    for (const fn of ['btn-sm.png', 'btn-md.png', 'btn-lg.png']) {
      const m = await metricsOf(path.join(ASSETS, 'soulmon/ui', fn));
      expect(m.magentaPct, `${fn} voltou a ter magenta`).toBeLessThanOrEqual(0.02);
    }
  });
});
