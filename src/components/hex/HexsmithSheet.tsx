/**
 * A tela da HEXSMITH (01/11/2026, pedido do dono): um MAPA DE SLOTS de RPG — o Soulmon no centro e os 5 encaixes em volta
 * (coroa na cabeça, amuleto no peito, garra numa mão, luvas na outra, couraça no corpo), ligados por linhas de circuito hex.
 * Tocar um encaixe abre o painel dele: os itens POSSUÍDOS (equipar / esvaziar) e a FORJA (catálogo com custo e o motivo da recusa).
 *
 * Revisão minimalista (01/11/2026, dono + Squad Alpha): uma rolagem só (a do `ModalSheet`); filtro por ELEMENTOS BASE = o mesmo
 * `ElementBaseSlots` + `elementsMatchingBases` do Laboratório e do Cambista; elemento não desbloqueado no Drive não aparece;
 * seleção tonal do DS (`.sm2-hex-row`, o desenho do `Chip`); um ícone por encaixe; tudo por token (`index.css`, bloco Hexsmith).
 *
 * Regras: TODAS em `utils/hexsmith.ts` (a tela só mostra e chama os puros, e o motivo que desabilita o botão é o que aparece em texto).
 * Textos: `utils/hexsmithCopy.ts`. Arte final: `assets/soulmon/hex` (glob; sem arquivo → glifos SVG). Sem botão de vender/descartar.
 */
import { useId, useMemo, useState } from 'react';
import type { Language } from '../../utils/i18n';
import { useGameStateOptional } from '../../contexts/GameStateContext';
import { ActionRow, Disclosure, ModalSheet, sm2Button, sm2Hint, sm2Label, sm2Text } from '../form/FormKit';
import { ElementBaseSlots, ElementIcon, elName, emptySlots } from '../ElementBaseSlots';
import { BitsAmount } from '../ui/BitsAmount';
import { Icon } from '../ui/Icon';
import { earnedBits } from '../../utils/bitsOrigin';
import { elementsMatchingBases, isPotionUnlocked, potionKey } from '../../utils/elementPotion';
import { isDemoMode, demoRefusalText } from '../../utils/demoMode';
import { fighterIdentity } from '../../utils/fighterIdentity';
import { fichaStageOf } from '../../utils/soulProfile/ficha/stageSkillsFor';
import type { StageSkills } from '../../utils/soulProfile/ficha/skills';
import type { FichaStage } from '../../utils/soulProfile/ficha/types';
import {
  HEX_ELEMENT_SLOTS, HEX_SLOTS, equipHexItem, forgeHexItem, hexCost, hexForgeRefusal, hexItemId, hexOverrides, hexValuesOf, parseHexItem,
  sanitizeHexsmith, unequipHexSlot, type HexSlot, type HexStrike,
} from '../../utils/hexsmith';
import type { SpecialFamily } from '../../utils/combate/specials';
import { HEX_FAMILY_COPY, HEX_SLOT_COPY, HEX_STRIKE_COPY, HEX_UI, hexName, hexRefusalText, tx } from '../../utils/hexsmithCopy';
import { getSpriteForStage } from '../../utils/sprites';
import { HEX_ART, HEX_MAP_ART, resolveHexSlotArt } from '../../assets/soulmon/hex';
import { HexSlotGlyph } from './HexSlotGlyph';

export interface HexsmithSheetProps {
  language?: string;
  /** Sprite atual do Soulmon (o mesmo do resto do app: `minhaCriaturaUrl` / `getSpriteForStage`). */
  sprite?: string | null;
  evolutionStage?: string;
  skills?: Partial<Record<FichaStage, StageSkills>>;
  petElement?: string;
  /** Linha do sprite (fallback de `getSpriteForStage` quando `sprite` não veio). */
  demoCharacterId?: string;
}

/**
 * Centro de cada PORTA em % de `mapa-portas.png` (640², medido em 01/11/2026 pelo centróide do vazado de cada hexágono, Pillow).
 * O hexágono central (49,8 / 53,5; ~27% de largura) recebe o sprite. A placa já desenha as trilhas: nada de linha em CSS/SVG.
 */
const PORTS: Readonly<Record<HexSlot, { x: number; y: number }>> = {
  coroa: { x: 49.9, y: 16.5 },
  amuleto: { x: 12.0, y: 42.1 },
  garra: { x: 87.7, y: 42.1 },
  couraca: { x: 21.1, y: 82.3 },
  luvas: { x: 78.6, y: 82.3 },
};
const CORE = { x: 49.8, y: 53.5 };

