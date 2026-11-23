// Conjunto Fundador — catálogo visual (chunk lazy, entra por `catalogosNovos.ts`; a lógica pura é `fundador.ts`).
// Fundo: pintura 1200×648 (recorte do chão/parede da arte vertical aprovada, chão ~74%). Moldura: `assets/soulmon/molduras/founder-moldura.png`
// (192², abertura 96, entra pelo glob de `frames.ts`). Retrato: `assets/avatares/founder-retrato.webp` + `catalogo.json` (grupo `founder`).
// Cristal: `cristalFundador.ts`. NUNCA à venda: a posse vem só de `fundadorPremios` (`unlock` aponta para missão inexistente).
import type { ShopItem } from './shop';
import type { AvatarFrame } from './frames';
import fundo from '../assets/backgrounds/founder-fundo.webp';
import { FUNDADOR_FUNDO_ID, FUNDADOR_MOLDURA_ID } from './fundador';

export const FUNDADOR_FUNDO: ShopItem = {
  id: FUNDADOR_FUNDO_ID, kind: 'bg', icon: '🏛️',
  namePt: 'Fundo Fundador', nameEn: 'Founder Background',
  descPt: 'Um templo de pedra esculpida, com veios turquesa — só para quem chegou cedo',
  descEn: 'A carved stone temple with turquoise veins — only for those who arrived early',
  price: 0,
  unlock: { kind: 'mission', missionId: 'founder-background-grant' },
};
export const FUNDADOR_FUNDO_CENARIO = {
  id: FUNDADOR_FUNDO_ID, namePt: FUNDADOR_FUNDO.namePt, nameEn: FUNDADOR_FUNDO.nameEn, css: `url(${fundo})`, baseColor: '#03201e',
};
export const FUNDADOR_MOLDURA: AvatarFrame = {
  id: FUNDADOR_MOLDURA_ID, namePt: 'Moldura Fundadora', nameEn: 'Founder Frame', origin: 'event',
  howPt: 'Dada a quem concluiu tarefas em 2 dias diferentes no início do Soulmon.', howEn: 'Given for completing tasks on 2 different days early in Soulmon.',
  look: { ring: '#3FB8C8', accent: '#D4F4F8', line: 'double', width: 3 },
};
