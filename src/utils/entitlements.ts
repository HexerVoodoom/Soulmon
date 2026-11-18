import { STORAGE_KEYS } from './storageKeys';
import { authHeaders } from './auth';
import { readLocal } from './safeStorage';
import { chaveDeOp, confirmarOpId, opIdPendente, pendentesComPrefixo, respostaDefinitiva } from './pendingOpId';
import { sanitizeOwnedWidgetFrames, setPaidWidgetFramesFromEntitlement } from './widgetFrames';

// Entitlements no CLIENTE — espelho somente-leitura do que o servidor decidiu.
//
// Nada aqui é autoritativo: `credits` e `accountTier` no GameState existem só
// para a UI ter o que desenhar. Quem manda é functions/api/_entitlements.js.
// Toda operação que MEXE em saldo (gastar, ganhar por anúncio, comprar) passa
// pelo servidor e a resposta dele é que atualiza a tela.

export interface Entitlement {
  tier: 'demo' | 'paid';
  credits: number;
  adsLeft: number;
  /** Anúncio recompensado só existe quando o servidor confirma que a
   *  verificação do AdMob está configurada — ver functions/api/entitlements.js. */
  adsEnabled?: boolean;
  /** Conta de administrador/GM (29/09/2026). Decidido SÓ pelo servidor
   *  (`functions/api/_admin.js`); aqui é sempre booleano — `sanitizeEntitlement`
   *  só aceita `=== true`. Nunca vai para o save nem para o localStorage
   *  (`utils/adminFlag.ts`). */
  admin: boolean;
  /** BETA-FULL (18/10/2026): e-mail da allowlist `BETA_EMAILS` = plano pago sem compra. Decidido SÓ pelo servidor
   *  (`functions/api/_betaFull.js`, derivado do token); aqui só `=== true` conta. Não vai para o save nem para o
   *  localStorage. O `tier` já vem `paid` — a flag só serve para a UI saber que NÃO há compra a restaurar/cobrar. */
  betaFull?: boolean;
  /** Assinatura cosmética (D10): a vitrine do trimestre está aberta? Vem SÓ do
   *  servidor (que perguntou à Google) e só destrava a vitrine — nunca regra de
   *  jogo (guard: src/security/subscriptionBoundary.contract.test.ts). Ausente
   *  = conta que nunca assinou. */
  subActive?: boolean;
  /** Fim do período atual (epoch ms), como a Google informou. Só para a UI dizer a data. */
  subUntil?: number;
  /** Molduras do widget V-Pet COMPRADAS (ids de elemento base; só o servidor escreve). Ausente = nenhuma. Cosmético. */
  frames?: string[];
  /** §482: itens de decoração ganhos como prêmio de ranking (ids; só o servidor escreve). O cliente põe no save com `grantGuildTrophy`. */
  itemPrizes?: string[];
  /** §373: Bits que ainda cabem na troca de HOJE. Ausente = a conta não trocou hoje (dia inteiro livre). Campo antigo, segue lido. */
  bitsPackLeft?: number;
  /** §386: o que cabe hoje no dia do JOGADOR (o servidor manda sempre) e o instante em que esse dia vira (ms). */
  bitsLeftToday?: number;
  bitsResetAt?: number;
}

