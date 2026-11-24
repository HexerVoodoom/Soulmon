/**
 * A tela da HEXSMITH (01/11/2026, pedido do dono): um MAPA DE SLOTS de RPG — o Soulmon no centro e os 5 encaixes em volta
 * (coroa na cabeça, amuleto no peito, garra numa mão, luvas na outra, couraça no corpo), ligados por linhas de circuito hex.
 * Tocar um encaixe abre o painel dele: os itens POSSUÍDOS (um botão grande por item: Equipar ⇄ Desequipar; 13/11/2026) e a FORJA (catálogo com custo e o motivo da recusa).
 *
 * Revisão minimalista (01/11/2026, dono + Squad Alpha): uma rolagem só (a do `ModalSheet`); filtro por ELEMENTOS BASE = o mesmo
 * `ElementBaseSlots` + `elementsMatchingBases` do Laboratório e do Cambista; elemento não desbloqueado no Drive não aparece;
 * seleção tonal do DS (`.sm2-hex-row`, o desenho do `Chip`); um ícone por encaixe; tudo por token (`index.css`, bloco Hexsmith).
 *
 * Regras: TODAS em `utils/hexsmith.ts` (a tela só mostra e chama os puros, e o motivo que desabilita o botão é o que aparece em texto).
 * Textos: `utils/hexsmithCopy.ts`. Arte final: `assets/soulmon/hex` (glob; sem arquivo → glifos SVG). Sem botão de vender/descartar.
 */
import { emphasizeSoulFragment } from '../ui/SoulFragmentTerm';
import { useId, useMemo, useState, type ReactNode } from 'react';
import { useBackLayer } from '../../utils/backStack';
import type { Language } from '../../utils/i18n';
import { companheiroDoEstado } from '../../utils/companheiroInvocado';
import { useGameStateOptional } from '../../contexts/GameStateContext';
import { ModalSheet, sm2Button, sm2Hint, sm2Label, sm2Text } from '../form/FormKit';
import { ElementBaseSlots, ElementIcon, elName, emptySlots } from '../ElementBaseSlots';
import { BitsAmount } from '../ui/BitsAmount';
import { Icon } from '../ui/Icon';
import { spendableBits } from '../../utils/bitsOrigin';
import { elementComposition, elementsMatchingBases, isPotionUnlocked, potionKey, POTION_COSTS } from '../../utils/elementPotion';
import { potionArt } from '../../utils/potionArt';
import { InfoTip, ModalInfo } from '../ui/InfoTip';
import { BitsIcon } from '../ui/BitsIcon';
import { SoulFragmentIcon } from '../ui/SoulFragmentIcon';
import { isDemoMode, demoRefusalText } from '../../utils/demoMode';
import { fighterIdentity } from '../../utils/fighterIdentity';
import { fichaStageOf } from '../../utils/soulProfile/ficha/stageSkillsFor';
import type { StageSkills } from '../../utils/soulProfile/ficha/skills';
import type { FichaStage } from '../../utils/soulProfile/ficha/types';
import {
  HEX_ELEMENT_SLOTS, HEX_SLOTS, equipHexItem, applyServerHexForge, hexCost, hexForgeRefusal, hexItemId, hexOverrides, hexValuesOf, parseHexItem,
  sanitizeHexsmith, unequipHexSlot, ingredienteRelevante, ordenarPorRelevancia, type HexSlot, type HexStrike,
} from '../../utils/hexsmith';
import { HEX_RENAME_COPY, HEX_SLOT_COPY, HEX_STRIKE_COPY, HEX_STRIKE_LEGEND, HEX_UI, hexCostHowTo, hexCostTipLabel, hexCrownValueCopy, hexCrownValueDesc, hexName, hexRefusalText, potionHowTo, tx } from '../../utils/hexsmithCopy';
import { getSpriteForStage } from '../../utils/sprites';
import { cloudHexForge, cloudHexRename } from '../../utils/cloudSave';
import { HexRenameButton } from './HexRenameButton';
import { HexRenameModal } from './HexRenameModal';
import { applyServerHexRename, type HexRenameKind } from '../../utils/hexsmithRename';
import { readLocal } from '../../utils/safeStorage';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { HEX_ART, HEX_MAP_ART, resolveHexChipArt, resolveHexCrownArt, resolveHexSlotArt } from '../../assets/soulmon/hex';
import { HexSlotGlyph } from './HexSlotGlyph';
import { ForgeResultModal } from '../ForgeResultModal';

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
/** Os 2 botões de RENOMEAR: um pouco ACIMA da linha da Coroa (y 11,5 contra 16,5; 12/11), à direita dela. */
const RENAME_PORTS: Readonly<Record<HexRenameKind, { x: number; y: number }>> = { pet: { x: 73.5, y: 11.5 }, especial: { x: 91, y: 11.5 } };

