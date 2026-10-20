import { useEffect, useState, type CSSProperties } from 'react';
import type { Language } from '../../utils/i18n';

/**
 * SAIR DA DEMO — botão fixo no canto inferior esquerdo, só na demo local (pedido do dono, 20/10/2026:
 * "na versão demo tem que ter um botão... no canto esquerdo inferior... sair... volta para o início do
 * aplicativo, aí ele escolhe se quer demo ou login").
 *
 * A saída já existia em Configurações, mas a demo bloqueia `page:settings` (`isDemoBlockedView`), então
 * ninguém chegava nela. Este botão chama o MESMO `leaveDemo` (apaga o save local e volta ao portão).
 *
 * Toque duplo: o 1º toque troca o rótulo por "Tocar de novo para sair" por 3 s; só o 2º sai. A demo
 * guarda progresso só no aparelho, e um toque acidental apagaria tudo sem aviso.
 * Fica acima da barra do chat (que ocupa a base inteira da Home).
 */
const btn: CSSProperties = {
  position: 'fixed', left: 'calc(env(safe-area-inset-left, 0px) + 12px)', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)',
  zIndex: 40, minHeight: 44, padding: '0 var(--sm2-space-3, 12px)', borderRadius: 'var(--sm2-radius-md, 10px)',
  border: '1px solid var(--sm2-line, #2b4a47)', background: 'var(--sm2-surface, #102826)', color: 'var(--sm2-ink, #e8f3f1)',
  fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm, 13px)', fontWeight: 700, cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,.35)',
};

export function DemoExitButton({ language, onLeave }: { language: Language; onLeave: () => void }) {
  const isPt = language === 'pt-BR';
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 3000);
    return () => clearTimeout(t);
  }, [armed]);
  const label = armed ? (isPt ? 'Tocar de novo para sair' : 'Tap again to exit') : (isPt ? 'Sair da demo' : 'Exit demo');
  return (
    <button
      type="button"
      data-demo-exit
      data-armed={armed || undefined}
      aria-label={armed ? label : (isPt ? 'Sair da demo e voltar ao início' : 'Exit the demo and go back to the start')}
      onClick={() => (armed ? onLeave() : setArmed(true))}
      style={armed ? { ...btn, borderColor: 'var(--sm2-gold-ink, #e0b25a)', color: 'var(--sm2-gold-ink, #e0b25a)' } : btn}
    >
      {label}
    </button>
  );
}
