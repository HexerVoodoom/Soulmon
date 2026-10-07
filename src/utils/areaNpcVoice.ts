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
    // H5 (01/10/2026): "Escolha uma lojinha" era dito DENTRO da lojinha, e "se tiver
    // os Bits" condicionava a acolhida ao saldo. Agora só constata e convida (L1, L12).
    linePt: 'Pode entrar e olhar com calma. As prateleiras ficam aqui.',
    lineEn: 'Come in and look around. The shelves stay right here.',
  },
  arena: {
    namePt: 'Vultrak, mestre da arena',
    nameEn: 'Vultrak, master of the arena',
    // H5 (01/10/2026): o imperativo ("Escolha:") e o julgamento de quem chega
    // ("de braços cruzados") saíram. As arenas são chão antigo, mantido por costume (bíblia §7.1).
    linePt: 'Chão antigo, mantido por costume. Sempre tem alguém por aqui para encontrar.',
    lineEn: 'Old ground, kept by habit. There is always someone here to meet.',
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
    // H5 (01/10/2026): "começa numa mistura certa" dava à alquimia uma regra que o
    // jogo não tem — a forma muda pelos dias completos e pelo toque da pessoa (L10).
    linePt: 'Toda forma que ele já teve cresce nesta árvore. Venha ver para onde os galhos vão.',
    lineEn: 'Every form it has taken grows on this tree. Come see where the branches go.',
  },
  hall: {
    namePt: 'Lumi, a anfitriã',
    nameEn: 'Lumi, the host',
    // H5 (01/10/2026): os amigos moram no Círculo de Amigos desde 29/09, e a
    // Biblioteca agora guarda só quem já cruzou o caminho (H17) — a fala diz isso.
    linePt: 'Todo Soulmon que já cruzou o seu caminho tem uma página aqui.',
    lineEn: 'Every Soulmon that has crossed your path has a page here.',
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
export const LOT_NPC_VOICE: Record<string, AreaNpcVoice> = {
  // H11 (02/10/2026): Todo lote tem entrada PRÓPRIA aqui — exatamente um NPC por lote, sem
  // depender de queda para a voz da área. Os seis lotes abaixo são os que antes caíam no
  // anfitrião da área (mesmo NPC de antes, só que agora explícito e travado por contrato em
  // `areaLotNpc.contract.test.ts`). Nada aqui sorteia, rodízio ou depende de estado/hora.
  'mercado:background': {
    namePt: 'Panora, a sonhadora', nameEn: 'Panora, the dreamer',
    // Bíblia das áreas §4.2 (Panora, lula de terra de manto-tela): antes o busto dela
    // aparecia com o nome e a fala do Grom (voz da área).
    linePt: 'Esse horizonte tem cheiro de chuva. Quer ver de perto?',
    lineEn: 'This horizon smells like rain. Want a closer look?',
  },
  'arena:torneio': AREA_NPC_VOICE.arena,
  'exploracao:masmorra': AREA_NPC_VOICE.exploracao,
  'jogos:salao': AREA_NPC_VOICE.jogos,
  'laboratorio:evolucao': AREA_NPC_VOICE.laboratorio,
  'hall:biblioteca': AREA_NPC_VOICE.hall,
  // 01/10/2026 (pedido do dono): as bancas de Itens e de Decoração mostravam
  // "Grom", mas os bustos são outras criaturas. Nomes próprios (loremaster):
  // a criatura-cogumelo das miudezas é Lamela (as lâminas sob o chapéu do
  // cogumelo); a panda-vermelha marceneira é Lasca (a lasca de madeira).
  // Falas: descrevem o ofício e o objeto, sem cobrança, sem preço, sem pressa.
  'mercado:itens': {
    namePt: 'Lamela, a mascate', nameEn: 'Lamela, the peddler',
    linePt: 'Tudo o que cabe nos meus bolsos tem serventia. Fique à vontade para olhar.',
    lineEn: 'Everything that fits in my pockets has a use. Feel free to look.',
  },
  'mercado:decoracao': {
    namePt: 'Lasca, a marceneira', nameEn: 'Lasca, the carpenter',
    linePt: 'Cada peça daqui foi lixada à mão. Escolha um canto para ela, se quiser.',
    lineEn: 'Every piece here was sanded by hand. Pick a corner for it, if you like.',
  },
  'mercado:conquistas': {
    namePt: 'Medra, o guardião dos marcos', nameEn: 'Medra, keeper of milestones',
    linePt: 'Cada placa do meu casco lembra um trecho atravessado.',
    lineEn: 'Each plate on my shell remembers a stretch crossed.',
  },
  // ⚒️ 07/10/2026: o Ferreiro do Mercado — Mallo (o busto/nome do banco `EXTRA_NPC_VOICE.ferreiro`). Fala descreve o ofício, sem
  // preço, sem pressa e sem prometer efeito (L1..L12 da bíblia): o equipamento é do companheiro, a forja só dá forma.
  'mercado:ferreiro': {
    namePt: 'Mallo, o ferreiro', nameEn: 'Mallo, the blacksmith',
    linePt: 'Cada peça sai da forja do tamanho de quem vai usar. Fique à vontade para olhar.',
    lineEn: 'Every piece leaves the forge sized for whoever will wear it. Feel free to look.',
  },
  'arena:duelo': {
    namePt: 'Tuska, o campeão', nameEn: 'Tuska, the champion',
    linePt: 'Um duelo, uma rodada de cada vez. Pode vir.',
    lineEn: 'One duel, one round at a time. Come on.',
  },
  // Fala da Feira (`guild.npc.feira`) — a copy mora em `guildCopy.ts`; "grupo
  // pequeno" ficou falso com a roda de até 12. NPC da Feira: Fanfare (criatura-sanfona,
  // `00-BIBLIA-DAS-AREAS.md`); Bastia fica só no Salão.
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
  // 🛠️ 04/10/2026 (pedido do dono): os dois prédios da clareira de baixo. Falas sem cobrança, sem
  // número e sem prometer efeito (a Oficina descreve; o Caderno guarda e cala).
  'exploracao:oficina': {
    namePt: 'Tique, a relojoeira', nameEn: 'Tique, the clockmaker',
    linePt: 'O tempo anda no seu passo. Aqui só ajudo a medir.',
    lineEn: 'Time keeps your pace. All I do here is help you measure it.',
  },
  'exploracao:caderno': {
    namePt: 'Sépia, a copista', nameEn: 'Sépia, the scribe',
    linePt: 'O que se escreve aqui fica na gaveta. Só você abre.',
    lineEn: 'What is written here stays in the drawer. Only you open it.',
  },
  'hall:amigos': {
    namePt: 'Nino, o carteiro', nameEn: 'Nino, the courier',
    // H5 (01/10/2026): afirmava que um aceno TINHA chegado, com ou sem aceno (L10).
    linePt: 'Quando chega um aceno, eu guardo na bolsa pra você.',
    lineEn: 'When a wave arrives, I keep it in my bag for you.',
  },
  'hall:guilda': {
    // G3 (02/10/2026): a Marla-árvore não agradou ao dono; o Salão passa a ser
    // da Bastia (busto `npc-f-guarda`, mesma de `EXTRA_NPC_VOICE.guarda`) — a
    // guardiã serena do portão, que dá a ideia de lugar seguro e sem pressa.
    namePt: 'Bastia, a guardiã do Salão', nameEn: 'Bastia, keeper of the Hall',
    linePt: GUILD_COPY['guild.npc.hall'][0],
    lineEn: GUILD_COPY['guild.npc.hall'][1],
  },
  'laboratorio:pet': {
    // O nome antigo era de personagem de terceiro — a bíblia das áreas §1.3 A4 decidiu Bento.
    namePt: 'Bento, o cuidador', nameEn: 'Bento, the keeper',
    // H5 (01/10/2026): "pelagem" não vale para toda criatura (padrão, cobre — bíblia §5.1).
    linePt: 'Olha como a luz assenta nele hoje.',
    lineEn: 'Look how the light settles on it today.',
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
 * ofício (+3 do banco em 01/10/2026: `lua`, `ferreiro`, `ferreira`) (`assets/soulmon/npcs` › `EXTRA_NPC_ART`). ⚠️ SEM CHAMADA HOJE —
 * nenhuma tela lê este mapa; onde cada uma aparece é decisão de design
 * (`docs/PERGUNTAS-DO-DONO.md`, NPC-1). Falas do ROSTER, sem cobrança, sem
 * emoji, sem número. Na Datura, o "darling/querido" do ROSTER saiu na
 * instalação (pedido do dono: neutro, sem flerte).
 * `ofício` é o papel sugerido pelo ROSTER, não uma fiação.
 */
export type ExtraNpcId =
  | 'forja' | 'treino' | 'cacadora' | 'guarda' | 'feras' | 'cura'
  | 'mercenaria' | 'navegadora' | 'barda' | 'venenos' | 'arqueira' | 'sacerdotisa'
  | 'lua' | 'ferreiro' | 'ferreira';

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
  // 01/10/2026 (instalação final da rodada 3): três do banco, finalizados como as outras. Nomes
  // originais curtos (sem "-mon"); falas sem cobrança, sem flerte, sem número.
  lua: {
    namePt: 'Selene', nameEn: 'Selene', officePt: 'Deusa da lua, das sombras e do pântano', officeEn: 'Goddess of the moon, shadows and the swamp',
    linePt: 'A lua guarda tudo o que a noite esconde. Sente aqui, se quiser ouvir.',
    lineEn: 'The moon keeps whatever the night hides. Sit with me, if you would like to listen.',
  },
  ferreiro: {
    namePt: 'Mallo', nameEn: 'Mallo', officePt: 'Ferreiro e forjador de martelos', officeEn: 'Blacksmith and hammer forger',
    linePt: 'O martelo já aqueceu a minha mão. Traga o que precisa de forma.',
    lineEn: "The hammer's already warmed my hand. Bring me whatever needs shaping.",
  },
  ferreira: {
    namePt: 'Kova', nameEn: 'Kova', officePt: 'Ferreira', officeEn: 'Blacksmith',
    linePt: 'Cada peça tem o seu tempo. Eu espero junto com você.',
    lineEn: "Every piece takes its own time. I'll wait it out with you.",
  },
};

/** Nome e fala de um NPC extra, no idioma. */
export function extraNpcVoice(id: ExtraNpcId, language: Language): { name: string; line: string } {
  const v = EXTRA_NPC_VOICE[id];
  const isPt = language === 'pt-BR';
  return { name: isPt ? v.namePt : v.nameEn, line: isPt ? v.linePt : v.lineEn };
}
