/**
 * A MOCHILA — minimal-ui F2 (Home, abordagem B), mock aprovado
 * `propostas/home/mock-sleep.html`.
 *
 * Junta as duas superfícies antigas de item (a folha "Alimentar" do deck e a
 * pastinha `ItemsWindow`) numa folha de baixo com DUAS abas:
 *  · **Comida e chips** — a comida comum + os chips de atributo;
 *  · **Especiais** — os consumíveis da masmorra (coraçãozinho e cia.).
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
import { useCallback, useEffect, useRef, useState, type RefObject, type PointerEvent as ReactPointerEvent } from 'react';
import type { Language } from '../../utils/i18n';
import { SPECIAL_ITEMS } from '../../utils/shop';
import { ITEM_ART } from '../../utils/itemArt';
import { getFoodDesc, getFoodName } from '../ItemsWindow';
import { BackArrow } from '../ui/BackArrow';
import { InfoTip } from '../ui/InfoTip';
import { useDialogA11y } from '../../hooks/useDialogA11y';

/** Distância (px) que separa um TOQUE de um ARRASTO. Abaixo disto é toque, e
 *  toque nunca usa o item. */
export const DRAG_THRESHOLD_PX = 8;
/** Folga (px) em volta do alvo do pet: o dedo cobre o item, e o alvo do
 *  carinho é do tamanho exato do sprite. */
export const DROP_SLOP_PX = 12;

export type MochilaAba = 'comida' | 'especiais';

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
    if (esp && esp.kind !== 'chip') especiais.push([emoji, n]);
    else comida.push([emoji, n]);
  }
  // Comida comum antes dos chips; dentro de cada grupo, o maior estoque antes.
  const peso = (e: string) => (SPECIAL_ITEMS[e]?.kind === 'chip' ? 1 : 0);
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
   *  vistos na aba Especiais. Nomes e ícones vêm de `buildingQuestsCopy`. */
  materials?: Partial<Record<string, number>>;
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

