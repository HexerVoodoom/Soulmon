// NPCs de teste pra Biblioteca — reaproveita as 3 linhas de inimigo geradas
// via Higgsfield (kaelen/orrin/thalindra, ver sprites.ts) só pra dar conteúdo
// à página sem precisar de contas reais. Marcados com `isNpc` (sem
// friend/gift — não existe profile de verdade no KV pra esses ids).
import { DUNGEON_LINE_SPRITES } from './sprites';
import type { DirectoryPlayer } from './community';

export interface LibraryNpc extends DirectoryPlayer {
  isNpc: true;
  spriteUrl: string;
}

export const LIBRARY_NPCS: LibraryNpc[] = [
  {
    id: 'npc-pyraka', name: 'Pyraka', petName: 'Pyrakamon',
    stage: 'champion-virus', unlockedStages: ['rookie', 'champion-virus'],
    pvpEnabled: false, rankPoints: 340, daysPlaying: 47, tasksDone: 212,
    isNpc: true, spriteUrl: DUNGEON_LINE_SPRITES.kaelen.champion,
  },
  {
    id: 'npc-orrin', name: 'Orrin', petName: 'Akashaoimon',
    stage: 'ultimate-data', unlockedStages: ['rookie', 'champion-data', 'ultimate-data'],
    pvpEnabled: false, rankPoints: 512, daysPlaying: 88, tasksDone: 401,
    isNpc: true, spriteUrl: DUNGEON_LINE_SPRITES.orrin.ultimate,
  },
  {
    id: 'npc-thalindra', name: 'Thalindra', petName: 'Nimbratamon',
    stage: 'mega-vaccine', unlockedStages: ['rookie', 'champion-vaccine', 'ultimate-vaccine', 'mega-vaccine'],
    pvpEnabled: false, rankPoints: 705, daysPlaying: 133, tasksDone: 689,
    isNpc: true, spriteUrl: DUNGEON_LINE_SPRITES.thalindra.mega,
  },
];
