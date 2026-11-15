import type { CSSProperties } from 'react';
import { noteFreeBits, type BitsOriginState } from './bitsOrigin';

// As TRÊS moedas do Soulmon, num lugar só.
//
// Elas se distinguem pela ORIGEM, e é isso que define o que cada uma pode
// fazer. Misturá-las visualmente já causou confusão real (Bits e Créditos
// apareciam com o mesmo ícone 💎, e o jogador não tinha como saber que os
// créditos que pagou não compram nada na loja).
//
//   💠 Bits      — minijogos            → loja comum
//   🎖️ Emblemas  — torneio              → aba de torneio da loja (exclusivos)
//   💎 Créditos  — DINHEIRO REAL        → reroll, cura instantânea, e é a
//                                          ÚNICA que libera gerar o pet próprio
//
// Créditos são universais no sentido de que dá para trocá-los por Bits
// (pacotes `BITS_PACKS`, no Cambista) — mas o caminho contrário não existe,
// senão jogando minijogo alguém chegaria ao que só o dinheiro real deveria abrir.

export type CurrencyId = 'bits' | 'emblems' | 'credits';

export interface CurrencyMeta {
  id: CurrencyId;
  /** Campo correspondente no GameState (créditos vêm do servidor). */
  field: 'gamePoints' | 'emblems' | 'credits';
  name: { pt: string; en: string };
  origin: { pt: string; en: string };
}

export const CURRENCIES: Record<CurrencyId, CurrencyMeta> = {
  bits: {
    id: 'bits', field: 'gamePoints',
    name: { pt: 'Bits', en: 'Bits' },
    origin: { pt: 'Ganhe nos minijogos', en: 'Earn them in the minigames' },
  },
  emblems: {
    id: 'emblems', field: 'emblems',
    // Rótulo exibido: "Honra"/"Honor" (decisão do dono, 30/09/2026). O id, o campo
    // `emblems` do save e todo identificador continuam "emblems".
    name: { pt: 'Honra', en: 'Honor' },
    origin: { pt: 'Ganhe vencendo no Torneio', en: 'Earn them by winning in the Tournament' },
  },
  credits: {
    id: 'credits', field: 'credits',
    name: { pt: 'Créditos', en: 'Credits' },
    origin: { pt: 'Comprados na loja do app', en: 'Bought in the app store' },
  },
};

// ─────────────────────────────────────────────────────────────── aparência
// Cada moeda tem leitura própria. Nenhuma pode ser confundida com outra à
// primeira vista — foi o bug que o QA de UI pegou.
//
// A DISTINÇÃO CONTINUA NA FAMÍLIA TIPOGRÁFICA (Bits = calculadora, Emblemas =
// serifa de medalha, Créditos = texto do app + ícone 💎), porque é isso que o
// CLAUDE.md declara como regra de produto. O que saiu daqui foi a COR crua:
//
//   · Bits eram `#39ff14` com halo neon → 1,36:1 sobre superfície clara.
//   · Emblemas eram `#b8860b`           → 3,25:1 sobre branco.
//   · Créditos eram `#a855f7`           → 3,65:1 sobre `--sm2-bg` claro.
//
// Os três reprovavam AA, e os dois primeiros vinham como estilo INLINE em
// `span.sm2-num` — ou seja, venciam o token do design system por
// especificidade (29 ocorrências só na Loja). Agora as cores são tokens
// `--sm2-*`, que já respondem ao tema e são medidos por
// `src/styles/tokens.contrast.test.ts`:
//
//   Bits     `--sm2-primary-ink`  5,55:1 (claro) / 13,21:1 (escuro) sobre `bg`
//   Emblemas `--sm2-gold-ink`     5,41:1 (claro) / 10,51:1 (escuro) sobre `bg`
//   Créditos `--sm2-credit-ink`   6,55:1 (claro) /  8,98:1 (escuro) sobre `bg`
//
// A família também virou token (`--sm2-font-mono` / `--sm2-font-serif`): estilo
// inline com nome de fonte literal é justamente o que fez o app terminar com
// sete tipos diferentes na tela.
//
// DUAS correções medidas depois disso:
//
//   1. O token de cor voltou a valer no CALL-SITE. `ShopModal` e
//      `ActivitiesPage` — os dois ÚNICOS lugares onde Bits aparecem — faziam
//      `{ ...bitsStyle, color: 'var(--sm2-ink)' }`. O número saía na tinta do
//      texto corrido e o `--sm2-primary-ink` daqui não chegava à tela: o
//      mesmo "inline vence o token" que este arquivo declara ter matado,
//      reintroduzido um nível acima. Não havia motivo de contraste —
//      `--sm2-primary-ink` mede 5,55 / 13,21 sobre `bg`, 6,02 / 11,12 sobre
//      `surface` e 5,28 / 9,43 sobre `surface-2` (claro / escuro), tudo
//      acima do 4,5:1 de AA.
//   2. A leitura de calculadora deixou de depender de plataforma. Ver a nota
//      do `--sm2-font-mono` no `index.css`: a pilha nomeia face concreta por
//      sistema, e `bitsStyle` acrescentou `slashed-zero` como SEGUNDO eixo —
//      a 12px a família sozinha não estava distinguindo nada.

