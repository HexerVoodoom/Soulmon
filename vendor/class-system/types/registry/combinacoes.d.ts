/**
 * Motor de COMBINAÇÕES N-ÁRIAS — o espaço completo de triplas e quádruplas.
 *
 * Os 136 pares dos 17 elementos base são todos curados à mão em
 * `elementos.ts`. A partir de 3 componentes o espaço explode:
 *
 *   C(17,3) =   680 triplas
 *   C(17,4) = 2.380 quádruplas
 *
 * Curar 3.060 entradas à mão é inviável e desnecessário. A estratégia é
 * HÍBRIDA:
 *
 *  1. **Curadas** — combinações com identidade forte ganham nome, descrição e
 *     eventualmente arquétipo à mão (em `elementos.ts` ou em `CURADAS` aqui).
 *  2. **Procedurais** — todas as outras existem e são alcançáveis; nome,
 *     descrição, perfil e números são DERIVADOS das partes, sob demanda.
 *
 * A nomenclatura procedural é composicional e ensina a linhagem:
 *
 *   tripla   {a,b,c}   → "{Par(a,b)} {adjetivo(c)}"        → Lava Umbria
 *   quádrupla {a,b,c,d} → "{Par(a,b)} d{o|a} {Par(c,d)}"   → Lava do Espectro
 *
 * Como os pares já são únicos e a ordenação dos componentes é determinística,
 * os nomes gerados são provadamente únicos e estáveis entre execuções.
 *
 * COERÊNCIA — nem toda convergência custa o mesmo. Para cada par de
 * componentes olhamos as sinergias (aliados) e a tabela de afinidade
 * (opostos):
 *
 *   harmonia  → componentes que já se alimentam: barato, potência modesta.
 *   tensão    → componentes que se negam: caro de sustentar, potência maior.
 *   paradoxo  → maioria de opostos: o extremo dos dois eixos.
 *
 * Resolução é PREGUIÇOSA e cacheada: enumerar 3.060 chaves numéricas é
 * barato, materializar 3.060 objetos com nome e descrição não é.
 */
import { type ElementoBaseId, type ElementoDef, type ElementoId, type PerfilPesos } from './elementos';
export declare const ARIDADE_MAXIMA = 4;
export type Coerencia = 'harmonia' | 'neutra' | 'tensao' | 'paradoxo';
/** Metadados leves de uma combinação — o que é enumerado eagerly. */
export interface CombinacaoInfo {
    id: ElementoId;
    componentes: ElementoBaseId[];
    aridade: number;
    /** Fração de pares de componentes em oposição (0..1). */
    tensao: number;
    /** Fração de pares de componentes aliados (0..1). */
    harmonia: number;
    coerencia: Coerencia;
    fatorPotencia: number;
    nivelMinimo: number;
    /** true quando a combinação tem nome/descrição escritos à mão. */
    curada: boolean;
}
/** Fator de potência base por aridade, antes da modulação por coerência. */
export declare const FATOR_BASE_ARIDADE: Record<number, number>;
/** Nível mínimo exigido de cada componente, antes da modulação. */
export declare const MINIMO_BASE_ARIDADE: Record<number, number>;
interface LexicoElemento {
    /** Adjetivo nas duas concordâncias — o português exige. */
    adjetivo: {
        m: string;
        f: string;
    };
    /** Substantivo abstrato usado em epítetos e descrições. */
    dominio: string;
    genero: 'm' | 'f';
}
export declare const LEXICO: Record<ElementoBaseId, LexicoElemento>;
export declare function generoDoNome(nome: string): 'm' | 'f';
export declare function ordenarComponentes(comps: ElementoBaseId[]): ElementoBaseId[];
export declare function chaveCombinacao(comps: ElementoBaseId[]): string;
export interface Coesao {
    tensao: number;
    harmonia: number;
    coerencia: Coerencia;
}
export declare function coesaoDe(comps: ElementoBaseId[]): Coesao;
export declare const ROTULO_COERENCIA: Record<Coerencia, string>;
export declare const DESCRICAO_COERENCIA: Record<Coerencia, string>;
export declare function fatorDeCombinacao(comps: ElementoBaseId[], coesao?: Coesao): number;
export declare function minimoDeCombinacao(comps: ElementoBaseId[], coesao?: Coesao): number;
/** Perfil de uma combinação: média dos perfis dos componentes. */
export declare function perfilDeCombinacao(comps: ElementoBaseId[]): PerfilPesos;
/**
 * Nome composicional. Tripla herda o nome do par dominante + o adjetivo do
 * terceiro; quádrupla une os dois pares. O resultado é único porque os pares
 * são únicos e a ordenação é determinística.
 */
