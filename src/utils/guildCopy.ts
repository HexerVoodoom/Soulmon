/**
 * COPY DA GUILDA — dono único (`docs/NARRATIVA-COPY-GUILDA.md`, 29/09/2026).
 *
 * Nenhum componente escreve texto de guilda solto no JSX: tudo o que o jogador
 * lê nasce aqui, com a chave do documento (`guild.*`) e o par [PT-BR, EN]. A
 * régua `src/components/guild/guildSemCobranca.contract.test.ts` varre esta
 * tabela contra o vocabulário vetado (LV-G1..G10) — inclusive "nenhum dígito
 * literal" (números vêm das constantes em `guildRules.ts`) e "nenhum `{n}` na
 * família do agregado".
 *
 * As linhas SILÊNCIO do documento NÃO têm chave: "não desenhar nada" é a
 * ausência do elemento, e uma chave com string vazia convidaria alguém a
 * renderizá-la.
 *
 * (Fatia B1: as chaves do Bosque por estágio, dos gestos, da cerimônia de marco e do
 * Mural vieram TODAS do documento — nenhuma é inventada.)
 *
 * ⚠️ Quatro chaves NÃO estão nas 149 do documento e estão marcadas `PENDENTE`:
 * o botão de tentar de novo, o "Alguém" de quem ainda não tem apelido, o
 * "· você" (o texto já existia no CoopPanel) e o gesto recebido SEM tipo (roda
 * de 2, B5 do backend). O `soulmon-narrative-critic`
 * ainda não as viu — ver `docs/reviews/guilda/qa/impl-notas-front.md`.
 */
import type { Language } from './i18n';
import { GUILD_MAX_MEMBERS, type GroveStageId, type GuildGesture, type TideSize } from './guildRules';
import type { GuildErrorKind } from './community';

