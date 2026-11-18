import { useEffect, useState, type CSSProperties } from 'react';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { BackArrow } from '../ui/BackArrow';
import { CreditIcon } from '../ui/CreditIcon';
import { ElementIcon } from '../ElementBaseSlots';
import { essenceName, ESSENCE_MAX_PER_ELEMENT } from '../../utils/essences';
import { essenceMaxBuy, essencePackPrice, essenceUnitPrice } from '../../utils/essenceShop';
import type { Language } from '../../utils/i18n';

/**
 * CAMBISTA (§479) — confirmação de compra de essência com SELETOR DE QUANTIDADE. Aqui (e só aqui) a pessoa vê
 * "Você tem N"; a lista do Cambista mostra só o item e o preço. O teto é `essenceMaxBuy` (por compra, estoque e saldo);
 * o servidor reconfere tudo e continua dono do preço.
 */
export function EssenceBuySheet({ id, language, credits, owned, busy, onCancel, onConfirm }: {
  /** Elemento da essência; `null` = fechado. */
  id: string | null;
  language: Language;
  credits: number;
  owned: number;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (qty: number) => void;
}) {
  const isPt = language === 'pt-BR';
  const [qty, setQty] = useState(1);
  const [draft, setDraft] = useState<string | null>(null);
  useEffect(() => { setQty(1); setDraft(null); }, [id]);
  const { max, reason } = id ? essenceMaxBuy(id, credits, owned, ESSENCE_MAX_PER_ELEMENT) : { max: 0, reason: 'ok' as const };
  const n = max === 0 ? 0 : Math.min(Math.max(1, qty), max);
  const total = id && n > 0 ? essencePackPrice(id, n) : 0;
  const name = id ? essenceName(id, isPt) : '';
  const credit = (v: number) => (isPt ? (v === 1 ? 'Crédito' : 'Créditos') : (v === 1 ? 'Credit' : 'Credits'));
  const set = (v: number) => { setQty(Math.min(Math.max(1, Math.floor(v) || 1), Math.max(1, max))); setDraft(null); };
  const step: CSSProperties = { ...sm2Button('outline'), minWidth: 48, width: 48, padding: 0, flexShrink: 0 };
  const row: CSSProperties = { ...sm2Text, margin: 0, display: 'flex', justifyContent: 'space-between', gap: 12 };
  const blocked = max === 0;
  const reasonText = reason === 'cap'
    ? (isPt ? 'Estoque cheio' : 'Stock full')
    : (isPt ? 'Créditos insuficientes' : 'Not enough Credits');
  return (
    <ModalSheet open={!!id} title={isPt ? 'Confirmar compra' : 'Confirm purchase'} onClose={onCancel} language={language} maxWidth={420}>
      {id && (
        <div data-essence-buy-sheet style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <BackArrow onClick={onCancel} language={language} style={{ margin: '-8px 0 -4px -10px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <span data-essence-art style={{ display: 'inline-flex' }}><ElementIcon id={id} size={96} /></span>
            <p style={{ ...sm2Text, margin: 0, fontWeight: 500 }}>{name}</p>
            <p style={{ ...sm2Hint, margin: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span>{isPt ? 'Custo unitário' : 'Unit cost'}</span>
              <CreditIcon size={16} />
              <span className="sm2-num" data-essence-unit>{essenceUnitPrice(id)}</span>
            </p>
            <p style={{ ...sm2Hint, margin: 0 }}>
              {isPt ? 'Você tem ' : 'You have '}<span className="sm2-num" data-essence-have>{owned}</span>
            </p>
          </div>
          <div role="group" aria-label={isPt ? 'Quantidade' : 'Quantity'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <button type="button" data-essence-minus aria-label={isPt ? 'Diminuir quantidade' : 'Decrease quantity'} disabled={blocked || n <= 1} onClick={() => set(n - 1)} style={step}>−</button>
            <input
              data-essence-qty
              role="spinbutton"
              type="text"
              inputMode="numeric"
              aria-label={isPt ? 'Quantidade' : 'Quantity'}
              aria-valuemin={blocked ? 0 : 1}
              aria-valuemax={max}
              aria-valuenow={n}
              disabled={blocked}
              value={draft ?? String(n)}
              onChange={e => { const t = e.target.value.replace(/\D/g, '').slice(0, 7); setDraft(t); if (t) setQty(Math.min(Math.max(1, Number(t)), Math.max(1, max))); }}
              onBlur={() => setDraft(null)}
              className="sm2-num"
              style={{ ...sm2Text, width: 72, minHeight: 48, boxSizing: 'border-box', textAlign: 'center', borderRadius: 'var(--sm2-radius-md)', border: '1px solid currentColor', background: 'transparent', color: 'inherit' }}
            />
            <button type="button" data-essence-plus aria-label={isPt ? 'Aumentar quantidade' : 'Increase quantity'} disabled={blocked || n >= max} onClick={() => set(n + 1)} style={step}>+</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <p style={row}><span style={sm2Hint}>{isPt ? 'Custo total' : 'Total cost'}</span><span className="sm2-num" data-essence-total>{total} {credit(total)}</span></p>
            <p style={row}><span style={sm2Hint}>{isPt ? 'Máximo agora' : 'Max now'}</span><span className="sm2-num" data-essence-max>{max}</span></p>
          </div>
          {blocked && <p role="status" data-essence-blocked style={{ ...sm2Hint, margin: 0, textAlign: 'center' }}>{reasonText}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" data-purchase-cancel onClick={onCancel} style={{ ...sm2Button('outline'), flex: 1 }}>{isPt ? 'Cancelar' : 'Cancel'}</button>
            <button type="button" data-purchase-ok disabled={blocked || !!busy} onClick={() => onConfirm(n)} style={{ ...sm2Button('primary', blocked || !!busy), flex: 1 }}>
              {blocked ? reasonText : (isPt ? `Comprar ${n} · ${total} ${credit(total)}` : `Buy ${n} · ${total} ${credit(total)}`)}
            </button>
          </div>
        </div>
      )}
    </ModalSheet>
  );
}
