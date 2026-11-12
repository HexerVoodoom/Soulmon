import type { CSSProperties } from 'react';
import { Chip, Field, sm2Button, sm2Hint, sm2Label } from '../form/FormKit';
import { Icon } from '../ui/Icon';
import { LIFE_AREA_LABEL, type LifeArea } from '../../types/categories';
import {
  MOTIVE_KEYS, OBSTACLE_KEYS, PURPOSE_GOAL_MAX, PURPOSE_GOAL_MIN, PURPOSE_MOTIVE_CUSTOM_MAX, PURPOSE_PHRASE_MAX, PURPOSE_PLAN_MAX,
  type MotiveKey, type ObstacleKey, type Purpose,
} from '../../utils/purpose';
import { setGoal, setMotive, setPlan } from '../../utils/purpose';
import { MOTIVE_LABEL, OBSTACLE_LABEL, PLAN_SUGGESTIONS, YEAR_EXAMPLES, tx } from '../../utils/purposeCopy';

/**
 * AS PEÇAS DO FORMULÁRIO DO OBJETIVO (E1/E3/E4)
 * =============================================
 *
 * Uma só implementação para os três lugares: os passos do onboarding, o modal
 * do jogador existente e "Meu objetivo" no Perfil. Controlado: quem usa guarda
 * o `PurposeDraft` e o converte em `Purpose` com `applyDraft`. Chunk SEPARADO
 * do de entrada (quem importa isto o faz com `lazy`).
 */

export interface PurposeDraft {
  goalText: string;
  motiveKey?: MotiveKey;
  motiveCustom: string;
  phrase: string;
  obstacleKey?: ObstacleKey;
  obstacleText: string;
  response: string;
}

export const EMPTY_DRAFT: PurposeDraft = { goalText: '', motiveCustom: '', phrase: '', obstacleText: '', response: '' };

export function draftFromPurpose(p: Purpose | undefined): PurposeDraft {
  return {
    goalText: p?.goal?.text ?? '',
    motiveKey: p?.motive?.key,
    motiveCustom: p?.motive?.customText ?? '',
    phrase: p?.motive?.phrase ?? '',
    obstacleKey: p?.plan?.obstacleKey,
    obstacleText: p?.plan?.obstacleText ?? '',
    response: p?.plan?.response ?? '',
  };
}

/** O rascunho vira `Purpose` pelos setters do dono (`utils/purpose.ts`): histórico e âncora ficam lá. */
export function applyDraft(base: Purpose | undefined, d: PurposeDraft, areas: string[], now: Date): Purpose | undefined {
  let p = base;
  if (d.goalText.trim().length >= PURPOSE_GOAL_MIN) p = setGoal(p, { text: d.goalText, areas }, now);
  if (d.motiveKey) {
    p = setMotive(p, {
      key: d.motiveKey,
      ...(d.motiveKey === 'other' && d.motiveCustom.trim() ? { customText: d.motiveCustom } : {}),
      ...(d.phrase.trim() ? { phrase: d.phrase } : {}),
    });
  }
  if (d.obstacleKey && d.response.trim()) {
    p = setPlan(p, { obstacleKey: d.obstacleKey, ...(d.obstacleText.trim() ? { obstacleText: d.obstacleText } : {}), response: d.response });
  } else if (base?.plan && !d.obstacleKey) {
    p = setPlan(p, undefined);
  }
  return p;
}

const row: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 };

interface FieldsProps {
  isPt: boolean;
  draft: PurposeDraft;
  onChange: (next: PurposeDraft) => void;
}

