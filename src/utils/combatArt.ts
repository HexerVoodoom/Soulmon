/**
 * ARTE DA CENA DE COMBATE POR ELEMENTO (rodada 2 do Higgsfield, instalada em
 * 04/10/2026) — `assets/soulmon/combate/`:
 *  · `bg-<base>.png` — 17 cenários 9:16 opacos (terço inferior livre para os
 *    lutadores), guardados a **360×640** (≈ a resolução nativa da pixel art) e
 *    ampliados pelo navegador com `image-rendering: pixelated` — a 1080×1920 o
 *    WebP passava do teto de 400 KB do `orcamentoDeBytes`;
 *  · `escudo-<base>.png` — 17 escudos levantados (128², alfa binário), a defesa
 *    automática do DEFENSOR no lugar do flash `defended` do FX;
 *
 * Só os 17 elementos BASE têm arte; um derivado usa o seu 1º componente
 * (`DERIVED_ELEMENT_PAIRS`), `planta`/`industrial` NÃO têm
 * `bg-`/`escudo-` base: `combatSceneBg` devolve o cenário do domínio deles e o escudo cai no `defended` do FX (ambos próprios); `neutro` tem arte própria (05/10/2026: `bg-neutro` + `escudo-neutro`); o resto
 * (desconhecido) devolve `undefined` e o chamador mantém o que tinha.
 *
 * ⚠️ Importado SÓ pela `BattleStage` (chunk preguiçoso da luta) — não importe
 * isto de nada que esteja no chunk de entrada (`entradaEnxuta.contract.test.ts`).
 */
import { DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';
import { ELEMENT_VISUAL } from './elementVisual.data';

const bgs = import.meta.glob('../assets/soulmon/combate/bg-*.png', { eager: true, import: 'default' }) as Record<string, string>;
const escudos = import.meta.glob('../assets/soulmon/combate/escudo-*.png', { eager: true, import: 'default' }) as Record<string, string>;

const porId = (mods: Record<string, string>, prefixo: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [p, url] of Object.entries(mods)) {
    const m = new RegExp(`/${prefixo}-([a-z_]+)\\.png$`).exec(p);
    if (m) out[m[1]] = url;
  }
  return out;
};
const BG = porId(bgs, 'bg');
const ESCUDO = porId(escudos, 'escudo');

/** Cor média medida de cada cenário: pinta o fundo enquanto a imagem carrega (mesma regra de `dungeonScenes.ts`). */
const BG_MEAN: Record<string, string> = {
  agua: '#184f53', ar: '#33686a', arcano: '#18474d', eletricidade: '#195154', espaco: '#174352',
  fogo: '#274644', gravidade: '#17434b', luz: '#716c48', marcial: '#245859', morte: '#275455',
  vida: '#1c504c', som: '#1e5c5f', sombra: '#12303b', tempo: '#1c5656', terra: '#39443c',
  vigor: '#274a48', vileza: '#204c42', neutro: '#285558',
  fada: '#16312f', industrial: '#0c3532', planta: '#0e3830', // 30/10/2026: cenários base próprios
};

const DERIVED_TO_BASE: Record<string, string> = Object.fromEntries(DERIVED_ELEMENT_PAIRS.map(d => [d.id, d.componentes[0]]));

/** Qualquer id de elemento → o elemento BASE que tem arte de cena, ou `undefined`. */
export function combatBaseElement(id: string | null | undefined): string | undefined {
  if (!id) return undefined;
  const mapped = id;
  const base = DERIVED_TO_BASE[mapped] ?? mapped;
  return BG[base] ? base : undefined;
}

/** `background` shorthand do cenário do elemento (`url(…) center/cover <cor média>`), ou `undefined`. */
export function combatSceneBg(id: string | null | undefined): string | undefined {
  const base = combatBaseElement(id);
  if (base) return `url(${BG[base]}) center/cover ${BG_MEAN[base] ?? ''}`.trim();
  // Fallback (save antigo sem a arte): planta/industrial usam o cenário do domínio. Desde 30/10/2026 têm `bg-` próprio, que vem antes.
  return id === 'planta' || id === 'industrial' ? combatDomainSceneBg(id, 0) : undefined;
}