/**
 * Bits: calculadora, tinta primária. Desde 19/10/2026 COM ícone — quem exibe é o `BitsAmount` (REGISTRO §105, revoga a D-L11).
 *
 * Canvas Loja (DECISÕES §26, checkpoint do dono 20/09/2026): Bits ficam em
 * `primary-ink` — ESTE estilo vence o canvas de Jogos (§25, que pedia `ink`);
 * as duas superfícies leem a mesma cor daqui. Créditos consomem
 * `CREDIT_COLOR` no `diamond` (Loja/troca e `CreditsModal`), D-L11.
 *
 * Existe um par histórico (`bitsStyle` retrô / `bitsStyleLight` claro) porque
 * a cor era escolhida à mão por tema. Com token isso deixou de ser preciso — o
 * token já muda sozinho — mas os DOIS exports ficam, porque `utils/currency.ts`
 * reexporta ambos e há call-site em cada um. São idênticos de propósito.
 */
export const bitsStyle: CSSProperties = {
  fontFamily: 'var(--sm2-font-mono)',
  color: 'var(--sm2-primary-ink)',
  // Antes `1px` fixo. Em `em` o espaçamento acompanha o tamanho: o saldo dos
  // Bits aparece a 12px na Loja e a 20px em Atividades, e um valor absoluto
  // vira quase nada num extremo e frouxo no outro.
  letterSpacing: '0.08em',
  fontWeight: 700,
  // DOIS eixos de distinção, não um. A família de calculadora sozinha é sutil
  // a 12px (foi a medição que derrubou a versão anterior); `slashed-zero` é o
  // sinal que ninguém confunde com texto corrido, e degrada em silêncio numa
  // fonte que não tenha o eixo. `tabular-nums` continua obrigatório: o saldo
  // muda a cada partida e sem ele o número dança na horizontal.
  fontVariantNumeric: 'tabular-nums slashed-zero',
};

/** @see bitsStyle — mesmo estilo; o token já resolve o tema. */
export const bitsStyleLight: CSSProperties = { ...bitsStyle };

/** Emblemas: dourado, com serifa — cara de medalha, não de dígito. */
export const EMBLEM_COLOR = 'var(--sm2-gold-ink)';
export const emblemStyle: CSSProperties = {
  fontFamily: 'var(--sm2-font-serif)',
  color: EMBLEM_COLOR,
  fontWeight: 700,
  letterSpacing: '0.5px',
  fontVariantNumeric: 'tabular-nums',
};

/** Créditos: roxo do sistema, sempre acompanhados do ícone Gem. */
export const CREDIT_COLOR = 'var(--sm2-credit-ink)';

// ───────────────────────────────────────────────────────────────── câmbio

/**
 * PACOTES DE BITS do Cambista, pagos em Créditos (REGISTRO §373, dono 14/11/2026). Fonte única no app; o SERVIDOR tem o espelho
 * que vale (`functions/api/_bitsPacks.js`, travado por `functions/api/bitsPacks.parity.test.js`): ele decide os Bits de cada
 * pacote, debita os Créditos e conta o teto do dia. O cliente só manda o `id` e credita os Bits que a resposta trouxer.
 *
 * Desconto progressivo (estilo Pokémon Sleep): o pacote de 200 é a referência (1 Crédito por Bit); os maiores saem mais baratos por
 * Bit. A etiqueta de desconto é DERIVADA destes números (`bitsPackDiscountPct`), nunca escrita à mão.
 *
 * A troca é só nesta direção. A inversa (Bits → Créditos) NÃO existe de propósito: Créditos são a moeda que libera gerar o pet
 * próprio, e permitir farmá-los em minijogo anularia a única coisa que o dinheiro real compra com exclusividade.
 *
 * ⚰️ `CREDIT_TO_BITS = 10` e `BITS_EXCHANGE` (1/2/4 Créditos → 10/20/40 Bits, teto de 25% do ganho grátis do dia) saíram em §373.
 */
export const BITS_PACKS = [
  { id: 'bits-200', bits: 200, credits: 200 },
  { id: 'bits-500', bits: 500, credits: 460 },
  { id: 'bits-1000', bits: 1000, credits: 800 },
] as const;

export type BitsPack = (typeof BITS_PACKS)[number];
export type BitsPackId = BitsPack['id'];

