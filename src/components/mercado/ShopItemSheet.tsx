import { useEffect, useLayoutEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../ui/Icon';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import type { ShopItem } from '../../utils/shop';
import { PET_BACKGROUNDS } from '../../utils/backgrounds';
import { DECOR_ART } from '../../utils/decorArt';
import { ITEM_ART } from '../../utils/itemArt';
import { decorFitLabel } from '../../utils/decorRules';
import type { Language } from '../../utils/i18n';

/**
 * A FOLHA DO ITEM (I5, 02/10/2026, navegação do dono): tocar num item da
 * lojinha NÃO compra nem equipa direto — sobe esta folhinha com as opções
 * (comprar / equipar) e um PREVIEW GRANDE.
 *
 *  · Peça e item (chip, mobília): o ícone do item aparece GRANDE e solto,
 *    centrado na área escurecida ACIMA da folha — sem o quadradinho do
 *    `MiniGlass` (regra do dono: ícone nunca dentro de box). Mora num portal
 *    em `document.body` (a folha é `position: fixed`) e é decorativo
 *    (`aria-hidden`, sem toque): o nome acessível está no título da folha.
 *  · Cenário: a miniatura vai DENTRO da folha e é um botão — tocar abre o
 *    LIGHTBOX (fundo escurecido, a arte do cenário grande, fecha ao tocar
 *    fora, no ✕ do topo ESQUERDO ou no Esc). O "Equipar" continua no botão.
 *
 * A compra de verdade continua na confirmação existente
 * (`PurchaseConfirmSheet`): o "Comprar" daqui só fecha a folha e a abre.
 */

const FRAME: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12 };

