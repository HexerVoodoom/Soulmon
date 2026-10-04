/**
 * JOGOS — o kit do minijogo pelo canvas `docs/design/wireframes/jogos/
 * identidade/` (DECISÕES §25, D-J3…D-J8).
 *
 * **O minijogo é o conteúdo de um VISOR; o chrome é aparelho.** Cada tela de
 * jogo = `GameRoot` (a página, `--sm2-bg`) › `GameHeader` (título Cinzel 20
 * ou Rubik 14/500 na run, linha 12 `muted`, × 44 pelado — o PRIMEIRO
 * interativo, J5) › `GameVisor` (anel de cobre + vidro 348×N com a cena em
 * `cover` e os sprites/FX pixel DENTRO) › HUD e botões vetor embaixo
 * (`HpBars`, `TimingBar`, `FxPopup`).
 *
 * Quatro jogos (Masmorra, Pesadelo, Arena, PPT/Dino) consomem as mesmas
 * peças, e é por isso que elas moram num arquivo só (footgun 9: a segunda
 * cópia diverge em silêncio). Tudo por `style` inline (footgun 1; e o
 * `index.css` estava em edição por outro canvas no momento da migração).
 *
 * Regras que estas peças cumprem por construção:
 *  · **escala inteira** (P2 a): o `Viewport` a 2× de uma tela lógica de 174
 *    de largura = 348 CSS px; sprites 256² a 128 (0,5×), FX 128² a 1× no vidro
 *    e a 64 (0,5×) no mini-visor do popup;
 *  · **nada de vermelho** (D-J5/D-J8): a barra "You" é `primary-fill`, a do
 *    outro é `gold-fill`; "Too slow!" tem a MESMA tinta que "PERFECT!";
 *  · **ícone nunca em box**; **texto nunca abaixo de 12**; **alvo ≥ 44**.
 */
import { useState, type CSSProperties, type ReactNode } from 'react';
import { Icon } from '../ui/Icon';
import { NavGlyph } from '../ui/NavGlyphs';
import { Viewport } from '../ui/Viewport';
import { MiniGlass } from '../ui/MiniGlass';
import { PixelMeter } from '../pixel/PixelKit';
import { sm2Button, sm2Hint, sm2Text, SM2_SHADOW_CARD } from '../form/FormKit';
import { InfoTip } from '../ui/InfoTip';
import { FX_ART } from '../../utils/fxArt';

/** Largura LÓGICA do visor de jogo (×2 = 348, o vidro do canvas). */
export const GAME_VISOR_W = 174;
/** Largura lógica do visor dentro de um diálogo de 340 (×2 = 288). */
export const DIALOG_VISOR_W = 144;

/**
 * A página do minijogo: toma a tela (`position: fixed`), reserva a faixa da
 * nav inferior (B2 — a nav continua visível e utilizável; sair pelo Início é
 * caminho legítimo) e rola por dentro quando não cabe.
 */
