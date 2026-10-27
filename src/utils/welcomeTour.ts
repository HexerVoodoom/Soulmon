/**
 * O TOUR DE BOAS-VINDAS DO CORVO — conteúdo e regra de entrada (07/10/2026,
 * pedido do dono). Puro: sem React, sem localStorage, sem `Date`.
 *
 * O que é: seis cartões curtos depois do ritual e do tutorial de 1ª tarefa,
 * ANTES do check-in e do priming: o básico (tarefas → comida/energia → dia
 * completo → evolução manual → cuidado leve → cantos da Home). ⚠️ A Parte 2 (o
 * mapa e os prédios) SAIU daqui em 14/10/2026 (pedido do dono, voz): virou o
 * `MAP_TOUR_STEPS`, abaixo, que abre UMA vez, na primeira abertura do Mapa. A essência é a do produto: o Soulmon é um avatar que evolui COM a
 * pessoa — o corvo apresenta, nunca cobra.
 *
 * O texto é EN + PT-BR: cada string é `{ en, pt }` e `tourText` cai no `en` quando
 * falta `pt`. Não escreva string só em português aqui.
 *
 * Números NUNCA à mão: a meta inicial do dia vem de `FORM_REQUIREMENTS.rookie`.
 */
import { FORM_REQUIREMENTS } from '../types/progression';
import { areaLabel, type AreaId } from '../navigation';
import { BUILDING_INTRO_COPY } from './buildingIntroCopy';
import type { BuildingId } from './gates';
import type { Language } from './i18n';

/** O corvo ainda não tem nome; “Mysterious Soulmon” é o rótulo temporário escolhido. */
export const TOUR_GUIDE_NAME = 'Mysterious Soulmon';
/** PT-BR do rótulo: 'Soulmon misterioso' (dono, 21/10/2026, QA L06-11; a grafia 'Solmon' de 11/10 foi REVOGADA). */
export const TOUR_GUIDE_NAME_PT = 'Soulmon misterioso';
export function tourGuideName(language: Language): string {
  return language === 'pt-BR' ? TOUR_GUIDE_NAME_PT : TOUR_GUIDE_NAME;
}

export interface LocalizedText { en: string; pt?: string }

/** Sem `pt` na string, o fallback é o inglês. */
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

/** A meta inicial do dia, em peso de esforço (`dailyGoalFor` = min(cadastrado, requisito do estágio)). */
export const TOUR_STARTING_GOAL = FORM_REQUIREMENTS.rookie.required;

export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: 'hello', part: 1,
    title: { en: 'Welcome', pt: 'Boas-vindas' },
    speech: {
      en: `Hi! I'll show you around — about a minute. Your Soulmon grows with you, and I'm here to help, not to keep score. You can skip whenever you like.`,
      pt: `Oi! Vou te mostrar o caminho — leva cerca de um minuto. O seu Soulmon cresce junto com você, e eu estou aqui para ajudar, não para dar nota. Você pode pular quando quiser.`,
    },
  },
  {
    id: 'tasks', part: 1,
    title: { en: 'Habits and tasks', pt: 'Hábitos e tarefas' },
    speech: {
      en: 'Your day is made of habits and tasks. Habits come back on the days you choose; tasks are one-offs. When you finish one, tap it. That is the whole move.',
      pt: 'O seu dia é feito de hábitos e tarefas. Os hábitos voltam nos dias que você escolhe; as tarefas são avulsas. Quando terminar uma, toque nela. É só isso.',
    },
  },
  {
    id: 'why', part: 1,
    title: { en: 'Why they matter', pt: 'Por que importam' },
    speech: {
      en: `Each thing you finish feeds your Soulmon: food for energy, and a nudge toward the path it will grow along. A day is complete when you reach today's goal — at first about ${TOUR_STARTING_GOAL} tasks' worth, and bigger tasks count for more.`,
      pt: `Cada coisa que você termina alimenta o seu Soulmon: comida para a energia e um empurrãozinho para o caminho em que ele vai crescer. O dia fica completo quando você alcança a meta de hoje — no começo, o equivalente a umas ${TOUR_STARTING_GOAL} tarefas, e as tarefas maiores valem mais.`,
    },
  },
  {
    id: 'evolution', part: 1,
    title: { en: 'Evolution', pt: 'Evolução' },
    speech: {
      en: 'Every habit or task you finish earns Soul Fragments toward the next form, and they only ever add up. When you have gathered enough, you pick the moment: open Evolution and tap your Soulmon. A slow day just goes slowly.',
      pt: 'Cada hábito ou tarefa que você termina rende Fragmentos de Alma para a próxima forma, e eles só somam. Quando juntar o bastante, o momento é seu: abra a Evolução e toque no seu Soulmon. Um dia devagar só anda devagar.',
    },
  },
  {
    id: 'care', part: 1,
    title: { en: 'A little care', pt: 'Um pouco de cuidado' },
    speech: {
      en: 'Day to day: pet it, feed it, wash it, and let it sleep. A little is plenty.',
      pt: 'No dia a dia: faça carinho, dê comida, dê banho e deixe dormir. Um pouco já é bastante.',
    },
  },
  {
    id: 'corners', part: 1,
    title: { en: 'Missions and the Bag', pt: 'Missões e a Mochila' },
    speech: {
      en: "Missions live in the icon at the corner of Home. The Bag sits with your care buttons under your Soulmon — your items wait there. The first time you open the map, I'll show you around it. You can replay this tour from Settings any time.",
      pt: 'As missões ficam no ícone do canto da Home. A Mochila fica junto dos botões de cuidado, embaixo do seu Soulmon — seus itens esperam lá. Na primeira vez que abrir o mapa, eu mostro o caminho. Você pode rever este tour nas Configurações quando quiser.',
    },
  },
];


