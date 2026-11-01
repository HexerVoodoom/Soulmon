/**
 * A tela da HEXSMITH (01/11/2026, pedido do dono): um MAPA DE SLOTS de RPG — o Soulmon no centro e os 5 encaixes em volta
 * (coroa na cabeça, amuleto no peito, garra numa mão, luvas na outra, couraça no corpo), ligados por linhas de circuito hex.
 * Tocar um encaixe abre o painel dele: os itens POSSUÍDOS (equipar / esvaziar) e a FORJA (catálogo com custo e o motivo da recusa).
 *
 * Regras: TODAS em `utils/hexsmith.ts` (a tela só mostra e chama os puros, e o motivo que desabilita o botão é o que aparece em texto).
 * Textos: `utils/hexsmithCopy.ts`. Arte final: `assets/soulmon/hex` (hoje vazia → glifos SVG inline). Sem botão de vender/descartar.
 */
import { useMemo, useState } from 'react';
import type { Language } from '../../utils/i18n';
import { useGameStateOptional } from '../../contexts/GameStateContext';
import { ModalSheet, sm2Button, sm2Hint, sm2Label, sm2Text } from '../form/FormKit';
import { ElementIcon, elName } from '../ElementBaseSlots';
import { BitsAmount } from '../ui/BitsAmount';
import { combatGlowColor } from '../../utils/combatArt';
import { earnedBits } from '../../utils/bitsOrigin';
import { potionKey } from '../../utils/elementPotion';
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
import { HEX_FAMILY_COPY, HEX_SLOT_COPY, HEX_STRIKE_COPY, HEX_UI, hexRefusalText, tx } from '../../utils/hexsmithCopy';
import { getSpriteForStage } from '../../utils/sprites';
import { resolveHexSlotArt } from '../../assets/soulmon/hex';
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

