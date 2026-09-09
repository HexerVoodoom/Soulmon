// Cliente da API de comunidade (functions/api/community.js): perfil público,
// Tournament (PvP assíncrono) e Biblioteca (diretório + amigos + presentes).
import { authHeaders } from './auth';

const BASE = '/api/community';

// TODA chamada leva o token — inclusive as GET. O servidor autoriza o ATOR de
// `friends`/`gift`/`match`/`trophies`/`gifts` (o `claim=1` das duas últimas é
// destrutivo), e não só o `profile`. Sem o header aqui, essas rotas passam a
// responder 401 no instante em que o FIREBASE_PROJECT_ID for ligado.
async function call<T>(action: string, opts: { method?: 'GET' | 'POST'; params?: Record<string, string>; body?: unknown } = {}): Promise<T> {
  const method = opts.method ?? 'GET';
  const qs = new URLSearchParams({ action, ...(opts.params ?? {}) });
  const auth = await authHeaders();
  const res = await fetch(`${BASE}?${qs.toString()}`, {
    method,
    headers: method === 'POST' ? { 'Content-Type': 'application/json', ...auth } : auth,
    body: method === 'POST' ? JSON.stringify(opts.body ?? {}) : undefined,
  });
  /* ⚠️ 200 com corpo que não é JSON é FALHA, não sucesso vazio.
     Até 09/09/2026 esta linha era `await res.json().catch(() => ({}))` e o
     resultado era devolvido como se fosse a resposta: `res.ok` é true, nada
     lança, e o chamador recebe `{}`. Medido na tela do Torneio — `getRank()`
     resolvia com `{}`, `setRank(r.rank)` gravava `undefined`, e como os
     ramos de "vazio" e de "falhou" ambos exigem `rank` verdadeiro, a área do
     ranking ficava **em branco para sempre**, sem explicação, e o efeito
     disparava a requisição DUAS vezes (`!rank` continuava true).
     Não é hipótese de laboratório: 200 com HTML é o que devolve um portal
     cativo de Wi-Fi, um proxy corporativo, uma página de erro de CDN e o
     servidor de desenvolvimento. Todas as ações desta rota respondem por
     `Response.json` (`functions/api/community.js`, o helper `json`), então
     corpo ilegível aqui nunca é resposta legítima. */
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    if (!res.ok) throw new Error(`request failed (${res.status})`);
    throw new Error(`resposta ilegível (${res.status})`);
  }
  if (!res.ok) throw new Error((data as { error?: string }).error || `request failed (${res.status})`);
  return data as T;
}

export interface PublicProfileInput {
  id: string;
  name: string;
  stage: string;
  petName?: string;
  unlockedStages?: string[];
  pvpEnabled: boolean;
  attrs?: { virus: number; data: number; vaccine: number };
  tasksDone?: number;
}

/**
 * O que o servidor RESPONDE ao gravar o perfil — e não é só `ok`.
 *
 * O tipo antigo era `{ ok: true }`, e essa mentira de tipo custava
 * comportamento: `POST profile` aceita `pvpEnabled` do cliente mas tem um gate
 * de Vínculo (`BOND_PVP_MIN_LEVEL`, `functions/api/community.js`), e quando ele
 * barra, o perfil é gravado com `pvpEnabled: false` e a resposta traz o porquê.
 * O comentário do servidor diz para que esses campos existem, na letra: *"para
 * o app poder explicar em vez de sumir com o botão em silêncio"*. Enquanto o
 * tipo não os declarava, ninguém os lia.
 *
 * `pvpEnabled` é o que FOI GRAVADO, que pode divergir do que foi pedido — é o
 * campo a acreditar, porque o servidor é quem decide (o cliente é editável).
 */
export interface ProfilePushResult {
  ok: true;
  /** O estado REAL no servidor depois da gravação. */
  pvpEnabled?: boolean;
  /** Só aparece quando um pedido de LIGAR o PvP foi recusado pelo gate. */
  pvpBlocked?: boolean;
  /** O nível de Vínculo que o servidor apurou. `null` quando não chegou a apurar. */
  bondLevel?: number | null;
  /** O nível exigido, dito pelo servidor — nunca reimplementado aqui. */
  minBondLevel?: number;
}

export const pushProfile = (p: PublicProfileInput) =>
  call<ProfilePushResult>('profile', { method: 'POST', body: p });

/**
 * O que o diretório devolve de OUTRA pessoa. `rankPoints` e `tasksDone` saíram
 * em 06/09/2026 (WP4.11 / proibição #21): desempenho alheio não trafega, e o
 * corte é no servidor justamente para que uma UI futura não consiga
 * reintroduzi-lo por descuido. O que resta é presença — quem é, que criatura
 * tem, há quanto tempo joga.
 */
export interface DirectoryPlayer {
  id: string; name: string; petName: string; stage: string;
  unlockedStages: string[]; pvpEnabled: boolean; daysPlaying: number;
}
export const listPlayers = (search = '') =>
  call<{ players: DirectoryPlayer[] }>('players', { params: search ? { search } : {} });