export function Mochila({
  open, onClose, foodInventory, language, onUse, petTargetRef, onTargetChange, petName, materials,
}: MochilaProps) {
  const isPt = language === 'pt-BR';
  const [aba, setAba] = useState<MochilaAba>('comida');
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [fantasma, setFantasma] = useState<{ emoji: string; x: number; y: number } | null>(null);
  const arrastoRef = useRef<Arrasto | null>(null);
  /** O `click` que o navegador dispara depois de um arrasto NÃO é um toque. */
  const engolirCliqueRef = useRef(false);
  const limparRef = useRef<(() => void) | null>(null);
  const dialogRef = useDialogA11y<HTMLDivElement>(open, onClose);

  // Dono único dos nomes/ícones: `buildingQuestsCopy` (fora da entrada, então
  // carrega sob demanda — só quando há material para mostrar).
  const [copia, setCopia] = useState<typeof import('../../utils/buildingQuestsCopy').MATERIALS | null>(null);
  const temMaterial = Object.values(materials ?? {}).some(n => (n ?? 0) > 0);
  useEffect(() => {
    if (!open || !temMaterial || copia) return;
    let vivo = true;
    void import('../../utils/buildingQuestsCopy').then(m => { if (vivo) setCopia(m.MATERIALS); }).catch(() => {});
    return () => { vivo = false; };
  }, [open, temMaterial, copia]);
  const listaMateriais = (copia ?? []).filter(m => (materials?.[m.id] ?? 0) > 0);

  const abas = mochilaTabs(foodInventory);
  const lista = abas[aba];

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

  if (!open) return null;

  const arrastando = fantasma !== null;
  const nomePet = petName || 'Soulmon';

  return (
    <div
      className={`sm3-mochila-bg sm2-sheet-fade${arrastando ? ' sm3-arrastando' : ''}`}
      data-mochila
      onClick={(e) => { if (e.target === e.currentTarget && !arrastando) onClose(); }}
    >
      <div
        ref={dialogRef}
        className="sm3-mochila sm2-sheet-rise"
        role="dialog"
        aria-modal="true"
        aria-label={isPt ? 'Mochila' : 'Backpack'}
      >
        <div className="sm3-mochila-alca" aria-hidden="true" />
        {/* I3: o fechar é a seta do app (`BackArrow` com `close`), no canto superior
            ESQUERDO, ACIMA do título — o mesmo lugar do voltar. */}
        <BackArrow icon="close" onClick={onClose} language={isPt ? 'pt-BR' : 'en-US'} style={{ margin: '-6px 0 0 -10px' }} />
        <div className="sm3-mochila-head">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="sm3-mochila-titulo">{isPt ? 'Mochila' : 'Backpack'}</h2>
          </div>
          {/* I13 (02/10/2026): a dica de arrastar mora atrás do "?". */}
          <InfoTip language={language} label={isPt ? 'Como usar um item' : 'How to use an item'} align="right">
            {isPt ? `Arraste até o ${nomePet} pra usar` : `Drag onto ${nomePet} to use`}
          </InfoTip>
        </div>

        <div className="sm3-mochila-abas" role="tablist" aria-label={isPt ? 'Tipos de item' : 'Item types'}>
          {([
            { id: 'comida' as const, pt: 'Comida e chips', en: 'Food and chips' },
            { id: 'especiais' as const, pt: 'Especiais', en: 'Specials' },
          ]).map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`sm3-aba-${t.id}`}
              aria-selected={aba === t.id}
              aria-controls={`sm3-painel-${t.id}`}
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
        >
          {lista.length === 0 && !(aba === 'especiais' && temMaterial) ? (
            <p className="sm3-mochila-vazia" data-mochila-vazia>
              {aba === 'comida'
                ? (isPt
                  ? 'Nada por aqui. Complete tarefas pra ganhar comida.'
                  : 'Nothing here yet. Complete tasks to earn food.')
                : (isPt
                  ? 'Nenhum item especial ainda. Os especiais vêm da masmorra.'
                  : 'No special items yet. Specials come from the dungeon.')}
            </p>
          ) : (
            lista.length > 0 && <div className="sm3-mochila-grade">
              {lista.map(([emoji, n]) => {
                const nome = getFoodName(emoji, language);
                return (
                  <button
                    key={emoji}
                    type="button"
                    className="sm3-item"
                    data-item={emoji}
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
                    <span className="sm3-item-arte" aria-hidden="true">
                      {ITEM_ART[emoji] && <img src={ITEM_ART[emoji]} alt="" width={32} height={32} draggable={false} />}
                    </span>
                    <span className="sm3-item-nome">{nome}</span>
                    <small className="sm2-num">×{n}</small>
                  </button>
                );
              })}
            </div>
          )}

          {aba === 'especiais' && listaMateriais.length > 0 && (
            <section className="sm3-materiais" data-mochila-materiais aria-label={isPt ? 'Materiais' : 'Materials'}>
              <h3 className="sm3-materiais-titulo">{isPt ? 'Materiais' : 'Materials'}</h3>
              <ul className="sm3-materiais-lista">
                {listaMateriais.map(m => {
                  const n = materials?.[m.id] ?? 0;
                  const nome = isPt ? m.namePt : m.nameEn;
                  return (
                    <li key={m.id} data-material={m.id} aria-label={`${nome} × ${n}`}>
                      <span aria-hidden="true" className="sm3-material-icone">{m.icon}</span>
                      <span className="sm3-item-nome">{nome}</span>
                      <small className="sm2-num">×{n}</small>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {selecionadoVisivel && (
            <div className="sm3-mochila-usar" data-mochila-usar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="sm3-mochila-usar-nome">{getFoodName(selecionadoVisivel, language)}</p>
                <p className="sm3-mochila-usar-desc">
                  {getFoodDesc(selecionadoVisivel, language)
                    || (isPt ? '+1 de energia e pontos de atributo.' : '+1 energy and attribute points.')}
                </p>
              </div>
              <button
                type="button"
                className="sm3-mochila-usar-btn"
                aria-label={isPt
                  ? `Usar ${getFoodName(selecionadoVisivel, language)}`
                  : `Use ${getFoodName(selecionadoVisivel, language)}`}
                onClick={() => onUse(selecionadoVisivel)}
              >
                {isPt ? 'Usar' : 'Use'}
              </button>
            </div>
          )}
        </div>
      </div>

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
