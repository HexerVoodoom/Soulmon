import { Component, Suspense, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { reportCrash } from '../utils/crashReport';

/** Tempo máximo esperando o pedaço (chunk) de um item carregar antes de pular ele e deixar a fila andar. */
export const PRESENTATION_LOAD_TIMEOUT_MS = 8000;

/**
 * A MOLDURA DE CADA ITEM DA FILA (`utils/presentationQueue.ts`). Uma fila só é segura se nenhum item consegue
 * travá-la, e há dois jeitos de um intersticial travar tudo: lançar no render (a árvore inteira cairia na tela de
 * erro, ou o véu ficaria sem conteúdo) e nunca terminar de carregar (chunk lazy numa rede ruim: o esqueleto fica
 * para sempre na frente do app). Aqui os dois viram `onFail` — a fila pula o item e entra o próximo.
 */
export function PresentationSlot({ id, onFail, fallback = null, children }: {
  id: string;
  onFail: () => void;
  fallback?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SlotBoundary id={id} onFail={onFail}>
      <Suspense fallback={<LoadWatchdog onTimeout={onFail}>{fallback}</LoadWatchdog>}>
        {children}
      </Suspense>
    </SlotBoundary>
  );
}

function LoadWatchdog({ onTimeout, children }: { onTimeout: () => void; children: ReactNode }) {
  useEffect(() => {
    const t = setTimeout(onTimeout, PRESENTATION_LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [onTimeout]);
  return <>{children}</>;
}

class SlotBoundary extends Component<{ id: string; onFail: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, _info?: ErrorInfo) {
    try { reportCrash('boundary', error); } catch { /* o relatório nunca derruba */ }
    // Fora do render: avisa a fila na sequência, quando o React já terminou de reconciliar.
    queueMicrotask(() => { try { this.props.onFail(); } catch { /* idem */ } });
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
