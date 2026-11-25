/**
 * PRIORIDADES (12/11/2026, pedido do dono; substitui a matriz de Eisenhower): a lista de TODAS as tarefas abertas, ordenada
 * pela pontuação ICE adaptada (`utils/iceScore.ts`). Tocar numa linha (ou no chip «Classificar») abre uma folha com os quatro
 * seletores de 1 a 5 e a pontuação ao vivo. Só desenha e coleta: a conta e a ordem são puras, e gravar é do App (`onSetIce`).
 * Não muda a ordem da Home.
 */
import { useState } from 'react';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { checkBoxStyle } from '../pixel/RitualPanel';
import type { Language } from '../../utils/i18n';
import { ICE_FIELDS, ICE_MAX, ICE_MIN, formatIceScore, iceScore, sanitizeIce, sortByIce, type Ice, type IceField } from '../../utils/iceScore';

export interface PrioTask { id: string; name: string; completed: boolean; kind?: 'habit'; ice?: Ice }

/** Rótulo curto + o que é 1 e o que é 5 (a legenda que a pessoa lê ao escolher). */
export const ICE_COPY: Record<IceField, { pt: string; en: string; lowPt: string; lowEn: string; highPt: string; highEn: string }> = {
  tempo: { pt: 'Tempo', en: 'Time', lowPt: '1 = rápido', lowEn: '1 = quick', highPt: '5 = demorado', highEn: '5 = long' },
  esforco: { pt: 'Esforço', en: 'Effort', lowPt: '1 = fácil', lowEn: '1 = easy', highPt: '5 = pesado', highEn: '5 = hard' },
  recompensa: { pt: 'Recompensa', en: 'Reward', lowPt: '1 = pouca', lowEn: '1 = little', highPt: '5 = muita', highEn: '5 = a lot' },
  urgencia: { pt: 'Urgência', en: 'Urgency', lowPt: '1 = sem pressa', lowEn: '1 = no rush', highPt: '5 = vence logo', highEn: '5 = due soon' },
};
const NOTAS = [1, 2, 3, 4, 5] as const;
const START: Ice = { tempo: 3, esforco: 3, recompensa: 3, urgencia: 3 };

export function OficinaPrioridades({ language, tasks, onSetIce, onComplete }: {
  language: Language; tasks: readonly PrioTask[];
  onSetIce?: (taskId: string, ice: Ice | null) => void;
  onComplete?: (taskId: string) => void;
}) {
  const isPt = language === 'pt-BR';
  const [editId, setEditId] = useState<string | null>(null);
  /* TODAS as tarefas abertas (hábito não é tarefa: não tem notas). Classificadas por pontuação; as sem nota ficam no fim. */
  const list = sortByIce(tasks.filter(t => !t.completed && t.kind !== 'habit').slice(0, 40));
  const editing = list.find(t => t.id === editId) ?? null;

  return <div data-oficina-prio style={{ display: 'grid', gap: 6 }}>
    <ol data-oficina-prio-list style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
      {list.map(t => {
        const ice = sanitizeIce(t.ice);
        const score = ice ? formatIceScore(iceScore(ice), isPt) : null;
        return <li key={t.id} data-oficina-prio-row={t.id} data-classified={!!ice} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button type="button" role="checkbox" aria-checked={false} aria-label={`${isPt ? 'Concluir' : 'Complete'} ${t.name}`} data-oficina-prio-done={t.id} onClick={() => onComplete?.(t.id)}
            style={{ ...sm2Button('quiet'), minWidth: 44, minHeight: 44, padding: 0, justifyContent: 'center' }}>
            <span aria-hidden="true" style={checkBoxStyle({ checked: false })}></span>
          </button>
          <button type="button" data-oficina-prio-open={t.id} onClick={() => setEditId(t.id)}
            aria-label={`${t.name}. ${ice ? `${isPt ? 'Pontuação' : 'Score'} ${score}` : (isPt ? 'Não classificada' : 'Not rated')}`}
            style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, minHeight: 48, display: 'grid', gap: 4, justifyContent: 'stretch', textAlign: 'left', padding: '6px 10px' }}>
            <span style={{ ...sm2Text, overflowWrap: 'anywhere', display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ flex: 1, minWidth: 0 }}>{t.name}</span>
              {score && <span data-oficina-prio-score className="sm2-num" style={{ ...sm2Hint, margin: 0, fontWeight: 600, color: 'var(--sm2-gold-ink, var(--sm2-ink))' }}>{score}</span>}
            </span>
            <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ice ? ICE_FIELDS.map(f => <span key={f} data-oficina-prio-chip={f} style={{ ...sm2Hint, margin: 0, border: '1px solid var(--sm2-border)', borderRadius: 999, padding: '0 8px', whiteSpace: 'nowrap' }}>{(isPt ? ICE_COPY[f].pt : ICE_COPY[f].en).slice(0, 3)} {ice[f]}</span>)
                : <span data-oficina-prio-classify style={{ ...sm2Hint, margin: 0, border: '1px solid var(--sm2-primary)', color: 'var(--sm2-primary)', borderRadius: 999, padding: '0 10px' }}>{isPt ? 'Classificar' : 'Rate'}</span>}
            </span>
          </button>
        </li>;
      })}
    </ol>
    {editing && <IceSheet key={editing.id} language={language} name={editing.name} initial={sanitizeIce(editing.ice)}
      onClose={() => setEditId(null)} onSave={ice => { onSetIce?.(editing.id, ice); setEditId(null); }} />}
  </div>;
}

