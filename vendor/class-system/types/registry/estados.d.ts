/**
 * Registro de estados/condições (status ailments), inspirado nas condições
 * de D&D, nos status de Final Fantasy/Ragnarok e nos debuffs de Warcraft.
 *
 * Cada elemento base e cada escola declara quais estados suas skills podem
 * infligir. O motor reúne os estados de uma skill a partir do elemento, da
 * escola e de talentos, para a UI exibir "esta skill pode causar…".
 */
import type { ElementoBaseId } from './elementos';
import type { EscolaId } from './escolas';
export type EstadoId = 'queimadura' | 'congelamento' | 'choque' | 'petrificacao' | 'derrubada' | 'veneno' | 'sangramento' | 'atordoamento' | 'silencio' | 'cegueira' | 'medo' | 'maldicao' | 'lentidao' | 'definhamento' | 'encantado' | 'regeneracao' | 'pressa' | 'escudo' | 'furia_abencoada';
export interface EstadoDef {
    id: EstadoId;
    nome: string;
    tipo: 'ofensivo' | 'controle' | 'positivo';
    descricao: string;
}
export declare const ESTADOS: Record<EstadoId, EstadoDef>;
/** Estados que cada elemento base pode infligir. */
export declare const ESTADOS_POR_ELEMENTO: Record<ElementoBaseId, EstadoId[]>;
/** Estados que cada escola tende a aplicar, além do elemento. */
export declare const ESTADOS_POR_ESCOLA: Record<EscolaId, EstadoId[]>;
