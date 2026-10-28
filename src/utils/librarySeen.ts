/**
 * "JÁ VISTOS" DA BIBLIOTECA (H17) — dono único da lista local de ids de Soulmon de jogadores que a pessoa já viu.
 * Dois caminhos escrevem aqui, com a MESMA regra: abrir a ficha na Biblioteca e ENFRENTAR o oponente (Torneio/Duelo).
 * O cliente não distingue jogador de simulado (o servidor nunca expõe a flag), então todo oponente entra igual.
 * Idempotente (mesmo id nunca duplica) e tolerante a lixo/storage indisponível (`safeStorage`). Chave congelada:
 * `STORAGE_KEYS.LIBRARY_SEEN`.
 */
import { readJson, writeJson } from './safeStorage';
import { STORAGE_KEYS } from './storageKeys';

/** Os ids já vistos, lidos com defesa (lixo vira lista vazia). */
export function readSeenIds(): string[] {
  const v = readJson<unknown>(STORAGE_KEYS.LIBRARY_SEEN, []);
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

/** Marca `id` como visto. Devolve a lista resultante (a mesma referência de `prev` se já estava). */
export function addSeenId(prev: readonly string[], id: string): readonly string[] {
  return prev.includes(id) ? prev : [...prev, id];
}

/** Lê, marca e grava. Sem efeito para id vazio ou já visto. */
export function markSeenId(id: string | null | undefined): void {
  if (!id || typeof id !== 'string') return;
  const cur = readSeenIds();
  if (cur.includes(id)) return;
  writeJson(STORAGE_KEYS.LIBRARY_SEEN, [...cur, id]);
}
