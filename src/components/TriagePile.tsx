import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import type { Language } from '../utils/i18n';
import { Icon } from './ui/Icon';
import { ModalSheet, SM2_SHADOW_CARD, sm2Button, sm2Hint } from './form/FormKit';
import { PixelSegmentedBar } from './pixel/PixelKit';
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
 * Canvas ATIVIDADES (identidade, `TriagemFila` / `TriagemFim`, DECISÕES §20):
 * folha do sistema (`ModalSheet`, ancorada embaixo — cabe em 844); barra
 * segmentada 96 do DECIDIDO + "N of M decided"; a carta é um card SIS-03; as
 * quatro saídas são `outline` de `min-height` 72 em 2×2 com glifo 24 + palavra
 * + pista — NENHUMA primária (D-A5: a folha mostra, não decide). Someday =
 * `nightlight`, Let it go = `archive`, This week = `calendar_month` (D-A8).
 * A carta vencida diz a DATA, nunca "N days late". No fim, o pet reage num
 * vidro de 96² (D-H7) e o único `primary` é "Back".
 */

export type TriageAction = 'today' | 'week' | 'someday' | 'drop';

export interface TriagePileProps {
  open: boolean;
  /** A fila, já ordenada (normalmente o retorno de `triageQueue`). */
  tasks: TriageTask[];
  language: Language;
  onResolve: (taskId: string, action: TriageAction) => void;
  onClose: () => void;
  /** O sprite do pet para a reação no fim (o mesmo do visor). Sem ele, o
   *  vidro fica vazio — nunca um sprite "genérico" que não é o bicho. */
  petSprite?: string;
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
    icon: 'calendar_month',
    pt: 'Esta semana',
    en: 'This week',
    hint: { pt: 'volta nos próximos dias', en: 'comes back in a few days' },
  },
  {
    action: 'someday',
    icon: 'nightlight',
    pt: 'Algum dia',
    en: 'Someday',
    hint: { pt: 'não cobra, não envelhece', en: 'no nagging, no aging' },
  },
  {
    action: 'drop',
    icon: 'archive',
    pt: 'Deixar pra lá',
    en: 'Let it go',
    hint: { pt: 'saída digna, com volta atrás', en: 'a dignified exit, undoable' },
  },
];

/** O card SIS-03: `surface` + `line` 1px, raio 12, padding 12, sombra curta. */
const card: CSSProperties = {
  backgroundColor: 'var(--sm2-surface)',
  border: '1px solid var(--sm2-line)',
  borderRadius: 'var(--sm2-radius-md)',
  boxShadow: SM2_SHADOW_CARD,
  padding: 12,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const h3: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--sm2-font-display)',
  fontWeight: 500,
  fontSize: 'var(--sm2-text-md)',
  lineHeight: 'var(--sm2-leading-title)',
  color: 'var(--sm2-ink)',
};