export declare function nomeProcedural(comps: ElementoBaseId[]): string;
export declare function descricaoProcedural(comps: ElementoBaseId[], coesao?: Coesao): string;
export interface CombinacaoCurada {
    id: string;
    nome: string;
    componentes: ElementoBaseId[];
    descricao: string;
    fator?: number;
    minimo?: number;
}
/**
 * Combinações de 3 e 4 com identidade forte demais para serem procedurais.
 * Tudo que NÃO está aqui (nem em `elementos.ts`) continua existindo — só é
 * gerado sob demanda.
 */
export declare const CURADAS: CombinacaoCurada[];
/** Todas as 680 triplas. */
export declare const TRIPLAS: CombinacaoInfo[];
/** Todas as 2.380 quádruplas. */
export declare const QUADRUPLAS: CombinacaoInfo[];
/** O espaço completo de aridade 3 e 4 (3.060 entradas). */
export declare const TODAS_COMBINACOES: CombinacaoInfo[];
export declare function combinacaoInfo(id: ElementoId): CombinacaoInfo | undefined;
export declare function combinacaoInfoPorComponentes(comps: ElementoBaseId[]): CombinacaoInfo | undefined;
/**
 * Resolve QUALQUER elemento por id: base, derivado curado, ou combinação
 * procedural de 3/4 componentes materializada sob demanda e cacheada.
 */
export declare function elementoDef(id: ElementoId): ElementoDef | undefined;
/**
 * Resolve pelos componentes, em qualquer ordem e em QUALQUER aridade: um
 * componente devolve o elemento base, dois devolvem o par curado em
 * `elementos.ts`, três e quatro passam pelo espaço enumerado aqui, e receitas
 * mais amplas (primordial, ciclo, nulo) caem no índice de curadas.
 */
export declare function elementoDePorComponentes(comps: ElementoBaseId[]): ElementoDef | undefined;
/** Nome de exibição de um elemento, resolvendo procedurais. */
export declare function nomeElemento(id: ElementoId): string;
/** Aridade de um elemento: 1 para base, N para o tamanho da receita. */
export declare function aridadeDe(id: ElementoId): number;
/**
 * Base dominante de QUALQUER elemento, inclusive combinações procedurais.
 * É a versão que o motor deve usar; `afinidades.baseDominante` só enxerga o
 * registro curado.
 */
export declare function baseDominanteDe(id: ElementoId): ElementoBaseId;
/** Efetividade contra um alvo, resolvendo combinações procedurais. */
export declare function efetividadeDe(atacante: ElementoId, alvo: ElementoBaseId): number;
/**
 * Progresso de uma combinação dado o mapa de níveis efetivos: 0..1, onde 1
 * significa que todos os componentes atingiram o mínimo da receita.
 */
export declare function progressoCombinacao(info: CombinacaoInfo, niveis: Partial<Record<ElementoId, number>>): number;
/**
 * As combinações relevantes para uma ficha: desbloqueadas primeiro, depois as
 * mais próximas de desbloquear. É o que a constelação desenha — nunca as 3.060.
 */
export declare function combinacoesRelevantes(niveis: Partial<Record<ElementoId, number>>, opcoes?: {
    limite?: number;
    progressoMinimo?: number;
    aridades?: number[];
}): {
    info: CombinacaoInfo;
    progresso: number;
    nivel: number;
}[];
/** Busca textual sobre o espaço completo, resolvendo nomes sob demanda. */
export declare function buscarCombinacoes(termo: string, limite?: number): CombinacaoInfo[];
/**
 * Pais de cascata de QUALQUER elemento (base → [], par → bases, tripla →
 * pares, quádrupla → triplas; especiais → a declaração do registro).
 * Cacheado por id; devolve sempre ids de aridade estritamente menor.
 */
export declare function paisDeCascata(id: ElementoId): ElementoId[];
export {};
