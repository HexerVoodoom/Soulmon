// PERFIL PÚBLICO — o que `community.js` e `guild.js` precisam em comum.
//
// Extraído de `community.js` no WPG-1 (`PLANO-GUILDA.md` §14): a rota nova da
// Guilda lê perfis e pids, e importar `community.js` inteiro arrastaria o
// torneio, o diretório e o rate limit de lá. As funções são as MESMAS, movidas
// sem mudança de comportamento — cópia aqui seria o footgun 9.

import { kvOrThrow } from './_kv.js';

// Nível numérico de uma forma pelo prefixo do id (rookie=1 … ultra=5)
export function stagePower(stage) {
  if (!stage) return 1;
  const p = String(stage).split('-')[0];
  return { rookie: 1, champion: 2, ultimate: 3, mega: 4, ultra: 5 }[p] ?? 1;
}

export const PID_PREFIX = 'pid:';

/**
 * DERIVAÇÃO ANTIGA do pid — mantida SÓ para reconhecer e aposentar os pids
 * velhos. **Não use para gerar identidade nova.**
 *
 * Ela era `SHA-256("soulmon-pub:" + saveId)`, sem segredo nenhum. O caminho
 * pid → saveId é de mão única, e por isso ela parecia suficiente. Mas o
 * caminho que importa para o atacante é o INVERSO e ele estava aberto:
 * `saveId` é `SHA-256("soulmon:" + e-mail)`, algoritmo igualmente público, e
 * as duas derivações se encadeiam. De um e-mail qualquer saía, offline,
 * o pid da conta daquela pessoa — e daí "esse e-mail tem conta?" era só
 * perguntar (`action=player`) ou procurar na listagem pública do diretório.
 * Ver `community.playerOracle.test.js` (N-3 / item B3 da auditoria).
 */
export async function legacyPidFor(saveId) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`soulmon-pub:${saveId}`));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}

/** Formato de pid/saveId aceito na resolução (o MESMO `VALID_ID` de `community.js`). */
const PID_VALIDO = /^[a-zA-Z0-9_-]{8,64}$/;

/**
 * pid → saveId. `null` quando o alvo não existe (ou ainda não se registrou).
 *
 * Recusa explicitamente um pid que seja a derivação antiga do saveId ao qual
 * ele aponta: enquanto esses índices existirem no KV, a cadeia
 * e-mail → saveId → pid continuaria resolvendo e o oráculo continuaria vivo.
 * A recusa é imediata e não depende da migração ter passado por aquele perfil.
 *
 * O hash é calculado nos DOIS ramos (com um saveId de mentira do mesmo
 * tamanho quando não há acerto) e não há escrita em ramo nenhum: um KV `get`,
 * um SHA-256, sempre. Sem isso, "pid inexistente" e "pid legado de conta
 * existente" gastariam trabalhos diferentes e o oráculo voltaria pelo relógio.
 */
// (Movida de `community.js` em 13/11/2026, sem mudança de comportamento: o convite do clã em `guild.js` resolve o alvo por ela.)
const PID_PLACEHOLDER = '0'.repeat(32);
export async function saveIdForPublicId(env, pid) {
  if (!PID_VALIDO.test(pid || '')) return null;
  const saveId = await kvOrThrow(env).get(`${PID_PREFIX}${pid}`);
  const legado = await legacyPidFor(saveId || PID_PLACEHOLDER);
  if (!saveId || pid === legado) return null;
  return saveId;
}

/**
 * Identidade pública nova: 24 hex ALEATÓRIOS, sem relação com o saveId.
 *
 * Aleatório, e não "hash com segredo", de propósito: um pepper obriga a
 * gerenciar (e um dia rotacionar) um segredo do qual TODA identidade social já
 * publicada depende. O pid já é armazenado no perfil e indexado em `pid:` —
 * derivá-lo nunca foi necessário, só era conveniente.
 */
