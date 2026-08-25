/**
 * Registro de talentos — o "como" do playstyle.
 *
 * Organização:
 *  - Talentos GERAIS: destravam limites de configuração (área, tempo,
 *    energia, custo, alcance).
 *  - RAMOS DE PLAYSTYLE: pares/trios mutuamente exclusivos que definem
 *    identidade (burst vs DoT, enxame vs colosso, precisão vs rajada...).
 *  - Talentos de ESCOLA: exigem nível na escola.
 *  - Talentos de RECURSO: exigem proficiência no recurso e mudam a
 *    dinâmica dele.
 *
 * Efeitos são declarativos; o motor lê `efeitos` e o simulador exibe as
 * propriedades resultantes na skill.
 */
import type { EscolaId } from './escolas';
import type { RecursoId } from './recursos';
export type TalentoId = 'area_ampliada' | 'conjuracao_rapida' | 'alcance_estendido' | 'canalizacao_profunda' | 'economia_de_recurso' | 'persistencia' | 'impacto_imediato' | 'dano_ao_longo_do_tempo' | 'perfuracao' | 'estilhaco' | 'eco_arcano' | 'enxame' | 'colosso' | 'vinculo_marcial' | 'simbiose' | 'autonomia' | 'comando' | 'instinto_de_caca' | 'vinculo_primal' | 'matilha_domada' | 'fera_alfa' | 'evolucao_da_fera' | 'sincronia_de_combate' | 'assalto_coordenado' | 'guarda_da_fera' | 'montaria' | 'carga_montada' | 'metamagia_gemea' | 'auto_feitico' | 'cancao_persistente' | 'salto' | 'endossar_elemento' | 'contagio' | 'aflicao_profunda' | 'egide' | 'exaltacao' | 'vinculo_de_grupo' | 'sequencia_marcial' | 'golpe_devastador' | 'postura_inabalavel' | 'olho_de_aguia' | 'rajada' | 'devocao' | 'fluxo_constante' | 'sede_de_batalha' | 'elo_profundo' | 'afinacao' | 'engenho_de_skill' | 'arte_da_fusao' | 'catalisador' | 'prisma_interior' | 'estabilizador' | 'sintonia_de_receita' | 'convergencia_elemental' | 'leitor_de_constelacao' | 'transbordo_ampliado' | 'maestria_paradoxal' | 'mao_de_mestre' | 'olho_de_materiais' | 'assinatura_do_artesao' | 'linha_de_producao' | 'duplo_chaveamento' | 'ritmo_de_guerra' | 'pacto_de_sangue' | 'eco_de_batalha';
export type EfeitoTalento = {
    tipo: 'raio_maximo_bonus';
    valorPorRank: number;
} | {
    tipo: 'tempo_conjuracao_minimo_reducao';
    valorPorRank: number;
} | {
    tipo: 'alcance_bonus_metros';
    valorPorRank: number;
} | {
    tipo: 'energia_maxima_bonus_fracao';
    valorPorRank: number;
} | {
    tipo: 'custo_reducao_fracao';
    valorPorRank: number;
} | {
    tipo: 'foco_entrega';
    entrega: 'instantaneo' | 'continuo';
    bonusFracaoPorRank: number;
} | {
    tipo: 'invocacao_quantidade_bonus';
    valorPorRank: number;
} | {
    tipo: 'invocacao_potencia_bonus_fracao';
    valorPorRank: number;
}
/**
 * Reduz o nível mínimo exigido de CADA componente das receitas de elementos
 * derivados. É o que torna triplas e quádruplas alcançáveis sem forçar o
 * jogador a espalhar dezenas de pontos antes de ver qualquer retorno.
 */
 | {
    tipo: 'receita_minimo_reducao';
    valorPorRank: number;
}
/** Soma ao nível efetivo de todo elemento derivado já desbloqueado. */
 | {
    tipo: 'nivel_derivado_bonus';
    valorPorRank: number;
}
/**
 * Reduz o divisor da CASCATA geracional (5→4 etc.): os pais rendem pontos
 * passivos mais cedo. Gancho declarativo — nenhum talento usa ainda;
 * conteúdo futuro mexe neste dial sem tocar no motor.
 */
 | {
    tipo: 'cascata_divisor_reducao';
    valorPorRank: number;
}
/**
 * Propriedade qualitativa que aparece na skill calculada (o runtime do
 * jogo aplica o efeito; a calculadora exibe chave + magnitude).
 */
 | {
    tipo: 'propriedade';
    chave: string;
    rotulo: string;
    valorPorRank: number;
    escola?: EscolaId;
};
export interface TalentoDef {
    id: TalentoId;
    nome: string;
    descricao: string;
    ranksMaximos: number;
    requisito?: {
        escola?: EscolaId;
        recurso?: RecursoId;
        nivelMinimo: number;
    };
    /** Ramos exclusivos: ter ranks aqui bloqueia ranks nos listados. */
    exclusivoCom?: TalentoId[];
    efeitos: EfeitoTalento[];
}
export declare const TALENTOS: Record<TalentoId, TalentoDef>;
