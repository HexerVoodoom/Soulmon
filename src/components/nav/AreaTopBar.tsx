import { NavGlyph } from '../ui/NavGlyphs';
import { PixelIcon } from '../ui/PixelIcon';
import { CORNER_RING, CORNER_RING_TOP, CORNER_RING_SIDE, CORNER_GLOW, CORNER_RING_STYLE } from './cornerAnchor';

/** Tinta clara para o que fica sobre a arte escura da área (igual aos rótulos dos lotes). */
const SCENE_INK = '#E9F5F2';

/**
 * O TOPO DE UMA ÁREA (e das páginas do menu da Home): voltar + título.
 *
 * - **Voltar = seta dentro de um CÍRCULO, canto superior esquerdo.** É a
 *   exceção D1 do dono (23/09/2026) à regra "ícone nunca dentro de box": o anel
 *   é permitido aqui e nos três cuidados da Home, em nenhum outro lugar. O anel
 *   é só TRAÇO (`--sm2-line`), sem preenchimento — o ícone continua pelado
 *   dentro dele.
 * - **Título centralizado.** Uma coluna vazia do tamanho do voltar à direita
 *   mantém o centro óptico no centro da tela, e não no centro do que sobra.
 *
 * **Um `<h1>` por tela**: se a página de baixo já é dona do próprio `<h1>`
 * (Jogos, Arena, Hall), o título aqui é texto comum (`ownsHeading={false}`) e
 * fica fora da árvore de acessibilidade — o leitor de tela lê o `<h1>` da página,
 * uma vez. Senão, ele é o `<h1>`.
 */
export function AreaTopBar({ title, backLabel, onBack, ownsHeading = true, icon = 'arrow_back', overScene = false, covered = false }: {
  title: string;
  /** Rótulo acessível do voltar — diz PARA ONDE ("Voltar ao mapa"). */
  backLabel: string;
  onBack: () => void;
  ownsHeading?: boolean;
  /** Ícone do voltar. `'map'` nas ÁREAS (o ícone diz o DESTINO: o Mapa — pedido
   *  do dono, 29/09/2026); `'arrow_back'` (padrão) em Pet/Biblioteca/menu da
   *  Home, que voltam para a Home. É o MESMO ícone ILUSTRADO (`PixelIcon`
   *  `mapa`) que o link de canto da Home usa — nenhum ícone novo. */
  icon?: 'arrow_back' | 'map';
  /** O topo fica SOBRE o fundo pintado full-screen da área: texto e anel em
   *  tinta clara fixa (a arte é escura nos dois temas — mesmo `#E9F5F2` dos
   *  rótulos dos lotes) + um degradê escuro sob o topo, sem box no ícone. */
  overScene?: boolean;
  /** Há camada de tela cheia aberta (folha, jogo, duelo): o topo some
   *  (`visibility:hidden` — sai do foco e da árvore de acessibilidade) para não
   *  ficar por cima do ✕ da camada. */
  covered?: boolean;
}) {
  const titleStyle: React.CSSProperties = {
    margin: 0,
    flex: 1,
    minWidth: 0,
    textAlign: 'center',
    fontFamily: 'var(--sm2-font-display)',
    fontSize: 'var(--sm2-text-xl)',
    fontWeight: 600,
    lineHeight: 'var(--sm2-leading-title)',
    color: overScene ? SCENE_INK : 'var(--sm2-ink)',
    textShadow: overScene ? '0 1px 3px rgba(0,0,0,.7)' : undefined,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
  return (
    <div
      data-area-topbar
      data-covered={covered ? '' : undefined}
      style={{
        visibility: covered ? 'hidden' : undefined,
        display: 'flex', alignItems: 'center', gap: 'var(--sm2-space-2)',
        minHeight: 48, margin: overScene ? 'env(safe-area-inset-top, 0px) 0 var(--sm2-space-3)' : '0 0 var(--sm2-space-3)',
        ...(overScene ? { position: 'relative', zIndex: 2 } : null),
      }}
    >
      {overScene && (
        <span
          aria-hidden="true"
          data-area-topbar-scrim
          style={{
            position: 'absolute', zIndex: -1, pointerEvents: 'none',
            left: -24, right: -24,
            top: 'calc((var(--sm-scroll-pt) + env(safe-area-inset-top, 0px)) * -1)',
            height: 'calc(var(--sm-scroll-pt) + env(safe-area-inset-top, 0px) + 48px + 24px)',
            background: 'linear-gradient(to bottom, rgba(4,14,16,.78), rgba(4,14,16,.45) 60%, rgba(4,14,16,0))',
          }}
        />
      )}
      {/* H9 (02/10/2026): o voltar mora na ÂNCORA do canto (`cornerAnchor.ts`, a
          mesma da casinha do Mapa) — `position: fixed`, na MESMA posição e
          tamanho em toda tela, e não mais onde o fluxo da página o deixasse.
          O espaço dele na linha é reservado pelo `<span>` vazio logo abaixo. */}
      <span aria-hidden="true" style={{ width: CORNER_RING, flex: `0 0 ${CORNER_RING}px`, height: CORNER_RING }} />
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        title={backLabel}
        data-area-back
        className="sm2-area-back"
        style={{
          ...(overScene ? CORNER_RING_STYLE : {
            width: CORNER_RING, height: CORNER_RING, boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent',
            border: '2px solid var(--sm2-line)',
            borderRadius: '50%',
          }),
          position: 'fixed', zIndex: 45,
          top: CORNER_RING_TOP, left: CORNER_RING_SIDE,
          padding: 0, cursor: 'pointer',
          color: overScene ? SCENE_INK : 'var(--sm2-ink)',
          filter: overScene ? CORNER_GLOW : undefined,
        }}
      >
        {icon === 'map'
          // O MESMO ícone ilustrado do link de canto da Home (`CornerLink` →
          // `PixelIcon name="mapa"`, 32px): pedido do dono, 30/09/2026. Cabe nos
          // 40px internos do anel de 44 (borda 2px) e a arte é clara sobre a cena.
          ? <PixelIcon name="mapa" size={32} />
          : <NavGlyph name={icon} size={24} tone={overScene ? 'inherit' : 'ink'} />}
      </button>
      {ownsHeading
        ? <h1 style={titleStyle}>{title}</h1>
        : <p aria-hidden="true" style={titleStyle}>{title}</p>}
      <span aria-hidden="true" style={{ width: CORNER_RING, flex: `0 0 ${CORNER_RING}px` }} />
    </div>
  );
}
