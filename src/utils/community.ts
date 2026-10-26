import type { DuelSide } from './combate/duel';
import type { FightEvent } from './combate/fight';
// Cliente da API de comunidade (functions/api/community.js): perfil público,
// Tournament (PvP assíncrono) e Biblioteca (diretório + amigos + presentes).
import { authHeaders } from './auth';
import { reagirContaExcluida } from './cloudSave';
import { playerDayKey, type PlayerDayAnchor } from './playerDay';
import {
  GUILD_PRESENCE_NOMINAL_MAX, GROVE_STAGES, GUILD_GESTURES, TIDE_SIZES, RAID_PHENOMENA, CASA_STAGES,
  type CasaStageId, type GroveStageId, type GuildGesture, type TideSize, type RaidPhenomenon,
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
  /** Foto (id de `assets/avatares/catalogo.json`) e moldura (id de `utils/frames.ts`); o servidor confere contra as listas fechadas. */
  avatarId?: string | null;
  frameId?: string | null;
  /** Linha de arte (D-60, `spriteLineOf`): só um id; o servidor confere contra a lista fechada. */
  artLine?: string | null;
  /** Elemento do Oráculo da criatura (`soulmonMeta.dominantElement`); o servidor confere o formato. */
  element?: string | null;
  /** URL do sprite próprio gerado pelo jogador (validada no servidor e no cliente). */
  spriteUrl?: string | null;
  unlockedStages?: string[];
  pvpEnabled: boolean;
  /** TORC-5: `true` = a pessoa saiu da lista pública do Torneio (Configurações).
   *  Sempre enviado, para o servidor poder RETIRAR o registro público já
   *  existente na hora em que a escolha muda. */
  publicHidden?: boolean;
  attrs?: { power: number; harmony: number; benevolence: number };
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
  /** O estado REAL do opt-out da lista pública no servidor. */
  publicHidden?: boolean;
  /** Só aparece quando um pedido de LIGAR o PvP foi recusado pelo gate. */
  pvpBlocked?: boolean;
  /** O nível de Vínculo que o servidor apurou. `null` quando não chegou a apurar. */
  bondLevel?: number | null;
  /** O nível exigido, dito pelo servidor — nunca reimplementado aqui. */
  minBondLevel?: number;
  /** Outra conta já usa este apelido: o servidor manteve o anterior. */
  nameTaken?: boolean;
}

/** Reserva o apelido (único, sem diferenciar maiúsculas). Lança `Error('name taken')` quando outra conta já o usa. */
export const reserveNickname = (id: string, name: string) =>
  call<{ ok: true; name: string }>('nickname', { method: 'POST', body: { id, name } });
/** Sugestões de nomes do diretório que começam com o prefixo (no máximo 8; só nomes). */
export const suggestNames = (prefix: string) =>
  call<{ names: string[] }>('names', { params: { prefix } });

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
  id: string; name: string; petName: string; stage: string; element?: string | null;
  avatarId?: string | null; frameId?: string | null; artLine?: string | null; spriteUrl?: string | null;
  unlockedStages: string[]; pvpEnabled: boolean; daysPlaying: number;
}
export const listPlayers = (search = '') =>
  call<{ players: DirectoryPlayer[] }>('players', { params: search ? { search } : {} });

export interface PlayerDetail extends DirectoryPlayer {
  friends: string[]; wins: number; losses: number;
}
export const getPlayer = (id: string) =>
  call<{ found: boolean; player?: PlayerDetail }>('player', { params: { id } });

export interface Opponent {
  id: string; name: string; petName: string; stage: string;
  avatarId?: string | null; frameId?: string | null; artLine?: string | null; spriteUrl?: string | null;
  /** Duelo fantasma v3 (PR5): só o level com que cada um luta (já com o teto S1) — a ficha inteira vem em `duelStart`. */
  duel?: { level: number } | null;
}
export const getOpponents = (id: string) =>
  call<{ opponents: Opponent[]; me?: { duel: { level: number } | null }; matchesLeft: number }>('opponents', { params: { id } });

