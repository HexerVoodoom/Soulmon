// ---------------------------------------------------------------------------
// WP2.7 — O REENCONTRO É POR DIAS, NÃO POR MINUTOS.
//
// A saudação do HUD usava um limiar fixo de 10 minutos e a MESMA frase para
// quem voltou 11 minutos depois e para quem sumiu três semanas. As duas coisas
// não são a mesma: uma é continuar, a outra é voltar.
//
// A regra do produto já existia do lado do dado (`ABSENCE_FORGIVENESS_DAYS`:
// ausência de dois dias ou mais não cobra nada) e nunca chegou à VOZ. Aqui ela
// chega: quem volta encontra alguém contente, e o silêncio sobre o que ficou
// por fazer é a parte deliberada.
//
// Trava, e há teste: **nenhuma frase menciona o que ficou para trás.** Nem
// "suas tarefas", nem "você estava sumido", nem "vamos recuperar". Um
// reencontro que começa com um balanço é uma cobrança com roupa de saudade.
//
// ⚠️ 21/09/2026 — AS FRASES DAS FAIXAS 2 E 3 CONTRADIZIAM ESTE CABEÇALHO.
//
// A trava acima proíbe mencionar o que ficou para trás, e as frases obedeciam.
// Mas elas mencionavam o TEMPO e a ESPERA: `'Quanto tempo!'`, `'Senti saudade
// esses dias'` e `'Eu estava aqui, esperando'`. A culpa não precisa de número —
// ela vem da CENA. "Esperando" é a imagem cultural da espera fiel (o cão, a
// mãe), e ela cobra sem contar nada. O cabeçalho fechou a contabilidade e
// deixou a iconografia aberta.
//
// Há fundamento no mundo, além da regra: a criatura não tem órgão que leia
// tempo decorrido (§5.10 da bíblia, `docs/NARRATIVA-E-UNIVERSO.md`) — há maré,
// não relógio. Ela sabe que a janela abriu; não sabe há quanto tempo estava
// fechada. As frases novas dizem só isso.
//
// ⚠️ O QUE **NÃO** MUDOU, E POR QUÊ: a estrutura de FAIXAS fica. O parecer
// clínico de 21/09/2026 pede, no critério (e), uma frase idêntica no 2º e no
// 40º dia — e isso é exatamente a alternativa que o WP2.7 rejeitou, com o
// argumento de que "continuar" e "voltar" não são a mesma coisa. Trocar as
// frases é conserto (elas violavam a trava que já estava escrita aqui);
// colapsar as faixas é REABRIR UMA DECISÃO, e isso é do dono. Está registrado
// como pendência em `docs/STATUS.md` e na proposta P2.
// ---------------------------------------------------------------------------

/** Faixas de ausência. A mesma partição do evento `welcome_back { days }`. */
export type AbsenceBucket = 0 | 1 | 2 | 3;

/**
 * 0 = voltou no dia seguinte (ou no mesmo), 1 = 2–4 dias, 2 = 5–14, 3 = 15+.
 * Faixa e não número cru: dia exato de retorno, cruzado com o resto, começa a
 * descrever uma pessoa.
 */
export function absenceBucket(days: number): AbsenceBucket {
  const d = Number.isFinite(days) ? days : 0;
  if (d <= 1) return 0;
  if (d <= 4) return 1;
  if (d <= 14) return 2;
  return 3;
}

const LINES: Record<AbsenceBucket, { pt: string[]; en: string[] }> = {
  // Volta imediata: nem é reencontro. Fica com a saudação de sempre.
  0: {
    pt: ['Você voltou!', 'Oi! Senti sua falta.', 'Que bom te ver!', 'Oi oi! Tudo bem?'],
    en: ['You came back!', 'Hi! I missed you.', 'Good to see you!', 'Hey hey! How are you?'],
  },
  1: {
    pt: ['Você voltou! Guardei tudo como estava.', 'Oi! Estava aqui, na mesma.'],
    en: ['You came back! I kept everything as it was.', 'Hi! I was right here, same as ever.'],
  },
  2: {
    pt: ['Você abriu. Tô aqui. Sem pressa.', 'Você voltou. É só isso que importa hoje.'],
    en: ['You opened it. I am here. No rush.', 'You came back. That is all that matters today.'],
  },
  3: {
    pt: ['Você abriu. Não mudei nada de lugar.', 'Você voltou. Tá tudo como estava.'],
    en: ['You opened it. I moved nothing.', 'You came back. Everything is as it was.'],
  },
};

/** A fala do reencontro. `pick` (0..1) entra por parâmetro para o teste ser
 *  determinístico sem tocar no `Math.random` global. */
export function welcomeBackLine(days: number, isPt: boolean, pick: number): string {
  const linhas = LINES[absenceBucket(days)][isPt ? 'pt' : 'en'];
  const i = Math.min(linhas.length - 1, Math.max(0, Math.floor(pick * linhas.length)));
  return linhas[i];
}

/** Todas as frases de uma faixa — existe para o teste de tom varrer o conjunto. */
export function welcomeBackLines(bucket: AbsenceBucket): { pt: string[]; en: string[] } {
  return LINES[bucket];
}
