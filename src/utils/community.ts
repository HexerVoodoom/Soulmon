// Cliente da API de comunidade (functions/api/community.js): perfil público,
// Tournament (PvP assíncrono) e Biblioteca (diretório + amigos + presentes).
import { authHeaders } from './auth';
import { reagirContaExcluida } from './cloudSave';
import { playerDayKey, type PlayerDayAnchor } from './playerDay';
import {
  GUILD_PRESENCE_NOMINAL_MAX, GROVE_STAGES, GUILD_GESTURES, TIDE_SIZES,
  type GroveStageId, type GuildGesture, type TideSize,
} from './guildRules';

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
  // 410 `account-deleted` (QA rodada 2, segurança §1.3): a lápide agora vale
  // em toda rota autorizada por saveId, não só em `/api/save`. Mesma parada
  // que o cloud save: limpa, desloga, portão. E lança, para o chamador não
  // ler o corpo do 410 como resposta.
  if (res.status === 410) {
    const em = (data as { deletedAt?: unknown } | null)?.deletedAt;
    void reagirContaExcluida({ excluidaEm: typeof em === 'number' ? em : undefined });
    throw new Error('account-deleted');
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

// ── Guilda (`docs/PLANO-GUILDA.md`; rota `/api/guild`, `functions/api/guild.js`) ──
//
// A Guilda é o cooperativo da Fase 4.3 com teto de 12. Este bloco é o ÚNICO
// cliente dela, e existe por três razões escritas em TypeScript:
//
//  1. **O tipo `GuildView` não tem nada que se possa ordenar.** Presença é
//     `apareceuHoje?: boolean` e só existe com ≤ `GUILD_PRESENCE_NOMINAL_MAX`
//     membros; `progress`/`target` (soma semanal, um número) chegam no corpo e
//     são DESCARTADOS aqui — a tela não tem barra da semana (LV-G1/LV-G2). A
//     defesa é dupla de propósito: se o servidor mandar presença com 5+
//     membros, `sanitizeGuildView` corta antes de a UI ver.
//  2. **Erro tem tipo, e cada tipo tem uma frase própria** (`GuildErrorKind` →
//     `GUILD_ERROR_KEY`, em `guildCopy.ts`). Falha de CARGA nunca vira "sem
//     roda": quem tem roda e perde a rede não pode ver um formulário de criar.
//  3. **Nada da guilda vai para o GameState nem para o save.** O ponteiro é
//     `coopOf:<saveId>`, do servidor; `guildNoSave.contract.test.ts` trava.

/** O que a UI sabe de UMA pessoa da roda. Nenhum saveId, nenhum estágio (LV-G10). */
export interface GuildMember {
  /**
   * Id OPACO do membro NESTA guilda (`memberId`, 16 hex — o servidor o deriva de guilda+save; a vista
   * não tem mais `pid`). Serve de chave de lista e de semente do sprite. ⚠️ NUNCA vai para
   * `community?action=player` nem sai do aparelho; `null` quando o servidor não o mandou.
   */
  id: string | null;
  name: string | null;
  euMesmo: boolean;
  /** SÓ com até `GUILD_PRESENCE_NOMINAL_MAX` membros, e só do dia de quem pergunta. */
  apareceuHoje?: boolean;
}

export interface GuildView {
  id: string;
  name: string;
  weekKey: string;
  /** O código de convite. Só quem já está dentro o recebe. */
  code: string;
  /** Só sobre quem pergunta; os ajustes de anfitrião saem daqui. */
  isHost: boolean;
  size: number;
  full: boolean;
  /** Ordem de chegada — a UI NÃO reordena. */
  members: GuildMember[];
  /** `null` com ≤4 membros ou sem fio hoje. É `true` ou `null`, nunca um número. */
  threadedToday: true | null;
  mine: {
    cameToday: boolean;
    /** O PRÓPRIO fio de hoje (só de quem pergunta). */
    threadToday: boolean;
    /** Já firmou fio em dias distintos o bastante para liberar os cenários do Bosque (G12). */
    groveScenes: boolean;
    /** Os gestos que EU mandei hoje. */
    gesturesSent: GuildGesture[];
  };
  /**
   * O Bosque: estágio e um binário `perto`. NADA de progresso cru, razão, "faltam N"
   * nem coisa por pessoa — o tipo não tem onde carregar isso (LV-G1/LV-G3).
   */
  bosque: {
    stage: GroveStageId | null;
    /** 0 = ainda sem estágio; 1..5 = a ordem de `GROVE_STAGES`. */
    stageIndex: number;
    /** "perto do próximo estágio": binário, sem razão e sem contagem. */
    perto: boolean;
    /** Peças de maré já colhidas (permanentes). Sem número por pessoa. */
    ornaments: Array<{ tide: string; size: TideSize; day: string }>;
  };
  /**
   * Os TIPOS de gesto recebidos hoje de outros membros, em lote: sem quem e sem quantos.
   * ⚠️ Só com 3+ membros: numa roda de 2 o "anônimo" é quem sobrou, então o servidor
   * NÃO manda o tipo (B5, `GESTO_TIPO_MIN_MEMBROS`) — vem vazio e o aviso é `gestureReceived`.
   */
  gestures: GuildGesture[];
  /** Chegou algum gesto hoje (qualquer roda) — `true` ou `false`, nunca um número. */
  gestureReceived: boolean;
}

export type GuildErrorKind =
  | 'login'         // 401 / 403 forbidden / 400 invalid id: sem conta, sem roda
  | 'invalidCode'   // 404 invalid code
  | 'noGuild'       // 404 no guild: a roda sumiu com a folha aberta
  | 'alreadyIn'     // 409 already in a guild (carrega a vista, quando o servidor a manda)
  | 'full'          // 409 guild full
  | 'collision'     // 409 join collision
  | 'invalidName'   // 400 invalid name
  | 'invalidDay'    // 400 invalid day
  | 'goalNotMet'    // 400 goal not met (o fio: a meta de coração ainda não bateu; NÃO é frase de tela)
  | 'invalidKind'   // 400 invalid kind
  | 'dailyLimit'    // 429 daily limit (o gesto do dia já foi mandado, talvez de outro aparelho)
  | 'notHost'       // 403 not host
  | 'rateLimit'     // 429
  | 'deleted'       // 410 account-deleted (o cloudSave já cuida do portão)
  | 'unavailable'   // 503 / sem rede / fetch caiu
  | 'server';       // qualquer outro 5xx, 4xx desconhecido ou corpo ilegível

export class GuildError extends Error {
  constructor(public readonly kind: GuildErrorKind, public readonly status: number, public readonly guild?: GuildView | null) {
    super(`guild:${kind}:${status}`);
    this.name = 'GuildError';
  }
}

const str = (v: unknown, max = 200): string => (typeof v === 'string' ? v.slice(0, max) : '');

/**
 * A vista do servidor é DADO NÃO CONFIÁVEL para a UI: aqui ela vira o tipo
 * estreito. Presença some com 5+ membros mesmo que o servidor a mande (LV-G2),
 * e `threadedToday` só passa como `true`.
 */
export function sanitizeGuildView(raw: unknown): GuildView | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const list = Array.isArray(r.members) ? r.members : [];
  const declared = typeof r.size === 'number' && Number.isFinite(r.size) ? Math.floor(r.size) : 0;
  const size = Math.max(list.length, declared);
  const nominal = size <= GUILD_PRESENCE_NOMINAL_MAX && r.presence !== null;
  const members: GuildMember[] = list.map((m): GuildMember => {
    const o = (m && typeof m === 'object' ? m : {}) as Record<string, unknown>;
    return {
      id: typeof o.id === 'string' ? o.id : null,
      name: typeof o.name === 'string' && o.name.trim() ? o.name.slice(0, 60) : null,
      euMesmo: o.euMesmo === true,
      ...(nominal ? { apareceuHoje: o.apareceuHoje === true } : {}),
    };
  });
  const mine = (r.mine && typeof r.mine === 'object' ? r.mine : {}) as Record<string, unknown>;
  const b = (r.bosque && typeof r.bosque === 'object' ? r.bosque : {}) as Record<string, unknown>;
  const stageIndex = typeof b.stageIndex === 'number' && Number.isInteger(b.stageIndex)
    ? Math.min(GROVE_STAGES.length, Math.max(0, b.stageIndex)) : 0;
  const gestos = (v: unknown): GuildGesture[] =>
    GUILD_GESTURES.filter(k => Array.isArray(v) && v.includes(k));
  const ornaments = (Array.isArray(b.ornaments) ? b.ornaments : []).flatMap(o => {
    const x = (o && typeof o === 'object' ? o : {}) as Record<string, unknown>;
    return (TIDE_SIZES as readonly unknown[]).includes(x.size) && typeof x.day === 'string'
      ? [{ tide: str(x.tide, 20), size: x.size as TideSize, day: str(x.day, 20) }]
      : [];
  }).slice(0, 60);
  return {
    id: str(r.id, 80),
    name: str(r.name, 60),
    weekKey: str(r.weekKey, 20),
    code: str(r.code, 16),
    isHost: r.isHost === true,
    size,
    full: r.full === true,
    members,
    threadedToday: size > GUILD_PRESENCE_NOMINAL_MAX && r.threadedToday === true ? true : null,
    mine: {
      cameToday: mine.cameToday === true,
      threadToday: mine.threadToday === true,
      groveScenes: mine.groveScenes === true,
      gesturesSent: gestos(mine.gesturesSent),
    },
    bosque: {
      // O índice é a fonte; o id só passa se casar com ele (dado não confiável).
      stage: stageIndex > 0 ? GROVE_STAGES[stageIndex - 1] : null,
      stageIndex,
      // "Perto" do próximo estágio só faz sentido se existir próximo.
      perto: b.perto === true && stageIndex < GROVE_STAGES.length,
      ornaments,
    },
    gestures: gestos(r.gestures),
    gestureReceived: r.gestureReceived === true,
  };
}

