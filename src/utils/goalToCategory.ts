// ---------------------------------------------------------------------------
// O "porquê" da pessoa vira a PRIMEIRA sugestão (WP1.4, camada 1).
//
// `soulGoal` e `soulStruggle` são as duas perguntas abertas do onboarding, e o
// app inteiro nunca leu nenhuma das duas. Quem escreve "quero dormir melhor"
// no minuto zero e depois recebe uma lista de categorias em ordem alfabética
// aprendeu, ali, que o que escreveu não importa.
//
// ⚠️ **ESTA CAMADA NÃO TEM REDE, e isso é regra, não economia.** A decisão D8
// do dono é explícita: do texto dessas duas perguntas, só ENUM sai do
// aparelho — nunca o texto. `functions/api/_redact.js` já declara que
// `soulGoal`/`soulStruggle` não passam por rota de IA, e aquilo é uma linha de
// privacidade, não um esquecimento. Por isso o casamento é por palavra-chave,
// aqui dentro: o texto é lido no aparelho e o que sai dele é, no máximo, uma
// categoria.
//
// O mapa é deliberadamente RASO. Ele não tenta entender a frase; procura
// palavras que quase sempre significam a mesma coisa. Errar para o lado de
// "não sei" é barato (a lista fica na ordem padrão); errar para o lado de
// adivinhar demais coloca na cara da pessoa uma sugestão que não é dela.
// ---------------------------------------------------------------------------

import type { ActivityCategory } from '../types/attributes';

/**
 * Palavras-chave por categoria, PT e EN na mesma lista.
 *
 * Sem acento de propósito: a comparação normaliza o texto antes (quem escreve
 * "exercicio" às pressas no celular precisa ser entendido igual). Radicais
 * curtos ("dorm", "corr") cobrem as conjugações sem uma lista de flexões.
 */
const KEYWORDS: Array<{ category: ActivityCategory; words: readonly string[] }> = [
  { category: 'Health', words: [
    // 'durm' ao lado de 'dorm': em português o radical MUDA na conjugação
    // ("durmo", "durma"), e sem os dois "durmo mal" não casava com sono.
    'dorm', 'durm', 'acordar', 'sono', 'sleep', 'insonia', 'descans', 'rest', 'agua', 'water',
    'comer', 'aliment', 'eat', 'diet', 'saude', 'health', 'remedio', 'medic',
    'terapia', 'therapy', 'medit', 'respir', 'breath',
  ] },
  { category: 'Fitness', words: [
    'academia', 'gym', 'malhar', 'muscul', 'corr', 'run', 'caminh', 'walk',
    'exerc', 'workout', 'treino', 'train', 'bike', 'bicicleta', 'nata', 'swim',
    'alongam', 'stretch', 'yoga', 'peso', 'weight',
  ] },
  { category: 'Study', words: [
    'estud', 'study', 'prova', 'exam', 'faculdade', 'college', 'univers',
    'curso', 'course', 'ler', 'leitura', 'read', 'ingles', 'english', 'idioma',
    'language', 'concurso', 'aprend', 'learn', 'escola', 'school',
  ] },
  { category: 'Work', words: [
    'trabalh', 'work', 'emprego', 'job', 'carreira', 'career', 'projeto',
    'project', 'cliente', 'client', 'freela', 'negocio', 'business',
    'produtiv', 'productiv', 'prazo', 'deadline', 'email', 'reuni', 'meeting',
  ] },
  { category: 'Creativity', words: [
    'desenh', 'draw', 'pint', 'paint', 'escrev', 'writ', 'music', 'tocar',
    'play guitar', 'violao', 'guitar', 'foto', 'photo', 'criar', 'creat',
    'arte', 'art', 'compor', 'compose', 'video',
  ] },
  { category: 'Social', words: [
    'amig', 'friend', 'familia', 'family', 'namor', 'partner', 'sozinh',
    'lonely', 'alone', 'social', 'conversar', 'talk', 'ligar para', 'call',
    'encontrar', 'meet', 'filhos', 'kids', 'mae', 'pai', 'mother', 'father',
  ] },
  { category: 'Discipline', words: [
    'procrastin', 'foco', 'focus', 'distrai', 'distract', 'celular', 'phone',
    'rede social', 'social media', 'organiz', 'rotina', 'routine', 'disciplin',
    'habito', 'habit', 'atras', 'constan', 'consisten', 'preguic', 'lazy',
  ] },
  { category: 'Wellness', words: [
    'ansied', 'anxi', 'estresse', 'stress', 'depress', 'burnout', 'calma',
    'calm', 'bem estar', 'wellbeing', 'wellness', 'autoestima', 'self',
    'gratid', 'gratitude', 'paz', 'peace', 'cuidar de mim', 'care for myself',
  ] },
];

/** Minúsculas, sem acento, espaço colapsado. */
export function normalizeGoalText(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * A categoria que melhor casa com o que a pessoa escreveu, ou `null`.
 *
 * `null` é resposta legítima e frequente — e é a resposta certa para texto
 * vazio, para quem pulou as perguntas e para frase que não bate com nada. Quem
 * chama trata `null` como "mantém a ordem padrão", nunca como erro.
 *
 * Empate resolve pela ORDEM da lista, que não é alfabética: é a ordem em que
 * as categorias aparecem no app. Empate é raro e o que importa é ser estável
 * — a mesma frase tem de dar sempre a mesma sugestão.
 */
export function categoryForGoal(...textos: unknown[]): ActivityCategory | null {
  const alvo = textos.map(normalizeGoalText).filter(Boolean).join(' ');
  if (!alvo) return null;

  let melhor: { category: ActivityCategory; hits: number } | null = null;
  for (const { category, words } of KEYWORDS) {
    let hits = 0;
    for (const w of words) if (alvo.includes(w)) hits += 1;
    if (hits > 0 && (!melhor || hits > melhor.hits)) melhor = { category, hits };
  }
  return melhor?.category ?? null;
}

/**
 * A lista de categorias com a sugerida NA FRENTE — o resto na ordem original.
 *
 * Reordenar em vez de filtrar é deliberado: a leitura do app não é um
 * diagnóstico, e esconder as outras categorias transformaria um palpite por
 * palavra-chave numa decisão tomada no lugar da pessoa.
 */
export function orderCategoriesForGoal<T extends ActivityCategory>(
  categorias: readonly T[],
  ...textos: unknown[]
): T[] {
  const primeira = categoryForGoal(...textos);
  if (!primeira) return [...categorias];
  const resto = categorias.filter(c => c !== primeira);
  return categorias.includes(primeira as T) ? [primeira as T, ...resto] : [...categorias];
}
