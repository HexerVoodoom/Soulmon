/**
 * TRILHA DO PET (id `zip`, EN "Pet Trail") — a regra pura do jogo de caminho único.
 * Uma grade com números: o jogador traça UM caminho contínuo que passa pelos
 * números em ordem (1 → N) e preenche TODAS as casas, sem cruzar.
 *
 * O gerador monta o caminho hamiltoniano PRIMEIRO e só depois põe os números
 * sobre ele — por isso todo puzzle tem solução. Tudo puro (rng por parâmetro).
 * O componente (`components/mente/ZipGame.tsx`) só aplica.
 */
import { seededRng, type Rng } from './eco';

export { seededRng };
export type { Rng };

/** Teto de Bits por rodada (o funil do App ainda aplica o teto diário). */
export const ZIP_MAX_BITS = 10;
export const ZIP_MIN_SIZE = 4;
export const ZIP_MAX_SIZE = 8;

const ZIP_BITS_BY_SIZE: Record<number, number> = { 4: 2, 5: 3, 6: 5, 7: 7, 8: 10 };

export interface ZipPuzzle {
  size: number;
  /** Casa (índice linha*size+coluna) de cada número: `numbers[k]` é a casa do número k+1. */
  numbers: number[];
  /** Uma solução garantida (caminho completo, índices de casas). */
  solution: number[];
}

/** Lado da grade pelo nível (1…): 4,4,5,5,6,6,7,7,8… */
export function zipSizeForLevel(level: number): number {
  const l = Math.max(1, Math.floor(level));
  return Math.min(ZIP_MAX_SIZE, ZIP_MIN_SIZE + Math.floor((l - 1) / 2));
}

export function zipBits(size: number): number {
  return ZIP_BITS_BY_SIZE[size] ?? ZIP_BITS_BY_SIZE[ZIP_MIN_SIZE];
}

function neighbours(cell: number, size: number): number[] {
  const r = Math.floor(cell / size);
  const c = cell % size;
  const out: number[] = [];
  if (r > 0) out.push(cell - size);
  if (r < size - 1) out.push(cell + size);
  if (c > 0) out.push(cell - 1);
  if (c < size - 1) out.push(cell + 1);
  return out;
}

export function areAdjacent(a: number, b: number, size: number): boolean {
  return neighbours(a, size).includes(b);
}

/** Caminho em serpente (sempre existe) — a rede de segurança do gerador, espelhada/transposta ao acaso. */
export function serpentinePath(size: number, rng: Rng): number[] {
  const flip = rng() < 0.5;
  const transpose = rng() < 0.5;
  const path: number[] = [];
  for (let r = 0; r < size; r++) {
    for (let k = 0; k < size; k++) {
      const c = r % 2 === 0 ? k : size - 1 - k;
      const rr = flip ? size - 1 - r : r;
      path.push(transpose ? c * size + rr : rr * size + c);
    }
  }
  return path;
}

/** Caminho hamiltoniano aleatório: DFS com a heurística de Warnsdorff e orçamento de nós; cai na serpente. */
export function randomHamiltonianPath(size: number, rng: Rng): number[] {
  const total = size * size;
  const start = Math.floor(rng() * total);
  const visited = new Array<boolean>(total).fill(false);
  const path: number[] = [];
  let budget = 20000;
  const free = (c: number) => neighbours(c, size).filter(n => !visited[n]).length;
  const dfs = (cell: number): boolean => {
    if (budget-- <= 0) return false;
    visited[cell] = true;
    path.push(cell);
    if (path.length === total) return true;
    const next = neighbours(cell, size).filter(n => !visited[n])
      .map(n => ({ n, f: free(n), j: rng() }))
      .sort((a, b) => a.f - b.f || a.j - b.j);
    for (const { n } of next) if (dfs(n)) return true;
    visited[cell] = false;
    path.pop();
    return false;
  };
  if (dfs(start)) return path;
  return serpentinePath(size, rng);
}

/** Quantos números a grade leva (sempre ≥ 3). */
export function zipNumberCount(size: number): number {
  return Math.min(size + 2, Math.max(3, Math.floor(size * 1.2)));
}

/** Um puzzle do tamanho pedido, com solução garantida (o caminho nasce antes dos números). */
export function generateZip(size: number, rng: Rng): ZipPuzzle {
  const n = Math.min(ZIP_MAX_SIZE, Math.max(ZIP_MIN_SIZE, Math.floor(size)));
  const path = randomHamiltonianPath(n, rng);
  const total = path.length;
  const k = zipNumberCount(n);
  // Posições no caminho: a primeira, a última e as de dentro espaçadas com um pouco de folga.
  const positions = new Set<number>([0, total - 1]);
  for (let i = 1; i < k - 1; i++) {
    const center = (i * (total - 1)) / (k - 1);
    const jitter = Math.round((rng() - 0.5) * (total / (k - 1)) * 0.5);
    positions.add(Math.min(total - 2, Math.max(1, Math.round(center) + jitter)));
  }
  const ordered = [...positions].sort((a, b) => a - b);
  return { size: n, numbers: ordered.map(p => path[p]), solution: path };
}

/** Puzzle de um nível (nível → tamanho). */
export function zipForLevel(level: number, rng: Rng): ZipPuzzle {
  return generateZip(zipSizeForLevel(level), rng);
}

/** O caminho do jogador resolve? Todas as casas, passos vizinhos, sem repetir, números em ordem (começa no 1, termina no N). */
export function validateZip(puzzle: Pick<ZipPuzzle, 'size' | 'numbers'>, path: readonly number[]): boolean {
  const total = puzzle.size * puzzle.size;
  if (path.length !== total) return false;
  const seen = new Set<number>();
  for (let i = 0; i < path.length; i++) {
    const c = path[i];
    if (!Number.isInteger(c) || c < 0 || c >= total || seen.has(c)) return false;
    seen.add(c);
    if (i > 0 && !areAdjacent(path[i - 1], c, puzzle.size)) return false;
  }
  let last = -1;
  for (const cell of puzzle.numbers) {
    const idx = path.indexOf(cell);
    if (idx <= last) return false;
    last = idx;
  }
  return path[0] === puzzle.numbers[0] && path[total - 1] === puzzle.numbers[puzzle.numbers.length - 1];
}

/** Pode o próximo passo entrar na casa `cell`? (vizinha da ponta, livre, e número só na vez dele). */
export function canStep(puzzle: Pick<ZipPuzzle, 'size' | 'numbers'>, path: readonly number[], cell: number): boolean {
  if (path.length === 0) return cell === puzzle.numbers[0];
  if (path.includes(cell)) return false;
  if (!areAdjacent(path[path.length - 1], cell, puzzle.size)) return false;
  const k = puzzle.numbers.indexOf(cell);
  if (k < 0) return true;
  // O número k+1 só entra se todos os anteriores já estão no caminho.
  return puzzle.numbers.slice(0, k).every(n => path.includes(n));
}
