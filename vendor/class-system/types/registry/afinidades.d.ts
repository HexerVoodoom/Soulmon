/**
 * Tabela de afinidade elemental (pedra-papel-tesoura), inspirada no gráfico
 * de elementos de Ragnarok, nas fraquezas de Final Fantasy e nas
 * resistências de D&D.
 *
 * Cada elemento base declara contra quais elementos é FORTE (dano
 * amplificado) e FRACO (dano reduzido). Elementos derivados herdam a tabela
 * do primeiro componente da sua receita. Físico (vigor/marcial) é neutro.
 */
import { type ElementoBaseId, type ElementoDef, type ElementoId } from './elementos';
export declare const MULT_FORTE = 1.5;
export declare const MULT_FRACO = 0.5;
export declare const MULT_NEUTRO = 1;
export interface AfinidadeDef {
    forteContra: ElementoBaseId[];
    fracoContra: ElementoBaseId[];
}
/** Relações por elemento base. Vazio = neutro contra tudo (físico). */
export declare const AFINIDADES: Record<ElementoBaseId, AfinidadeDef>;
/**
 * Reduz uma DEFINIÇÃO de elemento ao seu base dominante. Trabalhar sobre a
 * definição (e não sobre o id) permite que combinações procedurais — que não
 * moram em `ELEMENTOS` — usem a mesma regra sem criar dependência circular
 * entre este registro e o de combinações.
 */
export declare function baseDominanteDoDef(def: ElementoDef | undefined): ElementoBaseId;
/** Reduz um elemento (base ou derivado curado) ao seu elemento base dominante. */
export declare function baseDominante(elemento: ElementoId): ElementoBaseId;
/**
 * Multiplicador de efetividade de um elemento atacante contra a afinidade
 * de um alvo. Físico (sem relações) é sempre neutro.
 */
export declare function efetividade(atacante: ElementoId, alvo: ElementoBaseId): number;
export declare function rotuloEfetividade(mult: number): string;
