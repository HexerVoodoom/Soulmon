/**
 * Construtor + calculadora de skills.
 *
 * O jogador monta a skill escolhendo: elemento, escola, FONTES DE ENERGIA
 * (uma ou mais, em proporções livres), energia investida, tempo de
 * conjuração, alcance, área e forma de entrega. O motor valida contra a
 * progressão e calcula custo e impacto em tempo real.
 *
 * FONTES DE ENERGIA — uma skill pode misturar recursos (ex.: 60% mana +
 * 40% fúria), desde que o personagem tenha proficiência (pontos) em cada
 * fonte usada. A proficiência ponderada pelas proporções escala tudo:
 *   - custo menor (−1%/ponto, até −30%);
 *   - impacto maior (+0.8%/ponto);
 *   - tempo mínimo de conjuração menor (−0.01s/ponto).
 *
 * BALANCEAMENTO — a regra central é um orçamento único de poder:
 *
 *   orcamento = energia × multTempo × multNivel × multFoco × multFontes
 *
 * Toda escolha de forma (área, entrega, invocações) apenas REDISTRIBUI esse
 * orçamento, nunca o multiplica de graça. Área maior = menos dano por alvo;
 * mais criaturas = criaturas mais fracas; DoT = mais total, porém diluído no
 * tempo. Assim, builds diferentes com o mesmo investimento têm impacto
 * mecânico similar.
 */
import { type ElementoBaseId, type ElementoId, type PerfilPesos } from '../registry/elementos';
import { type EscolaId } from '../registry/escolas';
import { type RecursoId } from '../registry/recursos';
import { type ModificadorId, type TagSkill } from '../registry/modificadores';
import { type EstadoId } from '../registry/estados';
import { type ModoEvocacao } from './evocacao';
import type { Personagem } from './personagem';
import { type Progressao } from './progressao';
/**
 * Fonte da evocação, usada só em skills de escola Evocação:
 *  - elemental: um elemental do próprio elemento da skill (padrão).
 *  - aleatoria: criatura qualquer; escala com Evocação, sem preparo.
 *  - capturada: uma criatura do bestiário, imbuída do elemento da skill.
 */
export interface EvocacaoSkill {
    modo: ModoEvocacao;
    criaturaId?: string;
}
export type AreaConfig = {
    tipo: 'unico';
} | {
    tipo: 'circulo';
    raioMetros: number;
};
export type EntregaConfig = {
    tipo: 'instantaneo';
} | {
    tipo: 'continuo';
    duracaoSegundos: number;
};
/** Uma fonte de energia da skill; proporções são relativas (normalizadas). */
export interface FonteEnergia {
    recurso: RecursoId;
    proporcao: number;
}
export interface SkillConfig {
    nome: string;
    elemento: ElementoId;
    escola: EscolaId;
    /** Fontes de energia combinadas em proporções livres. */
    fontes: FonteEnergia[];
    /** Quanto de energia é investido; mais energia = mais resultado. */
    energia: number;
    /** Mais tempo de conjuração = mais resultado. */
    tempoConjuracaoSegundos: number;
    /** Distância de lançamento; limitada por talentos, encarece de leve. */
    alcanceMetros: number;
    area: AreaConfig;
    entrega: EntregaConfig;
    /** Capacidade de arquétipo exigida (ex.: 'evocar_demonios_mortos'). */
    capacidadeExigida?: string;
    /** Fonte da evocação (só relevante em escola Evocação; padrão: elemental). */
    evocacao?: EvocacaoSkill;
    /** Criatura montável usada como veículo desta skill (requer talento Montaria). */
    montariaId?: string;
    /** Afinidade elemental do alvo, para calcular efetividade (opcional). */
    alvoElemento?: ElementoBaseId;
    /**
     * Modificadores de 2ª geração aplicados sobre esta skill (support gems).
     * Cada um multiplica o custo e exige compatibilidade de tag.
     */
    modificadores?: ModificadorId[];
}
export interface LimitesSkill {
    energiaMaxima: number;
    tempoConjuracaoMinimo: number;
    raioMaximo: number;
    alcanceMaximo: number;
}
export interface ResultadoSkill {
    valida: boolean;
    erros: string[];
    limites: LimitesSkill;
    /** Custo total (antes das dinâmicas de fé/ressonância em tempo real). */
    custoTotal: number;
    /** Quanto do custo cada fonte paga, na proporção escolhida. */
    custoPorFonte: {
        recurso: RecursoId;
        custo: number;
    }[];
    /** Proficiência ponderada pelas proporções das fontes. */
    proficienciaPonderada: number;
    orcamentoDePoder: number;
    alvosEsperados: number;
    /** Impacto total esperado somando todos os alvos/duração. */
    impactoTotal: number;
    impactoPorAlvo: number;
    /** Presente quando entrega é contínua. */
    impactoPorSegundo?: number;
    /** Presente quando a escola é evocação. */
    invocacoes?: {
        quantidade: number;
        poderPorCriatura: number;
        poderTotal: number;
        nome: string;
        familia?: string;
        imbuida: boolean;
    };
    /** Presente quando a skill é lançada montado numa fera. */
    montaria?: {
        nome: string;
        bonus: number;
    };
    /** Estados/condições que a skill pode infligir (elemento + escola). */
    estados: {
        id: EstadoId;
        nome: string;
        tipo: string;
    }[];
    /** Efetividade contra o alvo, quando um alvo elemental foi informado. */
    efetividade?: {
        alvo: ElementoBaseId;
        multiplicador: number;
        rotulo: string;
        impacto: number;
    };
    /**
     * Como o impacto se distribui mecanicamente — média dos perfis do
     * elemento e da escola aplicada ao impacto total.
     */
    perfil: PerfilPesos;
    /** Propriedades qualitativas vindas de talentos (penetração, contágio...). */
    propriedades: {
        chave: string;
        rotulo: string;
        valor: number;
    }[];
    /** Métrica de balanceamento: impacto total ÷ energia investida. */
    eficiencia: number;
    /** Tags que esta skill exibe — o contrato de compatibilidade legível. */
    tags: TagSkill[];
    /** Modificadores efetivamente aplicados, com o custo que cada um cobrou. */
    modificadoresAplicados: {
        id: ModificadorId;
        nome: string;
        multiplicadorCusto: number;
    }[];
    /** Produto dos multiplicadores de poder dos modificadores (após o teto). */
    multModificadores: number;
    /** true quando o teto anti-composição mordeu o produto de multiplicadores. */
    tetoModificadoresAtingido: boolean;
}
/**
 * TETO ANTI-COMPOSIÇÃO. A fórmula do orçamento já é um produto de oito
 * multiplicadores; empilhar modificadores multiplicativos por cima, sem teto,
 * reproduz o modo de falha clássico dos sistemas de composição livre — existe
 * sempre um encadeamento que quebra a economia. O produto dos modificadores
 * é grampeado aqui, e o resultado avisa quando o teto mordeu.
 */