/** Degraus de `tokens.md` §6.1: `nav` 32 no mapa (o encaixe é um destino), `action` 24 nas linhas e no botão, `inline` 20 no saldo. */
const ICON_MAP = 44;
/** Ícone da Porta nas linhas de lista (Seus HEXes 56, Forja 40): maior, sem anel. */
const ICON_OWNED = 56;
const ICON_LIST = 40;
const ICON_ROW = 24;
const ICON_INLINE = 20;
const ICON_COST = 28;

/** Nome legível do VALOR de um item (elemento, família ou alcance). */
export function hexValueName(slot: HexSlot, value: string, isPt: boolean): string {
  if (HEX_ELEMENT_SLOTS.includes(slot)) return elName(value, isPt);
  if (slot === 'coroa') { const c = hexCrownValueCopy(value); return c ? tx(c, isPt) : value; }
  return tx(HEX_STRIKE_COPY[value as HexStrike], isPt);
}

/** Legenda curta: o que a Coroa de efeito/família nova faz, ou o alcance + acabamento do ataque das Luvas (os outros slots não têm). */
function hexLegend(slot: HexSlot, value: string, isPt: boolean): string | null {
  if (slot === 'coroa') { const d = hexCrownValueDesc(value); return d ? tx(d, isPt) : null; }
  return slot === 'luvas' && HEX_STRIKE_LEGEND[value as HexStrike] ? tx(HEX_STRIKE_LEGEND[value as HexStrike], isPt) : null;
}