function kindOf(status: number, error: string): GuildErrorKind {
  if (status === 401 || error === 'invalid id') return 'login';
  if (status === 410) return 'deleted';
  if (status === 429) return error === 'daily limit' ? 'dailyLimit' : 'rateLimit';
  if (status === 403) return error === 'not host' ? 'notHost' : 'login';
  if (status === 404) return error === 'invalid code' ? 'invalidCode' : error === 'no guild' ? 'noGuild' : 'server';
  if (status === 409) {
    if (error === 'guild full') return 'full';
    if (error === 'join collision') return 'collision';
    if (error === 'already in a guild') return 'alreadyIn';
    return 'server';
  }
  if (status === 400) {
    return error === 'invalid name' ? 'invalidName' : error === 'invalid day' ? 'invalidDay'
      : error === 'goal not met' ? 'goalNotMet' : error === 'invalid kind' ? 'invalidKind' : 'server';
  }
  if (status === 503) return 'unavailable';
  return 'server';
}

const GUILD_BASE = '/api/guild';

async function guildCall<T>(action: string, opts: { method?: 'GET' | 'POST'; params?: Record<string, string>; body?: Record<string, unknown> } = {}): Promise<T> {
  const method = opts.method ?? 'GET';
  const qs = new URLSearchParams({ action, ...(opts.params ?? {}) });
  let res: Response;
  try {
    const auth = await authHeaders();
    res = await fetch(`${GUILD_BASE}?${qs.toString()}`, {
      method,
      headers: method === 'POST' ? { 'Content-Type': 'application/json', ...auth } : auth,
      body: method === 'POST' ? JSON.stringify(opts.body ?? {}) : undefined,
    });
  } catch {
    // fetch só rejeita sem resposta: rede caiu, offline, CSP. É "sem conexão".
    throw new GuildError('unavailable', 0);
  }
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    // 200 com corpo ilegível é FALHA (portal cativo, proxy) — ver `call` acima.
    throw new GuildError(res.status >= 500 ? 'unavailable' : 'server', res.status);
  }
  const obj = (data && typeof data === 'object' ? data : {}) as { error?: unknown; deletedAt?: unknown; guild?: unknown };
  if (res.status === 410) {
    void reagirContaExcluida({ excluidaEm: typeof obj.deletedAt === 'number' ? obj.deletedAt : undefined });
    throw new GuildError('deleted', 410);
  }
  if (!res.ok) {
    const kind = kindOf(res.status, typeof obj.error === 'string' ? obj.error : '');
    throw new GuildError(kind, res.status, kind === 'alreadyIn' ? sanitizeGuildView(obj.guild) : undefined);
  }
  return data as T;
}

