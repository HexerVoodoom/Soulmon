/**
 * CONSULTAS — a superfície do Class System legível por máquina.
 *
 * O motor (`engine/`) responde "quanto vale esta configuração?". Esta camada
 * responde as perguntas que um **agente** ou um **programa** de fato faz:
 *
 *   - o que esta ficha já alcançou?
 *   - o que está a um passo, e quantos pontos custa?
 *   - qual o caminho mais barato até este arquétipo?
 *   - por que esta skill é inválida, e o que destrava?
 *   - o que existe no sistema com este nome?
 *
 * Três regras que valem para tudo aqui:
 *
 *  1. **Determinismo.** Mesma entrada → mesma saída, byte a byte. Toda
 *     ordenação tem desempate estável por id. Sem relógio, sem aleatório.
 *  2. **Orçamento de contexto.** Toda consulta que pode devolver muita coisa
 *     tem um `limite` com default modesto, e informa quanto ficou de fora.
 *  3. **Erro que ensina.** Diagnóstico traz o motivo E o que fazer a respeito,
 *     porque quem consome isto não tem como adivinhar.
 */
import { type ElementoBaseId, type ElementoId } from '../registry/elementos';
import { chaveCombinacao, progressoCombinacao } from '../registry/combinacoes';
import { type EscolaId } from '../registry/escolas';
import { type RecursoId } from '../registry/recursos';
import { type TalentoId } from '../registry/talentos';
import { type ModificadorId } from '../registry/modificadores';
import { type Personagem } from '../engine/personagem';
import { type SkillConfig } from '../engine/skills';
import { type FusaoConfig } from '../engine/fusao';
export interface Panorama {
    elementosBase: number;
    pares: number;
    triplas: number;
    quadruplas: number;
    elementosAlcancaveis: number;
    combinacoesCuradas: number;
    escolas: number;
    recursos: number;
    talentos: number;
    arquetipos: number;
    profissoes: number;
    itensBase: number;
    propriedadesItem: number;
    modificadores: number;
    modosDeFusao: number;
    criaturas: number;
}
/**
 * O tamanho do sistema em números. É a primeira consulta que um agente sem
 * contexto deve fazer: barata, e situa a escala de tudo mais.
 */
export declare function panorama(): Panorama;
/**
 * Traduz "quero o elemento X no nível N" para os níveis EFETIVOS que cada
 * elemento base precisa ter. Resolve receitas recursivamente, e respeita o
 * nível mínimo de cada componente.
 *
 * É a peça central de todo planejamento: arquétipos, combinações e
 * propriedades de item são todos declarados em cima de elementos, e só isto
 * converte a declaração em pontos.
 */
export declare function requisitosBase(elemento: ElementoId, nivel: number, acumulado?: Partial<Record<ElementoBaseId, number>>): Partial<Record<ElementoBaseId, number>>;
/**
 * Converte níveis efetivos exigidos em PONTOS DIRETOS, aproveitando o
 * transbordo das sinergias. Um alvo de vigor 12 fica mais barato se a ficha já
 * investe em vida, porque vida vaza para vigor.
 *
 * A descida é gulosa e sempre verificada: se o desconto por sinergia deixar de
 * atender o alvo, a função devolve a solução ingênua (sem desconto), que é
 * correta por construção. Nunca devolve um plano que não funciona.
 */
