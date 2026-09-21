// ÍCONES-FICHA das 9 linhas × 4 tiers (rodada 2 da SQUAD-ARTE, 21/09/2026 —
// `docs/ASSETS-A-GERAR.md` §13 R2-2, D-J13 do canvas Jogos): 64² para o Dino
// e os oponentes do Torneio, 32² (a cabeça) para o mini-visor do ranking.
// São DERIVADOS do sprite 256² de `lines/` (`scripts-arte/derivar-rodada2.mjs`:
// bbox do alfa encaixada em 64; 32 = os 45 % superiores da bbox), então D5
// continua valendo — ícone é redução, não pose nova.
//
// Fronteira no molde de `attackFxArt.ts`: glob eager, `undefined` quando não
// há arte → o consumidor cai no sprite 256² reduzido (o que era antes).
import { resolveLineForStage, type LineTier } from './sprites';

export type LineIconSize = 32 | 64;

const modules = import.meta.glob('../assets/soulmon/lines/icons/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const ICONS: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  // `kaelen-champion-virus-64.png` → linha `kaelen`, tier `champion`; o `-virus`
  // do nome de arquivo é histórico, a linha só tem um sprite por tier.
  const m = /\/([a-z]+)-(rookie|champion|ultimate|mega)(?:-virus)?-(32|64)\.png$/.exec(path);
  if (!m) continue;
  ICONS[`${m[1]}:${m[2]}:${m[3]}`] = url;
}

/** Ícone-ficha de uma linha num tier, ou `undefined` se a arte não existir. */
export const lineIcon = (lineId: string, tier: LineTier, size: LineIconSize): string | undefined =>
  ICONS[`${lineId}:${tier}:${size}`];

/**
 * Ícone-ficha para um ESTÁGIO (o que os consumidores têm à mão): resolve a
 * linha como `getSpriteForStage` e devolve `undefined` quando o estágio não é
 * de linha (a árvore do próprio jogador) — aí o consumidor mostra o sprite.
 */
export const lineIconForStage = (stage: string, size: LineIconSize, demoCharacterId?: string): string | undefined => {
  const r = resolveLineForStage(stage, demoCharacterId);
  return r ? lineIcon(r.line, r.tier, size) : undefined;
};

/** Quantos ícones o glob encontrou — guard de instalação (9 linhas × 4 tiers × 2 tamanhos = 72). */
export const LINE_ICON_COUNT = Object.keys(ICONS).length;
