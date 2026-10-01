/**
 * FALA DOS NPCs DE ÁREA (minimal-ui F4).
 *
 * Dono único da copy dos 6 anfitriões do Mapa — nenhum componente escreve a
 * fala deles à mão (regra do `narrativa.contract` e do redator de UX: texto
 * que o jogador lê não nasce solto dentro de JSX). Os nomes (Grom, Vultrak,
 * Zeph, Pipo, Lumi) são a decisão D5 do dono (23/09/2026,
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
    namePt: 'Zeph, a guia',
    nameEn: 'Zeph, the guide',
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
 * (`areaNpcVoice`). Tom: convite, nunca cobrança.
 * Desde 30/09/2026 as falas vêm do ROSTER da leva de bustos aprovada pelo dono
 * (`E:/Soulmon-assets/out/rodada3/npcs-flare/ROSTER.md`; fichas na
 * `docs/design/areas/00-BIBLIA-DAS-AREAS.md` §4). Exceção: a Feira e o Salão
 * seguem lendo `guildCopy.ts` (a copy revisada da Guilda — a do Salão é a
 * mesma do ROSTER).
 */
const LOT_NPC_VOICE: Record<string, AreaNpcVoice> = {
  'mercado:conquistas': {
    namePt: 'Medra, o guardião dos marcos', nameEn: 'Medra, keeper of milestones',
    linePt: 'Cada placa do meu casco lembra um trecho atravessado.',
    lineEn: 'Each plate on my shell remembers a stretch crossed.',
  },
  'arena:duelo': {
    namePt: 'Rhinoco, o campeão', nameEn: 'Rhinoco, the champion',
    linePt: 'Um duelo, uma rodada de cada vez. Pode vir.',
    lineEn: 'One duel, one round at a time. Come on.',
  },
  // Fala da Feira (`guild.npc.feira`) — a copy mora em `guildCopy.ts`; "grupo
  // pequeno" ficou falso com a roda de até 12. NPC da Feira: Fanfare (criatura-sanfona,
  // `00-BIBLIA-DAS-AREAS.md`); Marla fica só no Salão.
  'arena:feira': {
    namePt: 'Fanfare', nameEn: 'Fanfare',
    linePt: GUILD_COPY['guild.npc.feira'][0],
    lineEn: GUILD_COPY['guild.npc.feira'][1],
  },
  // Os prédios de Jogos (30/09/2026). Nomes e falas PLACEHOLDER de nomeação.
  // Tom: convite; o Ateliê DESCREVE o que os jogos pedem (nunca promete
  // efeito — benchmark §1.2) e o Refúgio não cobra nada de ninguém.
  // Nomes decididos pelo dono em 30/09/2026 (propostas da loremaster): o
  // ofício não promete efeito (Ateliê) nem insinua tratamento (Refúgio).
  'jogos:mente': {
    namePt: 'Tessela, a enigmista', nameEn: 'Tessela, the puzzler',
    linePt: 'Este quebra-cabeça espera. As peças não vão a lugar nenhum.',
    lineEn: "This puzzle waits. Its pieces aren't going anywhere.",
  },
  'jogos:refugio': {
    namePt: 'Bobbi, o soprador de bolhas', nameEn: 'Bobbi, the bubble-blower',
    linePt: 'Aqui não se conta nada. Só bolhas subindo.',
    lineEn: 'Nothing to count here. Just bubbles going up.',
  },
  // 🧭 O Passeio: Brume (nome novo aprovado pelo dono em 30/09/2026, espírito
  // do charco). Convite, nunca cobrança — e nenhuma palavra sobre o que as
  // Travessias "rendem".
  'exploracao:passeio': {
    namePt: 'Brume, o espírito do charco', nameEn: 'Brume, the marsh spirit',
    linePt: 'A névoa abre um pouco mais a cada passo. Ande devagar o quanto quiser.',
    lineEn: 'The mist opens a little further each step. Walk as slow as you like.',
  },
  'hall:amigos': {
    namePt: 'Nino, o carteiro', nameEn: 'Nino, the courier',
    linePt: 'Chegou um aceno. Guardei na bolsa pra você.',
    lineEn: 'A wave arrived. I kept it in my bag for you.',
  },
  'hall:guilda': {
    namePt: 'Marla, a intendente', nameEn: 'Marla, the steward',
    linePt: GUILD_COPY['guild.npc.hall'][0],
    lineEn: GUILD_COPY['guild.npc.hall'][1],
  },
  'laboratorio:pet': {
    // O nome antigo era de personagem de terceiro — a bíblia das áreas §1.3 A4 decidiu Bento.
    namePt: 'Bento, o cuidador', nameEn: 'Bento, the keeper',
    linePt: 'Olha como a pelagem pegou luz hoje.',
    lineEn: 'Look how its coat caught the light today.',
  },
  'laboratorio:stats': {
    namePt: 'Quill, a escriba', nameEn: 'Quill, the scribe',
    linePt: 'Cada dia fica anotado aqui. É só para olhar.',
    lineEn: "Every day is written here. It's just to look at.",
  },
};