/** Teto de Bits comprados com Créditos por DIA (UTC, contado no servidor). O pacote de 1.000 usa o dia inteiro. */
export const BITS_PACK_DAILY_CAP = 1000;

export function bitsPackById(id: unknown): BitsPack | undefined {
  return BITS_PACKS.find(p => p.id === id);
}

/** Desconto do pacote contra o de referência (o primeiro, sem desconto), em % inteiro arredondado. 0 = sem etiqueta. */
export function bitsPackDiscountPct(pack: Pick<BitsPack, 'bits' | 'credits'>): number {
  const base = BITS_PACKS[0].credits / BITS_PACKS[0].bits;
  return Math.max(0, Math.round((1 - pack.credits / pack.bits / base) * 100));
}

/** Recompensa em Emblemas por partida de torneio. */
export const EMBLEMS_PER_WIN = 3;
export const EMBLEMS_PER_LOSS = 1;   // consolo: jogar sempre rende alguma coisa

/**
 * TREINO ("Sparring", a 2a aba do Torneio, 10/11/2026): a vitória rende POUCA Honra e o servidor decide o valor (1 a 2) e o teto do dia (20).
 * Espelho de `functions/api/_treino.js` (`SPAR_HONOR_MAX`, `SPAR_HONOR_DAILY_CAP`) só para a PRÉVIA da tela; o que vale é o `honor` que a
 * resposta do servidor traz. Travado por `functions/api/community.treino.test.js` (paridade).
 */
export const SPAR_HONOR_MAX = 2;
export const SPAR_HONOR_DAILY_CAP = 20;

// ──────────────────────────────────────────────── o teto de Bits do dia (#61/#63)

/**
 * 💠 QUANTOS BITS OS MINIJOGOS PODEM RENDER NUM DIA DO JOGADOR.
 *
 * ⚠️ DECISÃO DO DONO #61/#63 (22/09/2026, `docs/PERGUNTAS-DO-DONO.md`):
 * *"Economia: **Bits por dia completo + teto de runs** por dia (números a
 * calibrar na simulação)"*. A outra metade é `BITS_PER_COMPLETE_DAY`
 * (`utils/dailyReset.ts`, 100 Bits — a loja inteira em ~90 dias de cuidado).
 *
 * ## Por que o teto é em BITS/dia e não em RUNS/dia
 *
 * É o achado que a simulação impôs à decisão, e ele merece estar escrito antes
 * do número. A loja custa **8 900 Bits** (55 itens, `SHOP_ITEMS`). Medido na
 * QA rodada 2 (§2.7):
 *
 *   · perfil **A** (faz tudo, todo dia, nunca joga): **0 Bits em 90 dias**;
 *   · perfil **B** (3 runs/semana): 13 598 = 152% da loja;
 *   · perfil **G** (zero hábitos, **1 run por dia**): **34 566 = 3,9× a loja**.
 *
 * Um teto de RUNS por dia não toca o perfil G — ele já faz exatamente uma run
 * por dia. O que o faz juntar 34 mil é o VALOR da run, que sobe com a base
 * semanal da masmorra (327 → 417 Bits). Ou seja: o teto que a decisão pede só
 * morde em Bits/dia; escrito em runs/dia ele seria letra morta contra o
 * jogador que a decisão nomeia. Está aqui por honestidade — quem reabrir isto
 * não precisa remedir.
 *
 * ## O número
 *
 * **150 Bits/dia de minijogo**, contra os 100/dia de quem cuida. Em 90 dias:
 * G cai de 3,9× para **1,5× a loja** (grinder diário compra tudo em ~60 dias),
 * A compra tudo em ~90 dias, e B — que joga E cuida — fica no meio. A razão
 * grinder/cuidador vira 1,5:1 em vez de ∞:1, e nenhum perfil passa a precisar
 * de minijogo para ver a loja.
 *
 * ## O que o teto NÃO faz (linha vermelha)
 *
 * Não tira nada de ninguém, não bloqueia a masmorra, não cobra entrada e não
 * toca coração — bater o teto só faz os Bits pararem de somar, exatamente como
 * o teto suave do Vínculo (`bond.ts`). A run continua inteira: 🌀,
 * placar, bestiário, andares, tudo. O `CLAUDE.md` já declara qual é a alavanca
 * permitida ("se farmar Bits virar problema, a alavanca é custo de ENTRADA em
 * Bits, nunca o retorno do custo em corações") — um teto de ganho é ainda mais
 * suave que um custo de entrada, porque não pode deixar ninguém sem jogar.
 */
export const MINIGAME_BITS_PER_DAY = 150;

/**
 * O registro do teto, no SAVE, nunca no localStorage — mesmo argumento do
 * `careCaps`, do `poopDrainCharge` e do `glitchtamaUse`: um teto que se fura
 * trocando de aparelho não é um teto. E o dia é o **dia do jogador**
 * (`utils/playerDay.ts`), não o do aparelho.
 *
 * Chave NOVA no save (`minigameBits`) — linha vermelha #20 (só ACRESCENTAR).
 */
