// Ícones dos BÔNUS da incursão roguelike (Calabouço diário, `RogueDungeon.tsx`).
// Arte P2-02 instalada em 28/10/2026 (96², alfa binário), pasta `soulmon/dungeon-rogue/`.
//
// Hoje o jogo tem 3 bônus (`BONUS_KINDS` em `rogueDungeonSave.ts`); a leva veio com 12 ícones.
// Os 9 sem bônus correspondente ficam na pasta e neste mapa SEM CHAMADA (estoque para quando o
// catálogo crescer — não inventar bônus para gastar ícone). Um bônus novo ganha o ícone trocando
// só `ROGUE_BONUS_ICON_KEY`.
import type { BonusKind } from './rogueDungeonSave';

/** `import.meta.glob` eager: o Vite empacota cada PNG sem uma linha de import por arquivo. */
const modules = import.meta.glob('../assets/soulmon/dungeon-rogue/bonus-*.png', { eager: true, import: 'default' }) as Record<string, string>;

const ART: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const m = /bonus-(.+)\.png$/.exec(path);
  if (m) ART[m[1]] = url;
}

/** Bônus do jogo → nome do arquivo (`bonus-<chave>.png`). `heal` é o "escudo de cura" (escudo de 15% no próximo combate). */
export const ROGUE_BONUS_ICON_KEY: Record<BonusKind, string> = { power: 'ataque', vigor: 'vida', heal: 'aura-escudo' };

/** Ícone de um bônus do jogo, ou `undefined` (o consumidor mantém o glifo Material). */
export const rogueBonusIcon = (kind: string): string | undefined => {
  const key = (ROGUE_BONUS_ICON_KEY as Record<string, string>)[kind];
  return key ? ART[key] : undefined;
};

/** Todas as chaves de arte na pasta (estoque incluído). Para testes de cobertura. */
export const rogueBonusArtKeys = (): string[] => Object.keys(ART);
