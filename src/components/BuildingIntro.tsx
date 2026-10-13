import { useCallback, useState } from 'react';
import { ritualLabel } from './ritual/RitualKit';
import { sm2Button } from './form/FormKit';
import { AreaSheet } from './nav/AreaSheet';
import { buildingIntroView } from '../utils/buildingIntroCopy';
import type { BuildingId } from '../utils/gates';
import type { AreaId } from '../navigation';
import type { Language } from '../utils/i18n';

/**
 * O NPC APRESENTA O PRÉDIO NOVO (08/10/2026, pedido do dono). Intersticial: monta quando um prédio do Mapa acaba de
 * abrir porque o Vínculo cresceu (`utils/buildingIntro.ts` decide QUAL e QUANDO; `buildingIntroCopy.ts` é o texto).
 * Um por vez — vários prédios abertos juntos viram uma fila no chamador, e este componente mostra sempre o primeiro.
 *
 * BETA-2 (13/10/2026, 7.1/13.1): vive no MESMO bottom sheet dos prédios e do mercado (`AreaSheet`), e não mais num
 * diálogo central — modal central é para alerta. O NPC (busto e nome) é o mesmo da folha do prédio: aparece, diz quem
 * é, o que se faz ali e convida — três balões, um por toque. Regras:
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
  const [area, lot] = id.split('.') as [AreaId, string];
  const [i, setI] = useState(0);
  const last = view.lines.length - 1;

  const later = useCallback(() => onLater(id), [onLater, id]);
  const go = useCallback(() => onGo(id), [onGo, id]);
  const next = useCallback(() => setI(n => Math.min(n + 1, last)), [last]);

  return (
    /* O contêiner `fixed` dá à folha (absoluta por natureza) a tela inteira; fechar por fora, pelo ✕ ou por
       Escape é "Depois" (o mesmo "visto" da regra). */
    <div data-building-intro-root style={{ position: 'fixed', inset: 0, zIndex: 200 }}>
      <AreaSheet
        areaId={area}
        lotId={lot}
        language={language}
        title={view.place}
        closeLabel={isPt ? 'Fechar' : 'Close'}
        open
        onClose={later}
        speech={{ name: view.npcName, line: view.lines[i], key: `intro:${id}:${i}` }}
      >
        <div data-building-intro={id} data-step={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={ritualLabel} data-bi-kicker>
            {isPt ? 'Um lugar novo no Mapa' : 'A new place on the Map'}
          </p>

          {/* P5 (beta-2): a ação principal em CIMA, largura toda; "Depois" é um botão SECUNDÁRIO (contorno), não um texto solto ao lado. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {i < last ? (
              <button type="button" onClick={next} data-bi-next style={{ ...sm2Button('primary'), width: '100%' }}>
                {isPt ? 'Próximo' : 'Next'}
              </button>
            ) : (
              <button type="button" onClick={go} data-bi-go style={{ ...sm2Button('primary'), width: '100%' }}>
                {isPt ? 'Ir lá' : 'Go there'}
              </button>
            )}
            <button type="button" onClick={later} data-bi-later style={{ ...sm2Button('outline'), width: '100%' }}>
              {isPt ? 'Depois' : 'Later'}
            </button>
          </div>
        </div>
      </AreaSheet>
    </div>
  );
}

export default BuildingIntro;
