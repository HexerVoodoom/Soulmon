/**
 * Os CORAÇÕES do resumo do dia (backlog beta-2, 4.2). Função pura: o resumo desenha uma fileira de
 * corações e o que quebrou é o que a virada realmente cobrou (`lastDayReport.heartsLost`), nunca um
 * número inventado pela tela.
 *
 * Meio coração perdido (traço Teimoso, alívio semanal) conta como UM coração quebrado: a fileira é de
 * peças inteiras, e esconder uma perda real seria a tela mentir sobre o dia.
 */
export const DEFAULT_HEARTS = 3;

export interface HeartStrip {
  /** Quantas peças a fileira tem (o máximo de HP do estágio; 3 quando a tela não sabe). */
  total: number;
  /** Quantas quebraram na virada (0..total). */
  lost: number;
  /** Quantas seguem inteiras. */
  kept: number;
}

export function heartStrip(heartsLost: number, maxHearts: number = DEFAULT_HEARTS): HeartStrip {
  const total = Number.isFinite(maxHearts) && maxHearts >= 1 ? Math.min(8, Math.floor(maxHearts)) : DEFAULT_HEARTS;
  const raw = Number.isFinite(heartsLost) && heartsLost > 0 ? heartsLost : 0;
  const lost = Math.max(0, Math.min(total, Math.ceil(raw - 1e-9)));
  return { total, lost, kept: total - lost };
}

/** A animação de quebra roda uma vez por relatório: só quando houve perda e ainda não foi vista. */
export const shouldPlayHeartBreak = (strip: HeartStrip, alreadySeen: boolean | undefined): boolean =>
  strip.lost > 0 && alreadySeen !== true;