/** O DIA DO JOGADOR que o servidor valida a ±1 do UTC (`diaDoJogador`, G6 revisto). */
const dia = (tz: PlayerDayAnchor | undefined) => playerDayKey(new Date(), tz);

const viewOf = (r: { guild?: unknown }) => sanitizeGuildView(r.guild);

/** A roda de quem pergunta, ou `null`. Não ter roda NÃO é erro. */
export const getGuild = (id: string, tz?: PlayerDayAnchor) =>
  guildCall<{ guild: unknown }>('guild', { params: { id, dayKey: dia(tz) } }).then(viewOf);

export const createGuild = (id: string, name: string, tz?: PlayerDayAnchor) =>
  guildCall<{ guild: unknown }>('guildCreate', { method: 'POST', body: { id, name, dayKey: dia(tz) } }).then(viewOf);

export const joinGuild = (id: string, code: string, tz?: PlayerDayAnchor) =>
  guildCall<{ guild: unknown }>('guildJoin', { method: 'POST', body: { id, code, dayKey: dia(tz) } }).then(viewOf);

/** "Firmar meu fio" (no servidor: `guildCheckin`, idempotente por dia). */
export const guildCheckin = (id: string, tz?: PlayerDayAnchor) =>
  guildCall<{ guild: unknown }>('guildCheckin', { method: 'POST', body: { id, dayKey: dia(tz) } }).then(viewOf);

