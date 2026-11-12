import { useEffect, useRef, useState } from 'react';
import { RitualRow } from '../../pixel/RitualPanel';
import { sm2Button } from '../../form/FormKit';
import { CATEGORY_EMOJIS } from '../../../constants/labels';
import { JOURNEY_GLASS } from '../../play/FocusTaskDock';
import { t as tx, UI } from '../sequencia/copy';
import type { EtapaProps, NovaTarefa } from './tipos';

export interface TarefaMin { id: string; name: string; completed: boolean }

interface Props extends EtapaProps {
  /** Tarefas do jogador (o App passa `gameState.tasks`). */
  tasks?: readonly TarefaMin[];
  /** A tarefa que esta intro já escolheu/criou (vem do progresso local). Retomar com ela pronta NUNCA conclui de novo. */
  tarefaId?: string;
  /** Cria a tarefa pelo caminho normal do App e devolve o id. */
  onCreateTask?: (item: NovaTarefa) => string | void;
  /** Conclui pelo caminho normal (`handleToggleTask`). Chamado no máximo UMA vez por tarefa. */
  onCompleteTask?: (id: string) => void;
  /** Avisa a intro para gravar o id da tarefa no progresso. */
  onTarefa?: (id: string) => void;
}

/** Quanto o cartão fica "feito" na tela antes de a cena seguir. */
export const TAREFA_FEITA_MS = 700;

const SUGERIDA = { pt: 'Beber um copo de água', en: 'Drink a glass of water' };

/**
 * Cena 4 (D-07): o ancião pede uma tarefa. O cartão é o DA HOME (`RitualRow`, o mesmo que a sessão do foco
 * usa), sem o assistente do tutorial antigo. Sem tarefa aberta, cria uma sugerida pequena direto.
 * Retomar (§11.1): se o progresso já tem a tarefa e ela já está concluída (ou saiu da lista), a etapa
 * só segue, sem chamar `onCompleteTask` outra vez.
 */
export function EtapaTarefa({ onDone, language = 'pt-BR', tasks = [], tarefaId, onCreateTask, onCompleteTask, onTarefa }: Props) {
  const isPt = language === 'pt-BR';
  const idInicial = useRef(tarefaId);
  const [id, setId] = useState<string | null>(tarefaId ?? null);
  const [feita, setFeita] = useState(false);
  /** A criação não devolveu id (ligação incompleta): o cartão segue sem travar a pessoa. */
  const [semId, setSemId] = useState(false);
  const concluiu = useRef(false);
  const seguiu = useRef(false);
  const seguir = () => { if (!seguiu.current) { seguiu.current = true; onDone(); } };

  const t = id ? tasks.find(x => x.id === id) : undefined;
  const retomadaPronta = !!idInicial.current && (!t || t.completed);

  // Mesmo `id` resolvido uma vez: tarefa aberta do jogador ou a sugerida pequena (sem wizard).
  useEffect(() => {
    if (idInicial.current) return;
    const aberta = tasks.find(x => !x.completed);
    if (aberta) { setId(aberta.id); onTarefa?.(aberta.id); return; }
    const novo = onCreateTask?.({ name: isPt ? SUGERIDA.pt : SUGERIDA.en, category: 'corpo', emoji: CATEGORY_EMOJIS.corpo, kind: 'task' });
    if (typeof novo === 'string') { setId(novo); onTarefa?.(novo); } else setSemId(true);
    // roda uma vez ao montar: a escolha da tarefa não pode mudar sob o jogador
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (retomadaPronta) seguir(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retomadaPronta]);

  useEffect(() => {
    if (!feita) return;
    const timer = setTimeout(seguir, TAREFA_FEITA_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feita]);

  const nome = t?.name ?? (isPt ? SUGERIDA.pt : SUGERIDA.en);
  const concluir = () => {
    if (concluiu.current || (!id && !semId)) return;
    concluiu.current = true;
    if (id) onCompleteTask?.(id);
    setFeita(true);
  };

  return (
    <div data-etapa="tarefa" data-fase={feita ? 'feita' : 'pendente'}
      style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, padding: 16, color: '#f2f2f2', background: 'rgba(0,0,0,.55)' }}>
      <p role="status" aria-live="polite" data-anciao-fala style={{ margin: 0, textAlign: 'center' }}>
        {isPt ? 'Faça agora e marque como feita. Não precisa ser perfeito.' : 'Do it now and mark it done. It does not have to be perfect.'}
      </p>
      <div style={{ ...JOURNEY_GLASS, width: 'min(320px, calc(100% - 24px))', alignSelf: 'center', padding: 4 }}>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          <RitualRow kind="task" name={nome} value={feita ? 1 : 0} max={1} done={feita} onToggle={concluir} language={language}
            toggleLabelPt={`Marcar tarefa como concluída: ${nome}`} toggleLabelEn={`Mark task as completed: ${nome}`} />
        </ul>
      </div>
      <button type="button" data-resp="feito" onClick={concluir} disabled={feita || (!id && !semId)}
        style={{ ...sm2Button('primary', feita || (!id && !semId)), alignSelf: 'center', minHeight: 48, minWidth: 180 }}>
        {tx(UI.jaFiz, language)}
      </button>
    </div>
  );
}

export default EtapaTarefa;
