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
 * ⚠️ Três chaves NÃO estão nas 149 do documento e estão marcadas `PENDENTE`:
 * o botão de tentar de novo, o "Alguém" de quem ainda não tem apelido e o
 * "· você" (o texto já existia no CoopPanel). O `soulmon-narrative-critic`
 * ainda não as viu — ver `docs/reviews/guilda/qa/impl-notas-front.md`.
 */
import type { Language } from './i18n';
import { GUILD_MAX_MEMBERS } from './guildRules';
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
  // ── Roda (§4) ──────────────────────────────────────────────────────────
  'guild.roda.titulo': ['Roda', 'Circle'],
  'guild.roda.contagem': ['{n} na roda', '{n} in the circle'],
  'guild.roda.presente': ['no bosque hoje', 'in the grove today'],
  // PENDENTE (fora das 149; já existiam no CoopPanel).
  'guild.roda.voce': ['· você', '· you'],
  'guild.roda.alguem': ['Alguém', 'Someone'],
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
  notHost: 'guild.erro.generico',
  rateLimit: 'guild.erro.muitosToques',
  deleted: 'guild.erro.generico',
  unavailable: 'guild.erro.semRede',
  server: 'guild.erro.generico',
} as const satisfies Record<GuildErrorKind, GuildKey>;
