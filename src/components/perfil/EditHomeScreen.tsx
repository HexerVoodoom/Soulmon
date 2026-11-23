import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { BackArrow } from '../ui/BackArrow';
import { Icon } from '../ui/Icon';
import { PetStageDecor } from '../PetStageDecor';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { PET_BACKGROUNDS, visibleBackground } from '../../utils/backgrounds';
import { DECOR_SLOTS, STAGE_HEIGHT, decorRenderBox, slotBoxStyle, type SlotId } from '../../utils/petStage';
import { DECOR_ART } from '../../utils/decorArt';
import {
  decorEqual, decorOptionsForSlot, editableSlots, ownedBackgroundOptions, ownedFittingCount, pickDecor, slotHoldsDrawnItem, type DecorMap,
} from '../../utils/editHome';
import type { Language } from '../../utils/i18n';

/**
 * EDITAR HOME (dono, 04/11/2026). Tela cheia, aberta pelo grupo Perfil das Configurações: o retângulo da Home com o
 * cenário aplicado, um ponto branco a 50% em cada espaço de decoração VAZIO, e um toque num ponto (ou numa peça
 * equipada) abre uma folha com o que a pessoa TEM e cabe naquele espaço, mais "Vazio" para desequipar.
 *
 * Tudo é RASCUNHO local: `onSave` recebe o mapa final (o App grava em `equippedDecor`, o mesmo campo da loja) e
 * `onClose` descarta. O pet fica de fora de propósito — a tela é sobre o cenário, e o pet taparia o centro do chão.
 * O cenário também é rascunho: um controle num canto livre do retângulo abre a lista dos cenários que a pessoa tem.
 * Todo espaço que o cenário oferece leva marcador, com ou sem peça (peça que não é desenhada conta como livre).
 */
export interface EditHomeProps {
  language: Language;
  ownedFurniture: string[];
  equippedDecor: DecorMap;
  equippedBackground: string | null;
  /** Cenários que a pessoa tem (o equipado entra sempre). */
  ownedBackgrounds?: string[];
  onSave: (decor: DecorMap, background: string | null) => void;
  onClose: () => void;
  /** Estado vazio: leva à loja de Decoração. */
  onOpenShop?: () => void;
}

const DOT = 20;
const HIT = 44;