/** Posição de cada encaixe no mapa (% do quadro) e o ponto do corpo onde a linha encosta. */
const LAYOUT: Readonly<Record<HexSlot, { x: number; y: number; ax: number; ay: number }>> = {
  coroa: { x: 50, y: 9, ax: 50, ay: 30 },
  garra: { x: 12, y: 46, ax: 36, ay: 50 },
  luvas: { x: 88, y: 46, ax: 64, ay: 50 },
  amuleto: { x: 15, y: 84, ax: 46, ay: 48 },
  couraca: { x: 85, y: 84, ax: 54, ay: 62 },
};

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
    <section data-hexsmith aria-label={tx(HEX_UI.title, isPt)} style={{ display: 'grid', gap: 14, maxWidth: 420, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
      <p style={sm2Hint}>{tx(HEX_UI.intro, isPt)}</p>

      {/* O MAPA DE SLOTS */}
      <div data-hex-map style={{ position: 'relative', width: '100%', maxWidth: 360, aspectRatio: '1 / 1', margin: '0 auto' }}>
        <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <polygon points="50,14 83,32 83,68 50,86 17,68 17,32" fill="none" stroke="var(--sm2-line)" strokeWidth="0.6" strokeDasharray="2 1.5" />
          {HEX_SLOTS.map((s) => {
            const L = LAYOUT[s];
            const on = !!hx.equipped[s];
            const c = on ? (HEX_ELEMENT_SLOTS.includes(s) ? combatGlowColor(now[s]) : undefined) ?? 'var(--sm2-primary-ink)' : 'var(--sm2-line)';
            // circuito em L (horizontal depois vertical), com um nó no encosto
            return (
              <g key={s}>
                <polyline points={`${L.x},${L.y} ${L.x},${L.ay} ${L.ax},${L.ay}`} fill="none" stroke={c} strokeWidth={on ? 0.9 : 0.6} />
                <circle cx={L.ax} cy={L.ay} r={1.2} fill={c} />
              </g>
            );
          })}
        </svg>
        {sprite && (
          <img src={sprite} alt={isPt ? 'Seu Soulmon' : 'Your Soulmon'} draggable={false}
            style={{ position: 'absolute', left: '50%', top: '50%', width: '42%', height: '42%', transform: 'translate(-50%,-50%)', objectFit: 'contain', imageRendering: 'pixelated' }} />
        )}
        {HEX_SLOTS.map((s) => {
          const L = LAYOUT[s];
          const id = hx.equipped[s];
          const it = id ? parseHexItem(id) : undefined;
          const valueName = it ? hexValueName(s, it.value, isPt) : tx(HEX_UI.empty, isPt);
          return (
            <button key={s} type="button" data-hex-slot={s} data-hex-filled={!!id}
              aria-label={`${tx(HEX_SLOT_COPY[s].name, isPt)}: ${valueName}`} aria-haspopup="dialog"
              onClick={() => { setAviso(null); setOpen(s); }}
              style={{ all: 'unset', cursor: 'pointer', position: 'absolute', left: `${L.x}%`, top: `${L.y}%`, transform: 'translate(-50%,-50%)', display: 'grid', justifyItems: 'center', gap: 2, minWidth: 64, minHeight: 64, textAlign: 'center', borderRadius: 8 }}>
              <SlotFace slot={s} value={it?.value} size={44} />
              <span style={{ ...sm2Label, fontSize: 11, color: id ? 'var(--sm2-ink)' : 'var(--sm2-muted)', maxWidth: 84, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx(HEX_SLOT_COPY[s].name, isPt)}</span>
            </button>
          );
        })}
      </div>

      {/* O CÓDIGO HEX legível */}
      <div data-hex-code style={{ display: 'grid', gap: 4 }}>
        <h3 style={{ ...sm2Label, margin: 0 }}>{tx(HEX_UI.code, isPt)}</h3>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 2, fontFamily: 'var(--sm2-font-mono, ui-monospace, monospace)' }}>
          {HEX_SLOTS.map((s) => {
            const v = now[s];
            return (
              <li key={s} data-hex-line={s} style={{ ...sm2Text, fontSize: 13, color: v ? 'var(--sm2-ink)' : 'var(--sm2-muted)' }}>
                {tx(HEX_SLOT_COPY[s].line, isPt)}: {v
                  ? <><strong style={{ color: 'var(--sm2-primary-ink)' }}>{hexValueName(s, v, isPt)}</strong>{hexValueName(s, v, isPt) !== origName(s) && <> ({tx(HEX_UI.was, isPt)} {origName(s)})</>}</>
                  : <>{origName(s)} · {tx(HEX_UI.original, isPt)}</>}
              </li>
            );
          })}
        </ul>
      </div>
      <p style={sm2Hint}>{tx(HEX_UI.keep, isPt)}</p>

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

/** O rosto do slot: arte final se houver; senão o ícone do elemento (pelado, sem caixa) ou o glifo SVG do tipo, na cor do valor. */
function SlotFace({ slot, value, size }: { slot: HexSlot; value?: string; size: number }) {
  const art = !value ? resolveHexSlotArt(slot) : undefined;
  if (art) return <img src={art} alt="" aria-hidden="true" width={size} height={size} style={{ width: size, height: size, objectFit: 'contain' }} />;
  if (value && HEX_ELEMENT_SLOTS.includes(slot)) {
    return (
      <span style={{ position: 'relative', width: size, height: size, display: 'inline-grid', placeItems: 'center' }}>
        <HexSlotGlyph slot={slot} size={size} color={combatGlowColor(value) ?? 'var(--sm2-primary-ink)'} filled />
        <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><ElementIcon id={value} size={Math.round(size * 0.55)} /></span>
      </span>
    );
  }
  return <HexSlotGlyph slot={slot} size={size} color={value ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)'} filled={!!value} />;
}

interface PanelProps {
  slot: HexSlot; isPt: boolean; language: string; aviso: string | null;
  gs: NonNullable<ReturnType<typeof useGameStateOptional>>['gameState'];
  onClose: () => void; onForge: (id: string) => void; onEquip: (id: string) => void; onClear: () => void;
}

function SlotPanel({ slot, isPt, language, gs, aviso, onClose, onForge, onEquip, onClear }: PanelProps) {
  const [q, setQ] = useState('');
  const [onlyOk, setOnlyOk] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const hx = sanitizeHexsmith(gs.hexsmith);
  const isEl = HEX_ELEMENT_SLOTS.includes(slot);
  const mine = hx.owned.filter((id) => parseHexItem(id)!.slot === slot);
  const equipped = hx.equipped[slot];
  const bits = earnedBits(gs);
  const frags = gs.equipment?.fragments ?? 0;

  const catalog = useMemo(() => {
    const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const nq = norm(q.trim());
    return hexValuesOf(slot)
      .map((v) => hexItemId(slot, v))
      .filter((id) => !hx.owned.includes(id))
      .filter((id) => !nq || norm(hexValueName(slot, parseHexItem(id)!.value, isPt)).includes(nq))
      .filter((id) => !onlyOk || !hexForgeRefusal(gs, id))
      .sort((a, b) => Number(!!hexForgeRefusal(gs, a)) - Number(!!hexForgeRefusal(gs, b)));
  }, [slot, q, onlyOk, gs, hx.owned, isPt]);

  const sel = picked && catalog.includes(picked) ? picked : null;
  const selCost = sel ? hexCost(sel)! : null;
  const selRefusal = sel ? hexForgeRefusal(gs, sel) : undefined;
  const selName = sel ? hexValueName(slot, parseHexItem(sel)!.value, isPt) : '';

  return (
    <ModalSheet open title={`${tx(HEX_SLOT_COPY[slot].name, isPt)} · ${tx(HEX_SLOT_COPY[slot].effect, isPt)}`} onClose={onClose} language={language as Language}
      footer={sel && selCost ? (
        <div data-hex-forge-footer style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
          <button type="button" data-hex-forge={sel} disabled={!!selRefusal} aria-describedby={selRefusal ? 'hex-refusal' : undefined}
            onClick={() => { onForge(sel); setPicked(null); }}
            style={{ ...sm2Button('primary', !!selRefusal), width: 'auto', minWidth: 220, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <span>{tx(HEX_UI.forge, isPt)}: {selName}</span>
          </button>
          {selRefusal && <p id="hex-refusal" data-hex-refusal={selRefusal} style={{ ...sm2Hint, textAlign: 'center', margin: 0 }}>{hexRefusalText(selRefusal, isPt, isEl ? selName : undefined)}</p>}
        </div>
      ) : undefined}>
      <div data-hex-panel={slot} style={{ display: 'grid', gap: 14, minWidth: 0, gridTemplateColumns: 'minmax(0, 1fr)' }}>
        {aviso && <p role="status" data-hex-aviso style={sm2Text}>{aviso}</p>}

        <section aria-label={tx(HEX_UI.owned, isPt)} style={{ display: 'grid', gap: 6 }}>
          <h3 style={{ ...sm2Label, margin: 0 }}>{tx(HEX_UI.owned, isPt)}</h3>
          {mine.length === 0 ? <p style={sm2Hint} data-hex-none-owned>{tx(HEX_UI.noneOwned, isPt)}</p> : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 4 }}>
              {mine.map((id) => {
                const v = parseHexItem(id)!.value;
                const on = equipped === id;
                return (
                  <li key={id} data-hex-owned={id} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
                    <SlotFace slot={slot} value={v} size={28} />
                    <span style={{ ...sm2Text, flex: 1, fontWeight: on ? 700 : 400 }}>{hexValueName(slot, v, isPt)}</span>
                    {on
                      ? <span style={{ ...sm2Hint, color: 'var(--sm2-primary-ink)' }} data-hex-is-equipped>{tx(HEX_UI.equipped, isPt)}</span>
                      : <button type="button" data-hex-equip={id} onClick={() => onEquip(id)} style={{ ...sm2Button('outline', false, 'sm'), width: 'auto' }}>{tx(HEX_UI.equip, isPt)}</button>}
                  </li>
                );
              })}
            </ul>
          )}
          {equipped && <button type="button" data-hex-clear onClick={onClear} style={{ ...sm2Button('quiet'), width: 'auto', justifySelf: 'start' }}>{tx(HEX_UI.clear, isPt)}</button>}
        </section>

        <section aria-label={tx(HEX_UI.catalog, isPt)} style={{ display: 'grid', gap: 8 }}>
          <h3 style={{ ...sm2Label, margin: 0 }}>{tx(HEX_UI.catalog, isPt)}</h3>
          <p data-hex-balance style={{ ...sm2Hint, display: 'flex', flexWrap: 'wrap', gap: '4px 12px', alignItems: 'center', margin: 0 }}>
            <span>{tx(HEX_UI.balance, isPt)}:</span>
            <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}><BitsAmount value={bits} size={14} /> {tx(HEX_UI.bitsEarned, isPt)}</span>
            {!isEl && <span className="sm2-num">{frags} {tx(HEX_UI.fragments, isPt)}</span>}
            {isEl && sel && <span className="sm2-num">{gs.foodInventory[potionKey(parseHexItem(sel)!.value)] ?? 0} {tx(HEX_UI.potions, isPt)} · {selName}</span>}
          </p>
          {isEl && (
            <div style={{ display: 'grid', gap: 6 }}>
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label={tx(HEX_UI.search, isPt)} placeholder={tx(HEX_UI.search, isPt)} data-hex-search
                style={{ ...sm2Text, minHeight: 44, padding: '0 12px', borderRadius: 10, border: '1px solid var(--sm2-line)', background: 'var(--sm2-surface-2)', color: 'var(--sm2-ink)', width: '100%', boxSizing: 'border-box' }} />
              <label style={{ ...sm2Text, display: 'flex', alignItems: 'center', gap: 8, minHeight: 44 }}>
                <input type="checkbox" checked={onlyOk} onChange={(e) => setOnlyOk(e.target.checked)} data-hex-only-affordable />
                {tx(HEX_UI.onlyAffordable, isPt)}
              </label>
            </div>
          )}
          {catalog.length === 0 ? <p style={sm2Hint}>{tx(HEX_UI.noMatch, isPt)}</p> : (
            <ul data-hex-catalog style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 2, maxHeight: isEl ? 320 : undefined, overflowY: 'auto' }}>
              {catalog.map((id) => {
                const v = parseHexItem(id)!.value;
                const c = hexCost(id)!;
                const ok = !hexForgeRefusal(gs, id);
                const pot = isEl ? gs.foodInventory[potionKey(v)] ?? 0 : 0;
                return (
                  <li key={id}>
                    <button type="button" data-hex-item={id} data-hex-affordable={ok} aria-pressed={sel === id} onClick={() => setPicked(sel === id ? null : id)}
                      style={{ all: 'unset', cursor: 'pointer', boxSizing: 'border-box', width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', gap: 10, padding: '2px 4px', borderBottom: sel === id ? '2px solid var(--sm2-primary-ink)' : '2px solid transparent' }}>
                      <SlotFace slot={slot} value={v} size={28} />
                      <span style={{ ...sm2Text, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: sel === id ? 700 : 400, color: ok ? 'var(--sm2-ink)' : 'var(--sm2-muted)' }}>{hexValueName(slot, v, isPt)}</span>
                      <span className="sm2-num" style={{ ...sm2Hint, display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {c.potions > 0 && <span>{pot}/{c.potions} {tx(HEX_UI.potions, isPt)}</span>}
                        {c.fragments > 0 && <span>{frags}/{c.fragments} {tx(HEX_UI.fragments, isPt)}</span>}
                        <BitsAmount value={c.bits} size={12} dim={bits < c.bits} />
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
