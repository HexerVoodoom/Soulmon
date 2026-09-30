// NPCs de teste pra Biblioteca — reaproveita as 3 linhas de inimigo geradas
// via Higgsfield (kaelen/orrin/thalindra, ver sprites.ts) só pra dar conteúdo
// à página sem precisar de contas reais. Marcados com `isNpc` (sem
// friend/gift — não existe profile de verdade no KV pra esses ids).
import { DUNGEON_LINE_SPRITES, DUNGEON_LINE_NAMES } from './sprites';
import type { DirectoryPlayer } from './community';

export interface LibraryNpc extends DirectoryPlayer {
  isNpc: true;
  spriteUrl: string;
}

export const LIBRARY_NPCS: LibraryNpc[] = [
  {
    // O JOGADOR se chama Kaelen; o PET dele se chama Pyraka. Os outros dois já
    // seguiam esse padrão (Orrin/Akashai, Thalindra/Nimbrata) — este ficou
    // como 'Pyraka' porque o pet se chamava 'Pyrakamon', e a renomeação de
    // 08/09/2026 fez os dois campos colidirem na mesma linha da Biblioteca.
    id: 'npc-pyraka', name: 'Kaelen', petName: DUNGEON_LINE_NAMES.kaelen,
    stage: 'champion-power', unlockedStages: ['rookie', 'champion-power'],
    pvpEnabled: false, daysPlaying: 47,
    isNpc: true, spriteUrl: DUNGEON_LINE_SPRITES.kaelen.champion,
  },
  {
    id: 'npc-orrin', name: 'Orrin', petName: DUNGEON_LINE_NAMES.orrin,
    stage: 'ultimate-harmony', unlockedStages: ['rookie', 'champion-harmony', 'ultimate-harmony'],
    pvpEnabled: false, daysPlaying: 88,
    isNpc: true, spriteUrl: DUNGEON_LINE_SPRITES.orrin.ultimate,
  },
  {
    id: 'npc-thalindra', name: 'Thalindra', petName: DUNGEON_LINE_NAMES.thalindra,
    stage: 'mega-benevolence', unlockedStages: ['rookie', 'champion-benevolence', 'ultimate-benevolence', 'mega-benevolence'],
    pvpEnabled: false, daysPlaying: 133,
    isNpc: true, spriteUrl: DUNGEON_LINE_SPRITES.thalindra.mega,
  },
];
