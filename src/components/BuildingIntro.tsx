import { useMemo } from 'react';
import { NpcSequence, type NpcSequenceLine } from './NpcSequence';
import { buildingIntroView } from '../utils/buildingIntroCopy';
import { lotNpcArt } from '../assets/soulmon/npcs';
import type { BuildingId } from '../utils/gates';
import type { AreaId } from '../navigation';
import type { Language } from '../utils/i18n';

/**
 * O NPC APRESENTA O PRÉDIO NOVO (08/10/2026, pedido do dono). Intersticial: monta quando um prédio do Mapa acaba de
 * abrir porque o Vínculo cresceu (`utils/buildingIntro.ts` decide QUAL e QUANDO; `buildingIntroCopy.ts` é o texto).
 *
 * 14/10/2026 (dono, por voz): NÃO é mais o bottom sheet com "Próximo/Ir lá/Depois". É a `NpcSequence` — tela cheia, o
 * NPC BEM GRANDE e a janela de texto, toque em qualquer lugar avança, "Pular/Skip" discreto no canto superior esquerdo.
 * A intro dispara só na PRIMEIRA entrada em cada prédio (14/10/2026); o componente aceita vários prédios (uma sequência), e
 * "Pular" encerra a sequência inteira. O "visto" é gravado por quem monta (ao MOSTRAR, não ao fechar — fila de
 * modais, `utils/presentationQueue.ts`); este componente não grava nada, não toca som, não dá recompensa.
 */
export function BuildingIntro({ ids, language, onFinish }: {
  /** Os prédios a apresentar, na ordem da fila (`pendingBuildingIntros`). */
  ids: readonly BuildingId[];
  language: Language;
  onFinish: (how: 'done' | 'skip') => void;
}) {
  const lines = useMemo<NpcSequenceLine[]>(() => ids.flatMap(id => {
    const view = buildingIntroView(id, language);
    const [area, lot] = id.split('.') as [AreaId, string];
    const art = lotNpcArt(area, lot);
    return view.lines.map(text => ({ speaker: view.npcName, art, text }));
  }), [ids, language]);

  return <NpcSequence lines={lines} language={language} onFinish={onFinish} />;
}

export default BuildingIntro;