export function GameRoot({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      data-game-root
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', flexDirection: 'column', gap: 12,
        boxSizing: 'border-box',
        padding: '10px 16px 16px',
        paddingBottom: 'calc(var(--sm-corner-h) + env(safe-area-inset-bottom, 0px) + 16px)',
        overflowY: 'auto',
        backgroundColor: 'var(--sm2-bg)',
        color: 'var(--sm2-ink)',
        fontFamily: 'var(--sm2-font-text)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/**
 * O chrome: título + linha `muted` + × 44 pelado. `run` = a variante da run
 * (Rubik 14/500 sobre `line`, o canvas `.ghdr.run`); sem `run` o título é
 * Cinzel 20 (lobby, Dino, PPT).
 */
export function GameHeader({ title, sub, closeLabel, onClose, run = false, onBack, backLabel, info, infoLabel, language, activity = false, exitConfirm, onPauseChange }: {
  title: string;
  sub?: ReactNode;
  /** I13 (02/10/2026): as instruções/regras do jogo moram atrás de um "?"
   *  (`InfoTip`) ao lado do ×, em vez de uma linha de texto. Exige `infoLabel` e `language`. */
  info?: ReactNode;
  infoLabel?: string;
  language?: 'pt-BR' | 'en-US';
  closeLabel: string;
  onClose: () => void;
  run?: boolean;
  /** Voltar a uma tela de DENTRO do jogo (lista de desenhos, cartões…).
   *  01/10/2026 (B6/I3, navegação do dono): o voltar é sempre a seta no canto
   *  superior ESQUERDO, ACIMA do título — nunca mais um botão "Voltar" embaixo.
   *  O mesmo anel do `AreaTopBar` (exceção D1). */
  onBack?: () => void;
  backLabel?: string;
  /** I3 (02/10/2026): o × só mora à DIREITA quando fechar ENCERRA uma atividade
   *  em andamento (`activity` ou `exitConfirm`). Sem nenhum dos dois (lobby,
   *  carregando, erro, resultado, formulário) a tela não encerra nada: o fechar
   *  é o ✕ do canto superior ESQUERDO, acima do título, como o voltar — e,
   *  havendo `onBack`, só a seta de voltar aparece. */
  activity?: boolean;
  /** Sair PERDE progresso: o × pede confirmação antes (mesmo padrão do
   *  `BattleStage`). Implica `activity`. */
  exitConfirm?: { title: string; stay: string; leave: string };
  /** A partida pausa enquanto a confirmação está aberta. */
  onPauseChange?: (paused: boolean) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const onRight = activity || !!exitConfirm;
  const tryClose = () => {
    if (exitConfirm) { setConfirming(true); onPauseChange?.(true); } else onClose();
  };
  const stay = () => { setConfirming(false); onPauseChange?.(false); };
  const ring: CSSProperties = {
    width: 44, height: 44, flex: 'none', marginBottom: 6, boxSizing: 'border-box',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0, cursor: 'pointer', background: 'transparent',
    border: '2px solid var(--sm2-line)', borderRadius: '50%',
    color: 'var(--sm2-ink)',
  };
  return (
    <div
      style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8,
        minHeight: 44, flex: 'none',
        borderBottom: run ? '1px solid var(--sm2-line)' : undefined,
        paddingBottom: run ? 4 : 0,
      }}
    >
      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={backLabel}
            title={backLabel}
            data-game-back
            className="sm2-area-back"
            style={ring}
          >
            <NavGlyph name="arrow_back" size={24} tone="ink" />
          </button>
        )}
        {!onBack && !onRight && (
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            title={closeLabel}
            data-game-close-start
            className="sm2-area-back"
            style={ring}
          >
            <Icon name="close" size={24} tone="inherit" />
          </button>
        )}
        {run ? (
          <p style={{ ...sm2Text, margin: 0, fontWeight: 500 }}>{title}</p>
        ) : (
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--sm2-font-display)', fontWeight: 600,
              fontSize: 'var(--sm2-text-lg)', lineHeight: 'var(--sm2-leading-title)',
              color: 'var(--sm2-ink)',
            }}
          >
            {title}
          </h2>
        )}
        {sub !== undefined && <p style={sm2Hint}>{sub}</p>}
      </div>
      {info !== undefined && infoLabel && language && (
        <InfoTip language={language} label={infoLabel} align="right" style={{ marginRight: -8 }}>{info}</InfoTip>
      )}
      {/* O × da ATIVIDADE em andamento (I3): à direita e, quando sair perde
          progresso, pede confirmação. */}
      {onRight && (
        <button
          type="button"
          onClick={tryClose}
          aria-label={closeLabel}
          data-game-close-end
          style={{
            width: 44, height: 44, flex: 'none', margin: '-2px -8px 0 0',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            borderRadius: 'var(--sm2-radius-md)', color: 'var(--sm2-ink)',
          }}
        >
          <Icon name="close" size={24} tone="inherit" />
        </button>
      )}
      {confirming && exitConfirm && (
        <ExitConfirm {...exitConfirm} onStay={stay} onLeave={onClose} />
      )}
    </div>
  );
}