export function newPid() {
  const b = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Devolve o pid do perfil, cunhando um novo quando não há — ou quando o que
 * está lá é o pid DERIVADO antigo, que é justamente o que precisa morrer.
 *
 * Escreve no KV durante uma leitura, o que é incomum e é intencional: é uma
 * migração preguiçosa, sem passo de operação e sem janela em que uma conta
 * antiga continue endereçável pelo pid adivinhável. A escrita acontece no
 * máximo uma vez por perfil. O índice velho é apagado aqui, no caminho de
 * escrita — nunca no de leitura do atacante, para não devolver a ele um sinal
 * de tempo ("apagou algo, logo a conta existia").
 */
export async function ensurePid(env, p) {
  if (p.pid && p.pid !== await legacyPidFor(p.id)) return p.pid;
  const antigo = p.pid;
  p.pid = newPid();
  await putProfile(env, p.id, p);
  await indexPublicId(env, p.id, p.pid);
  if (antigo) await kvOrThrow(env).delete(`${PID_PREFIX}${antigo}`);
  return p.pid;
}

/**
 * O pid de um perfil SEM escrever nada: o pid atual se não for o derivado
 * antigo, senão `null`. É o caminho para perfis de TERCEIROS numa leitura
 * (L1-codigo ALTO-3) — a migração do pid legado acontece no `profile` POST do
 * próprio dono, ou quando ELE abre a guilda.
 */
export async function pidSoLeitura(p) {
  if (!p?.pid || p.pid === await legacyPidFor(p.id)) return null;
  return p.pid;
}

/** Grava o mapa reverso. Idempotente; roda a cada upsert de perfil. */
export async function indexPublicId(env, saveId, pid) {
  await kvOrThrow(env).put(`${PID_PREFIX}${pid}`, saveId, { expirationTtl: 86400 * 400 });
}

export async function getProfile(env, id) {
  const raw = await kvOrThrow(env).get(`profile:${id}`);
  return raw ? JSON.parse(raw) : null;
}
export async function putProfile(env, id, profile) {
  await kvOrThrow(env).put(`profile:${id}`, JSON.stringify(profile), { expirationTtl: 86400 * 365 });
}


// ── Apelido único (case-insensitive) ─────────────────────────────────────────
// `nick:<minúsculas>` → saveId dono; `nickof:<saveId>` → chave que ele segura (para soltar ao renomear).
export const nickKey = (name) => `nick:${encodeURIComponent(String(name).normalize('NFKC').trim().toLowerCase()).slice(0, 200)}`;
/** Reivindica o apelido. `true` = é seu agora (ou já era); `false` = outra conta o usa. */
export async function claimNick(env, saveId, name) {
  if (/^(an[ôo]nimo|anonymous)$/i.test(String(name).trim())) return true; // nomes-padrão não são reservados
  const kv = kvOrThrow(env);
  const key = nickKey(name);
  const dono = await kv.get(key);
  if (dono && dono !== saveId) return false;
  const antiga = await kv.get(`nickof:${saveId}`);
  if (antiga && antiga !== key && (await kv.get(antiga)) === saveId) await kv.delete(antiga);
  // O índice DOBRADO (busca de jogadores) sai junto com o apelido antigo: ele é derivado do mesmo nome, então não precisa de ponteiro.
  if (antiga && antiga !== key) {
    const velha = nickFoldKeyDaChave(antiga, saveId);
    if (velha && velha !== nickFoldKey(name, saveId)) await kv.delete(velha);
  }
  const ttl = { expirationTtl: 86400 * 400 };
  await kv.put(key, saveId, ttl);
  await kv.put(`nickof:${saveId}`, key, ttl);
  const dobrada = nickFoldKey(name, saveId);
  if (dobrada) await kv.put(dobrada, '', ttl);
  return true;
}

// ── Índice DOBRADO de apelidos: a busca de jogadores (13/11/2026, REGISTRO §321) ────────────────────
// `nickf:<dobrado>:<saveId>` → ''. "Dobrado" = sem acento, minúsculo, NFKC (`foldNome`): "João", "JOAO" e "joão" viram `joao`,
// e a busca por PREFIXO é uma `list({ prefix })` do KV — que já devolve as chaves em ordem: o índice é a própria chave.
// O saveId vai NA CHAVE porque dois apelidos distintos podem dobrar igual ("João" e "Joao" são contas diferentes); o nome da chave
// nunca sai do servidor. `encodeURIComponent` codifica `:` (`%3A`), então o separador final é inequívoco.
// Nasce em `claimNick` (perfil salvo, apelido reservado, `backfillNicks`) e morre com o apelido (renomear, exclusão de conta).
export const NICK_FOLD_PREFIX = 'nickf:';
/** Nome → forma de busca: sem diacrítico, minúsculo, espaço colapsado. ESPELHO de `src/utils/playerSearch.ts` › `foldPlayerName` (teste de paridade). */
export function foldNome(raw) {
  return String(raw ?? '').normalize('NFKD').replace(/\p{M}/gu, '').normalize('NFKC')
    .replace(/\p{C}/gu, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}
const dobradoCodificado = (dobrado) => encodeURIComponent(dobrado).slice(0, 200);
/** Chave do índice dobrado de um apelido; `null` para nome vazio. */
export function nickFoldKey(name, saveId) {
  const d = foldNome(name);
  return d && saveId ? `${NICK_FOLD_PREFIX}${dobradoCodificado(d)}:${saveId}` : null;
}
/** Prefixo de `list` para o termo digitado (já dobrado aqui). Sem o `:` final: "joa" casa "joao:<id>" e "joana:<id>". */
export function nickFoldPrefix(termo) {
  const d = foldNome(termo);
  return d ? `${NICK_FOLD_PREFIX}${dobradoCodificado(d)}` : null;
}
/** A chave dobrada que corresponde a uma chave `nick:` (o apelido antigo que `nickof:` aponta). */
export function nickFoldKeyDaChave(chaveNick, saveId) {
  if (typeof chaveNick !== 'string' || !chaveNick.startsWith('nick:')) return null;
  try { return nickFoldKey(decodeURIComponent(chaveNick.slice(5)), saveId); } catch { return null; }
}
/** saveId dono de uma chave dobrada (o que vem depois do último `:`). */
export const saveIdDaChaveDobrada = (chave) => String(chave).slice(String(chave).lastIndexOf(':') + 1);
