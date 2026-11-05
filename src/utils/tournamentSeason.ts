// ---------------------------------------------------------------------------
// A RODADA DO TORNEIO — ritual, nunca tranca
//
// O estudo de referência do Pokémon GO (Harvard T.H. Chan, BMJ 2016) mediu
// +955 passos/dia na primeira semana depois da instalação, e o efeito voltou ao
// nível anterior já na SEXTA SEMANA. Nenhuma mecânica de recompensa segura
// sozinha depois disso — o que segurou o Pokémon GO foi o ritual: o Community
// Day, uma janela fixa, anunciada com antecedência, em que as pessoas sabem que
// vão encontrar outras pessoas.
//
// Duas decisões deliberadas aqui:
//
// 1. A JANELA É DE DIAS, NUNCA DE HORAS. Evento de 3 horas num horário fixo
//    exclui quem trabalha — foi uma das queixas mais citadas contra o Pokémon
//    GO, e a razão de parte da base ter se afastado.
//
// 2. FORA DA JANELA NADA FECHA. O Torneio continua inteiro disponível o tempo
//    todo. Trancar conteúdo fora de um horário é exatamente o erro dos Remote
//    Raid Passes de 2023: remover acesso de quem não consegue estar lá na hora
//    combinada não faz essa pessoa se esforçar mais — faz ela sair.
//
// A janela é só um convite: "é agora que tem mais gente por aqui".
// ---------------------------------------------------------------------------

/** Dia da semana em que a rodada começa (5 = sexta). */
export const ROUND_START_DAY = 5;
/** Quantos dias ela dura (sexta, sábado e domingo). */
export const ROUND_LENGTH_DAYS = 3;

export interface TournamentWindow {
  /** A rodada está rolando agora? */
  isOpen: boolean;
  /** Quantos dias faltam para a próxima rodada (0 se está aberta). */
  daysUntilNext: number;
  /** Dias restantes da rodada atual, incluindo hoje (0 se está fechada). */
  daysLeft: number;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Estado da rodada semanal. Puro e sem fuso escondido: usa a data local do
 * jogador, que é a que ele enxerga no calendário.
 */
export function getTournamentWindow(now: Date = new Date()): TournamentWindow {
  const today = startOfDay(now);
  const day = today.getDay();

  // Quantos dias desde o último início de rodada.
  const sinceStart = (day - ROUND_START_DAY + 7) % 7;
  const isOpen = sinceStart < ROUND_LENGTH_DAYS;

  if (isOpen) {
    return { isOpen: true, daysUntilNext: 0, daysLeft: ROUND_LENGTH_DAYS - sinceStart };
  }
  return { isOpen: false, daysUntilNext: (ROUND_START_DAY - day + 7) % 7, daysLeft: 0 };
}

const WORDS_EN = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty', 'Twenty-one', 'Twenty-two', 'Twenty-three', 'Twenty-four', 'Twenty-five', 'Twenty-six', 'Twenty-seven', 'Twenty-eight', 'Twenty-nine', 'Thirty', 'Thirty-one'];
const WORDS_PT = ['Zero', 'Um', 'Dois', 'Três', 'Quatro', 'Cinco', 'Seis', 'Sete', 'Oito', 'Nove', 'Dez', 'Onze', 'Doze', 'Treze', 'Catorze', 'Quinze', 'Dezesseis', 'Dezessete', 'Dezoito', 'Dezenove', 'Vinte', 'Vinte e um', 'Vinte e dois', 'Vinte e três', 'Vinte e quatro', 'Vinte e cinco', 'Vinte e seis', 'Vinte e sete', 'Vinte e oito', 'Vinte e nove', 'Trinta', 'Trinta e um'];

/** Dias até a temporada do Torneio virar, contando hoje. A temporada é o mês em UTC (`currentSeason`, `functions/api/community.js`). */
export function seasonDaysLeft(now: Date = new Date()): number {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0)).getUTCDate() - now.getUTCDate() + 1;
}

/** "Seven Days Remaining" / "One Day Remaining" (dono, 05/11/2026). */
export function seasonDaysLabel(now: Date, language: 'pt-BR' | 'en-US'): string {
  const n = seasonDaysLeft(now);
  return language === 'pt-BR'
    ? `${WORDS_PT[n]} ${n === 1 ? 'dia restante' : 'dias restantes'}`
    : `${WORDS_EN[n]} ${n === 1 ? 'Day' : 'Days'} Remaining`;
}

/**
 * Texto MÍNIMO para a UI, nos dois idiomas (02/10/2026, pedido do dono: sem
 * frases). Rodada aberta: "Dias restantes: N". Fora da janela: "Próxima
 * rodada: N dias". Singular/plural coerente (1 dia / 1 day). Nunca cobra
 * presença.
 */
export function tournamentWindowLabel(win: TournamentWindow, language: 'pt-BR' | 'en-US'): string {
  const isPt = language === 'pt-BR';
  if (win.isOpen) {
    const n = win.daysLeft;
    return isPt
      ? `${n === 1 ? 'Dia restante' : 'Dias restantes'}: ${n}`
      : `${n === 1 ? 'Remaining day' : 'Remaining days'}: ${n}`;
  }
  const n = win.daysUntilNext;
  return isPt
    ? `Próxima rodada: ${n} ${n === 1 ? 'dia' : 'dias'}`
    : `Next round: ${n} ${n === 1 ? 'day' : 'days'}`;
}
