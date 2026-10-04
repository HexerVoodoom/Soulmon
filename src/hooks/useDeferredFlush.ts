import { useCallback, useEffect, useRef } from 'react';

/**
 * Trabalho ADIADO que não pode se perder quando a página some.
 *
 * `defer(fn)` roda `fn` daqui a `delayMs` — como um `setTimeout` — mas também
 * roda NA HORA se a aba for escondida, a página for descarregada ou o dono do
 * hook desmontar antes do prazo. Existe para a conclusão de tarefa avulsa
 * (`App.tsx` › `handleToggleTask`): o toque marca `completed: true` e só 3 s
 * depois `completeTask` move para o histórico e paga comida/Vínculo. Se o app
 * fosse fechado ou o aparelho travasse nesses 3 s, o `setTimeout` morria junto,
 * a tarefa ficava marcada sem nunca ser paga e a virada do dia a reabria
 * (`completed: false`) — o esforço feito sumia sem recompensa.
 *
 * Cada `fn` roda UMA vez (o timer e o flush se excluem).
 */
export function useDeferredFlush(delayMs: number): (fn: () => void) => void {
  const pending = useRef(new Map<number, { timer: ReturnType<typeof setTimeout>; fn: () => void }>());
  const seq = useRef(0);

  const flush = useCallback(() => {
    const itens = [...pending.current.values()];
    pending.current.clear();
    for (const item of itens) {
      clearTimeout(item.timer);
      item.fn();
    }
  }, []);

  useEffect(() => {
    const aoEsconder = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', aoEsconder);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', aoEsconder);
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [flush]);

  return useCallback((fn: () => void) => {
    const id = ++seq.current;
    const timer = setTimeout(() => {
      pending.current.delete(id);
      fn();
    }, delayMs);
    pending.current.set(id, { timer, fn });
  }, [delayMs]);
}