/** Normaliza a resposta do GET: `admin` só é true com o literal `true`. */
export function sanitizeEntitlement(raw: unknown): Entitlement | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  return {
    tier: r.tier === 'paid' ? 'paid' : 'demo',
    credits: typeof r.credits === 'number' && Number.isFinite(r.credits) ? r.credits : 0,
    adsLeft: typeof r.adsLeft === 'number' && Number.isFinite(r.adsLeft) ? r.adsLeft : 0,
    ...(typeof r.adsEnabled === 'boolean' ? { adsEnabled: r.adsEnabled } : {}),
    admin: r.admin === true,
    ...(r.betaFull === true ? { betaFull: true } : {}),
    ...(typeof r.subActive === 'boolean' ? { subActive: r.subActive } : {}),
    ...(sanitizeOwnedWidgetFrames(r.frames).length ? { frames: sanitizeOwnedWidgetFrames(r.frames) } : {}),
    ...(Array.isArray(r.itemPrizes) && r.itemPrizes.some(x => typeof x === 'string') ? { itemPrizes: r.itemPrizes.filter((x): x is string => typeof x === 'string').slice(0, 20) } : {}),
    ...(typeof r.subUntil === 'number' && Number.isFinite(r.subUntil) && r.subUntil > 0 ? { subUntil: r.subUntil } : {}),
    ...(typeof r.bitsPackLeft === 'number' && Number.isFinite(r.bitsPackLeft) && r.bitsPackLeft >= 0 ? { bitsPackLeft: Math.floor(r.bitsPackLeft) } : {}),
    ...(typeof r.bitsLeftToday === 'number' && Number.isFinite(r.bitsLeftToday) && r.bitsLeftToday >= 0 ? { bitsLeftToday: Math.floor(r.bitsLeftToday) } : {}),
    ...(typeof r.bitsResetAt === 'number' && Number.isFinite(r.bitsResetAt) && r.bitsResetAt > 0 ? { bitsResetAt: r.bitsResetAt } : {}),
  };
}

function currentSaveId(): string | null {
  return readLocal(STORAGE_KEYS.SAVE_ID);
}

