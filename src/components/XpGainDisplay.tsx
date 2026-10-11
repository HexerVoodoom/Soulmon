/**
 * "+N EXP" — display transitório do ganho de XP do Vínculo (pedido do dono,
 * 08/10/2026): entra pela esquerda, para ~1 s no centro e sai pela direita.
 *
 * Superfície TRANSITÓRIA: não é intersticial nem aviso da Home, então NÃO entra
 * em nenhuma das duas filas (`filaDeAvisos.contract.test.ts`). `pointer-events:
 * none` + z-index 90 (acima do conteúdo e da nav, abaixo dos modais z-100+).
 * Monta lazy no App; recebe só `totalXP` e detecta o ganho por comparação
 * (`utils/xpGain.ts` explica por quê). Sem som (R-NOVA), sem campo no save.
 * Ganhos em sequência dentro de XP_COALESCE_MS viram UM display; se chegar
 * outro durante a exibição, entra na fila (um de cada vez).
 */
import { useEffect, useRef, useState } from 'react';
import { xpGainBetween, XP_COALESCE_MS, XP_DISPLAY_TOTAL_MS } from '../utils/xpGain';

interface Props {
  totalXP: number | undefined;
  language: string;
  /** Demo local: ninguém ganha XP. */
  demo?: boolean;
}

export function XpGainDisplay({ totalXP, language, demo = false }: Props) {
  const prev = useRef<number | undefined>(undefined);
  const pending = useRef(0);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queue = useRef<number[]>([]);
  const showing = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);
  const [shown, setShown] = useState<{ n: number; key: number } | null>(null);

  const next = () => {
    const n = queue.current.shift();
    if (n === undefined) { showing.current = false; setShown(null); return; }
    showing.current = true;
    setShown({ n, key: ++seq.current });
    hideTimer.current = setTimeout(next, XP_DISPLAY_TOTAL_MS);
  };

  useEffect(() => {
    const gain = xpGainBetween(prev.current, totalXP, demo);
    prev.current = totalXP;
    if (gain <= 0) return;
    pending.current += gain;
    if (flushTimer.current) return;
    flushTimer.current = setTimeout(() => {
      flushTimer.current = null;
      queue.current.push(pending.current);
      pending.current = 0;
      if (!showing.current) next();
    }, XP_COALESCE_MS);
  }, [totalXP, demo]);

  useEffect(() => () => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const pt = language === 'pt-BR';
  return (
    <div role="status" aria-live="polite" aria-atomic="true" data-xp-gain-region>
      {shown && (
        <>
          <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>
            {pt ? `Ganhou ${shown.n} XP` : `Gained ${shown.n} XP`}
          </span>
          <div key={shown.key} className="sm-xp-gain" aria-hidden="true" data-xp-gain>
            +{shown.n} EXP
          </div>
        </>
      )}
    </div>
  );
}
