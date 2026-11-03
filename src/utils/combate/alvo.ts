/**
 * ALVO POR TOQUE (03/11/2026, dono): "durante o combate contra vários inimigos seja possível tocar em um inimigo para
 * alterar o alvo a partir do próximo ataque". Regra pura de QUEM o jogador mira: o inimigo escolhido, se ainda está
 * vivo; senão a regra automática de sempre (o 1º vivo). Sem escolha, o resultado é idêntico ao de antes — o balanço
 * não muda, só a ordem em que os inimigos caem.
 */

const VIVO_EPS = 1e-9;

/**
 * O índice do inimigo mirado. `hp[i]` é a vida (fração ou pontos) do inimigo i; vivo = acima de ~0.
 * `preferido` (o toque do jogador) vale se for um índice válido e vivo; senão cai no 1º vivo; sem vivos, 0.
 */
export function escolherAlvo(hp: readonly number[], preferido?: number | null): number {
  if (preferido != null && Number.isInteger(preferido) && preferido >= 0 && preferido < hp.length && hp[preferido] > VIVO_EPS) {
    return preferido;
  }
  return Math.max(0, hp.findIndex((h) => h > VIVO_EPS));
}

/** O toque num inimigo vira a escolha só quando a luta tem MAIS de um e ele está vivo; senão a escolha anterior fica. */
export function tocarAlvo(hp: readonly number[], atual: number | null, tocado: number): number | null {
  if (hp.length < 2) return atual;
  if (!Number.isInteger(tocado) || tocado < 0 || tocado >= hp.length || !(hp[tocado] > VIVO_EPS)) return atual;
  return tocado;
}
