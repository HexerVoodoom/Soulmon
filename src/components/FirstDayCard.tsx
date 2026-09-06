/**
 * WP1.3 — O CARTÃO DO PRIMEIRO DIA.
 *
 * O tutorial ensinava CONCEITO e obrigava a criar uma atividade. O que ele
 * nunca ensinou foi o que se faz com a criatura: dar carinho, dar comida,
 * marcar algo. Os três gestos existem desde sempre, nenhum é descobrível, e o
 * carinho é a ÚNICA forma de curar coração — quem não descobre o gesto vê o
 * pet perder vida sem ter como responder.
 *
 * Três decisões de forma, e cada uma é uma coisa que o cartão NÃO faz:
 *  · **não dá prêmio.** Se desse item, o convite viraria tarefa, e a primeira
 *    coisa que o app pediria no minuto zero seria dever. O que se ganha é a
 *    criatura reagir — que é o produto inteiro.
 *  · **não abre modal e não intercepta nada.** É um cartão na Home, acima da
 *    lista; a pessoa faz os gestos onde eles moram, no pet.
 *  · **não cobra.** Some sozinho na virada do dia, mesmo incompleto
 *    (`shouldShowFirstDay`). Um checklist que sobrevive ao primeiro dia é uma
 *    lista de pendências, e a pessoa não pediu por uma.
 */
import { sm2Hint, sm2Text } from './form/FormKit';
import { Icon } from './ui/Icon';
import { FIRST_DAY_GESTURES, type FirstDayGesture, type FirstDayProgress } from '../utils/firstDay';
import type { Language } from '../utils/i18n';

interface FirstDayCardProps {
  progress: FirstDayProgress;
  language: Language;
}

const LABELS: Record<FirstDayGesture, { pt: string; en: string }> = {
  pet: { pt: 'Faça carinho nele', en: 'Give them a rub' },
  feed: { pt: 'Dê uma comida', en: 'Feed them once' },
  task: { pt: 'Conclua uma atividade', en: 'Complete one activity' },
};

/** A dica é do GESTO, não da recompensa: o carinho é o único jeito de curar,
 *  e é a coisa que ninguém descobre sozinho num app sem manual. */
const HINTS: Record<FirstDayGesture, { pt: string; en: string }> = {
  pet: { pt: 'Esfregue o dedo nele por uns segundos.', en: 'Rub your finger on them for a few seconds.' },
  feed: { pt: 'A comida vem de concluir atividades.', en: 'Food comes from completing activities.' },
  task: { pt: 'Marque a que estiver mais fácil hoje.', en: 'Check off whichever is easiest today.' },
};

export function FirstDayCard({ progress, language }: FirstDayCardProps) {
  const isPt = language === 'pt-BR';
  const feitos = progress.done.length;

  return (
    <section
      aria-label={isPt ? 'Primeiro dia' : 'First day'}
      style={{
        padding: 14,
        borderRadius: 12,
        border: '1px solid var(--sm2-line)',
        backgroundColor: 'var(--sm2-surface)',
        marginBottom: 12,
      }}
    >
      <p style={{ ...sm2Text, margin: '0 0 2px', fontWeight: 600 }}>
        {isPt ? 'Vocês acabaram de se conhecer' : 'You two just met'}
      </p>
      <p style={{ ...sm2Hint, margin: '0 0 10px' }}>
        {isPt
          ? 'Três coisas que ele adora. Some sozinho no fim do dia.'
          : 'Three things they love. It goes away on its own by the end of the day.'}
      </p>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FIRST_DAY_GESTURES.map(g => {
          const feito = progress.done.includes(g);
          return (
            <li key={g} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              {/* Ícone pelado, sem moldura — a regra vale no app inteiro. */}
              <Icon
                name={feito ? 'check_circle' : 'radio_button_unchecked'}
                size={20}
                tone={feito ? 'primary' : undefined}
                label={feito
                  ? (isPt ? 'feito' : 'done')
                  : (isPt ? 'ainda não' : 'not yet')}
              />
              <span>
                <span style={{
                  ...sm2Text,
                  // Feito fica mais claro, nunca RISCADO: risco é vocabulário
                  // de lista de tarefas, e estes três são convites.
                  opacity: feito ? .55 : 1,
                }}>
                  {isPt ? LABELS[g].pt : LABELS[g].en}
                </span>
                {!feito && (
                  <span style={{ ...sm2Hint, display: 'block' }}>
                    {isPt ? HINTS[g].pt : HINTS[g].en}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      {feitos > 0 && feitos < FIRST_DAY_GESTURES.length && (
        <p style={{ ...sm2Hint, margin: '10px 0 0' }}>
          {isPt ? 'Ele já sentiu.' : 'They already felt it.'}
        </p>
      )}
    </section>
  );
}

export default FirstDayCard;
