import type { CSSProperties } from 'react';

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
// (ver CREDIT_TO_BITS) — mas o caminho contrário não existe, senão jogando
// minijogo alguém chegaria ao que só o dinheiro real deveria abrir.

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
    name: { pt: 'Emblemas', en: 'Emblems' },
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
 * Bits: calculadora, tinta primária.
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
 * Quantos Bits cada Crédito vira. Só nesta direção.
 *
 * A troca inversa (Bits → Créditos) NÃO existe de propósito: créditos são a
 * moeda que libera gerar o pet próprio, e permitir farmá-los em minijogo
 * anularia a única coisa que o dinheiro real compra com exclusividade.
 */
export const CREDIT_TO_BITS = 10;

/** Pacotes de troca oferecidos na loja. */
export const BITS_EXCHANGE = [
  { credits: 10, bits: 10 * CREDIT_TO_BITS },
  { credits: 25, bits: 25 * CREDIT_TO_BITS },
  { credits: 60, bits: 60 * CREDIT_TO_BITS },
] as const;

/** Recompensa em Emblemas por partida de torneio. */
export const EMBLEMS_PER_WIN = 3;
export const EMBLEMS_PER_LOSS = 1;   // consolo: jogar sempre rende alguma coisa
