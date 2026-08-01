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

/** Bits: calculadora verde (tema claro). */
export const bitsStyleLight: CSSProperties = {
  fontFamily: "'Courier New', ui-monospace, monospace",
  color: '#1b8f3a',
  letterSpacing: '1px',
  fontWeight: 700,
};

/** Bits nos temas retrô: verde neon sobre fundo escuro. */
export const bitsStyle: CSSProperties = {
  fontFamily: "'Courier New', ui-monospace, monospace",
  color: '#39ff14',
  textShadow: '0 0 6px rgba(57,255,20,0.75)',
  letterSpacing: '1.5px',
  fontWeight: 700,
};

/** Emblemas: dourado, com serifa — cara de medalha, não de dígito. */
export const EMBLEM_COLOR = '#b8860b';
export const emblemStyle: CSSProperties = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  color: EMBLEM_COLOR,
  fontWeight: 700,
  letterSpacing: '0.5px',
};

/** Créditos: roxo do sistema, sempre acompanhados do ícone Gem. */
export const CREDIT_COLOR = '#a855f7';

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