export const GUILD_COPY = {
  // ── Mapa: NPC e lotes (§1) ─────────────────────────────────────────────
  'guild.npc.hall': ['Algumas criaturas cuidam de um bosque juntas. Ele só cresce.', 'Some creatures keep a grove together. It only grows.'],
  'guild.npc.feira': ['Toda semana algo chega da névoa. A roda chega até ele.', 'Every week something comes in from the mist. The circle reaches it.'],
  'guild.lote.hall.label': ['Salão da Guilda', 'Guild Hall'],
  'guild.lote.hall.aria': ['Entrar no Salão da Guilda', 'Enter the Guild Hall'],
  'guild.lote.feira.label': ['Feira', 'Fair'],
  'guild.lote.feira.aria': ['Entrar na Feira', 'Enter the Fair'],
  // ── Salão sem guilda, criar, código, entrar (§2) ───────────────────────
  'guild.salao.carregando': ['Procurando sua roda…', 'Looking for your circle…'],
  'guild.salao.vazio.corpo': ['Ainda sem roda. Abra uma clareira ou entre com um código.', 'No circle yet. Open a clearing, or join with a code.'],
  'guild.criar.botao': ['Criar uma roda', 'Create a circle'],
  'guild.criar.nome.label': ['Nome da roda', 'Circle name'],
  'guild.criar.nome.placeholder': ['Um nome para a roda', 'A name for the circle'],
  'guild.criar.codigo.corpo': ['Compartilhe este código com até {n} pessoas.', 'Share this code with up to {n} people.'],
  'guild.criar.compartilhar': ['Compartilhar código', 'Share code'],
  'guild.codigo.copiar': ['Copiar código', 'Copy code'],
  'guild.codigo.copiado': ['Copiado', 'Copied'],
  'guild.codigo.label': ['Código da roda', 'Circle code'],
  'guild.entrar.botao.abrir': ['Entrar com um código', 'Join with a code'],
  'guild.entrar.codigo.label': ['Código', 'Code'],
  'guild.entrar.botao': ['Chegar à roda', 'Join the circle'],
  'guild.erro.nome': ['O nome não pode ter contato nem link.', "Names can't carry contacts or links."],
  'guild.erro.codigo': ['Esse código não abriu nenhuma clareira.', "That code didn't open any clearing."],
  'guild.erro.cheia': ['Esta roda está cheia.', 'This circle is full.'],
  'guild.erro.jaEmOutra': ['Esta conta já tem uma roda.', 'This account already has a circle.'],
  'guild.erro.colisao': ['Tente de novo.', 'Try once more.'],
  'guild.erro.semRede': ['Sem conexão. Nada mudou.', 'No connection. Nothing changed.'],
  'guild.erro.semLogin': ['Entre na sua conta para chegar a uma roda.', 'Sign in to reach a circle.'],
  'guild.erro.muitosToques': ['Muitos toques seguidos. Tente daqui a pouco.', 'Too many taps in a row. Try again shortly.'],
  'guild.erro.generico': ['Não deu certo agora. Tente de novo.', "That didn't work. Try again."],
  // PENDENTE (fora das 149): o botão da tela de carga que falhou.
  'guild.erro.tentar': ['Tentar de novo', 'Try again'],
  // ── Bosque: só o que a fatia A desenha (§3) ────────────────────────────
  'guild.bosque.titulo': ['Bosque', 'Grove'],
  'guild.bosque.fio.hoje': ['O seu fio firmou hoje.', 'Your strand settled today.'],
  'guild.bosque.fio.botao': ['Firmar meu fio', 'Settle my strand'],
  'guild.bosque.fio.toast': ['Um fio firmou no bosque.', 'A strand settled in the grove.'],
  // Chave ÚNICA do agregado: sem número, sem variante por quantidade (`{n}` proibido).
  'guild.bosque.agregado.um': ['Hoje o bosque recebeu fios.', 'The grove took in strands today.'],
  'guild.bosque.regra': [
    'Um fio firma quando alguém da roda alcança a própria meta do dia. O bosque só cresce.',
    'A strand settles when someone in the circle reaches their own goal for the day. The grove only grows.',
  ],
  'guild.bosque.estagio.clareira.nome': ['Clareira', 'Clearing'],
  'guild.bosque.estagio.clareira.linha': ['Chão aberto. Os primeiros fios firmaram.', 'Open ground. The first strands have settled.'],
  'guild.bosque.estagio.ramagem.nome': ['Ramagem', 'Boughs'],
  'guild.bosque.estagio.ramagem.linha': ['A videira achou onde se apoiar.', 'The vine found something to hold.'],
  'guild.bosque.estagio.copa.nome': ['Copa', 'Canopy'],
  'guild.bosque.estagio.copa.linha': ['A videira fechou por cima.', 'The vine closed overhead.'],
  'guild.bosque.estagio.mata.nome': ['Mata', 'Thicket'],
  'guild.bosque.estagio.mata.linha': ['Camadas sobre camadas.', 'Layer over layer.'],
  'guild.bosque.estagio.bosqueAntigo.nome': ['Bosque antigo', 'Old grove'],
  'guild.bosque.estagio.bosqueAntigo.linha': ['O cobre tomou o chão. A luz chega filtrada.', 'Copper took the ground. Light comes through filtered.'],
  // Faixa BINÁRIA (perto/silêncio): nunca barra de razão exata, nunca tempo estimado (parecer do guarda, 29/09).
  'guild.bosque.perto': ['Perto de {estagio}.', 'Near {estagio}.'],
  // ── Roda (§4) ──────────────────────────────────────────────────────────
  'guild.roda.titulo': ['Roda', 'Circle'],
  'guild.roda.contagem': ['{n} na roda', '{n} in the circle'],
  'guild.roda.presente': ['no bosque hoje', 'in the grove today'],
  // Gestos: três fixos, anônimos, para a roda inteira. Sem texto livre, sem push.
  'guild.gesto.titulo': ['Gestos', 'Gestures'],
  'guild.gesto.aceno.nome': ['Aceno', 'Wave'],
  'guild.gesto.luz.nome': ['Luz', 'Light'],
  'guild.gesto.descanso.nome': ['Descanso', 'Rest'],
  'guild.gesto.aceno.enviado': ['Aceno enviado.', 'Wave sent.'],
  'guild.gesto.luz.enviado': ['Luz enviada.', 'Light sent.'],
  'guild.gesto.descanso.enviado': ['Descanso enviado.', 'Rest sent.'],
  'guild.gesto.aceno.recebido': ['Alguém acenou para a roda.', 'Someone waved at the circle.'],
  'guild.gesto.luz.recebido': ['Alguém deixou uma luz.', 'Someone left a little light.'],
  'guild.gesto.descanso.recebido': ['Alguém desejou bom descanso.', 'Someone wished everyone a good rest.'],
  // PENDENTE (fora das 149): numa roda de 2 o servidor NÃO manda o TIPO do gesto recebido (B5 —
  // dizer "luz" contaria o gesto exato de uma pessoa conhecida), só que chegou algum. O
  // `soulmon-narrative-critic` ainda não viu esta frase.
  'guild.gesto.recebido.agregado': ['Alguém fez um gesto para a roda.', 'Someone made a gesture for the circle.'],
  // PENDENTE (fora das 149; já existiam no CoopPanel).
  'guild.roda.voce': ['· você', '· you'],
  'guild.roda.alguem': ['Alguém', 'Someone'],
  // ── Cerimônia e aviso de marco (§5) ────────────────────────────────────
  'guild.marco.ramagem.mundo': ['O bosque ganhou ramagem.', 'The grove grew boughs.'],
  'guild.marco.ramagem.pet': ['Olha, achou onde se apoiar.', 'Look, it found something to hold.'],
  'guild.marco.copa.mundo': ['O bosque fechou copa.', 'The grove has closed its canopy.'],
  'guild.marco.copa.pet': ['Tá mais alto que eu agora.', "It's taller than me now."],
  'guild.marco.mata.mundo': ['O bosque virou mata.', 'The grove has become a thicket.'],
  'guild.marco.mata.pet': ['Tem sombra aqui dentro.', "There's shade in here."],
  'guild.marco.bosqueAntigo.mundo': ['O bosque é antigo agora.', 'The grove is old now.'],
  'guild.marco.bosqueAntigo.pet': ['Tem cheiro de cobre.', 'It smells of copper.'],
  'guild.marco.botao': ['Continuar', 'Continue'],
  'guild.marco.aviso': ['Novo estágio do bosque: {estagio}.', 'New stage for the grove: {estagio}.'],
  'guild.marco.cenario': ['Cenário do bosque: {estagio}. Está entre os seus cenários.', 'Grove scenery: {estagio}. It is among your scenery.'],
  // ── Mural (§7) ─────────────────────────────────────────────────────────
  'guild.mural.titulo': ['Mural', 'Wall'],
  'guild.mural.marco': ['{estagio}, {data}', '{estagio}, {data}'],
  'guild.mural.mare': ['Floração colhida, {data}', 'Bloom gathered, {data}'],
  'guild.mural.mare.tamanho.petala': ['Pétala', 'Petal'],
  'guild.mural.mare.tamanho.corola': ['Corola', 'Corolla'],
  'guild.mural.mare.tamanho.floracao': ['Floração cheia', 'Full bloom'],
  // ── Ajustes e saída (§8) ───────────────────────────────────────────────
  'guild.ajustes.aria': ['Ajustes da roda', 'Circle settings'],
  'guild.ajustes.titulo': ['Ajustes', 'Settings'],
  'guild.ajustes.somenteAbriu': ['Só quem abriu a clareira vê estes ajustes.', 'Only whoever opened the clearing sees these settings.'],
  'guild.ajustes.renomear': ['Renomear', 'Rename'],
  'guild.ajustes.renomear.salvar': ['Salvar', 'Save'],
  'guild.ajustes.codigoNovo': ['Gerar código novo', 'Generate a new code'],
  'guild.ajustes.codigoNovo.nota': ['O código antigo deixa de abrir.', 'The old code stops opening.'],
  'guild.sair.botao': ['Seguir o próprio caminho', 'Go your own way'],
  'guild.sair.nota': ['O que firmou fica no bosque.', 'What settled stays in the grove.'],
  // ── Guilda esvaziada (§9) ──────────────────────────────────────────────
  'guild.esvaziada.mundo': ['Esta clareira voltou a ser Malha aberta.', 'This clearing is open Mesh again.'],
  // ── aria (§10) ─────────────────────────────────────────────────────────
  'guild.aria.salao': ['Salão da Guilda', 'Guild Hall'],
  'guild.aria.roda': ['Roda', 'Circle'],
  'guild.aria.codigo.copiar': ['Copiar o código da roda', 'Copy the circle code'],
  'guild.aria.fio': ['Firmar meu fio de hoje', 'Settle my strand for today'],
  'guild.aria.bosque': ['Bosque da roda, estágio {estagio}', "The circle’s grove, stage {estagio}"],
  'guild.aria.gesto.enviar': ['Enviar {gesto} para a roda', 'Send {gesto} to the circle'],
  'guild.aria.gesto.enviado': ['{gesto} já enviado hoje', '{gesto} already sent today'],
  'guild.aria.mural': ['Mural da roda', "The circle’s wall"],
} as const satisfies Record<string, readonly [string, string]>;