export interface MatchResult {
  won: boolean;
  /** EMPATE (PR5, §2.4): resultado válido — a partida conta como jogada, mas ninguém ganha pontos nem Honra. */
  draw?: boolean;
  /** `won` + `draw` num campo só: 'win' | 'loss' | 'draw'. */
  outcome?: 'win' | 'loss' | 'draw';
  myScore: number; oppScore: number; points: number; matchesLeft: number;
  opponent: { name: string; petName: string; stage: string; avatarId?: string | null; frameId?: string | null; artLine?: string | null; spriteUrl?: string | null };
  /** A luta do SERVIDOR (autoritativa): os eventos do núcleo e a ficha dos dois lados. */
  duel?: { events: FightEvent[]; me: DuelSide; opp: DuelSide };
  /** Saiu do duelo antes do fim: o servidor fechou como derrota, sem luta. */
  forfeit?: boolean;
  /** PR13: quanto a vitória rendeu em pontos (0 em derrota/empate). O servidor reduz o ganho contra oponente bem abaixo do seu level e contra o mesmo oponente repetido no dia. */
  gain?: number;
  /** PR13: fator (0..1) que o app aplica à Honra de VITÓRIA (1 = inteira). Derrota e empate: 1 e nada muda. Ausente (servidor antigo) = 1. */
  honorFactor?: number;
}
/** Abre o duelo: gasta a partida do dia e devolve a SEMENTE, sorteada no
 *  servidor só depois disso (o cliente nunca a vê antes de se comprometer), e a FICHA dos dois lados, derivada
 *  dos saves no servidor (o cliente nunca deriva o oponente). */
export const startDuel = (id: string, opponentId: string) =>
  call<{ seed: number; me: DuelSide; opp: DuelSide; matchesLeft: number }>('duelStart', { method: 'POST', body: { id, opponentId } });
/** `taps` = toques dados em cada BALDE de 3 s da luta (o servidor higieniza e põe teto). `forfeit: true` = desistir do duelo aberto (conta como derrota). */
/** `seed` (a do `duelStart`) torna o envio IDEMPOTENTE: se a resposta se perder e o app reenviar, o servidor devolve o mesmo resultado
 *  (`replayed: true`) em vez de gastar outra partida. Campo aditivo: servidor velho o ignora. */
export const playMatch = (id: string, opponentId: string, taps: number[] = [], forfeit = false, seed?: number) =>
  call<MatchResult>('match', { method: 'POST', body: { id, opponentId, taps, ...(forfeit ? { forfeit: true } : {}), ...(typeof seed === 'number' ? { seed } : {}) } });

/** Falha de TRANSPORTE (rede caiu, 5xx, corpo ilegível): o servidor pode não ter visto o envio, ou ter visto e a resposta se perdeu. */
export function isFalhaDeRede(err: unknown): boolean {
  if (err instanceof TypeError) return true;
  const m = err instanceof Error ? err.message : '';
  return /^request failed \(5\d\d\)$/.test(m) || m.startsWith('resposta ilegível');
}
export const MATCH_RETRY_DELAYS_MS = [1000, 3000];
/** `playMatch` com a semente do duelo + novas tentativas com recuo SÓ para falha de rede (erro do servidor é decisão, não se repete). */
export async function playMatchComRetry(
  id: string, opponentId: string, taps: number[], seed: number,
  delays: number[] = MATCH_RETRY_DELAYS_MS,
): Promise<MatchResult> {
  for (let i = 0; ; i++) {
    try {
      return await playMatch(id, opponentId, taps, false, seed);
    } catch (err) {
      if (!isFalhaDeRede(err) || i >= delays.length) throw err;
      await new Promise(r => setTimeout(r, delays[i]));
    }
  }
}

export interface RankRow {
  id: string; name: string; petName: string; stage: string;
  avatarId?: string | null; frameId?: string | null; artLine?: string | null; spriteUrl?: string | null;
  points: number; wins: number; losses: number;
  /** WP4.13 — pontos LIFETIME, que só somam. É deles que sai a FAIXA; os
   *  `points` acima são da season e caem (derrota, ser sorteado, virada de
   *  mês). Save antigo do servidor pode não trazer: `?? 0`, nunca `points`. */
  lifetime?: number;
}
/** `id` (saveId, autorizado) pede também o PRÓPRIO lugar em `me` e a posição REAL na season em `myPlace` (R8: decide Mestre/Grão-Mestre) — é o que
 *  sobra a quem saiu da lista pública (`publicHidden`), que não aparece em `rank`. */
