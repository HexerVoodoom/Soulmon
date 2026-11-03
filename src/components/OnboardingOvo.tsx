import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { usePrefersReducedMotion } from './ui/Viewport';
import { CRIACAO_ART } from '../utils/criacaoEvolucaoArt';
import { sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import type { Language } from '../utils/i18n';

/**
 * A TELA DO OVO-CRISTAL do onboarding (REGISTRO §81, pedido do dono por voz, 15/10/2026).
 *
 * O ritual de perguntas termina aqui, não mais numa tela que mostra o Soulmon e pergunta "quer ele, o seu próprio ou
 * testar". O que se vê é o cristal com a silhueta de um ser adormecido dentro, ASSENTADO
 * no altar de um nicho pintado (03/11/2026, `CRIACAO_ART`: fundo, halo respirando, o cristal em 3 níveis de rachadura
 * que sobem com os toques, lascas por toque, pulso convidando o 1º toque). `data-ovo-arte` segue dormant → forming (3º).
 *
 *  · TOCAR no cristal o faz balançar (e, onde há háptico e o movimento não está reduzido, vibrar de leve); cada toque o
 *    deixa um pouco mais aceso. Com `OVO_TOQUES_PARA_BOTOES` toques aparecem os DOIS botões: o primário abre a compra, o
 *    secundário pede um Soulmon guia (a demo; só ele pede confirmação — quem decide é quem usa este componente);
 *  · depois da compra os dois somem e fica um CTA só, "Chocar": a LUZ turquesa (`LuzBranca`) nasce no meio e cobre a tela;
 *  · `prefers-reduced-motion`: sem balanço, sem vibração e sem expansão — o toque é um fade curto e a luz é fade simples.
 *
 * O componente é só apresentação: quem decide a compra, a demo e o que vem depois é o `SoulmonOnboarding`.
 */
export const OVO_TOQUES_PARA_BOTOES = 5;
/** A partir de quantos toques o cristal acende (o nível de rachadura já subiu). */
const OVO_TOQUES_ACENDE = 3;
/** Nível de rachadura (`CRIACAO_ART.crack`, 3 quadros) por toques: inteiro, fios (2+), luz vazando (5+ ou comprado). */
export function nivelDaRachadura(toques: number, comprado = false): 0 | 1 | 2 {
  if (comprado || toques >= OVO_TOQUES_PARA_BOTOES) return 2;
  return toques >= 2 ? 1 : 0;
}

/** Duração (ms) das duas metades da luz: expandir até cobrir a tela e sumir (fade). Reduzido: fades simples, mais curtos. */
export const LUZ_EXPANDE_MS = 1100;
export const LUZ_SOME_MS = 800;
export const LUZ_REDUZIDA_MS = 400;
/** A cor da luz de Chocar: turquesa claro (a mesma linguagem da evolução), não mais o branco puro (03/11/2026). */
export const LUZ_COR = '#C9FFF6';

const OVO_CSS = `
@keyframes sm-ovo-balanco{0%{transform:rotate(0) scale(1)}18%{transform:rotate(-7deg) scale(1.03)}38%{transform:rotate(6deg) scale(1.02)}58%{transform:rotate(-4deg)}78%{transform:rotate(2deg)}100%{transform:rotate(0) scale(1)}}
@keyframes sm-ovo-fade{from{opacity:.55}to{opacity:1}}
@keyframes sm-ovo-convite{0%,100%{transform:scale(1);filter:drop-shadow(0 0 0 rgba(64,224,208,0))}50%{transform:scale(1.035);filter:drop-shadow(0 0 14px rgba(64,224,208,.75))}}
@keyframes sm-ovo-halo{0%,100%{opacity:.55;transform:translate(-50%,-50%) scale(.96,.38)}50%{opacity:1;transform:translate(-50%,-50%) scale(1.04,.42)}}
@keyframes sm-ovo-lasca{from{background-position:0 0}to{background-position:100% 0}}
@keyframes sm-luz-expande{from{transform:translate(-50%,-50%) scale(0)}to{transform:translate(-50%,-50%) scale(1)}}
@keyframes sm-luz-some{from{opacity:1}to{opacity:0}}
@keyframes sm-luz-entra{from{opacity:0}to{opacity:1}}
`;

/** Quadro `i` de uma tira de `n` quadros como `background` (cobre a caixa toda). */
export const quadroDaTira = (src: string, n: number, i: number): CSSProperties => ({
  backgroundImage: `url(${src})`, backgroundRepeat: 'no-repeat',
  backgroundSize: `${n * 100}% 100%`, backgroundPosition: `${n > 1 ? (i / (n - 1)) * 100 : 0}% 0`,
  imageRendering: 'pixelated',
});

/** Geometria da cena (frações da caixa 720×1040 = os 1040 px de baixo do fundo 720×1280): o topo do altar está em 64%. */
const ALTAR_Y = 64;
const CRISTAL_W = 80;

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
  const nivel = nivelDaRachadura(toques, comprado);

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

  // O convite: antes do 1º toque o cristal pulsa devagar (sem movimento reduzido).
  const convite = pulso === 0 && !reduced && !comprado;

  return (
    <div data-ovo style={{ position: 'relative', paddingTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <style>{OVO_CSS}</style>
      {/* A CENA: o nicho pintado com o cristal ASSENTADO no altar e o halo de runas respirando por baixo. */}
      <div data-ovo-cena style={{
        position: 'relative', width: '100%', maxWidth: 380, aspectRatio: '720 / 1040', overflow: 'hidden', borderRadius: 12,
        backgroundImage: `url(${CRIACAO_ART.bg})`, backgroundSize: '100% auto', backgroundPosition: 'center bottom', backgroundRepeat: 'no-repeat',
        backgroundColor: 'var(--sm2-viewport-bg, #071414)', imageRendering: 'pixelated',
      }}>
        <img data-ovo-halo src={CRIACAO_ART.halo} alt="" aria-hidden="true" draggable={false} style={{
          position: 'absolute', left: '50%', top: `${ALTAR_Y}%`, width: '74%', height: 'auto', pointerEvents: 'none',
          mixBlendMode: 'screen', imageRendering: 'pixelated',
          transform: 'translate(-50%,-50%) scale(1,.4)',
          animation: reduced ? 'none' : 'sm-ovo-halo 3.2s ease-in-out infinite',
        }} />
        <button
          type="button"
          data-ovo-cristal
          data-ovo-toques={toques}
          onClick={tocar}
          disabled={ocupado}
          aria-label={isPt ? 'Cristal com um ser adormecido. Toque para despertá-lo.' : 'Crystal with a sleeping being inside. Tap to wake it.'}
          style={{
            position: 'absolute', left: `${(100 - CRISTAL_W) / 2}%`, width: `${CRISTAL_W}%`, aspectRatio: '1 / 1',
            bottom: `${100 - ALTAR_Y - 2}%`,
            padding: 0, margin: 0, background: 'none', border: 'none', cursor: comprado || ocupado ? 'default' : 'pointer',
            minWidth: 44, minHeight: 44, WebkitTapHighlightColor: 'transparent', color: 'inherit',
          }}
        >
          <span
            key={pulso}
            data-ovo-pulso={pulso}
            style={{
              display: 'block', width: '100%', height: '100%',
              animation: convite ? 'sm-ovo-convite 1.8s ease-in-out infinite'
                : pulso === 0 ? 'none' : reduced ? 'sm-ovo-fade 260ms ease-out 1' : 'sm-ovo-balanco 520ms ease-in-out 1',
              transformOrigin: '50% 95%',
            }}
          >
            <span
              aria-hidden="true"
              data-ovo-arte={aceso ? 'forming' : 'dormant'}
              data-ovo-rachadura={nivel}
              style={{
                display: 'block', width: '100%', height: '100%',
                ...quadroDaTira(CRIACAO_ART.crack.src, CRIACAO_ART.crack.frames, nivel),
                filter: `brightness(${(1 + Math.min(toques, OVO_TOQUES_PARA_BOTOES) * 0.06).toFixed(2)})`,
              }}
            />
          </span>
        </button>

        {/* O toque (substitui a palavra "crack", 03/11/2026): lascas e faíscas de cristal saindo do meio, 4 quadros.
            Decorativo; a dica abaixo é o que se anuncia. Movimento reduzido: não aparece. */}
        {pulso > 0 && !comprado && !reduced && (
          <span key={`lasca-${pulso}`} data-ovo-fx aria-hidden="true" style={{
            position: 'absolute', left: '50%', top: `${ALTAR_Y - 26}%`, width: '46%', aspectRatio: '1 / 1', pointerEvents: 'none', zIndex: 2,
            transform: 'translate(-50%,-50%)',
            ...quadroDaTira(CRIACAO_ART.fxTouch.src, CRIACAO_ART.fxTouch.frames, 0),
            animation: `sm-ovo-lasca 480ms steps(${CRIACAO_ART.fxTouch.frames - 1}) 1 forwards`,
          }} />
        )}
      </div>

      {/* Região viva presente desde a primeira pintura (leitor de tela não anuncia `role=status` que já nasce com texto):
          ela existe vazia no DOM e a dica entra depois — aqui o texto troca a cada fase, o que a faz anunciar. */}
      <p role="status" aria-live="polite" data-ovo-dica style={{ ...sm2Hint, margin: '12px 0 16px', minHeight: 20 }}>{dica}</p>

      {/* Hierarquia (03/11/2026, dono): a COMPRA continua visível ANTES do "Chocar" — comprar antes de chocar dá o Soulmon
          bebê feito de você. Ela é o único primário; o guia vira link discreto. Comprado: só o "Chocar". */}
      {comprado ? (
        <button type="button" data-ovo-chocar style={{ ...sm2Button('primary', ocupado), width: '100%' }}
          onClick={onChocar} disabled={ocupado}>
          {isPt ? 'Chocar' : 'Hatch'}
        </button>
      ) : acordado ? (
        <div data-ovo-botoes className="sm2-sheet-fade" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <button type="button" data-ovo-conhecer style={{ ...sm2Button('primary', ocupado), width: '100%' }}
            onClick={onConhecer} disabled={ocupado}>
            {isPt ? 'Conhecer o seu Soulmon' : 'Meet your Soulmon'}
          </button>
          <button type="button" data-ovo-guia data-ovo-link
            style={{
              ...sm2Hint, background: 'none', border: 'none', margin: 0, padding: '0 12px', minHeight: 44,
              cursor: ocupado ? 'default' : 'pointer', textDecoration: 'underline', textUnderlineOffset: 3,
            }}
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
 * A LUZ DE CHOCAR (o nome ficou; 03/11/2026 virou TURQUESA, a mesma linguagem da evolução): a estrela de luz
 * (`CRIACAO_ART.hatchLight`) sobre um disco turquesa claro nasce no MEIO da tela, se expande até cobrir tudo (`expande`)
 * e some em fade (`some`). `fase` é do dono (o `SoulmonOnboarding` troca de tela entre as duas).
 * Movimento reduzido: sem expansão — a tela inteira vira luz num fade e depois desfaz o fade.
 */
export function LuzBranca({ fase }: { fase: 'expande' | 'some' }) {
  const reduced = usePrefersReducedMotion();
  const dur = reduced ? LUZ_REDUZIDA_MS : fase === 'expande' ? LUZ_EXPANDE_MS : LUZ_SOME_MS;
  // Diâmetro que cobre a diagonal da tela a partir do centro (a luz plena vai até ~60% do raio), com folga.
  const cobre = '250vmax';
  const base = { position: 'fixed' as const, zIndex: 400, pointerEvents: 'auto' as const };
  if (reduced) {
    return (
      <div data-luz-branca={fase} data-luz-cor={LUZ_COR} aria-hidden="true"
        style={{ ...base, inset: 0, background: LUZ_COR, animation: `${fase === 'expande' ? 'sm-luz-entra' : 'sm-luz-some'} ${dur}ms ease-in-out 1 both` }}>
        <style>{OVO_CSS}</style>
      </div>
    );
  }
  if (fase === 'some') {
    return (
      <div data-luz-branca="some" data-luz-cor={LUZ_COR} aria-hidden="true"
        style={{ ...base, inset: 0, background: LUZ_COR, animation: `sm-luz-some ${dur}ms ease-out 1 both` }}>
        <style>{OVO_CSS}</style>
      </div>
    );
  }
  return (
    <div data-luz-branca="expande" data-luz-cor={LUZ_COR} aria-hidden="true" style={{ ...base, inset: 0, overflow: 'hidden' }}>
      <style>{OVO_CSS}</style>
      <div style={{
        position: 'absolute', left: '50%', top: '50%', width: cobre, height: cobre, borderRadius: '50%',
        background: `url(${CRIACAO_ART.hatchLight}) center / 40% no-repeat, radial-gradient(circle, ${LUZ_COR} 0%, ${LUZ_COR} 55%, rgba(64,224,208,.6) 64%, rgba(64,224,208,0) 72%)`,
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
