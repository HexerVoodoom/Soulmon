import { useMemo } from 'react';
import { NpcSequence, type NpcSequenceLine } from './NpcSequence';
import ravenMascot from '../assets/soulmon/mascot-raven.png';
import { AREA_NPC_ART } from '../assets/soulmon/npcs';
import { areaNpcVoice } from '../utils/areaNpcVoice';
import { MAP_TOUR_STEPS, tourGuideName, tourText } from '../utils/welcomeTour';
import type { AreaId } from '../navigation';
import type { Language } from '../utils/i18n';

/**
 * O TUTORIAL DO MAPA (14/10/2026, pedido do dono por voz): "quando a pessoa entrar no mapa pela primeira vez é que carrega o
 * tutorial do mapa, falando o que é cada prédio". É um item da FILA CENTRAL (`mapTutorial`, `utils/presentationQueue.ts`) e
 * usa a `NpcSequence` — tela cheia, o NPC grande, toque avança, "Pular/Skip" no canto — em vez de um sistema paralelo.
 *
 * Uma fala de abertura (o corvo) e UMA fala por área (o NPC da área, com a lista dos prédios dela). O conteúdo é o
 * `MAP_TOUR_STEPS` (`utils/welcomeTour.ts`, EN + PT-BR). Este componente não grava nada, não toca som, não dá recompensa:
 * quem monta (`App.tsx`) grava `mapTutorialSeen` AO MOSTRAR, então visto OU pulado nunca volta.
 */
export function MapTutorial({ language, onFinish }: { language: Language; onFinish: (how: 'done' | 'skip') => void }) {
  const lines = useMemo<NpcSequenceLine[]>(() => MAP_TOUR_STEPS.map(step => {
    const speech = tourText(step.speech, language);
    const area = step.id.startsWith('map-') ? (step.id.slice(4) as AreaId) : null;
    if (!area || !step.areas || !(area in AREA_NPC_ART)) {
      return { speaker: tourGuideName(language), art: ravenMascot, text: speech };
    }
    const rows = step.areas.map(r => `• ${tourText(r.name, language)}: ${tourText(r.line, language)}`).join('\n');
    return { speaker: areaNpcVoice(area, language).name, art: AREA_NPC_ART[area], text: `${speech}\n${rows}` };
  }), [language]);

  return <NpcSequence lines={lines} language={language} onFinish={onFinish} label={language === 'pt-BR' ? 'Tutorial do mapa' : 'Map tutorial'} />;
}

export default MapTutorial;
