// ---------------------------------------------------------------------------
// CORTE × CONCUSSÃO (dono, 05/11/2026) — o ACABAMENTO VISUAL do golpe corpo a corpo. SÓ VISUAL.
//
// O Soulmon que vai corpo a corpo faz a mesma investida; o que muda é o efeito no alvo: `corte` = o risco de corte
// (`slash`, o de sempre) e `concussao` = o splash de impacto que o golpe à distância usa, SEM projétil.
// Regra (`docs/REGRA-CORTE-CONCUSSAO.md`): função PURA e determinística por lutador — palavra-chave quando há dado
// confiável (o nome de um INIMIGO do bestiário); senão sorteio ESTÁVEL (hash da chave) com peso por elemento.
// Nunca toca dano, sementes de combate nem o RNG da luta: não importa `rng`, não lê relógio, não consome nada.
// A chave do jogador/oponente do PvP vem da identidade de combate (elementos + escolas + família: ids de lista
// fechada que o servidor publica), idêntica nos dois aparelhos.
// ---------------------------------------------------------------------------
import { DERIVED_ELEMENT_PAIRS } from '../soulProfile/derivedElements';

export type ImpactoMelee = 'corte' | 'concussao';

/** % de golpes CORTANTES por elemento base (o resto é concussão). Ar 75/25 e Terra 25/75 são do dono; o resto, proposta. */
export const PESO_CORTE: Readonly<Record<string, number>> = {
  fogo: 60, agua: 35, terra: 25, ar: 75, eletricidade: 60, arcano: 60, sombra: 75, luz: 75,
  vileza: 65, morte: 70, vida: 35, vigor: 25, marcial: 50, tempo: 60, som: 40, gravidade: 15,
  espaco: 70, fada: 80, industrial: 40, planta: 65,
};
/** Sem elemento conhecido (neutro, id fora da lista): metade e metade. */
export const PESO_CORTE_NEUTRO = 50;

const DERIVADOS = new Map<string, readonly [string, string]>(DERIVED_ELEMENT_PAIRS.map(d => [d.id, d.componentes]));

/** O peso de corte (0..100) de um elemento; DERIVADO herda a média inteira dos dois componentes. */
export function pesoCorte(element: string | null | undefined): number {
  if (!element) return PESO_CORTE_NEUTRO;
  const base = PESO_CORTE[element];
  if (base !== undefined) return base;
  const comp = DERIVADOS.get(element);
  if (comp) return Math.round(((PESO_CORTE[comp[0]] ?? PESO_CORTE_NEUTRO) + (PESO_CORTE[comp[1]] ?? PESO_CORTE_NEUTRO)) / 2);
  return PESO_CORTE_NEUTRO;
}

/** Palavras (sem acento, minúsculas, PT e EN) que, no NOME de um inimigo do bestiário, dizem como ele bate. */
export const PALAVRAS_CONCUSSAO = ['golem', 'pedra', 'rocha', 'martelo', 'clava', 'maca', 'punho', 'urso', 'touro', 'rinoceronte', 'tartaruga', 'casco', 'colosso', 'titan', 'stone', 'rock', 'hammer', 'club', 'fist', 'bear', 'bull', 'rhino', 'turtle', 'shell', 'boulder'] as const;
export const PALAVRAS_CORTE = ['garra', 'lamina', 'espada', 'presa', 'gume', 'foice', 'espinho', 'asa', 'corvo', 'lobo', 'gato', 'serpente', 'aranha', 'claw', 'blade', 'sword', 'fang', 'scythe', 'thorn', 'wing', 'raven', 'wolf', 'cat', 'snake', 'spider', 'talon'] as const;

const semAcento = (s: string): string => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Palavra-chave do nome: só vale se UMA das famílias casa (as duas, ou nenhuma, caem no sorteio). Casa por palavra inteira. */
export function impactoPorNome(name: string | null | undefined): ImpactoMelee | null {
  if (!name) return null;
  const palavras = new Set(semAcento(name).split(/[^a-z]+/).filter(Boolean));
  const c = PALAVRAS_CONCUSSAO.some(p => palavras.has(p));
  const k = PALAVRAS_CORTE.some(p => palavras.has(p));
  if (c === k) return null;
  return c ? 'concussao' : 'corte';
}

/** FNV-1a de 32 bits: puro, sem estado; o mesmo texto dá o mesmo número em qualquer aparelho. */
export function hashEstavel(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}

export interface EntradaImpacto {
  /** Elemento do golpe (id de elemento; derivado herda dos componentes). */
  element?: string | null;
  /** Chave estável do lutador: o mesmo lutador sempre dá a mesma. NUNCA o id do golpe/turno. */
  key: string;
  /** Nome de um INIMIGO do bestiário (dado confiável). Nunca o nome que o jogador digitou. */
  name?: string | null;
}

/** O acabamento do golpe corpo a corpo deste lutador: palavra-chave do nome, senão sorteio estável com o peso do elemento. */
export function meleeImpactOf(e: EntradaImpacto): ImpactoMelee {
  const porNome = impactoPorNome(e.name);
  if (porNome) return porNome;
  return hashEstavel(`${e.element ?? ''}|${e.key}`) % 100 < pesoCorte(e.element) ? 'corte' : 'concussao';
}

/** A chave do lutador da identidade de combate (ids fechados que o servidor publica: igual nos dois aparelhos do PvP). */
export function chaveDaIdentidade(id: { basico: { elemento: string; escola: string | null }; especial: { elemento: string; escola: string | null; familia: string } }): string {
  return [id.basico.elemento, id.basico.escola ?? '-', id.especial.elemento, id.especial.escola ?? '-', id.especial.familia].join('|');
}
