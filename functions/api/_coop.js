// COOPERATIVO — o estado do grupo (chaves, prazos, leitura/gravação) e a
// operação de SAIR, num módulo próprio.
//
// Por que saiu de `community.js` (QA rodada 2, `04-dados-r2` §1.3): a exclusão
// de conta (`account.js` › `handleDeleteConfirm`) precisa tirar o titular do
// grupo — `coop:<gid>.members`, `coopOf:<saveId>` e `coopCk:<gid>:<saveId>`
// ficavam 120 d depois de a conta sumir, e o membro apagado virava FANTASMA:
// `target = members.length × 5` continuava contando com ele, e o grupo nunca
// mais batia a meta, sem nenhum evento que explicasse. O corpo de `coopLeave`
// já existia na rota; importar `community.js` inteiro dentro da exclusão
// arrastaria o rate limit, o torneio e o diretório para dentro de `account.js`.
// Aqui mora só o que os dois precisam. `community.js` continua sendo a ÚNICA
// montagem de resposta (`vistaDoGrupo`) — nada daqui sai para o cliente.

import { VALID_ID } from './_entitlements.js';
import { kvOrThrow } from './_kv.js';

export const COOP_MAX_MEMBERS = 4;
/** Check-ins por membro por semana. 5 e não 7: exigir dia perfeito por pressão
 *  social desfaz o perdão de ausência da Fase 1 (`PLANO-EVOLUCAO.md` §1.2). */
export const COOP_CHECKINS_POR_MEMBRO = 5;
export const COOP_TTL = 86400 * 120;

/** Semana ISO (`YYYY-Www`) — a chave que faz o progresso rolar sozinho na
 *  virada, sem job agendado. Mesmo padrão da season. */
