import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { StrollFind } from './play/StrollFind';
import { sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { useGroundDrop } from '../hooks/usePetScale';
import { prefersReducedMotion } from '../utils/combatFx';
import { SCENE_FOUND_X, SCENE_GROUND_Y, SCENE_PLAYER_X, SCENE_RATIO, panOffsetPx, sceneArtOf, sceneFallbackCss } from '../utils/strollScene';
import { dexElementName } from './ElementDex';
import type { AdventureFind } from '../utils/adventure';
import type { Language } from '../utils/i18n';

/**
 * A CENA DO PASSEIO em tela cheia (pedido do dono, 05/11/2026). Substitui a folha "Da aventura de ontem" quando houve Passeio:
 *
 *  1. o Soulmon do jogador no cenário da região, e um cartãozinho no topo com o que foi (missão, destino, achado);
 *  2. "Espera… tem alguma coisa ali." → o cenário DESLIZA para o lado;
 *  3. o Soulmon descoberto (um que o jogador ainda não tinha visto — `utils/strollDiscovery.ts`), centrado, e o aviso de descoberta;
 *  4. o OK volta (desliza de volta) para o Soulmon do jogador, de onde ele fecha e sai.
 *
 * Não paga nada e nasce MUDA (R-NOVA, `docs/SOM.md`): sem som novo. Movimento reduzido: sem deslize (corte seco), a pausa dos
 * avisos continua (espera o gesto). Sem descoberta (o Drive já tem tudo) a cena é só os passos 1 e o fechamento.
 * O panorama é a arte pedida em `docs/ASSETS-A-GERAR.md` §25; sem ela, o postal da região espelhado (`utils/strollScene.ts`).
 */
export interface StrollSceneProps {
  regionId: string;
  bgId: string | null;
  playerSprite?: string | null;
  adventure: Pick<AdventureFind, 'id' | 'emoji' | 'titlePt' | 'titleEn' | 'textPt' | 'textEn'>;
  adventureIsNew?: boolean;
  stroll: { missionTitle: string; destination: string } | null;
  /** O Soulmon que o jogador ainda não tinha visto (já escolhido por `strollDiscoveryOf`); `null` = não há mais nenhum por descobrir. */
  discovery: { key: string; name: string; element: string; sprite?: string } | null;
  /** O jogador confirmou a descoberta: quem chama grava a chave no Drive (`bestiary`). Chamado UMA vez. */
  onDiscover: (key: string) => void;
  /** Sair da cena (o último botão: "Começar o dia" ou "Continuar"). */
  onFinish: () => void;
  finishLabel: string;
  language: Language;
}

type Phase = 'intro' | 'notice' | 'pan-out' | 'found' | 'pan-back' | 'back';

const PAN_MS = 1400;
const topCard: CSSProperties = {
  position: 'absolute', left: 16, right: 16, top: 'calc(env(safe-area-inset-top, 0px) + 16px)', zIndex: 3,
  maxWidth: 420, margin: '0 auto', boxSizing: 'border-box', padding: 12, display: 'flex', flexDirection: 'column', gap: 10,
  backgroundColor: 'var(--sm2-surface)', border: '1px solid var(--sm2-line)', borderRadius: 'var(--sm2-radius-md)',
};

/** Um Soulmon pisando na linha de chão do panorama: o pé VISÍVEL cai na linha (`useGroundDrop`), com a sombra de contato. */
function ScenePet({ src, xPct, size, trackH, label, 'data-scene-pet': tag }: { src?: string | null; xPct: number; size: number; trackH: number; label: string; 'data-scene-pet': string }) {
  const drop = useGroundDrop(src ?? undefined, 1, size);
  if (!src) return null;
  const groundPx = Math.round((SCENE_GROUND_Y / 100) * trackH);
  return (
    <div data-scene-pet={tag} style={{ position: 'absolute', left: `${xPct}%`, top: groundPx - size, width: size, height: size, transform: 'translateX(-50%)', pointerEvents: 'none' }}>
      <span aria-hidden="true" className="sm2-pet-shadow"
        style={{ position: 'absolute', left: '50%', bottom: -Math.round(size * 0.05), transform: 'translateX(-50%)', width: Math.round(size * 0.6), height: Math.round(size * 0.12) }} />
      <img src={src} alt={label} draggable={false} style={{ position: 'relative', top: drop, width: size, height: size, objectFit: 'contain', imageRendering: 'pixelated' }} />
    </div>
  );
}

export function StrollScene({ regionId, bgId, playerSprite, adventure, adventureIsNew, stroll, discovery, onDiscover, onFinish, finishLabel, language }: StrollSceneProps) {
  const isPt = language === 'pt-BR';
  const reduced = prefersReducedMotion();
  const [phase, setPhase] = useState<Phase>('intro');
  const [vp, setVp] = useState({ w: 390, h: 844 });
  const discovered = useRef(false);
  useLayoutEffect(() => {
    const measure = () => setVp({ w: window.innerWidth || 390, h: window.innerHeight || 844 });
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const trackH = vp.h;
  const trackW = Math.max(vp.w, Math.round(trackH * SCENE_RATIO));
  const petSize = Math.min(260, Math.max(120, Math.round(trackH * 0.28)));
  const anchor = phase === 'pan-out' || phase === 'found' ? SCENE_FOUND_X : SCENE_PLAYER_X;
  const offset = panOffsetPx(anchor, trackW, vp.w);

  // Os deslizes terminam sozinhos; com movimento reduzido o corte é imediato.
  useEffect(() => {
    if (phase !== 'pan-out' && phase !== 'pan-back') return undefined;
    const t = setTimeout(() => setPhase(phase === 'pan-out' ? 'found' : 'back'), reduced ? 0 : PAN_MS);
    return () => clearTimeout(t);
  }, [phase, reduced]);

  const art = sceneArtOf(regionId);
  const fallback = art ? undefined : sceneFallbackCss(bgId);
  const trackStyle: CSSProperties = {
    position: 'absolute', top: 0, left: 0, width: trackW, height: trackH,
    transform: `translateX(${offset}px)`, transition: reduced ? 'none' : `transform ${PAN_MS}ms cubic-bezier(.45,.05,.25,1)`,
    backgroundColor: '#071413',
    ...(art ? { background: `#071413 url(${art}) center / cover no-repeat` } : null),
  };

  const goOnFromIntro = () => (discovery ? setPhase('notice') : onFinish());
  const confirmDiscovery = () => {
    if (discovery && !discovered.current) { discovered.current = true; onDiscover(discovery.key); }
    setPhase('pan-back');
  };
  /** "Pular" (padrão do `BuildingIntro`): encerra a cena inteira. O Soulmon do dia é garantido, então pular também grava a descoberta. */
  const skip = () => {
    if (discovery && !discovered.current) { discovered.current = true; onDiscover(discovery.key); }
    onFinish();
  };
  const title = isPt ? 'Da aventura de ontem' : "From Yesterday's Adventure";

  return (
    <div data-stroll-scene data-phase={phase} data-region={regionId} data-scene-art={art ? 'painted' : 'fallback'}
      role="dialog" aria-modal="true" aria-label={title}
      style={{ position: 'fixed', inset: 0, zIndex: 200, overflow: 'hidden', backgroundColor: '#071413' }}>
      <div data-scene-track style={trackStyle}>
        {fallback && (
          // Reserva: o postal da região, espelhado lado a lado — o espelho emenda sem costura.
          <>
            <div style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', background: `${fallback} center bottom / cover no-repeat` }} />
            <div style={{ position: 'absolute', left: '50%', top: 0, width: '50%', height: '100%', background: `${fallback} center bottom / cover no-repeat`, transform: 'scaleX(-1)' }} />
          </>
        )}
        <ScenePet src={playerSprite} xPct={SCENE_PLAYER_X} size={petSize} trackH={trackH} label={isPt ? 'Seu Soulmon' : 'Your Soulmon'} data-scene-pet="player" />
        {discovery && <ScenePet src={discovery.sprite} xPct={SCENE_FOUND_X} size={petSize} trackH={trackH} label={discovery.name} data-scene-pet="found" />}
      </div>

      {discovery && phase !== 'back' && (
        <button type="button" data-scene-skip onClick={skip}
          style={{ ...sm2Button('outline', false, 'sm'), backgroundColor: 'var(--sm2-surface)', position: 'absolute', zIndex: 4, right: 16, bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
          {isPt ? 'Pular' : 'Skip'}
        </button>
      )}

      {phase === 'intro' && (
        <div data-scene-card="intro" style={topCard}>
          <p style={{ ...sm2Text, margin: 0, fontWeight: 600 }}>{title}</p>
          <StrollFind adventure={adventure} isNew={adventureIsNew} stroll={stroll} language={language} />
          <button type="button" data-scene-next="intro" autoFocus onClick={goOnFromIntro} style={{ ...sm2Button('primary'), width: '100%' }}>
            {discovery ? (isPt ? 'Continuar' : 'Continue') : finishLabel}
          </button>
        </div>
      )}

      {phase === 'notice' && (
        <div data-scene-card="notice" role="status" style={topCard}>
          <p style={{ ...sm2Text, margin: 0, fontWeight: 600 }}>{isPt ? 'Espera… tem alguma coisa ali.' : 'Wait… there is something over there.'}</p>
          <button type="button" data-scene-next="notice" autoFocus onClick={() => setPhase('pan-out')} style={{ ...sm2Button('primary'), width: '100%' }}>
            {isPt ? 'Olhar' : 'Look'}
          </button>
        </div>
      )}

      {phase === 'found' && discovery && (
        <div data-scene-card="found" role="status" style={topCard}>
          <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Um novo Soulmon foi descoberto!' : 'A new Soulmon was discovered!'}</p>
          <p data-scene-found-name style={{ ...sm2Text, margin: 0, fontWeight: 600 }}>{discovery.name}</p>
          <p style={{ ...sm2Hint, margin: 0 }}>
            {dexElementName(discovery.element, isPt) ?? discovery.element}{' · '}{isPt ? 'Entrou no Drive.' : 'Added to the Drive.'}
          </p>
          <button type="button" data-scene-next="found" autoFocus onClick={confirmDiscovery} style={{ ...sm2Button('primary'), width: '100%' }}>OK</button>
        </div>
      )}

      {phase === 'back' && (
        <div data-scene-card="back" style={{ ...topCard, top: 'auto', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
          <button type="button" data-scene-next="back" autoFocus onClick={onFinish} style={{ ...sm2Button('primary'), width: '100%' }}>{finishLabel}</button>
        </div>
      )}
    </div>
  );
}
