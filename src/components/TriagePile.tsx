import { useEffect, useMemo, useState } from 'react';
import type { Language } from '../utils/i18n';
import iconClose from '../assets/soulmon/icons/icon-close.png';
import { useDialogA11y } from '../hooks/useDialogA11y';
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

/**
 * As quatro saídas. `ink` desenha a BORDA de 2px de cada botão — borda é objeto
 * gráfico e precisa de 3:1 (WCAG 1.4.11).
 *
 * Os quatro valores eram hex/token cru sem par por tema e mediam, no tema
 * claro, 2,92 / 2,11 / 1,31 / 4,87. Só o último passava. Trocados por tokens
 * COM par por tema (`index.css`, bloco "tinta com par por tema"): a única coisa
 * que distingue os quatro botões é a cor da moldura, então uma moldura que some
 * no branco apaga a distinção inteira.
 */
const ACTIONS: { action: TriageAction; pt: string; en: string; ink: string; hint: { pt: string; en: string } }[] = [
  {
    action: 'today',
    pt: 'Hoje',
    en: 'Today',
    ink: 'var(--sm-ok-ink)',
    hint: { pt: 'vai pra lista de hoje', en: 'moves to today’s list' },
  },
  {
    action: 'week',
    pt: 'Esta semana',
    en: 'This week',
    ink: 'var(--sm-px-cyan-ink)',
    hint: { pt: 'volta a aparecer nos próximos dias', en: 'comes back in the next few days' },
  },
  {
    action: 'someday',
    pt: 'Algum dia',
    en: 'Someday',
    ink: 'var(--sm-gold)',
    hint: { pt: 'lista inerte: não cobra, não envelhece', en: 'inert list: no nagging, no aging' },
  },
  {
    action: 'drop',
    pt: 'Deixar pra lá',
    en: 'Let it go',
    ink: 'var(--sm-muted)',
    hint: { pt: 'saída digna, com volta atrás', en: 'a dignified exit, undoable' },
  },
];

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
      role="dialog"
      aria-modal="true"
      aria-label={isPt ? 'Arrumar a pilha' : 'Tidy the pile'}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(6, 24, 26, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div ref={dialogRef} className="sm-card" style={{ width: '100%', maxWidth: 380, padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: '14px 16px',
            background: 'var(--sm-surface)',
            borderBottom: '1px solid var(--sm-line)',
          }}
        >
          <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--sm-ink)' }}>
            {isPt ? 'Arrumar a pilha' : 'Tidy the pile'}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {total > 0 && (
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--sm-muted)' }}>
                {isPt ? `${doneCount} de ${total} decididas` : `${doneCount} of ${total} decided`}
              </span>
            )}
            <button
              onClick={onClose}
              aria-label={isPt ? 'Fechar' : 'Close'}
              style={{
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <img
                src={iconClose}
                alt=""
                width={18}
                height={18}
                style={{ objectFit: 'contain', imageRendering: 'pixelated' }}
              />
            </button>
          </div>
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
            style={{ height: 4, background: 'var(--sm-line)' }}
          >
            <div
              style={{
                height: '100%',
                width: `${total === 0 ? 0 : Math.round((doneCount / total) * 100)}%`,
                background: 'var(--sm-px-cyan-ink)',
                transition: 'width .2s ease',
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
            <TriageCard
              task={current}
              now={now}
              isPt={isPt}
              onAction={handle}
              position={doneCount + 1}
              total={total}
            />
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
  position,
  total,
}: {
  task: TriageTask;
  now: Date;
  isPt: boolean;
  onAction: (action: TriageAction) => void;
  /** 1-based: a carta que está na frente da fila agora. */
  position: number;
  total: number;
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
  facts.push(
    isPt ? `esforço ${effort} de 3` : `effort ${effort} of 3`,
  );

  return (
    <div style={{ padding: '18px 16px 16px' }}>
      {/* A carta. Sem vermelho, sem exclamação, sem "atrasada!". */}
      <div
        style={{
          padding: '16px 14px',
          backgroundColor: 'var(--sm-surface)',
          border: '1px solid color-mix(in srgb, var(--sm-px-copper-ink) 45%, transparent)',
          marginBottom: 14,
        }}
      >
        {/* A posição na fila é a informação que o olho pega da barra de cima e
            que o leitor de tela não tinha de jeito nenhum. */}
        <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--sm-muted)', fontWeight: 700 }}>
          {isPt ? `Carta ${position} de ${total}` : `Card ${position} of ${total}`}
        </p>
        <p
          className="sm-display"
          style={{ fontSize: '0.95rem', margin: 0, color: 'var(--sm-ink)', lineHeight: 1.35 }}
        >
          {task.name || (isPt ? 'Tarefa sem nome' : 'Untitled task')}
        </p>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--sm-muted)', lineHeight: 1.5 }}>
          {facts.join(' · ')}
        </p>
      </div>

      <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--sm-muted)', lineHeight: 1.5 }}>
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
            title={isPt ? a.hint.pt : a.hint.en}
            style={{
              minHeight: 64,
              padding: '10px 8px',
              cursor: 'pointer',
              textAlign: 'left',
              backgroundColor: 'var(--sm-bg)',
              border: `2px solid ${a.ink}`,
              color: 'var(--sm-ink)',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 13.5, fontWeight: 800 }}>{isPt ? a.pt : a.en}</span>
            <span style={{ fontSize: 12, color: 'var(--sm-muted)', lineHeight: 1.35 }}>
              {isPt ? a.hint.pt : a.hint.en}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TriageDone({ isPt, decided, onClose }: { isPt: boolean; decided: number; onClose: () => void }) {
  const nothingToDo = decided === 0;
  return (
    <div style={{ padding: '28px 20px 22px', textAlign: 'center' }}>
      <p aria-hidden="true" style={{ fontSize: 40, lineHeight: 1, margin: '0 0 10px' }}>
        {nothingToDo ? '🌿' : '🎉'}
      </p>
      <p
        className="sm-display"
        style={{ fontSize: '1rem', margin: 0, color: 'var(--sm-ink)', WebkitTextStroke: '1px var(--sm-ink)' }}
      >
        {nothingToDo
          ? isPt ? 'A pilha já estava arrumada' : 'The pile was already tidy'
          : isPt ? 'Pilha arrumada!' : 'Pile tidied!'}
      </p>
      <p style={{ fontSize: 12.5, color: 'var(--sm-muted)', lineHeight: 1.55, margin: '10px 0 0' }}>
        {nothingToDo
          ? isPt
            ? 'Nada parado por aqui hoje. Seu Soulmon aproveitou pra cochilar.'
            : 'Nothing stuck here today. Your Soulmon took a nap instead.'
          : isPt
            ? `Você decidiu ${decided} ${decided === 1 ? 'coisa' : 'coisas'}. Decidir o que NÃO fazer é planejamento de verdade — e é isso que tira o peso da cabeça, não a lista vazia.`
            : `You decided on ${decided} ${decided === 1 ? 'item' : 'items'}. Deciding what NOT to do is real planning — and that's what lifts the weight, not an empty list.`}
      </p>
      <button onClick={onClose} className="sm-btn" style={{ width: '100%', marginTop: 16 }}>
        {isPt ? 'Voltar' : 'Back'}
      </button>
    </div>
  );
}

export default TriagePile;
