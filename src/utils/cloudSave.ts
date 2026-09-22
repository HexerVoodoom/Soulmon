// Derive a stable save id from an email so the same email = the same cloud
// save on any device, no manual code copying. Matches the server's VALID_ID
// regex (^[a-zA-Z0-9_-]{8,64}$): we return 32 hex chars.
//
// The salt namespaces the hash to THIS product. The KV still points at the
// namespace inherited from the fork — the BINDING name stopped being a
// constraint on 2026-09-07 (`functions/api/_kv.js` accepts both), but the
// underlying namespace is still shared until the owner splits it in the
// Cloudflare dashboard. With a shared "digiapp:" salt the same email hashed to
// the SAME key in both products; "soulmon:" makes the two derive different
// keys even while the raw storage is shared. Locked, behaviourally, by
// `functions/api/saveId.parity.test.js` — three implementations, three deploy
// cycles, one rule.
import { authHeaders } from './auth';
import { STORAGE_KEYS, RECONCILE_KEYS } from './storageKeys';
import { writeLocal, readLocal, removeLocal } from './safeStorage';

export async function emailToSaveId(email: string): Promise<string> {
  const norm = email.trim().toLowerCase();
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`soulmon:${norm}`));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

// ---------------------------------------------------------------------------
// R-3 — O CAMINHO DE ERRO TIPADO.
//
// `cloudSave` devolvia `boolean`. 401, 403, 409, 412, 413, 5xx e "offline"
// colapsavam todos em `false`, e o único chamador real
// (`GameStateContext.tsx`) nem lia o retorno. O risco medido no preparo da
// fatia 1 (§A.3.3) NÃO é conflito — é **save perdido sem ninguém ver**: o
// servidor recusa o dia inteiro e a única pista é um `console.warn`.
//
// Cada código vira uma CLASSE nomeada, e cada classe carrega — por código, não
// na cabeça de quem chama — as duas decisões que importam: retentar, e avisar.
//
// O 409 aparece aqui como classe de propósito. O `revision` que o produz é da
// FATIA 1 e não está implementado nesta frente; o que está pronto é o caminho
// por onde ele vai chegar.
// ---------------------------------------------------------------------------

export type CloudSaveFailureKind =
  | 'offline'    // a requisição nem saiu (rede, DNS, CORS) — status 0
  | 'auth'       // 401: sem token válido
  | 'identity'   // 403: o token é bom, mas o saveId local não é o do e-mail
  | 'conflict'   // 409: outro aparelho escreveu antes (fatia 1)
  | 'stale'      // 412: pré-condição falhou; o cliente está atrasado
  | 'too-large'  // 413: o save passou do teto do servidor
  | 'deleted'    // 410 `account-deleted`: a conta foi excluída (tombstone de 30 d no servidor)
  | 'server'     // 5xx: o servidor caiu, o save continua válido
  | 'client';    // 4xx restante: o cliente mandou algo que o servidor recusa

export interface CloudSavePolicy {
  /** Reenviar o MESMO corpo tem chance real de mudar o resultado? */
  retentavel: boolean;
  /** O jogador precisa saber, ou isto se resolve sozinho? */
  avisaJogador: boolean;
}

export const CLOUD_SAVE_POLICY: Record<CloudSaveFailureKind, CloudSavePolicy> = {
  // A rede volta sozinha, e o save local já está persistido. Avisar a cada
  // oscilação de sinal seria ruído que ensina o jogador a ignorar o aviso.
  offline: { retentavel: true, avisaJogador: false },
  // O SDK do Firebase renova o token de hora em hora sozinho; uma retentativa
  // pega a renovação. Se insistir, é sessão morta e só o login conserta.
  auth: { retentavel: true, avisaJogador: true },
  // 403 é o `saveId` local errado (§B.2.2, Classe 1). Reenviar dá 403 de novo,
  // e re-login TAMBÉM não conserta — quem conserta é `reconcileSaveId`.
  identity: { retentavel: false, avisaJogador: true },
  // Retentar um 409 sem reconciliar é o loop que se auto-alimenta (R-1). Quem
  // resolve conflito é a reconciliação da fatia 1, não o backoff.
  conflict: { retentavel: false, avisaJogador: false },
  stale: { retentavel: false, avisaJogador: true },
  // Reenviar os mesmos bytes grandes dá o mesmo 413. Só o jogador pode agir.
  'too-large': { retentavel: false, avisaJogador: true },
  // 410: a conta foi apagada (neste ou em outro aparelho). Reenviar o save
  // recriaria o que a pessoa mandou apagar; o caminho é PARAR — limpar o save
  // local, deslogar e voltar ao portão (`reagirContaExcluida`). Sem retry.
  deleted: { retentavel: false, avisaJogador: true },
  server: { retentavel: true, avisaJogador: false },
  client: { retentavel: false, avisaJogador: true },
};