/** A folha de classificação: 4 seletores 1–5 (alvos ≥ 44 px, legenda do 1 e do 5) e a pontuação ao vivo. É um `ModalSheet`: cuida de modalDepth e do Voltar. */
export function IceSheet({ language, name, initial, onClose, onSave }: {
  language: Language; name: string; initial?: Ice; onClose: () => void; onSave: (ice: Ice | null) => void;
}) {
  const isPt = language === 'pt-BR';
  const [ice, setIce] = useState<Ice>(initial ?? START);
  const score = formatIceScore(iceScore(ice), isPt);
  return <ModalSheet open moldura="dono" fundoVazio title={isPt ? 'Prioridades' : 'Priorities'} onClose={onClose} language={language}
    footer={<div className="sm2-hex-footer" style={{ display: 'grid', gap: 8 }}>
      <button type="button" data-ice-save onClick={() => onSave(ice)} style={{ ...sm2Button('primary'), minHeight: 48 }}>{isPt ? 'Salvar' : 'Save'}</button>
      {initial && <button type="button" data-ice-clear onClick={() => onSave(null)} style={{ ...sm2Button('quiet'), minHeight: 44 }}>{isPt ? 'Tirar a classificação' : 'Clear rating'}</button>}
    </div>}>
    <div data-ice-sheet className="sm2-nova-corpo" style={{ display: 'grid', gap: 14 }}>
      <p style={{ ...sm2Text, margin: 0, overflowWrap: 'anywhere', fontWeight: 600 }}>{name}</p>
      {ICE_FIELDS.map(f => {
        const c = ICE_COPY[f];
        return <div key={f} data-ice-field={f} style={{ display: 'grid', gap: 4 }}>
          <span id={`ice-${f}`} style={sm2Text}>{isPt ? c.pt : c.en}</span>
          <div role="radiogroup" aria-labelledby={`ice-${f}`} style={{ display: 'grid', gridTemplateColumns: `repeat(${ICE_MAX - ICE_MIN + 1}, minmax(0, 1fr))`, gap: 6 }}>
            {NOTAS.map(n => <button key={n} type="button" role="radio" aria-checked={ice[f] === n} data-ice-pick={`${f}-${n}`} onClick={() => setIce(p => ({ ...p, [f]: n }))}
              style={{ ...sm2Button(ice[f] === n ? 'primary' : 'outline'), minHeight: 48, minWidth: 44, padding: 0, justifyContent: 'center' }}>{n}</button>)}
          </div>
          <span style={{ ...sm2Hint, margin: 0, display: 'flex', justifyContent: 'space-between' }}><span>{isPt ? c.lowPt : c.lowEn}</span><span>{isPt ? c.highPt : c.highEn}</span></span>
        </div>;
      })}
      <p role="status" aria-live="polite" data-ice-score style={{ ...sm2Text, margin: 0 }}>{isPt ? 'Pontuação' : 'Score'}: <strong className="sm2-num">{score}</strong>
        <span style={{ ...sm2Hint, display: 'block', margin: 0 }}>{isPt ? '(Recompensa × Urgência) ÷ (Esforço × Tempo). Quanto maior, mais alto na lista.' : '(Reward × Urgency) ÷ (Effort × Time). The higher, the higher on the list.'}</span></p>
    </div>
  </ModalSheet>;
}
