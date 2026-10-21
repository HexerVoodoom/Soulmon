import { useEffect, useRef, useState } from 'react';
import { Viewport, usePrefersReducedMotion } from './ui/Viewport';
import { PLACEHOLDER_ART } from '../utils/placeholderArt';
import { sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import type { Language } from '../utils/i18n';

/**
 * A TELA DO OVO-CRISTAL do onboarding (REGISTRO §81, pedido do dono por voz, 15/10/2026).
 *
 * O ritual de perguntas termina aqui, não mais numa tela que mostra o Soulmon e pergunta "quer ele, o seu próprio ou
 * testar". O que se vê é o cristal com a silhueta de um ser adormecido dentro (`PLACEHOLDER_ART.dormant`, o mesmo
 * cristal da Home e da espera do oráculo — arte que já existe; `forming`, o cristal aceso, entra a partir do 3º toque).
 *
 *  · TOCAR no cristal o faz balançar (e, onde há háptico e o movimento não está reduzido, vibrar de leve); cada toque o
 *    deixa um pouco mais aceso. Com `OVO_TOQUES_PARA_BOTOES` toques aparecem os DOIS botões: o primário abre a compra, o
 *    secundário pede um Soulmon guia (a demo; só ele pede confirmação — quem decide é quem usa este componente);
 *  · depois da compra os dois somem e fica um CTA só, "Chocar": a LUZ BRANCA (`LuzBranca`) nasce no meio e cobre a tela;
 *  · `prefers-reduced-motion`: sem balanço, sem vibração e sem expansão — o toque é um fade curto e a luz é fade simples.
 *
 * O componente é só apresentação: quem decide a compra, a demo e o que vem depois é o `SoulmonOnboarding`.
 */
export const OVO_TOQUES_PARA_BOTOES = 5;
/** A partir de quantos toques o cristal acende (troca `dormant` por `forming`). */
const OVO_TOQUES_ACENDE = 3;

/** Duração (ms) das duas metades da luz: expandir até cobrir a tela e sumir (fade). Reduzido: fades simples, mais curtos. */
export const LUZ_EXPANDE_MS = 1100;
export const LUZ_SOME_MS = 800;
export const LUZ_REDUZIDA_MS = 400;

const OVO_CSS = `
@keyframes sm-ovo-balanco{0%{transform:rotate(0) scale(1)}18%{transform:rotate(-7deg) scale(1.03)}38%{transform:rotate(6deg) scale(1.02)}58%{transform:rotate(-4deg)}78%{transform:rotate(2deg)}100%{transform:rotate(0) scale(1)}}
@keyframes sm-ovo-fade{from{opacity:.55}to{opacity:1}}
@keyframes sm-ovo-crack{0%{opacity:0;transform:translate(-50%,6px) scale(.8)}20%{opacity:1;transform:translate(-50%,0) scale(1.08)}70%{opacity:1;transform:translate(-50%,-6px) scale(1)}100%{opacity:0;transform:translate(-50%,-14px) scale(1)}}
@keyframes sm-luz-expande{from{transform:translate(-50%,-50%) scale(0)}to{transform:translate(-50%,-50%) scale(1)}}
@keyframes sm-luz-some{from{opacity:1}to{opacity:0}}
@keyframes sm-luz-entra{from{opacity:0}to{opacity:1}}
`;

export function OvoCristal({ language, comprado, ocupado, onConhecer, onGuia, onChocar }: {
  language: Language;
  /** A compra voltou OK: os dois botões saem e fica o "Chocar". */
  comprado: boolean;
  /** A luz já está rodando (ou a tela está saindo): nada mais é tocável. */
  ocupado: boolean;
  onConhecer: () => void;
  onGuia: () => void;
  onChocar: () => void;
}) {
  const isPt = language === 'pt-BR';
  const reduced = usePrefersReducedMotion();
  const [toques, setToques] = useState(0);
  /** Sobe a cada toque: é a `key` do invólucro, que reinicia a animação sem remontar o botão (o foco fica). */
  const [pulso, setPulso] = useState(0);
  const acordado = toques >= OVO_TOQUES_PARA_BOTOES;
  const aceso = comprado || toques >= OVO_TOQUES_ACENDE;

  const tocar = () => {
    if (ocupado || comprado) return;
    const n = toques + 1;
    setToques(n);
    setPulso(p => p + 1);
    if (!reduced) { try { navigator.vibrate?.(n >= OVO_TOQUES_PARA_BOTOES ? 30 : 12); } catch { /* háptico é enfeite */ } }
  };

  const dica = comprado
    ? (isPt ? 'Seu Soulmon está pronto para chocar.' : 'Your Soulmon is ready to hatch.')
    : acordado
      ? (isPt ? 'Tem algo vivo aí dentro.' : 'Something is alive in there.')
      : (isPt ? 'Toque no cristal.' : 'Tap the crystal.');

  return (
    <div data-ovo style={{ position: 'relative', paddingTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <style>{OVO_CSS}</style>
      <button
        type="button"
        data-ovo-cristal
        data-ovo-toques={toques}
        onClick={tocar}
        disabled={ocupado}
        aria-label={isPt ? 'Cristal com um ser adormecido. Toque para despertá-lo.' : 'Crystal with a sleeping being inside. Tap to wake it.'}
        style={{
          padding: 0, margin: 0, background: 'none', border: 'none', cursor: comprado || ocupado ? 'default' : 'pointer',
          minWidth: 44, minHeight: 44, WebkitTapHighlightColor: 'transparent', color: 'inherit',
        }}
      >
        <span
          key={pulso}
          data-ovo-pulso={pulso}
          style={{
            display: 'block',
            animation: pulso === 0 ? 'none' : reduced ? 'sm-ovo-fade 260ms ease-out 1' : 'sm-ovo-balanco 520ms ease-in-out 1',
            transformOrigin: '50% 90%',
          }}
        >
          <Viewport width={96} height={96} scale={3} breathing={false} bare
            screenStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              data-ovo-arte={aceso ? 'forming' : 'dormant'}
              src={aceso ? PLACEHOLDER_ART.forming : PLACEHOLDER_ART.dormant}
              alt=""
              width={256}
              height={256}
              draggable={false}
              style={{
                width: 256, height: 256, display: 'block', imageRendering: 'pixelated',
                filter: `brightness(${(1 + Math.min(toques, OVO_TOQUES_PARA_BOTOES) * 0.06).toFixed(2)})`,
              }}
            />
          </Viewport>
        </span>
      </button>

      {/* O "crack" (decisão do dono, 21/10/2026, QA L11-06): a cada toque do usuário a palavra aparece sobre o cristal, MAIOR que
          o texto de torcida do combate (13 px); a palavra é onomatopeia, igual em PT e EN, e decorativa (a dica abaixo é o que se anuncia).
          A key reinicia a animação a cada toque; só existe depois do 1º. */}
      {pulso > 0 && !comprado && (
        <span key={`crack-${pulso}`} data-ovo-crack aria-hidden="true" style={{
          position: 'absolute', left: '50%', top: 0, pointerEvents: 'none', zIndex: 2,
          fontFamily: 'var(--sm2-font-display)', fontWeight: 700, fontSize: 30, lineHeight: 1, letterSpacing: '.04em',
          color: 'var(--sm2-ink)', textShadow: '0 1px 3px rgba(0,0,0,.45)',
          animation: reduced ? 'sm-ovo-fade 400ms ease-out 1 both' : 'sm-ovo-crack 620ms ease-out 1 both',
          transform: 'translate(-50%, 0)',
        }}>crack</span>
      )}

      {/* Região viva presente desde a primeira pintura (leitor de tela não anuncia `role=status` que já nasce com texto):
          ela existe vazia no DOM e a dica entra depois — aqui o texto troca a cada fase, o que a faz anunciar. */}
      <p role="status" aria-live="polite" data-ovo-dica style={{ ...sm2Hint, margin: '12px 0 20px', minHeight: 20 }}>{dica}</p>

      {comprado ? (
        <button type="button" data-ovo-chocar style={{ ...sm2Button('primary', ocupado), width: '100%' }}
          onClick={onChocar} disabled={ocupado}>
          {isPt ? 'Chocar' : 'Hatch'}
        </button>
      ) : acordado ? (
        <div data-ovo-botoes className="sm2-sheet-fade" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button type="button" data-ovo-conhecer style={{ ...sm2Button('primary', ocupado), width: '100%' }}
            onClick={onConhecer} disabled={ocupado}>
            {isPt ? 'Conhecer o seu Soulmon' : 'Meet your Soulmon'}
          </button>
          <button type="button" data-ovo-guia style={{ ...sm2Button('outline', ocupado), width: '100%' }}
            onClick={onGuia} disabled={ocupado}>
            {isPt ? 'Me empreste um Soulmon guia' : 'Lend me a guide Soulmon'}
          </button>
        </div>
      ) : (
        <p style={{ ...sm2Text, margin: 0, minHeight: 48 }} aria-hidden="true" />
      )}
    </div>
  );
}

/**
 * A LUZ BRANCA: um disco no MEIO da tela (onde está o cristal) que se expande até cobrir tudo (`expande`) e some em
 * fade (`some`), revelando o que está por baixo. `fase` é do dono (o `SoulmonOnboarding` troca de tela entre as duas).
 * Movimento reduzido: sem expansão — a tela inteira vira branca num fade e depois desfaz o fade.
 * Branco puro de propósito: é um efeito, não superfície; nenhum token do tema é "luz".
 */
export function LuzBranca({ fase }: { fase: 'expande' | 'some' }) {
  const reduced = usePrefersReducedMotion();
  const dur = reduced ? LUZ_REDUZIDA_MS : fase === 'expande' ? LUZ_EXPANDE_MS : LUZ_SOME_MS;
  // Diâmetro que cobre a diagonal da tela a partir do centro (o branco pleno vai até 62% do raio), com folga.
  const cobre = '250vmax';
  const base = { position: 'fixed' as const, zIndex: 400, pointerEvents: 'auto' as const };
  if (reduced) {
    return (
      <div data-luz-branca={fase} aria-hidden="true"
        style={{ ...base, inset: 0, background: '#FFFFFF', animation: `${fase === 'expande' ? 'sm-luz-entra' : 'sm-luz-some'} ${dur}ms ease-in-out 1 both` }}>
        <style>{OVO_CSS}</style>
      </div>
    );
  }
  if (fase === 'some') {
    return (
      <div data-luz-branca="some" aria-hidden="true"
        style={{ ...base, inset: 0, background: '#FFFFFF', animation: `sm-luz-some ${dur}ms ease-out 1 both` }}>
        <style>{OVO_CSS}</style>
      </div>
    );
  }
  return (
    <div data-luz-branca="expande" aria-hidden="true" style={{ ...base, inset: 0, overflow: 'hidden' }}>
      <style>{OVO_CSS}</style>
      <div style={{
        position: 'absolute', left: '50%', top: '50%', width: cobre, height: cobre, borderRadius: '50%',
        background: 'radial-gradient(circle, #FFFFFF 0%, #FFFFFF 62%, rgba(255,255,255,0) 72%)',
        transform: 'translate(-50%,-50%) scale(0)',
        animation: `sm-luz-expande ${dur}ms cubic-bezier(.4,0,.9,.6) 1 forwards`,
      }} />
    </div>
  );
}

/**
 * O relógio da transição de "Chocar": expande → (troca de tela) → some → fim. Hook à parte para o chamador manter o
 * estado da tela e a luz num lugar só. `quandoCobriu` roda UMA vez, com a tela toda branca.
 */
export function useLuzDeChocar(quandoCobriu: () => void): { fase: 'expande' | 'some' | null; disparar: () => void } {
  const reduced = usePrefersReducedMotion();
  const [fase, setFase] = useState<'expande' | 'some' | null>(null);
  const cobriuRef = useRef(quandoCobriu);
  cobriuRef.current = quandoCobriu;
  useEffect(() => {
    if (fase === null) return;
    const t = window.setTimeout(() => {
      if (fase === 'expande') { cobriuRef.current(); setFase('some'); } else setFase(null);
    }, reduced ? LUZ_REDUZIDA_MS : fase === 'expande' ? LUZ_EXPANDE_MS : LUZ_SOME_MS);
    return () => window.clearTimeout(t);
  }, [fase, reduced]);
  return { fase, disparar: () => setFase(f => (f === null ? 'expande' : f)) };
}
