import { useState, type CSSProperties, type ReactNode } from 'react';
import { Icon } from '../ui/Icon';
import { MiniGlass } from '../ui/MiniGlass';
import { PixelIcon } from '../ui/PixelIcon';
import { STATUS_ICON_ART } from '../../assets/soulmon/icones-ui/interacao';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { PET_BACKGROUNDS } from '../../utils/backgrounds';
import { DECOR_ART } from '../../utils/decorArt';
import { SUBSCRIPTION_ITEMS, type ShopItem } from '../../utils/shop';
import { isShopItemUnlocked } from '../../utils/missions';
import type { Language } from '../../utils/i18n';
import { BackgroundLightbox, ItemLightbox } from './ShopItemSheet';
import { shopTagStyle, type ShopActions, type ShopOwnership } from './ShopShelf';

/**
 * "DO TRIMESTRE" — o conjunto cosmético da assinatura (D10, `docs/ASSINATURA-SPEC.md`).
 *
 * Mesmo molde do cadeado por missão: o item APARECE sempre; sem assinatura vigente
 * fica escurecido e diz o porquê (nunca some em silêncio); com ela, "Resgatar" é
 * de graça — sem preço, sem moeda. Resgatou, é posse: daí em diante a linha vira
 * "Equipar" e continua assim para sempre, assinatura ativa ou não.
 *
 * Sem contagem regressiva, sem "só até", sem preço riscado: o que a pessoa vê é o
 * que o conjunto é e o que fazer para tê-lo.
 */
const GLASS_ITEM = 72;
const GLASS_BG_W = 96;
const GLASS_BG_H = 52;