export default function HexsmithSheet({ language = 'pt-BR', sprite: spriteProp, evolutionStage, skills, petElement, demoCharacterId }: HexsmithSheetProps) {
  const ctx = useGameStateOptional();
  const isPt = language === 'pt-BR';
  const [open, setOpen] = useState<HexSlot | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [forjando, setForjando] = useState(false);
  const [renomear, setRenomear] = useState<HexRenameKind | null>(null);
  /** Resultado da última forja CONFIRMADA pelo servidor (um por forja; `already` não abre). */
  const [resultado, setResultado] = useState<string | null>(null);
  const gs = ctx?.gameState;
  const hx = useMemo(() => sanitizeHexsmith(gs?.hexsmith), [gs?.hexsmith]);
  const over = useMemo(() => hexOverrides(hx), [hx]);
  const orig = useMemo(() => {
    const id = fighterIdentity(evolutionStage ? skills?.[fichaStageOf(evolutionStage)] : undefined, petElement);
    return { coroa: id.especial.familia as string, amuleto: id.especial.elemento, garra: id.basico.elemento, couraca: petElement ?? id.basico.elemento, luvas: '' };
  }, [evolutionStage, skills, petElement]);
  // Quem evoca (companheiro valeria sem a Coroa) ganha o aviso calmo quando a Coroa está equipada; para os demais ele não aparece.
  const companheiroDescansa = useMemo(() => !!gs && hx.equipped.coroa !== undefined && companheiroDoEstado({ ...gs, hexsmith: undefined }) !== null, [gs, hx]);
  const sprite = spriteProp ?? (evolutionStage ? getSpriteForStage(evolutionStage, demoCharacterId) : null);
  if (!ctx || !gs) return null;
  const { setGameState } = ctx;

  const now: Record<HexSlot, string | undefined> = {
    coroa: over.specialFamily, amuleto: over.specialElement, garra: over.basicElement, couraca: over.defenseElement, luvas: over.strike,
  };
  const origName = (slot: HexSlot) => {
    const v = orig[slot];
    if (slot === 'luvas') return tx(HEX_UI.original, isPt);
    if (slot === 'coroa') return hexCrownValueCopy(v) ? hexValueName(slot, v, isPt) : tx(HEX_UI.original, isPt);
    return v ? elName(v, isPt) : tx(HEX_UI.original, isPt);
  };

  // 11/11/2026: renomear é do SERVIDOR (valida, debita HEX_RENAME_COST e grava o nome numa escrita); sem rede, não troca.
  const rename = async (kind: HexRenameKind, nome: string) => {
    if (isDemoMode(gs)) { setAviso(demoRefusalText(isPt)); return; }
    if (forjando) return;
    const saveId = readLocal(STORAGE_KEYS.SAVE_ID);
    if (!saveId) { setAviso(tx(HEX_RENAME_COPY.offline, isPt)); return; }
    setForjando(true);
    setAviso(tx(HEX_RENAME_COPY.working, isPt));
    const r = await cloudHexRename(saveId, gs, kind, nome);
    setForjando(false);
    if (!r.ok) {
      setAviso(tx(r.kind === 'offline' ? HEX_RENAME_COPY.offline : r.kind === 'saldo' ? HEX_RENAME_COPY.noFunds : r.kind === 'rejected' ? HEX_RENAME_COPY.rejected : HEX_RENAME_COPY.failed, isPt));
      return;
    }
    setGameState((prev) => applyServerHexRename(prev, kind, r.nome, !r.already));
    setAviso(null);
    setRenomear(null);
  };

  // §216: a forja é do SERVIDOR (debita e entrega numa escrita). O cliente só aplica o que ele confirmou; sem rede, não forja.
  const forge = async (id: string) => {
    if (isDemoMode(gs)) { setAviso(demoRefusalText(isPt)); return; }
    if (forjando || hexForgeRefusal(gs, id)) return;
    const saveId = readLocal(STORAGE_KEYS.SAVE_ID);
    if (!saveId) { setAviso(tx(HEX_UI.forgeOffline, isPt)); return; }
    setForjando(true);
    setAviso(tx(HEX_UI.forging, isPt));
    const r = await cloudHexForge(saveId, gs, id);
    setForjando(false);
    if (!r.ok) {
      setAviso(tx(r.kind === 'offline' ? HEX_UI.forgeOffline : r.kind === 'saldo' ? HEX_UI.forgeNoFunds : HEX_UI.forgeFailed, isPt));
      return;
    }
    setGameState((prev) => applyServerHexForge(prev, id, !r.already));
    setAviso(tx(HEX_UI.forged, isPt));
    if (!r.already) setResultado(id);
  };

  return (
    <section data-hexsmith aria-label={tx(HEX_UI.title, isPt)} className="sm2-hex">
      {/* 18/11/2026 (dono): a introdução mora atrás do "i" do disco direito da moldura (o mapa ganha o espaço). */}
      <ModalInfo language={language as Language} label={tx(HEX_UI.title, isPt)}><span data-hex-intro>{tx(HEX_UI.intro, isPt)}</span></ModalInfo>
      {companheiroDescansa && <p role="note" data-hex-companion-rests style={sm2Hint}>{tx(HEX_UI.companionRests, isPt)}</p>}

      {/* O MAPA DE SLOTS */}
      <div data-hex-map className="sm2-hex-map">
        {/* O miolo do hexágono das Portas COM HEX equipado (turquesa claro), atrás da placa: o vazado dela mostra o preenchimento. */}
        {HEX_SLOTS.filter((s) => hx.equipped[s] !== undefined).map((s) => (
          <span key={`fill-${s}`} aria-hidden="true" data-hex-fill={s} className="sm2-hex-slot-fill" style={{ left: `${PORTS[s].x}%`, top: `${PORTS[s].y - 0.15}%` }} />
        ))}
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
        {(['pet', 'especial'] as const).map((k) => (
          <HexRenameButton key={k} kind={k} x={RENAME_PORTS[k].x} y={RENAME_PORTS[k].y} label={tx(HEX_RENAME_COPY[k].btn, isPt)} onClick={() => { setAviso(null); setRenomear(k); }} />
        ))}
      </div>

      {/* O CÓDIGO HEX legível — sempre aberto, sem seta (dono, 22/11/2026) */}
      <section data-hex-code-block className="sm2-hex-code-block">
        <h3 className="sm2-conta-t">{tx(HEX_UI.code, isPt)}</h3>
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
      </section>

      {renomear && (
        <HexRenameModal key={renomear} kind={renomear} language={language as Language} gs={gs} aviso={aviso} ocupado={forjando}
          atual={renomear === 'pet' ? gs.soulmonMeta?.petName ?? '' : gs.especialNome ?? ''}
          onClose={() => { setRenomear(null); setAviso(null); }} onConfirm={(nome) => void rename(renomear, nome)} />
      )}

      {open && (
        <SlotPanel slot={open} isPt={isPt} language={language} gs={gs} aviso={aviso}
          onClose={() => setOpen(null)}
          onForge={forge}
          onEquip={(id) => setGameState((prev) => equipHexItem(prev, id))}
          onClear={() => setGameState((prev) => unequipHexSlot(prev, open))} />
      )}
      {resultado && (() => {
        const it = parseHexItem(resultado);
        if (!it) return null;
        const nome = hexValueName(it.slot, it.value, isPt);
        return (
          <ForgeResultModal language={language as Language} title={tx(HEX_UI.resultTitle, isPt)} name={nome}
            effect={hexLegend(it.slot, it.value, isPt) ?? tx(HEX_SLOT_COPY[it.slot].effect, isPt)}
            art={<SlotFace slot={it.slot} value={it.value} size={ICON_OWNED} />}
            closeLabel={tx(HEX_UI.resultClose, isPt)}
            primary={{ label: tx(HEX_UI.equipNow, isPt), onClick: () => { setGameState((prev) => equipHexItem(prev, resultado)); setResultado(null); } }}
            onClose={() => setResultado(null)} />
        );
      })()}
    </section>
  );
}

