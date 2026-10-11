/**
 * LEVEL UP — o display de subir de Vínculo (pedido do dono, 11/10/2026).
 *
 * Sobrepõe a tela, ESCURECE o fundo e só sai quando a pessoa TOCA: sem auto-dismiss, sem timer de
 * saída. É um intersticial — entra na fila do `App` (`const interstitial`, depois do marco do Bosque e
 * antes do sonho), monta lazy, UM por vez, z-index 300 (acima dos intersticiais, que são 200).
 *
 *  · O nível e o evento vêm de `utils/levelUp.ts` (`levelUpPending`): nunca persistido, sempre derivado
 *    de `bondLevelFor(totalXP)` contra o último celebrado. Vários níveis de uma vez = UM display
 *    "Lv A → Lv B" com o número FINAL grande.
 *  · O que ganhou vem dos donos (`levelUpGains`): ponto de talento, recompensas do Vínculo e portões.
 *    Tom: descrição de presente, nunca cobrança — nada de "faltam N".
 *  · LUZ: reaproveita o canvas da cerimônia de evolução (`EvolutionLight`). A arte opcional (banner,
 *    burst, moldura) entra por `utils/levelUpArt.ts`; sem o PNG, tudo é procedural e funciona hoje.
 *  · Movimento reduzido reduz o MOVIMENTO, nunca a pausa: sem luz animada, sem número que sobe, sem
 *    pulso — o display continua esperando o toque (regras no bloco canônico do `index.css`).
 *  · SOM (`playLevelUp`, categoria `marco`): a D11 mora AQUI. Só toca com a aba visível e com o áudio
 *    JÁ liberado por um gesto da sessão; o level up que chega na abertura do app nasce mudo.
 *  · A11y: `role="dialog"` + `aria-modal` + `aria-labelledby`, trap/Escape do `useDialogA11y`; o véu é
 *    toda a tela (tocar em qualquer lugar fecha), e há um botão real para teclado/leitor de tela.
 *    Um toque nos primeiros `ARM_MS` é ignorado: o toque que causou o level up não pode fechá-lo.
 */
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { EvolutionLight } from './EvolutionLight';
import { usePrefersReducedMotion } from './ui/Viewport';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { levelUpGains, type LevelUpEvent } from '../utils/levelUp';
import { gateName } from '../utils/gates';
import { levelUpArt, LEVELUP_CHEVRON } from '../utils/levelUpArt';
import { barramentoAtual } from '../utils/audioBus';
import { playLevelUp } from '../utils/sounds';
import { bitsStyle } from '../utils/currencies';
import type { Language } from '../utils/i18n';

/** Escurecimento do fundo: mais denso que o scrim dos rituais (.55) — aqui o mundo some. */
const LEVELUP_SCRIM = 'rgba(2, 10, 12, .88)';
const INK = '#E9F5F2';
const CYAN = '#6EFFFB';
const GOLD = '#D9A05B';
/** Janela em que o toque é ignorado (o gesto que causou a subida ainda está "no ar"). */
export const ARM_MS = 450;
/** O número sobe de `from` até `to` neste tempo, em passos (nunca mais de `MAX_STEPS`). */
const COUNT_MS = 900;
const MAX_STEPS = 14;

interface Props {
  event: LevelUpEvent;
  language: Language;
  /** Sprite atual do pet, quando existe. */
  spriteUrl?: string | null;
  /** Chamado UMA vez, só por gesto (toque, Enter/Espaço no botão, Escape). */
  onDone: (celebrated: number) => void;
}

