import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { Language } from '../utils/i18n';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { Icon } from './ui/Icon';
import { SM2_SHADOW_SHEET, sm2Button, sm2Hint, sm2TitleStyle } from './form/FormKit';
import {
  effortOf,
  daysStale,
  isOverdue,
  deadlineAt,
  type TriageTask,
} from '../utils/taskTriage';

/**
 * "ARRUMAR A PILHA" — A TRIAGEM EM MASSA
 * ======================================
 *
 * O Smart Schedule do Todoist com ergonomia de jogo: 200 itens vermelhos viram
 * uma sequência de decisões de um clique. Componente puramente apresentacional
 * — a fila já vem pronta de `triageQueue` e quem aplica a ação é o pai.
 *
 * O TOM É A FEATURE. Esta tela existe para DRENAR culpa, não para produzir:
 *
 *  - As quatro saídas têm o mesmo peso visual. "Deixar pra lá" não é o botão
 *    feio do canto — decidir o que NÃO fazer é trabalho real de planejamento, e
 *    é o que mais alivia a mente (Masicampo & Baumeister: o que descarrega a
 *    tensão da tarefa inacabada é o PLANO, não a conclusão).
 *  - Nenhum vermelho de cobrança, nenhum "você está atrasado", nenhum total de
 *    pendências gritando no topo. O contador mostra o que JÁ foi decidido.
 *  - Dá pra sair no meio sem penalidade nenhuma. Uma triagem que só vale se
 *    terminada é mais uma dívida.
 *  - A tela final comemora de verdade. É o oposto exato da falência periódica
 *    (apagar tudo e recomeçar), que é o padrão de uso dominante do mercado.
 *
 * ONDA 5: bottom sheet, porque as quatro decisões são o gesto repetido desta
 * tela e a zona do polegar sai de graça. O que distingue as quatro saídas
 * deixou de ser a cor da moldura (quatro hex sem par por tema, três deles
 * reprovando 3:1 no tema claro) e passou a ser GLIFO + PALAVRA — que funciona
 * também para quem não distingue as cores.
 */

export type TriageAction = 'today' | 'week' | 'someday' | 'drop';

export interface TriagePileProps {
  open: boolean;
  /** A fila, já ordenada (normalmente o retorno de `triageQueue`). */
  tasks: TriageTask[];
  language: Language;
  onResolve: (taskId: string, action: TriageAction) => void;
  onClose: () => void;
}

/** As quatro saídas. Mesma moldura, mesmo tamanho, mesmo peso. */
const ACTIONS: { action: TriageAction; icon: string; pt: string; en: string; hint: { pt: string; en: string } }[] = [
  {
    action: 'today',
    icon: 'today',
    pt: 'Hoje',
    en: 'Today',
    hint: { pt: 'vai pra lista de hoje', en: 'moves to today’s list' },
  },
  {
    action: 'week',
    icon: 'event_repeat',
    pt: 'Esta semana',
    en: 'This week',
    hint: { pt: 'volta nos próximos dias', en: 'comes back in a few days' },
  },
  {
    action: 'someday',
    icon: 'archive',
    pt: 'Algum dia',
    en: 'Someday',
    hint: { pt: 'não cobra, não envelhece', en: 'no nagging, no aging' },
  },
  {
    action: 'drop',
    icon: 'do_not_disturb_on',
    pt: 'Deixar pra lá',
    en: 'Let it go',
    hint: { pt: 'saída digna, com volta atrás', en: 'a dignified exit, undoable' },
  },
];

const hint = sm2Hint;