export const getRank = (season?: string, id?: string) =>
  call<{ season: string; rank: RankRow[]; me?: Partial<RankRow> & { hidden?: boolean }; myPlace?: number }>('rank', { params: { ...(season ? { season } : {}), ...(id ? { id } : {}) } });
export const getSeasonResult = (season: string) =>
  call<{ season: string; top3: RankRow[] }>('seasonResult', { params: { season } });

export const addFriend = (id: string, friendId: string) =>
  call<{ ok: true; friends: string[] }>('friends', { method: 'POST', body: { id, friendId } });
export const removeFriend = (id: string, friendId: string) =>
  call<{ ok: true; friends: string[] }>('friends', { method: 'POST', body: { id, friendId, remove: true } });

export const sendGift = (id: string, friendId: string) =>
  call<{ ok: true }>('gift', { method: 'POST', body: { id, friendId } });
export interface GiftItem { from: string; bits: number; at: number; gid?: string }
export const getGifts = (id: string, claim = false) =>
  call<{ gifts: GiftItem[]; ack?: boolean }>('gifts', { params: { id, ...(claim ? { claim: '1' } : {}) } });

/** `giftsAck` em lotes de 50; falha de rede é engolida (o próximo resgate reenvia). */
export async function enviarGiftsAck(id: string, gids: string[]): Promise<void> {
  for (let i = 0; i < gids.length; i += 50) {
    try { await call<{ ok: true }>('giftsAck', { method: 'POST', body: { id, gids: gids.slice(i, i + 50) } }); } catch { /* o próximo resgate reenvia */ }
  }
}

/** L03-01: resgate com ack. O servidor (modo `ack=1`) NÃO apaga. `confirmar()` NÃO manda o ack: registra os gids creditados
 *  como PENDENTES (`giftsCredited.ts`); o ack sai só depois que um save ok prova o crédito na nuvem (GameStateContext) e os
 *  pendentes são descartados se a nuvem for adotada antes. Gid já confirmado que reaparece (ack perdido) não recredita e
 *  tem o ack reenviado aqui. Servidor antigo (resposta sem `ack`): comportamento antigo, `confirmar` é no-op.
 *  Residual: presente legado sem `gid` (fila pré-L03) tem gid derivado do índice; com D1 o presente descartado volta após o lease de 10 min. */
export async function resgatarPresentes(id: string): Promise<{ gifts: GiftItem[]; confirmar: () => Promise<void> | void }> {
  const res = await call<{ gifts: GiftItem[]; ack?: boolean }>('gifts', { params: { id, claim: '1', ack: '1' } });
  const recebidos = Array.isArray(res.gifts) ? res.gifts : [];
  if (res.ack !== true) return { gifts: recebidos, confirmar: () => {} };
  const { lerCreditados, registrarPendentes } = await import('./giftsCredited');
  const antes = lerCreditados();
  const conf = new Set(antes.confirmados);
  const pend = new Set(antes.pendentes.map(p => p.gid));
  const gidDe = (g: GiftItem) => (typeof g.gid === 'string' && g.gid.length > 0 && g.gid.length <= 100 ? g.gid : null);
  const novos = recebidos.filter(g => { const x = gidDe(g); return !(x && (conf.has(x) || pend.has(x))); });
  const reenviar = recebidos.map(gidDe).filter((x): x is string => !!x && conf.has(x));
  return {
    gifts: novos,
    confirmar: async () => {
      registrarPendentes(novos.map(gidDe).filter((x): x is string => !!x));
      if (reenviar.length) await enviarGiftsAck(id, reenviar);
    },
  };
}

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
  /** Sprite próprio do membro (`/api/sprite-image?k=...`, CDN permitido ou id de `artLine`). */
  sprite?: string | null;
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
  /** A Feira desta semana. `null` = o servidor não a mandou (não se desenha nada). */
  raid: GuildRaid | null;
  /** A CASA da guilda (PR2). `null` = o servidor não a mandou (versão antiga): a sala não se desenha. */
  casa: GuildCasa | null;
}

/**
 * A casa como o cliente a conhece: o NÍVEL, um binário `perto` e os slots de item. **Nenhum ponto,
 * limiar, "faltam N" nem doação por pessoa** — o tipo não tem onde carregar isso (LV-G1). O slot diz
 * QUAL item, nunca quanto a pessoa doou.
 */
