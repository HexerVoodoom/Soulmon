// ---------------------------------------------------------------------------
// PROFISSÃO → JEITO DE AGIR NA MASMORRA (PLANO-ORACULO.md §3, Fase 3; decisão
// 3 do §9: "class-system é balanceador oculto de masmorra/torneio").
//
// A profissão da ficha (`ficha/manifestacao.ts`) vira UM modificador leve e
// VISÍVEL na fenda: a folha do lobby diz o ofício e o jeito ("Ferreiro —
// aguenta mais pancada"), e a run aplica o número. Leve de propósito: ±10-15%
// numa dimensão só por ofício — é o "como" da criatura, não uma build
// (o Oráculo "não é RPG com build otimizável", §1).
//
// O que ele NÃO toca, e é regra: Bits, drops, o item da run completa, coraçãozinho —
// nenhum ofício muda economia (a única alavanca legítima da masmorra é custo
// de ENTRADA em Bits, `CLAUDE.md`), e nenhum muda a dificuldade base.
//
// Sem profissão (save legado, demo) → `JEITO_PADRAO`: a masmorra de sempre.
// ---------------------------------------------------------------------------

import type { LText } from './oracle';

export interface JeitoNaMasmorra {
  /** Multiplicador do HP do jogador na run (1 = igual). */
  hp: number;
  /** Multiplicador do dano do jogador (1 = igual). */
  dmg: number;
  /** Precisão a partir da qual o golpe é PERFEITO (crítico). */
  perfeito: number;
  /** Segundos a mais para reagir na defesa (desde TORC-3 vira bônus na defesa automática: `jeitoDefesaBonus`). */
  tempoDefesaExtra: number;
  /** Multiplicador da velocidade da barra de ATAQUE (<1 = mais lenta). */
  velocidadeAtaque: number;
  /** Multiplicador da velocidade da barra de DEFESA (<1 = mais lenta; desde TORC-3 vira bônus na defesa automática). */
  velocidadeDefesa: number;
  /** Fração do HP recuperada ao limpar uma camada. */
  curaAndar: number;
  /** Dano sofrido a menos por golpe (piso 1, quem aplica garante). */
  reducaoDano: number;
  /** Multiplicador do contra-ataque do desvio perfeito. */
  contraAtaque: number;
  /** Quanto da redução de dano do INIMIGO o golpe ignora (0..1). */
  atravessaGuarda: number;
}

export const JEITO_PADRAO: JeitoNaMasmorra = {
  hp: 1, dmg: 1, perfeito: 0.92, tempoDefesaExtra: 0, velocidadeAtaque: 1, velocidadeDefesa: 1,
  curaAndar: 0.25, reducaoDano: 0, contraAtaque: 1, atravessaGuarda: 0,
};

export interface ProfissaoNaMasmorra {
  jeito: Partial<JeitoNaMasmorra>;
  /** O que a folha do lobby diz — voz do mundo, sobre a criatura. */
  frase: LText;
}

export const PROFISSAO_MASMORRA: Record<string, ProfissaoNaMasmorra> = {
  ferreiro: { jeito: { hp: 1.15 }, frase: { pt: 'Aguenta mais pancada.', en: 'Takes more hits.' } },
  tecelao: { jeito: { tempoDefesaExtra: 0.5 }, frase: { pt: 'Lê o golpe um instante antes.', en: 'Reads the blow a moment early.' } },
  artesao: { jeito: { dmg: 1.1 }, frase: { pt: 'Bate um pouco mais forte.', en: 'Hits a little harder.' } },
  joalheiro: { jeito: { perfeito: 0.89 }, frase: { pt: 'Acha o ponto exato com mais facilidade.', en: 'Finds the exact spot more easily.' } },
  alquimista: { jeito: { contraAtaque: 2 }, frase: { pt: 'Devolve o golpe em dobro numa defesa perfeita.', en: 'Returns the blow twofold on a perfect defense.' } },
  curtidor: { jeito: { reducaoDano: 1 }, frase: { pt: 'Couro grosso: cada golpe dói um pouco menos.', en: 'Thick hide: every hit stings a little less.' } },
  encantador: { jeito: { atravessaGuarda: 0.5 }, frase: { pt: 'Atravessa metade da guarda do outro.', en: 'Cuts through half of the other’s guard.' } },
  escriba: { jeito: { velocidadeAtaque: 0.9 }, frase: { pt: 'Lê o próprio ritmo: a barra de ataque anda mais devagar.', en: 'Reads its own rhythm: the attack bar moves slower.' } },
  cozinheiro: { jeito: { curaAndar: 0.35 }, frase: { pt: 'Recupera mais ao limpar uma camada.', en: 'Recovers more when a layer is cleared.' } },
  luthier: { jeito: { velocidadeDefesa: 0.9 }, frase: { pt: 'Ouve o golpe vindo: defende com mais firmeza.', en: 'Hears the blow coming: defends more firmly.' } },
  cartografo: { jeito: { velocidadeAtaque: 0.95, velocidadeDefesa: 0.95 }, frase: { pt: 'Conhece as camadas: defende com um pouco mais de firmeza.', en: 'Knows the layers: defends a little more firmly.' } },
};

/** O jeito completo, com o padrão preenchendo o que a profissão não muda. */
export function jeitoDaProfissao(profissao?: string | null): JeitoNaMasmorra {
  const p = profissao ? PROFISSAO_MASMORRA[profissao] : undefined;
  return { ...JEITO_PADRAO, ...(p?.jeito ?? {}) };
}

export function fraseDaProfissao(profissao: string | null | undefined, isPt: boolean): string | undefined {
  const p = profissao ? PROFISSAO_MASMORRA[profissao] : undefined;
  return p ? (isPt ? p.frase.pt : p.frase.en) : undefined;
}
