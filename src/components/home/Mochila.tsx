/**
 * A MOCHILA — minimal-ui F2 (Home, abordagem B), mock aprovado
 * `propostas/home/mock-sleep.html`.
 *
 * Junta as duas superfícies antigas de item (a folha "Alimentar" do deck e a
 * pastinha `ItemsWindow`) numa folha de baixo com DUAS abas:
 *  · **Comida e chips** — a comida comum + os chips de atributo;
 *  · **Especiais** — os consumíveis da masmorra (coraçãozinho e cia.);
 *  · **Materiais** — os ingredientes de aprimoramento (somente leitura).
 * Os dados são o `foodInventory` do save; nada é inventado aqui.
 *
 * **O item se usa ARRASTANDO até o pet** (decisão 3 do dono): o fantasma do
 * item segue o dedo, a folha DESCE enquanto se arrasta (para o pet aparecer) e
 * soltar sobre o pet chama `onUse` — que é o `handleFeed` do App, dono da regra
 * (teto por hora, recusa de barriga cheia, cura, teto diário dos especiais). Soltar
 * fora não usa nada. **Tocar sem arrastar não usa**: só seleciona.
 *
 * A alternativa acessível (teclado, leitor de tela, quem não consegue
 * arrastar): o item selecionado — por toque OU por foco — mostra um botão
 * "Usar"/"Use" logo abaixo da grade, com o nome do item no rótulo.
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type RefObject, type PointerEvent as ReactPointerEvent } from 'react';
import type { Language } from '../../utils/i18n';
import { SPECIAL_ITEMS } from '../../utils/shop';
import { isPremiumKey } from '../../utils/premiumFood';
import { dishIdOfKey } from '../../utils/dishItems';
import { dishById } from '../../utils/restaurantMenu';
import { isReduceChipKey } from '../../utils/shop';
import { ITEM_ART } from '../../utils/itemArt';
import { MaterialIcon } from '../MaterialIcon';
import { EXE_SUFFIX, getFileName, getFoodDesc } from '../ItemsWindow';
import { InfoTip } from '../ui/InfoTip';
import { Icon } from '../ui/Icon';
import { ModalFrame } from '../ui/ModalFrame';
import { MOLDURA_MODAL } from '../nav/AreaSheet';
import { CristalChama } from '../ui/CristalChama';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { isDemoBlockedLot, demoRefusalText } from '../../utils/demoMode';
import type { BuildingId } from '../../utils/gates';

/** Distância (px) que separa um TOQUE de um ARRASTO. Abaixo disto é toque, e
 *  toque nunca usa o item. */
export const DRAG_THRESHOLD_PX = 8;
/** Folga (px) em volta do alvo do pet: o dedo cobre o item, e o alvo do
 *  carinho é do tamanho exato do sprite. */
export const DROP_SLOP_PX = 12;

export type MochilaAba = 'comida' | 'especiais';
/** As abas visíveis: as duas de estoque + os materiais (somente leitura, não são arrastáveis). */
export type MochilaAbaVista = MochilaAba | 'materiais';

/**
 * Separa o inventário nas duas abas. Pura, para teste. Só entra o que tem
 * estoque (`n > 0`): um item "×0" é um convite a tocar em algo que não faz
 * nada. Chip é consumível especial no catálogo, mas mora na aba de comida
 * (mock aprovado: "Comida e chips").
 */
export function mochilaTabs(inv: Record<string, number>): Record<MochilaAba, Array<[string, number]>> {
  const comida: Array<[string, number]> = [];
  const especiais: Array<[string, number]> = [];
  for (const [emoji, n] of Object.entries(inv)) {
    if (!(n > 0)) continue;
    const esp = SPECIAL_ITEMS[emoji];
    if (esp && esp.kind !== 'chip' && esp.kind !== 'premium' && esp.kind !== 'dish') especiais.push([emoji, n]);
    else comida.push([emoji, n]);
  }
  // Comida comum antes dos chips; dentro de cada grupo, o maior estoque antes.
  const peso = (e: string) => (SPECIAL_ITEMS[e]?.kind === 'chip' ? 3 : SPECIAL_ITEMS[e]?.kind === 'dish' ? 2 : SPECIAL_ITEMS[e]?.kind === 'premium' ? 1 : 0);
  comida.sort((a, b) => peso(a[0]) - peso(b[0]) || b[1] - a[1]);
  especiais.sort((a, b) => b[1] - a[1]);
  return { comida, especiais };
}

