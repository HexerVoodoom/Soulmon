/**
 * Rótulos de dificuldade dos minijogos (pedido do dono, 30/10/2026): o que o jogador LÊ é
 * "Comum" / "Avançado" (EN "Common" / "Advanced"). Os ids internos e os valores salvos
 * (nível 1/2, `dino-1`/`dino-2`, `data-dino-start`) NÃO mudam — só a cópia exibida.
 */
export type MinigameLevel = 1 | 2;
export function difficultyLabel(level: MinigameLevel, isPt: boolean): string {
  if (level === 1) return isPt ? 'Comum' : 'Common';
  return isPt ? 'Avançado' : 'Advanced';
}

/**
 * O modo Avançado paga mais Bits para compensar a dificuldade (pedido do dono, 03/11/2026): Corrida, Pedra·Papel·Tesoura e Barragem.
 * Era × 2; desde 14/11/2026 é × 1,5 (dono, REGISTRO §372: "o teto de 150 está sendo atingido muito rápido").
 * O teto diário de Bits dos minijogos (`MINIGAME_BITS_PER_DAY`) continua valendo. O nível 1 (Comum) não passa por aqui.
 */
export const ADVANCED_BITS_FACTOR = 1.5;

/**
 * Os Bits de uma rodada no nível jogado. Dono único da conta do Avançado: `max(1, round(base × fator))`, para um prêmio
 * pequeno não zerar com o fator fracionário. Rodada sem Bits (base ≤ 0) continua 0: o mínimo de 1 não inventa prêmio.
 * Nível 1 devolve a base intacta. Aceita o nível cru do estado do jogo: qualquer valor diferente de 2 é o Comum.
 */
export function bitsForLevel(base: number, level: number): number {
  if (level !== 2 || !(base > 0)) return base;
  return Math.max(1, Math.round(base * ADVANCED_BITS_FACTOR));
}

/** O fator como o jogador o lê: "×1,5" em PT, "×1.5" em EN. */
export function advancedFactorLabel(isPt: boolean): string {
  const n = String(ADVANCED_BITS_FACTOR);
  return `×${isPt ? n.replace('.', ',') : n}`;
}
