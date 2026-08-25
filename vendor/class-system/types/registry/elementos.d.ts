/**
 * Registro de elementos.
 *
 * Categorias:
 *  - "base": recebem pontos diretamente do jogador (17 elementos).
 *  - "derivado": não recebem pontos diretos; o nível é o MENOR nível efetivo
 *    entre os componentes da receita (evolução conjunta), desde que todos
 *    atinjam o mínimo. TODOS os 136 pares existem aqui, nomeados à mão.
 *    Triplas e quádruplas moram em `combinacoes.ts`: as de identidade forte
 *    são curadas, as outras 3.000 são geradas sob demanda.
 *  - "especial": derivados com receita ampla (primordial, ciclo, nulo).
 *
 * Cada elemento tem um PERFIL (pesos de dano/controle/cura/defesa/suporte)
 * que molda o resultado das skills. Derivados herdam a média dos perfis dos
 * componentes — a identidade mecânica da combinação emerge sozinha.
 */
export type ElementoBaseId = 'fogo' | 'agua' | 'terra' | 'ar' | 'eletricidade' | 'arcano' | 'sombra' | 'luz' | 'vileza' | 'morte' | 'vida' | 'vigor' | 'marcial' | 'tempo' | 'som' | 'gravidade' | 'espaco';
export interface PerfilPesos {
    dano: number;
    controle: number;
    cura: number;
    defesa: number;
    suporte: number;
}
export interface ReceitaComponente {
    elemento: ElementoBaseId;
    /** Nível efetivo mínimo do componente para o derivado existir. */
    nivelMinimo: number;
}
/**
 * Regra de CASCATA declarativa — o escape hatch dos elementos cuja cascata
 * foge do padrão (os `especial`). Sem este campo, o motor usa o default:
 * pais = sub-combinações de aridade N−1, divisor = DIVISOR_CASCata da
 * aridade, destravável. Exceção declarada no REGISTRO, nunca `if` por id
 * dentro do motor.
 */
export interface RegraCascata {
    /** Pais explícitos (default: sub-combinações de aridade N−1). */
    pais?: string[];
    /** Divisor próprio (default: DIVISOR_CASCATA[aridade]). */
    divisor?: number;
    /** false = nunca aceita ponto direto. Default: true para aridade 2..4. */
    destravavel?: boolean;
}
export interface ElementoDef {
    id: string;
    nome: string;
    tipo: 'base' | 'derivado' | 'especial';
    descricao: string;
    /** Derivados exigem investimento múltiplo, então pagam melhor por nível. */
    fatorPotencia: number;
    pesos: PerfilPesos;
    receita?: ReceitaComponente[];
    cascata?: RegraCascata;
}
/** Elementos primais: recebem transbordo de pontos de "vida". */
export declare const ELEMENTOS_PRIMAIS: ElementoBaseId[];
export declare const ELEMENTOS: Record<string, ElementoDef>;
export type ElementoId = ElementoBaseId | string;
export declare function elementosBase(): ElementoDef[];
export declare function elementosDerivados(): ElementoDef[];
/**
 * Sinergias de transbordo: pontos DIRETOS em `de` geram nível efetivo bônus
 * em cada elemento de `para`, na razão dada (arredondado para baixo).
 */
export interface Sinergia {
    de: ElementoBaseId;
    para: ElementoBaseId[];
    razao: number;
}
export declare const SINERGIAS: Sinergia[];
