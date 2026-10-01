/**
 * OS TÍTULOS DAS TRAVESSIAS (01/10/2026, H12 da navegação do dono): ao abrir
 * uma região na névoa, as três propostas viram CARDS FECHADOS, separados, cada
 * um com um título — e o título é o que a pessoa lê antes de abrir.
 *
 * Dono único desta copy (texto de jogador não nasce solto no JSX). Inglês
 * primeiro (`CLAUDE.md`, "Idioma"); o par PT-BR vem junto.
 *
 * Regras de escrita, da bíblia (`docs/NARRATIVA-E-UNIVERSO.md`) e das condições
 * já escritas no `PasseioSheet` (R-31, parecer de menores):
 *  · o título nomeia o ATO, nunca o prêmio nem o mérito (L12, R-31);
 *  · nenhum título tem a pessoa como sujeito de um verbo de ser (L1);
 *  · nenhum número, prazo, urgência ou "desafio"/"challenge" (04 R-5);
 *  · nada sobre a mente ou o corpo da pessoa (L9).
 *
 * Proposta sem título aqui cai em `null` e o card mostra o texto do ato — nunca
 * quebra (há teste exigindo título para TODA proposta do catálogo).
 */
export const TRAVESSIA_TITLES: Record<string, { en: string; pt: string }> = {
  'trv-c-floresta-1': { en: 'A New Way to Move', pt: 'Um Jeito Novo de Se Mexer' },
  'trv-c-floresta-2': { en: 'Made by Hand, the First Time', pt: 'Feito à Mão, pela Primeira Vez' },
  'trv-c-floresta-3': { en: 'The Green Neighbour’s Name', pt: 'O Nome do Vizinho Verde' },
  'trv-c-oceano-1': { en: 'A Letter Across the Water', pt: 'Uma Carta que Atravessa' },
  'trv-c-oceano-2': { en: 'One Whole Album', pt: 'Um Disco Inteiro' },
  'trv-c-oceano-3': { en: 'Pantry Voyage', pt: 'Viagem pela Despensa' },
  'trv-c-deserto-1': { en: 'Only What Gets Used', pt: 'Só o que Se Usa' },
  'trv-c-deserto-2': { en: 'A Stretch Without Screens', pt: 'Um Trecho sem Tela' },
  'trv-c-deserto-3': { en: 'One Step Past the Usual', pt: 'Um Degrau Além' },
  'trv-c-picos-1': { en: 'The Street Not Yet Taken', pt: 'A Rua Ainda Não Andada' },
  'trv-c-picos-2': { en: 'How It Works Inside', pt: 'Por Dentro das Coisas' },
  'trv-c-picos-3': { en: 'Teach Me Something', pt: 'Me Ensina uma Coisa' },
  'trv-c-pantano-1': { en: 'Begun, Not Finished', pt: 'Começado, sem Fim' },
  'trv-c-pantano-2': { en: 'A Kitchen Sprout', pt: 'Broto de Cozinha' },
  'trv-c-pantano-3': { en: 'A Habit, Another Way', pt: 'Um Hábito de Outro Jeito' },
  'trv-c-cavernas-1': { en: 'An Afternoon Kept for Itself', pt: 'Uma Tarde Guardada' },
  'trv-c-cavernas-2': { en: 'Built from What Is Here', pt: 'Montado com o que Há' },
  'trv-c-cavernas-3': { en: 'A Memory for Two', pt: 'Uma Lembrança a Dois' },
  'trv-c-gelo-1': { en: 'Where It Came From', pt: 'De Onde Isso Veio' },
  'trv-c-gelo-2': { en: 'Old Doors, Open', pt: 'Portas Antigas, Abertas' },
  'trv-c-gelo-3': { en: 'A Habit, Somewhere New', pt: 'Um Hábito em Lugar Novo' },
};

/** O título de uma proposta no idioma, ou `null` se ela não tiver um. */
export function travessiaTitle(challengeId: string, isPt: boolean): string | null {
  const t = TRAVESSIA_TITLES[challengeId];
  return t ? (isPt ? t.pt : t.en) : null;
}
