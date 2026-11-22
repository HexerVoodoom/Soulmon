import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from './ui/Viewport';
import { CRIACAO_ART } from '../utils/criacaoEvolucaoArt';
import { LuzBranca, nivelDaRachadura, OVO_CSS, OVO_TOQUES_PARA_BOTOES, quadroDaTira, useLuzDeChocar } from './OnboardingOvo';
import { NpcSequence, type NpcSequenceLine } from './NpcSequence';
import { sm2Button, sm2Hint } from './form/FormKit';
import type { Language } from '../utils/i18n';

/**
 * O CHOCAR DO BB em tela cheia (Início BB, dono 17/11/2026; `utils/inicioBB.ts`).
 *
 * A Home só abre esta tela quando a arte do BB JÁ está no acervo (`prontoParaChocar`). A pessoa TOCA no cristal até ele
 * rachar (`OVO_TOQUES_PARA_BOTOES` toques, a mesma cena e as mesmas lascas do ovo do onboarding); no último toque a luz
 * turquesa cobre a tela e, com ela toda acesa, o BB aparece. A APRESENTAÇÃO ("Oi, eu sou…") só entra com a imagem
 * CARREGADA (pré-carga com `Image`): nunca um quadro vazio com texto. Se a imagem não carregar, um "Continuar" sai daqui
 * sem apresentação (o Soulmon segue na Home pelo caminho normal).
 *
 * Só apresentação: quem grava o "chocou" é o `App` (`onDone`).
 */
export function ChocarBB({ language, spriteUrl, nome, falas, onDone }: {
  language: Language;
  /** A arte do BB (exclusivo do pago ou do pool). */
  spriteUrl: string;
  nome: string;
  /** As falas da apresentação (`soulmonIntroLines`), já no idioma. */
  falas: readonly string[];
  onDone: () => void;
}) {
  const isPt = language === 'pt-BR';
  const reduced = usePrefersReducedMotion();
  const [toques, setToques] = useState(0);
  const [pulso, setPulso] = useState(0);
  const [revelado, setRevelado] = useState(false);
  const [arte, setArte] = useState<'carregando' | 'ok' | 'falhou'>('carregando');
  const luz = useLuzDeChocar(() => setRevelado(true));

  useEffect(() => {
    let vivo = true;
    const img = new Image();
    img.onload = () => { if (vivo) setArte('ok'); };
    img.onerror = () => { if (vivo) setArte('falhou'); };
    img.src = spriteUrl;
    return () => { vivo = false; };
  }, [spriteUrl]);

  const rachou = toques >= OVO_TOQUES_PARA_BOTOES;
  const tocar = () => {
    if (rachou || luz.fase !== null) return;
    const n = toques + 1;
    setToques(n);
    setPulso(p => p + 1);
    if (!reduced) { try { navigator.vibrate?.(n >= OVO_TOQUES_PARA_BOTOES ? 30 : 12); } catch { /* háptico é enfeite */ } }
    if (n >= OVO_TOQUES_PARA_BOTOES) luz.disparar();
  };

  const linhas: NpcSequenceLine[] = falas.map(text => ({ speaker: nome, art: spriteUrl, text }));
  const dica = rachou
    ? (isPt ? 'O cristal está rachando…' : 'The crystal is cracking…')
    : toques === 0
      ? (isPt ? 'Seu Soulmon quer sair. Toque no cristal.' : 'Your Soulmon wants out. Tap the crystal.')
      : (isPt ? 'Continue tocando.' : 'Keep tapping.');

  return (
    <div data-chocar-bb role="dialog" aria-modal="true" aria-label={isPt ? 'Chocar o seu Soulmon' : 'Hatch your Soulmon'}
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--sm2-viewport-bg, #071414)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', overflow: 'hidden' }}>
      <style>{OVO_CSS}</style>
      {!revelado && (
        <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div data-chocar-cena style={{
            position: 'relative', width: '100%', aspectRatio: '720 / 1040', maxHeight: '70vh', overflow: 'hidden', borderRadius: 12,
            backgroundImage: `url(${CRIACAO_ART.bg})`, backgroundSize: '100% auto', backgroundPosition: 'center bottom', backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated',
          }}>
            <button type="button" data-chocar-cristal data-chocar-toques={toques} onClick={tocar} disabled={rachou}
              aria-label={isPt ? 'Cristal com o seu Soulmon dentro. Toque para chocar.' : 'Crystal with your Soulmon inside. Tap to hatch.'}
              style={{
                position: 'absolute', left: '10%', width: '80%', aspectRatio: '1 / 1', bottom: '34%',
                padding: 0, margin: 0, background: 'none', border: 'none', cursor: rachou ? 'default' : 'pointer',
                minWidth: 44, minHeight: 44, WebkitTapHighlightColor: 'transparent', color: 'inherit',
              }}>
              <span key={pulso} style={{
                display: 'block', width: '100%', height: '100%', transformOrigin: '50% 95%',
                animation: pulso === 0 ? (reduced ? 'none' : 'sm-ovo-convite 1.8s ease-in-out infinite') : reduced ? 'sm-ovo-fade 260ms ease-out 1' : 'sm-ovo-balanco 520ms ease-in-out 1',
              }}>
                <span aria-hidden="true" data-chocar-rachadura={nivelDaRachadura(toques)} style={{
                  display: 'block', width: '100%', height: '100%',
                  ...quadroDaTira(CRIACAO_ART.crack.src, CRIACAO_ART.crack.frames, nivelDaRachadura(toques)),
                  filter: `brightness(${(1 + Math.min(toques, OVO_TOQUES_PARA_BOTOES) * 0.06).toFixed(2)})`,
                }} />
              </span>
            </button>
          </div>
          <p role="status" aria-live="polite" data-chocar-dica style={{ ...sm2Hint, color: 'var(--sm2-on-primary)', margin: '12px 0 0', minHeight: 20 }}>{dica}</p>
        </div>
      )}
      {revelado && arte === 'ok' && (
        <NpcSequence
          language={language}
          label={isPt ? `${nome} se apresenta` : `${nome} introduces itself`}
          lines={linhas.length ? linhas : [{ speaker: nome, art: spriteUrl, text: isPt ? `Oi, eu sou ${nome}.` : `Hi, I'm ${nome}.` }]}
          onFinish={() => onDone()}
        />
      )}
      {revelado && arte !== 'ok' && (
        <div data-chocar-espera style={{ textAlign: 'center' }}>
          <p role="status" aria-live="polite" style={{ ...sm2Hint, color: 'var(--sm2-on-primary)' }}>
            {arte === 'carregando'
              ? (isPt ? 'Quase lá…' : 'Almost there…')
              : (isPt ? 'O desenho não carregou agora. Ele aparece na Home.' : "The drawing didn't load just now. It shows up on Home.")}
          </p>
          {arte === 'falhou' && (
            <button type="button" data-chocar-seguir style={{ ...sm2Button('primary'), marginTop: 12 }} onClick={onDone}>
              {isPt ? 'Continuar' : 'Continue'}
            </button>
          )}
        </div>
      )}
      {luz.fase && <LuzBranca fase={luz.fase} />}
    </div>
  );
}
