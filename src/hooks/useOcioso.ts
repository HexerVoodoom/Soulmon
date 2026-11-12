import { useEffect, useState } from 'react';
import { atividadeEmCurso, type MotivoAtividade } from '../utils/atividadeEmCurso';
import { loadTimer } from '../utils/focoTimer';
import { useModalDepth } from '../utils/modalDepth';

/** De quanto em quanto tempo relê o timer de foco enquanto alguém espera o ócio (só o `localStorage`, barato). */
const FOCO_POLL_MS = 2000;

/**
 * O gate OCIOSO reutilizável (12/11/2026): `ocioso` é true quando o jogador NÃO está numa atividade (`utils/atividadeEmCurso.ts`).
 * `esperando` liga a releitura do timer de foco (só há motivo para vigiar quando alguém tem algo pendente); os modais e a view já
 * são reativos. Quem tem uma oferta pendente combina com `useOfertaPendente`.
 */
export function useOcioso(p: { view: string; naMasmorra: boolean; esperando: boolean }): { ocioso: boolean; motivo: MotivoAtividade | null } {
  const modais = useModalDepth();
  const [foco, setFoco] = useState(() => loadTimer());
  useEffect(() => {
    if (!p.esperando) return;
    const ler = () => setFoco(loadTimer());
    ler();
    const t = window.setInterval(ler, FOCO_POLL_MS);
    window.addEventListener('storage', ler);
    return () => { window.clearInterval(t); window.removeEventListener('storage', ler); };
  }, [p.esperando]);
  const motivo = atividadeEmCurso({ view: p.view, naMasmorra: p.naMasmorra, foco, modais });
  return { ocioso: motivo === null, motivo };
}
