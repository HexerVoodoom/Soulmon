import { useState, type CSSProperties } from 'react';
import { Icon } from '../ui/Icon';
import { MiniGlass } from '../ui/MiniGlass';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { PET_BACKGROUNDS, isGuildSceneRetired } from '../../utils/backgrounds';
import { DECOR_ART } from '../../utils/decorArt';
import { ALL_SHOP_ITEMS, isGuildReward } from '../../utils/shop';
import { GROVE_STAGES, type GroveStageId } from '../../utils/guildRules';
import { guildText, groveStageName } from '../../utils/guildCopy';
import type { Language } from '../../utils/i18n';
import { BackgroundLightbox, ItemLightbox } from './ShopItemSheet';
import { shopTagStyle, type ShopActions, type ShopOwnership } from './ShopShelf';

/**
 * "DA SUA RODA" — o que a Guilda deu e NÃO se compra (`docs/PLANO-GUILDA.md` §3,
 * risco 1 da B1): os cenários `bg-guild-<estágio>` (entram em `ownedBackgrounds`
 * quando `mine.groveScenes`) e a Concha da Maré (`trophy-concha-mare`, em
 * `ownedFurniture` pelo resgate da Feira). A vitrine só lista o catálogo, e um
 * item que só está na lista de posse ficava INVISÍVEL: a frase
 * `guild.marco.cenario` ("Está entre os seus cenários") prometia o que a tela não
 * entregava.
 *
 * Aqui só se EQUIPA. Sem preço, sem "comprar", sem cadeado e sem contagem do que
 * falta: quem não tem nada não vê a seção nem o título (vazio é SILÊNCIO). A
 * posse é do save e fica com quem sai da roda (G12) — esta lista não lê a guilda.
 */
const GLASS_ITEM = 72;
const GLASS_BG_W = 96;
const GLASS_BG_H = 52;

const row: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, width: '100%', minHeight: 64, padding: '8px 12px',
  textAlign: 'left', boxSizing: 'border-box', borderRadius: 'var(--sm2-radius-lg)',
  border: '1px solid var(--sm2-line)', backgroundColor: 'var(--sm2-surface)',
};
const thumbBtn: CSSProperties = { flex: 'none', padding: 0, border: 'none', background: 'none', cursor: 'zoom-in', display: 'flex' };
const mainBtn: CSSProperties = { flex: 1, minWidth: 0, alignSelf: 'stretch', display: 'flex', alignItems: 'center', gap: 10, padding: 0, border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit' };

const STAGE_PREFIX = 'bg-guild-';

export function GuildOwnedShelf({ language, kind, ownership, actions }: {
  language: Language;
  kind: 'bg' | 'furniture';
  ownership: Pick<ShopOwnership, 'ownedBackgrounds' | 'equippedBackground' | 'ownedFurniture' | 'equippedDecor'>;
  actions: Pick<ShopActions, 'onEquip' | 'onEquipFurniture'>;
}) {
  const isPt = language === 'pt-BR';
  /** 8.2 - a miniatura abre a pre-visualizacao (a mesma dos cenarios da loja). */
  const [preview, setPreview] = useState<string | null>(null);
  // D-27 (W5-L7): os cenários do Bosque voltaram com arte nova; só um estágio sem arte (`GUILD_SCENES_RETIRED_IDS`) some daqui.
  const items = kind === 'bg'
    ? (GROVE_STAGES
        .filter(st => ownership.ownedBackgrounds.includes(STAGE_PREFIX + st) && !isGuildSceneRetired(STAGE_PREFIX + st))
        .map(st => ({ id: STAGE_PREFIX + st, name: groveStageName(language, st as GroveStageId), slot: null as null })))
    : ownership.ownedFurniture
        .map(id => ALL_SHOP_ITEMS.find(i => i.id === id))
        .filter((i): i is NonNullable<typeof i> => !!i && isGuildReward(i) && !!i.slot)
        .map(i => ({ id: i.id, name: isPt ? i.namePt : i.nameEn, slot: i.slot! }));
  if (items.length === 0) return null;

  return (
    <section data-guild-owned={kind} aria-label={guildText(language, 'guild.cenarios.titulo')} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <h3 style={{ ...sm2Hint, margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 600 }}>
        {guildText(language, 'guild.cenarios.titulo')}
      </h3>
      {items.map(it => {
        const equipped = it.slot ? ownership.equippedDecor[it.slot] === it.id : ownership.equippedBackground === it.id;
        const toggle = () => {
          if (it.slot) actions.onEquipFurniture(equipped ? null : it.id, it.slot);
          else actions.onEquip(equipped ? null : it.id);
        };
        const bg = PET_BACKGROUNDS[it.id];
        const png = DECOR_ART[it.id];
        return (
          <div key={it.id} style={row}>
            <button
              type="button"
              data-thumb-preview={it.id}
              onClick={() => setPreview(it.id)}
              aria-label={isPt ? `Ver ${it.name} ampliado` : `View ${it.name} larger`}
              style={thumbBtn}
            >
            {kind === 'bg' ? (
              <MiniGlass size={GLASS_ITEM} style={{ width: GLASS_BG_W, height: GLASS_BG_H, ...(equipped ? { boxShadow: '0 0 0 2px var(--sm2-primary-ink)' } : {}) }}>
                <span aria-hidden="true" style={{ position: 'absolute', inset: 0, background: bg && `${bg.css} center bottom / cover no-repeat`, backgroundColor: bg?.baseColor }} />
              </MiniGlass>
            ) : (
              <MiniGlass size={GLASS_ITEM} style={equipped ? { boxShadow: '0 0 0 2px var(--sm2-primary-ink)' } : undefined}>
                {png && <img src={png} alt="" className="sm2-shop-art" style={{ transform: 'translate(-50%, -50%) scale(0.5)' }} />}
              </MiniGlass>
            )}
            </button>
            <button
              type="button"
              data-guild-owned-item={it.id}
              aria-pressed={equipped}
              aria-label={`${it.name} — ${equipped ? (isPt ? 'Equipado' : 'Equipped') : (isPt ? 'Equipar' : 'Equip')}`}
              onClick={toggle}
              style={mainBtn}
            >
            <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ ...sm2Text, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.name}</span>
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
      })}
      {preview && kind === 'bg' && (
        <BackgroundLightbox open bgId={preview} name={items.find(i => i.id === preview)?.name ?? ''} language={language} onClose={() => setPreview(null)} />
      )}
      {preview && kind === 'furniture' && (() => {
        const it = ALL_SHOP_ITEMS.find(i => i.id === preview);
        return it ? <ItemLightbox open item={it} name={isPt ? it.namePt : it.nameEn} language={language} onClose={() => setPreview(null)} /> : null;
      })()}
    </section>
  );
}