export function TriagePile({ open, tasks, language, onResolve, onClose, petSprite }: TriagePileProps) {
  const isPt = language === 'pt-BR';
  // Guardar os ids já decididos (em vez de um índice) faz o componente
  // funcionar tanto se o pai remover a tarefa da lista quanto se ele apenas
  // mudar o status dela e devolver o mesmo array.
  const [resolved, setResolved] = useState<string[]>([]);

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

  const decididas = isPt
    ? `${doneCount} de ${total} decididas`
    : `${doneCount} of ${total} decided`;

  return (
    <ModalSheet open title={isPt ? 'Arrumar a pilha' : 'Tidy the pile'} onClose={onClose} language={language}>
      {/* Progresso — barra que só enche. Nada aqui mede o tamanho da culpa. */}
      {total > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <PixelSegmentedBar
            value={doneCount}
            max={total}
            segments={Math.min(total, 12)}
            height={12}
            label={isPt ? `Triagem: ${decididas}` : `Triage: ${decididas}`}
            style={{ width: 96 }}
          />
          <span style={sm2Hint}>
            <span className="sm2-num">{doneCount}</span>
            {isPt ? ' de ' : ' of '}
            <span className="sm2-num">{total}</span>
            {isPt ? ' decididas' : ' decided'}
          </span>
        </div>
      )}

      {/* `aria-live`: a carta troca sozinha a cada decisão, e sem anúncio
          quem não vê a tela decidiria 40 cartas às cegas. `polite` porque a
          troca é consequência da própria ação da pessoa. */}
      <div aria-live="polite" aria-atomic="false">
        {current ? (
          <TriageCard task={current} now={now} isPt={isPt} onAction={handle} />
        ) : (
          <TriageDone isPt={isPt} decided={doneCount} onClose={onClose} petSprite={petSprite} />
        )}
      </div>
    </ModalSheet>
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
    // A DATA, nunca "N days late": a data é dado, o atraso é veredito.
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
    <div style={card}>
      {/* A carta. Sem vermelho, sem exclamação, sem "atrasada!". */}
      <p style={h3}>{task.name || (isPt ? 'Tarefa sem nome' : 'Untitled task')}</p>
      <p className="sm2-num" style={sm2Hint}>{facts.join(' · ')}</p>

      <p style={{ margin: 0, fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm)', lineHeight: 'var(--sm2-leading-body)', color: 'var(--sm2-muted)' }}>
        {isPt
          ? 'Onde ela vive agora? Qualquer resposta serve — inclusive nenhuma.'
          : 'Where does it live now? Any answer works — including none.'}
      </p>

      {/* Quatro ações do MESMO tamanho, todas `outline` (D-A5). Deixar pra lá
          não é castigo. */}
      <div role="group" aria-label={isPt ? 'Decidir' : 'Decide'} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
        {ACTIONS.map(a => (
          <button
            key={a.action}
            type="button"
            onClick={() => onAction(a.action)}
            aria-label={isPt ? a.pt : a.en}
            style={{
              ...sm2Button('outline'),
              flexDirection: 'column',
              minHeight: 72,
              gap: 2,
              padding: '8px 8px',
              fontSize: 'var(--sm2-text-sm)',
            }}
          >
            <Icon name={a.icon} size={24} />
            <span>{isPt ? a.pt : a.en}</span>
            <span style={{ ...sm2Hint, lineHeight: 1.3, textAlign: 'center' }}>{isPt ? a.hint.pt : a.hint.en}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TriageDone({ isPt, decided, onClose, petSprite }: { isPt: boolean; decided: number; onClose: () => void; petSprite?: string }) {
  const nothingToDo = decided === 0;
  return (
    <div style={{ ...card, alignItems: 'center', textAlign: 'center', padding: '24px 12px' }}>
      {/* A reação do pet = o sprite num vidro de 96² (D-H7): as classes do
          `Viewport` (fundo de visor + reflexo), sem anel — arte pixel dentro
          de uma célula vetor. `aria-hidden`: a frase abaixo é a mensagem. */}
      <span
        className="sm2-viewport-screen"
        aria-hidden="true"
        style={{ width: 96, height: 96, flex: 'none', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position: 'relative', borderRadius: 'var(--sm2-radius-md)', overflow: 'hidden' }}
      >
        {petSprite && (
          <img src={petSprite} alt="" width={64} height={64} style={{ display: 'block', marginBottom: 8, imageRendering: 'pixelated' }} />
        )}
        <span className="sm2-viewport-glass" />
      </span>
      <p style={h3}>
        {nothingToDo
          ? isPt ? 'A pilha já estava arrumada' : 'The pile was already tidy'
          : isPt ? 'Pilha arrumada!' : 'Pile tidied!'}
      </p>
      <p style={sm2Hint}>
        {nothingToDo
          ? isPt
            ? 'Nada parado por aqui hoje. Seu Soulmon aproveitou pra cochilar.'
            : 'Nothing stuck here today. Your Soulmon took a nap instead.'
          : isPt
            ? `Você decidiu ${decided} ${decided === 1 ? 'coisa' : 'coisas'}. Decidir o que NÃO fazer é planejamento de verdade — e é isso que tira o peso da cabeça, não a lista vazia.`
            : `You decided on ${decided} ${decided === 1 ? 'item' : 'items'}. Deciding what NOT to do is real planning — and that's what lifts the weight, not an empty list.`}
      </p>
      {/* O único `primary` da folha: há UMA ação. */}
      <button
        type="button"
        onClick={onClose}
        style={{ ...sm2Button('primary'), width: '100%', marginTop: 8 }}
      >
        {isPt ? 'Voltar' : 'Back'}
      </button>
    </div>
  );
}

export default TriagePile;
