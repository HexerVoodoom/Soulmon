// Índice do próximo sorteio: aleatório, nunca igual ao anterior (n >= 2).
export function proximoSorteio(n: number, anterior: number, rnd: () => number = Math.random): number {
  if (n < 2) return 0;
  const i = Math.floor(rnd() * n);
  return i === anterior ? (i + 1 + Math.floor(rnd() * (n - 1))) % n : i;
}