export interface PlayerDetail extends DirectoryPlayer {
  friends: string[]; wins: number; losses: number;
}
export const getPlayer = (id: string) =>
  call<{ found: boolean; player?: PlayerDetail }>('player', { params: { id } });

export interface Opponent { id: string; name: string; petName: string; stage: string }
export const getOpponents = (id: string) =>
  call<{ opponents: Opponent[]; matchesLeft: number }>('opponents', { params: { id } });

export interface MatchResult {
  won: boolean; myScore: number; oppScore: number; points: number; matchesLeft: number;
  opponent: { name: string; petName: string; stage: string };
}
export const playMatch = (id: string, opponentId: string) =>
  call<MatchResult>('match', { method: 'POST', body: { id, opponentId } });

export interface RankRow {
  id: string; name: string; petName: string; stage: string;
  points: number; wins: number; losses: number;
  /** WP4.13 — pontos LIFETIME, que só somam. É deles que sai a FAIXA; os
   *  `points` acima são da season e caem (derrota, ser sorteado, virada de
   *  mês). Save antigo do servidor pode não trazer: `?? 0`, nunca `points`. */
  lifetime?: number;
}
export const getRank = (season?: string) =>
  call<{ season: string; rank: RankRow[] }>('rank', { params: season ? { season } : {} });
export const getSeasonResult = (season: string) =>
  call<{ season: string; top3: RankRow[] }>('seasonResult', { params: { season } });

export const addFriend = (id: string, friendId: string) =>
  call<{ ok: true; friends: string[] }>('friends', { method: 'POST', body: { id, friendId } });
export const removeFriend = (id: string, friendId: string) =>
  call<{ ok: true; friends: string[] }>('friends', { method: 'POST', body: { id, friendId, remove: true } });

export const sendGift = (id: string, friendId: string) =>
  call<{ ok: true }>('gift', { method: 'POST', body: { id, friendId } });
export const getGifts = (id: string, claim = false) =>
  call<{ gifts: Array<{ from: string; bits: number; at: number }> }>('gifts', { params: { id, ...(claim ? { claim: '1' } : {}) } });

export const getPendingTrophies = (id: string, claim = false) =>
  call<{ trophies: Array<{ season: string; place: 1 | 2 | 3 }> }>('trophies', { params: { id, ...(claim ? { claim: '1' } : {}) } });

// ── Cooperativo (Fase 4.3 — `docs/PLANO-COOP.md`) ────────────────────────────
//
// O tipo abaixo é a razão do modo existir, escrita em TypeScript: um membro do
// grupo tem `apareceuHoje: boolean` e **nada mais que se possa ordenar**. O
// servidor também não manda quanto cada um fez (`vistaDoGrupo`, em
// `functions/api/community.js`) — as duas travas são de propósito. O item 4.2
// do `docs/PLANO-EVOLUCAO.md` registra que 31,3% relataram efeito psicológico
// negativo de comparação em ambiente de leaderboard; um grupo que mostrasse a
// contribuição individual reinventaria o leaderboard entre amigos, onde a
// comparação dói mais, não menos.

export interface CoopMember {
  /** pid público, nunca o saveId. `null` quando a pessoa ainda não tem perfil. */
  id: string | null;
  name: string | null;
  stage: string | null;
  apareceuHoje: boolean;
  euMesmo: boolean;
}

export interface CoopGroup {
  id: string;
  name: string;
  weekKey: string;
  /** O código de convite. Só quem já está dentro o recebe. */
  code: string;
  members: CoopMember[];
  /** Progresso COLETIVO da semana, já limitado a `target`. */
  progress: number;
  /** Derivado do tamanho do grupo — por isso sair encolhe a meta junto. */
  target: number;
  full: boolean;
}

/** O grupo de quem pergunta, ou `null`. Não ter grupo NÃO é erro. */
export const getCoop = (id: string) =>
  call<{ group: CoopGroup | null }>('coop', { params: { id } }).then(r => r.group);

export const createCoop = (id: string, name: string) =>
  call<{ group: CoopGroup }>('coopCreate', { method: 'POST', body: { id, name } }).then(r => r.group);

export const joinCoop = (id: string, code: string) =>
  call<{ group: CoopGroup }>('coopJoin', { method: 'POST', body: { id, code } }).then(r => r.group);

/**
 * "Apareci hoje". Idempotente no servidor — chamar de novo no mesmo dia não
 * conta duas vezes, então o cliente pode chamar sem guardar estado.
 */
export const coopCheckin = (id: string) =>
  call<{ group: CoopGroup }>('coopCheckin', { method: 'POST', body: { id } }).then(r => r.group);

/** Sair. Um toque, sem confirmação de ninguém e sem penalidade nenhuma. */
export const leaveCoop = (id: string) =>
  call<{ ok: true }>('coopLeave', { method: 'POST', body: { id } });