/** A fala do NPC de UM lote (`área:lote`); sem entrada própria, a voz da área. */
export function lotNpcVoice(id: AreaId, lotId: string | null | undefined, language: Language): { name: string; line: string } {
  const v = lotId ? LOT_NPC_VOICE[`${id}:${lotId}`] : undefined;
  if (!v) return areaNpcVoice(id, language);
  const isPt = language === 'pt-BR';
  return { name: isPt ? v.namePt : v.nameEn, line: isPt ? v.linePt : v.lineEn };
}

/**
 * NPCs de FUNÇÃO (30/09/2026, leva `npcs-flare`): nome e fala dos bustos que
 * moram numa função do app, não num lote (`assets/soulmon/npcs` ›
 * `FUNCTION_NPC_ART`). ⚠️ SEM CHAMADA HOJE — nenhuma tela lê este mapa ainda;
 * onde cada um aparece é decisão de design (`docs/PERGUNTAS-DO-DONO.md`).
 * Falas do ROSTER, sem cobrança, sem emoji, sem número.
 */
export type FunctionNpcId = 'onboarding' | 'oraculo' | 'conta' | 'sono' | 'cuidados' | 'config';

const FUNCTION_NPC_VOICE: Record<FunctionNpcId, AreaNpcVoice> = {
  onboarding: {
    namePt: 'Ambra', nameEn: 'Ambra',
    linePt: 'Sem pressa. Tudo aqui já está arrumado pra você.',
    lineEn: 'Take your time. Everything here is already set up for you.',
  },
  oraculo: {
    namePt: 'Iris', nameEn: 'Iris',
    linePt: 'A luz se dobra com gentileza hoje. Olhe o quanto quiser.',
    lineEn: 'The light bends kindly today. Look as long as you like.',
  },
  conta: {
    namePt: 'Faro', nameEn: 'Faro',
    linePt: 'Seu progresso fica guardado aqui, quando você quiser.',
    lineEn: 'Your progress is kept safe here, whenever you want it.',
  },
  sono: {
    namePt: 'Sona', nameEn: 'Sona',
    linePt: 'Um sonho novo se abriu enquanto você descansava. Guardei pra você.',
    lineEn: 'A new dream opened while you rested. I kept it for you.',
  },
  cuidados: {
    namePt: 'Nuri', nameEn: 'Nuri',
    linePt: 'Água fresca, cantinho limpo, tigela cheia. Simples assim.',
    lineEn: 'Fresh water, a clean corner, a full bowl. Nice and easy.',
  },
  config: {
    namePt: 'Tobi', nameEn: 'Tobi',
    linePt: 'Mexa no que quiser. Cada ajuste volta ao lugar de antes.',
    lineEn: 'Turn anything you like. Every setting goes back where it was.',
  },
};

/** Nome e fala de um NPC de função, no idioma. */
export function functionNpcVoice(id: FunctionNpcId, language: Language): { name: string; line: string } {
  const v = FUNCTION_NPC_VOICE[id];
  const isPt = language === 'pt-BR';
  return { name: isPt ? v.namePt : v.nameEn, line: isPt ? v.linePt : v.lineEn };
}

/**
 * NPCs EXTRAS (01/10/2026, leva `npcs-femininas` aprovada pelo dono —
 * `E:/Soulmon-assets/out/rodada3/npcs-femininas/ROSTER.md`): 12 bustos de
 * ofício (`assets/soulmon/npcs` › `EXTRA_NPC_ART`). ⚠️ SEM CHAMADA HOJE —
 * nenhuma tela lê este mapa; onde cada uma aparece é decisão de design
 * (`docs/PERGUNTAS-DO-DONO.md`, NPC-1). Falas do ROSTER, sem cobrança, sem
 * emoji, sem número. Na Datura, o "darling/querido" do ROSTER saiu na
 * instalação (pedido do dono: neutro, sem flerte).
 * `ofício` é o papel sugerido pelo ROSTER, não uma fiação.
 */
