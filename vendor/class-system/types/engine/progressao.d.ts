/**
 * Motor de progressão: transforma os pontos diretos da ficha em
 *  1. níveis EFETIVOS de elementos base (diretos + transbordo de sinergias);
 *  2. níveis de elementos derivados (menor nível efetivo dos componentes,
 *     desde que todos atinjam o mínimo da receita);
 *  3. arquétipos desbloqueados (combinações de elemento + escola + recurso).
 *
 * O transbordo é calculado só a partir de pontos DIRETOS (uma passada),
 * para o sistema ser previsível e sem ciclos de realimentação.
 */
import { type ElementoId } from '../registry/elementos';
import { type CombinacaoInfo } from '../registry/combinacoes';
import { type Cascata } from './cascata';
import { type ArquetipoDef } from '../registry/arquetipos';
import type { Personagem } from './personagem';
export interface Progressao {
    /** Nível efetivo de todo elemento (base com transbordo + derivados). */
    niveisEfetivos: Record<ElementoId, number>;
    /** Detalhe do transbordo recebido por elemento base. */
    transbordo: Partial<Record<ElementoId, number>>;
    /** Quanto os talentos reduziram o mínimo exigido por cada receita. */
    reducaoMinimoReceita: number;
    /** Níveis extras concedidos a todo elemento derivado desbloqueado. */
    bonusNivelDerivado: number;
    /** Elementos com nível efetivo > 0, utilizáveis em skills. */
    elementosDisponiveis: ElementoId[];
    /**
     * Combinações de 3/4 componentes desbloqueadas — subconjunto minúsculo das
     * 3.060 possíveis. Só o que a ficha realmente alcançou é materializado.
     */
    combinacoesLiberadas: CombinacaoInfo[];
    /**
     * A contabilidade da ALOCAÇÃO GERACIONAL: pontos passivos por cascata,
     * destravamentos e o que alimenta a geração seguinte. NÃO substitui
     * `niveisEfetivos` — mede outra coisa (ver `engine/cascata.ts`).
     */
    cascata: Cascata;
    /** Atalho para a UI: ids que aceitam ponto direto AGORA. */
    alocaveis: ElementoId[];
    arquetipos: ArquetipoDef[];
    capacidades: Set<string>;
    /**
     * MEIAS-IDENTIDADES. Combinações de 3+ componentes concedem versões
     * DILUÍDAS das capacidades dos arquétipos ligados aos seus sub-pares.
     *
     * É a resposta ao modo de falha clássico dos sistemas de aridade alta: se
     * combinar mais só desse um multiplicador maior, o jogador ótimo sempre
     * sobe a escada e as combinações menores viram conteúdo de passagem. Aqui,
     * combinar mais compra LARGURA DE IDENTIDADE — várias meias-classes em vez
     * de uma classe mais forte. Skills que exigem a capacidade funcionam com a
     * versão diluída, com penalidade de poder.
     */
    capacidadesDiluidas: Set<string>;
    /** Arquétipos de que o personagem tem apenas a meia-identidade. */
    arquetiposDiluidos: ArquetipoDef[];
}
/** Penalidade de poder ao usar uma capacidade em versão diluída. */
export declare const PENALIDADE_CAPACIDADE_DILUIDA = 0.18;
export declare function calcularProgressao(p: Personagem): Progressao;