/** Degraus de `tokens.md` §6.1: `nav` 32 no mapa (o encaixe é um destino), `action` 24 nas linhas e no botão, `inline` 20 no saldo. */
const ICON_MAP = 32;
const ICON_ROW = 24;
const ICON_INLINE = 20;

/** Nome legível do VALOR de um item (elemento, família ou alcance). */
export function hexValueName(slot: HexSlot, value: string, isPt: boolean): string {
  if (HEX_ELEMENT_SLOTS.includes(slot)) return elName(value, isPt);
  if (slot === 'coroa') return tx(HEX_FAMILY_COPY[value as SpecialFamily], isPt);
  return tx(HEX_STRIKE_COPY[value as HexStrike], isPt);
}

export default function HexsmithSheet({ language = 'pt-BR', sprite: spriteProp, evolutionStage, skills, petElement, demoCharacterId }: HexsmithSheetProps) {
  const ctx = useGameStateOptional();
  const isPt = language === 'pt-BR';
  const [open, setOpen] = useState<HexSlot | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const gs = ctx?.gameState;
  const hx = useMemo(() => sanitizeHexsmith(gs?.hexsmith), [gs?.hexsmith]);
  const over = useMemo(() => hexOverrides(hx), [hx]);
  const orig = useMemo(() => {
    const id = fighterIdentity(evolutionStage ? skills?.[fichaStageOf(evolutionStage)] : undefined, petElement);
    return { coroa: id.especial.familia as string, amuleto: id.especial.elemento, garra: id.basico.elemento, couraca: petElement ?? id.basico.elemento, luvas: id.basico.forma as string };
  }, [evolutionStage, skills, petElement]);
  const sprite = spriteProp ?? (evolutionStage ? getSpriteForStage(evolutionStage, demoCharacterId) : null);
  if (!ctx || !gs) return null;
  const { setGameState } = ctx;

  const now: Record<HexSlot, string | undefined> = {
    coroa: over.specialFamily, amuleto: over.specialElement, garra: over.basicElement, couraca: over.defenseElement, luvas: over.strike,
  };
  const origName = (slot: HexSlot) => {
    const v = orig[slot];
    if (slot === 'luvas') return v === 'ranged' || v === 'melee' ? hexValueName(slot, v, isPt) : tx(HEX_UI.original, isPt);
    if (slot === 'coroa') return HEX_FAMILY_COPY[v as SpecialFamily] ? hexValueName(slot, v, isPt) : tx(HEX_UI.original, isPt);
    return v ? elName(v, isPt) : tx(HEX_UI.original, isPt);
  };

  const forge = (id: string) => {
    if (isDemoMode(gs)) { setAviso(demoRefusalText(isPt)); return; }
    if (hexForgeRefusal(gs, id)) return;
    setGameState((prev) => forgeHexItem(prev, id));
    setAviso(tx(HEX_UI.forged, isPt));
  };

  return (
    <section data-hexsmith aria-label={tx(HEX_UI.title, isPt)} className="sm2-hex">
      <p style={sm2Hint}>{tx(HEX_UI.intro, isPt)}</p>

      {/* O MAPA DE SLOTS */}
      <div data-hex-map className="sm2-hex-map">
        <img src={HEX_MAP_ART} alt="" aria-hidden="true" draggable={false} className="sm2-hex-map-art" />
        {sprite && <img src={sprite} alt={isPt ? 'Seu Soulmon' : 'Your Soulmon'} draggable={false} className="sm2-hex-sprite" style={{ left: `${CORE.x}%`, top: `${CORE.y}%` }} />}
        {HEX_SLOTS.map((s) => {
          const L = PORTS[s];
          const id = hx.equipped[s];
          const it = id ? parseHexItem(id) : undefined;
          const portName = tx(HEX_SLOT_COPY[s].port, isPt);
          const slotName = tx(HEX_SLOT_COPY[s].name, isPt);
          const valueName = it ? hexValueName(s, it.value, isPt) : undefined;
          return (
            <button key={s} type="button" data-hex-slot={s} data-hex-filled={!!id} className="sm2-hex-slot"
              aria-label={`${portName}: ${valueName ?? tx(HEX_UI.empty, isPt)}`} aria-haspopup="dialog"
              onClick={() => { setAviso(null); setOpen(s); }}
              style={{ left: `${L.x}%`, top: `${L.y}%` }}>
              <SlotFace slot={s} value={it?.value} size={ICON_MAP} />
              <span className="sm2-hex-slot-label" data-on={!!id}>{valueName ? `${slotName} · ${valueName}` : slotName}</span>
            </button>
          );
        })}
      </div>

      {/* O CÓDIGO HEX legível — avançado, fica fechado */}
      <Disclosure label={tx(HEX_UI.code, isPt)}>
        <ul data-hex-code className="sm2-hex-code">
          {HEX_SLOTS.map((s) => {
            const v = now[s];
            return (
              <li key={s} data-hex-line={s} data-on={!!v}>
                {tx(HEX_SLOT_COPY[s].line, isPt)}: {v
                  ? <><strong>{hexValueName(s, v, isPt)}</strong>{hexValueName(s, v, isPt) !== origName(s) && <> ({tx(HEX_UI.was, isPt)} {origName(s)})</>}</>
                  : <>{origName(s)} · {tx(HEX_UI.original, isPt)}</>}
              </li>
            );
          })}
        </ul>
      </Disclosure>

      {open && (
        <SlotPanel slot={open} isPt={isPt} language={language} gs={gs} aviso={aviso}
          onClose={() => setOpen(null)}
          onForge={forge}
          onEquip={(id) => setGameState((prev) => equipHexItem(prev, id))}
          onClear={() => setGameState((prev) => unequipHexSlot(prev, open))} />
      )}
    </section>
  );
}

