/**
 * O ELEMENTO PESADELO (`pesadelo` / NIGHTMARE) — exclusivo da mecânica do Pesadelo (decisão do dono, 15/10/2026).
 *
 * É o elemento dos ATAQUES dos pesadelos (o básico e o especial deles). Regras, todas isoladas de propósito:
 *
 *  · NÃO é elemento de jogador: não entra em `VISUAL_ELEMENTS`, no anel de `arena.ts`, no oráculo, nos
 *    derivados nem no sorteio de elemento de nenhum Soulmon. Um teste trava que ele não aparece nessas listas.
 *  · MATCHUP NEUTRO: o Pesadelo, a Masmorra e o resto do PvE do núcleo v3 não aplicam vantagem de elemento
 *    (`dungeonFight` nem recebe elemento), então o Pesadelo não tem fraqueza nem resistência — `nightmareMatchup()`
 *    é sempre 0 (vantagem líquida zero, 1× de dano nos dois sentidos). Se um dia o núcleo passar a ler elemento,
 *    é ESTA função que dá o número: nenhum elemento existente ganha ou perde nada por causa dele.
 *  · ARTE: o encaixe está pronto e vazio. Os PNG caem em `src/assets/soulmon/pesadelo/` (nomes abaixo); sem eles
 *    o golpe usa o FX procedural/petróleo de sempre (`neutro`) — o app nunca fica sem efeito.
 *
 * Arquivos esperados (128², alfa; `orb` voando para a DIREITA, como os de `fx-ataque/`):
 *   `el-pesadelo.png`  — ícone do elemento
 *   `fx-pesadelo-cast.png` · `fx-pesadelo-aura.png` · `fx-pesadelo-slash.png`
 *   `fx-pesadelo-impact.png` · `fx-pesadelo-defended.png` · `fx-pesadelo-orb.png`
 */
import type { AttackFxState } from './attackFxArt';

export const NIGHTMARE_ELEMENT = 'pesadelo';

/** Vantagem líquida do Pesadelo contra qualquer elemento (e de qualquer elemento contra ele): zero, sempre. */
export function nightmareMatchup(_other?: string | null): 0 {
  return 0;
}

const modules = import.meta.glob('../assets/soulmon/pesadelo/*.png', { eager: true, import: 'default' }) as Record<string, string>;

const FX: Partial<Record<AttackFxState, string>> = {};
let ICON: string | undefined;
for (const [path, url] of Object.entries(modules)) {
  if (/\/el-pesadelo\.png$/.test(path)) { ICON = url; continue; }
  const m = /\/fx-pesadelo-(cast|aura|slash|impact|defended|orb)\.png$/.exec(path);
  if (m) FX[m[1] as AttackFxState] = url;
}

/** A arte do estado, ou `undefined` (quem chama cai no FX procedural). */
export const nightmareFx = (estado: AttackFxState): string | undefined => FX[estado];
/** Há ao menos um FX do elemento instalado? */
export const hasNightmareFx = (): boolean => Object.keys(FX).length > 0;
/** O ícone do elemento, ou `undefined` (sem arte, a UI não desenha ícone). */
export const nightmareIcon = (): string | undefined => ICON;