/** O ponto está sobre o retângulo (com folga)? */
export function pontoSobre(x: number, y: number, r: { left: number; right: number; top: number; bottom: number }, folga = DROP_SLOP_PX): boolean {
  return x >= r.left - folga && x <= r.right + folga && y >= r.top - folga && y <= r.bottom + folga;
}

export interface MochilaProps {
  open: boolean;
  onClose: () => void;
  foodInventory: Record<string, number>;
  language: Language;
  /** Usar o item — o `handleFeed` do App, sempre. */
  onUse: (emoji: string) => void;
  /** O alvo de soltar: o botão do carinho, que tem a caixa do pet na tela. */
  petTargetRef: RefObject<HTMLElement | null>;
  /** O item arrastado entrou/saiu de cima do pet — o pet acende. */
  onTargetChange?: (over: boolean) => void;
  /** Nome do pet para a dica ("arraste até o Bito"). */
  petName?: string;
  /** Materiais de aprimoramento (`buildingQuests.materials`) — SOMENTE LEITURA,
   *  vistos na aba Materiais. Nomes e ícones vêm de `buildingQuestsCopy`. */
  materials?: Partial<Record<string, number>>;
  /** Os OUTROS recursos que o jogo concede e que moram fora de `buildingQuests` (10/11/2026): Fragmento do Soulsmith (`equipment.fragments`),
   *  Fragmento de Boss (`bossShards`). SOMENTE LEITURA, vistos na aba Materiais. */
  extras?: { fragments?: number; bossShards?: number };
  /** O "Ir lá" do material: leva ao prédio/missão que o dá. O App fecha a Mochila e navega (`handleMaterialGoTo`). */
  onGoToBuilding?: (building: BuildingId) => void;
  /** DEMO LOCAL: o prédio social bloqueado na demo não recebe o "Ir lá". */
  demo?: boolean;
}

interface Arrasto {
  emoji: string;
  x0: number;
  y0: number;
  ativo: boolean;
  sobre: boolean;
}

function coords(e: { clientX?: number; clientY?: number }): [number, number] {
  return [Number(e.clientX ?? 0), Number(e.clientY ?? 0)];
}

/** Item que vira DISQUETE (18/11/2026, dono: "esse lance do disquete é só para as comidas"): comida comum, prato e comida premium da aba Comida.
 *  Chip (inclusive o de redução) usa o slot normal com a arte do item; Especiais e Materiais também. */
export function ehDisquete(emoji: string): boolean {
  const k = SPECIAL_ITEMS[emoji]?.kind;
  if (k === 'chip' || isReduceChipKey(emoji)) return false;
  return !k || k === 'dish' || k === 'premium';
}

/** Slots vazios (decorativos) que completam a grade: no mínimo 2 fileiras de 4, sempre fileira cheia (referência ref3). */
export function slotsVazios(n: number, colunas = 4, minimo = 8): number {
  const alvo = Math.max(minimo, Math.ceil(n / colunas) * colunas);
  return Math.max(0, alvo - n);
}

const ABAS: ReadonlyArray<{ id: MochilaAbaVista; pt: string; en: string }> = [
  { id: 'comida', pt: 'Comida e chips', en: 'Food and chips' },
  { id: 'especiais', pt: 'Especiais', en: 'Specials' },
  { id: 'materiais', pt: 'Materiais', en: 'Materials' },
];

/** Janela da trava do botão "Usar": dois toques dentro dela gastam um item só. */
export const USAR_TRAVA_MS = 400;

