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

