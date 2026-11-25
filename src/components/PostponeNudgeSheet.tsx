import { useCallback, useEffect, useId, useState } from 'react';
import { Icon } from './ui/Icon';
import type { ActivityCategory } from '../types/attributes';
import type { Language } from '../utils/i18n';
import type { Task } from '../contexts/GameStateContext';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { suggestTasks, type SuggestedTask } from '../utils/taskSuggestions';
import { effortOf } from '../utils/taskTriage';

// O sheet das três saídas da tarefa adiada (encolher, soltar, decompor com IA). Saiu do `App.tsx` para um chunk lazy
// (orçamento de bytes, REGISTRO §499): só monta quando há uma tarefa adiada aberta.

/** Estado da chamada de IA da decomposição. Erro e vazio são estados de
 *  primeira classe: a rede do celular cai, e o sheet não pode virar um spinner
 *  eterno na tela de quem já estava evitando a tarefa. */
type DecomposeState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; items: SuggestedTask[] }
  | { kind: 'empty' }
  | { kind: 'error' };

export function PostponeNudgeSheet({
  task, language, onClose, onShrink, onDrop, onDecompose,
}: {
  task: Task | null;
  language: Language;
  onClose: () => void;
  onShrink: (taskId: string) => void;
  onDrop: (taskId: string) => void;
  onDecompose: (taskId: string, picks: SuggestedTask[]) => void;
}) {
  const isPt = language === 'pt-BR';
  const [state, setState] = useState<DecomposeState>({ kind: 'idle' });
  /* A9 (QA rodada 2): o nome acessível do botão era título + explicação (30
     palavras). O título nomeia (`aria-labelledby`), a explicação descreve
     (`aria-describedby`) — o leitor de tela lê o nome e, só depois, a ajuda. */
  const idBase = useId();
  const ids = {
    decT: `${idBase}-dec-t`, decH: `${idBase}-dec-h`,
    encT: `${idBase}-enc-t`, encH: `${idBase}-enc-h`,
    dxT: `${idBase}-dx-t`, dxH: `${idBase}-dx-h`,
  };
  const [picked, setPicked] = useState<Record<string, boolean>>({});

  // Trocar de tarefa (ou fechar) zera o painel — senão o próximo sheet abriria
  // já com as sugestões da tarefa anterior, que é como se oferece à pessoa um
  // passo que não tem nada a ver com o que ela abriu.
  const taskId = task?.id ?? null;
  useEffect(() => {
    setState({ kind: 'idle' });
    setPicked({});
  }, [taskId]);

  const effort = task ? effortOf(task) : 1;
  const canShrink = effort > 1;

  const runDecompose = useCallback(async () => {
    if (!task) return;
    setState({ kind: 'loading' });
    try {
      const items = await suggestTasks(
        task.name,
        [task.category as ActivityCategory],
        isPt ? 'pt-BR' : 'en-US',
      );
      // `suggestTasks` já engole rede caída / IA fora do ar e devolve []. "Não
      // veio nada" e "quebrou" não são a mesma coisa para o usuário, então
      // 'empty' tem texto próprio e caminho manual em vez de um "erro" — e o
      // catch fica de pé para o que a função não prometeu engolir.
      setState(items.length ? { kind: 'ready', items: items.slice(0, 4) } : { kind: 'empty' });
    } catch {
      setState({ kind: 'error' });
    }
  }, [task, isPt]);

  if (!task) return null;

  const picks = state.kind === 'ready' ? state.items.filter(i => picked[i.name]) : [];

  /* Canvas Atividades `NudgeAdiamento` (D-A5): as três saídas são `outline`
     64 de duas linhas (glifo 24 pelado + título 14/500 + pista 12 `muted`),
     NENHUMA primária — a folha mostra, não decide. Inerte ("Shrink it" no
     esforço 1) = fronteira `line` + tinta `muted`, com o motivo escrito, sem
     `opacity` (Home E7). */
  const opt = (disabled = false): React.CSSProperties => ({
    ...sm2Button('outline', disabled),
    ...(disabled ? { backgroundColor: 'var(--sm2-surface)', border: '1px solid var(--sm2-line)' } : null),
    width: '100%', minHeight: 64, flexDirection: 'column', alignItems: 'flex-start',
    gap: 2, padding: '8px 16px', textAlign: 'left', fontSize: 'var(--sm2-text-sm)',
  });
  const optTitle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 };
  const optHint = (disabled = false): React.CSSProperties => ({ ...sm2Hint, fontWeight: 400, color: disabled ? 'var(--sm2-muted)' : 'var(--sm2-muted)' });

  return (
    <ModalSheet
      open
      moldura="dono"
      fundoVazio
      onClose={onClose}
      language={language}
      title={isPt ? 'Essa aí tá difícil?' : 'Is this one stuck?'}
      maxWidth={480}
    >
      <div className="sm2-nova-corpo">
      <p style={{ ...sm2Text, margin: 0 }}>
        {isPt
          ? `"${task.name}" já foi adiada ${task.postponedCount ?? 0} vezes. Isso é um dado, não uma bronca — e dado tem botão. Escolha uma saída, ou feche: nada acontece se você fechar.`
          : `"${task.name}" has been postponed ${task.postponedCount ?? 0} times. That's data, not a scolding — and data has buttons. Pick a way out, or close: nothing happens if you close.`}
      </p>

      {/* ---- DECOMPOR ---- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          type="button"
          style={{ ...opt(), cursor: state.kind === 'loading' ? 'progress' : 'pointer' }}
          onClick={runDecompose}
          disabled={state.kind === 'loading'}
          aria-busy={state.kind === 'loading' || undefined}
          aria-labelledby={ids.decT}
          aria-describedby={ids.decH}
        >
          <span style={optTitle} id={ids.decT}>
            <Icon name="psychology" size={24} />
            {isPt ? 'Decompor' : 'Break it down'}
          </span>
          <span style={optHint()} id={ids.decH}>
            {isPt
              ? 'O pet pensa em primeiros passos pequenos e você escolhe quais viram tarefa. O nome da tarefa vai para o provedor de IA.'
              : 'Your pet thinks up small first steps and you pick which become tasks. The task name goes to the AI provider.'}
          </span>
        </button>

        {/* Estados da chamada — todos anunciados, nenhum silencioso. */}
        <div aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {state.kind === 'loading' && (
            <span style={sm2Hint}>{isPt ? 'Pensando em passos…' : 'Thinking of steps…'}</span>
          )}

          {state.kind === 'error' && (
            <span style={sm2Hint}>
              {isPt ? 'Não deu pra pensar agora (sem conexão?).' : 'Could not think right now (offline?).'}
            </span>
          )}

          {state.kind === 'empty' && (
            <span style={sm2Hint}>
              {isPt
                ? 'Não achei um passo bom pra essa. Encolher costuma resolver igual — ou deixe pra lá sem culpa.'
                : 'I could not find a good step for this one. Shrinking usually works just as well — or let it go, guilt-free.'}
            </span>
          )}

          {state.kind === 'ready' && (
            <>
              <span style={sm2Hint}>
                {isPt ? 'Toque nos passos que você quer:' : 'Tap the steps you want:'}
              </span>
              {/* Passos sugeridos = linhas de 44 com checkbox 24 (canvas):
                  `role="checkbox"`, a linha inteira é o alvo. */}
              {state.items.map(item => {
                const on = !!picked[item.name];
                return (
                  <button
                    key={item.name}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => setPicked(p => ({ ...p, [item.name]: !p[item.name] }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, minHeight: 44, width: '100%',
                      padding: '0 4px', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 24, height: 24, boxSizing: 'border-box', borderRadius: 'var(--sm2-radius-sm)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `2px solid ${on ? 'var(--sm2-primary-fill)' : 'var(--sm2-muted)'}`,
                        backgroundColor: on ? 'var(--sm2-primary-fill)' : 'transparent',
                        color: 'var(--sm2-on-primary)',
                      }}
                    >
                      {on && <Icon name="check" size={20} fill={1} weight={700} />}
                    </span>
                    <span style={sm2Text}>{item.name}</span>
                  </button>
                );
              })}
              {/* "Add N steps": o único `primary` da folha — há UMA ação;
                  inerte até escolher, rotulado. */}
              <button
                type="button"
                style={{ ...sm2Button('primary', picks.length === 0, 'sm'), alignSelf: 'flex-start' }}
                disabled={picks.length === 0}
                aria-disabled={picks.length === 0 || undefined}
                onClick={() => { onDecompose(task.id, picks); onClose(); }}
              >
                {isPt
                  ? `Adicionar ${picks.length || ''} ${picks.length === 1 ? 'passo' : 'passos'}`.replace('  ', ' ')
                  : `Add ${picks.length || ''} ${picks.length === 1 ? 'step' : 'steps'}`.replace('  ', ' ')}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ---- ENCOLHER ---- */}
      <button
        type="button"
        style={opt(!canShrink)}
        disabled={!canShrink}
        aria-disabled={!canShrink || undefined}
        onClick={() => { onShrink(task.id); onClose(); }}
        aria-labelledby={ids.encT}
        aria-describedby={ids.encH}
      >
        <span style={optTitle} id={ids.encT}>
          <Icon name="do_not_disturb_on" size={24} />
          {isPt ? 'Encolher' : 'Shrink it'}
        </span>
        <span className="sm2-num" style={optHint(!canShrink)} id={ids.encH}>
          {canShrink
            ? (isPt
              ? `esforço ${effort} → ${effort - 1} · zera o contador`
              : `effort ${effort} → ${effort - 1} · resets the counter`)
            : (isPt
              ? 'Já é do tamanho mínimo — não dá pra encolher mais.'
              : 'Already at the smallest size — nothing left to shrink.')}
        </span>
      </button>

      {/* ---- DEIXAR PRA LÁ ---- `archive` (D-A8): `nightlight` é o Someday. */}
      <button
        type="button"
        style={opt()}
        onClick={() => { onDrop(task.id); onClose(); }}
        aria-labelledby={ids.dxT}
        aria-describedby={ids.dxH}
      >
        <span style={optTitle} id={ids.dxT}>
          <Icon name="archive" size={24} />
          {isPt ? 'Deixar pra lá' : 'Let it go'}
        </span>
        <span style={optHint()} id={ids.dxH}>
          {isPt
            ? 'Sai da lista sem ser concluída e sem ser apagada. Fica guardada, e dá pra trazer de volta quando quiser.'
            : 'Leaves the list without being completed and without being deleted. It stays tucked away, and you can bring it back any time.'}
        </span>
      </button>
      </div>
    </ModalSheet>
  );
}