/** Arte do cenário: a pintura (`url(...)`) ou `null` para gradiente puro. */
function paintedUrl(css: string | undefined): string | null {
  const m = css?.match(/url\((['"]?)(.*?)\1\)/);
  return m ? m[2] : null;
}

/** O ícone grande, solto, no centro da área escurecida acima da folha. */
function FloatingPreview({ anchor, item }: { anchor: HTMLElement | null; item: ShopItem }) {
  const [top, setTop] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (!anchor) return;
    const measure = () => {
      const dlg = anchor.closest('[role="dialog"]') as HTMLElement | null;
      setTop(dlg ? dlg.getBoundingClientRect().top : null);
    };
    measure();
    window.addEventListener('resize', measure);
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    const dlg = anchor.closest('[role="dialog"]');
    if (ro && dlg) ro.observe(dlg);
    return () => { window.removeEventListener('resize', measure); ro?.disconnect(); };
  }, [anchor]);

  const png = DECOR_ART[item.id] ?? ITEM_ART[item.icon];
  // Sem medida ainda (1º quadro), reserva ~metade da tela: nunca pisca no topo.
  const area = top ?? Math.round((typeof window !== 'undefined' ? window.innerHeight : 640) * 0.45);
  const size = Math.max(72, Math.min(200, Math.round(area * 0.6)));
  return createPortal(
    <div
      aria-hidden="true"
      data-item-preview
      style={{
        position: 'fixed', left: 0, right: 0, top: 0, height: area, zIndex: 121,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
        paddingTop: 'env(safe-area-inset-top, 0px)', boxSizing: 'border-box',
      }}
    >
      {png
        ? <img src={png} alt="" style={{ height: size, width: 'auto', maxWidth: '78vw', objectFit: 'contain', imageRendering: 'pixelated', filter: 'drop-shadow(0 8px 14px rgba(0,0,0,.55))' }} />
        : <span style={{ fontSize: Math.round(size * 0.7), lineHeight: 1, filter: 'drop-shadow(0 8px 14px rgba(0,0,0,.55))' }}>{item.icon}</span>}
    </div>,
    document.body,
  );
}

/** Visualização AMPLIADA do cenário: fundo escurecido, imagem grande, fecha ao tocar fora. */
export function BackgroundLightbox({ open, bgId, name, language, onClose }: {
  open: boolean; bgId: string; name: string; language: Language; onClose: () => void;
}) {
  const isPt = language === 'pt-BR';
  const ref = useDialogA11y<HTMLDivElement>(open, onClose);
  if (!open) return null;
  const css = PET_BACKGROUNDS[bgId]?.css;
  const src = paintedUrl(css);
  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={name}
      data-bg-lightbox
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 140, background: 'rgba(2,8,9,.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, boxSizing: 'border-box',
      }}
    >
      {/* ✕ no topo ESQUERDO (padrão do app: fechar fica à esquerda, acima do conteúdo). Ícone pelado. */}
      <button
        type="button"
        data-lightbox-close
        onClick={e => { e.stopPropagation(); onClose(); }}
        aria-label={isPt ? 'Fechar' : 'Close'}
        style={{
          position: 'absolute', top: 'calc(env(safe-area-inset-top, 0px) + 8px)', left: 8,
          width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'none', border: 'none', cursor: 'pointer', color: '#E9F5F2',
        }}
      >
        <Icon name="close" size={24} tone="inherit" />
      </button>
      {src
        ? <img data-lightbox-image src={src} alt={name} onClick={e => e.stopPropagation()} style={{ maxWidth: '100%', maxHeight: '82vh', objectFit: 'contain', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,.6)' }} />
        : <div data-lightbox-image role="img" aria-label={name} onClick={e => e.stopPropagation()} style={{ width: 'min(92vw, 420px)', aspectRatio: '9 / 16', maxHeight: '82vh', background: css, borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,.6)' }} />}
    </div>,
    document.body,
  );
}

/** A pílula "interno / externo / qualquer" da decoração (I6). Contraste AA: tinta de token sobre `surface-2`. */
export function DecorFitTag({ fits, isPt }: { fits: ShopItem['fits']; isPt: boolean }) {
  const { fit, text } = decorFitLabel(fits, isPt);
  const ink = fit === 'indoor' ? 'var(--sm2-primary-ink)' : fit === 'outdoor' ? 'var(--sm2-gold-ink)' : 'var(--sm2-ink)';
  return (
    <span
      data-decor-fit={fit}
      style={{
        display: 'inline-flex', alignItems: 'center', alignSelf: 'flex-start', flex: 'none',
        minHeight: 22, padding: '0 8px', borderRadius: 999,
        backgroundColor: 'var(--sm2-surface-2)', color: ink,
        fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-xs)', fontWeight: 600,
        lineHeight: 'var(--sm2-leading-body)', whiteSpace: 'nowrap',
      }}
    >
      {text}
    </span>
  );
}

export function ShopItemSheet({
  item, language, currency, balance, owned, equipped, onClose, onBuy, onEquip, bitsPrice, emblemPrice,
}: {
  item: ShopItem | null;
  language: Language;
  currency: 'bits' | 'emblems';
  balance: number;
  owned: boolean;
  equipped: boolean;
  onClose: () => void;
  /** Sem posse: fecha a folha e segue para a confirmação (ou para o "como conseguir"). */
  onBuy: (item: ShopItem) => void;
  /** Com posse: equipa / tira. */
  onEquip: (item: ShopItem) => void;
  /** O preço desenhado como o card o desenha (mono primary-ink / serifa gold-ink). */
  bitsPrice: (value: number, dim: boolean) => ReactNode;
  emblemPrice: (value: number, dim: boolean) => ReactNode;
}) {
  const isPt = language === 'pt-BR';
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [zoom, setZoom] = useState(false);
  useEffect(() => { if (!item) setZoom(false); }, [item]);
  const open = !!item;
  const name = item ? (isPt ? item.namePt : item.nameEn) : '';
  const isBg = item?.kind === 'bg';
  const isFurniture = item?.kind === 'furniture';
  const affordable = !!item && balance >= item.price;

  const thumbSrc = (() => {
    if (!isBg || !item) return null;
    return paintedUrl(PET_BACKGROUNDS[item.id]?.css);
  })();

  return (
    <>
      <ModalSheet open={open} title={name} onClose={onClose} language={language} maxWidth={420}>
        {item && (
          <div
            data-item-sheet={item.id}
            ref={setAnchorEl}
            style={FRAME}
          >
            {isBg && (
              <button
                type="button"
                data-item-zoom
                onClick={() => setZoom(true)}
                aria-label={isPt ? `Ver ${name} ampliado` : `View ${name} larger`}
                style={{
                  display: 'block', width: '100%', padding: 0, border: 'none', cursor: 'zoom-in',
                  borderRadius: 'var(--sm2-radius-lg)', overflow: 'hidden', background: 'var(--sm2-viewport-bg)',
                  aspectRatio: '96 / 52', position: 'relative',
                }}
              >
                {thumbSrc
                  ? <img src={thumbSrc} alt="" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: PET_BACKGROUNDS[item.id]?.css }} />}
              </button>
            )}
            <p style={{ ...sm2Text, margin: 0 }}>{isPt ? item.descPt : item.descEn}</p>
            {isFurniture && <DecorFitTag fits={item.fits} isPt={isPt} />}
            {!owned && (
              <p style={{ ...sm2Text, margin: 0, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={sm2Hint}>{isPt ? 'Preço' : 'Price'}</span>
                {currency === 'emblems' ? emblemPrice(item.price, !affordable) : bitsPrice(item.price, !affordable)}
              </p>
            )}
            <button
              type="button"
              data-item-primary
              onClick={() => { if (owned) onEquip(item); else onBuy(item); }}
              aria-label={owned ? (equipped ? (isPt ? 'Tirar' : 'Unequip') : (isPt ? 'Equipar' : 'Equip')) : (isPt ? 'Comprar' : 'Buy')}
              style={{ ...sm2Button(owned || affordable ? 'primary' : 'outline'), width: '100%' }}
            >
              {owned ? (equipped ? (isPt ? 'Tirar' : 'Unequip') : (isPt ? 'Equipar' : 'Equip')) : (isPt ? 'Comprar' : 'Buy')}
            </button>
          </div>
        )}
      </ModalSheet>
      {item && !isBg && <FloatingPreview anchor={anchorEl} item={item} />}
      {item && isBg && <BackgroundLightbox open={zoom} bgId={item.id} name={name} language={language} onClose={() => setZoom(false)} />}
    </>
  );
}
