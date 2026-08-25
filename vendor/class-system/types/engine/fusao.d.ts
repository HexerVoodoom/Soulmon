/**
 * FUSÃO DE SKILLS — 2ª e 3ª geração.
 *
 * A ideia central, e o que amarra esta camada ao resto do sistema: **fundir
 * skills funde os elementos delas**. Duas skills de Fogo e Terra viram uma
 * skill de **Lava**. Três skills de Fogo, Terra e Sombra viram a tripla
 * correspondente. Quatro, a quádrupla. A árvore de combinações da Camada 1
 * deixa de ser só um mapa de progressão e vira a **gramática das fusões**.
 *
 *   2 skills componentes → geração 2
 *   3 ou 4 componentes   → geração 3
 *
 * MODO DE FUSÃO — não se escolhe, emerge da relação entre os componentes,
 * exatamente como os arquétipos emergem da distribuição de pontos.
 *
 * BALANCEAMENTO — a fusão não tem fórmula própria. Ela **monta uma SkillConfig
 * sintética** e chama `calcularSkill`. Assim herda o invariante de orçamento
 * inteiro, sem risco de as duas fórmulas divergirem com o tempo. Por cima
 * disso aplica só duas coisas:
 *
 *   - o **fator do modo** (pequeno, 1.05–1.18);
 *   - a **taxa de fusão** sobre o custo (1.15× na 2ª geração, 1.35× na 3ª).
 *
 * O resultado é deliberado: fundir é **menos eficiente** por ponto de energia
 * do que lançar as skills separadamente. O que se compra é qualidade — uma
 * ação em vez de N, o perfil e os estados do elemento combinado, e as
 * propriedades emergentes. Fusão que fosse sempre mais eficiente seria
 * obrigatória, e escolha obrigatória não é escolha.
 */
import { type ElementoBaseId, type ElementoId } from '../registry/elementos';
import { type Coerencia } from '../registry/combinacoes';
import { type EscolaId } from '../registry/escolas';
import type { ModificadorId } from '../registry/modificadores';
import type { Personagem } from './personagem';
import type { Progressao } from './progressao';
import { type ResultadoSkill, type SkillConfig } from './skills';
export type ModoFusao = 'sequencia' | 'amalgama' | 'ressonancia' | 'catalise' | 'prisma';
export interface ModoFusaoDef {
    id: ModoFusao;
    nome: string;
    descricao: string;
    /** Multiplicador sobre o orçamento da skill fundida. */
    fator: number;
    /** Multiplicador extra sobre o custo, além da taxa de geração. */
    taxaCusto: number;
}
export declare const MODOS_FUSAO: Record<ModoFusao, ModoFusaoDef>;
export interface FusaoConfig {
    nome: string;
    /** 2 a 4 skills componentes. */
    componentes: SkillConfig[];
    /** Escola resultante; padrão: a do primeiro componente. */
    escolaDominante?: EscolaId;
    /** Modificadores aplicados sobre a skill FUNDIDA (não sobre os componentes). */
    modificadores?: ModificadorId[];
    alvoElemento?: ElementoBaseId;
}
export interface ResultadoFusao {
    valida: boolean;
    erros: string[];
    avisos: string[];
    geracao: 2 | 3;
    modo: ModoFusaoDef;
    coerencia: Coerencia;
    /** Elemento que a fusão produziu — a combinação dos elementos componentes. */
    elementoResultante: ElementoId;
    nomeElementoResultante: string;
    /** Elementos base que entraram na receita da fusão. */
    basesEnvolvidas: ElementoBaseId[];
    /** A skill sintética que o motor calculou — reaproveita toda a Camada 5. */
    skillResultante: SkillConfig;
    resultado: ResultadoSkill;
    /** Resultado de cada componente lançado isoladamente, para comparação. */
    componentes: ResultadoSkill[];
    /** Soma dos impactos dos componentes lançados separadamente. */
    impactoSeparado: number;
    /** Soma dos custos dos componentes lançados separadamente. */
    custoSeparado: number;
    /** impactoFundido ÷ impactoSeparado. Abaixo de 1 = fundir perde poder bruto. */
    ganhoDeFusao: number;
    /** custoFundido ÷ custoSeparado. Sempre > 1 — é a taxa de fusão. */
    taxaDeCusto: number;
    tetoGanhoAtingido: boolean;
    propriedadesEmergentes: {
        chave: string;
        rotulo: string;
        valor: number;
    }[];
}
/** Redução da taxa de custo da fusão vinda de talentos (Arte da Fusão). */
export declare function descontoDeFusao(p: Personagem): number;
export declare function calcularFusao(p: Personagem, prog: Progressao, cfg: FusaoConfig): ResultadoFusao;
/**
 * Prévia barata: que elemento sairia da fusão destas skills, e o modo — sem
 * calcular nada. Alimenta a UI enquanto o jogador escolhe os componentes.
 */
export declare function previewFusao(prog: Progressao, componentes: Pick<SkillConfig, 'elemento' | 'escola'>[]): {
    geracao: 2 | 3;
    bases: ElementoBaseId[];
    elemento?: ElementoId;
    nome?: string;
    liberado: boolean;
    modo: ModoFusaoDef;
};
/** Rótulo curto da escola resultante, para a UI. */
export declare function nomeEscola(escola: EscolaId): string;
