/**
 * Motor da CASCATA GERACIONAL — a segunda contabilidade dos elementos.
 *
 * `niveisEfetivos` (progressão) mede o que a ficha já consegue EXPRESSAR;
 * a cascata mede o quanto cada combinação VIROU PARTE da ficha — pontos
 * passivos acumulados pelo investimento nos pais — e é ela que decide:
 *
 *   1. quais elementos aceitam ponto DIRETO agora (17 bases + derivados
 *      DESTRAVADOS, i.e. com passivos >= limiar da aridade);
 *   2. quanto cada nó alimenta a geração seguinte (`paraCascata`).
 *
 * Fórmula (uma passada, aridade crescente — DAG estrito, sem realimentação):
 *
 *   paraCascata(X) = passivos(X) + pesoDiretoNaCascata(aridade X) × diretos(X)
 *   passivos(Y)    = min sobre pais P de floor(paraCascata(P) / divisor(Y))
 *   destravado(Y)  = passivos(Y) >= LIMIAR_DESTRAVAMENTO[aridade Y]
 *
 * O peso do direto na cascata é CUSTO_PONTO/CUSTO_CASCATA_EQUIVALENTE — a
 * paridade vale para o `paraCascata` do PRÓPRIO nó por ponto de orçamento;
 * o destrave da geração seguinte pelas bases continua a rota mais barata
 * (o `min` sobre N pais cobra N vezes) e há teste de marco MEDIDO travando.
 * NÃO "simplifique" o peso para 1: abriria arbitragem composta por geração.
 *
 * Mapas ESPARSOS: só nós tocados entram — uma ficha típica (3–5 bases) toca
 * dezenas de nós, nunca os 3.213 do espaço completo.
 */
import { type ElementoId } from '../registry/elementos';
import { type Aridade } from '../registry/geracoes';
export interface Cascata {
    /** Pontos ganhos pela cascata (nunca alocados à mão). */
    passivos: ReadonlyMap<ElementoId, number>;
    /** Pontos diretos da ficha, ecoados para leitura uniforme. */
    diretos: ReadonlyMap<ElementoId, number>;
    /** passivos + diretos — o número que a UI mostra por elemento. */
    efetivos: ReadonlyMap<ElementoId, number>;
    /** O que alimenta a geração seguinte: passivos + peso × diretos. */
    paraCascata: ReadonlyMap<ElementoId, number>;
    /** Aceita ponto direto AGORA: as 17 bases + derivados destravados. */
    destravados: ReadonlySet<ElementoId>;
    /** Só dos derivados tocados ainda travados: quanto falta para destravar. */
    progressoDestravamento: ReadonlyMap<ElementoId, {
        passivos: number;
        limiar: number;
    }>;
}
export interface OpcoesCascata {
    /** Redução do divisor (gancho do efeito de talento `cascata_divisor_reducao`). */
    reducaoDivisor?: number;
    /** Intensidade do transbordo (gancho do talento `transbordo_bonus`), mesmo
     *  fator que `progressao.ts` já aplica aos níveis efetivos. */
    bonusTransbordo?: number;
}
/**
 * Calcula a cascata inteira a partir dos pontos DIRETOS da ficha.
 * Pura e determinística; propagação PODADA — só descendentes das bases
 * tocadas (e dos derivados com ponto direto) são visitados.
 */
export declare function calcularCascata(diretosRecord: Partial<Record<ElementoId, number>>, opcoes?: OpcoesCascata): Cascata;
/** O elemento aceita ponto direto AGORA? */
export declare function podeReceberDireto(c: Cascata, id: ElementoId): boolean;
/**
 * A lista que o alocador da UI renderiza — bases primeiro (ordem canônica),
 * derivados destravados depois, por aridade e id. A UI NÃO recalcula isso.
 */
export declare function elementosAlocaveis(c: Cascata): ElementoId[];
/**
 * Custo da ficha em pontos de ORÇAMENTO (ponto direto em geração alta custa
 * mais). RELATÓRIO para UI/consumidores — o motor nunca recusa por orçamento.
 */
export declare function custoDeAlocacao(diretos: Partial<Record<ElementoId, number>>): {
    porAridade: Record<Aridade, number>;
    total: number;
};