export function EditHomeScreen({ language, ownedFurniture, equippedDecor, equippedBackground: rawBackground, ownedBackgrounds = [], onSave, onClose, onOpenShop }: EditHomeProps) {
  const isPt = language === 'pt-BR';
  // Mesma leitura da Home: cenário aposentado não desenha (o save nunca é tocado).
  const savedBackground = visibleBackground(rawBackground);
  const [bgDraft, setBgDraft] = useState<string | null>(savedBackground);
  const [pickingBg, setPickingBg] = useState(false);
  const equippedBackground = bgDraft;
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onClose);
  const [draft, setDraft] = useState<DecorMap>(() => ({ ...equippedDecor }));
  const [picking, setPicking] = useState<SlotId | null>(null);

  const bg = equippedBackground ? PET_BACKGROUNDS[equippedBackground] : null;
  const slots = editableSlots(equippedBackground);
  const dirty = !decorEqual(draft, equippedDecor) || bgDraft !== savedBackground;
  const bgOptions = ownedBackgroundOptions(ownedBackgrounds, savedBackground);
  const nothingOwned = ownedFittingCount(equippedBackground, ownedFurniture) === 0 && Object.keys(draft).length === 0;
  const slotName = (s: SlotId) => (isPt ? DECOR_SLOTS[s].namePt : DECOR_SLOTS[s].nameEn);
  const options = picking ? decorOptionsForSlot(picking, equippedBackground, ownedFurniture) : [];
  const title = isPt ? 'Editar Home' : 'Edit Home';

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-edit-home
      className="sm2-sheet-fade"
      style={{
        position: 'fixed', inset: 0, zIndex: 120, display: 'flex', flexDirection: 'column',
        backgroundColor: 'var(--sm2-bg)', color: 'var(--sm2-ink)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px 0 12px', flexShrink: 0 }}>
        <BackArrow onClick={onClose} language={language} style={{ margin: 0 }} />
        <h2 style={{ fontFamily: 'var(--sm2-font-display)', fontSize: 'var(--sm2-text-md)', fontWeight: 600, margin: 0, flex: 1 }}>{title}</h2>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <p style={{ ...sm2Hint, margin: 0, textAlign: 'center', maxWidth: 420 }}>
          {slots.length > 0
            ? (isPt ? 'Toque num ponto para pôr uma peça, ou numa peça para trocá-la.' : 'Tap a dot to place an item, or an item to swap it.')
            : (isPt ? 'Este cenário não aceita decoração. Toque no quadrado do canto para escolher outro.' : "This scene doesn't take decoration. Tap the square in the corner to pick another.")}
        </p>

        {/* O retângulo da Home: mesma altura do palco real, mesma ancoragem dos espaços. */}
        <div
          data-edit-home-stage
          style={{
            position: 'relative', width: '100%', maxWidth: 440, height: STAGE_HEIGHT, flexShrink: 0,
            overflow: 'hidden', borderRadius: 'var(--sm2-radius-lg)', border: '1px solid var(--sm2-line)',
            background: bg ? `${bg.css} center bottom / cover no-repeat, ${bg.baseColor ?? 'var(--sm2-surface)'}` : 'var(--sm2-surface)',
            imageRendering: 'pixelated',
          }}
        >
          {/* Brilho branco em volta dos objetos: mostra o que dá para tocar (dono, 04/11/2026). */}
          <div data-edit-glow style={{ position: 'absolute', inset: 0, filter: 'drop-shadow(0 0 2px #fff) drop-shadow(0 0 6px #fff)' }}>
            <PetStageDecor equippedDecor={draft} equippedBackground={equippedBackground} trophies={[]} language={language} />
          </div>
          <button
            type="button"
            data-edit-bg-open
            aria-label={isPt ? 'Trocar cenário' : 'Change scene'}
            onClick={() => setPickingBg(true)}
            style={{
              position: 'absolute', left: 8, top: 8, zIndex: 4, width: HIT, height: HIT, padding: 0, cursor: 'pointer',
              background: 'none', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <span aria-hidden="true" style={{
              width: 28, height: 28, borderRadius: 8, opacity: 0.85, boxSizing: 'border-box',
              border: '2px solid #fff', boxShadow: '0 0 0 3px rgba(255,255,255,.18)',
              background: bg ? `${bg.css} center bottom / cover no-repeat, ${bg.baseColor ?? 'var(--sm2-surface)'}` : 'var(--sm2-surface)',
              imageRendering: 'pixelated',
            }} />
          </button>
          {slots.map(slotId => {
            const slot = DECOR_SLOTS[slotId];
            const filled = slotHoldsDrawnItem(slotId, draft, equippedBackground);
            const box = slotBoxStyle(slot);
            const rb = decorRenderBox(slot);
            // Centro visual da caixa do espaço (a caixa já vem ancorada ao chão/parede).
            const cy = `calc(${box.top} + ${box.marginTop + rb.h / 2}px)`;
            return (
              <button
                key={slotId}
                type="button"
                data-edit-slot={slotId}
                data-filled={filled ? 'true' : 'false'}
                aria-label={`${slotName(slotId)}${filled ? '' : (isPt ? ' (vazio)' : ' (empty)')}`}
                onClick={() => setPicking(slotId)}
                style={filled ? {
                  ...box, zIndex: 2, background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  minWidth: HIT, minHeight: HIT,
                } : {
                  position: 'absolute', left: box.left, top: cy, width: HIT, height: HIT, marginLeft: -HIT / 2, marginTop: -HIT / 2,
                  zIndex: 3, background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <span aria-hidden="true" data-edit-dot style={{
                  width: DOT, height: DOT, borderRadius: '50%', background: '#fff', opacity: 0.5,
                  // alvo: bolinha branca, um vão vazio e um anel só de contorno em volta (dono, 04/11/2026).
                  outline: '2px solid #fff', outlineOffset: 5,
                  // Espaço com peça: o mesmo marcador, no centro da caixa, sem roubar o toque da peça.
                  ...(filled ? { position: 'absolute' as const, left: '50%', top: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' as const } : null),
                }} />
              </button>
            );
          })}
        </div>

        {nothingOwned && slots.length > 0 && (
          <div data-edit-home-empty style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', maxWidth: 360 }}>
            <p style={{ ...sm2Text, margin: 0 }}>
              {isPt ? 'Você ainda não tem decoração que combine com este cenário.' : "You don't own any decoration that fits this scene yet."}
            </p>
            {onOpenShop && (
              <button type="button" data-edit-home-shop onClick={onOpenShop} style={sm2Button('outline')}>
                {isPt ? 'Ver a loja de Decoração' : 'Visit the Decoration shop'}
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{
        display: 'flex', gap: 12, padding: '12px 16px calc(12px + env(safe-area-inset-bottom, 0px))',
        borderTop: '1px solid var(--sm2-line)', backgroundColor: 'var(--sm2-surface)', flexShrink: 0,
        maxWidth: 440, width: '100%', boxSizing: 'border-box', alignSelf: 'center',
      }}>
        <button type="button" data-edit-home-cancel onClick={onClose} style={{ ...sm2Button('outline'), flex: 1 }}>
          {isPt ? 'Cancelar' : 'Cancel'}
        </button>
        <button type="button" data-edit-home-save onClick={() => onSave(draft, bgDraft)} disabled={!dirty} style={{ ...sm2Button('primary', !dirty), flex: 1 }}>
          {isPt ? 'Salvar' : 'Save'}
        </button>
      </div>

      <ModalSheet open={pickingBg} title={isPt ? 'Cenário' : 'Scene'} onClose={() => setPickingBg(false)} language={language} sobreTelas>
        <ul data-edit-bg-options style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {bgOptions.map(id => {
            const b = PET_BACKGROUNDS[id];
            return (
              <li key={id}>
                <OptionRow
                  dataKey={id}
                  attr="data-edit-bg-option"
                  selected={bgDraft === id}
                  label={isPt ? b.namePt : b.nameEn}
                  onClick={() => { setBgDraft(id); setPickingBg(false); }}
                  leading={<span aria-hidden style={{
                    width: 40, height: 40, borderRadius: 8, boxSizing: 'border-box', border: '1px solid var(--sm2-line)',
                    background: `${b.css} center bottom / cover no-repeat, ${b.baseColor ?? 'var(--sm2-surface)'}`, imageRendering: 'pixelated',
                  }} />}
                />
              </li>
            );
          })}
        </ul>
      </ModalSheet>

      <ModalSheet open={picking !== null} title={picking ? slotName(picking) : ''} onClose={() => setPicking(null)} language={language} sobreTelas>
        {picking && (
          <ul data-edit-options style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <li>
              <OptionRow
                dataKey="empty"
                selected={!draft[picking]}
                label={isPt ? 'Vazio' : 'Empty'}
                onClick={() => { setDraft(d => pickDecor(d, picking, null)); setPicking(null); }}
                leading={<span aria-hidden style={{ width: 24, height: 24, borderRadius: '50%', border: '2px dashed var(--sm2-muted)', boxSizing: 'border-box' }} />}
              />
            </li>
            {options.map(it => (
              <li key={it.id}>
                <OptionRow
                  dataKey={it.id}
                  selected={draft[picking] === it.id}
                  label={isPt ? it.namePt : it.nameEn}
                  onClick={() => { setDraft(d => pickDecor(d, picking, it.id)); setPicking(null); }}
                  leading={DECOR_ART[it.id]
                    ? <img src={DECOR_ART[it.id]} alt="" width={40} height={40} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                    : <span aria-hidden style={{ fontSize: '1.75rem', lineHeight: 1 }}>{it.icon}</span>}
                />
              </li>
            ))}
            {options.length === 0 && (
              <li>
                <p style={{ ...sm2Hint, margin: '8px 0 0' }}>
                  {isPt ? 'Você não tem peça para este espaço neste cenário.' : "You don't own an item for this spot in this scene."}
                </p>
                {onOpenShop && (
                  <button type="button" onClick={onOpenShop} style={{ ...sm2Button('ghost'), marginTop: 4 }}>
                    {isPt ? 'Ver a loja' : 'Visit the shop'}
                  </button>
                )}
              </li>
            )}
          </ul>
        )}
      </ModalSheet>
    </div>,
    document.body,
  );
}

function OptionRow({ selected, label, leading, onClick, dataKey, attr = 'data-edit-option' }: {
  selected: boolean; label: string; leading: ReactNode; onClick: () => void; dataKey: string; attr?: string;
}) {
  return (
    <button
      type="button"
      {...{ [attr]: dataKey }}
      onClick={onClick}
      aria-pressed={selected}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 56, padding: '0 8px',
        background: selected ? 'var(--sm2-primary-soft)' : 'none', border: 'none', borderRadius: 'var(--sm2-radius-md)',
        cursor: 'pointer', color: 'var(--sm2-ink)', textAlign: 'left',
      }}
    >
      <span style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{leading}</span>
      <span style={{ ...sm2Text, flex: 1 }}>{label}</span>
      {selected && <Icon name="check" size={24} fill={1} tone="inherit" />}
    </button>
  );
}
