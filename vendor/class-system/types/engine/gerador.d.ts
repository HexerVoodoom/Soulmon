/**
 * GERADOR AUTOMÁTICO — monta fichas completas a partir de um orçamento.
 *
 * O sistema é grande demais para a folha em branco: 17 bases, 3.215 elementos
 * alcançáveis, 6 escolas, 5 recursos, dezenas de talentos e profissões. Quem
 * chega sem uma build em mente não tem por onde começar, e quem precisa de
 * cinco NPCs para uma sessão não vai distribuir 2.500 pontos à mão.
 *
 * O que o gerador faz: escolhe uma FAMÍLIA elemental coerente para o papel
 * pedido, gasta o orçamento do tier nela, deixa a cascata destravar o que
 * tiver de destravar, e desenha skills que o motor já considera válidas.
 *
 * O que ele NÃO faz: nada que um jogador não pudesse fazer à mão. Toda a
 * construção passa pelos mutadores de `personagem.ts` — `investirElemento`,
 * `investirTalento`… — então uma ficha gerada obedece exatamente às mesmas
 * regras (ponto direto só em base ou derivado destravado, requisito de
 * talento, exclusividade de ramo). Se o gerador conseguisse produzir uma
 * ficha impossível, o bug estaria aqui, não no motor.
 *
 * DETERMINISMO. O motor é puro e o gerador não abre exceção: toda escolha sai
 * de um PRNG SEMEADO. Mesma semente + mesmos filtros → mesma ficha, byte a
 * byte, em qualquer máquina. Sem semente explícita, ela é derivada dos
 * próprios filtros — ou seja, ainda determinística; para variar, troque a
 * semente, é o único dial de aleatoriedade que existe.
 *
 * Os únicos filtros que o usuário informa são NÍVEL (tier de orçamento) e,
 * para grupos, QUANTIDADE e PAPÉIS. Todo o resto é sorteado: é essa a graça.
 */
import { type ElementoBaseId, type ElementoId, type PerfilPesos } from '../registry/elementos';
import { type EscolaId } from '../registry/escolas';
import { type RecursoId } from '../registry/recursos';
import { type TalentoId } from '../registry/talentos';
import { type Personagem } from './personagem';
import { type Progressao } from './progressao';
import { type SkillConfig, type ResultadoSkill } from './skills';
/**
 * PRNG mulberry32: 32 bits de estado, distribuição boa o bastante para
 * sorteio de conteúdo e — o que importa aqui — reprodutível em qualquer
 * runtime, sem depender da implementação de `Math.random` do host.
 */
export declare function criarPrng(semente: number): () => number;
/** Hash estável de string → semente. Usado quando ninguém informou uma. */
export declare function sementeDeTexto(texto: string): number;
export type PapelId = 'dps' | 'tank' | 'suporte' | 'curandeiro' | 'controle' | 'invocador';
export interface PapelDef {
    id: PapelId;
    nome: string;
    descricao: string;
    /** Perfil desejado — casa com o `pesos` de elementos e escolas. */
    alvo: PerfilPesos;
    escolasPreferidas: EscolaId[];
    recursosPreferidos: RecursoId[];
    /** Forma padrão das skills deste papel. */
    forma: {
        area: 'unico' | 'circulo';
        entrega: 'instantaneo' | 'continuo';
        /** Fração do alcance máximo que o papel costuma usar. */
        fracaoAlcance: number;
    };
    talentosPreferidos: TalentoId[];
}
export declare const PAPEIS: Record<PapelId, PapelDef>;
export declare const PAPEIS_VALIDOS: PapelId[];
export declare function composicaoPadrao(quantidade: number): PapelId[];
export declare const NIVEL_MINIMO = 1;
export declare const NIVEL_MAXIMO = 7;
export interface FiltrosGeracao {
    /** Tier 1..7 — define o orçamento (ver `ORCAMENTO_POR_TIER`). Default: 3. */
    nivel?: number;
    /** Orçamento explícito, se você não quiser usar a curva por tier. */
    orcamento?: number;
    /** Papel desejado. Omitido = sorteado. */
    papel?: PapelId;
    /** Semente do PRNG. Omitida = derivada dos demais filtros (determinística). */
    semente?: number;
    /** Nome fixo, se você não quiser o nome procedural. */
    nome?: string;
    /** Quantas skills desenhar. Default: 2. */
    skills?: number;
    /**
     * Bases a evitar (o gerador de grupo usa para dar identidade a cada membro).
     * É uma PREFERÊNCIA: se o orçamento não permitir mais nada, elas voltam.
     */
    evitarElementos?: ElementoBaseId[];
}
export interface FiltrosGrupo extends Omit<FiltrosGeracao, 'papel' | 'nome'> {
    /** Quantos personagens. Default: 4. */
    quantidade?: number;
    /**
     * Papéis, na ordem. Menos papéis que `quantidade` completa com a composição
     * padrão; mais papéis que `quantidade` define a quantidade.
     */
    papeis?: PapelId[];
    /** Nome do grupo, para o nome procedural dos membros. */
    nome?: string;
}
export declare function orcamentoDoNivel(nivel: number): number;
export interface SkillGerada {
    config: SkillConfig;
    resultado: ResultadoSkill;
}
export interface GastoOrcamento {
    elementos: number;
    escolas: number;
    recursos: number;
    talentos: number;
    profissoes: number;
    total: number;
}
export interface PersonagemGerado {
    personagem: Personagem;
    papel: PapelId;
    nivel: number;
    semente: number;
    orcamento: {
        disponivel: number;
        gasto: GastoOrcamento;
        sobra: number;
    };
    progressao: Progressao;
    skills: SkillGerada[];
    /** Bases que formaram o núcleo da build, na ordem de investimento. */
    nucleo: ElementoBaseId[];
    /** O elemento de maior expressão da ficha (o "tema" que saiu). */
    elementoPrincipal: ElementoId;
}
export interface GrupoGerado {
    nome: string;
    nivel: number;
    semente: number;
    membros: PersonagemGerado[];
}
export declare function gerarPersonagem(filtros?: FiltrosGeracao): PersonagemGerado;
/**
 * Um grupo é mais que N fichas: cada membro é gerado com uma semente derivada
 * (determinismo preservado) e recebe as bases já usadas pelos anteriores como
 * `evitarElementos`, para o grupo cobrir o mapa elemental em vez de sair com
 * cinco piromantes.
 */
export declare function gerarGrupo(filtros?: FiltrosGrupo): GrupoGerado;
