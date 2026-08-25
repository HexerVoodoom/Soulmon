/**
 * Registro do bestiário — criaturas SELVAGENS que podem ser capturadas.
 *
 * Captura depende da AFINIDADE ELEMENTAL do jogador: cada criatura só pode
 * ser capturada por quem tem pontos em um dos seus elementos de afinidade
 * (ex.: uma fera ígnea exige Fogo; um animal exige Vida ou Vigor).
 *
 * Depois de capturada, a criatura pode ser evocada — opcionalmente imbuída
 * de um elemento no qual o jogador tem MAESTRIA, herdando aquele elemento.
 *
 * As evocações BÁSICAS (elemental do elemento) e ALEATÓRIAS não usam este
 * registro — só a evocação de criatura capturada.
 */
import type { ElementoBaseId } from './elementos';
export type FamiliaCriatura = 'besta' | 'ave' | 'aquatica' | 'ignea' | 'morto_vivo' | 'aberracao' | 'planta' | 'espirito' | 'construto' | 'demonio' | 'draconico' | 'gigante' | 'geleia' | 'humanoide';
export interface CriaturaDef {
    id: string;
    nome: string;
    familia: FamiliaCriatura;
    /** Elementos que PODEM capturá-la (o jogador precisa de pontos em um deles). */
    afinidades: ElementoBaseId[];
    /**
     * Dificuldade/raridade: o poder de captura do jogador precisa alcançá-la.
     * Também é o poder-base da criatura ao ser evocada.
     */
    poderBase: number;
    descricao: string;
}
export declare const FAMILIAS: Record<FamiliaCriatura, {
    nome: string;
    descricao: string;
}>;
export declare const CRIATURAS: Record<string, CriaturaDef>;
export declare function criaturas(): CriaturaDef[];
