import { useState } from 'react';
import { Icon } from '../ui/Icon';
import { MiniGlass } from '../ui/MiniGlass';
import { AvatarFrame } from '../ui/AvatarFrame';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { FRAMES, type AvatarFrame as FrameDef } from '../../utils/frames';
import type { Language } from '../../utils/i18n';
import type { CurrencyId } from '../../utils/currencies';

/**
 * A prateleira de MOLDURAS do Mercado (C3) — a outra metade da lojinha da Panora. Só as molduras de loja
 * (`origin: 'shop'`, preço em Bits); a aba Honra existe mas hoje vem vazia (nenhuma moldura custa Honra).
 * Compra em dois toques (Comprar -> Confirmar), como o resto do Mercado. A regra é de `utils/frameBuy.ts`.
 */
export function FrameShelf({ language, currency, balance, owned, onBuy }: {
  language: Language;
  currency: CurrencyId;
  balance: number;
  owned: readonly string[];
  /** A compra. Devolve false na recusa. Ausente = a vitrine só mostra. */
  onBuy?: (frameId: string) => boolean;
}) {
  const isPt = language === 'pt-BR';
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [aviso, setAviso] = useState<{ id: string; msg: string } | null>(null);
  const items: FrameDef[] = currency === 'bits' ? FRAMES.filter(f => f.origin === 'shop') : [];

  if (items.length === 0) {
    return <p data-frame-shelf-empty style={{ ...sm2Hint, textAlign: 'center', padding: '16px 0', margin: 0 }}>{isPt ? 'Nenhuma moldura à venda nesta moeda ainda.' : 'No frames for sale in this currency yet.'}</p>;
  }

  return (
    <div data-frame-shelf style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map(f => {
        const name = isPt ? f.namePt : f.nameEn;
        const price = f.price ?? 0;
        const mine = owned.includes(f.id);
        const afford = balance >= price;
        return (
          <div key={f.id} data-frame-item={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 64, padding: '8px 12px', boxSizing: 'border-box', borderRadius: 'var(--sm2-radius-lg)', border: '1px solid var(--sm2-line)', backgroundColor: 'var(--sm2-surface)' }}>
            <MiniGlass size={64}>
              <AvatarFrame frame={f} size={40}><span aria-hidden="true" style={{ display: 'block', width: 40, height: 40 }} /></AvatarFrame>
            </MiniGlass>
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ ...sm2Text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              {aviso?.id === f.id && <span role="status" style={sm2Hint}>{aviso.msg}</span>}
            </span>
            {mine ? (
              <span data-frame-owned style={{ ...sm2Hint, flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <Icon name="check_circle" size={20} fill={1} tone="primary" />
                {isPt ? 'Seu' : 'Yours'}
              </span>
            ) : confirmando === f.id ? (
              <button type="button" data-frame-confirm={f.id} style={{ ...sm2Button('primary', false, 'sm'), flex: 'none' }}
                onClick={() => {
                  setConfirmando(null);
                  const ok = !!onBuy && onBuy(f.id);
                  setAviso({ id: f.id, msg: ok ? (isPt ? `${name} comprada.` : `${name} purchased.`) : (isPt ? `Não deu para comprar ${name} agora.` : `Couldn't buy ${name} right now.`) });
                }}>
                {isPt ? `Confirmar ${price} Bits` : `Confirm ${price} Bits`}
              </button>
            ) : (
              <button type="button" data-frame-buy={f.id} style={{ ...sm2Button('primary', !afford, 'sm'), flex: 'none' }}
                aria-label={isPt ? `Comprar ${name} por ${price} Bits` : `Buy ${name} for ${price} Bits`}
                onClick={() => {
                  if (!afford) { setAviso({ id: f.id, msg: isPt ? 'Faltam Bits. Eles vêm dos minijogos.' : 'Not enough Bits yet. They come from the minigames.' }); return; }
                  setAviso(null);
                  setConfirmando(f.id);
                }}>
                {isPt ? `Comprar · ${price} Bits` : `Buy · ${price} Bits`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