export type ExtraNpcId =
  | 'forja' | 'treino' | 'cacadora' | 'guarda' | 'feras' | 'cura'
  | 'mercenaria' | 'navegadora' | 'barda' | 'venenos' | 'arqueira' | 'sacerdotisa';

export interface ExtraNpcVoice extends AreaNpcVoice {
  officePt: string;
  officeEn: string;
}

export const EXTRA_NPC_VOICE: Record<ExtraNpcId, ExtraNpcVoice> = {
  forja: {
    namePt: 'Scoria', nameEn: 'Scoria', officePt: 'Forjadora de equipamentos', officeEn: 'Gear smith',
    linePt: 'A bigorna está quente. Traga qualquer coisa que valha guardar.',
    lineEn: "The anvil's warm. Bring me anything worth keeping.",
  },
  treino: {
    namePt: 'Kama', nameEn: 'Kama', officePt: 'Mestra de combate do dojo', officeEn: 'Dojo combat mentor',
    linePt: 'Primeiro a postura. O golpe vem sozinho.',
    lineEn: 'Stance first. The strike will come on its own.',
  },
  cacadora: {
    namePt: 'Sable', nameEn: 'Sable', officePt: 'Caçadora de recompensas da Masmorra', officeEn: 'Dungeon bounty hunter',
    linePt: 'Algo escapou das profundezas. Eu sei onde ele dorme.',
    lineEn: 'Something slipped out of the deep. I know where it sleeps.',
  },
  guarda: {
    namePt: 'Bastia', nameEn: 'Bastia', officePt: 'Capitã da guarda', officeEn: 'Captain of the guard',
    linePt: 'O portão aguenta. Descanse tranquilo aqui dentro.',
    lineEn: "The gate holds. Rest easy while you're inside.",
  },
  feras: {
    namePt: 'Zahra', nameEn: 'Zahra', officePt: 'Guardiã das feras da Arena', officeEn: 'Arena beastkeeper',
    linePt: 'Toda fera aqui escolheu ficar. Venha conhecer.',
    lineEn: 'Every beast here chose to stay. Come meet them.',
  },
  cura: {
    namePt: 'Salvia', nameEn: 'Salvia', officePt: 'Curandeira', officeEn: 'Healer',
    linePt: 'Sente um pouco. A nascente faz o resto.',
    lineEn: 'Sit a moment. The spring does the rest.',
  },
  mercenaria: {
    namePt: 'Gila', nameEn: 'Gila', officePt: 'Mercenária de expedição', officeEn: 'Expedition mercenary',
    linePt: 'Qualquer estrada, qualquer fundura. Minha lâmina já está pronta.',
    lineEn: "Any road, any depth. My blade's already packed.",
  },
  navegadora: {
    namePt: 'Vela', nameEn: 'Vela', officePt: 'Navegadora estelar do Passeio', officeEn: 'Star navigator of the Stroll',
    linePt: 'As estrelas mudaram esta noite. Desenhei um caminho novo pra você.',
    lineEn: 'The stars shifted tonight. I drew you a new path.',
  },
  barda: {
    namePt: 'Trill', nameEn: 'Trill', officePt: 'Barda da Feira', officeEn: 'Fair bard',
    linePt: 'Mais uma canção antes das lanternas apagarem.',
    lineEn: 'One more song before the lanterns dim.',
  },
  venenos: {
    namePt: 'Datura', nameEn: 'Datura', officePt: 'Alquimista de venenos', officeEn: 'Poison alchemist',
    linePt: 'Veneno ou cura. Tudo depende da dose.',
    lineEn: 'Poison or cure. It all comes down to the dose.',
  },
  arqueira: {
    namePt: 'Rime', nameEn: 'Rime', officePt: 'Arqueira', officeEn: 'Archer',
    linePt: 'Daqui vejo o vale inteiro. Nada passa.',
    lineEn: 'I see the whole valley from here. Nothing gets past.',
  },
  sacerdotisa: {
    namePt: 'Oriel', nameEn: 'Oriel', officePt: 'Sacerdotisa do Oráculo', officeEn: 'Priestess of the Oracle',
    linePt: 'A maré trouxe um presságio. Só olhe se quiser.',
    lineEn: 'The tide brought an omen. Only look if you want to.',
  },
};

/** Nome e fala de um NPC extra, no idioma. */
export function extraNpcVoice(id: ExtraNpcId, language: Language): { name: string; line: string } {
  const v = EXTRA_NPC_VOICE[id];
  const isPt = language === 'pt-BR';
  return { name: isPt ? v.namePt : v.nameEn, line: isPt ? v.linePt : v.lineEn };
}
