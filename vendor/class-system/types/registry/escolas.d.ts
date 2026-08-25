/**
 * Registro de classes/escolas. O jogador coloca pontos diretamente nelas.
 * O perfil (pesos) da escola combina com o do elemento para moldar o
 * resultado final da skill.
 */
import type { PerfilPesos } from './elementos';
export type EscolaId = 'combate_fisico' | 'longo_alcance' | 'evocacao' | 'conjuracao' | 'benca' | 'maldicao';
export interface EscolaDef {
    id: EscolaId;
    nome: string;
    tipo: 'marcial' | 'magica';
    descricao: string;
    entregaPadrao: 'dano' | 'invocacao' | 'efeito';
    pesos: PerfilPesos;
}
export declare const ESCOLAS: Record<EscolaId, EscolaDef>;
