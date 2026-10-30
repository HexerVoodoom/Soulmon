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
