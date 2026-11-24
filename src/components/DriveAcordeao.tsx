import { useCallback, useId, useState, type ReactNode } from 'react';
import { readLocal, writeLocal } from '../utils/safeStorage';
import { STORAGE_KEYS } from '../utils/storageKeys';

/**
 * ACCORDION DO DRIVE (18/11/2026; extraído em 23/11/2026 para o Bestiário E a Dex de Elementos usarem o MESMO componente).
 * Estado recolhido: lista dos ids FECHADOS no storage; sem storage, tudo aberto.
 */
const ACC_KEY = STORAGE_KEYS.DRIVE_ACORDEAO_FECHADOS;
function lerFechados(): string[] {
  try {
    const v = JSON.parse(readLocal(ACC_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch { return []; }
}

export function useAcordeaoFechados() {
  const [fechados, setFechados] = useState<string[]>(lerFechados);
  const alternar = useCallback((id: string) => setFechados(prev => {
    const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
    writeLocal(ACC_KEY, JSON.stringify(next)); // sem storage: vale só nesta visita
    return next;
  }), []);
  return { fechados, alternar };
}

function Chevron() {
  return (
    <svg className="sm2-acc-chev" viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );
}

/** Seção recolhível: cabeçalho-botão (setinha + nome + contagem, sempre visível) e o corpo em `hidden` quando fechada. */
export function Acordeao({ id, titulo, contagem, aberto, onToggle, children }: { id: string; titulo: string; contagem?: string; aberto: boolean; onToggle: () => void; children: ReactNode }) {
  const corpo = `${useId()}-corpo`;
  return (
    <div data-bestiary-stage={id} data-acc-section={id}>
      <h3 className="sm2-acc-h">
        <button type="button" className="sm2-acc-btn" aria-expanded={aberto} aria-controls={corpo} data-acc-toggle={id} onClick={onToggle}>
          <Chevron />
          <span className="sm2-acc-nome">{titulo}</span>
          {contagem !== undefined && <span className="sm2-acc-cont sm2-num" data-acc-count={id}>{contagem}</span>}
        </button>
      </h3>
      <div id={corpo} hidden={!aberto}>{children}</div>
    </div>
  );
}
