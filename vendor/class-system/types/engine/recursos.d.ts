/**
 * Simuladores de recurso em tempo real. Cada um implementa a dinâmica
 * descrita no registro:
 *  - Mana: previsível — custo fixo, regen constante.
 *  - Fé: penalidade acumulada a cada uso encarece os próximos; decai
 *    exponencialmente enquanto você não usa.
 *  - Fúria: só nasce do combate (dano causado/recebido) e escoa fora dele.
 *  - Soullink: o pool É a sua vida; consome-a em troca de mais poder e
 *    trava no limiar vital.
 *  - Ressonância: cada uso empilha um multiplicador de poder; ficar sem
 *    usar além da janela reseta o acúmulo para o estado fraco.
 */
import { type RecursoId } from '../registry/recursos';
export interface EstadoRecurso {
    readonly recurso: RecursoId;
    readonly atual: number;
    readonly maximo: number;
    /** Custo que este estado cobraria agora por um custo-base dado. */
    custoEfetivo(custoBase: number): number;
    /** True se `usar` com esse custo teria sucesso agora (sem efeitos). */
    podePagar(custoBase: number): boolean;
    /** Tenta pagar; retorna false (sem efeitos) se não há recurso suficiente. */
    usar(custoBase: number): boolean;
    /** Avança a simulação em dt segundos. */
    tick(dtSegundos: number): void;
}
export declare class ManaEstado implements EstadoRecurso {
    readonly recurso: RecursoId;
    readonly maximo: number;
    atual: number;
    private readonly regen;
    constructor(proficiencia?: number);
    custoEfetivo(custoBase: number): number;
    podePagar(custoBase: number): boolean;
    usar(custoBase: number): boolean;
    tick(dt: number): void;
}
export declare class FeEstado implements EstadoRecurso {
    readonly recurso: RecursoId;
    readonly maximo: number;
    atual: number;
    /** Penalidade acumulada; multiplicador de custo = 1 + penalidade. */
    penalidade: number;
    private readonly regen;
    private readonly acumuloPorEnergia;
    private readonly meiaVida;
    private readonly multiplicadorMaximo;
    constructor(proficiencia?: number);
    get multiplicadorAtual(): number;
    custoEfetivo(custoBase: number): number;
    podePagar(custoBase: number): boolean;
    usar(custoBase: number): boolean;
    tick(dt: number): void;
}
export declare class FuriaEstado implements EstadoRecurso {
    readonly recurso: RecursoId;
    readonly maximo: number;
    atual: number;
    private segundosDesdeUltimoCombate;
    private readonly ganhoCausado;
    private readonly ganhoRecebido;
    private readonly decaimento;
    private readonly janelaCombate;
    constructor(proficiencia?: number);
    get emCombate(): boolean;
    aoCausarDano(dano: number): void;
    aoReceberDano(dano: number): void;
    custoEfetivo(custoBase: number): number;
    podePagar(custoBase: number): boolean;
    usar(custoBase: number): boolean;
    tick(dt: number): void;
}
export declare class SoullinkEstado implements EstadoRecurso {
    readonly recurso: RecursoId;
    /** O pool é a própria vida do personagem. */
    readonly maximo: number;
    atual: number;
    readonly limiarVital: number;
    private readonly regen;
    constructor(proficiencia?: number);
    custoEfetivo(custoBase: number): number;
    podePagar(custoBase: number): boolean;
    usar(custoBase: number): boolean;
    tick(dt: number): void;
}
export declare class RessonanciaEstado implements EstadoRecurso {
    readonly recurso: RecursoId;
    readonly maximo: number;
    atual: number;
    /** Multiplicador de poder acumulado (começa fraco em 1.0). */
    multiplicadorAtual: number;
    private segundosDesdeUltimoUso;
    private readonly regen;
    private readonly acumuloPorUso;
    private readonly multiplicadorMaximo;
    private readonly janelaReset;
    constructor(proficiencia?: number);
    custoEfetivo(custoBase: number): number;
    podePagar(custoBase: number): boolean;
    usar(custoBase: number): boolean;
    tick(dt: number): void;
}
export declare function criarEstadoRecurso(recurso: RecursoId, proficiencia?: number): EstadoRecurso;
