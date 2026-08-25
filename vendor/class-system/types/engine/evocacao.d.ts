/**
 * Motor de Evocação: captura, doma e os três modos de evocar.
 *
 * MODOS
 *  - elemental: evocação básica de um elemento com nível — invoca um
 *    elemental. Sempre disponível, não precisa capturar nada.
 *  - aleatoria: invoca uma criatura qualquer; quanto mais pontos em
 *    Evocação, mais poderosa. Sempre disponível.
 *  - capturada: invoca uma criatura previamente capturada, opcionalmente
 *    IMBUÍDA de um elemento no qual o jogador tem maestria.
 *
 * CAPTURA depende da afinidade elemental: só se captura criatura cujo
 * elemento de afinidade o jogador possui (com pontos). O poder de captura
 * escala com o nível nesse elemento, com Evocação e com o talento de caça.
 *
 * DOMA é o vínculo permanente: criaturas vinculadas ganham bônus e evoluem
 * com o nível de vínculo. A capacidade de vínculo vem dos talentos de Doma.
 */
import { type ElementoBaseId, type ElementoId } from '../registry/elementos';
import { type CriaturaDef, type FamiliaCriatura } from '../registry/criaturas';
import type { Personagem } from './personagem';
import type { Progressao } from './progressao';
export type ModoEvocacao = 'elemental' | 'aleatoria' | 'capturada';
export declare const MAESTRIA_LIMIAR = 8;
/** Elementos (base ou derivados) com nível efetivo suficiente para imbuir. */
export declare function elementosDeMaestria(prog: Progressao, limiar?: number): ElementoId[];
/** Poder de captura do jogador contra uma criatura (0 se não tem afinidade). */
export declare function poderCaptura(p: Personagem, prog: Progressao, criatura: CriaturaDef): number;
export interface AvaliacaoCaptura {
    capturavel: boolean;
    poder: number;
    exigido: number;
    motivo?: string;
}
export declare function avaliarCaptura(p: Personagem, prog: Progressao, criaturaId: string): AvaliacaoCaptura;
/** Famílias que o jogador consegue capturar hoje (tem afinidade + poder). */
export declare function familiasCapturaveis(p: Personagem, prog: Progressao): Set<string>;
/** Capacidade de vínculo (quantas criaturas podem ser domadas ao mesmo tempo). */
export declare function capacidadeVinculo(p: Personagem): number;
/** Bônus de poder de uma fera vinculada, dado o nível de vínculo. */
export declare function bonusVinculo(p: Personagem, nivelVinculo: number): number;
export interface ConfigEvocacao {
    modo: ModoEvocacao;
    /** modo 'elemental': o elemento a evocar. */
    elemento?: ElementoId;
    /** modo 'capturada': a criatura. */
    criaturaId?: string;
    /** modo 'capturada': elemento de maestria para imbuir (opcional). */
    elementoImbuido?: ElementoId;
    /** modo 'capturada': nível de vínculo da criatura (0 = não domada). */
    nivelVinculo?: number;
}
export interface ResultadoEvocacao {
    valida: boolean;
    erros: string[];
    nome: string;
    familia?: string;
    poder: number;
    imbuido?: ElementoId;
    vinculada: boolean;
}
export declare function evocar(p: Personagem, prog: Progressao, cfg: ConfigEvocacao): ResultadoEvocacao;
/** Atalho: para uma UI listar quais elementos base o jogador tem afinidade. */
export declare function afinidadesAtivas(p: Personagem): ElementoBaseId[];
/** Famílias grandes/robustas o suficiente para servir de montaria. */
export declare const FAMILIAS_MONTAVEIS: FamiliaCriatura[];
export interface AvaliacaoMontaria {
    montavel: boolean;
    motivo?: string;
}
/** Pode montar esta criatura? Exige talento Montaria, vínculo e porte. */
export declare function avaliarMontaria(p: Personagem, criaturaId: string): AvaliacaoMontaria;
/** Bônus de sinergia de combate (você + fera lutando juntos), fração. */
export declare function bonusSinergiaCombate(p: Personagem): number;
/**
 * Bônus fracionário de uma skill lançada montado numa fera: Carga Montada +
 * Sincronia + porte da montaria. Zero se a criatura não é montável.
 */
export declare function bonusMontaria(p: Personagem, criaturaId: string): number;
