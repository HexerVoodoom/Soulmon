/**
 * MODIFICADORES DE SKILL — a camada de 2ª geração.
 *
 * Inspiração declarada: os *support gems* de Path of Exile. Você não inventa
 * uma skill nova; você pega uma que já entende e aumenta a aposta. O contrato
 * que faz isso funcionar é econômico, não decorativo:
 *
 *  1. **O custo é MULTIPLICATIVO.** Cada modificador multiplica o custo da
 *     skill. Três modificadores de 1.25× compõem para 1.95×, não 1.75×. É esse
 *     composto que impede "encaixar tudo".
 *  2. **Compatibilidade por TAG, não por vontade.** Um modificador de projétil
 *     não entra numa skill de área. A maioria das células da matriz
 *     modificador × skill simplesmente não existe — é assim que se evita a
 *     explosão combinatória virar ruído.
 *  3. **Nenhum modificador é ganho puro.** Todo bônus tem contrapartida: custo,
 *     tempo de conjuração, diluição, ou um efeito que não serve a todo build.
 *  4. **Sem unicidade global.** Path of Exile 2 lançou com "cada suporte só uma
 *     vez por build" e removeu na 0.3.0: elegante no papel, irritante na mão.
 *     Aqui a restrição é por compatibilidade e por slots, nunca por escassez.
 *
 * O teto do produto de multiplicadores mora em `engine/skills.ts`
 * (`TETO_MULT_MODIFICADORES`) — sistemas de composição livre sem teto sempre
 * terminam num combo degenerado.
 */
import type { EscolaId } from './escolas';
import type { TalentoId } from './talentos';
/**
 * Tags que uma skill exibe, derivadas da sua configuração. São o contrato
 * legível de compatibilidade — a regra real é a lista `exigeTags`.
 */
export type TagSkill = 'projetil' | 'area' | 'unico' | 'instantaneo' | 'continuo' | 'invocacao' | 'efeito' | 'dano' | 'marcial' | 'magica' | 'temporal' | 'derivado';
export type ModificadorId = 'sobrecarga_bruta' | 'concentracao' | 'ressonancia_ampliada' | 'projeteis_multiplos' | 'penetracao_encadeada' | 'expansao_concentrica' | 'implosao_dirigida' | 'gatilho_atrasado' | 'repeticao_ecoada' | 'aceleracao_forcada' | 'prolongamento' | 'canalizacao_arriscada' | 'sangria_arcana' | 'contencao_disciplinada' | 'legiao_menor' | 'nucleo_reforcado' | 'contagio_ampliado' | 'graca_estendida' | 'mira_absoluta' | 'investida_encadeada' | 'imbuicao_dupla' | 'fratura_elemental' | 'convergencia_de_receita';
export type EfeitoModificador = 
/** Multiplicativo sobre o orçamento — o "more" do Path of Exile. */
{
    tipo: 'poder_mais';
    valor: number;
}
/** Aditivo sobre o orçamento, antes dos multiplicativos. */
 | {
    tipo: 'poder_aumentado';
    valor: number;
}
/** Soma ao raio efetivo da área (m). */
 | {
    tipo: 'raio_bonus';
    valor: number;
}
/** Multiplica os alvos esperados sem mexer no orçamento (dilui por alvo). */
 | {
    tipo: 'alvos_mult';
    valor: number;
}
/** Fração somada/subtraída do tempo de conjuração. */
 | {
    tipo: 'tempo_fracao';
    valor: number;
}
/** Multiplica a duração de efeitos contínuos. */
 | {
    tipo: 'duracao_mult';
    valor: number;
}
/** Multiplica a quantidade de invocações. */
 | {
    tipo: 'invocacoes_mult';
    valor: number;
}
/** Propriedade qualitativa exibida no resultado. */
 | {
    tipo: 'propriedade';
    chave: string;
    rotulo: string;
    valor: number;
};
export interface ModificadorDef {
    id: ModificadorId;
    nome: string;
    descricao: string;
    /** Todas estas tags precisam estar presentes na skill. */
    exigeTags: TagSkill[];
    /** Nenhuma destas pode estar presente. */
    proibeTags?: TagSkill[];
    /** Multiplicador de custo — sempre ≥ 1. É o freio do sistema. */
    multiplicadorCusto: number;
    requisito?: {
        escola?: EscolaId;
        nivelMinimo?: number;
        talento?: TalentoId;
    };
    efeitos: EfeitoModificador[];
}
export declare const MODIFICADORES: Record<ModificadorId, ModificadorDef>;
export declare function modificadores(): ModificadorDef[];
export declare const ROTULO_TAG: Record<TagSkill, string>;
