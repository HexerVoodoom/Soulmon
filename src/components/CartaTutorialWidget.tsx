import { useState } from 'react';
import { TUTORIAL_WIDGET_ART } from '../assets/soulmon/cartas';

/** A imagem da carta global do widget (§288): o casco do widget com cenário no LCD, sem Soulmon. Sem o arquivo (ou se falhar) não mostra nada: o texto da carta basta. */
export function CartaTutorialWidget({ isPt }: { isPt: boolean }) {
  const [falhou, setFalhou] = useState(false);
  if (!TUTORIAL_WIDGET_ART || falhou) return null;
  return (
    <img data-carta-widget-img src={TUTORIAL_WIDGET_ART} alt={isPt ? 'O widget do Soulmon' : 'The Soulmon widget'} loading="lazy"
      onError={() => setFalhou(true)} style={{ width: '100%', height: 'auto', borderRadius: 'var(--sm2-radius-md)', display: 'block' }} />
  );
}
