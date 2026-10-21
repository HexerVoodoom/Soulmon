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
  'laboratorio:biblioteca': AREA_NPC_VOICE.hall, // D-50 (19/10/2026): a Biblioteca foi do Hall para o Laboratório — a anfitriã Lumi vai com ela
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
  // ⚒️ 07/10/2026: o Soulsmith do Mercado — Vitra, o espírito-do-forno vidraceiro (o Mallo do banco `EXTRA_NPC_VOICE.ferreiro` segue como NPC extra). Fala descreve o ofício, sem
  // preço, sem pressa e sem prometer efeito (L1..L12 da bíblia): o equipamento é do companheiro, a forja só dá forma.
  'mercado:ferreiro': {
    namePt: 'Vitra, a Soulsmith', nameEn: 'Vitra, the Soulsmith',
    linePt: 'A peça chega crua e melhora com o material que você traz. Escolha o lado que quiser reforçar, sem pressa.',
    lineEn: 'A piece arrives rough and gets better with the materials you bring. Choose the side to strengthen, no rush.',
  },
  // 🏗️ Restaurante em obra (14/10/2026, dono): caranguejo pedreiro de tijolo. Só fala; sem ação, sem preço, sem cobrança.
  'mercado:restaurante': {
    namePt: 'Brickle, o pedreiro', nameEn: 'Brickle, the bricklayer',
    linePt: 'Estamos em obra! Em breve o restaurante abre as portas e eu vou poder cozinhar comidas especiais por aqui. Volte logo!',
    lineEn: "We're under construction! Soon the restaurant will open its doors and I'll be able to cook special meals here. Come back soon!",
  },
  'arena:duelo': {
    namePt: 'Naia, a pescadora', nameEn: 'Naia, the net-fisher', // 07/10/2026: busto trocado a pedido do dono (era Tuska, o rinoceronte)
    linePt: 'Um duelo, uma rodada de cada vez. Pode vir.',
    lineEn: 'One duel, one round at a time. Come on.',
  },
  'arena:guerra': {
    // 18/10/2026 (dono): o NPC é a própria criatura, quimera de duas cabeças do brejo (Pântano + Sombra), autoral; nome em inglês.
    namePt: 'Mirevesper, a quimera do brejo', nameEn: 'Mirevesper, the mire chimera',
    linePt: 'Duas cabeças, uma só vigília. A roda dos clãs se abre quando o seu esquadrão chega junto.',
    lineEn: "Two heads, one watch. The clans' round opens when your squad arrives together.",
  },
  // Fala da Feira (`guild.npc.feira`) — a copy mora em `guildCopy.ts`; "grupo
  // pequeno" ficou falso com a roda de até 12. NPC da Feira: Fanfare (criatura-sanfona,
  // `00-BIBLIA-DAS-AREAS.md`); Bastia fica só no Salão.
  'hall:feira': {
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
    namePt: 'Marim, o mensageiro da maré', nameEn: 'Marim, the tide courier', // 07/10/2026: busto trocado a pedido do dono (era Bobbi, o soprador de bolhas)
    linePt: 'Aqui nada precisa ser entregue. Só a maré indo e vindo.',
    lineEn: 'Nothing needs delivering here. Just the tide coming and going.',
  },
  // 🧭 O Passeio: Mirk (nome novo aprovado pelo dono em 30/09/2026 (era Brume; renomeada para Mirk em 21/10/2026), espírito
  // do charco). Convite, nunca cobrança — e nenhuma palavra sobre o que as
  // Travessias "rendem".
  'exploracao:passeio': {
    namePt: 'Mirk, o espírito do charco', nameEn: 'Mirk, the marsh spirit',
    linePt: 'A névoa abre um pouco mais a cada passo. Ande devagar o quanto quiser.',
    lineEn: 'The mist opens a little further each step. Walk as slow as you like.',
  },
  // 🛠️ 04/10/2026 (pedido do dono): os dois prédios da clareira de baixo. Falas sem cobrança, sem
  // número e sem prometer efeito (a Oficina descreve; o Caderno guarda e cala).
  'exploracao:oficina': {
    namePt: 'Sépia, a copista', nameEn: 'Sépia, the scribe', // 19/10/2026 (D-32): o dono escolheu o busto nº 9 (o escriba-polvo, antes Sépia no Caderno) no lugar da Lume
    linePt: 'Foco é copiar uma linha de cada vez.',
    lineEn: 'Focus is copying one line at a time.',
  },
  'exploracao:caderno': {
    namePt: 'Opala, a arquivista das páginas', nameEn: 'Opala, keeper of the pages', // 07/10/2026: busto trocado a pedido do dono (era Sépia, a copista)
    linePt: 'O que se escreve aqui fica guardado. Só você abre.',
    lineEn: 'What is written here stays kept. Only you open it.',
  },
  'laboratorio:amigos': {
    namePt: 'Zumi, o filhote de mel', nameEn: 'Zumi, the honey cub', // 07/10/2026: busto trocado a pedido do dono (era Ramo, o carvalho; antes Trill, a barda)
    linePt: 'Cada um traz um pouco de doçura para o Círculo.',
    lineEn: 'Everyone brings a little sweetness to the Circle.',
  },
  // D-50 (19/10/2026): o Grove (o bosque do clã) é prédio do Hall. O dono escolheu o busto nº 57 (Lilia, a musa do jardim) como NPC dele.
  'hall:grove': {
    namePt: 'Lilia, a musa do jardim', nameEn: 'Lilia, the garden muse',
    linePt: 'O bosque cresce devagar. Venha ver.',
    lineEn: 'The grove grows slowly. Come see.',
  },
  'hall:guilda': {
    // G3 (02/10/2026): a Marla-árvore não agradou ao dono; o Salão passa a ser
    // da Bastia (busto `npc-f-guarda`, mesma de `EXTRA_NPC_VOICE.guarda`) — a
    // guardiã serena do portão, que dá a ideia de lugar seguro e sem pressa.
    namePt: 'Aurea, a sacerdotisa do Salão', nameEn: 'Aurea, priestess of the Hall', // 07/10/2026: busto trocado a pedido do dono (era Bastia; ela segue em EXTRA_NPC_VOICE.guarda)
    linePt: GUILD_COPY['guild.npc.hall'][0],
    lineEn: GUILD_COPY['guild.npc.hall'][1],
  },
  'laboratorio:pet': {
    // O nome antigo era de personagem de terceiro — a bíblia das áreas §1.3 A4 decidiu Bento.
    namePt: 'Tinta, a escriba do Arquivo', nameEn: 'Tinta, scribe of the Archive', // 07/10/2026: busto trocado a pedido do dono (era Faro; Faro segue como NPC de função `conta`)
    // H5 (01/10/2026): "pelagem" não vale para toda criatura (padrão, cobre — bíblia §5.1).
    linePt: 'Tudo o que você guardou está em ordem. Pode olhar com calma.',
    lineEn: 'Everything you kept is in order. Look at your own pace.',
  },
  'laboratorio:stats': {
    namePt: 'Sumi, o guardião do Vínculo', nameEn: 'Sumi, keeper of the Bond', // 07/10/2026: busto trocado a pedido do dono (era Oriel; ela segue em EXTRA_NPC_VOICE.sacerdotisa)
    linePt: 'Cada dia fica anotado aqui. É só para olhar.',
    lineEn: "Every day is written here. It's just to look at.",
  },
  'laboratorio:perfil': {
    // 14/10/2026 (dono): o Perfil é do Corvo, o mascote (`mascot-raven.png`) — não da Iris (Oráculo) nem da Oriel.
    namePt: 'Soulmon Misterioso', nameEn: 'Mysterious Soulmon',
    linePt: 'Aqui se vê quem ele é, do jeito que ele é.',
    lineEn: 'Here you see who they are, just as they are.',
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
 * `FUNCTION_NPC_ART`). ⚠️ `onboarding` (Ambra) é lido pelo `SoulmonOnboarding` desde 14/10/2026; `conta`/`sono`/`cuidados`/`config` entram via `ui/FunctionNpcNote` desde 14/10/2026; `oraculo` (Iris) segue sem chamada;
 * onde cada um aparece é decisão de design (`docs/PERGUNTAS-DO-DONO.md`).
 * Falas do ROSTER, sem cobrança, sem emoji, sem número.
 */