export function LevelUpOverlay({ event, language, spriteUrl, onDone }: Props) {
  const isPt = language === 'pt-BR';
  const reduced = usePrefersReducedMotion();
  const armed = useRef(false);
  const done = useRef(false);
  const [shown, setShown] = useState(reduced ? event.to : event.from);
  const [bannerOk, setBannerOk] = useState(true);
  const [burstOk, setBurstOk] = useState(true);
  const gains = levelUpGains(event.from, event.to);
  const bannerArt = levelUpArt('banner');
  const burstArt = levelUpArt('burst');
  const frameArt = levelUpArt('frame');
  const many = event.to - event.from > 1;

  const finish = useCallback(() => {
    if (!armed.current || done.current) return;
    done.current = true;
    onDone(event.to);
  }, [onDone, event.to]);
  const dialogRef = useDialogA11y<HTMLDivElement>(true, finish);

  useEffect(() => {
    const t = setTimeout(() => { armed.current = true; }, ARM_MS);
    return () => clearTimeout(t);
  }, []);

  // O SOM (D11 no chamador): aba visível + áudio já liberado por um gesto desta sessão.
  useEffect(() => {
    try {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (barramentoAtual()?.ctx.state !== 'running') return;
      playLevelUp();
    } catch { /* som é enfeite: nunca derruba o display */ }
    if (!reduced) { try { navigator.vibrate?.([30, 40, 60]); } catch { /* noop */ } }
  }, [reduced]);

  // O número que SOBE (só com movimento; reduzido mostra o final direto, a pausa fica).
  useEffect(() => {
    if (reduced) { setShown(event.to); return; }
    const total = event.to - event.from;
    if (total <= 0) { setShown(event.to); return; }
    const steps = Math.min(total, MAX_STEPS);
    let i = 0;
    setShown(event.from);
    const id = setInterval(() => {
      i += 1;
      setShown(Math.min(event.to, Math.round(event.from + (total * i) / steps)));
      if (i >= steps) clearInterval(id);
    }, COUNT_MS / steps);
    return () => clearInterval(id);
  }, [reduced, event.from, event.to]);

  const wrap: CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 300,
    background: LEVELUP_SCRIM,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16, boxSizing: 'border-box',
    cursor: 'pointer', outline: 'none',
    WebkitTapHighlightColor: 'transparent',
    overflow: 'hidden',
  };
  const mono: CSSProperties = { ...bitsStyle, color: INK };
  /** A voz do aparelho (Silkscreen) para a palavra e o número DENTRO do vidro; o mono de calculadora fica no resto. */
  const pixel: CSSProperties = { fontFamily: 'var(--sm2-font-pixel)', fontWeight: 400, fontVariantNumeric: 'tabular-nums' };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lvup-title"
      aria-describedby="lvup-desc"
      tabIndex={-1}
      data-level-up
      onClick={finish}
      style={wrap}
    >
      <div style={{ position: 'relative', width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}>
        <h2 id="lvup-title" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', margin: 0 }}>
          {isPt ? `Vínculo nível ${event.to}` : `Bond level ${event.to}`}
        </h2>

        {/* O VIDRO (regra-mãe: pixel art só dentro do visor): a luz, o burst, o banner, o pet e o número moram aqui. */}
        <div
          className="sm2-viewport-screen sm2-visor"
          aria-hidden="true"
          data-lvup-glass
          style={{ width: '100%', height: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', padding: '10px 12px', boxShadow: '0 0 0 2px #C98B4B, 0 0 0 4px #061414' }}
        >
          {/* A LUZ: a mesma da cerimônia de evolução (raios, halo, partículas). Parada em movimento reduzido. */}
          {!reduced && (
            <div data-lvup-light style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
              <EvolutionLight size={340} />
            </div>
          )}
          {burstArt && burstOk && (
            <img
              src={burstArt}
              alt=""
              data-lvup-burst
              onError={() => setBurstOk(false)}
              className={reduced ? undefined : 'sm-lvup-burst'}
              style={{ position: 'absolute', left: '50%', top: '50%', width: 340, height: 340, transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}
            />
          )}

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {/* O BANNER: arte opcional; sem ela, a palavra na voz do aparelho. */}
            {bannerArt && bannerOk ? (
              <img
                src={bannerArt}
                alt=""
                data-lvup-banner
                onError={() => setBannerOk(false)}
                className={reduced ? undefined : 'sm-lvup-banner'}
                style={{ width: 256, height: 'auto', display: 'block' }}
              />
            ) : (
              <p
                data-lvup-banner-text
                className={reduced ? undefined : 'sm-lvup-banner'}
                style={{ ...pixel, margin: 0, fontSize: 28, letterSpacing: '0.14em', color: GOLD, textShadow: '0 2px 0 #3a2410' }}
              >
                LEVEL UP
              </p>
            )}

            {/* O pet em destaque (256² a 128 = 0,5×). */}
            {spriteUrl && (
              <img
                src={spriteUrl}
                alt=""
                width={128}
                height={128}
                data-lvup-pet
                className={reduced ? undefined : 'sm-lvup-pet'}
                style={{ width: 128, height: 128, display: 'block' }}
              />
            )}

            {/* O NÚMERO, grande, com a moldura opcional. */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 8, minWidth: 150, padding: '2px 18px' }}>
              {frameArt && (
                <img src={frameArt} alt="" data-lvup-frame style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill', pointerEvents: 'none' }} />
              )}
              <img src={LEVELUP_CHEVRON} alt="" width={48} height={48} data-lvup-chevron style={{ width: 48, height: 48, alignSelf: 'center', display: 'block' }} />
              <span style={{ ...pixel, fontSize: 16, letterSpacing: '0.16em', color: CYAN }}>LV</span>
              <span
                data-lvup-number
                className={reduced ? undefined : 'sm-lvup-num'}
                style={{ ...pixel, fontSize: 64, lineHeight: 1, color: INK, textShadow: '0 0 12px rgba(110,255,251,.55), 0 3px 0 #061414' }}
              >
                {shown}
              </span>
            </div>
          </div>
          <span className="sm2-viewport-glass" />
        </div>

        {many && (
          <p data-lvup-range style={{ ...mono, margin: 0, fontSize: 14, color: CYAN }}>
            Lv {event.from} → Lv {event.to}
          </p>
        )}

        {/* O que veio com o nível. Descrição de presente: nunca "faltam N". */}
        <ul id="lvup-desc" data-lvup-gains style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6, color: INK, fontSize: 14, fontWeight: 500 }}>
          <li>{isPt ? 'Seu vínculo cresceu.' : 'Your bond grew.'}</li>
          {gains.talentPoints > 0 && (
            <li data-lvup-talent>
              {isPt
                ? `+${gains.talentPoints} ${gains.talentPoints === 1 ? 'ponto de talento' : 'pontos de talento'}`
                : `+${gains.talentPoints} talent ${gains.talentPoints === 1 ? 'point' : 'points'}`}
            </li>
          )}
          {gains.rewards.map((r) => (
            <li key={r.id} data-lvup-reward>{isPt ? r.namePt : r.nameEn}</li>
          ))}
          {gains.gates.map((g) => (
            <li key={g} data-lvup-gate>
              {isPt ? `Agora aberto: ${gateName(g, language)}` : `Now open: ${gateName(g, language)}`}
            </li>
          ))}
        </ul>

        {/* A SAÍDA é o toque (a tela toda); o botão existe para teclado e leitor de tela. */}
        <button
          type="button"
          data-lvup-continue
          className={reduced ? undefined : 'sm-lvup-hint'}
          style={{ background: 'none', border: 0, font: 'inherit', boxSizing: 'border-box', padding: '10px 16px', cursor: 'pointer', color: INK, fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.85 }}
        >
          {isPt ? 'Toque para continuar' : 'Tap to continue'}
        </button>
      </div>
    </div>
  );
}