export interface GuildCasa {
  nivel: CasaStageId;
  /** 0..5 = a ordem de `CASA_STAGES`. */
  nivelIndex: number;
  perto: boolean;
  /** O TOTAL de Bits que o clã já recebeu em doação (W14b): um número do CLÃ, nunca por pessoa. `null` = servidor antigo. */
  bitsTotal: number | null;
  slots: Array<{ memberId: string; item: string; euMesmo: boolean }>;
  /** A Loja do clã (R5/A): itens JÁ do clã (ids do catálogo) e o saldo de Bits do clã. Campo aditivo: ausente = vazio. */
  loja: { itens: string[]; saldo: number | null };
  mine: {
    /** O item que EU pus na casa, ou `null`. */
    slot: string | null;
    /** O teto de doação de hoje já foi atingido (só de quem pergunta). */
    capReached: boolean;
  };
}

/** Dado não confiável: só o que casa com as listas fechadas passa. */
function sanitizeCasa(raw: unknown): GuildCasa | null {
  if (!raw || typeof raw !== 'object') return null;
  const x = raw as Record<string, unknown>;
  const idx = typeof x.nivelIndex === 'number' && Number.isInteger(x.nivelIndex) ? Math.min(CASA_STAGES.length - 1, Math.max(0, x.nivelIndex)) : null;
  if (idx === null) return null;
  const mine = (x.mine && typeof x.mine === 'object' ? x.mine : {}) as Record<string, unknown>;
  const itemOk = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9][a-z0-9_-]{1,39}$/.test(v);
  const slots = (Array.isArray(x.slots) ? x.slots : []).flatMap(o => {
    const r = (o && typeof o === 'object' ? o : {}) as Record<string, unknown>;
    return itemOk(r.item) && typeof r.memberId === 'string' ? [{ memberId: str(r.memberId, 40), item: r.item, euMesmo: r.euMesmo === true }] : [];
  }).slice(0, 12);
  return {
    nivel: CASA_STAGES[idx],
    nivelIndex: idx,
    perto: x.perto === true && idx < CASA_STAGES.length - 1,
    bitsTotal: typeof x.bitsTotal === 'number' && Number.isFinite(x.bitsTotal) && x.bitsTotal >= 0 ? Math.floor(x.bitsTotal) : null,
    slots,
    loja: (() => {
      const l = (x.loja && typeof x.loja === 'object' ? x.loja : {}) as Record<string, unknown>;
      const itens = [...new Set((Array.isArray(l.itens) ? l.itens : []).filter((v): v is string => typeof v === 'string' && /^loja-[a-z0-9-]{2,40}$/.test(v)))].slice(0, 20);
      return { itens, saldo: typeof l.saldo === 'number' && Number.isFinite(l.saldo) && l.saldo >= 0 ? Math.floor(l.saldo) : null };
    })(),
    mine: { slot: itemOk(mine.slot) ? mine.slot : null, capReached: mine.capReached === true },
  };
}

/**
 * A FEIRA como o cliente a conhece: o TIPO do fenômeno, três estados e o desfecho da
 * semana que fechou. **Nenhuma folha numérica** — o tipo não tem onde carregar HP,
 * dano nem quem bateu (LV-G1); `ferido` é um booleano do servidor (dano ≥ metade).
 */