export function semanaDe(d = new Date()) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  // A quinta-feira da mesma semana define o ano ISO.
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7));
  const inicio = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  // `.getTime()` explícito: subtrair dois `Date` funciona em runtime (o JS
  // coage por `valueOf`), mas o typecheck do servidor recusa — eram os outros
  // 2 dos 5 erros que deixavam o CI vermelho. Mesma aritmética, zero mudança
  // de comportamento.
  const n = Math.ceil(((t.getTime() - inicio.getTime()) / 86400000 + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(n).padStart(2, '0')}`;
}

export const coopKey = gid => `coop:${gid}`;
export const coopOfKey = save => `coopOf:${save}`;
export const coopCodeKey = code => `coopCode:${code}`;
/**
 * Os check-ins de UM membro, numa chave só dele.
 *
 * ⚠️ ELES NÃO MORAM MAIS DENTRO DO BLOB DO GRUPO, e o motivo é uma corrida
 * real. O KV da Cloudflare não tem transação nem compare-and-set: `coopCheckin`
 * fazia ler-modificar-gravar sobre o objeto do grupo INTEIRO, então dois
 * membros marcando presença na mesma noite (o caso normal de um grupo de 4,
 * não um caso exótico) liam a mesma versão e a segunda gravação apagava a
 * primeira. O check-in sumia **em silêncio**: ninguém via erro, e o progresso
 * do grupo — que é a única coisa que o modo inteiro entrega — ficava menor que
 * a verdade.
 *
 * Com uma chave por membro, cada pessoa só escreve sobre si mesma e a corrida
 * deixa de existir: não há mais campo compartilhado no caminho quente. O blob
 * do grupo passa a mudar só em criar/entrar/sair, que são eventos raros.
 */
export const coopCkKey = (gid, save) => `coopCk:${gid}:${save}`;

export function novoCodigo() {
  // Sem 0/O/1/I: o código é lido em voz alta e digitado à mão.
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(x => alfabeto[x % alfabeto.length]).join('');
}

export async function lerGrupo(env, groupId) {
  if (!VALID_ID.test(groupId || '')) return null;
  const raw = await kvOrThrow(env).get(coopKey(groupId));
  return raw ? JSON.parse(raw) : null;
}

/**
 * Grava o grupo E RENOVA OS DOIS ÍNDICES que apontam para ele.
 *
 * ⚠️ Renovar os índices junto não é zelo, é correção. As três chaves nascem com
 * o mesmo `COOP_TTL`, mas só `coop:<gid>` era reescrita a cada movimento — e
 * `coopOf:<save>` e `coopCode:<code>` eram escritas UMA vez, na entrada. Um
 * grupo vivo e ativo, passados 120 dias, perdia os dois índices enquanto o
 * blob seguia lá: cada membro passava a ver "você não está em nenhum grupo"
 * (`grupoDe` não acha o ponteiro, e ainda apaga o que sobrou), e o código de
 * convite deixava de abrir o grupo. Nada disso dá erro — o modo simplesmente
 * evapora para todo mundo ao mesmo tempo, sem nenhum evento que explique.
 */
export async function gravarGrupo(env, g) {
  await kvOrThrow(env).put(coopKey(g.id), JSON.stringify(g), { expirationTtl: COOP_TTL });
  await Promise.all([
    kvOrThrow(env).put(coopCodeKey(g.code), g.id, { expirationTtl: COOP_TTL }),
    ...g.members.map(m => kvOrThrow(env).put(coopOfKey(m), g.id, { expirationTtl: COOP_TTL })),
  ]);
}

/**
 * Os check-ins de um membro na semana corrente. Chave própria (ver `coopCkKey`),
 * com a semana DENTRO do registro: assim a virada de semana é lida, e não
 * escrita — quem abrir primeiro na semana nova simplesmente enxerga uma lista
 * vazia, sem job agendado e sem gravação de limpeza.
 */
/**
 * Renova o prazo das três chaves do grupo, sem mudar nada.
 *
 * A RELEITURA IMEDIATAMENTE ANTES DA GRAVAÇÃO é o ponto: gravar de volta a
 * cópia que o handler leu no começo da requisição desfaria uma entrada que
 * tivesse acontecido no meio dela. Reler encolhe essa janela para o intervalo
 * entre o `get` e o `put` — não a fecha (o KV não tem compare-and-set), e é por
 * isso que `coopJoin` confere a própria entrada depois de gravar.
 *
 * As duas chaves de índice não correm risco nenhum: o valor delas é constante
 * (o id do grupo), então duas gravações concorrentes escrevem o mesmo byte.
 */
export async function renovarPrazos(env, gid) {
  const fresco = await lerGrupo(env, gid);
  if (fresco) await gravarGrupo(env, fresco);
}

export async function lerCheckins(env, gid, save) {
  const raw = await kvOrThrow(env).get(coopCkKey(gid, save));
  if (!raw) return [];
  try {
    const r = JSON.parse(raw);
    return r && r.weekKey === semanaDe() && Array.isArray(r.days) ? r.days : [];
  } catch { return []; }
}

export async function gravarCheckins(env, gid, save, days) {
  await kvOrThrow(env).put(
    coopCkKey(gid, save),
    JSON.stringify({ weekKey: semanaDe(), days }),
    { expirationTtl: COOP_TTL },
  );
}

/**
 * Zera o progresso quando a semana virou. Leitura preguiçosa, sem cron: quem
 * abrir primeiro na semana nova paga o custo, e ninguém precisa operar nada.
 */
export function rolarSemana(g) {
  const agora = semanaDe();
  // `g.checkins` é resíduo de grupo criado antes de os check-ins ganharem chave
  // própria. Ele é lido como fallback em `vistaDoGrupo` e some na virada da
  // semana, como sempre somiu — nenhum caminho novo volta a escrever nele.
  if (g.weekKey !== agora) { g.weekKey = agora; g.checkins = {}; }
  return g;
}

/** O grupo de quem pergunta, já rolado para a semana corrente. `null` se não há. */
export async function grupoDe(env, saveId) {
  const groupId = await kvOrThrow(env).get(coopOfKey(saveId));
  if (!groupId) return null;
  const g = await lerGrupo(env, groupId);
  // Índice apontando para grupo morto (ou do qual a pessoa já saiu) se limpa
  // aqui: é o mesmo custo de uma leitura e evita fantasma permanente no KV.
  if (!g || !g.members.includes(saveId)) { await kvOrThrow(env).delete(coopOfKey(saveId)); return null; }
  return rolarSemana(g);
}

/**
 * Tira `saveId` do grupo em que está — sem penalidade, sem confirmação de
 * ninguém. É o corpo de `POST action=coopLeave` e também o passo da EXCLUSÃO
 * de conta. Idempotente: sem grupo, não faz nada e responde `{ left: false }`.
 *
 * O progresso de quem saiu some junto — a meta encolhe com o grupo, então o
 * que ele fez não pode continuar contando (`PLANO-COOP.md` §3.4). Grupo vazio
 * some na hora (blob + código) — sem lápide, sem "seu grupo morreu".
 *
 * @returns {Promise<{ left: boolean, groupId: string | null, remaining: number }>}
 */
export async function coopLeave(env, saveId) {
  const g = await grupoDe(env, saveId);
  if (!g) return { left: false, groupId: null, remaining: 0 };
  g.members = g.members.filter(m => m !== saveId);
  if (g.checkins) delete g.checkins[saveId];
  await kvOrThrow(env).delete(coopOfKey(saveId));
  await kvOrThrow(env).delete(coopCkKey(g.id, saveId));
  if (g.members.length === 0) {
    await kvOrThrow(env).delete(coopKey(g.id));
    await kvOrThrow(env).delete(coopCodeKey(g.code));
  } else {
    await gravarGrupo(env, g);
  }
  return { left: true, groupId: g.id, remaining: g.members.length };
}
