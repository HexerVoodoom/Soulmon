/**
 * Motor de profissões: calcula a qualidade e as propriedades emergentes de
 * um item criado, a partir do nível de profissão e do RESTO DA FICHA
 * (elementos com maestria, escolas, talentos).
 */
import { type ElementoId } from '../registry/elementos';
import { type ItemBaseDef, type ProfissaoId, type PropriedadeItemDef } from '../registry/profissoes';
import type { Personagem } from './personagem';
import type { Progressao } from './progressao';
export interface TierQualidade {
    nome: string;
    cor: string;
    minimo: number;
}
/** Faixas de qualidade, da mais baixa para a mais alta. */
export declare const TIERS: TierQualidade[];
export declare function tierDe(qualidade: number): TierQualidade;
export interface ConfigCraft {
    profissao: ProfissaoId;
    itemId: string;
    /** Elementos que o artesão escolhe imbuir (dentre os que domina). */
    elementosImbuidos: ElementoId[];
    /** Criatura do bestiário usada como material (só Curtidor). */
    materialCriaturaId?: string;
}
export interface ResultadoCraft {
    valida: boolean;
    erros: string[];
    item?: ItemBaseDef;
    qualidade: number;
    tier: TierQualidade;
    nomeItem: string;
    propriedades: PropriedadeItemDef[];
    /** Contribuições de atributo para a qualidade (rótulo → valor). */
    atributos: {
        rotulo: string;
        valor: number;
    }[];
}
/** Elementos (base ou derivados) que o personagem domina para imbuir. */
export declare function elementosDominados(prog: Progressao, limiar?: number): ElementoId[];
export declare function craftar(p: Personagem, prog: Progressao, cfg: ConfigCraft): ResultadoCraft;
