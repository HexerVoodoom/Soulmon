import { useState, type ReactNode } from 'react';
import { STROLL_MIN_MINUTES } from '../types/travessias';
import { Icon } from './ui/Icon';
import { ModalSheet, sm2Hint } from './form/FormKit';
import { FOOD_LIMIT_PER_HOUR } from '../utils/careRules';
import type { Language } from '../utils/i18n';
import { FORM_REQUIREMENTS, ULTRA_PATIENCE_POINTS, getMaxEnergyForStage } from '../types/progression';
import { MAX_HEARTS_LOST_PER_DAY, ABSENCE_FORGIVENESS_DAYS, WEEKLY_RELIEF_HEARTS } from '../utils/dailyReset';
import {
  HABIT_MILESTONES,
  CONSTANCY_WINDOW_DAYS,
  REST_SHIELD_MAX,
  REST_SHIELD_EARN_EVERY_DAYS,
  MISS_INTERVENTION_AT,
  MAX_DAILY_FOCUS,
  OVERCOMMIT_EFFORT,
  POSTPONE_NUDGE_AT,
  HAUNTED_AFTER_DAYS,
  DEFAULT_REST_WINDOW,
  REST_WINDOW_GRACE_MIN,
  REST_WINDOW_DAYS,
} from '../types/taskModel';
import { GOOD_CONSTANCY_RATIO } from '../utils/habitRhythm';
import { DREAM_CATALOG, NIGHT_ENERGY_BONUS } from '../utils/restWindow';
import { guildText } from '../utils/guildCopy';
import { COMBAT_BONUS_CAP } from '../utils/combate/bonus';
import { FORGE_MAX_LEVEL, PIECE_MAX_PCT, REDO_BITS } from '../utils/forge';
import { GATES } from '../utils/gates';
import { DEMO_BOND_LEVEL } from '../utils/demoMode';
import { TALENT_POINTS_MAX } from '../utils/talents';
import { CREDIT_BITS_CAP_RATIO } from '../utils/bitsOrigin';
import { DUNGEON_FIGHTS_PER_FLOOR, DUNGEON_HP_REGEN_FULL_HOURS, DUNGEON_MIN_HP_TO_ENTER_PCT, DUNGEON_MILESTONE_FLOOR, DUNGEON_ENERGY_PER_LAYER, DUNGEON_MAX_LAYER } from '../utils/dungeonIdle';
import { ENERGY_REGEN_MINUTES, HUNGER_FULL_TO_EMPTY_HOURS } from '../utils/hunger';
import { DEFAULT_MEAL_TIMES, MEAL_WINDOW_MIN } from '../utils/mealRhythm';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

/**
 * GUIA — a versão curta, e a curta é a verdadeira
 * ===============================================
 *
 * Este arquivo tinha 16 seções e ~60 parágrafos: era o texto mais longo do
 * app, aberto por alguém que está com o pet na mão e quer uma resposta. A
 * pergunta feita a cada parágrafo foi "isto muda alguma decisão do jogador?".
 * O que sobrou são 7 capítulos FECHADOS por padrão — quem abre o guia tem UMA
 * dúvida, e uma parede de texto é a forma mais eficiente de não respondê-la.
 *
 * O que saiu (e por que): a defesa filosófica de cada regra (interessante para
 * quem projetou, irrelevante para quem joga), a repetição entre seções (HP
 * aparecia em 2, esforço em 3), o "limite de atividades" e a "seleção de dias
 * da semana" (a própria tela já mostra os dois na hora de usar) e todo texto
 * que só reafirmava gentileza sem dizer o que acontece.
 *
 * **Os números continuam saindo das CONSTANTES**, nunca escritos à mão — é a
 * convenção do projeto, e foi assim que o guia já prometeu estágios de ovo e
 * um teto de comida que não existiam mais.
 */