export function TriagePile({ open, tasks, language, onResolve, onClose }: TriagePileProps) {
  const isPt = language === 'pt-BR';
  // Guardar os ids já decididos (em vez de um índice) faz o componente
  // funcionar tanto se o pai remover a tarefa da lista quanto se ele apenas
  // mudar o status dela e devolver o mesmo array.
  const [resolved, setResolved] = useState<string[]>([]);

  // Trap + Escape + devolução de foco. Sair no meio não tem penalidade (é regra
  // desta tela), então Escape pode simplesmente fechar.
  const dialogRef = useDialogA11y<HTMLDivElement>(open, onClose);

  useEffect(() => {
    if (open) setResolved([]);
  }, [open]);

  const remaining = useMemo(
    () => tasks.filter(t => !resolved.includes(t.id)),
    [tasks, resolved],
  );

  if (!open) return null;

  const total = tasks.length;
  const doneCount = total - remaining.length;
  const current = remaining[0];
  const now = new Date();

  const handle = (action: TriageAction) => {
    if (!current) return;
    onResolve(current.id, action);
    setResolved(prev => (prev.includes(current.id) ? prev : [...prev, current.id]));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(6, 24, 26, .55)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={isPt ? 'Arrumar a pilha' : 'Tidy the pile'}
        style={{
          width: '100%',
          maxWidth: 420,
          maxHeight: '92vh',
          overflow: 'hidden',
          backgroundColor: 'var(--sm2-surface)',
          borderRadius: '20px 20px 0 0',
          boxShadow: SM2_SHADOW_SHEET,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 8px 10px 18px' }}>
          <span className="sm2-title" style={{ ...sm2TitleStyle, flex: 1 }}>
            {isPt ? 'Arrumar a pilha' : 'Tidy the pile'}
          </span>
          {total > 0 && (
            <span style={hint}>
              <span className="sm2-num">{doneCount}</span>
              {isPt ? ' de ' : ' of '}
              <span className="sm2-num">{total}</span>
              {isPt ? ' decididas' : ' decided'}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label={isPt ? 'Fechar' : 'Close'}
            style={{
              width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <Icon name="close" size={24} tone="muted" />
          </button>
        </div>

        {/* Progresso — barra que só enche. Nada aqui mede o tamanho da culpa.
            `role="progressbar"` com rótulo: sem isso a barra era um retângulo
            colorido que só existia para quem enxerga. */}
        {total > 0 && (
          <div
            role="progressbar"
            aria-valuenow={doneCount}
            aria-valuemin={0}
            aria-valuemax={total}
            aria-label={
              isPt
                ? `Triagem: ${doneCount} de ${total} decididas`
                : `Triage: ${doneCount} of ${total} decided`
            }
            style={{ height: 4, background: 'var(--sm2-line)' }}
          >
            <div
              style={{
                height: '100%',
                width: `${total === 0 ? 0 : Math.round((doneCount / total) * 100)}%`,
                background: 'var(--sm2-primary-fill)',
                transition: 'width var(--sm2-dur-enter) var(--sm2-ease)',
              }}
            />
          </div>
        )}

        {/* `aria-live`: a carta troca sozinha a cada decisão, e sem anúncio
            quem não vê a tela decidiria 40 cartas às cegas, sem saber que
            tarefa está na frente nem quanto falta. `polite` porque a troca é
            consequência da própria ação da pessoa — `assertive` interromperia
            o feedback do botão que ela acabou de apertar. */}
        <div aria-live="polite" aria-atomic="false">
          {current ? (
            <TriageCard task={current} now={now} isPt={isPt} onAction={handle} />
          ) : (
            <TriageDone isPt={isPt} decided={doneCount} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}

function TriageCard({
  task,
  now,
  isPt,
  onAction,
}: {
  task: TriageTask;
  now: Date;
  isPt: boolean;
  onAction: (action: TriageAction) => void;
}) {
  const effort = effortOf(task);
  const postponed = task.postponedCount ?? 0;
  const stale = daysStale(task, now);
  const overdue = isOverdue(task, now);
  const due = deadlineAt(task);

  const facts: string[] = [];
  if (overdue && due) {
    facts.push(
      isPt
        ? `venceu em ${due.toLocaleDateString('pt-BR')}`
        : `was due ${due.toLocaleDateString('en-US')}`,
    );
  } else if (stale > 0) {
    facts.push(isPt ? `parada há ${stale} dias` : `idle for ${stale} days`);
  }
  if (postponed >= 1) {
    facts.push(
      isPt
        ? `adiada ${postponed} ${postponed === 1 ? 'vez' : 'vezes'}`
        : `postponed ${postponed}${postponed === 1 ? ' time' : ' times'}`,
    );
  }
  facts.push(isPt ? `esforço ${effort} de 3` : `effort ${effort} of 3`);

  return (
    <div style={{ padding: '16px 18px 20px' }}>
      {/* A carta. Sem vermelho, sem exclamação, sem "atrasada!". Sem moldura
          também: o espaço já separa o nome dos botões, e a posição na fila já
          está no cabeçalho e na barra de progresso. */}
      <p className="sm2-title" style={{ fontSize: 'var(--sm2-text-md)', fontWeight: 600, margin: 0 }}>
        {task.name || (isPt ? 'Tarefa sem nome' : 'Untitled task')}
      </p>
      <p style={{ ...hint, marginTop: 6 }}>{facts.join(' · ')}</p>

      <p style={{ ...hint, margin: '16px 0 10px' }}>
        {isPt
          ? 'Onde ela vive agora? Qualquer resposta serve — inclusive nenhuma.'
          : 'Where does it live now? Any answer works — including none.'}
      </p>

      {/* Quatro ações do MESMO tamanho. Deixar pra lá não é castigo. */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {ACTIONS.map(a => (
          <button
            key={a.action}
            type="button"
            onClick={() => onAction(a.action)}
            style={{
              minHeight: 72,
              padding: '12px 12px',
              borderRadius: 12,
              cursor: 'pointer',
              textAlign: 'left',
              backgroundColor: 'var(--sm2-surface-2)',
              border: '1px solid var(--sm2-line)',
              color: 'var(--sm2-ink)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)', fontWeight: 500,
            }}>
              <Icon name={a.icon} size={20} tone="muted" />
              {isPt ? a.pt : a.en}
            </span>
            <span style={hint}>{isPt ? a.hint.pt : a.hint.en}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TriageDone({ isPt, decided, onClose }: { isPt: boolean; decided: number; onClose: () => void }) {
  const nothingToDo = decided === 0;
  return (
    <div style={{ padding: '24px 20px 24px', textAlign: 'center' }}>
      <Icon name={nothingToDo ? 'spa' : 'auto_awesome'} size={40} fill={1}
        tone={nothingToDo ? 'primary' : 'gold'} />
      <p className="sm2-title" style={{ ...sm2TitleStyle, marginTop: 8 }}>
        {nothingToDo
          ? isPt ? 'A pilha já estava arrumada' : 'The pile was already tidy'
          : isPt ? 'Pilha arrumada!' : 'Pile tidied!'}
      </p>
      <p style={{ ...hint, margin: '10px 0 0' }}>
        {nothingToDo
          ? isPt
            ? 'Nada parado por aqui hoje. Seu Soulmon aproveitou pra cochilar.'
            : 'Nothing stuck here today. Your Soulmon took a nap instead.'
          : isPt
            ? `Você decidiu ${decided} ${decided === 1 ? 'coisa' : 'coisas'}. Decidir o que NÃO fazer é planejamento de verdade — e é isso que tira o peso da cabeça, não a lista vazia.`
            : `You decided on ${decided} ${decided === 1 ? 'item' : 'items'}. Deciding what NOT to do is real planning — and that's what lifts the weight, not an empty list.`}
      </p>
      <button
        type="button"
        onClick={onClose}
        style={{ ...sm2Button('primary'), width: '100%', marginTop: 16 }}
      >
        {isPt ? 'Voltar' : 'Back'}
      </button>
    </div>
  );
}

export default TriagePile;
