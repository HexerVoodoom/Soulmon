import { useEffect, useState } from 'react';
import { Icon } from './ui/Icon';
import { sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { getLocalizedPrice, isBillingAvailable, useStoreOpen, billingDisabledMessage } from '../utils/playBilling';
import {
  widgetFramePreview, widgetFrameProductId, widgetFrameRows, widgetFrameUnlockHint, type WidgetFramePickerData,
} from '../utils/widgetFrames';
import type { Language } from '../utils/i18n';

/**
 * SELETOR DE MOLDURA DO WIDGET V-PET (dono, 04/11/2026). Mesma peça em dois lugares: aba "Widget" da lojinha de Background
 * (Mercado) e a linha "Moldura do widget" das Configurações. A padrão é grátis e sempre a primeira; as 20 de elemento mostram
 * "Em uso" / "Usar" quando já são do jogador e, quando trancadas, COMO destravar (evoluir para o elemento OU comprar).
 *
 * Compra = dinheiro real pela Play (`moldura_<elemento>`), em dois toques (Comprar -> Confirmar). O preço vem da PRÓPRIA Play
 * (`getLocalizedPrice`): sem plugin (web), loja fechada ou produto ainda não criado no Console, o botão fica "Indisponível" —
 * nunca um preço escrito à mão. A regra de posse e de concessão mora em `utils/widgetFrames.ts` e no servidor.
 */
export function WidgetFramePicker({ language, data }: { language: Language; data: WidgetFramePickerData }) {
  const isPt = language === 'pt-BR';
  const rows = widgetFrameRows(data.owned, data.selected, language);
  const storeOpen = useStoreOpen();
  const [prices, setPrices] = useState<Record<string, string | null>>({});
  const [confirming, setConfirming] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ id: string; msg: string } | null>(null);

  // Preço da Play só das trancadas, uma vez por lista de posse (produto inexistente devolve null = indisponível).
  const lockedKey = rows.filter(r => r.status === 'locked').map(r => r.id).join(',');
  useEffect(() => {
    if (!isBillingAvailable() || !lockedKey) return;
    let alive = true;
    for (const id of lockedKey.split(',')) {
      void getLocalizedPrice(widgetFrameProductId(id)).then(p => { if (alive) setPrices(prev => ({ ...prev, [id]: p })); });
    }
    return () => { alive = false; };
  }, [lockedKey]);

  const buy = async (id: string, name: string) => {
    setConfirming(null);
    setBusy(id);
    setNotice(null);
    const r = await data.onBuy(id);
    setBusy(null);
    if (r.ok) { setNotice({ id, msg: isPt ? `Moldura de ${name} comprada.` : `${name} frame purchased.` }); return; }
    const msg = r.reason === 'cancelled' ? (isPt ? 'Compra cancelada. Nada foi cobrado.' : 'Purchase cancelled. Nothing was charged.')
      : r.reason === 'billing-disabled' ? billingDisabledMessage(isPt)
        : r.reason === 'demo' ? ''
          : (isPt ? 'Não deu para concluir a compra agora.' : "Couldn't complete the purchase right now.");
    if (msg) setNotice({ id, msg });
  };

  const rowBox = { display: 'flex', alignItems: 'center', gap: 10, minHeight: 64, padding: '8px 12px', boxSizing: 'border-box', borderRadius: 'var(--sm2-radius-lg)', border: '1px solid var(--sm2-line)', backgroundColor: 'var(--sm2-surface)' } as const;
  const preview = (id: string | null) => {
    const url = id ? widgetFramePreview(id) : undefined;
    return url
      ? <img src={url} alt="" width={72} height={48} style={{ flex: 'none', objectFit: 'contain', imageRendering: 'pixelated' }} />
      : <span aria-hidden="true" style={{ flex: 'none', width: 72, height: 48, boxSizing: 'border-box', borderRadius: 6, border: '1px dashed var(--sm2-line)' }} />;
  };
  const inUse = (
    <span data-widget-frame-inuse style={{ ...sm2Hint, flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <Icon name="check_circle" size={20} fill={1} tone="primary" />{isPt ? 'Em uso' : 'In use'}
    </span>
  );

  return (
    <div data-widget-frame-picker style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ ...sm2Hint, margin: 0 }}>
        {isPt
          ? 'O casco do widget V-Pet. Cada elemento tem o seu: ele vem sozinho quando o Soulmon evolui para esse elemento, ou dá para comprar antes.'
          : 'The V-Pet widget casing. Each element has its own: it comes free when your Soulmon evolves into that element, or you can buy it early.'}
      </p>

      <div data-widget-frame-item="default" style={rowBox}>
        {preview(null)}
        <span style={{ ...sm2Text, flex: 1, minWidth: 0, fontWeight: 500 }}>{isPt ? 'Padrão' : 'Default'}</span>
        {data.selected === '' ? inUse : (
          <button type="button" data-widget-frame-use="default" style={{ ...sm2Button('outline', false, 'sm'), flex: 'none' }} onClick={() => data.onSelect(null)}>
            {isPt ? 'Usar' : 'Use'}
          </button>
        )}
      </div>

      {rows.map(r => {
        const price = prices[r.id];
        const canBuy = isBillingAvailable() && storeOpen === true && typeof price === 'string' && price !== '';
        return (
          <div key={r.id} data-widget-frame-item={r.id} data-status={r.status} style={{ ...rowBox, ...(r.status === 'locked' ? { borderStyle: 'dashed' } : {}) }}>
            {preview(r.id)}
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ ...sm2Text, fontWeight: 500, overflowWrap: 'anywhere' }}>{r.element}</span>
              {r.status === 'locked' && <span data-widget-frame-hint style={sm2Hint}>{widgetFrameUnlockHint(r.id, language)}</span>}
              {notice?.id === r.id && <span role="status" style={sm2Hint}>{notice.msg}</span>}
            </span>
            {r.status === 'selected' && inUse}
            {r.status === 'owned' && (
              <button type="button" data-widget-frame-use={r.id} style={{ ...sm2Button('outline', false, 'sm'), flex: 'none' }} onClick={() => data.onSelect(r.id)}>
                {isPt ? 'Usar' : 'Use'}
              </button>
            )}
            {r.status === 'locked' && (
              busy === r.id ? (
                <span role="status" style={{ ...sm2Hint, flex: 'none' }}>{isPt ? 'Comprando…' : 'Buying…'}</span>
              ) : confirming === r.id ? (
                <button type="button" data-widget-frame-confirm={r.id} style={{ ...sm2Button('primary', false, 'sm'), flex: 'none' }} onClick={() => { void buy(r.id, r.element); }}>
                  {isPt ? 'Confirmar' : 'Confirm'} · {price}
                </button>
              ) : canBuy ? (
                <button type="button" data-widget-frame-buy={r.id} style={{ ...sm2Button('primary', false, 'sm'), flex: 'none' }}
                  aria-label={isPt ? `Comprar moldura de ${r.element} por ${price}` : `Buy ${r.element} frame for ${price}`}
                  onClick={() => { setNotice(null); setConfirming(r.id); }}>
                  {isPt ? 'Comprar' : 'Buy'} · {price}
                </button>
              ) : (
                <button type="button" data-widget-frame-unavailable={r.id} disabled style={{ ...sm2Button('primary', true, 'sm'), flex: 'none' }}>
                  {isPt ? 'Indisponível' : 'Unavailable'}
                </button>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}