export type FunctionNpcId = 'onboarding' | 'oraculo' | 'cuidados';

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
  cuidados: {
    namePt: 'Nuri', nameEn: 'Nuri',
    linePt: 'Água fresca, cantinho limpo, tigela cheia. Simples assim.',
    lineEn: 'Fresh water, a clean corner, a full bowl. Nice and easy.',
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

/**
 * NPCs NOVOS (15/10/2026, leva `E:/novos npcs`; arte em `assets/soulmon/npcs` ›
 * `NOVO_NPC_ART`, arquivos `npc-n-<id>.png`). ⚠️ SEM CHAMADA HOJE, como os extras.
 * Cada um tem CATEGORIA (`NovoNpcCategory`) para a decisão de onde entra:
 * `oficio` (quem trabalha com as mãos), `mistico` (tempo, lua, musa),
 * `natureza` (colheita, brotos), `sombrio` (ossos, neblina, sangue — tom
 * melancólico, nunca ameaça ao jogador) e `criatura` (bichos falantes).
 * Falas curtas, sem cobrança, sem emoji, sem número (régua: `bossRoster.test.ts`).
 * Os pares `*Fera`/`*Forma` e `luaTrono*` são a MESMA personagem em duas formas/poses.
 */
export type NovoNpcCategory = 'oficio' | 'mistico' | 'natureza' | 'sombrio' | 'criatura';

export type NovoNpcId =
  | 'alquimistaLimo' | 'enfermeira' | 'colheita' | 'tempo' | 'musa'
  | 'ossarioFera' | 'ossarioForma' | 'serpentePlumadaFera' | 'serpentePlumadaForma'
  | 'broto' | 'corvo' | 'cozinheiro' | 'besouro'
  | 'luaTronoSentada' | 'luaTronoDePe';

export interface NovoNpcVoice extends ExtraNpcVoice {
  category: NovoNpcCategory;
}

export const NOVO_NPC_VOICE: Record<NovoNpcId, NovoNpcVoice> = {
  alquimistaLimo: {
    category: 'oficio', namePt: 'Lodi', nameEn: 'Lodi', officePt: 'Alquimista de limo', officeEn: 'Slime alchemist',
    linePt: 'Tudo que escorre guarda uma receita. Chegue mais perto.',
    lineEn: 'Everything that drips holds a recipe. Come a little closer.',
  },
  enfermeira: {
    category: 'sombrio', namePt: 'Rubra', nameEn: 'Rubra', officePt: 'Enfermeira da Sombra', officeEn: 'Shade nurse',
    linePt: 'Sente-se. Eu cuido do que dói, com calma.',
    lineEn: 'Sit down. I tend whatever aches, nice and slow.',
  },
  colheita: {
    category: 'natureza', namePt: 'Espiga', nameEn: 'Tassel', officePt: 'Guardiã da colheita', officeEn: 'Harvest keeper',
    linePt: 'O que se planta com paciência volta em dobro. Sem pressa.',
    lineEn: 'What you plant with patience comes back doubled. Take all the time you need.',
  },
  tempo: {
    category: 'mistico', namePt: 'Clepsi', nameEn: 'Clepsy', officePt: 'Guardião das horas', officeEn: 'Keeper of the hours',
    linePt: 'O tempo é um rio. Hoje ele corre do seu lado.',
    lineEn: 'Time is a river. Today it runs beside you.',
  },
  musa: {
    category: 'mistico', namePt: 'Lilia', nameEn: 'Lilia', officePt: 'Musa do jardim', officeEn: 'Garden muse',
    linePt: 'Até a pedra floresce quando alguém ouve a música.',
    lineEn: 'Even stone blooms when someone listens to the music.',
  },
  ossarioFera: {
    category: 'sombrio', namePt: 'Ossel', nameEn: 'Ossel', officePt: 'Guardião do ossuário (forma de dragão)', officeEn: 'Ossuary warden (dragon form)',
    linePt: 'Tudo que cai vira raiz. Eu só guardo o caminho.',
    lineEn: 'Everything that falls becomes root. I only keep the path.',
  },
  ossarioForma: {
    category: 'sombrio', namePt: 'Ossel', nameEn: 'Ossel', officePt: 'Guardião do ossuário (forma humana)', officeEn: 'Ossuary warden (human form)',
    linePt: 'Na forma de gente eu converso melhor. Pode perguntar.',
    lineEn: 'I speak better in my human shape. Go ahead and ask.',
  },
  serpentePlumadaFera: {
    category: 'mistico', namePt: 'Tzali', nameEn: 'Tzali', officePt: 'Serpente emplumada (forma de dragão)', officeEn: 'Feathered serpent (dragon form)',
    linePt: 'O vento me conhece pelo nome. Quer ouvir o seu?',
    lineEn: 'The wind knows me by name. Want to hear yours?',
  },
  serpentePlumadaForma: {
    category: 'mistico', namePt: 'Tzali', nameEn: 'Tzali', officePt: 'Serpente emplumada (forma humana)', officeEn: 'Feathered serpent (human form)',
    linePt: 'Pouso devagar quando há alguém para receber.',
    lineEn: 'I land softly when someone is there to greet me.',
  },
  broto: {
    category: 'natureza', namePt: 'Faísca', nameEn: 'Spark', officePt: 'Espírito dos elementos', officeEn: 'Elemental sprite',
    linePt: 'Eu cresço com fogo, raio e chuva. Hoje deu os três!',
    lineEn: 'I grow on fire, lightning and rain. Today brought all three!',
  },
  corvo: {
    category: 'sombrio', namePt: 'Corvino', nameEn: 'Corvin', officePt: 'Médico da neblina', officeEn: 'Fog doctor',
    linePt: 'A neblina some quando a lanterna fica acesa. Eu levo a minha.',
    lineEn: 'The fog lifts when the lantern stays lit. I carry mine.',
  },
  cozinheiro: {
    category: 'criatura', namePt: 'Caldo', nameEn: 'Broth', officePt: 'Cozinheiro do caldeirão', officeEn: 'Cauldron cook',
    linePt: 'A sopa está no ponto. Pegue uma tigela, tem para todo mundo.',
    lineEn: 'The soup is just right. Grab a bowl, there is plenty for all.',
  },
  besouro: {
    category: 'criatura', namePt: 'Brio', nameEn: 'Sheen', officePt: 'Sentinela besouro', officeEn: 'Beetle sentinel',
    linePt: 'Minha casca brilha mais depois da chuva. Fico de guarda, sem pressa.',
    lineEn: 'My shell shines brighter after rain. I keep watch, no rush.',
  },
  luaTronoSentada: {
    category: 'mistico', namePt: 'Selene', nameEn: 'Selene', officePt: 'Deusa da lua no trono (sentada)', officeEn: 'Moon goddess on her throne (seated)',
    linePt: 'No meu trono a noite fica quieta. Sente aos meus pés, se quiser.',
    lineEn: 'On my throne the night grows quiet. Sit at my feet, if you like.',
  },
  luaTronoDePe: {
    category: 'mistico', namePt: 'Selene', nameEn: 'Selene', officePt: 'Deusa da lua no trono (de pé)', officeEn: 'Moon goddess on her throne (standing)',
    linePt: 'Levanto o cajado e a lua responde. Venha ver.',
    lineEn: 'I raise the staff and the moon answers. Come and see.',
  },
};

/** Nome, fala e categoria de um NPC novo, no idioma. */
export function novoNpcVoice(id: NovoNpcId, language: Language): { name: string; line: string; category: NovoNpcCategory } {
  const v = NOVO_NPC_VOICE[id];
  const isPt = language === 'pt-BR';
  return { name: isPt ? v.namePt : v.nameEn, line: isPt ? v.linePt : v.lineEn, category: v.category };
}
