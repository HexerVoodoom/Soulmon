/**
 * Registro de PROFISSÕES (ofícios de criação), inspirado nas professions de
 * World of Warcraft (Ferraria, Alfaiataria, Engenharia…) e na forja
 * elemental de Ragnarok.
 *
 * A ideia central: o item criado não vem só da profissão — o RESTO DA FICHA
 * o molda. Um ferreiro com maestria em fogo E frio faz uma Têmpera Perfeita;
 * com veneno, uma lâmina envenenada; com gravidade/espaço, um machado
 * flutuante. As "propriedades emergentes" declaram os requisitos (elementos
 * com maestria, talentos, nível de profissão) e o motor descobre quais se
 * aplicam a cada item.
 */
import type { ElementoId } from './elementos';
import type { EscolaId } from './escolas';
import type { TalentoId } from './talentos';
import type { FamiliaCriatura } from './criaturas';
export type ProfissaoId = 'ferreiro' | 'tecelao' | 'artesao' | 'joalheiro' | 'alquimista' | 'curtidor' | 'encantador' | 'escriba' | 'cozinheiro' | 'luthier' | 'cartografo';
export type CategoriaItem = 'arma' | 'armadura' | 'acessorio' | 'consumivel';
export interface ProfissaoDef {
    id: ProfissaoId;
    nome: string;
    descricao: string;
    /** Pesos: elementos (base ou derivados) que elevam a qualidade do trabalho. */
    fatoresElementos: Partial<Record<ElementoId, number>>;
    /** Pesos de escola que ajudam (ex.: conjuração ajuda o artesão). */
    fatoresEscolas?: Partial<Record<EscolaId, number>>;
}
export interface ItemBaseDef {
    id: string;
    nome: string;
    profissao: ProfissaoId;
    categoria: CategoriaItem;
    descricao: string;
}
/** Uma propriedade que pode emergir num item, dada a ficha do artesão. */
export interface PropriedadeItemDef {
    id: string;
    nome: string;
    descricao: string;
    /** Categorias de item em que pode aparecer. */
    categorias: CategoriaItem[];
    /** Exige maestria (nível efetivo ≥ limiar) em TODOS estes elementos. */
    requerTodos?: ElementoId[];
    /** Exige maestria em ao menos UM destes elementos. */
    requerAlgum?: ElementoId[];
    /** Exige um talento investido. */
    requerTalento?: TalentoId;
    /** Exige nível mínimo na profissão. */
    requerProfissaoNivel?: number;
    /** Quanto adiciona à qualidade do item. */
    bonusQualidade: number;
}
export declare const PROFISSOES: Record<ProfissaoId, ProfissaoDef>;
export declare const ITENS_BASE: Record<string, ItemBaseDef>;
export declare function itensDaProfissao(profissao: ProfissaoId): ItemBaseDef[];
/**
 * Propriedades emergentes: cada uma exige uma combinação da ficha. O motor
 * verifica maestria (nível efetivo) nos elementos exigidos.
 */
export declare const PROPRIEDADES_ITEM: Record<string, PropriedadeItemDef>;
export declare function propriedades(): PropriedadeItemDef[];
/**
 * Materiais de criatura: a pele/carcaça de cada FAMÍLIA do bestiário vira um
 * material que o artesão pode usar. Cada material adiciona qualidade
 * (proporcional ao poder-base da criatura) e uma propriedade própria — a
 * ponte entre captura e ofício.
 */
export interface MaterialCriaturaDef {
    familia: FamiliaCriatura;
    material: string;
    /** Propriedade concedida ao item, com seu bônus de qualidade. */
    propriedade: {
        nome: string;
        descricao: string;
        categorias: CategoriaItem[];
        bonusQualidade: number;
    };
    /** Bônus de qualidade por ponto de poder-base da criatura usada. */
    qualidadePorPoder: number;
}
export declare const MATERIAIS_CRIATURA: Record<FamiliaCriatura, MaterialCriaturaDef>;