export function Mochila({
  open, onClose, foodInventory, language, onUse, petTargetRef, onTargetChange, petName, materials, extras, onGoToBuilding, demo,
}: MochilaProps) {
  const isPt = language === 'pt-BR';
  const [aba, setAba] = useState<MochilaAbaVista>('comida');
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [fantasma, setFantasma] = useState<{ emoji: string; x: number; y: number } | null>(null);
  const arrastoRef = useRef<Arrasto | null>(null);
  /** O `click` que o navegador dispara depois de um arrasto NÃO é um toque. */
  const engolirCliqueRef = useRef(false);
  /**
   * Trava do botão "Usar" (QA, 31/10/2026): um toque duplo rápido chamava
   * `onUse` duas vezes e gastava 2 itens. Guarda o último uso por item; dentro
   * de `USAR_TRAVA_MS` o segundo toque é engolido. Toque espaçado usa normal.
   */
  const ultimoUsoRef = useRef<Map<string, number>>(new Map());
  const usarComTrava = useCallback((emoji: string) => {
    const agora = Date.now();
    const antes = ultimoUsoRef.current.get(emoji);
    if (antes !== undefined && agora - antes < USAR_TRAVA_MS) return;
    ultimoUsoRef.current.set(emoji, agora);
    onUse(emoji);
  }, [onUse]);
  const limparRef = useRef<(() => void) | null>(null);
  const dialogRef = useDialogA11y<HTMLDivElement>(open, onClose);

  // Dono único dos nomes/ícones: `buildingQuestsCopy` (fora da entrada, então
  // carrega sob demanda — só quando a aba Materiais abre). O nome do prédio vem
  // do mesmo lugar que o Mapa lê (`nameOf`), também sob demanda.
  type Copia = { materiais: typeof import('../../utils/buildingQuestsCopy').MATERIALS; nomeDoPredio: (id: BuildingId, l: Language) => string; guia: typeof import('../../utils/materialGuide') };
  const [copia, setCopia] = useState<Copia | null>(null);
  useEffect(() => {
    if (!open || aba !== 'materiais' || copia) return;
    let vivo = true;
    void Promise.all([import('../../utils/buildingQuestsCopy'), import('../nav/BuildingQuestList'), import('../../utils/materialGuide')])
      .then(([c, l, g]) => { if (vivo) setCopia({ materiais: c.MATERIALS, nomeDoPredio: l.nameOf, guia: g }); }).catch(() => {});
    return () => { vivo = false; };
  }, [open, aba, copia]);
  /* REGRA ESPECÍFICA desta categoria (ingrediente-recurso, pedido do dono 07/10/2026): o material APARECE SEMPRE, com ×0 — é a
     única forma de a pessoa descobrir ONDE conseguir. Os outros especiais seguem só com estoque (`mochilaTabs`). */
  const listaMateriais = copia?.materiais ?? [];
  const [matAberto, setMatAberto] = useState<string | null>(null);
  /** Quantidade de cada recurso extra. As Essências dos elementos NÃO ficam na Bolsa (12/11/2026): só no Laboratório › Arquivo. */
  const extraQty = (id: string): number => id === 'soulsmith-fragment' ? (extras?.fragments ?? 0) : (extras?.bossShards ?? 0);
  const popRef = useRef<HTMLDivElement | null>(null);
  // O tooltip fecha com Esc (sem fechar a folha) e com toque fora dele.
  useEffect(() => {
    if (!matAberto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      e.preventDefault();
      setMatAberto(null);
    };
    const onDown = (e: Event) => {
      const t = e.target as Element | null;
      if (t?.closest?.('[data-material-pop], [data-material-btn]')) return;
      setMatAberto(null);
    };
    window.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onDown, true);
    return () => { window.removeEventListener('keydown', onKey, true); document.removeEventListener('pointerdown', onDown, true); };
  }, [matAberto]);
  useEffect(() => { if (!open || aba !== 'materiais') setMatAberto(null); }, [open, aba]);

  const abas = mochilaTabs(foodInventory);
  const lista = aba === 'materiais' ? [] : abas[aba];

  // Fechou: nada fica selecionado nem arrastando.
  useEffect(() => {
    if (open) return;
    setSelecionado(null);
    setFantasma(null);
    // Fechou NO MEIO de um arrasto sobre o pet (Esc/voltar): sem avisar, o pet
    // ficava aceso para sempre — ninguém mais chamava `onTargetChange(false)`.
    if (arrastoRef.current) {
      arrastoRef.current = null;
      onTargetChange?.(false);
    }
    limparRef.current?.();
  }, [open, onTargetChange]);
  useEffect(() => () => limparRef.current?.(), []);

  // O selecionado saiu do estoque (usou o último): some a barra de "Usar".
  const qtdSelecionado = selecionado ? (foodInventory[selecionado] ?? 0) : 0;
  const selecionadoVisivel = selecionado && qtdSelecionado > 0 && lista.some(([e]) => e === selecionado)
    ? selecionado : null;

  const terminar = useCallback((usar: boolean) => {
    const a = arrastoRef.current;
    arrastoRef.current = null;
    limparRef.current?.();
    setFantasma(null);
    onTargetChange?.(false);
    if (a?.ativo) {
      engolirCliqueRef.current = true;
      if (usar && a.sobre) onUse(a.emoji);
    }
  }, [onTargetChange, onUse]);

  const onItemPointerDown = (e: ReactPointerEvent<HTMLButtonElement>, emoji: string) => {
    if ((foodInventory[emoji] ?? 0) <= 0) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const [x0, y0] = coords(e);
    arrastoRef.current = { emoji, x0, y0, ativo: false, sobre: false };
    engolirCliqueRef.current = false;

    const mover = (ev: Event) => {
      const a = arrastoRef.current;
      if (!a) return;
      const [x, y] = coords(ev as unknown as PointerEvent);
      if (!a.ativo) {
        if (Math.hypot(x - a.x0, y - a.y0) < DRAG_THRESHOLD_PX) return;
        a.ativo = true;
      }
      if (ev.cancelable) ev.preventDefault();
      setFantasma({ emoji: a.emoji, x, y });
      const alvo = petTargetRef.current?.getBoundingClientRect();
      const sobre = !!alvo && pontoSobre(x, y, alvo);
      if (sobre !== a.sobre) {
        a.sobre = sobre;
        onTargetChange?.(sobre);
      }
    };
    const soltar = () => terminar(true);
    const cancelar = () => terminar(false);
    limparRef.current?.();
    document.addEventListener('pointermove', mover, { passive: false });
    document.addEventListener('pointerup', soltar);
    document.addEventListener('pointercancel', cancelar);
    limparRef.current = () => {
      document.removeEventListener('pointermove', mover);
      document.removeEventListener('pointerup', soltar);
      document.removeEventListener('pointercancel', cancelar);
      limparRef.current = null;
    };
  };

  // Abas com setas do teclado (padrão ARIA de tabs: foco itinerante, Home/End nas pontas).
  const abaRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const onAbasKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    const i = ABAS.findIndex(t => t.id === aba);
    let j = -1;
    if (e.key === 'ArrowRight') j = (i + 1) % ABAS.length;
    else if (e.key === 'ArrowLeft') j = (i - 1 + ABAS.length) % ABAS.length;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = ABAS.length - 1;
    if (j < 0) return;
    e.preventDefault();
    setAba(ABAS[j].id);
    setSelecionado(null);
    abaRefs.current[ABAS[j].id]?.focus();
  };

  if (!open) return null;

  const arrastando = fantasma !== null;
  const nomePet = petName || 'Soulmon';
  const infoLabel = isPt ? 'Como usar um item' : 'How to use an item';
  const infoTexto = isPt ? `Arraste até o ${nomePet} pra usar` : `Drag onto ${nomePet} to use`;
  const lang = isPt ? 'pt-BR' as const : 'en-US' as const;

  const corpo = (
    <>
      {/* O CRISTAL-CHAMA (arte aprovada, 18/11/2026) no encaixe do topo: o "puxador" da pasta. Decorativo. */}
      {MOLDURA_MODAL && <CristalChama />}
      {!MOLDURA_MODAL && <div className="sm3-mochila-alca" aria-hidden="true" />}
      {/* Fechar (X redondo, alvo 44) à ESQUERDA + título no centro; o "i" mora no ornamento da moldura (`ModalFrame info`).
          Sem moldura (kill-switch), o "i" volta para a linha do título. */}
      <div className="sm3-mochila-head">
        <button type="button" className="sm3-files-fechar" onClick={onClose} aria-label={isPt ? 'Fechar' : 'Close'}>
          <Icon name="close" size={20} tone="inherit" />
        </button>
        <h2 className="sm3-mochila-titulo">{isPt ? 'Arquivos' : 'Files'}</h2>
        {!MOLDURA_MODAL && (
          <InfoTip language={language} label={infoLabel} align="right">{infoTexto}</InfoTip>
        )}
      </div>

        <div className="sm3-mochila-abas" role="tablist" aria-label={isPt ? 'Tipos de item' : 'Item types'} onKeyDown={onAbasKeyDown}>
          {ABAS.map(t => (
            <button
              key={t.id}
              ref={el => { abaRefs.current[t.id] = el; }}
              type="button"
              role="tab"
              id={`sm3-aba-${t.id}`}
              aria-selected={aba === t.id}
              aria-controls={`sm3-painel-${t.id}`}
              tabIndex={aba === t.id ? 0 : -1}
              data-on={aba === t.id || undefined}
              onClick={() => { setAba(t.id); setSelecionado(null); }}
            >
              {isPt ? t.pt : t.en}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`sm3-painel-${aba}`}
          aria-labelledby={`sm3-aba-${aba}`}
          className="sm3-mochila-painel"
          tabIndex={0}
        >
          {lista.length === 0 && aba === 'comida' ? (
            <p className="sm3-mochila-vazia" data-mochila-vazia>
              {isPt
                ? 'Nada por aqui. Complete tarefas pra ganhar comida.'
                : 'Nothing here yet. Complete tasks to earn food.'}
            </p>
          ) : (
            lista.length > 0 && <div className="sm3-mochila-grade">
              {lista.map(([emoji, n]) => {
                const nome = getFileName(emoji, language);
                const disq = aba === 'comida' && ehDisquete(emoji);
                return (
                  <button
                    key={emoji}
                    type="button"
                    className="sm3-item"
                    data-item={emoji}
                    data-disquete={disq || undefined}
                    data-on={selecionadoVisivel === emoji || undefined}
                    aria-pressed={selecionadoVisivel === emoji}
                    aria-label={`${nome} × ${n}`}
                    onPointerDown={(e) => onItemPointerDown(e, emoji)}
                    onFocus={() => setSelecionado(emoji)}
                    onClick={() => {
                      // Tocar sem arrastar NÃO usa: só seleciona (e mostra "Usar").
                      if (engolirCliqueRef.current) { engolirCliqueRef.current = false; return; }
                      setSelecionado(emoji);
                    }}
                  >
                    {/* COMIDA = DISQUETE (a arte da comida no rótulo); o resto = slot com a arte do item. Selecionado = a versão "-sel" da peça. */}
                    <span className="sm3-item-slot" aria-hidden="true" data-disquete={disq || undefined}>
                      <span className="sm3-item-arte" data-premium={isPremiumKey(emoji) || undefined} data-reduce={isReduceChipKey(emoji) || undefined}>
                        {ITEM_ART[emoji] ? <img src={ITEM_ART[emoji]} alt="" width={32} height={32} draggable={false} /> : dishIdOfKey(emoji) ? dishById(dishIdOfKey(emoji) ?? '')?.icon : null}
                      </span>
                    </span>
                    <span className="sm3-item-nome">{nome.endsWith(EXE_SUFFIX) ? <>{nome.slice(0, -EXE_SUFFIX.length)}<wbr /><span className="sm3-item-ext">{EXE_SUFFIX}</span></> : nome}</span>
                    <small className="sm2-num">×{n}</small>
                  </button>
                );
              })}
              {Array.from({ length: slotsVazios(lista.length) }, (_, k) => (
                <span key={`vazio-${k}`} className="sm3-item-vazio" aria-hidden="true" data-slot-vazio><span className="sm3-item-slot" /></span>
              ))}
            </div>
          )}

          {aba === 'especiais' && lista.length === 0 && (
            <p className="sm3-mochila-vazia" data-mochila-vazia>
              {isPt ? 'Nenhum item especial ainda. Os especiais vêm da Fenda.' : 'No special items yet. Specials come from the Rift.'}
            </p>
          )}

          {aba === 'materiais' && listaMateriais.length > 0 && (
            <section className="sm3-materiais" data-mochila-materiais aria-label={isPt ? 'Materiais' : 'Materials'}>
              <h3 className="sm3-materiais-titulo sm2-sr-only">{isPt ? 'Materiais' : 'Materials'}</h3>
              <ul className="sm3-materiais-lista">
                {listaMateriais.map(m => {
                  const n = materials?.[m.id] ?? 0;
                  const nome = isPt ? m.namePt : m.nameEn;
                  const aberto = matAberto === m.id;
                  return (
                    <li key={m.id} data-material={m.id}>
                      {/* Material no SLOT da grade (modal Files, 18/11/2026), como os demais itens; só leitura. */}
                      <button type="button" className="sm3-material-btn" data-material-btn={m.id} aria-expanded={aberto}
                        aria-controls={aberto ? 'sm3-material-pop' : undefined} aria-label={`${nome} × ${n}`}
                        onClick={() => setMatAberto(aberto ? null : m.id)}>
                        <span aria-hidden="true" className="sm3-item-slot">
                          <span className="sm3-material-icone"><MaterialIcon id={m.id} emoji={m.icon} size={32} /></span>
                        </span>
                        <span className="sm3-item-nome">{nome}</span>
                        <small className="sm2-num">×{n}</small>
                      </button>
                    </li>
                  );
                })}
                {/* Os outros recursos (Fragmento do Soulsmith, Fragmento de Boss, Essências): antes não tinham lugar em lista nenhuma. */}
                {copia && copia.guia.EXTRA_MATERIALS.map(x => {
                  const n = extraQty(x.id);
                  const nome = isPt ? x.namePt : x.nameEn;
                  const aberto = matAberto === x.id;
                  return (
                    <li key={x.id} data-material={x.id} data-material-extra>
                      <button type="button" className="sm3-material-btn" data-material-btn={x.id} aria-expanded={aberto}
                        aria-controls={aberto ? 'sm3-material-pop' : undefined} aria-label={`${nome} × ${n}`}
                        onClick={() => setMatAberto(aberto ? null : x.id)}>
                        <span aria-hidden="true" className="sm3-item-slot"><span className="sm3-material-icone">{x.icon}</span></span>
                        <span className="sm3-item-nome">{nome}</span>
                        <small className="sm2-num">×{n}</small>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {matAberto && copia && (() => {
                const extra = copia.guia.EXTRA_MATERIALS.find(x => x.id === matAberto);
                if (extra) {
                  const g = copia.guia.guideOfExtra(extra.id, isPt);
                  const nome = isPt ? extra.namePt : extra.nameEn;
                  return (
                    <div ref={popRef} id="sm3-material-pop" className="sm3-material-pop" data-material-pop={extra.id} role="group" aria-label={nome}>
                      <p className="sm3-material-pop-nome"><span aria-hidden="true">{extra.icon}</span> {nome} <span className="sm2-num">×{extraQty(extra.id)}</span></p>
                      <p className="sm3-material-pop-texto" data-material-where><strong>{isPt ? 'Encontrado em' : 'Found at'}</strong> {g.sources}</p>
                      {g.uses.length > 0
                        ? <p className="sm3-material-pop-texto" data-material-use><strong>{isPt ? 'Usar em' : 'Use'}</strong> {g.uses.join(', ')}</p>
                        : <p className="sm3-material-pop-texto" data-material-use data-material-no-use>{g.usoAinda}</p>}
                    </div>
                  );
                }
                const m = listaMateriais.find(x => x.id === matAberto)!;
                const nome = isPt ? m.namePt : m.nameEn;
                const lugar = copia.nomeDoPredio(m.building, language);
                const [area, lote] = m.building.split('.');
                const bloqueado = !!demo && isDemoBlockedLot(area, lote);
                const g = copia.guia.guideOfMaterial(m.id, isPt, lugar);
                return (
                  <div ref={popRef} id="sm3-material-pop" className="sm3-material-pop" data-material-pop={m.id} role="group" aria-label={nome}>
                    <p className="sm3-material-pop-nome"><MaterialIcon id={m.id} emoji={m.icon} size={20} /> {nome} <span className="sm2-num">×{materials?.[m.id] ?? 0}</span></p>
                    <p className="sm3-material-pop-texto" data-material-where><strong>{isPt ? 'Encontrado em' : 'Found at'}</strong> {g.sources}</p>
                    {g.uses.length > 0
                      ? <p className="sm3-material-pop-texto" data-material-use><strong>{isPt ? 'Usar em' : 'Use'}</strong> {g.uses.join(', ')}</p>
                      : <p className="sm3-material-pop-texto" data-material-use data-material-no-use>{g.usoAinda}</p>}
                    {bloqueado
                      ? <p className="sm3-material-pop-texto" data-material-demo>{demoRefusalText(isPt)}</p>
                      : onGoToBuilding && (
                        <button type="button" className="sm3-mochila-usar-btn" data-material-go={m.building}
                          aria-label={isPt ? `Ir para ${lugar}` : `Go to ${lugar}`}
                          onClick={() => { setMatAberto(null); onClose(); onGoToBuilding(m.building); }}>
                          {isPt ? 'Ir lá' : 'Go there'}
                        </button>
                      )}
                  </div>
                );
              })()}
            </section>
          )}

          {selecionadoVisivel && (
            <div className="sm3-mochila-usar" data-mochila-usar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="sm3-mochila-usar-nome">{getFileName(selecionadoVisivel, language)}</p>
                <p className="sm3-mochila-usar-desc">
                  {getFoodDesc(selecionadoVisivel, language)
                    || (isPt ? '+1 de energia e pontos de atributo.' : '+1 energy and attribute points.')}
                </p>
              </div>
              <button
                type="button"
                className="sm3-mochila-usar-btn"
                aria-label={isPt
                  ? `Usar ${getFileName(selecionadoVisivel, language)}`
                  : `Use ${getFileName(selecionadoVisivel, language)}`}
                onClick={() => usarComTrava(selecionadoVisivel)}
              >
                {isPt ? 'Usar' : 'Use'}
              </button>
            </div>
          )}
        </div>
    </>
  );

  const dialogo = {
    ref: dialogRef,
    role: 'dialog' as const,
    'aria-modal': true,
    'aria-label': isPt ? 'Arquivos' : 'Files',
  };

  return (
    <div
      className={`sm3-mochila-bg sm2-sheet-fade${arrastando ? ' sm3-arrastando' : ''}`}
      data-mochila
      onClick={(e) => { if (e.target === e.currentTarget && !arrastando) onClose(); }}
    >
      {/* MODAL FILES (18/11/2026): a moldura é a ARTE APROVADA (`assets/soulmon/ui/files/`) sobre o `ModalFrame` (que dá o "i" no ornamento e o miolo
          das sub-folhas); a composição segue a referência ref3. `MOLDURA_MODAL` desligado = a folha lisa de antes. */}
      {MOLDURA_MODAL ? (
        <ModalFrame
          {...dialogo}
          className="sm3-mochila sm3-files sm2-moldura-modal--files sm2-sheet-rise"
          data-files-modal=""
          fillOpacity={0}
          info={{ label: infoLabel, content: infoTexto, language: lang }}
        >
          {corpo}
        </ModalFrame>
      ) : (
        <div {...dialogo} className="sm3-mochila sm2-sheet-rise">{corpo}</div>
      )}

      {/* O FANTASMA: a arte do item seguindo o dedo. Decorativo. */}
      {fantasma && (
        <span
          className="sm3-fantasma"
          aria-hidden="true"
          style={{ left: fantasma.x, top: fantasma.y }}
        >
          {ITEM_ART[fantasma.emoji] && <img src={ITEM_ART[fantasma.emoji]} alt="" width={52} height={52} draggable={false} />}
        </span>
      )}
    </div>
  );
}
