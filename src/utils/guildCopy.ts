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
 * ✅ As dez chaves que nasceram FORA das 149 (`guild.concha.*`, `guild.cenarios.titulo`,
 * `guild.help.concha.*`, `guild.gesto.recebido.agregado`, `guild.roda.voce/alguem`,
 * `guild.erro.tentar`) foram revisadas pelo `soulmon-narrative-critic` em 29/09/2026
 * (`docs/reviews/guilda/qa/L3-copy-critica.md`), estão FINAL e entraram no documento.
 * Chave nova nasce no documento primeiro; a régua reprova a que estiver só aqui.
 */
import type { Language } from './i18n';
import { GUILD_MAX_MEMBERS, type GroveStageId, type GuildGesture, type TideSize } from './guildRules';
import type { GuildErrorKind } from './community';
import { GUILD_COPY_CORE, STAGE_KEY, groveStageName, groveMarcoText, type GroveMarcoStage } from './guildCopyCore';

// A cerimônia e o App importam do núcleo (chunk de ENTRADA); a folha, daqui. Reexportado por compat.
export { groveStageName, groveMarcoText, type GroveMarcoStage };

export const GUILD_COPY = {
  // ── O MÍNIMO da entrada (cerimônia, aviso da Home, nome da Concha): vive em `guildCopyCore.ts` ──
  ...GUILD_COPY_CORE,
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
  // FINAL (L5, 29/09): dica para o leitor de tela quando o botão Criar está inerte (QA L1 #7).
  'guild.criar.nome.dica': ['Dê um nome à roda.', 'Give the circle a name.'],
  'guild.criar.codigo.corpo': ['Compartilhe este código com até {n} pessoas.', 'Share this code with up to {n} people.'],
  'guild.criar.compartilhar': ['Compartilhar código', 'Share code'],
  'guild.codigo.copiar': ['Copiar código', 'Copy code'],
  'guild.codigo.copiado': ['Copiado', 'Copied'],
  'guild.codigo.label': ['Código da roda', 'Circle code'],
  'guild.entrar.botao.abrir': ['Entrar com um código', 'Join with a code'],
  'guild.entrar.codigo.label': ['Código', 'Code'],
  // FINAL (L5, 29/09): por que o botão Entrar está inerte com menos caracteres; `{n}` vem de `GUILD_CODE_LENGTH`.
  'guild.entrar.codigo.dica': ['O código tem {n} caracteres.', 'The code has {n} characters.'],
  'guild.entrar.botao': ['Chegar à roda', 'Join the circle'],
  'guild.erro.nome': ['O nome não pode ter contato nem link.', "Names can't carry contacts or links."],
  'guild.erro.codigo': ['Esse código não abriu nenhuma clareira.', "That code didn't open any clearing."],
  'guild.erro.cheia': ['Esta roda está cheia.', 'This circle is full.'],
  'guild.erro.jaEmOutra': ['Esta conta já tem uma roda.', 'This account already has a circle.'],
  'guild.erro.colisao': ['Tente de novo.', 'Try once more.'],
  'guild.erro.semRede': ['Sem conexão. Nada mudou.', 'No connection. Nothing changed.'],
  'guild.erro.semLogin': ['Entre na sua conta para chegar a uma roda.', 'Sign in to reach a circle.'],
  // Demo sem conta (do documento, §2): acompanha o `UnlockNudge`, que nunca abre sozinho.
  'guild.erro.demo': ['Crie uma conta para ter uma roda.', 'Create an account to have a circle.'],
  'guild.erro.muitosToques': ['Muitos toques seguidos. Tente daqui a pouco.', 'Too many taps in a row. Try again shortly.'],
  'guild.erro.generico': ['Não deu certo agora. Tente de novo.', "That didn't work. Try again."],
  // FINAL (L3, 29/09): o botão da tela de carga que falhou.
  'guild.erro.tentar': ['Tentar de novo', 'Try again'],
  // FINAL (L5, 29/09): o caminho do 401 até a tela de entrar (Configurações).
  'guild.erro.entrar': ['Entrar na conta', 'Sign in'],
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
  'guild.bosque.estagio.clareira.linha': ['Chão aberto. Os primeiros fios firmaram.', 'Open ground. The first strands have settled.'],
  'guild.bosque.estagio.ramagem.linha': ['A videira achou onde se apoiar.', 'The vine found something to hold.'],
  'guild.bosque.estagio.copa.linha': ['A videira fechou por cima.', 'The vine closed overhead.'],
  'guild.bosque.estagio.mata.linha': ['Camadas sobre camadas.', 'Layer over layer.'],
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
  // FINAL (L3, 29/09): numa roda de 2 o servidor NÃO manda o TIPO do gesto recebido (B5), só que
  // chegou algum. "Deixou" (não "fez") segue o verbo de `.luz.recebido` e evita a leitura de "gesto" ofensivo.
  'guild.gesto.recebido.agregado': ['Alguém deixou um gesto para a roda.', 'Someone left a gesture for the circle.'],
  // FINAL (L3, 29/09; já existiam no CoopPanel).
  'guild.roda.voce': ['· você', '· you'],
  'guild.roda.alguem': ['Alguém', 'Someone'],
  // ── Cerimônia e aviso de marco (§5) ────────────────────────────────────
  // ── Mural (§7) ─────────────────────────────────────────────────────────
  'guild.mural.titulo': ['Mural', 'Wall'],
  'guild.mural.marco': ['{estagio}, {data}', '{estagio}, {data}'],
  'guild.mural.mare': ['Floração colhida, {data}', 'Bloom gathered, {data}'],
  'guild.mural.mare.tamanho.petala': ['Pétala', 'Petal'],
  'guild.mural.mare.tamanho.corola': ['Corola', 'Corolla'],
  'guild.mural.mare.tamanho.floracao': ['Floração cheia', 'Full bloom'],
  // ── Feira (§6) ─────────────────────────────────────────────────────────
  'guild.feira.titulo': ['Feira', 'Fair'],
  // FINAL (L5, 29/09): a Feira sem roda explica o que é antes do formulário (QA L3 B9).
  'guild.feira.semroda': ['A Feira é da roda: toda semana algo chega da névoa, e a roda o recebe.', 'The Fair belongs to the circle: every week something comes in from the mist, and the circle receives it.'],
  'guild.feira.aberta.mundo': ['A maré abriu a Feira. Algo chegou da névoa.', 'The tide opened the Fair. Something came in from the mist.'],
  'guild.feira.fenomeno.nevoa.nome': ['Névoa', 'Mist'],
  'guild.feira.fenomeno.nevoa.linha': ['Uma camada que não assentou.', "A layer that hasn't settled."],
  'guild.feira.fenomeno.mare.nome': ['Maré alta', 'High tide'],
  'guild.feira.fenomeno.mare.linha': ['A maré subiu além do lugar dela.', 'The tide rose past its place.'],
  'guild.feira.fenomeno.estatica.nome': ['Estática', 'Static'],
  'guild.feira.fenomeno.estatica.linha': ['A Malha chiou fora de fase.', 'The Mesh hissed out of phase.'],
  'guild.feira.fenomeno.enxame.nome': ['Enxame', 'Swarm'],
  'guild.feira.fenomeno.enxame.linha': ['Camadas soltas, todas juntas.', 'Loose layers, all together.'],
  // `{cheio}`/`{piso}` vêm de `RAID_EMBLEMS`/`RAID_EMBLEMS_FLOOR` — nunca literal.
  'guild.feira.sobria': ['Uma rodada por dia. Semana dissipada: {cheio} de Honra. Se o fenômeno voltar à névoa: {piso}.', 'One round a day. Cleared week: {cheio} Honor. If the phenomenon goes back to the mist: {piso}.'],
  'guild.feira.rodada.botao': ['Fazer minha rodada', 'Take my round'],
  'guild.feira.rodada.feita': ['A sua rodada chegou até ele.', 'Your round reached it.'],
  'guild.feira.dissipado.mundo': ['O fenômeno se desfez diante da roda.', 'The phenomenon came apart before the circle.'],
  'guild.feira.recuou.mundo': ['O fenômeno voltou para a névoa. O bosque segue como estava.', 'The phenomenon went back into the mist. The grove stays as it was.'],
  'guild.feira.colher.botao': ['Colher', 'Collect'],
  'guild.feira.colhido': ['{n} de Honra colhida.', '{n} Honor collected.'],
  // FINAL (L3, 29/09): a peça da maré. `nome`/`desc` espelham `GUILD_ITEMS` (shop.ts).
  'guild.concha.chegou': ['A maré deixou uma Concha da Maré. Já está em Decoração.', 'The tide left a Tide shell. It is now under Decor.'],
  'guild.help.concha.termo': ['Concha da Maré', 'Tide shell'],
  'guild.help.concha.def': ['Cada {n} Feiras dissipadas rendem uma Concha da Maré, peça de decoração de quem colhe. Ela marca o que a roda fez junta, nunca uma pessoa.', 'Every {n} cleared Fairs bring a Tide shell, a decor piece for whoever collects. It marks what the circle did together, never one person.'],
  // Título da prateleira de posse (cenários do bosque + Concha): "do bosque", não "da sua roda" — a
  // posse fica com quem segue o próprio caminho (G12), e "sua roda" seria falso para essa pessoa.
  'guild.cenarios.titulo': ['Do bosque', 'From the grove'],
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
  'guild.aria.feira': ['Fenômeno da semana: {nome}', 'This week’s phenomenon: {nome}'],
  // FINAL (L5, 29/09): o estado do fenômeno no nome acessível do visor, sem HP nem "ferido" (QA L3 M2).
  'guild.aria.feira.ferido': ['Fenômeno da semana: {nome}, com luz passando entre as camadas.', 'This week’s phenomenon: {nome}, with light showing between its layers.'],
  'guild.aria.feira.dissipado': ['Fenômeno da semana: {nome}, desfeito.', 'This week’s phenomenon: {nome}, come apart.'],
  'guild.aria.rodada': ['Fazer minha rodada de hoje', 'Take my round for today'],
  // ── HelpModal e GuideModal (§11) ───────────────────────────────────────
  'guild.help.guilda.termo': ['Guilda e roda', 'Guild and circle'],
  'guild.help.guilda.def': ['A Guilda é o lugar; a roda é quem está nela. Até {max} pessoas, uma roda por pessoa, entrada só por código. Sem chat e sem aviso no celular.', 'The Guild is the place; the circle is who is in it. Up to {max} people, one circle each, joining by code only. No chat and no phone notifications.'],
  'guild.help.bosque.termo': ['Bosque', 'Grove'],
  'guild.help.bosque.def': ['O bosque da roda tem estes estágios: Clareira, Ramagem, Copa, Mata e Bosque antigo. Só cresce, nunca encolhe.', 'The circle’s grove has these stages: Clearing, Boughs, Canopy, Thicket and Old grove. It only grows and never shrinks.'],
  'guild.help.fio.termo': ['Fio', 'Strand'],
  'guild.help.fio.def': ['Um fio firma quando alguém da roda alcança a própria meta do dia. É um por pessoa por dia, sem nome e sem peso.', 'A strand settles when someone in the circle reaches their own goal for the day. One per person per day, unnamed and unweighted.'],
  'guild.help.feira.termo': ['Feira', 'Fair'],
  'guild.help.feira.def': ['Toda semana chega um fenômeno da névoa. Cada pessoa faz uma rodada por dia. Semana dissipada rende {cheio} de Honra; se ele voltar à névoa, {piso}. A Feira não mexe no bosque.', 'Every week a phenomenon comes in from the mist. Each person takes one round a day. A cleared week pays {cheio} Honor; if it goes back to the mist, {piso}. The Fair never touches the grove.'],
  'guild.help.mare.termo': ['Maré', 'Tide'],
  'guild.help.mare.def': ['Uma maré dura {semanas} semanas. Na virada, o que assentou fica no bosque.', 'A tide lasts {semanas} weeks. When it turns, what settled stays in the grove.'],
  'guild.guide.titulo': ['A Guilda', 'The Guild'],
  'guild.guide.corpo': ['Uma roda cuida de um bosque junta. Ninguém vê quanto o outro fez. Seguir o próprio caminho é um toque e o que firmou fica. Nada aqui é vendido.', 'A circle keeps a grove together. Nobody sees how much anyone else did. Going your own way takes one tap and what settled stays. Nothing here is for sale.'],
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
  // A Feira: nenhum dos três é frase de tela (a folha relê ou fica em silêncio).
  raidClosed: 'guild.erro.generico',
  alreadyClaimed: 'guild.erro.generico',
  nothingToClaim: 'guild.erro.generico',
  unavailable: 'guild.erro.semRede',
  server: 'guild.erro.generico',
} as const satisfies Record<GuildErrorKind, GuildKey>;

// ── Nomes por id (estágio, gesto, tamanho de maré) ─────────────────────────
// Os ids do servidor são `bosque-antigo`, `aceno`… e as chaves do documento são
// camelCase; estes mapas são a ÚNICA ponte, e o tipo impede uma chave inventada.

export const groveStageLine = (language: Language, stage: GroveStageId): string =>
  guildText(language, `guild.bosque.estagio.${STAGE_KEY[stage]}.linha`);

export const guildGestureName = (language: Language, gesture: GuildGesture): string =>
  guildText(language, `guild.gesto.${gesture}.nome`);
export const guildGestureSent = (language: Language, gesture: GuildGesture): string =>
  guildText(language, `guild.gesto.${gesture}.enviado`);
export const guildGestureReceived = (language: Language, gesture: GuildGesture): string =>
  guildText(language, `guild.gesto.${gesture}.recebido`);

export const tideSizeName = (language: Language, size: TideSize): string =>
  guildText(language, `guild.mural.mare.tamanho.${size}`);
