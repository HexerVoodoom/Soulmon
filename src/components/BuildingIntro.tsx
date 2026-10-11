import { useCallback, useState } from 'react';
import { RitualDialog, ritualLabel, ritualTitle } from './ritual/RitualKit';
import { sm2Button } from './form/FormKit';
import { NpcSpeech } from './nav/NpcSpeech';
import { lotNpcArt } from '../assets/soulmon/npcs';
import { buildingIntroView } from '../utils/buildingIntroCopy';
import type { BuildingId } from '../utils/gates';
import type { AreaId } from '../navigation';
import type { Language } from '../utils/i18n';

/**
 * O NPC APRESENTA O PRÉDIO NOVO (08/10/2026, pedido do dono). Intersticial: monta quando um prédio do Mapa acaba de
 * abrir porque o Vínculo cresceu (`utils/buildingIntro.ts` decide QUAL e QUANDO; `buildingIntroCopy.ts` é o texto).
 * Um por vez — vários prédios abertos juntos viram uma fila no chamador, e este componente mostra sempre o primeiro.
 *
 * O NPC (busto e nome) é o mesmo da folha do prédio: aparece, diz quem é, o que se faz ali e convida — três balões,
 * um por toque. Regras:
 *  · só fecha por GESTO ("Ir lá", "Depois", Escape): nenhum timer, nenhuma saída sozinha;
 *  · "Ir lá" e "Depois" são o mesmo "visto" para a regra — a apresentação não volta, não cobra, não vira pendência;
 *  · nenhum som (R-NOVA: superfície nova nasce muda), nenhuma recompensa, nenhum XP;
 *  · movimento reduzido reduz a ENTRADA do busto (classe no bloco canônico do `index.css`) e MANTÉM a pausa — os
 *    balões esperam o toque do mesmo jeito.
 */
export function BuildingIntro({ id, language, onGo, onLater }: {
  id: BuildingId;
  language: Language;
  /** "Ir lá": quem chama marca como visto e leva ao prédio. */
  onGo: (id: BuildingId) => void;
  /** "Depois": quem chama só marca como visto. */
  onLater: (id: BuildingId) => void;
}) {
  const isPt = language === 'pt-BR';
  const view = buildingIntroView(id, language);
  const [area, lot] = id.split('.');
  const [i, setI] = useState(0);
  const last = view.lines.length - 1;

  const later = useCallback(() => onLater(id), [onLater, id]);
  const go = useCallback(() => onGo(id), [onGo, id]);
  const next = useCallback(() => setI(n => Math.min(n + 1, last)), [last]);

  return (
    <RitualDialog labelledBy="bi-title" onClose={later} zIndex={200} maxWidth={380}>
      <div data-building-intro={id} data-step={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={ritualLabel} data-bi-kicker>
          {isPt ? 'Um lugar novo no Mapa' : 'A new place on the Map'}
        </p>

        <p id="bi-title" style={ritualTitle} data-bi-title>{view.place}</p>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <img
            src={lotNpcArt(area as AreaId, lot)}
            alt=""
            aria-hidden="true"
            width={96}
            height={96}
            draggable={false}
            className="sm-npc-intro"
            data-bi-npc
            style={{ flex: 'none', width: 96, height: 96, objectFit: 'contain', objectPosition: 'bottom', display: 'block', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.5))' }}
          />
          <div aria-live="polite" style={{ flex: 1, minWidth: 0, display: 'flex' }}>
            <NpcSpeech name={view.npcName} line={view.lines[i]} speakerKey={`intro:${id}:${i}`} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button type="button" onClick={later} data-bi-later style={sm2Button('ghost', false, 'sm')}>
            {isPt ? 'Depois' : 'Later'}
          </button>
          {i < last ? (
            <button type="button" onClick={next} data-bi-next style={{ ...sm2Button('primary'), flex: 1 }}>
              {isPt ? 'Próximo' : 'Next'}
            </button>
          ) : (
            <button type="button" onClick={go} data-bi-go style={{ ...sm2Button('primary'), flex: 1 }}>
              {isPt ? 'Ir lá' : 'Go there'}
            </button>
          )}
        </div>
      </div>
    </RitualDialog>
  );
}

export default BuildingIntro;
