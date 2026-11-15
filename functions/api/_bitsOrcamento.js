/**
 * ORÇAMENTO DE CRESCIMENTO DE BITS do save (REGISTRO §387; decisão do dono de 14/11/2026: "2 semanas só registrando").
 *
 * MODO OBSERVAÇÃO: este módulo MEDE quanto o `gamePoints` de um POST /api/save cresceu além do que o orçamento explica e devolve
 * um registro para gravar. Ele NUNCA altera o save: o `gamePoints` do cliente segue intacto em hipótese alguma. Em 28/11/2026 o
 * dono decide se o corte liga (`BITS_ORCAMENTO_MODO = 'cortar'`, previsto e SEM código de corte escrito).
 *
 * O orçamento é um TOKEN BUCKET que mora só no servidor, no METADATA da chave do save (como o `f`/`r`/`h` de `save.js`; o cliente
 * não lê nem escreve metadata): `ob` = Bits de folga, `ot` = instante da folga, `g` = o `gamePoints` gravado (evita reparsear
 * o save inteiro para saber o saldo anterior). A folga ganha `BITS_ORCAMENTO_POR_DIA` por dia decorrido até `BITS_ORCAMENTO_TETO`;
 * o crescimento de `gamePoints` sobre o gravado consome a folga; os Bits que o SERVIDOR creditou no período somam à folga da mesma
 * gravação (`creditosDoServidorDesde`). Queda de saldo (gasto) nunca consome nem gera registro. Conta sem estado começa CHEIA.
 *
 * FONTES DAS CONSTANTES (símbolos, não linhas):
 *   · grátis por dia, no cliente: `MINIGAME_BITS_PER_DAY` = 150 (`src/utils/currencies.ts`) × `ADVANCED_BITS_FACTOR` = 1,5
 *     (`src/utils/minigameDifficulty.ts`); `BITS_PER_COMPLETE_DAY` = 100 (`src/utils/dailyReset.ts`, + talento);
 *     `CHECKIN_REWARDS.afternoon.bits` = 10 (`src/utils/checkIns.ts`); `CASA_BITS_POR_DIA` = 100 (`_casa.js`); Endless Rift tier 2
 *     = 100; desafio/praça/encontro do clã 10 + 15 + 20; pesadelo vencido (`REWARD_TABLE`) e conquistas (`settleAchievements`, lote).
 *     Soma ≈ 600/dia; `BITS_ORCAMENTO_POR_DIA` = 1.500 é a sugestão do §387 (~2,5× essa soma, folga para talento e conquista).
 *     A régua `_bitsOrcamento.test.js` reprova se as constantes do cliente crescerem a ponto de R deixar de cobrir 2× a soma.
 *   · creditados pelo servidor (fora do R, somados à parte): pacotes do Cambista `ent.bitsBuy` (`_bitsPacks.js`,
 *     `BITS_PACK_DAILY_CAP` = 1.000), cartas do Papus resgatadas (`_mensageiro.js`, `MAIL_BITS_MAX` = 5.000 por carta; inclui os
 *     presentes que chegam por carta) e presentes de amigo da fila antiga (`_amigos.js` › `gnote:`, `GIFT_DAILY_CAP` = 100/dia).
 *   · acúmulo: `BITS_ORCAMENTO_DIAS` = 15 (§387), então o teto é 22.500.
 *
 * LIMITES HONESTOS (todos tendem a NÃO registrar, nunca a registrar à toa):
 *   · presente que chegou por carta aparece em `mail:` E em `gnote:` (conta duas vezes);
 *   · pacote: `ent.bitsBuy` só guarda o total do DIA da última compra; ele entra inteiro se a compra caiu na janela;
 *   · janela de créditos começa `CREDITO_FOLGA_MS` antes da última folga gravada (crédito resgatado entre duas gravações,
 *     com a soma no aparelho só na gravação seguinte);
 *   · carta resgatada e APAGADA antes da próxima gravação sai da caixa e não conta (pode registrar; a folga de 15 dias absorve);
 *   · gravações por `hexForge`/`hexRename`/`hexFair` preservam a folga; outro escritor da chave (revisão de sprite) não a
 *     preserva e a conta recomeça cheia;
 *   · dois aparelhos: a folga é da CONTA, e o segundo aparelho mede contra a última gravação do primeiro (o que o modo observação
 *     existe para medir antes de qualquer corte).
 * Admin (token verificado, `_admin.js` › `verifiedAdmin`) é isento: a ferramenta de GM grava saldo arbitrário.
 */
