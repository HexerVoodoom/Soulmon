/**
 * 🌀 GLITCHTAMA — NOVO DESIGN (dono, 10/11/2026): 1 uso por SEMANA, e o uso concede um BUFF de +10% nos pontos de
 * progressão de evolução que DURA 7 DIAS. Não enche mais a barra, não dá dia perfeito.
 *
 * O registro é UM timestamp no SAVE (`glitchtamaUsadoEm`, ms epoch), espelhado no servidor (`functions/api/_glitchtama.js`,
 * monotônico). O mesmo instante responde as duas perguntas: o buff está ativo? posso usar de novo?
 * Janela: [usadoEm, usadoEm + 7d). Relógio que volta NÃO libera o uso (now < usadoEm continua dentro do cooldown).
 *
 * O +10% entra num ponto só: a virada do dia (`dailyReset`), sobre o GANHO daquele crédito (tarefas + missão especial).
 * Os ganhos são pequenos (4–6 por dia), então a fração acumula em `glitchtamaCarry` (0 ≤ x < 1) em vez de arredondar para zero.
 * Funções PURAS.
 */
export const GLITCHTAMA_JANELA_MS = 7 * 24 * 60 * 60 * 1000;
export const GLITCHTAMA_BUFF_PCT = 10;
/** Folga contra relógio adiantado no aparelho: um `usadoEm` mais de 1 dia à frente de "agora" é lixo e não prende ninguém por semanas. */
const FOLGA_FUTURO_MS = 24 * 60 * 60 * 1000;

/** Número finito > 0 ou `undefined`. Save vem do cliente/nuvem. Não deixa um futuro absurdo trancar o item. */
export function sanitizeGlitchtamaUsadoEm(v: unknown, nowMs: number = Date.now()): number | undefined {
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) return undefined;
  return v > nowMs + FOLGA_FUTURO_MS ? nowMs : Math.floor(v);
}

export function sanitizeGlitchtamaCarry(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.min(v, 0.999) : 0;
}

/** Instante em que o buff/cooldown acaba (ms), ou `undefined` se nunca usou. */
export function glitchtamaExpiraEm(usadoEm: number | undefined): number | undefined {
  return typeof usadoEm === 'number' && usadoEm > 0 ? usadoEm + GLITCHTAMA_JANELA_MS : undefined;
}

/** Dentro da janela de 7 dias (buff ativo = cooldown correndo). `now < usadoEm` (relógio voltou) conta como dentro. */
export function glitchtamaBuffAtivo(usadoEm: number | undefined, nowMs: number): boolean {
  const fim = glitchtamaExpiraEm(usadoEm);
  return fim !== undefined && nowMs < fim;
}

/** Dias inteiros (arredondado p/ cima, mín. 1) até expirar; 0 se inativo. */
export function glitchtamaDiasRestantes(usadoEm: number | undefined, nowMs: number): number {
  const fim = glitchtamaExpiraEm(usadoEm);
  if (fim === undefined || nowMs >= fim) return 0;
  return Math.max(1, Math.ceil((fim - nowMs) / 86_400_000));
}

/**
 * Aplica o +10% a UM ganho de pontos de progressão. Sem buff: devolve o ganho e o carry intactos.
 * Com buff: `bonus = floor(ganho*0.10 + carry)`, o resto fica no carry. Ganho ≤ 0 não rende nada.
 */
export function aplicarBuffGlitchtama(ganho: number, carry: number, ativo: boolean): { ganho: number; carry: number } {
  if (!ativo || !(ganho > 0)) return { ganho, carry: sanitizeGlitchtamaCarry(carry) };
  const total = ganho * GLITCHTAMA_BUFF_PCT / 100 + sanitizeGlitchtamaCarry(carry);
  const bonus = Math.floor(total + 1e-9);
  return { ganho: ganho + bonus, carry: Math.max(0, total - bonus) };
}