/** Passo "O destino": texto livre (até 200) com exemplos tocáveis por área. */
export function YearGoalFields({ isPt, draft, onChange, areas }: FieldsProps & { areas: string[] }) {
  const examples = areas.flatMap(a => YEAR_EXAMPLES[a] ?? []).slice(0, 4);
  return (
    <div data-purpose-year>
      {areas.length > 0 && (
        <p style={{ ...sm2Hint, margin: '0 0 10px' }}>
          {tx('yearAreasLabel', isPt)}: {areas.map(a => (LIFE_AREA_LABEL[a as LifeArea]?.[isPt ? 'pt' : 'en'] ?? a)).join(', ')}
        </p>
      )}
      <Field id="sm-year-goal" type="text" aria-label={tx('yearTitle', isPt)} value={draft.goalText} maxLength={PURPOSE_GOAL_MAX}
        placeholder={tx('yearPlaceholder', isPt)}
        onChange={e => onChange({ ...draft, goalText: e.target.value })} />
      <p style={{ ...sm2Hint, margin: '4px 0 12px', textAlign: 'right' }} aria-live="polite">
        {draft.goalText.length}/{PURPOSE_GOAL_MAX}
      </p>
      {examples.length > 0 && (
        <>
          <p style={{ ...sm2Hint, margin: '0 0 8px' }}>{tx('yearExamples', isPt)}</p>
          <div style={row}>
            {examples.map((ex, i) => (
              <Chip key={i} selected={false} onToggle={() => onChange({ ...draft, goalText: (isPt ? ex.pt : ex.en).slice(0, PURPOSE_GOAL_MAX) })}>
                {isPt ? ex.pt : ex.en}
              </Chip>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Passo "A motivação": 11 motivos + "outro", 1 principal, e a frase para os dias difíceis. */
export function MotiveFields({ isPt, draft, onChange }: FieldsProps) {
  return (
    <div data-purpose-motive>
      <div role="group" aria-label={tx('motiveTitle', isPt)} style={row}>
        {MOTIVE_KEYS.map(k => (
          <Chip key={k} selected={draft.motiveKey === k} onToggle={() => onChange({ ...draft, motiveKey: draft.motiveKey === k ? undefined : k })}>
            {isPt ? MOTIVE_LABEL[k].pt : MOTIVE_LABEL[k].en}
          </Chip>
        ))}
      </div>
      {draft.motiveKey === 'other' && (
        <div style={{ marginTop: 12 }}>
          <Field type="text" value={draft.motiveCustom} maxLength={PURPOSE_MOTIVE_CUSTOM_MAX}
            aria-label={tx('motiveOtherPlaceholder', isPt)} placeholder={tx('motiveOtherPlaceholder', isPt)}
            onChange={e => onChange({ ...draft, motiveCustom: e.target.value })} />
        </div>
      )}
      <div style={{ marginTop: 18 }}>
        <label htmlFor="sm-purpose-phrase" style={{ ...sm2Hint, display: 'block', margin: '0 0 6px' }}>{tx('phraseLabel', isPt)}</label>
        <Field id="sm-purpose-phrase" type="text" value={draft.phrase} maxLength={PURPOSE_PHRASE_MAX}
          placeholder={tx('phrasePlaceholder', isPt)}
          onChange={e => onChange({ ...draft, phrase: e.target.value })} />
        <p style={{ ...sm2Hint, margin: '4px 0 0', textAlign: 'right' }}>{draft.phrase.length}/{PURPOSE_PHRASE_MAX}</p>
      </div>
    </div>
  );
}

/** Passo "O obstáculo" (pulável): chips + "quando isso acontecer, eu…". */
export function PlanFields({ isPt, draft, onChange }: FieldsProps) {
  return (
    <div data-purpose-plan>
      <div role="group" aria-label={tx('planTitle', isPt)} style={row}>
        {OBSTACLE_KEYS.map(k => (
          <Chip key={k} selected={draft.obstacleKey === k} onToggle={() => onChange({ ...draft, obstacleKey: draft.obstacleKey === k ? undefined : k })}>
            {isPt ? OBSTACLE_LABEL[k].pt : OBSTACLE_LABEL[k].en}
          </Chip>
        ))}
      </div>
      {draft.obstacleKey === 'other' && (
        <div style={{ marginTop: 12 }}>
          <Field type="text" value={draft.obstacleText} maxLength={PURPOSE_PLAN_MAX}
            aria-label={tx('planOtherPlaceholder', isPt)} placeholder={tx('planOtherPlaceholder', isPt)}
            onChange={e => onChange({ ...draft, obstacleText: e.target.value })} />
        </div>
      )}
      {draft.obstacleKey && (
        <div style={{ marginTop: 18 }}>
          <label htmlFor="sm-purpose-response" style={{ ...sm2Label, display: 'block', marginBottom: 6 }}>{tx('planWhen', isPt)}</label>
          <div style={{ ...row, marginBottom: 10 }}>
            {PLAN_SUGGESTIONS.map((s, i) => (
              <Chip key={i} selected={draft.response === (isPt ? s.pt : s.en)} onToggle={() => onChange({ ...draft, response: isPt ? s.pt : s.en })}>
                {isPt ? s.pt : s.en}
              </Chip>
            ))}
          </div>
          <Field id="sm-purpose-response" type="text" value={draft.response} maxLength={PURPOSE_PLAN_MAX}
            placeholder={tx('planResponsePlaceholder', isPt)}
            onChange={e => onChange({ ...draft, response: e.target.value })} />
        </div>
      )}
    </div>
  );
}

/** A estrela de prioridade (alvo de toque 44). */
export function PriorityStar({ isPt, on, onToggle }: { isPt: boolean; on: boolean; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle} aria-pressed={on}
      aria-label={on ? tx('priorityUnstar', isPt) : tx('priorityStar', isPt)}
      data-priority-star
      style={{ minWidth: 44, minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: on ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)' }}>
      <Icon name="star" size={24} fill={on ? 1 : 0} tone="inherit" />
    </button>
  );
}

/** Aviso (não erro) da 4ª prioridade. */
export function PriorityLimitNote({ isPt }: { isPt: boolean }) {
  return <p role="status" style={{ ...sm2Hint, margin: '8px 0 0' }}>{tx('priorityMax', isPt)}</p>;
}

export function ContinueButton({ isPt, onClick, disabled, label }: { isPt: boolean; onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <button type="button" style={{ ...sm2Button('primary', !!disabled), width: '100%', marginTop: 24 }}
      onClick={onClick} aria-disabled={disabled || undefined}>
      {label ?? tx('continue', isPt)}
    </button>
  );
}

export function SkipButton({ isPt, onClick, label }: { isPt: boolean; onClick: () => void; label?: string }) {
  return (
    <button type="button" style={{ ...sm2Button('quiet'), width: '100%', marginTop: 8 }} onClick={onClick}>
      {label ?? tx('skip', isPt)}
    </button>
  );
}
