/**
 * Ficha de personagem: apenas os pontos DIRETOS que o jogador distribuiu.
 * Tudo o mais (níveis efetivos, derivados, arquétipos) é calculado pelo
 * motor de progressão a partir daqui.
 */
import { type ElementoId } from '../registry/elementos';
import { type EscolaId } from '../registry/escolas';
import { type RecursoId } from '../registry/recursos';
import { type TalentoId } from '../registry/talentos';
import { type ProfissaoId } from '../registry/profissoes';
import type { Progressao } from './progressao';
/** Uma criatura no bestiário do jogador. nivelVinculo 0 = capturada, não domada. */
export interface CriaturaCapturada {
    criaturaId: string;
    nivelVinculo: number;
}
export declare const MAX_NIVEL_VINCULO = 5;
export interface Personagem {
    nome: string;
    /** Pontos diretos por elemento BASE (derivados não aceitam pontos). */
    elementos: Partial<Record<ElementoId, number>>;
    escolas: Partial<Record<EscolaId, number>>;
    /** Proficiência em cada recurso (pool/eficiência). */
    recursos: Partial<Record<RecursoId, number>>;
    talentos: Partial<Record<TalentoId, number>>;
    /** Criaturas capturadas (e eventualmente domadas). */
    bestiario: CriaturaCapturada[];
    /** Nível em cada profissão/ofício. */
    profissoes: Partial<Record<ProfissaoId, number>>;
}
export declare function criarPersonagem(nome: string): Personagem;
export declare function investirProfissao(p: Personagem, profissao: ProfissaoId, pontos: number): void;
/**
 * O elemento aceita ponto direto AGORA? Bases sempre; derivados só depois de
 * DESTRAVADOS pela cascata geracional (passivos >= limiar da aridade — ver
 * `engine/cascata.ts`). `prog` é opcional: a UI passa a progressão que já
 * calculou; sem ela, calcula aqui (sem ciclo — progressao importa Personagem
 * só como tipo).
 */
export declare function podeInvestir(p: Personagem, elemento: ElementoId, prog?: Progressao): {
    ok: true;
} | {
    ok: false;
    motivo: string;
    faltamPassivos?: number;
};
export declare function investirElemento(p: Personagem, elemento: ElementoId, pontos: number, prog?: Progressao): void;
/**
 * Devolve pontos DIRETOS de um elemento ao orçamento.
 *
 * NÃO passa por `podeInvestir` de propósito: desinvestir jamais pode depender
 * do destrave. O cenário que motivou isto: com lava destravada o jogador põe
 * ponto direto nela e depois tira pontos de fogo; a lava RETRANCA, mas o ponto
 * direto continua lá cobrando orçamento — e o único caminho de volta era
 * "Resetar", que apaga a build inteira. Investir tem porteiro; devolver, não.
 *
 * Zerado, o elemento sai do mapa (a ficha guarda só o que foi gasto).
 */
export declare function desinvestirElemento(p: Personagem, elemento: ElementoId, pontos: number): void;
export declare function investirEscola(p: Personagem, escola: EscolaId, pontos: number): void;
export declare function investirRecurso(p: Personagem, recurso: RecursoId, pontos: number): void;
export declare function investirTalento(p: Personagem, talento: TalentoId, ranks: number): void;
/** Captura uma criatura, se a afinidade/poder permitirem. Idempotente por id. */
export declare function capturarCriatura(p: Personagem, prog: Progressao, criaturaId: string): void;
export declare function soltarCriatura(p: Personagem, criaturaId: string): void;
/** Aumenta o vínculo de doma em 1, respeitando capacidade e talento. */
export declare function domarCriatura(p: Personagem, criaturaId: string): void;
/** Reduz o vínculo em 1 (até 0 = apenas capturada). */
export declare function afrouxarVinculo(p: Personagem, criaturaId: string): void;