export declare function pontosDiretosPara(alvoEfetivo: Partial<Record<ElementoBaseId, number>>, base?: Partial<Record<ElementoBaseId, number>>): Partial<Record<ElementoBaseId, number>>;
export declare function totalDePontos(m: Partial<Record<string, number>>): number;
export interface ResumoElemento {
    id: ElementoId;
    nome: string;
    tipo: string;
    aridade: number;
    nivel: number;
    /** Só em derivados: quanto veio de transbordo em cada componente. */
    componentes?: string[];
}
export interface AnaliseFicha {
    nome: string;
    pontos: {
        elementos: number;
        escolas: number;
        recursos: number;
        talentos: number;
        profissoes: number;
        total: number;
    };
    elementosBase: {
        id: ElementoBaseId;
        direto: number;
        transbordo: number;
        efetivo: number;
    }[];
    derivadosAbertos: ResumoElemento[];
    combinacoesAbertas: number;
    arquetipos: {
        id: string;
        nome: string;
        capacidades: string[];
    }[];
    arquetiposDiluidos: {
        id: string;
        nome: string;
    }[];
    capacidades: string[];
    capacidadesDiluidas: string[];
    talentos: {
        id: TalentoId;
        nome: string;
        ranks: number;
        maximo: number;
    }[];
    avisos: string[];
}
/** Leitura completa de uma ficha: o que ela é hoje. */
export declare function analisarFicha(p: Personagem, limiteDerivados?: number): AnaliseFicha;
export interface CombinacaoProxima {
    id: ElementoId;
    nome: string;
    aridade: number;
    coerencia: string;
    curada: boolean;
    progresso: number;
    /** Pontos DIRETOS que faltam, por elemento base. */
    faltam: Partial<Record<ElementoBaseId, number>>;
    custoTotal: number;
    descricao: string;
}
/**
 * As combinações mais baratas de alcançar a partir desta ficha. É o mecanismo
 * de DESCOBERTA do sistema: com 3.215 elementos, ninguém navega o espaço por
 * enumeração — navega por "o que está perto de mim agora".
 */
export declare function proximasCombinacoes(p: Personagem, opcoes?: {
    limite?: number;
    aridades?: number[];
    apenasCuradas?: boolean;
}): CombinacaoProxima[];
export interface PlanoArquetipo {
    arquetipo: {
        id: string;
        nome: string;
        descricao: string;
    };
    alcancado: boolean;
    /** Pontos diretos por elemento base que a ficha precisa TER no fim. */
    elementos: Partial<Record<ElementoBaseId, number>>;
    escolas: Partial<Record<EscolaId, number>>;
    recursos: Partial<Record<RecursoId, number>>;
    /** O que falta investir a partir da ficha atual. */
    faltam: {
        elementos: Partial<Record<ElementoBaseId, number>>;
        escolas: Partial<Record<EscolaId, number>>;
        recursos: Partial<Record<RecursoId, number>>;
    };
    custoTotal: number;
    capacidades: string[];
    /** true quando o plano foi verificado ponta a ponta pelo motor. */
    verificado: boolean;
}
/**
 * O caminho mais barato desta ficha até um arquétipo, em pontos diretos.
 *
 * O plano é sempre **verificado**: a função monta a ficha resultante, roda a
 * progressão e confirma que o arquétipo realmente destrava. Se não destravar,
 * `verificado` vem false — melhor entregar um plano marcado como não provado
 * do que um número inventado.
 */