const row: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 64, padding: '8px 12px',
  textAlign: 'left', boxSizing: 'border-box', borderRadius: 'var(--sm2-radius-lg)',
};
const mainBtn: CSSProperties = { flex: 1, minWidth: 0, alignSelf: 'stretch', display: 'flex', alignItems: 'center', gap: 10, padding: 0, border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit' };

export function SubscriptionShelf({ language, kind, ownership, actions }: {
  language: Language;
  kind: 'bg' | 'furniture';
  ownership: Pick<ShopOwnership, 'ownedBackgrounds' | 'equippedBackground' | 'ownedFurniture' | 'equippedDecor' | 'missionProgress' | 'missionClaimed' | 'subscriptionActive'>;
  actions: Pick<ShopActions, 'onEquip' | 'onEquipFurniture' | 'onClaimSubscription'>;
}) {
  const isPt = language === 'pt-BR';
  const items = SUBSCRIPTION_ITEMS.filter(i => i.kind === kind);
  const [said, setSaid] = useState('');
  /** 8.2 - a miniatura abre a pre-visualizacao (a mesma dos cenarios da loja). */
  const [preview, setPreview] = useState<ShopItem | null>(null);
  if (items.length === 0) return null;

  const active = ownership.subscriptionActive === true;
  const ownedList = kind === 'bg' ? ownership.ownedBackgrounds : ownership.ownedFurniture;

  const claim = (item: ShopItem) => {
    const ok = actions.onClaimSubscription?.(item.id) === true;
    const name = isPt ? item.namePt : item.nameEn;
    setSaid(ok
      ? (isPt ? `${name} é seu agora.` : `${name} is yours now.`)
      : (isPt ? 'Não deu para resgatar agora.' : 'Could not claim it right now.'));
  };

  const art = (item: ShopItem, equipped: boolean, locked: boolean) => {
    const ring: CSSProperties = equipped ? { boxShadow: '0 0 0 2px var(--sm2-primary-ink)' } : {};
    const veil = locked && <span aria-hidden="true" className="sm2-shop-veil" />;
    if (item.kind === 'bg') {
      const bg = PET_BACKGROUNDS[item.id];
      return (
        <MiniGlass size={GLASS_ITEM} style={{ width: GLASS_BG_W, height: GLASS_BG_H, ...ring }}>
          <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: bg && `${bg.css} center bottom / cover no-repeat`, backgroundColor: bg?.baseColor, imageRendering: 'pixelated' }} />
          {veil}
        </MiniGlass>
      );
    }
    const png = DECOR_ART[item.id];
    return (
      <MiniGlass size={GLASS_ITEM} style={ring}>
        {png
          ? <img src={png} alt="" className="sm2-shop-art" style={{ transform: 'translate(-50%, -50%) scale(0.5)' }} />
          : <span aria-hidden="true" style={{ fontSize: 28, lineHeight: 1 }}>{item.icon}</span>}
        {veil}
      </MiniGlass>
    );
  };

  const thumb = (item: ShopItem, node: ReactNode) => (
    <button
      type="button"
      data-thumb-preview={item.id}
      onClick={() => setPreview(item)}
      aria-label={isPt ? `Ver ${item.namePt} ampliado` : `View ${item.nameEn} larger`}
      style={{ flex: 'none', padding: 0, border: 'none', background: 'none', cursor: 'zoom-in', display: 'flex' }}
    >{node}</button>
  );

  const why = isPt
    ? 'Faz parte da assinatura do trimestre. Em Configurações, "Sua conta", você vê como funciona.'
    : 'Part of the quarterly subscription. In Settings, "Your account", you can see how it works.';

  return (
    <section data-subscription-shelf={kind} aria-label={isPt ? 'Do trimestre' : 'Of the quarter'} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <h3 style={{ ...sm2Hint, margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
        {isPt ? 'Do trimestre' : 'Of the quarter'}
      </h3>
      {items.map(item => {
        const name = isPt ? item.namePt : item.nameEn;
        const owned = ownedList.includes(item.id);
        const unlocked = isShopItemUnlocked(item, ownership.missionProgress, active, ownership.missionClaimed);
        const equipped = owned && (item.slot ? ownership.equippedDecor[item.slot] === item.id : ownership.equippedBackground === item.id);

        if (owned) {
          const toggle = () => {
            if (item.slot) actions.onEquipFurniture(equipped ? null : item.id, item.slot);
            else actions.onEquip(equipped ? null : item.id);
          };
          return (
            <div key={item.id} style={{ ...row, border: '1px solid var(--sm2-line)', backgroundColor: 'var(--sm2-surface)' }}>
              {thumb(item, art(item, equipped, false))}
              <button
                type="button" data-subscription-item={item.id} data-state="owned" aria-pressed={equipped}
                aria-label={`${name} — ${equipped ? (isPt ? 'Equipado' : 'Equipped') : (isPt ? 'Equipar' : 'Equip')}`}
                onClick={toggle}
                style={mainBtn}
              >
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ ...sm2Text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                {equipped && (
                  <span style={{ ...shopTagStyle, alignSelf: 'flex-start', color: 'var(--sm2-primary-ink)' }}>
                    <Icon name="check_circle" size={20} fill={1} tone="primary" />
                    {isPt ? 'Equipado' : 'Equipped'}
                  </span>
                )}
              </span>
              {!equipped && <span style={{ ...sm2Button('outline', false, 'sm'), padding: '0 12px', flex: 'none' }}>{isPt ? 'Equipar' : 'Equip'}</span>}
              </button>
            </div>
          );
        }

        if (unlocked) {
          return (
            <div key={item.id} style={{ ...row, border: '1px solid var(--sm2-line)', backgroundColor: 'var(--sm2-surface)' }}>
              {thumb(item, art(item, false, false))}
              <button
                type="button" data-subscription-item={item.id} data-state="claimable"
                aria-label={`${name} — ${isPt ? 'Resgatar' : 'Claim'}`}
                onClick={() => claim(item)}
                style={mainBtn}
              >
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ ...sm2Text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                <span style={sm2Hint}>{isPt ? item.descPt : item.descEn}</span>
              </span>
              <span style={{ ...sm2Button('primary', false, 'sm'), padding: '0 12px', flex: 'none' }}>{isPt ? 'Resgatar' : 'Claim'}</span>
              </button>
            </div>
          );
        }

        // Trancado: escurecido, com o porquê — nunca some em silêncio.
        return (
          <div
            key={item.id} data-subscription-item={item.id} data-state="locked" role="group"
            aria-label={`${name} — ${isPt ? 'bloqueado' : 'locked'}: ${why}`}
            style={{ ...row, border: '1px dashed var(--sm2-muted)', backgroundColor: 'transparent' }}
          >
            {art(item, false, true)}
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ ...sm2Text, fontWeight: 500, color: 'var(--sm2-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
              <span style={sm2Hint}>{why}</span>
            </span>
            <span aria-hidden="true" style={{ ...shopTagStyle, color: 'var(--sm2-muted)' }}>
              <PixelIcon src={STATUS_ICON_ART.cadeado} size={20} />
              {isPt ? 'bloqueado' : 'locked'}
            </span>
          </div>
        );
      })}
      <p aria-live="polite" style={{ ...sm2Hint, margin: 0, minHeight: 18 }}>{said}</p>
      {preview && preview.kind === 'bg' && <BackgroundLightbox open bgId={preview.id} name={isPt ? preview.namePt : preview.nameEn} language={language} onClose={() => setPreview(null)} />}
      {preview && preview.kind !== 'bg' && <ItemLightbox open item={preview} name={isPt ? preview.namePt : preview.nameEn} language={language} onClose={() => setPreview(null)} />}
    </section>
  );
}