export interface MinigameBitsCharge {
  /** Chave do DIA DO JOGADOR, forma de `toDateString()`. */
  day: string;
  /** Bits de minijogo já creditados neste dia. */
  earned: number;
}

/** Fatia do GameState que o crédito de Bits de minijogo lê e escreve. */
export interface MinigameBitsState {
  gamePoints?: number;
  minigameBits?: MinigameBitsCharge;
}

/** Quantos Bits de minijogo já foram creditados HOJE. Dia diferente = zero — o
 *  registro antigo não é apagado, é ignorado, o que torna a leitura idempotente
 *  sob a virada. */
export function minigameBitsToday(state: MinigameBitsState, dayKey: string): number {
  const reg = state.minigameBits;
  // `earned` vem do save (dado não confiável): não finito conta como zero.
  // `Math.max(0, undefined)` é NaN, e NaN no ledger envenena o saldo inteiro.
  return reg && reg.day === dayKey && Number.isFinite(reg.earned) ? Math.max(0, reg.earned) : 0;
}

/** Quanto o minijogo ainda PODE render hoje (0 = teto do dia gasto). */
export function remainingMinigameBits(state: MinigameBitsState, dayKey: string, extraCap = 0): number {
  return Math.max(0, minigameBitsCap(extraCap) - minigameBitsToday(state, dayKey));
}

/**
 * Teto diário EFETIVO de quem joga a Fenda/Masmorra/Arena (§393): `MINIGAME_BITS_PER_DAY` + o `extraCap` do talento
 * `tal-pve-04` (Agulha de bússola, +10 por grau). O teto continua UM só (a soma de todos os jogos); o extra só vale para
 * o crédito que a Fenda pede: Dino, PPT, Salão e Ateliê seguem parando em 150 e não gastam o extra.
 * Sempre finito e nunca abaixo da base (`extraCap` inválido ou negativo = 0).
 */
export function minigameBitsCap(extraCap = 0): number {
  return MINIGAME_BITS_PER_DAY + (Number.isFinite(extraCap) && extraCap > 0 ? Math.floor(extraCap) : 0);
}

/**
 * Quanto de um pedido de `amount` Bits o teto do dia REALMENTE credita, dado o
 * quanto já foi creditado hoje (`already`). É a regra única: `creditMinigameBits`
 * a usa para creditar e o funil do `App` a usa para dizer à tela de resultado o
 * valor creditado (o que a tela mostra = o que entrou).
 */
export function minigameBitsGranted(already: number, amount: number, extraCap = 0): number {
  // `Math.floor(NaN)` é NaN e NaN <= 0 é falso: a quantia passava pelo teto e
  // gravava `gamePoints: NaN` (perde o saldo todo no próximo save). Só número
  // finito credita; Infinity já é limitado pelo teto do dia logo abaixo.
  if (typeof amount !== 'number' || Number.isNaN(amount)) return 0;
  const pedido = Math.max(0, Math.floor(amount));
  return Math.max(0, Math.min(pedido, minigameBitsCap(extraCap) - Math.max(0, already)));
}

/**
 * Credita Bits de MINIJOGO sobre o `prev`, respeitando o teto do dia.
 *
 * Função PURA e feita para rodar DENTRO de um updater (`setGameState`): o
 * ledger é escrito no MESMO retorno que soma os Bits, senão dois créditos no
 * mesmo lote do React leriam o mesmo estado e passariam os dois pelo teto — a
 * família de bug do X-6, e a masmorra credita VÁRIAS vezes por run (por inimigo
 * e por andar), dentro do mesmo tique de render.
 *
 * Devolve o MESMO objeto quando nada muda (teto gasto, ou `amount <= 0`).
 *
 * ⚠️ Os Bits do DIA COMPLETO **não passam por aqui** — são de `dailyReset.ts`,
 * e o teto deles é o próprio calendário.
 */
export function creditMinigameBits<T extends MinigameBitsState & BitsOriginState>(
  prev: T,
  amount: number,
  dayKey: string,
  extraCap = 0,
): T {
  const ganho = minigameBitsGranted(minigameBitsToday(prev, dayKey), amount, extraCap);
  if (ganho <= 0) return prev;
  // PR8: Bit de minijogo é Bit GANHO e soma ao ganho grátis do dia (só contagem desde §373: o teto da troca é do servidor).
  return noteFreeBits({
    ...prev,
    gamePoints: (prev.gamePoints ?? 0) + ganho,
    minigameBits: { day: dayKey, earned: minigameBitsToday(prev, dayKey) + ganho },
  }, ganho, dayKey);
}
