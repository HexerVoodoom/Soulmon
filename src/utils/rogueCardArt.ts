// Ilustrações dos CARDS de escolha da incursão roguelike (Calabouço diário, `RogueDungeon.tsx`).
// Slot pronto, arte ainda por gerar (docs/PROMPTS-CARDS-DUNGEON-2026-10-29.md): sem o arquivo em
// `soulmon/dungeon-rogue/cards/`, o consumidor mantém o ícone atual (nenhuma mudança visual).
import type { BonusKind } from './rogueDungeonSave';

/** `import.meta.glob` eager e estreito: só `cards/card-*.png`, como URL. */
const modules = import.meta.glob('../assets/soulmon/dungeon-rogue/cards/card-*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

/** Chave do jogo (caminho C1–C4 ou bônus B1–B3) → nome do arquivo (`card-<nome>.png`). */
export const ROGUE_CARD_FILE: Record<string, string> = {
  combat: 'combate', puzzle: 'quebra-cabeca', minigame: 'minigame', explore: 'prova-de-mente',
  power: 'bonus-ataque', vigor: 'bonus-vida', heal: 'bonus-cura',
};

/** Indexa os módulos do glob por nome de arquivo (sem `card-` e `.png`). */
export const indexCardArt = (mods: Record<string, string>): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [path, url] of Object.entries(mods)) {
    const m = /card-(.+)\.png$/.exec(path);
    if (m) out[m[1]] = url;
  }
  return out;
};

/** Resolve a URL da arte de uma chave num índice, ou `undefined`. Pura (testável sem arquivos). */
export const resolveCardArt = (art: Record<string, string>, key: string): string | undefined => {
  const file = ROGUE_CARD_FILE[key];
  return file ? art[file] : undefined;
};

const ART = indexCardArt(modules);

/** Ilustração do card de um caminho ou bônus, ou `undefined` (o consumidor mantém o ícone). */
export const rogueCardArt = (key: PathOrBonus): string | undefined => resolveCardArt(ART, key);
type PathOrBonus = string | BonusKind;
