import { useRef, useState } from 'react';
import { Mochila } from '../../home/Mochila';
import { FeedBubble } from '../../home/FeedBubble';
import { PixelIcon } from '../../ui/PixelIcon';
import { pastaGlifo, pastaAbertaGlifo } from '../../../assets/soulmon/icones-ui';
import type { EtapaProps } from './tipos';

interface Props extends EtapaProps {
  /** Estoque real de comida; sem ele, uma maçã de cortesia para a lição. */
  foodInventory?: Record<string, number>;
  /** Alimenta pela regra do App (`handleFeed`). */
  onFeed?: (emoji: string) => void;
  spriteUrl?: string;
  petName?: string;
}

type Fase = 'pasta' | 'arrastar' | 'comendo';

const Z_BLOQUEIO = 110; // abaixo da Mochila (120): ela mesma é o foco na fase de arrastar
const Z_ALVO = 115;
const Z_DICA = 130;

/** D24: o ancião explica "força = tarefa + alimento"; abre a pasta (Arquivos), arrasta o alimento até o Soulmon, ele come. */
export function EtapaAlimentar({ onDone, language = 'pt-BR', foodInventory, onFeed, spriteUrl, petName }: Props) {
  const isPt = language === 'pt-BR';
  const inv = foodInventory && Object.values(foodInventory).some(n => n > 0) ? foodInventory : { '🍎': 1 };
  const [fase, setFase] = useState<Fase>('pasta');
  const [mochilaAberta, setMochilaAberta] = useState(false);
  const [sobre, setSobre] = useState(false);
  const [comida, setComida] = useState<{ emoji: string; n: number } | null>(null);
  const petRef = useRef<HTMLDivElement | null>(null);
  const nome = petName || 'Soulmon';

  const abrir = () => { setMochilaAberta(true); setFase('arrastar'); };
  const fechar = () => { setMochilaAberta(false); setSobre(false); if (fase === 'arrastar') setFase('pasta'); };
  const usar = (emoji: string) => {
    onFeed?.(emoji);
    setMochilaAberta(false);
    setSobre(false);
    setComida({ emoji, n: 1 });
    setFase('comendo');
  };

  const fala = fase === 'pasta'
    ? (isPt ? 'Sua força vem de duas coisas: tarefa e alimento. Abra a pasta Arquivos.' : 'Your strength comes from two things: tasks and food. Open the Files folder.')
    : fase === 'arrastar'
      ? (isPt ? `Arraste um alimento até ${nome}.` : `Drag a food onto ${nome}.`)
      : (isPt ? 'Isso. Agora sim.' : 'There. Now we are talking.');

  return (
    <div data-etapa="alimentar" data-fase={fase} style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
      {fase === 'pasta' && (
        <div data-bloqueio aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: Z_BLOQUEIO, background: 'rgba(0,0,0,.55)' }} />
      )}
      <p role="status" data-anciao-fala style={{ margin: 0, textAlign: 'center', zIndex: Z_DICA, position: 'relative' }}>{fala}</p>

      <div ref={petRef} data-pet-alvo data-sobre={sobre || undefined}
        style={{ position: 'relative', width: 160, height: 160, outline: sobre ? '3px solid var(--sm2-primary-fill, #2dd4bf)' : 'none', borderRadius: 16 }}>
        {spriteUrl && <img src={spriteUrl} alt={nome} width={128} height={128} style={{ imageRendering: 'pixelated', margin: 16 }} />}
        {comida && (
          <FeedBubble emoji={comida.emoji} runKey={comida.n}
            reducedMotion={typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches}
            position={50} onDone={() => { setComida(null); onDone(); }} />
        )}
      </div>

      <div style={{ position: 'relative', zIndex: fase === 'pasta' ? Z_ALVO : undefined, textAlign: 'center' }}>
        {fase === 'pasta' && (
          <div aria-hidden="true" data-seta style={{ fontSize: 28, lineHeight: 1 }}>▼</div>
        )}
        <button type="button" data-cuidado="mochila" onClick={abrir} disabled={fase === 'comendo'}
          aria-haspopup="dialog" aria-expanded={mochilaAberta}
          aria-label={isPt ? 'Arquivos' : 'Files'}
          style={{ minWidth: 56, minHeight: 56, borderRadius: 12 }}>
          <PixelIcon src={mochilaAberta ? pastaAbertaGlifo : pastaGlifo} size={24} />
        </button>
      </div>

      {fase === 'arrastar' && (
        <div aria-hidden="true" data-seta-pet style={{ position: 'fixed', top: 72, left: 0, right: 0, textAlign: 'center', zIndex: Z_DICA, pointerEvents: 'none', fontSize: 28 }}>▲</div>
      )}

      <Mochila open={mochilaAberta} onClose={fechar} foodInventory={inv} language={language}
        onUse={usar} petTargetRef={petRef} onTargetChange={setSobre} petName={nome} />
    </div>
  );
}

export default EtapaAlimentar;