/** `status: 0` é o nosso código para "a requisição não chegou a sair". */
export function classifyCloudSaveStatus(status: number): CloudSaveFailureKind {
  if (status === 0) return 'offline';
  if (status === 401) return 'auth';
  if (status === 403) return 'identity';
  if (status === 409) return 'conflict';
  if (status === 412) return 'stale';
  if (status === 413) return 'too-large';
  if (status === 410) return 'deleted';
  if (status >= 500) return 'server';
  return 'client';
}

export interface CloudSaveFailure extends CloudSavePolicy {
  ok: false;
  kind: CloudSaveFailureKind;
  status: number;
}
export type CloudSaveOutcome = { ok: true } | CloudSaveFailure;

function falha(status: number): CloudSaveFailure {
  const kind = classifyCloudSaveStatus(status);
  return { ok: false, kind, status, ...CLOUD_SAVE_POLICY[kind] };
}

/** Mensagem PT/EN do portão depois de uma conta excluída (adendo 11, 21/09/2026). */
export function mensagemContaExcluida(pt: boolean): string {
  return pt
    ? 'Esta conta foi excluída neste ou em outro aparelho.'
    : 'This account was deleted on this or another device.';
}

/**
 * O servidor respondeu 410 `account-deleted`: a conta não existe mais e o
 * aparelho ainda tem o save dela. Continuar sincronizando recriaria no KV o
 * que a pessoa pediu para apagar (e o tombstone recusa mesmo). Aqui se PARA:
 * apaga o save local e a identidade, desloga e volta ao portão — a mensagem
 * fica gravada para o portão mostrar depois do reload. Idempotente; nunca
 * lança; `recarregar` é injetável para teste.
 */
let contaExcluidaTratada = false;
export async function reagirContaExcluida(opts: { recarregar?: () => void } = {}): Promise<void> {
  if (contaExcluidaTratada) return;
  contaExcluidaTratada = true;
  try {
    const pt = (readLocal(STORAGE_KEYS.LANGUAGE) ?? '').toLowerCase().startsWith('pt');
    writeLocal(STORAGE_KEYS.ACCOUNT_DELETED_NOTICE, mensagemContaExcluida(pt), { silent: true });
    removeLocal(STORAGE_KEYS.GAME_STATE, { silent: true });
    removeLocal(STORAGE_KEYS.SAVE_ID, { silent: true });
    removeLocal(STORAGE_KEYS.LAST_CLOUD_SYNC, { silent: true });
    removeLocal(STORAGE_KEYS.USER_EMAIL, { silent: true });
    try {
      const { signOut } = await import('./auth');
      await signOut();
    } catch { /* sem sessão para encerrar */ }
  } finally {
    const recarregar = opts.recarregar ?? (() => { try { globalThis.location?.reload(); } catch { /* sem window */ } });
    recarregar();
  }
}
/** Só para teste. */
export function __resetContaExcluida(): void { contaExcluidaTratada = false; }

/**
 * Envia o save para a nuvem. `ok: true` só quando o SERVIDOR confirmou.
 *
 * O carimbo `soulmon-last-cloud-sync` é o que o app mostra como "sincronizado":
 * gravá-lo sem checar `res.ok` fazia o app afirmar que o progresso estava na
 * nuvem depois de um 401 (token expirado), 403 ou 500 — o jogador trocava de
 * aparelho confiando nisso e perdia tudo. Falhou = não carimba, e quem chama
 * recebe a CLASSE do erro (não mais um `false` mudo) para decidir.
 */