// ─────────────────────────────────────────────────────────────────────────────
// O TUTORIAL DO MAPA (14/10/2026, pedido do dono) — abre UMA vez, na primeira abertura do Mapa.
// ─────────────────────────────────────────────────────────────────────────────

/** A ordem dos cartões de área é a do Mapa tal como o tour antigo a lia (travada em teste). */
export const MAP_TOUR_AREA_ORDER: readonly AreaId[] = ['laboratorio', 'mercado', 'arena', 'jogos', 'exploracao', 'hall'];

const bRow = (id: BuildingId, en: string, pt: string): TourAreaRow =>
  ({ name: { en: BUILDING_INTRO_COPY[id].place.en, pt: BUILDING_INTRO_COPY[id].place.pt }, line: { en, pt } });

const mapStep = (area: AreaId, speech: LocalizedText, rows: TourAreaRow[]): TourStep =>
  ({ id: `map-${area}`, part: 2, title: { en: areaLabel(area, false), pt: areaLabel(area, true) }, speech, areas: rows });

/**
 * Um cartão por ÁREA, com uma linha por PRÉDIO (o nome vem da copy de apresentação, então nunca diverge dela).
 * EN + PT-BR, na ordem do Mapa. Nenhum número de Vínculo aqui: a Masmorra e os prédios de entrada abrem desde o
 * começo, o resto abre com o uso (e cada prédio novo se apresenta sozinho quando abre).
 */
