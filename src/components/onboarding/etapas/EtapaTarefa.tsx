import { useState } from 'react';
import { GameTutorialFlow } from '../../GameTutorialFlow';
import { sm2Button } from '../../form/FormKit';
import type { EtapaProps, NovaTarefa } from './tipos';

export interface TarefaMin { id: string; name: string; completed: boolean }

interface Props extends EtapaProps {
  /** Tarefas abertas do jogador (o App passa `gameState.tasks`). */
  tasks?: readonly TarefaMin[];
  maxActivities?: number;
  /** Cria a tarefa pelo caminho normal do App. */
  onCreateTask?: (item: NovaTarefa) => void;
  /** Conclui pelo caminho normal (`handleToggleTask`). */
  onCompleteTask?: (id: string) => void;
}

type Fase = 'criar' | 'pergunta' | 'espera';

/** Cena 6 (D11): o ancião pede uma tarefa real. "Ainda não" = espera sem castigo; "Sim" = conclui e avança. */
export function EtapaTarefa({ onDone, language = 'pt-BR', tasks = [], maxActivities = 3, onCreateTask, onCompleteTask }: Props) {
  const isPt = language === 'pt-BR';
  const aberta = tasks.find(t => !t.completed);
  const [criada, setCriada] = useState<string | null>(null);
  const [fase, setFase] = useState<Fase>(aberta ? 'pergunta' : 'criar');
  const nome = aberta?.name ?? criada ?? '';

  if (fase === 'criar') {
    return (
      <div data-etapa="tarefa" data-fase="criar" style={{ height: '100%', overflow: 'auto' }}>
        <p data-anciao-fala style={{ margin: 0, padding: 16 }}>
          {isPt ? 'Preciso de algo real para nos segurar aqui. Vamos escolher uma tarefa pequena juntos.'
                : 'I need something real to hold us here. Let us pick a small task together.'}
        </p>
        <GameTutorialFlow language={language} maxActivities={maxActivities}
          onComplete={(item) => { onCreateTask?.(item); setCriada(item.name); setFase('pergunta'); }} />
      </div>
    );
  }

  const concluir = () => { if (aberta) onCompleteTask?.(aberta.id); onDone(); };
  const btn = (v: 'primary' | 'outline') => ({ ...sm2Button(v), width: '100%' });

  return (
    <div data-etapa="tarefa" data-fase={fase} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
      {fase === 'pergunta' ? (
        <>
          <p data-anciao-fala style={{ margin: 0 }}>
            {isPt ? `Faça agora: "${nome}". Não precisa ser perfeito.` : `Do it now: "${nome}". It does not have to be perfect.`}
          </p>
          <p style={{ margin: 0, fontWeight: 600 }}>{isPt ? 'Você fez de verdade?' : 'Did you really do it?'}</p>
          <button type="button" data-resp="sim" onClick={concluir} style={btn('primary')}>{isPt ? 'Sim, fiz' : 'Yes, I did'}</button>
          <button type="button" data-resp="nao" onClick={() => setFase('espera')} style={btn('outline')}>{isPt ? 'Ainda não' : 'Not yet'}</button>
        </>
      ) : (
        <>
          <p role="status" data-anciao-fala style={{ margin: 0 }}>
            {isPt ? 'Sem pressa. Vamos juntos, eu faço companhia.' : 'No rush. We go together, I will keep you company.'}
          </p>
          <button type="button" data-resp="voltar" onClick={() => setFase('pergunta')} style={btn('outline')}>
            {isPt ? 'Pronto, já fiz' : 'Done, I did it'}
          </button>
        </>
      )}
    </div>
  );
}

export default EtapaTarefa;
