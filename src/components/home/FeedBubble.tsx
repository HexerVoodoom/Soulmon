import { useEffect, useState } from 'react';
import { eatStages } from '../../utils/eatArt';
import { ITEM_ART } from '../../utils/itemArt';

export const EAT_STAGE_MS = 350;

interface Props {
  emoji: string;
  /** Muda a cada alimentação: reinicia a sequência. */
  runKey: number;
  reducedMotion: boolean;
  position: number;
  onDone: () => void;
}

/** Balão do pet ao comer: a COMIDA dada em 3 estágios e some. Sem arte dos
 *  estágios, só um coração (nunca as mãozinhas). Movimento reduzido: estágio 1 e fade. */
export function FeedBubble({ emoji, runKey, reducedMotion, position, onDone }: Props) {
  const stages = eatStages(emoji);
  const [stage, setStage] = useState(0);
  useEffect(() => {
    setStage(0);
    const ids: ReturnType<typeof setTimeout>[] = [];
    if (stages && !reducedMotion) {
      ids.push(setTimeout(() => setStage(1), EAT_STAGE_MS));
      ids.push(setTimeout(() => setStage(2), EAT_STAGE_MS * 2));
      ids.push(setTimeout(onDone, EAT_STAGE_MS * 3));
    } else {
      ids.push(setTimeout(onDone, stages ? EAT_STAGE_MS * 3 : 1400));
    }
    return () => ids.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey, emoji, reducedMotion]);

  const src = stages ? stages[stage] : ITEM_ART['💗'];
  return (
    <div
      className="absolute z-25 pointer-events-none"
      data-feed-bubble
      data-stage={stages ? stage + 1 : 'heart'}
      style={{ left: `${position}%`, top: 'calc(50% - 46px)', transform: 'translateX(-50%)' }}
    >
      <div className="relative bg-white rounded-full px-2 py-0.5 shadow text-lg leading-none">
        <img src={src} alt="" width={22} height={22}
          style={{ objectFit: 'contain', imageRendering: 'pixelated', display: 'inline-block', verticalAlign: 'middle',
            transition: reducedMotion ? 'opacity 300ms' : undefined }} />
        <span className="absolute" style={{ left: '50%', bottom: -5, transform: 'translateX(-50%)', width: 0, height: 0,
          borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '5px solid #fff' }} />
      </div>
    </div>
  );
}
