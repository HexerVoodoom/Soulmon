/**
 * O TOUR DE BOAS-VINDAS DO CORVO — conteúdo e regra de entrada (07/10/2026,
 * pedido do dono). Puro: sem React, sem localStorage, sem `Date`.
 *
 * O que é: oito cartões curtos depois do ritual e do tutorial de 1ª tarefa,
 * ANTES do check-in e do priming. Parte 1 = o básico (tarefas → comida/energia →
 * dia completo → evolução manual → cuidado leve). Parte 2 = o mapa e a função de
 * cada área. A essência é a do produto: o Soulmon é um avatar que evolui COM a
 * pessoa — o corvo apresenta, nunca cobra.
 *
 * ⚠️ O texto é EN por enquanto (pedido do dono). Cada string é um objeto
 * `{ en }` e `tourText` cai no `en` para qualquer idioma: quando o PT-BR entrar,
 * acrescenta-se `pt` ao objeto e NADA mais muda. Não escreva string só em
 * português aqui.
 *
 * Números NUNCA à mão: a meta inicial do dia vem de `FORM_REQUIREMENTS.rookie`.
 */
import { FORM_REQUIREMENTS } from '../types/progression';
import { areaLabel } from '../navigation';
import type { Language } from './i18n';

/** O corvo ainda não tem nome; “Mysterious Soulmon” é o rótulo temporário escolhido. */
export const TOUR_GUIDE_NAME = 'Mysterious Soulmon';

export interface LocalizedText { en: string; pt?: string }

/** `pt` ainda não existe: o fallback é o inglês (decisão do dono, 07/10/2026). */
export function tourText(t: LocalizedText, language: Language): string {
  return language === 'pt-BR' && t.pt ? t.pt : t.en;
}

export interface TourAreaRow { name: LocalizedText; line: LocalizedText }

export interface TourStep {
  id: string;
  part: 1 | 2;
  title: LocalizedText;
  /** A fala do corvo (balão). */
  speech: LocalizedText;
  /** Linhas do mapa (passos da Parte 2) — uma frase por área, na ordem do mapa. */
  areas?: TourAreaRow[];
}

const area = (id: Parameters<typeof areaLabel>[0], line: string): TourAreaRow =>
  ({ name: { en: areaLabel(id, false) }, line: { en: line } });

/** A meta inicial do dia, em peso de esforço (`dailyGoalFor` = min(cadastrado, requisito do estágio)). */
export const TOUR_STARTING_GOAL = FORM_REQUIREMENTS.rookie.required;

export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: 'hello', part: 1,
    title: { en: 'Welcome' },
    speech: { en: `Hi, I'm ${TOUR_GUIDE_NAME}. I'll show you around — about a minute. Your Soulmon grows with you, and I'm here to help, not to keep score. You can skip whenever you like.` },
  },
  {
    id: 'tasks', part: 1,
    title: { en: 'Habits and tasks' },
    speech: { en: 'Your day is made of habits and tasks. Habits come back on the days you choose; tasks are one-offs. When you finish one, tap it. That is the whole move.' },
  },
  {
    id: 'why', part: 1,
    title: { en: 'Why they matter' },
    speech: { en: `Each thing you finish feeds your Soulmon: food for energy, and a nudge toward the path it will grow along. A day is complete when you reach today's goal — at first about ${TOUR_STARTING_GOAL} tasks' worth, and bigger tasks count for more.` },
  },
  {
    id: 'evolution', part: 1,
    title: { en: 'Evolution' },
    speech: { en: 'Complete days add up toward evolution, and they only ever add. When your Soulmon is ready, you pick the moment: open Evolution and tap it. A slow day just goes slowly.' },
  },
  {
    id: 'care', part: 1,
    title: { en: 'A little care' },
    speech: { en: 'Day to day: pet it, feed it, wash it, and let it sleep. A little is plenty.' },
  },
  {
    id: 'map-a', part: 2,
    title: { en: 'The map (1/2)' },
    speech: { en: 'Now the map. Tap the Map icon on Home to open it. Each place has its own job.' },
    areas: [
      area('laboratorio', "See your Soulmon's attributes and its path to evolution, plus stats, the Archive and the Bond Sanctum."),
      area('mercado', 'Shops for items, decor and backdrops, your Achievements, and the Soulsmith, who upgrades your gear.'),
      area('arena', 'The Tournament and the Duel, and the Fair.'),
    ],
  },
  {
    id: 'map-b', part: 2,
    title: { en: 'The map (2/2)' },
    speech: { en: 'The other three places.' },
    areas: [
      area('jogos', 'Minigames in the Game Hall, calm in the Refuge, and the Mind Workshop.'),
      area('exploracao', 'The Dungeon, the Stroll, the Focus Workshop and the Journal.'),
      area('hall', 'The Library, the Friends Circle and the Guild Hall.'),
    ],
  },
  {
    id: 'corners', part: 2,
    title: { en: 'Missions and the Bag' },
    speech: { en: 'Missions live in the icon at the corner of Home. The Bag sits with your care buttons under your Soulmon — your items wait there. You can replay this tour from Settings any time.' },
  },
];

/**
 * Entrada: nunca visto neste aparelho E ainda sem nenhuma conclusão no save.
 * Quem já joga não é interrompido por um tour de boas-vindas — o replay existe
 * em Configurações. `shown` é a flag local (`STORAGE_KEYS.WELCOME_TOUR_SHOWN`).
 */
export function needsWelcomeTour(p: { shown: boolean; jaConcluiuAlgo: boolean }): boolean {
  return !p.shown && !p.jaConcluiuAlgo;
}