import { readEntitlement } from './_entitlements.js';
import { bitsResgatadosDesde } from './_mensageiro.js';
import { lerNotas } from './_amigos.js';
import { kv } from './_kv.js';
import { playerDayOf } from './_strays.js';

/**
 * Interruptor. `'observar'`: mede e registra, o save sai intacto. `'cortar'`: previsto para a decisão de 28/11/2026; não há
 * código de corte, e `_bitsOrcamento.test.js` trava o valor em `'observar'`.
 * @type {'observar' | 'cortar'}
 */
export const BITS_ORCAMENTO_MODO = 'observar';

export const BITS_ORCAMENTO_POR_DIA = 1500;
export const BITS_ORCAMENTO_DIAS = 15;
export const BITS_ORCAMENTO_TETO = BITS_ORCAMENTO_POR_DIA * BITS_ORCAMENTO_DIAS;
const DAY_MS = 86_400_000;
/** Início da janela de créditos do servidor: 1 dia antes da última folga gravada (ver os limites no cabeçalho). */
export const CREDITO_FOLGA_MS = DAY_MS;
/** Registros de observação vivem 45 dias: cobrem as 2 semanas de medição, a decisão de 28/11 e folga para reler. */
export const BITS_OBS_TTL_S = 45 * 86400;
export const BITS_OBS_PREFIXO = 'bitsobs:';

const finito = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * A folga gravada no metadata do save, ou `null` (conta sem estado, metadata de antes desta regra, lixo).
 * @param {unknown} metadata
 * @returns {{ b: number, t: number } | null}
 */
export function lerOrcamento(metadata) {
  if (!metadata || typeof metadata !== 'object') return null;
  const m = /** @type {any} */ (metadata);
  if (!finito(m.ob) || m.ob < 0 || !finito(m.ot) || m.ot <= 0) return null;
  return { b: Math.min(m.ob, BITS_ORCAMENTO_TETO), t: m.ot };
}

/** `ob`/`ot` válidos do metadata, para atravessar uma gravação que não reavalia o orçamento (GET, ações da Hexsmith). */
export function metaDoOrcamentoGravada(metadata) {
  const o = lerOrcamento(metadata);
  return o ? { ob: o.b, ot: o.t } : {};
}

/** `g` (saldo gravado) para o metadata, só se for um número finito. */
export function metaDoSaldo(gamePoints) {
  return finito(gamePoints) ? { g: gamePoints } : {};
}

/**
 * O `gamePoints` GRAVADO antes deste POST: o `g` do metadata quando existe; senão o do próprio save gravado (1ª gravação de cada
 * conta depois desta regra, ou chave regravada por outro escritor). Sem save gravado, ou sem saldo legível = `null`.
 * @param {{ value?: unknown, metadata?: unknown } | null | undefined} prev
 * @returns {number | null}
 */
export function saldoGravado(prev) {
  const g = prev?.metadata && typeof prev.metadata === 'object' ? /** @type {any} */ (prev.metadata).g : undefined;
  if (finito(g)) return g;
  if (typeof prev?.value !== 'string') return null;
  let gravado;
  try { gravado = JSON.parse(prev.value); } catch { return null; }
  return finito(gravado?.gamePoints) ? gravado.gamePoints : null;
}

/**
 * O cálculo, PURO. `antes`/`depois` = `gamePoints` gravado e o que chegou; `orcamento` = folga gravada (`null` = cheia);
 * `creditos` = Bits que o servidor creditou na janela.
 * @param {{ antes: number | null, depois: number | null, orcamento: { b: number, t: number } | null, agora: number, creditos?: number }} p
 * @returns {{ dentro: boolean, excedente: number, orcamentoNovo: { b: number, t: number } }}
 */
export function avaliarOrcamentoDeBits({ antes, depois, orcamento, agora, creditos = 0 }) {
  const decorrido = orcamento ? Math.max(0, agora - orcamento.t) : 0;
  const cheia = orcamento
    ? Math.min(BITS_ORCAMENTO_TETO, orcamento.b + (BITS_ORCAMENTO_POR_DIA * decorrido) / DAY_MS)
    : BITS_ORCAMENTO_TETO;
  if (!finito(antes) || !finito(depois)) return { dentro: true, excedente: 0, orcamentoNovo: { b: cheia, t: agora } };
  const crescimento = Math.max(0, /** @type {number} */ (depois) - /** @type {number} */ (antes));
  const folga = cheia + Math.max(0, finito(creditos) ? creditos : 0);
  const excedente = Math.max(0, Math.ceil(crescimento - folga));
  return {
    dentro: excedente === 0,
    excedente,
    orcamentoNovo: { b: Math.min(BITS_ORCAMENTO_TETO, Math.max(0, folga - crescimento)), t: agora },
  };
}