export interface GuildRaid {
  weekKey: string;
  phenomenon: RaidPhenomenon;
  state: 'aberta' | 'dissipada';
  ferido: boolean;
  /** Desfecho da semana anterior, só se alguém golpeou; `recuou` nunca aponta ninguém. */
  lastWeek: 'dissipada' | 'recuou' | null;
  /** Já fiz a minha rodada de hoje (só de quem pergunta). */
  hitToday: boolean;
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
  | 'raidClosed'    // 409 raid closed (a semana já está vencida ou terminou: relê e o estado certo aparece)
  | 'alreadyClaimed' // 409 already claimed (o resgate já foi feito: SILÊNCIO)
  | 'nothingToClaim' // 404 nothing to claim / 400 invalid week (nada a colher: SILÊNCIO)
  | 'server';       // qualquer outro 5xx, 4xx desconhecido ou corpo ilegível

export class GuildError extends Error {
  /** `guild` só no 409 `already in a guild`; `claim` só no 409 `already claimed` (o resgate JÁ feito, para o cliente
   *  que perdeu a resposta do 200 — L3-codigo A1). */
  constructor(
    public readonly kind: GuildErrorKind,
    public readonly status: number,
    public readonly guild?: GuildView | null,
    public readonly claim?: GuildClaim | null,
  ) {
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
    const rawSprite = typeof o.sprite === 'string' && o.sprite.trim() ? o.sprite.trim().slice(0, 500) : null;
    return {
      id: typeof o.id === 'string' ? o.id : null,
      name: typeof o.name === 'string' && o.name.trim() ? o.name.slice(0, 60) : null,
      ...(rawSprite ? { sprite: rawSprite } : {}),
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
    raid: sanitizeRaid(r.raid),
    casa: sanitizeCasa(r.casa),
  };
}

/** Dado não confiável: só o que casa com a lista fechada passa; sem tipo válido, sem Feira. */
function sanitizeRaid(raw: unknown): GuildRaid | null {
  if (!raw || typeof raw !== 'object') return null;
  const x = raw as Record<string, unknown>;
  if (!(RAID_PHENOMENA as readonly unknown[]).includes(x.phenomenon)) return null;
  const mine = (x.mine && typeof x.mine === 'object' ? x.mine : {}) as Record<string, unknown>;
  const dissipada = x.state === 'dissipada';
  return {
    weekKey: str(x.weekKey, 20),
    phenomenon: x.phenomenon as RaidPhenomenon,
    state: dissipada ? 'dissipada' : 'aberta',
    // Dissipada não é "ferida": é um estado próprio.
    ferido: !dissipada && x.ferido === true,
    lastWeek: x.lastWeek === 'dissipada' || x.lastWeek === 'recuou' ? x.lastWeek : null,
    hitToday: mine.hitToday === true,
  };
}

function kindOf(status: number, error: string): GuildErrorKind {
  if (status === 401 || error === 'invalid id') return 'login';
  if (status === 410) return 'deleted';
  if (status === 429) return error === 'daily limit' ? 'dailyLimit' : 'rateLimit';
  if (status === 403) return error === 'not host' ? 'notHost' : 'login';
  if (status === 404) return error === 'invalid code' ? 'invalidCode' : error === 'no guild' ? 'noGuild' : error === 'nothing to claim' ? 'nothingToClaim' : 'server';
  if (status === 409) {
    if (error === 'raid closed') return 'raidClosed';
    if (error === 'already claimed') return 'alreadyClaimed';
    if (error === 'guild full') return 'full';
    if (error === 'join collision') return 'collision';
    if (error === 'already in a guild') return 'alreadyIn';
    return 'server';
  }
  if (status === 400) {
    return error === 'invalid name' ? 'invalidName' : error === 'invalid day' ? 'invalidDay' : error === 'invalid week' ? 'nothingToClaim'
      : error === 'goal not met' ? 'goalNotMet' : error === 'invalid kind' ? 'invalidKind' : 'server';
  }
  if (status === 503) return 'unavailable';
  return 'server';
}

const GUILD_BASE = '/api/guild';

export async function guildCall<T>(action: string, opts: { method?: 'GET' | 'POST'; params?: Record<string, string>; body?: Record<string, unknown> } = {}): Promise<T> {
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
  const obj = (data && typeof data === 'object' ? data : {}) as { error?: unknown; deletedAt?: unknown; guild?: unknown; claimed?: unknown };
  if (res.status === 410) {
    void reagirContaExcluida({ excluidaEm: typeof obj.deletedAt === 'number' ? obj.deletedAt : undefined });
    throw new GuildError('deleted', 410);
  }
  if (!res.ok) {
    const kind = kindOf(res.status, typeof obj.error === 'string' ? obj.error : '');
    throw new GuildError(
      kind, res.status,
      kind === 'alreadyIn' ? sanitizeGuildView(obj.guild) : undefined,
      // 409 `already claimed`: o servidor manda `claimed` (a MESMA forma do 200, lida do registro gravado).
      kind === 'alreadyClaimed' ? sanitizeClaim(obj.claimed) : undefined,
    );
  }
  return data as T;
}

/** O DIA DO JOGADOR que o servidor valida a ±1 do UTC (`diaDoJogador`, G6 revisto). */
export const dia = (tz: PlayerDayAnchor | undefined) => playerDayKey(new Date(), tz);

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

/**
 * A rodada do dia ("a roda vai até ele"). O servidor sorteia o dano e NUNCA o devolve:
 * a resposta é só `landed` e a vista nova. Um por dia do jogador; 429 `dailyLimit` (talvez de
 * outro aparelho) e 409 `raidClosed` são estados, não frases — a folha relê em silêncio.
 */
export const hitGuildRaid = (id: string, tz?: PlayerDayAnchor) =>
  guildCall<{ landed?: boolean; guild: unknown }>('guildRaidHit', { method: 'POST', body: { id, dayKey: dia(tz) } }).then(viewOf);

/**
 * Doar Bits à CASA. O servidor decide quanto cabe no teto do dia e devolve `accepted`: o chamador
 * desconta SÓ isso da carteira (nunca o pedido). 429 `dailyLimit` = o teto de hoje já foi atingido.
 */
export const donateToGuild = (id: string, bits: number, tz?: PlayerDayAnchor) =>
  guildCall<{ accepted?: number; guild: unknown }>('guildDonate', { method: 'POST', body: { id, dayKey: dia(tz), bits } })
    .then(r => ({ accepted: typeof r.accepted === 'number' && r.accepted > 0 ? Math.floor(r.accepted) : 0, guild: viewOf(r) }));

/**
 * Compra na LOJA do clã. Manda SÓ `itemId` + `opId` (nunca preço): o servidor decide preço e saldo, e repetir o
 * MESMO `opId` (reenvio após queda de rede) não cobra de novo. 409 = saldo curto / já é do clã (o chamador relê).
 */
export const buyGuildShopItem = (id: string, itemId: string, opId: string, tz?: PlayerDayAnchor) =>
  guildCall<{ repeated?: boolean; guild: unknown }>('guildShopBuy', { method: 'POST', body: { id, dayKey: dia(tz), itemId, opId } }).then(viewOf);

/** Põe (ou tira, com `null`) o item do SEU slot na casa. Um item por pessoa. */
export const setGuildSlot = (id: string, item: string | null, tz?: PlayerDayAnchor) =>
  guildCall<{ guild: unknown }>('guildSlot', { method: 'POST', body: { id, dayKey: dia(tz), item } }).then(viewOf);

/**
 * A GUERRA de guilda 4×4 (PR4): o estado como o cliente o conhece. Só o desfecho por confronto e o nome (já higienizado)
 * da guilda rival — nunca saveId, estágio, HP nem dano de ninguém (o tipo não tem onde carregar).
 */
export type WarOutcome = 'win' | 'draw' | 'loss';
export interface GuildWar {
  /** Entrou na fila do tamanho `size` (esperando uma guilda do MESMO tamanho). */
  waiting: { size: number } | null;
  last: { day: string; outcome: WarOutcome; duels: WarOutcome[]; size: number; enemy: string } | null;
}
export type WarSeekState = 'small' | 'already' | 'waiting' | 'done';

export function sanitizeWar(raw: unknown): GuildWar {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const ok = (v: unknown): v is WarOutcome => v === 'win' || v === 'draw' || v === 'loss';
  const w = (r.waiting && typeof r.waiting === 'object' ? r.waiting : null) as Record<string, unknown> | null;
  const l = (r.last && typeof r.last === 'object' ? r.last : null) as Record<string, unknown> | null;
  return {
    waiting: w && typeof w.size === 'number' && Number.isInteger(w.size) && w.size >= 2 && w.size <= 4 ? { size: w.size } : null,
    last: l && ok(l.outcome) && typeof l.day === 'string'
      ? {
        day: str(l.day, 20), outcome: l.outcome,
        duels: (Array.isArray(l.duels) ? l.duels : []).filter(ok).slice(0, 4),
        size: typeof l.size === 'number' ? Math.min(4, Math.max(0, Math.floor(l.size))) : 0,
        enemy: str(l.enemy, 24),
      }
      : null,
  };
}

/** O estado da guerra da SUA guilda (2 leituras no servidor; não vem na vista principal). */
export const getGuildWar = (id: string, tz?: PlayerDayAnchor) =>
  guildCall<{ war: unknown }>('guildWar', { params: { id, dayKey: dia(tz) } }).then(r => sanitizeWar(r.war));

/** Procurar uma guilda rival do MESMO tamanho. O servidor monta os esquadrões, pareia e resolve; o corpo não decide nada. */
export const seekGuildWar = (id: string, tz?: PlayerDayAnchor) =>
  guildCall<{ state?: unknown; war: unknown }>('guildWarSeek', { method: 'POST', body: { id, dayKey: dia(tz) } }).then(r => ({
    state: (['small', 'already', 'waiting', 'done'] as const).find(x => x === r.state) ?? 'waiting',
    war: sanitizeWar(r.war),
  }));

/** O que há para colher: semanas com direito (`pending`), os cenários já liberados e a peça da maré. */
export interface GuildRewards {
  pending: Array<{ week: string; outcome: 'dissipada' | 'recuou'; emblems: number }>;
  scenes: string[];
  trophyOwned: boolean;
  trophyId: string | null;
}

export interface GuildClaim {
  week: string;
  outcome: 'dissipada' | 'recuou';
  emblems: number;
  trophy: boolean;
  trophyId: string | null;
  /** Determinístico por (conta, semana): o cliente credita UMA vez por recibo. */
  receipt: string;
}

const intIn = (v: unknown, min: number, max: number) => (typeof v === 'number' && Number.isInteger(v) ? Math.min(max, Math.max(min, v)) : min);

export function sanitizeRewards(raw: unknown): GuildRewards {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const pending = (Array.isArray(r.pending) ? r.pending : []).flatMap(p => {
    const x = (p && typeof p === 'object' ? p : {}) as Record<string, unknown>;
    if (typeof x.week !== 'string' || (x.outcome !== 'dissipada' && x.outcome !== 'recuou')) return [];
    return [{ week: x.week.slice(0, 20), outcome: x.outcome as 'dissipada' | 'recuou', emblems: intIn(x.emblems, 0, 20) }];
  }).slice(0, 4);
  const scenes = (Array.isArray(r.scenes) ? r.scenes : []).filter((s): s is string => typeof s === 'string' && /^bg-guild-[a-z-]{1,20}$/.test(s)).slice(0, 8);
  return { pending, scenes, trophyOwned: r.trophyOwned === true, trophyId: typeof r.trophyId === 'string' ? r.trophyId.slice(0, 40) : null };
}

/** Resgates pendentes. Sem guilda, ainda devolve os cenários já liberados (ficam com quem sai). */
export const getGuildRewards = (id: string, tz?: PlayerDayAnchor) =>
  guildCall<{ rewards?: unknown }>('guildRewards', { params: { id, dayKey: dia(tz) } }).then(r => sanitizeRewards(r.rewards));

/**
 * O `claimed` do servidor (200 e 409) vira o tipo estreito, ou `null` se faltar o recibo.
 * `week` é conferida contra a semana pedida quando o chamador a informa (o 409 pode vir sem ela).
 */
export function sanitizeClaim(raw: unknown, week?: string): GuildClaim | null {
  const c = (raw && typeof raw === 'object' ? raw : null) as Record<string, unknown> | null;
  if (!c || typeof c.receipt !== 'string' || !c.receipt || typeof c.week !== 'string' || (week !== undefined && c.week !== week)) return null;
  return {
    week: c.week.slice(0, 20),
    outcome: c.outcome === 'dissipada' ? 'dissipada' : 'recuou',
    emblems: intIn(c.emblems, 0, 20),
    trophy: c.trophy === true,
    trophyId: typeof c.trophyId === 'string' ? c.trophyId.slice(0, 40) : null,
    receipt: c.receipt.slice(0, 80),
  };
}

/**
 * Colher UMA semana. 404 `nothingToClaim` vira erro tipado (SILÊNCIO). 409 `alreadyClaimed` também, MAS
 * traz `error.claim`: se a resposta do 200 se perdeu na rede, o direito já foi gravado e é o 409 que
 * devolve o recibo — a folha credita por ele (uma vez por recibo).
 */
export const claimGuildReward = (id: string, week: string, tz?: PlayerDayAnchor): Promise<GuildClaim> =>
  guildCall<{ claimed?: unknown }>('guildClaim', { method: 'POST', body: { id, dayKey: dia(tz), week } }).then(r => {
    const c = sanitizeClaim(r.claimed, week);
    if (!c) throw new GuildError('server', 200);
    return c;
  });