/** Texto padrão da confirmação de sair de uma partida em andamento (`GameHeader exitConfirm`). */
export function gameExitConfirm(isPt: boolean, what?: string): { title: string; stay: string; leave: string } {
  return {
    title: isPt ? `Sair${what ? ` ${what}` : ''}? O progresso desta partida se perde.` : `Leave${what ? ` ${what}` : ''}? This game's progress will be lost.`,
    stay: isPt ? 'Continuar' : 'Keep going',
    leave: isPt ? 'Sair' : 'Leave',
  };
}

/** A confirmação de sair de uma partida (perde progresso). Mesma peça do `BattleStage`. */
function ExitConfirm({ title, stay, leave, onStay, onLeave }: { title: string; stay: string; leave: string; onStay: () => void; onLeave: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      data-game-confirm
      style={{ position: 'fixed', inset: 0, zIndex: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(0,0,0,.6)' }}
    >
      <div style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12, padding: 16, boxSizing: 'border-box', backgroundColor: 'var(--sm2-surface)', border: '1px solid var(--sm2-line)', borderRadius: 'var(--sm2-radius-md)' }}>
        <p style={{ ...sm2Text, margin: 0, fontWeight: 500, textAlign: 'center' }}>{title}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" autoFocus onClick={onStay} style={{ ...sm2Button('primary'), flex: 1, minWidth: 0, padding: '0 8px' }}>{stay}</button>
          <button type="button" onClick={onLeave} data-game-confirm-leave style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px' }}>{leave}</button>
        </div>
      </div>
    </div>
  );
}

/**
 * O visor de jogo: anel de cobre + vidro `width×2 × height×2` com a cena em
 * `cover` (ilustração 1080×1920 — `image-rendering: auto`, D-J15 transição)
 * e os filhos posicionados em absoluto DENTRO (sprites/FX `pixelated` pela
 * regra `.sm2-viewport-screen img`).
 *
 * `scene` é um valor de `background` (shorthand — `url(...) center/cover` ou
 * uma pilha de gradientes, `utils/dungeonScenes.ts`), nunca só cor: por isso
 * vai em `background` e não em `backgroundColor`.
 */
export function GameVisor({ width = GAME_VISOR_W, height, scene, children, label, style }: {
  width?: number;
  /** Altura LÓGICA (×2 na tela): 88 → 176 (masmorra), 96 → 192 (Dino), 72 → 144 (PPT), 80 → 160. */
  height: number;
  scene?: string;
  children?: ReactNode;
  label?: string;
  style?: CSSProperties;
}) {
  return (
    <Viewport
      width={width}
      height={height}
      scale={2}
      breathing={false}
      label={label}
      style={{ display: 'block', flex: 'none', alignSelf: 'center', ...style }}
      screenStyle={{
        // Só o shorthand: `scene` já traz `center/cover` quando é imagem, e
        // misturar `background` com `backgroundSize` num re-render é o aviso
        // do React sobre shorthand + longhand no mesmo nó.
        background: scene ?? 'var(--sm2-viewport-bg)',
        imageRendering: 'auto',
      }}
    >
      {children}
    </Viewport>
  );
}

/** Sprite 256² a 128 (0,5×) dentro do vidro. `flip` = de frente para o pet. */
export function VisorSprite({ src, size = 128, flip = false, idle = true, style, alt = '', ...data }: {
  src: string;
  size?: 32 | 64 | 128;
  flip?: boolean;
  /** Respiração `.sm-battle-idle` (morre em `prefers-reduced-motion`). */
  idle?: boolean;
  style?: CSSProperties;
  alt?: string;
  'data-visor-pet'?: boolean;
  'data-visor-enemy'?: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={idle ? 'sm-battle-idle' : undefined}
      {...data}
      style={{
        position: 'absolute', width: size, height: size, maxWidth: 'none',
        objectFit: 'contain', imageRendering: 'pixelated',
        ['--flip' as string]: flip ? '-1' : '1',
        transform: idle ? undefined : (flip ? 'scaleX(-1)' : undefined),
        ...style,
      } as CSSProperties}
    />
  );
}