export async function cloudSave(saveId: string, state: unknown): Promise<CloudSaveOutcome> {
  try {
    const res = await fetch(`/api/save?id=${saveId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ state }),
    });
    if (!res.ok) {
      console.warn('cloudSave: servidor recusou o save', {
        status: res.status,
        classe: classifyCloudSaveStatus(res.status),
      });
      return falha(res.status);
    }
    // `writeLocal`, não `setItem` cru: com o storage cheio o `setItem` lançava
    // DENTRO deste try e o `catch` devolvia falha — o servidor tinha aceitado
    // o save e o app relatava erro. O carimbo é conveniência; o resultado da
    // gravação na nuvem é o que a função promete.
    writeLocal(STORAGE_KEYS.LAST_CLOUD_SYNC, new Date().toISOString());
    return { ok: true };
  } catch {
    // Local save já persistido; a requisição nem saiu.
    return falha(0);
  }
}

// ---------------------------------------------------------------------------
// R-2 — ORÇAMENTO DE RETRY POR `saveId`, COM TETO E JANELA.
//
// O erro que este desenho evita está escrito no preparo (§A.3.3, R-2): um teto
// "3 tentativas" POR CHAMADA, com ~14 chamadas de save por dia geradas por
// gesto (§A.2.3), vira 42 requisições autenticadas/dia. Sob 401 ou 5xx
// permanente isso não é retry — é uma tempestade contra o Firebase e contra o
// próprio Pages, gerada pelo jogador que está só jogando.
//
// O orçamento é do SAVE, não da chamada: `CLOUD_SAVE_RETRY_TETO` retentativas
// por `CLOUD_SAVE_RETRY_JANELA_MS`, não importa quantas vezes o debounce
// disparar. Cada chamada nova sempre tenta UMA vez (o estado mudou, é dado
// novo); o que o orçamento raciona é a INSISTÊNCIA sobre a mesma falha.
//
// Sucesso devolve o orçamento: uma queda de rede de 30 s não pode penalizar o
// resto do dia.
// ---------------------------------------------------------------------------

export const CLOUD_SAVE_RETRY_TETO = 3;
export const CLOUD_SAVE_RETRY_JANELA_MS = 10 * 60_000;
/** Backoff da ADR §3. A última entrada é o teto — não volta a encolher. */
export const CLOUD_SAVE_RETRY_BACKOFF_MS = [2000, 8000, 30000];

const orcamentos = new Map<string, { gasto: number; janelaEm: number }>();

/** Só para teste: zera o estado de módulo entre casos. */
export function __resetRetryBudgets(): void {
  orcamentos.clear();
}

/**
 * Consome uma retentativa do `saveId`. Devolve o atraso a esperar, ou `null`
 * quando o orçamento da janela acabou.
 */
function consumirRetry(saveId: string, agora: number): number | null {
  const atual = orcamentos.get(saveId);
  const vivo = atual && agora - atual.janelaEm < CLOUD_SAVE_RETRY_JANELA_MS
    ? atual
    : { gasto: 0, janelaEm: agora };
  if (vivo.gasto >= CLOUD_SAVE_RETRY_TETO) {
    orcamentos.set(saveId, vivo);
    return null;
  }
  const atraso = CLOUD_SAVE_RETRY_BACKOFF_MS[
    Math.min(vivo.gasto, CLOUD_SAVE_RETRY_BACKOFF_MS.length - 1)
  ];
  orcamentos.set(saveId, { gasto: vivo.gasto + 1, janelaEm: vivo.janelaEm });
  return atraso;
}

export interface CloudSaveRetryOpts {
  /** Injetável para o teste não gastar 40 s de relógio real. */
  esperar?: (ms: number) => Promise<void>;
  agora?: () => number;
}

const esperaReal = (ms: number) => new Promise<void>(r => { setTimeout(r, ms); });

/**
 * `cloudSave` com a política aplicada: retenta o que a tabela diz ser
 * retentável, dentro do orçamento do `saveId`, e devolve o resultado FINAL.
 *
 * ⚠️ **R-1:** esta função nunca toca o estado do jogo. O corpo enviado é o
 * snapshot recebido, e continua o mesmo em toda retentativa. Quem chama também
 * não pode reagir chamando `setGameState` — o efeito de save depende de
 * `[gameState]`, então isso reiniciaria o debounce e reagendaria o POST que
 * falhou, com cada gesto do jogador acelerando o ciclo.
 */
export async function cloudSaveComRetry(
  saveId: string,
  state: unknown,
  opts: CloudSaveRetryOpts = {},
): Promise<CloudSaveOutcome> {
  const esperar = opts.esperar ?? esperaReal;
  const agora = opts.agora ?? Date.now;

  let resultado = await cloudSave(saveId, state);
  while (!resultado.ok && resultado.retentavel) {
    const atraso = consumirRetry(saveId, agora());
    if (atraso === null) break;
    await esperar(atraso);
    resultado = await cloudSave(saveId, state);
  }
  // Devolve o orçamento: só a falha PERSISTENTE precisa ser racionada.
  if (resultado.ok) orcamentos.delete(saveId);
  return resultado;
}

/** Leitura do save da nuvem que distingue "não existe" de "não sei". */
type LeituraNuvem =
  | { estado: 'encontrado'; state: unknown }
  | { estado: 'vazio' }
  | { estado: 'excluida' }
  | { estado: 'indeterminado' };

async function lerNuvem(saveId: string): Promise<LeituraNuvem> {
  try {
    const res = await fetch(`/api/save?id=${saveId}`, { headers: await authHeaders() });
    if (res.status === 410) return { estado: 'excluida' };
    if (!res.ok) return { estado: 'indeterminado' };
    const data = await res.json();
    return data.found ? { estado: 'encontrado', state: data.state } : { estado: 'vazio' };
  } catch {
    return { estado: 'indeterminado' };
  }
}

export async function cloudLoad(saveId: string): Promise<unknown | null> {
  const r = await lerNuvem(saveId);
  // GET também recebe o 410: só reage se ESTE aparelho ainda carrega o save
  // dessa conta — carregar o save de outro id (login) não é "minha conta sumiu".
  if (r.estado === 'excluida' && readLocal(STORAGE_KEYS.SAVE_ID) === saveId) void reagirContaExcluida();
  return r.estado === 'encontrado' ? r.state : null;
}

// ---------------------------------------------------------------------------
// ADOÇÃO DE SAVE DA NUVEM — o único caminho que SUBSTITUI o save inteiro.
//
// Quatro call sites faziam isto à mão (`App.tsx` no onboarding, no "proteger
// progresso", no restaurar e no login por e-mail), todos com `setItem` cru e na
// ordem errada:
//
//   localStorage.setItem(SAVE_ID, novoId);        // pequeno, sempre passa
//   localStorage.setItem(GAME_STATE, gigante);    // ← lança com storage cheio
//   window.location.reload();                     // ← nunca acontece
//
// ⚠️ Este comentário dizia "origem COMPARTILHADA com o DigiApp". Não é mais:
// o `localStorage` é por ORIGEM, e a URL de produção do Soulmon é própria
// desde a migração. A cota é do app, e só dele. O cuidado abaixo continua
// valendo pelo motivo genérico — storage cheio ou bloqueado acontece (aba
// privada, modo estrito, quota estourada por um save grande demais).
// Com o storage cheio ou bloqueado, o
// `QuotaExceededError` subia numa função async passada como prop: rejeição não
// tratada, sem reload, sem mensagem — o botão parecia não fazer nada. E o dano
// não era só cosmético: a IDENTIDADE já tinha trocado sem o dado. O provider
// seguia com o estado ANTIGO e, no próximo `setGameState`, subia esse estado
// antigo para o `saveId` novo — sobrescrevendo, em silêncio, o save do outro
// aparelho. Perda de save é o moat.
//
// Aqui a ordem é invertida (dado primeiro, identidade depois) e nada lança.
// ---------------------------------------------------------------------------

/** `true` só para objeto simples — array/primitivo viram `{}` e apagam tudo. */
function isPlainState(state: unknown): state is Record<string, unknown> {
  return typeof state === 'object' && state !== null && !Array.isArray(state);
}

export type AdoptResult = 'ok' | 'invalid' | 'storage';

/**
 * Grava o save vindo da nuvem e só então troca a identidade local.
 * Nunca lança. Quem chama só deve recarregar a página com `'ok'`.
 */
export function adoptCloudSave(
  saveId: string,
  state: unknown,
  email?: string,
): AdoptResult {
  if (!isPlainState(state)) {
    console.warn('[cloudSave] adoção recusada: state da nuvem não é objeto', {
      type: Array.isArray(state) ? 'array' : typeof state,
    });
    return 'invalid';
  }
  let serialized: string;
  try {
    serialized = JSON.stringify(state);
  } catch {
    return 'invalid';
  }
  // DADO PRIMEIRO. Se isto falhar, a identidade NÃO troca e o jogador continua
  // no save que ele já tinha, em vez de ficar apontado para um save vazio.
  if (!writeLocal(STORAGE_KEYS.GAME_STATE, serialized)) return 'storage';
  writeLocal(STORAGE_KEYS.SAVE_ID, saveId);
  if (email) writeLocal(STORAGE_KEYS.USER_EMAIL, email.trim().toLowerCase());
  return 'ok';
}

// ---------------------------------------------------------------------------
// B-R1 — RE-DERIVAR O `saveId` NO LOGIN.
//
// ## O 403 que re-login não conserta
//
// Quem nunca logou tem `SAVE_ID = crypto.randomUUID()` (`GameStateContext.tsx`
// e `App.tsx`). Esse UUID passa no `VALID_ID` do servidor
// (`^[a-zA-Z0-9_-]{8,64}$`), então hoje funciona. No instante em que a fatia 1
// ligar o `enforced: true`, o servidor vai comparar `emailToSaveId(email)` com
// o UUID, não vai bater, e vai devolver 403 — e a tabela da ADR manda "não
// retenta; força re-login". Só que **re-login não conserta**: o erro não está
// no token, está no `SAVE_ID` gravado no aparelho. É um beco sem saída.
//
// A decisão do dono é re-derivar no login. Esta função é o único lugar onde
// isso acontece, e ela REUSA `emailToSaveId` acima — não reimplementa. Há
// teste de paridade travando três cópias da derivação (cliente, servidor,
// desktop); uma quarta cópia seria o footgun 9.
//
// ## As três decisões de dado, e o porquê de cada uma
//
// **1. Chave derivada vazia → MIGRA.** O estado local é o único que existe:
// reaponta a identidade e sobe. Ninguém perde nada.
//
// **2. Chave derivada ocupada + estado local → a NUVEM ganha, e o local vai
// para backup.** O critério é assimetria de reversão. Sobrescrever a nuvem
// destrói o progresso de OUTRO aparelho de forma irrecuperável — `save.js` faz
// um `put` cego, sem versão e sem histórico. Já "perder" o estado local é
// recuperável, porque aqui ele é copiado byte a byte antes da troca. É a mesma
// decisão que o app já tinha tomado no caminho "proteger progresso"
// (`App.tsx`: "apagar o save antigo de alguém seria bem pior do que perder o
// progresso local recente") — não é regra nova, é a regra existente aplicada
// ao caminho que faltava.
//
// **3. A chave antiga NUNCA é apagada** — nem no aparelho, nem na nuvem. O
// cliente só para de escrever nela e registra o id anterior. O save sob o UUID
// continua na KV até o TTL de 1 ano (`save.js`), de onde uma recuperação
// manual ainda é possível. Apagar dado de jogador como efeito colateral de uma
// migração de identidade é exatamente o que não tem volta.
//
// **4. Nuvem indeterminada (5xx, offline) NÃO migra.** Tratar "não consegui
// ler" como "não existe save lá" faria o cliente sobrescrever o save do outro
// aparelho assim que a rede voltasse. Dúvida não move dado.
// ---------------------------------------------------------------------------

export type ReconcileResult =
  /** O `SAVE_ID` já era o derivado. Nada foi tocado, nem a rede. */
  | { estado: 'sem-mudanca'; saveId: string }
  /** Chave derivada estava vazia: identidade reapontada e estado local subido. */
  | { estado: 'migrado'; saveId: string; anterior: string }
  /** Chave derivada ocupada: save da nuvem adotado, local guardado em backup. */
  | { estado: 'adotado'; saveId: string; anterior: string }
  /** Não deu para saber o que há na nuvem. Nada foi movido — tenta de novo depois. */
  | { estado: 'indeterminado'; saveId: string }
  /** O storage recusou a gravação. A identidade NÃO trocou. */
  | { estado: 'storage'; saveId: string }
  /** Sem e-mail autenticado: não há de onde derivar. */
  | { estado: 'sem-email' };

/**
 * Realinha o `saveId` local com o e-mail autenticado, sem perder progresso.
 *
 * Idempotente e barata no caso comum: para quem já está logado hoje o
 * `SAVE_ID` já é o derivado, e a função sai antes de tocar a rede.
 *
 * Nunca lança.
 */
export async function reconcileSaveId(
  email: string,
  estadoLocal: unknown,
): Promise<ReconcileResult> {
  const norm = email.trim().toLowerCase();
  if (!norm) return { estado: 'sem-email' };

  const derivado = await emailToSaveId(norm);
  const atual = readLocal(STORAGE_KEYS.SAVE_ID);

  // Caminho de quem já está logado: sai aqui, sem rede e sem reescrita.
  if (atual === derivado) return { estado: 'sem-mudanca', saveId: derivado };

  const naNuvem = await lerNuvem(derivado);
  if (naNuvem.estado === 'indeterminado') {
    console.warn('[cloudSave] reconciliação adiada: não deu para ler a chave derivada');
    return { estado: 'indeterminado', saveId: derivado };
  }

  const anterior = atual ?? '';

  if (naNuvem.estado === 'encontrado') {
    // Conflito. Guarda o local ANTES de qualquer troca — se o backup falhar,
    // não trocamos nada, porque a troca passaria a ser destrutiva de verdade.
    const copia = JSON.stringify({
      saveId: anterior,
      salvoEm: new Date().toISOString(),
      state: estadoLocal,
    });
    if (!writeLocal(RECONCILE_KEYS.CONFLICT_BACKUP, copia)) {
      return { estado: 'storage', saveId: derivado };
    }
    // `adoptCloudSave` grava o DADO e só então troca a identidade, e não lança.
    if (adoptCloudSave(derivado, naNuvem.state, norm) !== 'ok') {
      return { estado: 'storage', saveId: derivado };
    }
    writeLocal(RECONCILE_KEYS.PREVIOUS_SAVE_ID, anterior, { silent: true });
    return { estado: 'adotado', saveId: derivado, anterior };
  }

  // Chave derivada vazia: o estado local é o que vale. Aqui não há dado a
  // mover no aparelho — o `GAME_STATE` já é o certo —, então trocar a
  // identidade primeiro é seguro; o que não pode é trocar e não conseguir.
  if (!writeLocal(STORAGE_KEYS.SAVE_ID, derivado)) {
    return { estado: 'storage', saveId: derivado };
  }
  writeLocal(STORAGE_KEYS.USER_EMAIL, norm);
  writeLocal(RECONCILE_KEYS.PREVIOUS_SAVE_ID, anterior, { silent: true });
  // Sobe o progresso que a pessoa já tinha, sob a chave nova. Com retry: esta
  // é a única escrita do fluxo, e perdê-la por um 5xx deixaria a nuvem vazia
  // sob a identidade nova.
  await cloudSaveComRetry(derivado, estadoLocal);
  return { estado: 'migrado', saveId: derivado, anterior };
}
