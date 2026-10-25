/**
 * QUANDO o pesadelo abre — o portão do acordar (pedido do dono 20/10/2026).
 * ======================================================================
 *
 * Puro: sem React, sem relógio interno — tudo entra por parâmetro. O que decide SE há
 * pesadelo continua em `utils/nightmares.ts` (`hasPendingNightmare`, por `nightmareDayKey`);
 * este módulo decide só se o momento está LIVRE para mostrá-lo.
 *
 * Decisões do dono (congeladas):
 *  - Q3: a QUALQUER hora, sem a janela 4h–12h. "Começo do dia" = a primeira abertura/acordar do
 *    dia do jogador; 1×/dia já é garantido pela fila + `markFought` (por `nightmareDayKey`).
 *  - Q2: só com noite registrada onTime (inalterado, vive em `nightmaresFor`).
 *  - Q5: se o Soulmon acordou sozinho por concluir tarefa/hábito, o pesadelo só entra DEPOIS da
 *    celebração/toast: na Home e com `NIGHTMARE_AFTER_COMPLETION_MS` passados desde o acordar.
 *  - Q6: Soulmon ocupado (masmorra ou missão da guilda fora) → o pesadelo ESPERA; não abre e não
 *    traz o pet de volta. Voltou no mesmo dia, abre; virou o dia, expira sozinho (dayKey).
 *  - Sono real (`sleeping`) e Soulmon à espera do "Acordar" (`wakePending`) seguram.
 *  - O SONHO BOM ocupa o mesmo slot e segue o MESMO portão.
 *  - D-06: o SONHO da manhã mantém o modal só em 4h–12h; fora disso, se o slot do sono está
 *    tomado por pesadelo/sonho bom, é coletado em silêncio (`dreamMode`).
 */

/** Espera depois de acordar por concluir algo: deixa a celebração/toast terminar. */
export const NIGHTMARE_AFTER_COMPLETION_MS = 5000;

export interface NightmareGateInput {
  nowMs: number;
  /** Sono real (`isSleeping`). */
  sleeping: boolean;
  /** O Soulmon dorme à espera do gesto de "Acordar" (`dayWakePending`). */
  wakePending: boolean;
  /** Masmorra ou missão da guilda fora. */
  busy: boolean;
  /** Está na Home (`currentView === 'home'`). */
  onHome: boolean;
  /** Instante (ms) em que o Soulmon acordou por concluir algo nesta sessão; `null` se não. */
  completionWokeAt: number | null;
}

/** O momento está livre para abrir o pesadelo (ou o sonho bom)? Não lê o relógio. */
export function nightmareGateOpen(i: NightmareGateInput): boolean {
  if (i.sleeping || i.wakePending || i.busy) return false;
  if (i.completionWokeAt != null) {
    return i.onHome && i.nowMs - i.completionWokeAt >= NIGHTMARE_AFTER_COMPLETION_MS;
  }
  return true;
}

/** Quanto falta (ms) para vencer o prazo pós-conclusão; `null` se não se aplica (sem acordar por conclusão, ou portão fechado por outro motivo). */
export function nightmareRetryInMs(i: NightmareGateInput): number | null {
  if (i.completionWokeAt == null) return null;
  if (i.sleeping || i.wakePending || i.busy) return null;
  return Math.max(0, NIGHTMARE_AFTER_COMPLETION_MS - (i.nowMs - i.completionWokeAt));
}

/** A janela em que o sonho da manhã abre o MODAL (hora local do aparelho, `from` incluso, `to` exclusivo). */
export const DREAM_MODAL_HOURS = { from: 4, to: 12 } as const;

/**
 * O que fazer com o sonho da manhã: modal dentro da janela; fora dela, coletar em silêncio se o slot
 * do sono já é do pesadelo/sonho bom (`sleepSlotPending`), senão nada.
 */
export function dreamMode(hour: number, sleepSlotPending: boolean): 'modal' | 'silent' | 'none' {
  /* A1: o slot do sono é UM só. Com pesadelo/sonho bom pendente o sonho nunca abre modal — enquanto o portão do pesadelo
     estava fechado (celebração 5 s, Masmorra, missão) o sonho entrava na fila primeiro e `shown.has('dream')` barrava o pesadelo no dia inteiro. */
  if (sleepSlotPending) return 'silent';
  if (hour >= DREAM_MODAL_HOURS.from && hour < DREAM_MODAL_HOURS.to) return 'modal';
  return 'none';
}