/** FX 128² a 1× (ou 64 = 0,5×) no vidro — sempre na caixa do OUTRO, nunca sobre o pet (X1). */
export function VisorFx({ icon, size = 128, style, ...data }: {
  /** A chave EMOJI de `FX_ART` (⚔️ 💥 🛡️ ✨ 🏳️ …). */
  icon: string;
  size?: 64 | 128;
  style?: CSSProperties;
  'data-visor-fx'?: string;
}) {
  const src = FX_ART[icon];
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      {...data}
      style={{ position: 'absolute', width: size, height: size, maxWidth: 'none', imageRendering: 'pixelated', pointerEvents: 'none', ...style }}
    />
  );
}

/**
 * As duas leituras de HP como APARELHO (D-J5): fora do vidro, `.meter` vetor,
 * "You" em `primary-fill`, o outro em `gold-fill` — nunca ❤️, nunca vermelho.
 */
export function HpBars({ bars }: {
  bars: Array<{ label: string; cur: number; max: number; tone: 'cyan' | 'gold' }>;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, flex: 'none' }}>
      {bars.map(b => (
        <div key={b.label} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ ...sm2Hint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.label}</p>
          <PixelMeter ratio={b.max > 0 ? b.cur / b.max : 0} tone={b.tone} height={10} label={b.label} />
        </div>
      ))}
    </div>
  );
}

/**
 * O popup do golpe (D-J7): `role=status` SIS-03 com o FX num mini-visor 64
 * sem anel (o slot do Dex) + título Rubik 14/500 `ink` + detalhe 12 `muted`.
 * "Too slow!" / "You took N damage" na MESMA tinta do "PERFECT!" — dano é
 * leitura, nunca cobrança. O `icon` continua sendo a chave EMOJI de `FX_ART`;
 * sem arte cai no texto, e assim um popup novo nunca quebra.
 */
export function FxPopup({ icon, title, detail, style }: {
  icon: string;
  title: string;
  detail?: ReactNode;
  style?: CSSProperties;
}) {
  const art = FX_ART[icon];
  return (
    <div
      role="status"
      data-fx-popup
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 4,
        padding: '8px 12px', boxSizing: 'border-box',
        backgroundColor: 'var(--sm2-surface)', border: '1px solid var(--sm2-line)',
        borderRadius: 'var(--sm2-radius-md)', boxShadow: SM2_SHADOW_CARD,
        ...style,
      }}
    >
      <MiniGlass size={64} style={{ marginBottom: 2 }}>
        {art
          ? <img src={art} alt="" width={64} height={64} style={{ width: 64, height: 64, imageRendering: 'pixelated', display: 'block' }} />
          : <span aria-hidden="true" style={{ fontSize: 24, lineHeight: 1 }}>{icon}</span>}
      </MiniGlass>
      <p style={{ ...sm2Text, margin: 0, fontWeight: 500 }}>{title}</p>
      {detail !== undefined && <p style={sm2Hint}>{detail}</p>}
    </div>
  );
}

/** A etiqueta 24 (SIS-03) com o valor em `ink` `tabular-nums` — "Best 1240", "HP 40". */
export function StatTag({ label, value }: { label: string; value: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4, minHeight: 24, padding: '0 8px',
        borderRadius: 12, backgroundColor: 'var(--sm2-surface-2)', color: 'var(--sm2-muted)',
        fontSize: 'var(--sm2-text-xs)', fontWeight: 500, lineHeight: 'var(--sm2-leading-body)', whiteSpace: 'nowrap',
      }}
    >
      {label} <b className="sm2-num" style={{ color: 'var(--sm2-ink)', fontWeight: 500 }}>{value}</b>
    </span>
  );
}

/** Título de fase (Rubik 14/500 `ink`, centrado — V3: nunca Silkscreen). */
export const phaseTitle: CSSProperties = { ...sm2Text, margin: 0, fontWeight: 500, textAlign: 'center' };
/** Linha de fase (12 `muted`, centrada). Placar em `tabular-nums` pela classe `sm2-num`. */
export const phaseLine: CSSProperties = { ...sm2Hint, textAlign: 'center' };