/** Lê o saldo real do servidor. Retorna null se não der (offline, sem saveId). */
export async function fetchEntitlement(): Promise<Entitlement | null> {
  const id = currentSaveId();
  if (!id) return null;
  try {
    const res = await fetch(`/api/entitlements?id=${encodeURIComponent(id)}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) return null;
    const ent = sanitizeEntitlement(await res.json());
    if (ent) noteBitsPackLeft(ent.bitsLeftToday ?? ent.bitsPackLeft ?? null, ent.bitsResetAt);
    return ent;
  } catch {
    return null;
  }
}

/**
 * BETA-FULL antes de o save existir (tela do ovo no onboarding: o saveId ainda é aleatório e `fetchEntitlement` seria
 * recusado). Só o token do login decide, no servidor. Falha/offline/sem login = false (nunca libera por engano).
 */
export async function fetchBetaFull(): Promise<boolean> {
  try {
    const res = await fetch('/api/entitlements?action=beta-full', { headers: await authHeaders() });
    if (!res.ok) return false;
    return (await res.json())?.betaFull === true;
  } catch {
    return false;
  }
}

/**
 * WP5.3 — um id por GESTO. Antislop P6 (§378): o GESTO dura até o servidor dar a resposta definitiva, não só uma chamada.
 * Sem `opId` explícito, o id vem de `opIdPendente` (conta + operação + item) e é reusado no toque seguinte quando a resposta se
 * perdeu; `fecharGesto` o libera em sucesso ou recusa definitiva. Quem passa `opId` cuida dele sozinho (nada fica pendente).
 */
function abrirGesto(saveId: string, operacao: string, item: string, opIdExplicito?: string) {
  const chave = opIdExplicito ? null : chaveDeOp(saveId, operacao, item);
  const opId = opIdExplicito ?? opIdPendente(chave as string);
  return {
    opId,
    /** Resposta do servidor: sucesso (`ok`) ou recusa definitiva encerram o gesto; rede/5xx/busy mantêm o id para o próximo toque. */
    fechar(status: number, ok: boolean, reason?: unknown) {
      if (chave && ((status >= 200 && status < 300 && ok) || respostaDefinitiva(status, reason))) confirmarOpId(chave, opId);
    },
  };
}

/**
 * O saldo que uma operação (`spend`/`buy-essence`/`buy-bits`) devolveu. `undefined` quando `tier` ou `credits` faltam ou vêm
 * inválidos: quem chama NÃO grava saldo nesse caso (inventar `credits: 0`/`'demo'` zeraria a tela de quem tem saldo, §381).
 */
function entDaResposta(data: unknown): Entitlement | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const r = data as Record<string, unknown>;
  if ((r.tier !== 'paid' && r.tier !== 'demo') || typeof r.credits !== 'number' || !Number.isFinite(r.credits)) return undefined;
  return { tier: r.tier, credits: r.credits, adsLeft: typeof r.adsLeft === 'number' && Number.isFinite(r.adsLeft) ? r.adsLeft : 0, admin: r.admin === true };
}

/**
 * Gasta créditos NO SERVIDOR. Só aplique o efeito no jogo se isto devolver o
 * novo saldo — null significa recusado (sem saldo, offline) e o efeito não
 * pode acontecer.
 */
export async function spendCredits(
  amount: number,
  reason: string,
  /** WP5.3 — id do GESTO. Repetir o mesmo gesto (retry de rede, dois toques,
   *  aba duplicada) devolve o mesmo resultado em vez de cobrar de novo. Quem
   *  não passa continua funcionando como antes: o id é opcional para não
   *  quebrar o APK já instalado. Sem ele, o id pendente do gesto (`abrirGesto`, §378). */
  opIdExplicito?: string,
): Promise<Entitlement | null> {
  const id = currentSaveId();
  if (!id) return null;
  const gesto = abrirGesto(id, 'spend', `${reason}:${amount}`, opIdExplicito);
  const opId = gesto.opId;
  // QA1: UMA reenvio, com o MESMO `opId`, quando a requisição LANÇOU (a rede
  // caiu e não sabemos se o servidor já debitou). O servidor devolve o
  // resultado guardado em vez de cobrar de novo; sem o reenvio, a resposta
  // perdida virava "Créditos insuficientes" com o dinheiro já debitado e o
  // efeito não aplicado. Recusa do servidor (402/4xx) NÃO é reenviada.
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      const res = await fetch('/api/entitlements?action=spend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ id, amount, reason, opId }),
      });
      const data = await res.json().catch(() => null);
      // 200 ilegível (inclusive `ok` sem saldo legível): conta como falha de rede (reenvia, id mantido). O efeito só sai com o saldo.
      const ent = entDaResposta(data);
      if (res.ok && (data === null || (data.ok === true && !ent))) continue;
      gesto.fechar(res.status, data?.ok === true, data?.reason);
      if (!res.ok) return null;
      return data?.ok ? ent ?? null : null;
    } catch {
      /* rede: tenta de novo uma vez com o mesmo opId */
    }
  }
  return null;
}

export type EssenceBuyResult =
  /** `ent` ausente: o servidor confirmou sem um saldo legível; o estado local de Créditos fica como estava. */
  | { ok: true; ent?: Entitlement; element: string; qty: number; price: number }
  | { ok: false; reason: string };

/**
 * CAMBISTA (§205) — compra essência com Créditos NO SERVIDOR. O preço é decidido lá (composição do elemento); o cliente só aplica
 * as essências quando isto devolve `ok`. Mesmo `opId` em um reenvio (rede caiu) = mesma resposta, sem cobrar de novo.
 */
export async function buyEssence(element: string, qty: number, opIdExplicito?: string): Promise<EssenceBuyResult> {
  const id = currentSaveId();
  if (!id) return { ok: false, reason: 'no-save' };
  const gesto = abrirGesto(id, 'essence', `${element}:${qty}`, opIdExplicito);
  const opId = gesto.opId;
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      const res = await fetch('/api/entitlements?action=buy-essence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ id, element, qty, opId }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data === null) continue; // 200 ilegível: o servidor pode ter cobrado; reenvia com o MESMO opId (replay sem cobrar de novo)
      gesto.fechar(res.status, data?.ok === true, data?.reason);
      if (!res.ok || !data?.ok) return { ok: false, reason: typeof data?.reason === 'string' ? data.reason : 'error' };
      const ent = entDaResposta(data);
      return { ok: true, element: data.element, qty: data.qty, price: data.price, ...(ent ? { ent } : {}) };
    } catch { /* rede: uma nova tentativa com o MESMO opId */ }
  }
  return { ok: false, reason: 'network' };
}

// ── PACOTES DE BITS (§373) ───────────────────────────────────────────────────

/**
 * O que ainda cabe na troca de hoje, como o SERVIDOR disse da última vez (só para a tela; quem decide é o servidor). Vale até
 * `bitsResetAt`, a meia-noite do JOGADOR que o servidor calculou (§386, A3); sem ela (servidor antigo) vale até a virada do dia
 * UTC, como antes. Passou do prazo, volta a "não sei" (`null`) e a tela mostra o teto cheio. Fora do save de propósito: não é dado
 * do jogador, é um eco da última resposta.
 */
let bitsPackLeftEcho: { until: number; left: number } | null = null;
const bitsPackListeners = new Set<() => void>();
const fimDoDiaUtc = (agora: number) => (Math.floor(agora / 86_400_000) + 1) * 86_400_000;

export function noteBitsPackLeft(left: number | null, resetAt?: number): void {
  const agora = Date.now();
  const until = typeof resetAt === 'number' && Number.isFinite(resetAt) && resetAt > agora ? resetAt : fimDoDiaUtc(agora);
  bitsPackLeftEcho = typeof left === 'number' && Number.isFinite(left) ? { until, left: Math.max(0, Math.floor(left)) } : null;
  bitsPackListeners.forEach(l => l());
}

/** `null` = o servidor não disse nada para o dia de hoje (até onde este aparelho sabe, o dia inteiro está livre). */
export function bitsPackLeftToday(): number | null {
  return bitsPackLeftEcho && Date.now() < bitsPackLeftEcho.until ? bitsPackLeftEcho.left : null;
}

export function subscribeBitsPackLeft(listener: () => void): () => void {
  bitsPackListeners.add(listener);
  return () => { bitsPackListeners.delete(listener); };
}

export type BitsPackBuyResult =
  /**
   * `ent` ausente: o servidor confirmou sem um saldo legível; o estado local de Créditos fica como estava.
   * `confirmar` (§386, A2): o gesto só fecha DEPOIS de os Bits entrarem no estado. Quem credita chama `confirmar()` num efeito
   * pós-commit; até lá o opId segue pendente (o app morto no meio ainda tem replay) e o mesmo pacote não abre outro pedido.
   */
  | { ok: true; ent?: Entitlement; pack: string; bits: number; price: number; leftToday: number; confirmar: () => void }
  | { ok: false; reason: string; leftToday?: number };

/** Âncora do dia do jogador (`gameState.playerDayTz`): o teto de 1.000/dia vira à meia-noite DELE (§386, A3). */
export interface BitsDayTz { zone?: string; offsetMs?: number }

/** `zone`/`off` do corpo do pedido (a mesma forma do Treino, `community.ts`). Sem âncora, nada vai: o servidor usa a dele (ou UTC). */
function tzDoPedido(tz?: BitsDayTz): { zone?: string; off?: number } {
  if (!tz) return {};
  const off = typeof tz.offsetMs === 'number' && Number.isFinite(tz.offsetMs) ? tz.offsetMs : undefined;
  const zone = typeof tz.zone === 'string' && tz.zone.length > 0 ? tz.zone : undefined;
  if (!zone && off === undefined) return {};
  return { ...(zone ? { zone } : {}), off: off ?? -new Date().getTimezoneOffset() * 60_000 };
}

/**
 * Pacotes cujo pedido está NO AR ou cujos Bits ainda não foram confirmados no estado (§386). Fecha a corrida "o boot reenvia o
 * pendente com `replayOnly` enquanto o jogador toca o MESMO pacote": os dois receberiam o replay e os Bits entrariam duas vezes.
 */
const bitsEmAndamento = new Set<string>();

/**
 * Compra um PACOTE DE BITS com Créditos NO SERVIDOR (`POST /api/entitlements?action=buy-bits`). O servidor decide os Bits do
 * pacote, debita os Créditos e conta o teto de 1.000/dia; o cliente só credita os `bits` desta resposta, e só com `ok`.
 * Mesmo `opId` num reenvio (a rede caiu sem resposta) = mesmo resultado, sem cobrar de novo. Recusa do servidor não é reenviada.
 */
export async function buyBitsPack(packId: string, opIdExplicito?: string, tz?: BitsDayTz): Promise<BitsPackBuyResult> {
  const id = currentSaveId();
  if (!id) return { ok: false, reason: 'no-save' };
  const trava = opIdExplicito ? null : chaveDeOp(id, 'bits', packId);
  if (trava && bitsEmAndamento.has(trava)) return { ok: false, reason: 'busy' };
  if (trava) bitsEmAndamento.add(trava);
  const soltar = () => { if (trava) bitsEmAndamento.delete(trava); };
  const gesto = abrirGesto(id, 'bits', packId, opIdExplicito);
  const opId = gesto.opId;
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      const res = await fetch('/api/entitlements?action=buy-bits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ id, pack: packId, opId, ...tzDoPedido(tz) }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data === null) continue; // 200 ilegível: o servidor pode ter cobrado; reenvia com o MESMO opId (replay sem cobrar de novo)
      const left = notarRestanteDaResposta(data);
      if (res.ok && data?.ok) {
        const bits = Number(data.bits);
        // `ok` sem Bits legíveis: o servidor PODE ter debitado; o id fica pendente (o próximo toque ou a reabertura pegam o replay).
        if (!Number.isInteger(bits) || bits <= 0) { soltar(); return { ok: false, reason: 'error' }; }
        const ent = entDaResposta(data);
        let feito = false;
        const confirmar = () => { if (feito) return; feito = true; gesto.fechar(200, true); soltar(); };
        return { ok: true, pack: String(data.pack), bits, price: Number(data.price) || 0, leftToday: left ?? 0, confirmar, ...(ent ? { ent } : {}) };
      }
      gesto.fechar(res.status, false, data?.reason);
      soltar();
      return { ok: false, reason: typeof data?.reason === 'string' ? data.reason : 'error', ...(left !== undefined ? { leftToday: left } : {}) };
    } catch { /* rede: uma nova tentativa com o MESMO opId */ }
  }
  soltar();
  return { ok: false, reason: 'network' };
}

/** Lê `bitsLeftToday`/`leftToday` (+ `bitsResetAt`) de uma resposta do buy-bits e atualiza o eco da tela. */
function notarRestanteDaResposta(data: unknown): number | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const r = data as Record<string, unknown>;
  const bruto = typeof r.bitsLeftToday === 'number' ? r.bitsLeftToday : r.leftToday;
  if (typeof bruto !== 'number' || !Number.isFinite(bruto)) return undefined;
  const left = Math.max(0, Math.floor(bruto));
  noteBitsPackLeft(left, typeof r.bitsResetAt === 'number' ? r.bitsResetAt : undefined);
  return left;
}

/** Um pacote de Bits que o servidor JÁ tinha entregue e a rede escondeu (§386): credite `bits` e chame `confirmar()` depois do commit. */
export interface BitsPackReplay { pack: string; bits: number; ent?: Entitlement; confirmar: () => void }

/**
 * REENVIA os pacotes de Bits PENDENTES desta conta com `replayOnly` (§386, A1). Cenário: a rede caiu depois do débito, o app foi
 * reaberto, os Créditos já caíram e o botão do pacote pode nem estar ao alcance; sem isto o opId vencia em 24 h sem nunca entregar
 * os Bits. Pedido atendido = o replay (Bits uma vez, `confirmar` fecha o pendente); `no-op` (o servidor nunca atendeu: nada foi
 * cobrado) e recusa definitiva fecham na hora; rede/5xx/`busy` mantêm para a próxima tentativa.
 */
export async function recoverPendingBitsBuys(tz?: BitsDayTz): Promise<BitsPackReplay[]> {
  const id = currentSaveId();
  if (!id) return [];
  const prefixo = chaveDeOp(id, 'bits', '');
  const achados: BitsPackReplay[] = [];
  for (const p of pendentesComPrefixo(prefixo)) {
    if (bitsEmAndamento.has(p.chave)) continue;
    bitsEmAndamento.add(p.chave);
    let segura = false;
    try {
      const res = await fetch('/api/entitlements?action=buy-bits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({ id, pack: p.item, opId: p.op, replayOnly: true, ...tzDoPedido(tz) }),
      });
      const data = await res.json().catch(() => null);
      notarRestanteDaResposta(data);
      const bits = Number(data?.bits);
      if (res.ok && data?.ok === true && Number.isInteger(bits) && bits > 0) {
        const ent = entDaResposta(data);
        let feito = false;
        segura = true;
        achados.push({
          pack: String(data.pack), bits, ...(ent ? { ent } : {}),
          confirmar: () => { if (feito) return; feito = true; confirmarOpId(p.chave, p.op); bitsEmAndamento.delete(p.chave); },
        });
      } else if (!res.ok && respostaDefinitiva(res.status, data?.reason)) {
        confirmarOpId(p.chave, p.op);
      }
    } catch { /* rede: o pendente fica para a próxima abertura */ }
    if (!segura) bitsEmAndamento.delete(p.chave);
  }
  return achados;
}

/** Credita a recompensa do anúncio (o teto diário é aplicado no servidor). */
export async function claimAdReward(): Promise<Entitlement | null> {
  const id = currentSaveId();
  if (!id) return null;
  try {
    const res = await fetch('/api/entitlements?action=ad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.ok ? { tier: data.tier, credits: data.credits, adsLeft: data.adsLeft, admin: data.admin === true } : null;
  } catch {
    return null;
  }
}

/**
 * 🥚 #62 — ZERA O TETO VITALÍCIO DE SPRITE NO RENASCIMENTO.
 *
 * DECISÃO DO DONO #62 (22/09/2026, `docs/PERGUNTAS-DO-DONO.md`):
 * *"Rebirth: **zerar `aiLifetime.sprite`** no renascimento"*.
 *
 * O contador vitalício mora no SERVIDOR (`ent:<saveId>.aiLifetime.sprite`,
 * `functions/api/_aiGuard.js`) e não pode morar em outro lugar: o cliente é
 * editável, e um teto de geração de imagem no save do jogador é um teto que
 * não existe. Por isso o renascimento — que é do cliente — precisa PEDIR.
 *
 * A rota confere sozinha que o renascimento aconteceu (lê `state.rebirth` do
 * save do titular) e é idempotente (`rebirthSpriteResetAt`), então esta
 * chamada não carrega autoridade nenhuma: ela só avisa.
 *
 * ⚠️ Falha aqui **não pode bloquear o renascimento**. O renascimento é uma vez
 * só na vida do save; perdê-lo por um 500 de rede seria trocar um teto de
 * custo por um dano irreversível ao jogador. Devolve `false` em silêncio e o
 * jogador segue — o pior caso é ele gerar menos sprites do que a decisão
 * concede, e a rota continua idempotente para um retry futuro.
 */
export async function resetSpriteLifetimeAfterRebirth(): Promise<boolean> {
  const id = currentSaveId();
  if (!id) return false;
  try {
    const res = await fetch('/api/entitlements?action=rebirth-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.ok;
  } catch {
    return false;
  }
}

/**
 * Manda um purchaseToken da Google Play para o servidor verificar. Só o
 * servidor decide se a compra vale — aqui só repassamos e lemos o resultado.
 */
export async function verifyPurchase(productId: string, purchaseToken: string): Promise<
  { ok: true; ent: Entitlement; consumeToken?: string } | { ok: false; reason: string }
> {
  const id = currentSaveId();
  if (!id) return { ok: false, reason: 'no-save-id' };
  try {
    const res = await fetch('/api/billing?action=verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ id, productId, purchaseToken }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      return { ok: false, reason: data.reason || `http-${res.status}` };
    }
    const ent = sanitizeEntitlement(data) ?? { tier: data.tier, credits: data.credits, adsLeft: data.adsLeft, admin: data.admin === true };
    // Toda compra confirmada (nova, reconciliada ou restaurada) passa por aqui: as molduras do widget V-Pet acompanham o servidor.
    setPaidWidgetFramesFromEntitlement(ent);
    return { ok: true, ent, consumeToken: data.consumeToken };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