export const MAP_TOUR_STEPS: readonly TourStep[] = [
  {
    id: 'map-hello', part: 2,
    title: { en: 'The map', pt: 'O mapa' },
    speech: {
      en: "This is the map. Each place has its own job — I'll go through them quickly, and you can skip whenever you like.",
      pt: 'Este é o mapa. Cada lugar tem a sua função — vou passar por eles rapidinho, e você pode pular quando quiser.',
    },
  },
  mapStep('laboratorio', { en: 'Where your Soulmon is looked at up close.', pt: 'Onde o seu Soulmon é visto de perto.' }, [
    bRow('laboratorio.evolucao', 'Its attributes and the Soul Fragments for the next form.', 'Os atributos e os Fragmentos de Alma para a próxima forma.'),
    bRow('laboratorio.pet', 'Its sheet: element, moves and the creatures you have met.', 'A ficha: elemento, golpes e as criaturas que você já encontrou.'),
    bRow('laboratorio.stats', 'Your stats and your Bond.', 'Suas estatísticas e o seu Vínculo.'),
    bRow('laboratorio.perfil', 'Your profile card.', 'O seu cartão de perfil.'),
    bRow('laboratorio.biblioteca', 'Stories, and the people who tell them.', 'Histórias, e quem as conta.'),
    bRow('laboratorio.amigos', 'Your friends.', 'Os seus amigos.'),
  ]),
  mapStep('mercado', { en: 'Shops, and the forge.', pt: 'Lojas, e a forja.' }, [
    bRow('mercado.itens', 'Food, chips and small things for your Soulmon.', 'Comida, chips e coisinhas para o seu Soulmon.'),
    bRow('mercado.conquistas', 'The milestones you have reached.', 'Os marcos que você já atravessou.'),
    bRow('mercado.decoracao', 'Furniture for its den.', 'Móveis para o abrigo dele.'),
    bRow('mercado.background', 'Backdrops for its stage.', 'Cenários para o palco dele.'),
    bRow('mercado.ferreiro', 'Upgrades for its gear.', 'Aprimora os equipamentos dele.'),
    // 14/10/2026: o Restaurante ainda está em obra (sem ação, sem BuildingId).
    { name: { en: 'Restaurant', pt: 'Restaurante' }, line: { en: 'Under construction, opening soon!', pt: 'Em obra, em breve!' } },
  ]),
  mapStep('arena', { en: 'Meeting other Soulmons. The Endless Rift is open from day one.', pt: 'Encontros com outros Soulmons. A Fenda Sem Fim está aberta desde o primeiro dia.' }, [
    bRow('arena.duelo', 'One duel at a time, against another Soulmon.', 'Um duelo de cada vez, contra outro Soulmon.'),
    bRow('arena.torneio', 'The ranked Tournament and the Open Arena.', 'O Torneio ranqueado e a Arena livre.'),
    bRow('arena.fenda', 'Your Soulmon goes down floor by floor and fights on its own, spending energy.', 'O seu Soulmon desce andar por andar e luta sozinho, gastando energia.'),
    bRow('arena.guerra', 'The Clan War, watched over by Mirevesper, fought with your clan.', 'A Guerra de Clãs, vigiada por Mirevesper, junto do seu clã.'),
  ]),
  mapStep('jogos', { en: 'Play, and calm.', pt: 'Brincar, e acalmar.' }, [
    bRow('jogos.salao', 'Minigames, for fun and for Bits.', 'Minijogos, pela graça e por Bits.'),
    bRow('jogos.mente', 'Memory and logic games.', 'Jogos de memória e lógica.'),
    bRow('jogos.dungeon', 'A small roguelike dungeon game.', 'Um pequeno jogo de calabouço roguelike.'),
  ]),
  mapStep('exploracao', { en: 'Out in the mist.', pt: 'Lá fora, na névoa.' }, [
    bRow('exploracao.passeio', 'A calm walk through the mist.', 'Uma caminhada calma pela névoa.'),
    bRow('exploracao.oficina', 'Plan a session first, then focus.', 'Planeje a sessão primeiro, depois foque.'),
    bRow('exploracao.caderno', 'Your journal.', 'O seu caderno.'),
    bRow('exploracao.refugio', 'Slow breathing for hard moments.', 'Respiração lenta para momentos difíceis.'),
  ]),
  mapStep('hall', { en: 'Your Clan.', pt: 'O seu Clã.' }, [
    bRow('hall.guilda', 'Your Clan.', 'O seu Clã.'),
    bRow('hall.feira', 'The Fair: send your Soulmon on a mission for the Clan.', 'A Feira: mande o seu Soulmon em missão pelo Clã.'),
    bRow('hall.grove', 'The grove your Clan grows.', 'O bosque que o seu Clã cultiva.'),
  ]),
];

// As três regras de ENTRADA moram em `welcomeTourGate.ts` (sem a copy): o `App.tsx` e o
// `GameStateContext` só precisam delas no 1º paint e não podem puxar o texto dos
// prédios (→ areaNpcVoice → guildCopy) para o chunk de entrada. Re-exportadas aqui.
export { needsWelcomeTour, sanitizeMapTutorialSeen, needsMapTutorial } from './welcomeTourGate';
