import { readLocal, writeLocal } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';
import { versaoAtual } from './sessionReset';

/**
 * L03-01 — conjunto local dos presentes de amigos já creditados (`soulmon-gifts-credited-v1`).
 *
 * Regra: o servidor só apaga o presente (`giftsAck`) quando o CRÉDITO está NA NUVEM. Por isso há dois estados:
 *   · pendente   = creditado no estado local, ainda não provado na nuvem (`aPartirDaVersao` = a mutação que carrega o crédito);
 *   · confirmado = um POST de save ok de versão >= `aPartirDaVersao` já aconteceu e o ack foi enviado.
 * Adoção da nuvem (409/D2) descarta os pendentes: o estado trocado não tem o crédito, o próximo resgate credita de novo.
 *
 * FORMATO (compatível): gravações antigas eram `string[]` (= confirmados, leitura tolerante). Hoje:
 * `{ confirmados: string[], pendentes: [{gid, aPartirDaVersao, sessao}] }`. `sessao` identifica a carga da página:
 * o contador de versões é de memória e recomeça a cada carga, então pendente de OUTRA sessão vale no primeiro save ok
 * (o save local já tem o crédito; se a nuvem foi adotada depois, os pendentes já foram descartados).
 *
 * RESIDUAL declarado: presente legado sem `gid` (fila pré-L03) ganha gid derivado do índice na fila; raro (só fila antiga cheia).
 * Com D1, um presente descartado volta depois do lease de 10 min (`GIFT_ACK_LEASE_MS`), não na hora.
 * O limite do `aPartirDaVersao` (versão atual + 1) supõe que nenhuma outra mutação seja marcada entre o crédito e o efeito de save.
 */
export interface Pendente { gid: string; aPartirDaVersao: number; sessao: string }
export interface EstadoCreditados { confirmados: string[]; pendentes: Pendente[] }

const TETO = 200;
const SESSAO = Math.random().toString(36).slice(2);

export function lerCreditados(): EstadoCreditados {
  try {
    const v = JSON.parse(readLocal(STORAGE_KEYS.GIFTS_CREDITED) ?? '[]');
    if (Array.isArray(v)) return { confirmados: v.filter((x): x is string => typeof x === 'string'), pendentes: [] };
    if (!v || typeof v !== 'object') return { confirmados: [], pendentes: [] };
    const conf = Array.isArray(v.confirmados) ? v.confirmados.filter((x: unknown): x is string => typeof x === 'string') : [];
    const pend = Array.isArray(v.pendentes)
      ? v.pendentes.filter((p: Pendente) => p && typeof p.gid === 'string' && typeof p.aPartirDaVersao === 'number' && typeof p.sessao === 'string')
      : [];
    return { confirmados: conf, pendentes: pend };
  } catch { return { confirmados: [], pendentes: [] }; }
}

export function gravarCreditados(e: EstadoCreditados): void {
  writeLocal(STORAGE_KEYS.GIFTS_CREDITED, JSON.stringify({ confirmados: e.confirmados.slice(-TETO), pendentes: e.pendentes.slice(-TETO) }), { silent: true });
}

/** Registra gids recém-creditados como pendentes (a próxima mutação marcada é a do crédito). */
export function registrarPendentes(gids: string[]): void {
  const e = lerCreditados();
  const ja = new Set([...e.confirmados, ...e.pendentes.map(p => p.gid)]);
  for (const gid of gids) if (!ja.has(gid)) e.pendentes.push({ gid, aPartirDaVersao: versaoAtual() + 1, sessao: SESSAO });
  gravarCreditados(e);
}

/** Adoção da nuvem trocou o estado: os pendentes não estão nele. Somem, para o próximo resgate creditar de novo. */
export function descartarPendentes(): void {
  const e = lerCreditados();
  if (e.pendentes.length) gravarCreditados({ confirmados: e.confirmados, pendentes: [] });
}

/** Save ok de versão `v`: pendentes cobertos viram confirmados (gravado ANTES do ack) e saem em `giftsAck`. */
export async function confirmarAteVersao(v: number): Promise<void> {
  const e = lerCreditados();
  const prontos = e.pendentes.filter(p => p.sessao !== SESSAO || p.aPartirDaVersao <= v);
  if (!prontos.length) return;
  const gids = prontos.map(p => p.gid);
  gravarCreditados({
    confirmados: [...e.confirmados, ...gids.filter(g => !e.confirmados.includes(g))],
    pendentes: e.pendentes.filter(p => !gids.includes(p.gid)),
  });
  const id = readLocal(STORAGE_KEYS.SAVE_ID);
  if (!id) return;
  const { enviarGiftsAck } = await import('./community');
  await enviarGiftsAck(id, gids);
}
