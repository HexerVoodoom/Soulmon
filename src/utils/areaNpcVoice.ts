/**
 * FALA DOS NPCs DE ÁREA (minimal-ui F4).
 *
 * Dono único da copy dos 6 anfitriões do Mapa — nenhum componente escreve a
 * fala deles à mão (regra do `narrativa.contract` e do redator de UX: texto
 * que o jogador lê não nasce solto dentro de JSX). Os nomes (Grom, Vultrak,
 * Brisa, Pipo, Lumi) são a decisão D5 do dono (23/09/2026,
 * `docs/design/minimal-ui/PLANO-IMPLEMENTACAO.md`); o NPC do Laboratório
 * (Vesca) foi nomeado em 24/09/2026, no mesmo estilo dos outros cinco.
 *
 * As falas em PT-BR vêm dos mocks aprovados
 * (`product/squad-minimal-ui/propostas/<area>/mock.html`, classe `.npc-fala`);
 * o EN é tradução fiel, sem adicionar conteúdo novo.
 */
import type { Language } from './i18n';
import type { AreaId } from '../navigation';

export interface AreaNpcVoice {
  /** Nome próprio (PT/EN — só muda o rótulo de ofício, o nome não traduz). */
  namePt: string;
  nameEn: string;
  linePt: string;
  lineEn: string;
}

const AREA_NPC_VOICE: Record<AreaId, AreaNpcVoice> = {
  mercado: {
    namePt: 'Grom, o mercador',
    nameEn: 'Grom, the merchant',
    linePt: 'Bem-vindo à caverna! Escolha uma lojinha — tenho de tudo, se tiver os Bits.',
    lineEn: 'Welcome to the cave! Pick a stall — I have everything, if you have the Bits.',
  },
  arena: {
    namePt: 'Vultrak, mestre da arena',
    nameEn: 'Vultrak, master of the arena',
    linePt: 'Aqui ninguém entra de braços cruzados. Escolha: o Torneio da semana ou um duelo agora.',
    lineEn: "No one stands idle here. Pick: this week's Tournament or a duel right now.",
  },
  exploracao: {
    namePt: 'Brisa, a guia',
    nameEn: 'Brisa, the guide',
    linePt: 'A névoa esconde caminhos. Escolha por onde começar: a Masmorra ou a Corrida.',
    lineEn: 'The mist hides paths. Choose where to start: the Dungeon or the Dash.',
  },
  jogos: {
    namePt: 'Pipo, o anfitrião',
    nameEn: 'Pipo, the host',
    linePt: 'Oba, visita! Bora brincar um pouco com seu Soulmon?',
    lineEn: 'Ooh, a visitor! Want to play a bit with your Soulmon?',
  },
  laboratorio: {
    namePt: 'Vesca, a alquimista',
    nameEn: 'Vesca, the alchemist',
    linePt: 'Toda evolução começa aqui, numa mistura certa. Vamos ver como seu Soulmon está crescendo.',
    lineEn: 'Every evolution starts here, in the right mix. Let’s see how your Soulmon is growing.',
  },
  hall: {
    namePt: 'Lumi, a anfitriã',
    nameEn: 'Lumi, the host',
    linePt: 'Seja bem-vindo ao Hall! Na Biblioteca você encontra amigos e outros Soulmons.',
    lineEn: 'Welcome to the Hall! In the Library you can meet friends and other Soulmons.',
  },
};

export function areaNpcVoice(id: AreaId, language: Language): { name: string; line: string } {
  const v = AREA_NPC_VOICE[id];
  const isPt = language === 'pt-BR';
  return { name: isPt ? v.namePt : v.nameEn, line: isPt ? v.linePt : v.lineEn };
}