export type GuildKey = keyof typeof GUILD_COPY;

/** `{n}` e cia. vêm sempre de constantes ou da vista — nunca de texto à mão. */
export function guildText(language: Language, key: GuildKey, vars?: Record<string, string | number>): string {
  const [pt, en] = GUILD_COPY[key];
  const raw = language === 'pt-BR' ? pt : en;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

/** "Compartilhe este código com até {n} pessoas" — n = teto − 1 (quem criou já está). */
export const guildInviteRoom = () => GUILD_MAX_MEMBERS - 1;

/**
 * Cada tipo de erro tem a SUA chave — nada de frase genérica quando o servidor
 * disse o que houve. `noGuild` conta o fato (a clareira voltou a ser Malha
 * aberta) em vez de dizer que algo falhou; `notHost`/`invalidDay`/`server`/
 * `deleted` não têm frase do documento além da genérica.
 */
export const GUILD_ERROR_KEY = {
  login: 'guild.erro.semLogin',
  invalidCode: 'guild.erro.codigo',
  noGuild: 'guild.esvaziada.mundo',
  alreadyIn: 'guild.erro.jaEmOutra',
  full: 'guild.erro.cheia',
  collision: 'guild.erro.colisao',
  invalidName: 'guild.erro.nome',
  invalidDay: 'guild.erro.generico',
  // Três que a TELA nunca mostra como alerta (a folha recarrega em silêncio): a
  // meta de coração não bateu (silêncio, nunca frase), o gesto do dia já saiu
  // (o botão passa a "enviado") e um `kind` que o cliente nunca manda.
  goalNotMet: 'guild.erro.generico',
  invalidKind: 'guild.erro.generico',
  dailyLimit: 'guild.erro.generico',
  notHost: 'guild.erro.generico',
  rateLimit: 'guild.erro.muitosToques',
  deleted: 'guild.erro.generico',
  unavailable: 'guild.erro.semRede',
  server: 'guild.erro.generico',
} as const satisfies Record<GuildErrorKind, GuildKey>;

// ── Nomes por id (estágio, gesto, tamanho de maré) ─────────────────────────
// Os ids do servidor são `bosque-antigo`, `aceno`… e as chaves do documento são
// camelCase; estes mapas são a ÚNICA ponte, e o tipo impede uma chave inventada.

const STAGE_KEY = { clareira: 'clareira', ramagem: 'ramagem', copa: 'copa', mata: 'mata', 'bosque-antigo': 'bosqueAntigo' } as const satisfies Record<GroveStageId, string>;

export const groveStageName = (language: Language, stage: GroveStageId): string =>
  guildText(language, `guild.bosque.estagio.${STAGE_KEY[stage]}.nome`);

export const groveStageLine = (language: Language, stage: GroveStageId): string =>
  guildText(language, `guild.bosque.estagio.${STAGE_KEY[stage]}.linha`);

/** Cerimônia: só a Ramagem em diante tem marco (a Clareira é o chão de partida). */
export type GroveMarcoStage = Exclude<GroveStageId, 'clareira'>;
export const groveMarcoText = (language: Language, stage: GroveMarcoStage, quem: 'mundo' | 'pet'): string =>
  guildText(language, `guild.marco.${STAGE_KEY[stage]}.${quem}`);

export const guildGestureName = (language: Language, gesture: GuildGesture): string =>
  guildText(language, `guild.gesto.${gesture}.nome`);
export const guildGestureSent = (language: Language, gesture: GuildGesture): string =>
  guildText(language, `guild.gesto.${gesture}.enviado`);
export const guildGestureReceived = (language: Language, gesture: GuildGesture): string =>
  guildText(language, `guild.gesto.${gesture}.recebido`);

export const tideSizeName = (language: Language, size: TideSize): string =>
  guildText(language, `guild.mural.mare.tamanho.${size}`);
