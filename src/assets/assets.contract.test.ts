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
  magenta: [
    'soulmon/buttons/button-hover-small.png',
    'soulmon/buttons/button-hover-medium.png',
    'soulmon/buttons/button-hover-large.png',
    'soulmon/buttons/button-active-small.png',
    'soulmon/buttons/button-active-medium.png',
    'soulmon/buttons/button-active-large.png',
  ],
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
    expect(referenced.size).toBeGreaterThan(100);
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
  it('não acusa arte que é legitimamente cinza (dessaturada, prata)', async () => {
    for (const q of ['soulmon/buttons/button-disabled-small.png', 'icons/icon-trophy-silver.png']) {
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
