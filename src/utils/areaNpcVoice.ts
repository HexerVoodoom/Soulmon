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
import { GUILD_COPY } from './guildCopy';

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
    // A Corrida mudou para o Salão de Jogos (30/09/2026); aqui ficou a Masmorra.
    linePt: 'A névoa esconde caminhos. A Masmorra está logo ali, quando quiser descer.',
    lineEn: 'The mist hides paths. The Dungeon is right there, whenever you want to go down.',
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

/**
 * FALA POR LOTE (29/09/2026) — cada sub-loja/sala tem o seu NPC, então a fala
 * também é dele. A chave é `área:lote`; lote sem entrada cai na voz da área
 * (`areaNpcVoice`). Nomes e falas novos são PLACEHOLDER de nomeação: o dono
 * pode trocá-los aqui, num lugar só. Tom: convite, nunca cobrança.
 */
const LOT_NPC_VOICE: Record<string, AreaNpcVoice> = {
  'arena:duelo': {
    namePt: 'Rinoco, o campeão', nameEn: 'Rhinoco, the champion',
    linePt: 'Um duelo, uma rodada de cada vez. Pode vir — eu aguento o tranco!',
    lineEn: 'One duel, one round at a time. Bring it on — I can take a hit!',
  },
  // Fala da Feira (`guild.npc.feira`) — a copy mora em `guildCopy.ts`; "grupo
  // pequeno" ficou falso com a roda de até 12. NPC da Feira: Fanfa (criatura-sanfona,
  // `00-BIBLIA-DAS-AREAS.md`); Marla fica só no Salão.
  'arena:feira': {
    namePt: 'Fanfa', nameEn: 'Fanfa',
    linePt: GUILD_COPY['guild.npc.feira'][0],
    lineEn: GUILD_COPY['guild.npc.feira'][1],
  },
  // Os prédios de Jogos (30/09/2026). Nomes e falas PLACEHOLDER de nomeação.
  // Tom: convite; o Ateliê DESCREVE o que os jogos pedem (nunca promete
  // efeito — benchmark §1.2) e o Refúgio não cobra nada de ninguém.
  'jogos:mente': {
    namePt: 'Sábia, a coruja', nameEn: 'Sábia, the owl',
    linePt: 'Aqui cada jogo pede uma coisa: lembrar, esperar, mudar de ideia, deduzir. Escolha um.',
    lineEn: 'Here each game asks for one thing: remember, wait, change your mind, deduce. Pick one.',
  },
  'jogos:refugio': {
    namePt: 'Musgo, o guardião', nameEn: 'Musgo, the keeper',
    linePt: 'Aqui tudo vai devagar. Respire comigo um pouco, ou só estoure umas bolhas.',
    lineEn: 'Things go slowly here. Breathe with me a little, or just pop some bubbles.',
  },
  'hall:amigos': {
    namePt: 'Nino, o carteiro', nameEn: 'Nino, the courier',
    linePt: 'Quem você quer visitar hoje? Seus amigos estão logo ali.',
    lineEn: 'Who do you want to visit today? Your friends are right over there.',
  },
  'hall:guilda': {
    namePt: 'Marla, a intendente', nameEn: 'Marla, the steward',
    linePt: GUILD_COPY['guild.npc.hall'][0],
    lineEn: GUILD_COPY['guild.npc.hall'][1],
  },
  'laboratorio:pet': {
    namePt: 'Tico, o cuidador', nameEn: 'Tico, the keeper',
    linePt: 'Aqui está a ficha completa do seu Soulmon: quem ele é e o que ele sabe fazer.',
    lineEn: 'Here is your Soulmon’s full sheet: who it is and what it can do.',
  },
  'laboratorio:stats': {
    namePt: 'Quill, a escriba', nameEn: 'Quill, the scribe',
    linePt: 'Cada dia fica anotado aqui. É só para você olhar — sem julgamento.',
    lineEn: 'Every day is written down here. It is just for you to look at — no judgment.',
  },
};

/** A fala do NPC de UM lote (`área:lote`); sem entrada própria, a voz da área. */
export function lotNpcVoice(id: AreaId, lotId: string | null | undefined, language: Language): { name: string; line: string } {
  const v = lotId ? LOT_NPC_VOICE[`${id}:${lotId}`] : undefined;
  if (!v) return areaNpcVoice(id, language);
  const isPt = language === 'pt-BR';
  return { name: isPt ? v.namePt : v.nameEn, line: isPt ? v.linePt : v.lineEn };
}