// ── Cenários por DOMÍNIO (Arena por tema, 27/10/2026) ──────────────────────
// `combate/dominio/<dominio>-<1..3>.png`: o `masmorra-1..3` de cada um dos 17 domínios (`assets/dominios/`), reduzido para 360×640 e
// paleta de 64 cores (≈ 70 KB cada, como os `bg-*` base). Quem escolhe o domínio é `utils/arenaTema.ts`.
const dominioBgs = import.meta.glob('../assets/soulmon/combate/dominio/*.png', { eager: true, import: 'default' }) as Record<string, string>;
const DOMINIO_BG: Record<string, string> = {};
for (const [p, url] of Object.entries(dominioBgs)) {
  const m = /\/([a-z_]+-[0-9])\.png$/.exec(p);
  if (m) DOMINIO_BG[m[1]] = url;
}

/** `background` shorthand do cenário `variante` (0..2) de um domínio, ou `undefined` se o domínio não tem arte instalada. */
export function combatDomainSceneBg(dominio: string | null | undefined, variante = 0): string | undefined {
  if (!dominio) return undefined;
  const url = DOMINIO_BG[`${dominio}-${(Math.abs(variante) % 3) + 1}`];
  return url ? `url(${url}) center/cover #1c3a40` : undefined;
}

/** O escudo levantado do elemento do DEFENSOR, ou `undefined` (cai no `defended` do FX). */
export function combatShield(id: string | null | undefined): string | undefined {
  const base = combatBaseElement(id);
  return base ? ESCUDO[base] : undefined;
}

/** Assinatura CIELAB do ícone do elemento → hex sRGB, com luminosidade mínima (brilho legível sobre cenário escuro). */
function labToHex(L: number, a: number, b: number): string {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - b / 200;
  const inv = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);
  const X = 0.95047 * inv(fx), Y = inv(fy), Z = 1.08883 * inv(fz);
  const lin = [3.2406 * X - 1.5372 * Y - 0.4986 * Z, -0.9689 * X + 1.8758 * Y + 0.0415 * Z, 0.0557 * X - 0.204 * Y + 1.057 * Z];
  return '#' + lin.map(c => {
    const g = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.max(c, 0) ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, g)) * 255).toString(16).padStart(2, '0');
  }).join('');
}

/**
 * Cor do brilho externo do especial: a do ELEMENTO de quem conjura (assinatura do ícone, `elementVisual.data.ts`).
 * Misto sem assinatura própria usa a do primeiro componente; sem nenhuma, `undefined` (o CSS cai no dourado).
 */
export function combatGlowColor(id: string | null | undefined): string | undefined {
  if (!id) return undefined;
  const v = ELEMENT_VISUAL[id] ?? ELEMENT_VISUAL[DERIVED_TO_BASE[id] ?? ''];
  if (!v) return undefined;
  return labToHex(Math.max(v[0], 58), v[1] * 1.15, v[2] * 1.15);
}

/**
 * Par de cores do especial: [brilho externo, brilho de trás] = 1º e 2º componente do elemento (misto) ou a mesma cor (base).
 * Cada uma passa por `combatGlowColor`.
 */
export function combatGlowPair(id: string | null | undefined): [string | undefined, string | undefined] {
  const comps = id ? DERIVED_ELEMENT_PAIRS.find(d => d.id === id)?.componentes : undefined;
  if (!comps) { const c = combatGlowColor(id); return [c, c]; }
  return [combatGlowColor(comps[0]), combatGlowColor(comps[1])];
}

/** Guard de instalação: 17 cenários e 17 escudos dos elementos base + os do `neutro` (18). */
export const COMBAT_BG_COUNT = Object.keys(BG).length;
export const COMBAT_SHIELD_COUNT = Object.keys(ESCUDO).length;