export declare const TETO_MULT_MODIFICADORES = 2.2;
/**
 * TETO DE EFICIÊNCIA DOS MODIFICADORES.
 *
 * O teto absoluto acima grampeia só o produto dos multiplicadores de PODER, e
 * isso deixava duas frestas por onde a composição escapava:
 *
 *  1. `tempo_fracao` alimenta √tempo no orçamento e fica FORA do produto
 *     grampeado — alongar a conjuração comprava poder de graça;
 *  2. um modificador de poder NEGATIVO (Contenção Disciplinada) abaixava o
 *     produto grampeado e liberava espaço sob o teto para os positivos.
 *
 * Medido, o encadeamento Repetição Ecoada + Canalização Arriscada + Sangria
 * Arcana + Contenção Disciplinada rendia 2.26× a eficiência da skill nua, e o
 * aviso de teto nem disparava.
 *
 * A correção é a mesma que já resolveu a fusão: amarrar o teto na EFICIÊNCIA
 * relativa (impacto ÷ custo, contra a mesma skill sem modificadores), o que
 * captura tempo e custo junto com o poder. O valor 1.4 preserva a troca
 * honesta de Contenção Disciplinada (1.29) e mata o encadeamento degenerado.
 */
export declare const TETO_EFICIENCIA_MODIFICADORES = 1.4;
/** Slots de modificador; cada rank de Engenho de Skill abre mais um. */
export declare const SLOTS_MODIFICADOR_BASE = 2;
/** Filtra proporções > 0, funde duplicatas e normaliza para somar 1. */
export declare function normalizarFontes(fontes: FonteEnergia[]): FonteEnergia[];
/** Proficiência do personagem ponderada pelas proporções das fontes. */
export declare function proficienciaPonderada(p: Personagem, fontes: FonteEnergia[]): number;
export declare function calcularLimites(p: Personagem, escola: EscolaId, fontes?: FonteEnergia[]): LimitesSkill;
/**
 * Tags que uma skill exibe, derivadas da configuração. É o contrato legível
 * de compatibilidade com os modificadores — a regra dura é `exigeTags`.
 */
export declare function tagsDaSkill(cfg: SkillConfig): TagSkill[];
/** Slots de modificador disponíveis, considerando talentos. */
export declare function slotsModificador(p: Personagem): number;
export interface AvaliacaoModificador {
    id: ModificadorId;
    compativel: boolean;
    motivo?: string;
}
/** Por que um modificador entra (ou não) numa skill — alimenta a UI. */
export declare function avaliarModificador(p: Personagem, cfg: SkillConfig, id: ModificadorId, tags?: TagSkill[]): AvaliacaoModificador;
export declare function validarSkill(p: Personagem, prog: Progressao, cfg: SkillConfig): {
    erros: string[];
    limites: LimitesSkill;
};
export declare function calcularSkill(p: Personagem, prog: Progressao, cfg: SkillConfig): ResultadoSkill;
