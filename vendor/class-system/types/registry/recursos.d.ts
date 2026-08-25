/**
 * Registro de recursos (o que alimenta as skills).
 *
 * Cada recurso tem um modelo de custo próprio:
 *  - mana: gasto contínuo e previsível (custo fixo, regen constante).
 *  - fe: quanto mais usa, mais caro fica (penalidade acumulada que decai
 *    quando você fica um tempo sem usar).
 *  - furia: não regenera sozinha; é gerada ao causar e ao receber dano em
 *    combate, e decai fora de combate.
 *  - soullink: paga o custo com a própria VIDA e amplifica o poder da
 *    skill; trava num limiar mínimo para não se matar.
 *  - ressonancia: começa fraca e fica mais forte a cada uso (multiplicador
 *    de poder acumulado); ficar um tempo sem usar reseta o acúmulo.
 */
export type RecursoId = 'mana' | 'fe' | 'furia' | 'soullink' | 'ressonancia';
export interface RecursoDef {
    id: RecursoId;
    nome: string;
    descricao: string;
    /** Pool base no nível 0 de proficiência. */
    poolBase: number;
    /** Pool ganho por ponto de proficiência no recurso. */
    poolPorProficiencia: number;
    parametros: Record<string, number>;
}
export declare const RECURSOS: Record<RecursoId, RecursoDef>;
