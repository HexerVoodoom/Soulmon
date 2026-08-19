import { useState, type ReactNode } from 'react';
import { Icon } from './ui/Icon';
import { ModalSheet, sm2Hint, sm2Text } from './form/FormKit';
import { FOOD_LIMIT_PER_HOUR } from '../utils/careRules';
import type { Language } from '../utils/i18n';
import { FORM_REQUIREMENTS } from '../types/progression';
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
import { DREAM_CATALOG } from '../utils/restWindow';

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
  /** Parágrafo do guia: `sm2Text` não zera a margem do `<p>`, e o gap do flex já espaça. */
  const para = { ...sm2Text, margin: 0 };

  const chapters: { id: string; title: string; body: ReactNode }[] = [
    {
      id: 'evolve',
      title: L('Como ele evolui', 'How it evolves'),
      body: (
        <>
          <p style={para}>
            {L(
              'Dia perfeito = você cumpriu a meta do dia e a energia dele fechou cheia. A meta é o que você cadastrou, até o requisito do estágio.',
              'A perfect day = you met your daily goal and its energy ended full. The goal is what you registered, capped at your stage requirement.',
            )}
          </p>
          <p style={para}>
            {L(
              `Rookie→Champion pede ${R.rookie.daysToEvolve} dias perfeitos; Champion→Ultimate ${R.champion.daysToEvolve}; Ultimate→Mega ${R.ultimate.daysToEvolve}; Mega→Ultra ${R.mega.daysToEvolve}.`,
              `Rookie→Champion needs ${R.rookie.daysToEvolve} perfect days; Champion→Ultimate ${R.champion.daysToEvolve}; Ultimate→Mega ${R.ultimate.daysToEvolve}; Mega→Ultra ${R.mega.daysToEvolve}.`,
            )}
          </p>
          <p style={para}>
            {L(
              'Dias perfeitos só acumulam. A evolução é sua: toque no Soulmon na página de Evolução para travar ou destravar o cadeado.',
              'Perfect days only accumulate. Evolution is yours to trigger: tap your Soulmon on the Evolution page to lock or unlock the padlock.',
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
              `Sumiu por ${ABSENCE_FORGIVENESS_DAYS} dias ou mais? Voltar não custa nada. Toda segunda ele recupera ${WEEKLY_RELIEF_HEARTS} coração.`,
              `Away for ${ABSENCE_FORGIVENESS_DAYS} days or more? Coming back costs nothing. Every Monday it recovers ${WEEKLY_RELIEF_HEARTS} of a heart.`,
            )}
          </p>
          <p style={para}>
            {L(
              'Cocô não limpo drena 1 coração a cada 6 horas — dê banho. Esfregar o pet é o principal jeito de curar (até 1 coração por dia). Se zerar, ele regride uma forma.',
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
              `As barras de energia são o requisito do estágio (Rookie: ${R.rookie.required}). Ela enche só comendo e zera todo dia.`,
              `Energy bars equal your stage requirement (Rookie: ${R.rookie.required}). It fills only by feeding and resets daily.`,
            )}
          </p>
          <p style={para}>
            {L(
              `Cada tarefa concluída rende uma comida. Alimentar dá energia e pontos de atributo — que definem o galho da evolução — e NÃO cura coração. Até ${FOOD_LIMIT_PER_HOUR} vezes por hora.`,
              `Each completed task yields one food. Feeding grants energy and attribute points — which steer your evolution branch — and does NOT heal hearts. Up to ${FOOD_LIMIT_PER_HOUR} times an hour.`,
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
              `Uma falta não gera nada. Em ${MISS_INTERVENTION_AT} seguidas, o pet oferece uma versão bem menor do hábito — aceitar já conta como feito. E o ícone amadurece até virar árvore em ${M3} dias feitos, rendendo mais atributo.`,
              `One miss does nothing. At ${MISS_INTERVENTION_AT} in a row, your pet offers a much smaller version of the habit — accepting counts as done. And the icon matures into a tree at ${M3} days done, yielding more attribute.`,
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
              `Toda tarefa tem um esforço: Rápida (1), Média (2) ou Projeto (3). A meta soma esforço, não itens — um Projeto vale três Rápidas. Passando de ${OVERCOMMIT_EFFORT} pontos no dia, o pet avisa. É aviso, nunca bloqueio.`,
              `Every task has an effort: Quick (1), Medium (2) or Project (3). The goal adds up effort, not items — one Project is worth three Quick ones. Past ${OVERCOMMIT_EFFORT} points in a day your pet says so. A heads-up, never a block.`,
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
              `Untouched for ${HAUNTED_AFTER_DAYS} days it becomes haunted — and clearing a haunted task grants a relief bonus. Postponed ${POSTPONE_NUDGE_AT} times, your pet offers to split it, shrink it or let it go.`,
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
              `Cada noite na janela ele SONHA, e o sonho é uma cena colecionável dele mesmo — ${DREAM_COUNT} para descobrir. A raridade vem da regularidade, nunca de dormir mais.`,
              `Every night inside the window it DREAMS, and the dream is a collectible scene of itself — ${DREAM_COUNT} to discover. Rarity comes from regularity, never from sleeping longer.`,
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
              'Galhos: Vírus, Dado e Vacina — os requisitos são iguais nos três. No empate decide o seu ritmo de cuidado, e nenhum ritmo é melhor.',
              'Branches: Virus, Data and Vaccine — requirements are identical across all three. Ties are decided by your care rhythm, and no rhythm is better.',
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
              'Masmorra e Torneio nunca cobram corações. Perder custa só a run.',
              'Dungeon and Tournament never cost hearts. Losing only costs the run.',
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

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {chapters.map(ch => {
          const isOpenCh = open === ch.id;
          return (
            <div key={ch.id} style={{ borderTop: '1px solid var(--sm2-line)' }}>
              <button
                type="button"
                onClick={() => setOpen(isOpenCh ? null : ch.id)}
                aria-expanded={isOpenCh}
                aria-controls={`guide-${ch.id}`}
                style={{
                  width: '100%', minHeight: 52, display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 2px', background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'var(--sm2-font-display)',
                  fontSize: 'var(--sm2-text-md)',
                  fontWeight: 600,
                  color: 'var(--sm2-ink)',
                }}
              >
                <span style={{ flex: 1 }}>{ch.title}</span>
                <Icon name={isOpenCh ? 'expand_less' : 'expand_more'} size={24} tone="muted" />
              </button>
              {isOpenCh && (
                <div
                  id={`guide-${ch.id}`}
                  style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 2px 16px' }}
                >
                  {ch.body}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p style={{ ...sm2Hint, borderTop: '1px solid var(--sm2-line)', paddingTop: 16 }}>
        {L('Nos dias em que não der, ele continua aqui.',
           'On the days you can’t, it stays right here.')}
      </p>
    </ModalSheet>
  );
}
