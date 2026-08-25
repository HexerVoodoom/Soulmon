/**
 * Registro de arquétipos: identidades que EMERGEM da distribuição de pontos
 * — nunca são escolhidas. Condições podem exigir níveis efetivos de
 * elementos (inclusive DERIVADOS, já que eles têm nível efetivo), níveis de
 * escola e proficiência de recurso.
 *
 * Cada arquétipo libera capacidades que skills podem exigir.
 */
import type { ElementoId } from './elementos';
import type { EscolaId } from './escolas';
import type { RecursoId } from './recursos';
export interface CondicaoArquetipo {
    elementos?: Partial<Record<ElementoId, number>>;
    escolas?: Partial<Record<EscolaId, number>>;
    recursos?: Partial<Record<RecursoId, number>>;
}
export interface ArquetipoDef {
    id: string;
    nome: string;
    descricao: string;
    condicao: CondicaoArquetipo;
    capacidades: string[];
}
export declare const ARQUETIPOS: Record<string, ArquetipoDef>;