/**
 * O rosto da porta — UM ícone só: com elemento, o ícone do ELEMENTO (já vem na cor dele); coroa/luvas com valor, a arte da porta
 * cheia; vazia, a mesma arte apagada (`data-empty`). Sem arte na pasta → glifo SVG (fallback). Coroa COM família → a coroa
 * daquela família (`resolveHexCrownArt`: `coroa-<familia>.png`, e sem ela a coroa única); a porta vazia segue na coroa única.
 */
function SlotFace({ slot, value, size }: { slot: HexSlot; value?: string; size: number }) {
  if (value && HEX_ELEMENT_SLOTS.includes(slot)) {
    const chip = resolveHexChipArt(value);
    if (chip) return <img src={chip} alt="" aria-hidden="true" width={size} height={size} draggable={false} data-hex-chip={value} />;
    return <ElementIcon id={value} size={size} />;
  }
  const art = slot === 'coroa' && value ? resolveHexCrownArt(value) : resolveHexSlotArt(slot);
  if (art) return <img src={art} alt="" aria-hidden="true" width={size} height={size} className="sm2-hex-art" data-empty={!value} data-hex-crown={slot === 'coroa' && value ? value : undefined} />;
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
  const [status, setStatus] = useState('');
  const refusalId = useId();
  // O voltar do SISTEMA (Android/popstate) desfaz só ESTE nível (16/11/2026): sem a camada, ele fecharia a Hexsmith inteira por baixo.
  useBackLayer(true, onClose);
  const hx = sanitizeHexsmith(gs.hexsmith);
  const isEl = HEX_ELEMENT_SLOTS.includes(slot);
  const mine = hx.owned.filter((id) => parseHexItem(id)!.slot === slot);
  const equipped = hx.equipped[slot];
  const bits = spendableBits(gs);
  const frags = gs.equipment?.fragments ?? 0;

  const catalog = useMemo(() => {
    const values = isEl
      ? elementsMatchingBases(bases).filter((v) => isPotionUnlocked(v, gs.defeatedElements))
      : hexValuesOf(slot);
    const ordenado = values
      .map((v) => hexItemId(slot, v))
      .filter((id) => !hx.owned.includes(id))
      .sort((a, b) => Number(!!hexForgeRefusal(gs, a)) - Number(!!hexForgeRefusal(gs, b)));
    // 24/11/2026 (dono): o item cujo ELEMENTO o jogador já tem em POÇÃO sobe ao topo (Bits não entra na regra; ordem estável).
    const comPocao = new Set(values.filter((v) => (gs.foodInventory?.[potionKey(v)] ?? 0) > 0));
    return isEl ? ordenarPorRelevancia(ordenado, (id) => ingredienteRelevante({ tipo: 'pocao', elemento: parseHexItem(id)!.value }, comPocao)) : ordenado;
  }, [slot, isEl, bases, gs, hx.owned]);

  const sel = picked && catalog.includes(picked) ? picked : null;
  const selRefusal = sel ? hexForgeRefusal(gs, sel) : undefined;
  const selValue = sel ? parseHexItem(sel)!.value : '';
  const selName = sel ? hexValueName(slot, selValue, isPt) : '';

  return (
    <ModalSheet open title={`${tx(HEX_SLOT_COPY[slot].port, isPt)} · ${tx(HEX_SLOT_COPY[slot].effect, isPt)}`} onClose={onClose} onBack={onClose} language={language as Language}
      info={{ label: tx(HEX_SLOT_COPY[slot].port, isPt), content: <span data-hex-slot-info>{tx(HEX_SLOT_COPY[slot].desc, isPt)}</span> }}
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
        {/* 09/11/2026 (dono): embaixo do título, o que a Porta FAZ — mesma fonte, branco, bold, menor. */}
        <p data-hex-desc={slot} className="sm2-hex-desc">{tx(HEX_SLOT_COPY[slot].desc, isPt)}</p>
        {slot === 'coroa' && equipped && companheiroDoEstado({ ...gs, hexsmith: undefined }) !== null && (
          <p role="note" data-hex-companion-rests style={sm2Hint}>{tx(HEX_UI.companionRests, isPt)}</p>
        )}
        {aviso && <p role="status" data-hex-aviso style={sm2Text}>{aviso}</p>}
        <span className="sm2-sr-only" role="status" data-hex-equip-status>{status}</span>

        <section aria-label={tx(HEX_UI.owned, isPt)} className="sm2-hex-group">
          <h3 style={{ ...sm2Label, margin: 0 }}>{tx(HEX_UI.owned, isPt)}</h3>
          {mine.length === 0 ? <p style={sm2Hint} data-hex-none-owned>{tx(HEX_UI.noneOwned, isPt)}</p> : (
            <ul className="sm2-hex-list">
              {mine.map((id) => {
                const v = parseHexItem(id)!.value;
                const on = equipped === id;
                const name = hexValueName(slot, v, isPt);
                // 13/11/2026 (dono): UM botão grande por HEX possuído, que alterna Equipar ⇄ Desequipar ali mesmo (a linha
                // "Esvaziar a porta" saiu). Equipar outro com um já equipado TROCA (`equipHexItem`); o anterior segue na posse.
                return (
                  <li key={id} data-hex-owned={id}>
                    <div className="sm2-hex-row sm2-hex-owned-row" data-on={on} data-hex-is-equipped={on || undefined}>
                      <SlotFace slot={slot} value={v} size={ICON_OWNED} />
                      <span className="sm2-hex-row-name">
                        <span className="sm2-hex-row-title">{name}{on && <span data-hex-seal aria-hidden="true" className="sm2-hex-seal"><Icon name="check" size={ICON_INLINE} fill={1} tone="inherit" />{tx(HEX_UI.equipped, isPt)}</span>}</span>
                        {hexLegend(slot, v, isPt) && <small data-hex-legend style={{ display: 'block', fontWeight: 400, opacity: 0.8 }}>{hexLegend(slot, v, isPt)}</small>}
                      </span>
                      {on ? (
                        <button type="button" data-hex-unequip={id}
                          onClick={() => { onClear(); setStatus(`${name}: ${tx(HEX_UI.unequippedMsg, isPt)}`); }}
                          aria-label={`${tx(HEX_UI.unequip, isPt)}: ${name}`}
                          className="sm2-hex-equip-btn" style={{ ...sm2Button('outline', false, 'md'), padding: '0 var(--sm2-space-4)', fontWeight: 700 }} data-state="equipped">
                          {tx(HEX_UI.unequip, isPt)}
                        </button>
                      ) : (
                        <button type="button" data-hex-equip={id}
                          onClick={() => { onEquip(id); setStatus(`${name}: ${tx(HEX_UI.equippedMsg, isPt)}`); }}
                          aria-label={`${tx(HEX_UI.equip, isPt)}: ${name}`}
                          className="sm2-hex-equip-btn" style={{ ...sm2Button('primary', false, 'md'), padding: '0 var(--sm2-space-4)', fontWeight: 700 }} data-state="idle">
                          {tx(HEX_UI.equip, isPt)}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-label={tx(HEX_UI.catalog, isPt)} className="sm2-hex-group">
          <p data-hex-balance className="sm2-hex-balance">
            <span>{tx(HEX_UI.balance, isPt)}</span>
            <BitsAmount value={bits} size={ICON_INLINE} unit={tx(HEX_UI.bitsEarned, isPt)} />
            <span aria-hidden="true">{tx(HEX_UI.bitsEarned, isPt)}</span>
          </p>
          {isEl && (
            <>
              <ElementBaseSlots slots={bases} isPt={isPt} onChange={(i, id) => { setBases((v) => v.map((x, j) => (j === i ? id : x))); setPicked(null); }} />
            </>
          )}
          {catalog.length === 0 ? <p style={sm2Hint} data-hex-none>{tx(HEX_UI.noMatch, isPt)}</p> : (
            <div data-hex-catalog-table className="sm2-hex-table">
              <div className="sm2-hex-thead" aria-hidden="true"><span>{tx(HEX_UI.colItem, isPt)}</span><span>{tx(HEX_UI.colCost, isPt)}</span></div>
            <ul data-hex-catalog className="sm2-hex-list">
              {catalog.map((id) => {
                const v = parseHexItem(id)!.value;
                const c = hexCost(id)!;
                const ok = !hexForgeRefusal(gs, id);
                const pot = isEl ? gs.foodInventory[potionKey(v)] ?? 0 : 0;
                const on = sel === id;
                const art = isEl ? potionArt(v) : undefined;
                const comp = isEl ? elementComposition(v) ?? [v] : [];
                const potLabel = tx(HEX_UI.potionTipLabel, isPt);
                const parts: ReactNode[] = [];
                const tipBtn = (label: string, trigger: ReactNode, tip: string, attr: string) => (
                  <InfoTip language={language as Language} label={label} align="right"
                    style={{ minWidth: 32, minHeight: 32, color: 'inherit' }} trigger={trigger}>
                    <span {...{ [attr]: true }}>{emphasizeSoulFragment(tip)}</span>
                  </InfoTip>);
                if (c.potions > 0) parts.push(
                  <span key="pot" data-hex-cost-potion={v} data-have={pot >= c.potions} className="sm2-hex-cost-cell">
                    {tipBtn(`${potLabel}: ${elName(v, isPt)}`,
                      art ? <img src={art} alt="" aria-hidden="true" width={ICON_COST} height={ICON_COST} draggable={false} data-hex-potion-art /> : <ElementIcon id={v} size={ICON_COST} />,
                      potionHowTo(isPt, elName(v, isPt), [...new Set(comp)].length > 1 ? [...new Set(comp)].map((x) => elName(x, isPt)) : [], POTION_COSTS), 'data-hex-potion-tip')}
                    <span className="sm2-num" data-hex-potion-qty>{pot}/{c.potions}</span>
                  </span>);
                if (c.fragments > 0) parts.push(
                  <span key="frag" data-hex-cost-fragments data-have={frags >= c.fragments} className="sm2-hex-cost-cell">
                    {tipBtn(hexCostTipLabel('fragments', isPt), <SoulFragmentIcon size={ICON_COST} label={tx(HEX_UI.fragments, isPt)} />, hexCostHowTo('fragments', isPt), 'data-hex-fragments-tip')}
                    <span className="sm2-num">{frags}/{c.fragments}</span>
                  </span>);
                parts.push(
                  <span key="bits" data-hex-cost-bits data-have={bits >= c.bits} className="sm2-hex-cost-cell">
                    {tipBtn(hexCostTipLabel('bits', isPt), <BitsIcon size={ICON_COST} />, hexCostHowTo('bits', isPt), 'data-hex-bits-tip')}
                    <span className="sm2-num"><span className="sm2-sr-only">Bits </span>{c.bits}</span>
                  </span>);
                return (
                  <li key={id} className="sm2-hex-line" data-on={on} data-ok={ok}>
                    <button type="button" data-hex-item={id} data-hex-affordable={ok} aria-pressed={on} className="sm2-hex-row sm2-hex-pick"
                      data-on={on} data-ok={ok} onClick={() => setPicked(on ? null : id)}>
                      {on ? <Icon name="check" size={ICON_ROW} fill={1} tone="inherit" /> : <SlotFace slot={slot} value={v} size={ICON_LIST} />}
                      <span className="sm2-hex-row-name">{hexValueName(slot, v, isPt)}{hexLegend(slot, v, isPt) && <small data-hex-legend style={{ display: 'block', fontWeight: 400, opacity: 0.8 }}>{hexLegend(slot, v, isPt)}</small>}</span>
                    </button>
                    <div className="sm2-hex-cost" data-hex-cost>
                      {parts.flatMap((x, i) => (i ? [<span key={`p${i}`} aria-hidden="true" className="sm2-hex-plus">+</span>, x] : [x]))}
                    </div>
                  </li>
                );
              })}
            </ul>
            </div>
          )}
        </section>
      </div>
    </ModalSheet>
  );
}