/**
 * A meta do dia, como o servidor a confere (`metaDoFioCumprida`): `done` e as duas
 * réguas (`heart` = a que protege o coração, `full` = o dia completo) — todas em
 * PESO DE ESFORÇO, nunca em contagem de itens. O cliente as calcula no App
 * (`heartGoalFor`/`dailyGoalFor`); aqui só trafegam. O fio vale a de CORAÇÃO (G1).
 */
export interface GuildGoal { done: number; heart: number; full: number }

/** "Firmar meu fio" (`guildThread kind:'fio'`): idempotente por dia e por pessoa, e o texto nunca leva nome. */
export const guildThread = (id: string, goal?: GuildGoal, tz?: PlayerDayAnchor) =>
  guildCall<{ guild: unknown }>('guildThread', { method: 'POST', body: { id, dayKey: dia(tz), kind: 'fio', ...(goal ? { goal } : {}) } }).then(viewOf);

/** Um dos três gestos fixos, anônimos, para a roda inteira. Um de cada por dia; sem texto, sem destinatário, sem push. */
export const guildGesture = (id: string, kind: GuildGesture, tz?: PlayerDayAnchor) =>
  guildCall<{ guild: unknown }>('guildGesture', { method: 'POST', body: { id, dayKey: dia(tz), kind } }).then(viewOf);

/** Sair. Um toque, sem confirmação de ninguém e sem penalidade nenhuma. */
export const leaveGuild = (id: string) =>
  guildCall<{ ok: true }>('guildLeave', { method: 'POST', body: { id } });

export const renameGuild = (id: string, name: string, tz?: PlayerDayAnchor) =>
  guildCall<{ guild: unknown }>('guildRename', { method: 'POST', body: { id, name, dayKey: dia(tz) } }).then(viewOf);

export const newGuildCode = (id: string, tz?: PlayerDayAnchor) =>
  guildCall<{ guild: unknown }>('guildNewCode', { method: 'POST', body: { id, dayKey: dia(tz) } }).then(viewOf);