/**
 * Bits que o SERVIDOR creditou à conta desde `desdeMs`: pacote do Cambista do dia (`ent.bitsBuy`, se a compra caiu na janela),
 * cartas resgatadas (`mail:`) e presentes da fila antiga (`gnote:`). Falha de leitura PROPAGA: quem chama decide (no save, o
 * orçamento é melhor esforço).
 */
export async function creditosDoServidorDesde(env, saveId, desdeMs) {
  const ent = await readEntitlement(env, saveId);
  const compra = ent?.bitsBuy;
  const pacote = compra && finito(compra.at) && compra.at >= desdeMs && finito(Number(compra.bits)) ? Math.max(0, Number(compra.bits)) : 0;
  const store = kv(env);
  const cartas = store ? await bitsResgatadosDesde(store, saveId, desdeMs) : 0;
  const notas = await lerNotas(env, saveId);
  const presentes = notas.items.reduce((s, n) => (n.at >= desdeMs ? s + n.bits : s), 0);
  return pacote + cartas + presentes;
}

/**
 * Mede o POST e devolve o que gravar: `meta` (`g`/`ob`/`ot`, para o metadata do save) e `observacao` (só quando há excedente e
 * a conta não é admin). Os créditos do servidor e o admin só são lidos quando a conta simples já estourou: jogador dentro do
 * orçamento não custa leitura nenhuma.
 * @param {{ env: Parameters<typeof kv>[0], saveId: string, prev: { value?: unknown, metadata?: unknown } | null, gamePoints: unknown, agora: number,
 *   ehAdmin: () => Promise<boolean>, playerDayTz?: unknown }} p
 */
export async function medirOrcamentoDeBits({ env, saveId, prev, gamePoints, agora, ehAdmin, playerDayTz }) {
  const antes = saldoGravado(prev);
  const depois = finito(gamePoints) ? /** @type {number} */ (gamePoints) : null;
  const orcamento = lerOrcamento(prev?.metadata);
  let r = avaliarOrcamentoDeBits({ antes, depois, orcamento, agora });
  let creditos = 0;
  if (r.excedente > 0) {
    const desde = (orcamento ? orcamento.t : agora - DAY_MS) - CREDITO_FOLGA_MS;
    creditos = await creditosDoServidorDesde(env, saveId, desde);
    r = avaliarOrcamentoDeBits({ antes, depois, orcamento, agora, creditos });
  }
  if (r.excedente > 0 && await ehAdmin()) {
    r = { dentro: true, excedente: 0, orcamentoNovo: { b: BITS_ORCAMENTO_TETO, t: agora } };
  }
  const meta = { ...metaDoSaldo(depois), ob: r.orcamentoNovo.b, ot: r.orcamentoNovo.t };
  const observacao = r.excedente > 0
    ? {
      dia: playerDayOf(agora, /** @type {any} */ (playerDayTz)),
      excedente: r.excedente,
      saldo_antes: /** @type {number} */ (antes),
      saldo_depois: /** @type {number} */ (depois),
      creditos,
      criado_em: agora,
    }
    : null;
  return { meta, observacao };
}

/**
 * Grava a observação em `bitsobs:<dia do jogador>:<8 primeiros do saveId>` no KV do save, TTL `BITS_OBS_TTL_S`: no máximo UMA
 * chave por conta por dia, com o MAIOR excedente do dia (a gravação só acontece quando o novo é maior). O mesmo conteúdo vai no
 * metadata da chave, para `wrangler kv key list --prefix bitsobs:` mostrar tudo de uma vez. Só o prefixo do saveId (que já é
 * um hash): nenhum dado pessoal. Sem KV = no-op. Falha propaga: quem chama decide.
 * @param {Parameters<typeof kv>[0]} env @param {string} saveId
 * @param {{ dia: string, excedente: number, saldo_antes: number, saldo_depois: number, creditos: number, criado_em: number }} obs
 */
export async function registrarObservacao(env, saveId, obs) {
  const store = kv(env);
  if (!store) return false;
  const chave = `${BITS_OBS_PREFIXO}${obs.dia}:${saveId.slice(0, 8)}`;
  const atual = await store.getWithMetadata(chave);
  const anterior = atual?.metadata && typeof atual.metadata === 'object' ? Number(/** @type {any} */ (atual.metadata).excedente) : NaN;
  if (finito(anterior) && anterior >= obs.excedente) return false;
  await store.put(chave, JSON.stringify(obs), { expirationTtl: BITS_OBS_TTL_S, metadata: obs });
  return true;
}