/**
 * O rosto da porta — UM ícone só: com elemento, o ícone do ELEMENTO (já vem na cor dele); coroa/luvas com valor, a arte da porta
 * cheia; vazia, a mesma arte apagada (`data-empty`). Sem arte na pasta → glifo SVG (fallback).
 */
function SlotFace({ slot, value, size }: { slot: HexSlot; value?: string; size: number }) {
  if (value && HEX_ELEMENT_SLOTS.includes(slot)) return <ElementIcon id={value} size={size} />;
  const art = resolveHexSlotArt(slot);
  if (art) return <img src={art} alt="" aria-hidden="true" width={size} height={size} className="sm2-hex-art" data-empty={!value} />;
  return <HexSlotGlyph slot={slot} size={size} color={value ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)'} filled={!!value} />;
}

interface PanelProps {
  slot: HexSlot; isPt: boolean; language: string; aviso: string | null;
  gs: NonNullable<ReturnType<typeof useGameStateOptional>>['gameState'];
  onClose: () => void; onForge: (id: string) => void; onEquip: (id: string) => void; onClear: () => void;
}

function SlotPanel({ slot, isPt, language, gs, aviso, onClose, onForge, onEquip, onClear }: PanelProps) {
  const [bases, setBases] = useState<(string | null)[]>(emptySlots);
  const [picked, setPicked] = useState<string | null>(null);
  const refusalId = useId();
  const hx = sanitizeHexsmith(gs.hexsmith);
  const isEl = HEX_ELEMENT_SLOTS.includes(slot);
  const mine = hx.owned.filter((id) => parseHexItem(id)!.slot === slot);
  const equipped = hx.equipped[slot];
  const bits = earnedBits(gs);
  const frags = gs.equipment?.fragments ?? 0;

  const catalog = useMemo(() => {
    const values = isEl
      ? elementsMatchingBases(bases).filter((v) => isPotionUnlocked(v, gs.defeatedElements))
      : hexValuesOf(slot);
    return values
      .map((v) => hexItemId(slot, v))
      .filter((id) => !hx.owned.includes(id))
      .sort((a, b) => Number(!!hexForgeRefusal(gs, a)) - Number(!!hexForgeRefusal(gs, b)));
  }, [slot, isEl, bases, gs, hx.owned]);

  const sel = picked && catalog.includes(picked) ? picked : null;
  const selRefusal = sel ? hexForgeRefusal(gs, sel) : undefined;
  const selValue = sel ? parseHexItem(sel)!.value : '';
  const selName = sel ? hexValueName(slot, selValue, isPt) : '';

  return (
    <ModalSheet open title={`${tx(HEX_SLOT_COPY[slot].port, isPt)} · ${tx(HEX_SLOT_COPY[slot].effect, isPt)}`} onClose={onClose} language={language as Language}
      footer={sel ? (
        <div data-hex-forge-footer className="sm2-hex-footer">
          <button type="button" data-hex-forge={sel} disabled={!!selRefusal} aria-describedby={selRefusal ? refusalId : undefined}
            onClick={() => { onForge(sel); setPicked(null); }}
            style={sm2Button('primary', !!selRefusal)}>
            {HEX_ART.forge && <img src={HEX_ART.forge} alt="" aria-hidden="true" width={ICON_ROW} height={ICON_ROW} className="sm2-hex-art" />}
            <span>{tx(HEX_UI.forge, isPt)}: {hexName(selName, isPt)}</span>
            <SlotFace slot={slot} value={selValue} size={ICON_ROW} />
          </button>
          {selRefusal && <p id={refusalId} data-hex-refusal={selRefusal} style={{ ...sm2Hint, textAlign: 'center' }}>{hexRefusalText(selRefusal, isPt, isEl ? selName : undefined)}</p>}
        </div>
      ) : undefined}>
      <div data-hex-panel={slot} className="sm2-hex-panel">
        {aviso && <p role="status" data-hex-aviso style={sm2Text}>{aviso}</p>}

        <section aria-label={tx(HEX_UI.owned, isPt)} className="sm2-hex-group">
          <h3 style={{ ...sm2Label, margin: 0 }}>{tx(HEX_UI.owned, isPt)}</h3>
          {mine.length === 0 ? <p style={sm2Hint} data-hex-none-owned>{tx(HEX_UI.noneOwned, isPt)}</p> : (
            <ul className="sm2-hex-list">
              {mine.map((id) => {
                const v = parseHexItem(id)!.value;
                const on = equipped === id;
                return (
                  <li key={id} data-hex-owned={id}>
                    {on ? (
                      <>
                        <div className="sm2-hex-row" data-on="true" data-hex-is-equipped>
                          <SlotFace slot={slot} value={v} size={ICON_ROW} />
                          <span className="sm2-hex-row-name">{hexValueName(slot, v, isPt)}</span>
                          <span className="sm2-hex-row-tag"><Icon name="check" size={ICON_INLINE} fill={1} tone="inherit" />{tx(HEX_UI.equipped, isPt)}</span>
                        </div>
                        <div data-hex-clear><ActionRow label={tx(HEX_UI.clear, isPt)} onClick={onClear} language={language as Language} /></div>
                      </>
                    ) : (
                      <div className="sm2-hex-row">
                        <SlotFace slot={slot} value={v} size={ICON_ROW} />
                        <span className="sm2-hex-row-name">{hexValueName(slot, v, isPt)}</span>
                        <button type="button" data-hex-equip={id} onClick={() => onEquip(id)} style={sm2Button('outline', false, 'sm')}>{tx(HEX_UI.equip, isPt)}</button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-label={tx(HEX_UI.catalog, isPt)} className="sm2-hex-group">
          <h3 style={{ ...sm2Label, margin: 0 }}>{tx(HEX_UI.catalog, isPt)}</h3>
          <p data-hex-balance className="sm2-hex-balance">
            <span>{tx(HEX_UI.balance, isPt)}</span>
            <BitsAmount value={bits} size={ICON_INLINE} unit={tx(HEX_UI.bitsEarned, isPt)} />
            <span aria-hidden="true">{tx(HEX_UI.bitsEarned, isPt)}</span>
          </p>
          {isEl && (
            <>
              <p style={sm2Hint}>{tx(HEX_UI.filterHint, isPt)}</p>
              <ElementBaseSlots slots={bases} isPt={isPt} onChange={(i, id) => { setBases((v) => v.map((x, j) => (j === i ? id : x))); setPicked(null); }} />
            </>
          )}
          {catalog.length === 0 ? <p style={sm2Hint} data-hex-none>{tx(HEX_UI.noMatch, isPt)}</p> : (
            <ul data-hex-catalog className="sm2-hex-list">
              {catalog.map((id) => {
                const v = parseHexItem(id)!.value;
                const c = hexCost(id)!;
                const ok = !hexForgeRefusal(gs, id);
                const pot = isEl ? gs.foodInventory[potionKey(v)] ?? 0 : 0;
                const on = sel === id;
                return (
                  <li key={id}>
                    <button type="button" data-hex-item={id} data-hex-affordable={ok} aria-pressed={on} className="sm2-hex-row"
                      data-on={on} data-ok={ok} onClick={() => setPicked(on ? null : id)}>
                      {on ? <Icon name="check" size={ICON_ROW} fill={1} tone="inherit" /> : <SlotFace slot={slot} value={v} size={ICON_ROW} />}
                      <span className="sm2-hex-row-name">{hexValueName(slot, v, isPt)}</span>
                      <span className="sm2-hex-row-cost sm2-num">
                        {c.potions > 0 && <span>{pot}/{c.potions} {tx(HEX_UI.potions, isPt)}</span>}
                        {c.fragments > 0 && <span>{frags}/{c.fragments} {tx(HEX_UI.fragments, isPt)}</span>}
                        <BitsAmount value={c.bits} size={ICON_INLINE} dim={bits < c.bits} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </ModalSheet>
  );
}
