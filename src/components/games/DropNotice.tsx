import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { sm2Button, sm2Text, SM2_SHADOW_CARD } from '../form/FormKit';
import { ITEM_ART } from '../../utils/itemArt';
import { HEART_ITEM_EMOJI, GLITCHTAMA_EMOJI, SPARK_ITEM_EMOJI } from '../../utils/shop';
import { loadEquipArt } from '../../utils/equipArt';
import { dropName, dropTitle, type DropGroup, type DropKind } from '../../utils/dungeonDrops';

/**
 * O MODALZINHO DE DROP da Masmorra (pedido do dono, 11/10/2026 — REGISTRO §36): ícone do item + nome + quantidade.
 *
 * Fica FORA do `ModalSheet` de propósito: aquele é uma folha de baixo que INERTIZA o resto (`useDialogA11y`) e não fecha
 * pelo véu — aqui a luta continua rodando por trás (o aviso nunca pausa nada) e o botão de avanço rápido precisa seguir à
 * mão. Mesmos tokens do kit (`sm2-surface`, `SM2_SHADOW_CARD`, `sm2Button`). Fecha por toque no véu, no cartão, no "OK",
 * por Esc ou sozinho (`DROP_AUTOCLOSE_MS` ÷ velocidade). Sem som, sem tremida (R-NOVA); movimento reduzido: sem animação.
 */
export const DROP_AUTOCLOSE_MS = 3500;

const ICON_PX = 48;
const pixel: CSSProperties = { width: ICON_PX, height: ICON_PX, objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 };

function DropIcon({ kind }: { kind: DropKind }) {
  const [frag, setFrag] = useState<string | null>(null);
  useEffect(() => {
    if (kind !== 'fragments') return undefined;
    let vivo = true;
    void loadEquipArt('fragmento').then(u => { if (vivo) setFrag(u); });
    return () => { vivo = false; };
  }, [kind]);
  const src = kind === 'heart' ? ITEM_ART[HEART_ITEM_EMOJI] : kind === 'glitchtama' ? ITEM_ART[GLITCHTAMA_EMOJI] : kind === 'spark' ? ITEM_ART[SPARK_ITEM_EMOJI] : frag;
  if (!src) return <span aria-hidden="true" style={pixel} />; // a arte do fragmento carrega sob demanda: o espaço fica reservado
  return <img src={src} alt="" width={ICON_PX} height={ICON_PX} style={pixel} data-drop-icon={kind} />;
}

export function DropNotice({ group, isPt, speed, onClose }: { group: DropGroup; isPt: boolean; speed: number; onClose: () => void }) {
  // o relógio de fechar reinicia quando o grupo muda (id novo) ou a velocidade muda
  useEffect(() => {
    const t = setTimeout(onClose, DROP_AUTOCLOSE_MS / Math.max(1, speed));
    return () => clearTimeout(t);
  }, [group.id, speed, onClose]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  const title = dropTitle(group.lines, isPt);
  return (
    <div
      data-drop-notice
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, boxSizing: 'border-box', backgroundColor: 'rgba(4, 18, 20, .38)' }}
    >
      <div
        role="dialog"
        aria-modal="false"
        aria-label={`${title}: ${group.lines.map(l => `${l.qty} ${dropName(l.kind, isPt)}`).join(', ')}`}
        onClick={onClose}
        style={{ width: 'min(86vw, 300px)', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 12, padding: 16, backgroundColor: 'var(--sm2-surface)', border: '1px solid var(--sm2-line)', borderRadius: 'var(--sm2-radius-md)', boxShadow: SM2_SHADOW_CARD }}
      >
        <p style={{ ...sm2Text, margin: 0, textAlign: 'center', color: 'var(--sm2-muted)' }}>{title}</p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {group.lines.map(l => (
            <li key={l.kind} data-drop-line={l.kind} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <DropIcon kind={l.kind} />
              <span style={{ ...sm2Text, flex: 1, minWidth: 0, fontWeight: 500 }}>{dropName(l.kind, isPt)}</span>
              <span className="sm2-num" style={{ ...sm2Text, fontWeight: 600 }}>×{l.qty}</span>
            </li>
          ))}
        </ul>
        <button type="button" onClick={(e) => { e.stopPropagation(); onClose(); }} style={{ ...sm2Button('outline'), width: '100%' }}>
          OK
        </button>
      </div>
    </div>
  );
}