export function GuideModal({ isOpen, onClose, language = 'en-US' }: GuideModalProps) {
  const isPt = language === 'pt-BR';
  const L = (pt: string, en: string) => (isPt ? pt : en);
  const [open, setOpen] = useState<string | null>(null);

  const R = FORM_REQUIREMENTS;
  const [, , M3] = HABIT_MILESTONES;
  /** O "5" de "5 das últimas 7": vem da razão, não de um literal. */
  const GOOD_DAYS = Math.round(GOOD_CONSTANCY_RATIO * CONSTANCY_WINDOW_DAYS);
  const DREAM_COUNT = DREAM_CATALOG.length;
  /** Parágrafo do guia: o corpo do capítulo aberto é 12 `muted`, recuado por
   *  um filete `line` (canvas Conta, CONTA-15); o gap do flex já espaça. */
  const para = { ...sm2Hint, margin: 0 };

  const chapters: { id: string; title: string; body: ReactNode }[] = [
    {
      id: 'evolve',
      title: L('Como seu Soulmon evolui', 'How it evolves'),
      body: (
        <>
          <p style={para}>
            {L(
              // 🧬 11/10/2026 (decisão do dono): o critério de evolução é o
              // GAUGE (`utils/evolutionGauge.ts`), não mais o dia completo.
              'Cada forma tem uma barra de Fragmentos de Alma. Todo hábito ou tarefa concluída rende fragmentos (tarefas maiores, 1 a 3), até a meta diária do estágio.',
              'Each form has a Soul Fragment bar. Every habit or task you finish earns fragments (bigger tasks, 1 to 3), up to your stage’s daily goal.',
            )}
          </p>
          <p style={para}>
            {L(
              'Eles entram na virada do dia e nunca diminuem; quando juntam o bastante, abrem a próxima forma.',
              'They join at the turn of the day and never shrink; once you have enough, they open the next form.',
            )}
          </p>
          <p style={para}>
            {L(
              // WP4.17: `required` é o número que os DOIS portões de evolução
              // manual leem (`handleEvolve` e o `canEvolve` do HUD). O guia
              // citava `daysToEvolve` (10/20/30/40) — um campo que nenhuma
              // regra consulta — e prometia uma escada 2,5× mais longa que a
              // real. Quem lia o guia achava que estava a 6 dias de evoluir
              // quando o botão já estava aceso.
              `Rookie→Champion pede ${R.rookie.gauge} passos (até ${R.rookie.required} por dia); Champion→Ultimate ${R.champion.gauge} (até ${R.champion.required}/dia); Ultimate→Mega ${R.ultimate.gauge} (até ${R.ultimate.required}/dia).`,
              `Rookie→Champion takes ${R.rookie.gauge} steps (up to ${R.rookie.required} a day); Champion→Ultimate ${R.champion.gauge} (up to ${R.champion.required}/day); Ultimate→Mega ${R.ultimate.gauge} (up to ${R.ultimate.required}/day).`,
            )}
          </p>
          {/* WP4.2 — o requisito do Ultra nunca esteve no guia, e ele é o único
              da árvore que não é só "dias completos". Enquanto o único caminho
              era a coleção das três megas, a omissão escondia que o topo pedia
              DUAS quedas deliberadas. Agora são dois caminhos e os dois são
              ditos — com a permanência primeiro, que é a que não pede descer. */}
          <p style={para}>
            {L(
              `O Ultra tem dois caminhos: ${ULTRA_PATIENCE_POINTS} passos como mega, ou conhecer os três galhos (aí bastam ${R.mega.gauge}). Nenhum é melhor, e nenhum pede que você degenere.`,
              `The Ultra has two paths: ${ULTRA_PATIENCE_POINTS} steps as a mega, or knowing all three branches (then ${R.mega.gauge} is enough). Neither is better, and neither asks you to degenerate.`,
            )}
          </p>
          {/* Renascimento: o degrau depois do topo. Fica logo abaixo do Ultra
              porque é a única coisa que vem DEPOIS dele, e a frase diz a perda
              e o que sobrevive na mesma respiração — guia que só promete o
              ganho é anúncio. */}
          <p style={para}>
            {L(
              /* ⚠️ "de conta completa" entrou na auditoria de 06/09/2026: este
                 parágrafo prometia o Renascimento a TODOS sem dizer que é
                 exclusivo de quem comprou, e a página de Evolução não mostrava
                 nada para quem não podia — o guia criava a expectativa e a tela
                 entregava silêncio. */
              'Depois do Ultra existe o Renascimento, para quem tem a conta completa: sua criatura vira ovo, volta a Rookie e os atributos zeram.',
              'After the Ultra comes Rebirth, for full accounts: your creature becomes an egg, returns to Rookie and attributes reset.',
            )}
          </p>
          <p style={para}>
            {L(
              'Em troca ela nasce mais funda e você escolhe criatura, escola e elemento. Bits, cenários, sonhos, hábitos e o caminho andado ficam. Só acontece uma vez.',
              'In exchange it is born deeper and you choose its creature, school and element. Bits, scenes, dreams, habits and the path walked stay. It happens only once.',
            )}
          </p>
          <p style={para}>
            {L(
              'O caminho só acumula — um dia fraco soma pouco, nunca tira. Dia completo (a meta inteira) é um selo do dia: rende Bits, mas não faz evoluir.',
              'The path only accumulates — a light day adds a little, never takes away. A complete day is a seal for the day: it pays Bits, but does not drive evolution.',
            )}
          </p>
          <p style={para}>
            {L(
              'A evolução é sua: toque no Soulmon na página de Evolução para travar ou destravar o cadeado.',
              'Evolution is yours: tap your Soulmon on the Evolution page to lock or unlock the padlock.',
            )}
          </p>
          <p style={para}>
            {/* INCUBAÇÃO (D-G8b/D-G8c). A copy diz a verdade INTEIRA — leva um
                tempo, volta quando quiser, nada se perde —, que é a condição
                R-N do parecer: quem não sabe que nada expira se comporta como
                se expirasse. Sem número e sem unidade de tempo (R-I). */}
            {L(
              'Quando a barra enche, a próxima forma começa a tomar corpo e leva um tempo para ficar pronta. Volte quando quiser — ela espera, e nada se perde.',
              'When the bar fills, the next form starts taking shape and takes a while to be ready. Come back whenever you like — it waits, and nothing is lost.',
            )}
          </p>
        </>
      ),
    },
    {
      id: 'hearts',
      title: L('Corações', 'Hearts'),
      body: (
        <>
          <p style={para}>
            {L(
              `Na virada do dia você perde no máximo ${MAX_HEARTS_LOST_PER_DAY} coração, proporcional ao que ficou por fazer. Cumpriu a meta, não perde nada.`,
              `At the day turn you lose at most ${MAX_HEARTS_LOST_PER_DAY} heart, in proportion to what you left undone. Meet the goal and you lose nothing.`,
            )}
          </p>
          <p style={para}>
            {L(
              `Sumiu por ${ABSENCE_FORGIVENESS_DAYS} dias ou mais? Voltar não custa nada. Toda segunda seu Soulmon recupera ${WEEKLY_RELIEF_HEARTS} coração. O relatório diário diz qual pausa segurou o dia.`,
              `Away for ${ABSENCE_FORGIVENESS_DAYS} days or more? Coming back costs nothing. Every Monday it recovers ${WEEKLY_RELIEF_HEARTS} of a heart. The daily report says which pause held the day.`,
            )}
          </p>
          <p style={para}>
            {L(
              'Cocô não limpo drena 1 coração a cada 6 horas — dê banho. Esfregar o pet cura (até 1 coração por dia). Se zerar, seu Soulmon regride uma forma.',
              'Uncleaned poop drains 1 heart every 6 hours — give it a bath. Rubbing your pet is the main way to heal (up to 1 heart a day). At zero it degenerates one form.',
            )}
          </p>
        </>
      ),
    },
    {
      id: 'care',
      title: L('Comida e energia', 'Food and energy'),
      body: (
        <>
          <p style={para}>
            {L(
              `As barras de energia são o dobro da meta diária do estágio (Rookie: ${getMaxEnergyForStage('rookie')}). Ela zera todo dia e não decide o dia completo.`,
              `Energy bars are twice your stage’s daily goal (Rookie: ${getMaxEnergyForStage('rookie')}). It resets daily and does not decide the complete day.`,
            )}
          </p>
          <p style={para}>
            {L(
              `Sobe com o tempo: 1 a cada ${ENERGY_REGEN_MINUTES} min com o Soulmon bem alimentado, metade da velocidade com um pouco de fome, parada se ele estiver faminto.`,
              `It rises with time: 1 every ${ENERGY_REGEN_MINUTES} min when your Soulmon is well fed, half speed when a little hungry, stopped when starving.`,
            )}
          </p>
          <p style={para}>
            {L(
              `Serve para descer a Masmorra: cada camada gasta ${DUNGEON_ENERGY_PER_LAYER}, e subir de nível enche de novo.`,
              `It is what the Dungeon runs on: each layer spends ${DUNGEON_ENERGY_PER_LAYER}, and leveling up refills it.`,
            )}
          </p>
          <p style={para}>
            {L(
              `Cada tarefa concluída rende uma comida. Alimentar enche a fome (cai do cheio ao vazio em ${HUNGER_FULL_TO_EMPTY_HOURS} h) e dá pontos de atributo, que definem o galho da evolução.`,
              `Each completed task yields one food. Feeding fills hunger (full to empty in ${HUNGER_FULL_TO_EMPTY_HOURS} h) and grants attribute points, which steer your evolution branch.`,
            )}
          </p>
          <p style={para}>
            {L(
              `NÃO dá energia direto e NÃO cura coração. Fome não custa nada além da energia parada. Até ${FOOD_LIMIT_PER_HOUR} vezes por hora.`,
              `It does NOT give energy directly or heal hearts. Hunger costs nothing beyond paused energy. Up to ${FOOD_LIMIT_PER_HOUR} times an hour.`,
            )}
          </p>
          <p style={para}>
            {L(
              `Depois do café, do almoço e do jantar (${DEFAULT_MEAL_TIMES.breakfast}, ${DEFAULT_MEAL_TIMES.lunch} e ${DEFAULT_MEAL_TIMES.dinner}; muda nas Configurações), seu Soulmon pode pedir UMA coisa pequena por ${MEAL_WINDOW_MIN / 60} horas: carinho, banho, comidinha.`,
              `After breakfast, lunch and dinner (${DEFAULT_MEAL_TIMES.breakfast}, ${DEFAULT_MEAL_TIMES.lunch} and ${DEFAULT_MEAL_TIMES.dinner} — change them in Settings), your Soulmon may ask for ONE small thing for ${MEAL_WINDOW_MIN / 60} hours: a pat, a rinse, a snack.`,
            )}
          </p>
          <p style={para}>
            {L(
              `Não vale pontos, não conta e pular não custa nada. Os lembretes começam desligados.`,
              `It earns no points, nothing is counted, and skipping costs nothing. The reminders start off.`,
            )}
          </p>
        </>
      ),
    },
    {
      id: 'habits',
      title: L('Hábitos', 'Habits'),
      body: (
        <>
          <p style={para}>
            {L(
              `Não existe sequência que zera. O que aparece é a constância: "${GOOD_DAYS} das últimas ${CONSTANCY_WINDOW_DAYS}". Uma falta custa uma fatia, nunca tudo.`,
              `There is no streak that resets. What you see is consistency: "${GOOD_DAYS} of the last ${CONSTANCY_WINDOW_DAYS}". A missed day costs a slice, never everything.`,
            )}
          </p>
          <p style={para}>
            {L(
              `A cada ${REST_SHIELD_EARN_EVERY_DAYS} dias de boa constância você ganha um escudo (até ${REST_SHIELD_MAX}). Ele é gasto sozinho no dia em que você falta — nada para lembrar de ativar.`,
              `Every ${REST_SHIELD_EARN_EVERY_DAYS} days of good consistency you earn a shield (up to ${REST_SHIELD_MAX}). It is spent automatically on a day you miss — nothing to remember to switch on.`,
            )}
          </p>
          <p style={para}>
            {L(
              `Uma falta não gera nada. Em ${MISS_INTERVENTION_AT} seguidas, o pet oferece uma versão bem menor do hábito — aceitar já conta como feito.`,
              `One miss does nothing. At ${MISS_INTERVENTION_AT} in a row, your pet offers a much smaller version of the habit — accepting counts as done.`,
            )}
          </p>
          <p style={para}>
            {L(
              `E o ícone amadurece até virar árvore em ${M3} dias feitos, rendendo mais atributo.`,
              `And the icon matures into a tree at ${M3} days done, yielding more attribute.`,
            )}
          </p>
        </>
      ),
    },
    {
      id: 'tasks',
      title: L('Tarefas', 'Tasks'),
      body: (
        <>
          <p style={para}>
            {L(
              'Hábito acontece TODO DIA e aparece sempre no Hoje; tarefa é pontual ou em dias específicos e só aparece nos dias dela (a lista completa fica em "Ver tudo").',
              'A habit happens EVERY DAY and always shows in Today; a task is one-off or on specific days and only shows on its days (the full list lives in "View all").',
            )}
          </p>
          <p style={para}>
            {L(
              'Tarefa com subitens pesa pelo esforço escolhido, não pelo número deles. Cada subitem feito avança a barra e rende um pouco de XP (até 5, no máximo +50%).',
              'A task with steps weighs by the effort you picked, not by its step count. Each finished step advances the bar and earns a little XP (up to 5, at most +50%).',
            )}
          </p>
          <p style={para}>
            {L(
              'O peso nunca passa do que as mesmas tarefas soltas pesariam (máximo 3).',
              'The weight never exceeds what the same loose tasks would (max 3).',
            )}
          </p>
          <p style={para}>
            {L(
              'Fechar TODOS os subitens de tarefa com 3+ rende comida premium (★): 5 de energia em vez de 1, no máximo uma por dia e três por semana, dentro do teto do dia.',
              'Finishing ALL steps of a task with 3 or more earns a premium food (★): 5 energy instead of 1, at most one a day and three a week, never above the day\'s max.',
            )}
          </p>
          <p style={para}>
            {L(
              'O check de um hábito vale só para hoje; o "N de M" ao lado é só o resumo da semana.',
              'A habit\'s check counts only for that day; the "N of M" beside it is just the week\'s summary.',
            )}
          </p>
          <p style={para}>
            {L(
              `Toda tarefa tem um esforço: Rápida (1), Média (2) ou Projeto (3). A meta soma esforço, não itens — um Projeto vale três Rápidas.`,
              `Every task has an effort: Quick (1), Medium (2) or Project (3). The goal adds up effort, not items — one Project is worth three Quick ones.`,
            )}
          </p>
          <p style={para}>
            {L(
              `Passando de ${OVERCOMMIT_EFFORT} pontos no dia, o pet avisa. É aviso, nunca bloqueio.`,
              `Past ${OVERCOMMIT_EFFORT} points in a day your pet says so. A heads-up, never a block.`,
            )}
          </p>
          <p style={para}>
            {L(
              `No check-in você escolhe até ${MAX_DAILY_FOCUS} focos do dia; completar os ${MAX_DAILY_FOCUS} rende o selo.`,
              `At check-in you pick up to ${MAX_DAILY_FOCUS} focus tasks; completing all ${MAX_DAILY_FOCUS} earns the seal.`,
            )}
          </p>
          <p style={para}>
            {L(
              `Parada há ${HAUNTED_AFTER_DAYS} dias ela fica assombrada — e concluir uma assombrada dá bônus de alívio. Adiada ${POSTPONE_NUDGE_AT} vezes, o pet oferece dividir, encolher ou deixar pra lá.`,
              `Untouched for ${HAUNTED_AFTER_DAYS} days it becomes haunted — clearing a haunted task grants a relief bonus. Postponed ${POSTPONE_NUDGE_AT} times, your pet offers to split, shrink or drop it.`,
            )}
          </p>
          <p style={para}>
            {L(
              '"Algum dia" é permissão formal para não fazer agora: não conta na meta e não assombra. "Deixar pra lá" é um fim honesto, com volta atrás.',
              '"Someday" is formal permission not to do it now: it doesn\'t count toward the goal and never haunts. "Let it go" is an honest ending, with an undo.',
            )}
          </p>
        </>
      ),
    },
    {
      id: 'rest',
      title: L('Descanso e sonhos', 'Rest and dreams'),
      body: (
        <>
          <p style={para}>
            {L(
              `Você escolhe a SUA janela de sono (padrão ${DEFAULT_REST_WINDOW.start}–${DEFAULT_REST_WINDOW.end}, com ${REST_WINDOW_GRACE_MIN} min de tolerância). O que conta é o gesto de deitar no horário — nunca a qualidade do seu sono.`,
              `You choose YOUR own sleep window (default ${DEFAULT_REST_WINDOW.start}–${DEFAULT_REST_WINDOW.end}, with ${REST_WINDOW_GRACE_MIN} min of grace). What counts is going to bed on time — never how well you slept.`,
            )}
          </p>
          <p style={para}>
            {L(
              `Sem nota de sono e sem castigo: noite sem registro é neutra. A leitura é quantas das últimas ${REST_WINDOW_DAYS} noites entraram na janela.`,
              `No sleep score and no penalty: an unlogged night is neutral. The reading is how many of the last ${REST_WINDOW_DAYS} nights landed inside the window.`,
            )}
          </p>
          <p style={para}>
            {L(
              `Cada noite na janela seu Soulmon SONHA: uma cena colecionável dele — ${DREAM_COUNT} para descobrir. A raridade vem da regularidade, nunca de dormir mais.`,
              `Every night inside the window it DREAMS: a collectible scene of itself — ${DREAM_COUNT} to discover. Rarity comes from regularity, never from sleeping longer.`,
            )}
          </p>
          <p style={para}>
            {L(
              `Uma noite no horário também traz ${NIGHT_ENERGY_BONUS} de energia a mais de manhã, uma vez por dia; sem noite, nada se perde.`,
              `A night on time also brings ${NIGHT_ENERGY_BONUS} extra energy in the morning, once a day; no night, nothing is lost.`,
            )}
          </p>
        </>
      ),
    },
    {
      // 🧭 Passeio e Travessias (30/09/2026, `utils/travessias.ts`). Sem número:
      // não há contagem de regiões a mostrar, e prazo não existe.
      id: 'passeio',
      title: L('Passeio e Travessias', 'Stroll and Crossings'),
      body: (
        <>
          <p style={para}>
            {L(
              'Na Exploração fica o Passeio: seu Soulmon sai todo dia e conta o que viu no relatório do fim do dia. Você escolhe para onde — casa ou uma região já aberta.',
              'The Stroll lives in Exploration: your Soulmon heads out daily and tells you what it saw in the end-of-day report. You pick where: home, or an open region.',
            )}
          </p>
          <p style={para}>
            {L(
              'Travessias são opcionais: algo que você faz fora do app, com uma versão pequena para fazer em casa. Esperam o tempo que for; deixar pra lá não custa nada.',
              'Crossings are optional: something you do outside the app, with a small version you can do at home. They wait as long as you like; letting one go costs nothing.',
            )}
          </p>
          <p style={para}>
            {L(
              'O passeio fica com o NPC da Exploração: é lá que você escolhe e conclui. Depois de pegar a missão, o Concluir abre em ' + STROLL_MIN_MINUTES + ' minutos.',
              'The stroll stays with the NPC in Exploration: that is where you pick and finish it. Once you pick a mission, Done opens after ' + STROLL_MIN_MINUTES + ' minutes.',
            )}
          </p>
          <p style={para}>
            {L(
              'No menu de Missões fica só a linha "Faça um passeio". Missões só apontam o que fazer: feita a ação, a linha fica pronta e você toca em Resgatar.',
              'The Missions menu only keeps a "Take a stroll" line. Missions only point at what to do: once done, the line turns ready and you tap Claim.',
            )}
          </p>
          <p style={para}>
            {L(
              'Há dois acessos na Home: missões diárias e semanais. Quando você resgata, a névoa de uma região se abre no passeio da noite seguinte.',
              'Home has two doors: daily and weekly missions. Once you claim, the mist over a region clears on the next night\'s stroll.',
            )}
          </p>
          <p style={para}>
            {L(
              'Nada disso mexe no seu Soulmon, na meta do dia, nos corações ou na evolução. E dá para esconder as Travessias na própria folha do Passeio.',
              'None of it touches your Soulmon, the daily goal, hearts or evolution. You can also hide Crossings from the Stroll sheet itself.',
            )}
          </p>
        </>
      ),
    },
    {
      // A Guilda (`guild.guide.*`): a copy é do `guildCopy.ts`; nenhum número escrito à mão aqui.
      id: 'guild',
      title: guildText(language, 'guild.guide.titulo'),
      body: <p style={para}>{guildText(language, 'guild.guide.corpo')}</p>,
    },
    {
      // A DEMO (`utils/demoMode.ts`): o número vem da CONSTANTE, e a regra é dita inteira e sem culpa.
      id: 'demo',
      title: L('A demo', 'The demo'),
      body: (
        <>
        <p style={para}>
          {L(
            `O botão DEMO abre o jogo sem conta, com um dos cinco Soulmon iniciais no Vínculo nível ${DEMO_BOND_LEVEL}. A demo salva só neste aparelho e não faz compras.`,
              `The DEMO button opens the game without an account, with one of the five starter Soulmon at Bond level ${DEMO_BOND_LEVEL}. The demo saves on this device only; no purchases.`,
            )}
          </p>
          <p style={para}>
            {L(
              `Não ganha XP (o Vínculo fica fixo) e não entra no PvP (Torneio, Duelo, Biblioteca e Clã ficam fechados). Para ter uma conta, saia da demo em Configurações.`,
              `It earns no XP (Bond stays fixed) and does not enter PvP (Tournament, Duel, Library and Clan stay closed). To get an account, leave the demo in Settings.`,
            )}
          </p>
        </>
      ),
    },
    {
      id: 'more',
      title: L('O resto, em uma linha cada', 'Everything else, one line each'),
      body: (
        <>
          <p style={para}>
            {L(
              'Galhos: Poder, Harmonia e Benevolência — os requisitos são iguais nos três. No empate decide o seu ritmo de cuidado, e nenhum ritmo é melhor.',
              'Branches: Power, Harmony and Benevolence — requirements are identical across all three. Ties are decided by your care rhythm, and no rhythm is better.',
            )}
          </p>
          <p style={para}>
            {L(
              'Traço de nascimento: todo Soulmon nasce com um (veja em Estatísticas). Todos são positivos.',
              'Birth trait: every Soulmon is born with one (see it in Stats). All of them are upsides.',
            )}
          </p>
          <p style={para}>
            {L(
              'A Fenda e o Torneio nunca cobram corações. Perder custa só a descida.',
              'The Endless Rift and the Tournament never cost hearts. Losing only costs the descent.',
            )}
          </p>
          <p style={para}>
            {L(
              `A Masmorra é uma descida automática: as lutas vêm sozinhas e a cada ${DUNGEON_FIGHTS_PER_FLOOR} você desce uma camada, até a ${DUNGEON_MAX_LAYER}. Cada camada gasta ${DUNGEON_ENERGY_PER_LAYER} de energia (a da Home).`,
              `The Dungeon is an automatic descent: fights come on their own and every ${DUNGEON_FIGHTS_PER_FLOOR} you go down a layer, all the way to ${DUNGEON_MAX_LAYER}. Each layer spends ${DUNGEON_ENERGY_PER_LAYER} energy (Home energy).`,
            )}
          </p>
          <p style={para}>
            {L(
              `A descida para quando a energia ou o HP acabam. O HP volta com o tempo (uns ${DUNGEON_HP_REGEN_FULL_HOURS} h do zero ao cheio, até com o app fechado) e precisa de ${DUNGEON_MIN_HP_TO_ENTER_PCT}% para descer de novo.`,
              `The descent stops when energy or HP runs out. HP returns over time (about ${DUNGEON_HP_REGEN_FULL_HOURS} h from empty to full, even app closed); you need ${DUNGEON_MIN_HP_TO_ENTER_PCT}% to descend again.`,
            )}
          </p>
          <p style={para}>
            {L(
              `A cada ${DUNGEON_MILESTONE_FLOOR} camadas há um marco: a próxima descida começa dali, e o primeiro marco de cada descida rende o item 🌀 (veja Itens).`,
              `Every ${DUNGEON_MILESTONE_FLOOR} layers is a milestone: the next descent starts there, and the first milestone of each descent earns the 🌀 item (see Items).`,
            )}
          </p>
          <p style={para}>
            {L(
              `Quanto mais Lv, mais fundo ele chega; uma profundidade nova (5, 10, 25, 50…) rende fragmentos do Soulsmith. Subir de nível enche energia e HP.`,
              `The higher your Soulmon's Lv, the deeper it reaches; a new depth (5, 10, 25, 50…) earns Soulsmith fragments. Leveling up refills energy and HP.`,
            )}
          </p>
          <p style={para}>
            {L(
              'Torneio e Arena são diferentes: o Torneio é RANQUEADO e o servidor sorteia seus oponentes. Na Arena livre VOCÊ escolhe contra quem lutar, de poder parecido.',
              'Tournament and Arena differ: the Tournament is RANKED and the server draws your opponents. In the Open Arena YOU choose who to fight, of similar power.',
            )}
          </p>
          <p style={para}>
            {L(
              'Nos duelos os pets lutam sozinhos. Toque em qualquer lugar para torcer: o gauge cheio vira um golpe especial. Torcer só ajuda; não torcer não atrapalha.',
              'In duels the pets fight on their own. Tap anywhere to cheer: a full gauge becomes a special strike. Cheering only helps; skipping never hurts.',
            )}
          </p>
          <p style={para}>
            {L(
              'Elementos importam na Arena e no Combina 3 (não nos Duelos nem na Guerra): um golpe cujo elemento contra-ataca o do outro lado vale um golpe a menos ("Super eficiente!"), e o inverso leva um golpe a mais ("Pouco eficiente"). Sem elemento em um dos lados, nada muda.',
              'Elements matter in the Arena and Combine 3 (not in Duels or the War): a strike whose element counters the opposing element lands one hit sooner ("Super effective!"), and the reverse takes one hit longer ("Not very effective"). No element on either side means no change.',
            )}
          </p>
          <p style={para}>
            {L(
              `Vínculo N é o seu nível como pessoa que cuida: cada Vínculo (até ${TALENT_POINTS_MAX}) rende um ponto de talento, e nenhum dinheiro compra Vínculo.`,
              `Bond N is your own level as a carer: each Bond (up to ${TALENT_POINTS_MAX}) gives one talent point, and no money buys Bond.`,
            )}
          </p>
          <p style={para}>
            {L(
              `A Arena e o Torneio abrem no Vínculo ${GATES.pvp.minBond}. Lv N é o do seu Soulmon.`,
              `The Arena and the Tournament open at Bond ${GATES.pvp.minBond}. Lv N is your Soulmon's.`,
            )}
          </p>
          <p style={para}>
            {L(
              `Talentos e equipamento somam, no máximo, ${Math.round(COMBAT_BONUS_CAP * 100)}% de força em qualquer luta.`,
              `Talents and equipment add at most ${Math.round(COMBAT_BONUS_CAP * 100)}% strength in any fight.`,
            )}
          </p>
          <p style={para}>
            {L(
              `Cada peça chega no nível 1 pela missão de um prédio e se aprimora no Soulsmith até o nível ${FORGE_MAX_LEVEL}, com os materiais das missões.`,
              `Each piece arrives at level 1 through a building mission and is upgraded at the Soulsmith up to level ${FORGE_MAX_LEVEL}, with the materials missions give.`,
            )}
          </p>
          <p style={para}>
            {L(
              `A cada nível você escolhe entre dois ganhos (refazer custa ${REDO_BITS} Bits ganhos jogando). Uma peça no máximo vale ${(PIECE_MAX_PCT * 100).toFixed(1).replace('.', ',')}%.`,
              `At each level you choose between two gains (redoing a choice costs ${REDO_BITS} Bits earned by playing). One piece at the top is worth ${(PIECE_MAX_PCT * 100).toFixed(1)}%.`,
            )}
          </p>
          <p style={para}>
            {L(
              `As peças são partes da sua alma, aprimoradas: não há como tirar. Sem sorteio. Créditos aceleram só o que não é combate, em até +${Math.round(CREDIT_BITS_CAP_RATIO * 100)}% sobre o ritmo grátis.`,
              `The pieces are parts of your soul, refined: nothing to take off. No draws. Credits speed up only what is not combat, by up to +${Math.round(CREDIT_BITS_CAP_RATIO * 100)}% over the free pace.`,
            )}
          </p>
          <p style={para}>
            {L(
              'O check-in e o relatório do dia levam vinte segundos; o de domingo descreve a semana. Nada disso vira nota.',
              'Check-in and the daily report take twenty seconds; Sunday describes the week. None of it becomes a score.',
            )}
          </p>
          <p style={para}>
            {L(
              'Toda segunda e todo dia 1 vem um recomeço: zera as cobranças pendentes e não apaga nada do que você conquistou.',
              'Every Monday and every 1st a fresh start is offered: pending nagging is cleared and nothing you earned is erased.',
            )}
          </p>
        </>
      ),
    },
  ];

  return (
    <ModalSheet
      open={isOpen}
      onClose={onClose}
      language={language}
      title={L('Guia', 'Guide')}
      maxWidth={520}
    >
      <p style={sm2Hint}>
        {L('Toque num assunto. Nada aqui é obrigatório saber para jogar.',
           'Tap a topic. None of this is required knowledge to play.')}
      </p>

      {/* Canvas Conta (`GuiaGlossario.dc.html`, achado 7): sete capítulos =
          linhas 44 em Rubik 14/500 com `expand_more` 24 `muted`; o aberto com
          `expand_less` em `primary-ink` e o corpo 12 recuado por um filete
          `line`. Um aberto por vez. */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {chapters.map(ch => {
          const isOpenCh = open === ch.id;
          return (
            <div key={ch.id}>
              <button
                type="button"
                onClick={() => setOpen(isOpenCh ? null : ch.id)}
                aria-expanded={isOpenCh}
                aria-controls={`guide-${ch.id}`}
                className="sm2-conta-chap"
              >
                <span style={{ flex: 1, minWidth: 0 }}>{ch.title}</span>
                <Icon name={isOpenCh ? 'expand_less' : 'expand_more'} size={24} tone={isOpenCh ? 'primary' : 'muted'} />
              </button>
              {isOpenCh && (
                <div id={`guide-${ch.id}`} className="sm2-conta-chapbody">
                  {ch.body}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p style={sm2Hint}>
        {L('Nos dias em que não der, seu Soulmon continua aqui.',
           'On the days you can’t, it stays right here.')}
      </p>
    </ModalSheet>
  );
}