export declare function caminhoParaArquetipo(p: Personagem, arquetipoId: string): PlanoArquetipo | undefined;
/** Os arquétipos mais baratos de alcançar a partir desta ficha. */
export declare function arquetiposProximos(p: Personagem, limite?: number): PlanoArquetipo[];
export interface DiagnosticoSkill {
    valida: boolean;
    erros: string[];
    tags: string[];
    limites: {
        energiaMaxima: number;
        tempoConjuracaoMinimo: number;
        raioMaximo: number;
        alcanceMaximo: number;
    };
    slotsModificador: number;
    resultado?: {
        custoTotal: number;
        impactoTotal: number;
        impactoPorAlvo: number;
        alvosEsperados: number;
        eficiencia: number;
        perfil: Record<string, number>;
        estados: string[];
        propriedades: {
            chave: string;
            rotulo: string;
            valor: number;
        }[];
    };
}
/** Valida e calcula uma skill, devolvendo o diagnóstico completo. */
export declare function diagnosticarSkill(p: Personagem, cfg: SkillConfig): DiagnosticoSkill;
export interface ModificadorDisponivel {
    id: ModificadorId;
    nome: string;
    descricao: string;
    multiplicadorCusto: number;
    compativel: boolean;
    motivo?: string;
    exigeTags: string[];
}
/** Quais modificadores cabem nesta skill — e por que os outros não cabem. */
export declare function modificadoresPara(p: Personagem, cfg: SkillConfig): ModificadorDisponivel[];
export interface PreviaFusao {
    geracao: number;
    modo: string;
    descricaoModo: string;
    basesEnvolvidas: string[];
    elementoResultante?: string;
    nomeElementoResultante?: string;
    liberado: boolean;
}
/** O que sairia de fundir estas skills, sem calcular o resultado inteiro. */
export declare function previaDeFusao(p: Personagem, componentes: SkillConfig[]): PreviaFusao;
export interface DiagnosticoFusao extends PreviaFusao {
    valida: boolean;
    erros: string[];
    avisos: string[];
    custoTotal: number;
    impactoTotal: number;
    impactoSeparado: number;
    custoSeparado: number;
    ganhoDeFusao: number;
    taxaDeCusto: number;
    eficienciaRelativa: number;
    tetoAtingido: boolean;
    propriedadesEmergentes: {
        chave: string;
        rotulo: string;
        valor: number;
    }[];
}
/** Calcula uma fusão completa, com a comparação honesta contra lançar separado. */
export declare function diagnosticarFusao(p: Personagem, cfg: FusaoConfig): DiagnosticoFusao;
export type TipoEntidade = 'elemento' | 'combinacao' | 'escola' | 'recurso' | 'talento' | 'arquetipo' | 'profissao' | 'modificador' | 'item' | 'propriedade' | 'criatura';
export interface Achado {
    tipo: TipoEntidade;
    id: string;
    nome: string;
    descricao: string;
}
/** Busca textual sobre TODO o sistema, de uma vez. */
export declare function buscar(termo: string, limite?: number): Achado[];
export interface ExplicacaoElemento {
    id: string;
    nome: string;
    tipo: string;
    aridade: number;
    descricao: string;
    fatorPotencia: number;
    perfil: Record<string, number>;
    receita?: {
        elemento: string;
        nome: string;
        nivelMinimo: number;
    }[];
    coerencia?: string;
    curada?: boolean;
    /** Combinações que usam este elemento e estão a poucos passos. */
    usadoEm: {
        id: string;
        nome: string;
        aridade: number;
    }[];
    requisitosBase: Partial<Record<ElementoBaseId, number>>;
}
/** Tudo que se sabe sobre um elemento — incluindo os procedurais. */
export declare function explicarElemento(id: ElementoId, limiteUsos?: number): ExplicacaoElemento | undefined;
export interface ProblemaIntegridade {
    severidade: 'erro' | 'aviso';
    tipo: string;
    onde: string;
    mensagem: string;
}
/**
 * Verifica se o conteúdo é internamente consistente: todo id referenciado
 * existe, todo requisito é alcançável, nada ficou órfão. Roda em milissegundos
 * e é a rede de segurança de quem adiciona conteúdo.
 */
export declare function verificarIntegridade(): ProblemaIntegridade[];
export interface Pagina<T> {
    itens: T[];
    total: number;
    restantes: number;
}
export declare function listarArquetipos(limite?: number, offset?: number): Pagina<Achado>;
export declare function listarTalentos(limite?: number, offset?: number): Pagina<Achado>;
export declare function listarModificadores(limite?: number, offset?: number): Pagina<Achado>;
export declare function listarCombinacoes(opcoes?: {
    aridade?: number;
    apenasCuradas?: boolean;
    limite?: number;
    offset?: number;
}): Pagina<Achado & {
    aridade: number;
    coerencia: string;
    curada: boolean;
}>;
/** Reexporta o util de chave para consumidores externos montarem consultas. */
export { chaveCombinacao, progressoCombinacao };
