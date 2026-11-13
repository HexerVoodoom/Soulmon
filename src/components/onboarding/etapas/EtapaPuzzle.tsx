import { useCallback, useRef, useState } from 'react';
import { Match3Game } from '../../Match3Game';
import { GameTutorialFlow } from '../../GameTutorialFlow';
import type { EtapaProps, NovaTarefa } from './tipos';

/** Meta mínima da cena 4 (D13): trocas que formaram linha. Fácil de propósito. */
export const PUZZLE_META_LINHAS = 3;
/** Trocas seguidas sem formar linha até o passo a passo entrar. */
export const PUZZLE_ERROS_PARA_AJUDA = 4;

/** Regra pura: dado o histórico de trocas, onde estamos. */
export function puzzleEstado(prev: { acertos: number; erros: number }, scored: boolean) {
  const acertos = prev.acertos + (scored ? 1 : 0);
  const erros = scored ? 0 : prev.erros + 1;
  return { acertos, erros, meta: acertos >= PUZZLE_META_LINHAS, ajuda: !scored && erros >= PUZZLE_ERROS_PARA_AJUDA };
}

interface Props extends EtapaProps {
  evolutionStage?: string;
  demoCharacterId?: string;
  petName?: string;
  maxActivities?: number;
  /** Se o passo a passo (que cria uma 1ª tarefa) terminar, quem encaixa grava a tarefa. */
  onCreateTask?: (item: NovaTarefa) => void;
}

/** Cena 4, "A parede": Match-3 com meta mínima; errar demais abre o `GameTutorialFlow`. */
export function EtapaPuzzle({ onDone, language = 'pt-BR', evolutionStage = 'bb', demoCharacterId, petName, maxActivities = 3, onCreateTask }: Props) {
  const isPt = language === 'pt-BR';
  const est = useRef({ acertos: 0, erros: 0 });
  const feito = useRef(false);
  const [acertos, setAcertos] = useState(0);
  const [ajuda, setAjuda] = useState(false);
  const [ajudado, setAjudado] = useState(false);

  const onMove = useCallback(({ scored }: { scored: boolean }) => {
    if (feito.current) return;
    const n = puzzleEstado(est.current, scored);
    est.current = { acertos: n.acertos, erros: n.erros };
    setAcertos(n.acertos);
    if (n.meta) { feito.current = true; onDone(); return; }
    if (n.ajuda && !ajudado) { setAjuda(true); setAjudado(true); est.current.erros = 0; }
  }, [onDone, ajudado]);

  return (
    <div data-etapa="puzzle" style={{ position: 'relative', height: '100%' }}>
      <p role="status" data-puzzle-meta style={{ margin: 0, padding: '8px 16px', textAlign: 'center', fontSize: 14 }}>
        {isPt
          ? `A parede cede com linhas de 3. Linhas feitas: ${Math.min(acertos, PUZZLE_META_LINHAS)}/${PUZZLE_META_LINHAS}`
          : `The wall gives way to lines of 3. Lines made: ${Math.min(acertos, PUZZLE_META_LINHAS)}/${PUZZLE_META_LINHAS}`}
      </p>
      <Match3Game language={language} evolutionStage={evolutionStage} demoCharacterId={demoCharacterId} petName={petName}
        onEarnPoints={() => {}} onExit={() => {}} onMove={onMove} />
      {ajuda && (
        <div data-puzzle-ajuda style={{ position: 'fixed', inset: 0, zIndex: 140, background: 'var(--sm2-bg, #0b0f14)', overflow: 'auto' }}>
          <GameTutorialFlow language={language} maxActivities={maxActivities}
            onComplete={(item) => { onCreateTask?.(item); setAjuda(false); }} />
        </div>
      )}
    </div>
  );
}

export default EtapaPuzzle;
