// ---------------------------------------------------------------------------
// SoulTestItem — uma pergunta do teste de personalidade, uma por página.
//
// O banco tem TRÊS formatos (utils/soulProfile/personality/questions.ts) e
// isso não é enfeite: Likert sozinho é fácil de responder no piloto
// automático, escolha forçada quebra o viés de concordar com tudo, e cenário
// mede o que a pessoa FAZ em vez do que ela diz ser. Este componente é o único
// lugar que sabe desenhar os três — o onboarding e a página do Oráculo usam o
// mesmo, senão os dois divergem e o teste passa a medir coisas diferentes
// dependendo de onde foi respondido.
//
// A escala Likert é 1-5 SEMPRE com os dois extremos rotulados e o meio
// explícito: escala sem rótulo obriga quem responde a adivinhar o que "3"
// significa, e quem adivinha diferente pontua diferente pela mesma intenção.
// ---------------------------------------------------------------------------

import type { LText } from '../utils/oracle';
import type { Answer, Item, LikertValue } from '../utils/soulProfile/personality/types';

const LIKERT_LABELS: Record<'likert' | 'frequency', LText[]> = {
  likert: [
    { pt: 'Discordo totalmente', en: 'Strongly disagree' },
    { pt: 'Discordo', en: 'Disagree' },
    { pt: 'Nem concordo nem discordo', en: 'Neither agree nor disagree' },
    { pt: 'Concordo', en: 'Agree' },
    { pt: 'Concordo totalmente', en: 'Strongly agree' },
  ],
  frequency: [
    { pt: 'Nunca', en: 'Never' },
    { pt: 'Raramente', en: 'Rarely' },
    { pt: 'Às vezes', en: 'Sometimes' },
    { pt: 'Frequentemente', en: 'Often' },
    { pt: 'Quase sempre', en: 'Almost always' },
  ],
};

/** O enunciado do item, seja qual for o formato. */
export function itemPrompt(item: Item): LText {
  if (item.kind === 'forced-choice') return item.prompt;
  if (item.kind === 'scenario') return item.situation;
  return item.text;
}

/** Dica curta de COMO responder — muda com o formato. */
export function itemHint(item: Item, index: number, total: number, isPt: boolean): string {
  const counter = isPt ? `Pergunta ${index + 1} de ${total}` : `Question ${index + 1} of ${total}`;
  if (item.kind === 'forced-choice') {
    return `${counter} · ${isPt ? 'escolha a que mais parece com você' : 'pick the one that sounds more like you'}`;
  }
  if (item.kind === 'scenario') {
    return `${counter} · ${isPt ? 'o que você faria?' : 'what would you do?'}`;
  }
  if (item.kind === 'frequency') {
    return `${counter} · ${isPt ? 'com que frequência?' : 'how often?'}`;
  }
  return `${counter} · ${isPt ? 'o quanto isso combina com você?' : 'how much does this match you?'}`;
}

interface SoulTestItemProps {
  item: Item;
  answer: Answer | undefined;
  onAnswer: (answer: Answer) => void;
  isPt: boolean;
  optionStyle: (selected: boolean) => React.CSSProperties;
  /**
   * Classe do kit aplicada a CADA opção. O onboarding passa `sm-px-choice`, a
   * mesma classe das 6 perguntas do ritual — sem ela as 20 telas seguintes
   * viravam parágrafos centrados sem moldura e ninguém percebia que dava para
   * tocar. A `OraclePage` (ferramenta de criação, tema claro, fora da
   * navegação) não passa nada e segue com o próprio visual inline.
   */
  optionClass?: string;
}

export function SoulTestItem({ item, answer, onAnswer, isPt, optionStyle, optionClass }: SoulTestItemProps) {
  const L = (t: LText) => (isPt ? t.pt : t.en);

  if (item.kind === 'likert' || item.kind === 'frequency') {
    const labels = LIKERT_LABELS[item.kind];
    const current = answer?.kind === 'likert' ? answer.value : null;
    return (
      <div>
        {labels.map((label, i) => {
          const value = (i + 1) as LikertValue;
          return (
            <button
              key={value}
              className={optionClass}
              aria-pressed={current === value}
              style={optionStyle(current === value)}
              onClick={() => onAnswer({ kind: 'likert', value })}
            >
              {L(label)}
            </button>
          );
        })}
      </div>
    );
  }

  if (item.kind === 'forced-choice') {
    const current = answer?.kind === 'forced-choice' ? answer.choice : null;
    return (
      <div>
        {(['a', 'b'] as const).map(choice => (
          <button
            key={choice}
            className={optionClass}
            aria-pressed={current === choice}
            style={optionStyle(current === choice)}
            onClick={() => onAnswer({ kind: 'forced-choice', choice })}
          >
            {L(item[choice].text)}
          </button>
        ))}
      </div>
    );
  }

  if (item.kind !== 'scenario') return null;
  const current = answer?.kind === 'scenario' ? answer.optionId : null;
  return (
    <div>
      {item.options.map(option => (
        <button
          key={option.id}
          className={optionClass}
          aria-pressed={current === option.id}
          style={optionStyle(current === option.id)}
          onClick={() => onAnswer({ kind: 'scenario', optionId: option.id })}
        >
          {L(option.text)}
        </button>
      ))}
    </div>
  );
}
