/**
 * O BOX DA TAREFA NA SESSÃO DO FOCO (11/11/2026; reduzido em 12/11/2026, pedido do dono). Mostra SÓ a tarefa escolhida ao
 * começar a sessão e os subtópicos dela — sem cabeçalho "Tarefas" nem etiqueta "Em foco". Mora na metade de baixo da jornada,
 * acima do aviso "Baú aberto", com a MESMA largura e o MESMO vidro do card do relógio. A altura cresce com o conteúdo até ~1/4
 * da tela, com rolagem interna; a alça (arrastar para cima, ou o botão com a setinha) só aparece quando há subtópicos demais
 * para caber, e cresce até perto do card do relógio; minimizar volta ao padrão.
 * As linhas são as da Home (`RitualRow` + `StepRow`): marcar tarefa/subtópico chama os MESMOS handlers do App
 * (`onToggleTask` → handleToggleTask/handleToggleActivityCompletion; `onToggleStep` → handleToggleTaskStep), sem lógica nova.
 */
import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { RitualRow } from '../pixel/RitualPanel';
import { StepRow } from '../StepRow';
import { Icon } from '../ui/Icon';
import { sm2Hint } from '../form/FormKit';
import { useBackLayer } from '../../utils/backStack';
import type { Language } from '../../utils/i18n';

export const JOURNEY_CARD_WIDTH = 'min(320px, calc(100% - 24px))';
export const JOURNEY_GLASS: CSSProperties = {
  background: 'color-mix(in srgb, var(--sm2-surface) 80%, transparent)', color: 'var(--sm2-ink)', borderRadius: 14, boxShadow: '0 6px 18px rgba(0,0,0,.35)',
};

export type DockTask = { id: string; name: string; completed: boolean; kind?: 'habit'; steps?: Array<{ id: string; label: string; completed: boolean }> };

const GAP_TOP = 12;
const DRAG_PX = 36;
const reduced = (): boolean => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; } };

export function FocusTaskDock({ language, tasks, focusId, onToggleTask, onToggleStep, top, bottom }: {
  language: Language; tasks: readonly DockTask[];
  /** A tarefa escolhida ao começar a sessão (§300): é a ÚNICA que o box mostra, com os subtópicos dela. */
  focusId?: string | null;
  onToggleTask: (id: string) => void; onToggleStep: (taskId: string, stepId: string) => void;
  /** Px do topo da tela até a base do card do relógio. */
  top: number;
  /** CSS da distância da base da tela até a base da lista (acima do aviso do baú e das chaves). */
  bottom: string;
}) {
  const isPt = language === 'pt-BR';
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const [open, setOpen] = useState(true);
  const drag = useRef<{ y: number; moved: boolean } | null>(null);
  const suppress = useRef(false);
  const scroll = useRef<HTMLDivElement>(null);
  useBackLayer(expanded, () => setExpanded(false));

  const t = focusId ? tasks.find(x => x.id === focusId) : undefined;
  const etapas = t?.steps ?? [];
  const isHabit = t?.kind === 'habit';
  const comFilhos = !!t && etapas.length > 0 && !isHabit;
  const feitas = etapas.filter(s => s.completed).length;
  const stepsKey = etapas.map(s => `${s.id}${s.completed ? 1 : 0}`).join(',');
  // A alça só existe se o conteúdo não cabe na altura padrão (ou se já está aumentado, para poder minimizar).
  useLayoutEffect(() => {
    const el = scroll.current;
    if (!el || expanded) return;
    setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [t?.id, stepsKey, open, expanded, t?.completed]);
  const showHandle = overflows || expanded;
  const label = expanded ? (isPt ? 'Minimizar a tarefa' : 'Minimize the task') : (isPt ? 'Aumentar a tarefa' : 'Enlarge the task');
  const maxFull = `calc(100dvh - ${top + GAP_TOP}px - ${bottom})`;
  const maxH = expanded ? maxFull : `min(25dvh, ${maxFull})`;

  const onDown = (e: React.PointerEvent) => { drag.current = { y: e.clientY, moved: false }; try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch { /* sem captura */ } };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d || d.moved) return;
    const dy = d.y - e.clientY;
    if (Math.abs(dy) >= DRAG_PX) { d.moved = true; suppress.current = true; setExpanded(dy > 0); }
  };
  const onUp = () => { drag.current = null; };
  const onClick = () => { if (suppress.current) { suppress.current = false; return; } setExpanded(v => !v); };

  return (
    <section data-focus-dock data-expanded={expanded} aria-label={isPt ? 'Tarefa da sessão' : 'Session task'}
      style={{ ...JOURNEY_GLASS, position: 'absolute', zIndex: 2, left: '50%', transform: 'translateX(-50%)', width: JOURNEY_CARD_WIDTH, bottom, height: expanded ? maxFull : 'auto', maxHeight: maxH, display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: reduced() ? 'none' : 'max-height 200ms ease, height 200ms ease' }}>
      {showHandle && <button type="button" data-focus-dock-handle aria-expanded={expanded} aria-label={label} onClick={onClick}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        style={{ flex: '0 0 auto', minHeight: 44, border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', padding: 0, touchAction: 'none' }}>
        <span aria-hidden="true" style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--sm2-muted)' }} />
        <span style={{ position: 'absolute', right: 8, top: 10, display: 'grid' }}><Icon name={expanded ? 'expand_more' : 'expand_less'} size={24} tone="inherit" /></span>
      </button>}
      <div ref={scroll} data-focus-dock-scroll style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain' }}>
        {!t
          ? <p data-focus-dock-empty style={{ ...sm2Hint, margin: 0, padding: '12px 14px' }}>{isPt ? 'Sem tarefa nesta sessão.' : 'No task in this session.'}</p>
          : <ul className="sm2-ritual-list" style={{ padding: '4px 8px 8px' }}>
            <RitualRow kind={isHabit ? 'habit' : 'task'} name={t.name} value={t.completed ? (etapas.length || 1) : feitas} max={Math.max(1, etapas.length || 1)}
              done={t.completed} onToggle={() => { if (!t.completed) onToggleTask(t.id); }} language={language}
              expandable={comFilhos} expanded={open && !t.completed} onExpand={() => setOpen(o => !o)}
              toggleLabelPt={comFilhos ? `${t.completed ? 'Tarefa concluída' : 'Conclua as etapas'}: ${t.name}` : `${t.completed ? (isHabit ? 'Hábito concluído' : 'Tarefa concluída') : (isHabit ? 'Marcar hábito como feito' : 'Marcar tarefa como concluída')}: ${t.name}`}
              toggleLabelEn={comFilhos ? `${t.completed ? 'Task completed' : 'Complete the steps'}: ${t.name}` : `${t.completed ? (isHabit ? 'Habit done' : 'Task completed') : (isHabit ? 'Mark habit as done' : 'Mark task as completed')}: ${t.name}`}>
              {etapas.map(s => <StepRow key={s.id} id={s.id} label={s.label} completed={s.completed} onToggle={sid => onToggleStep(t.id, sid)} language={language} />)}
            </RitualRow>
          </ul>}
      </div>
    </section>
  );
}
