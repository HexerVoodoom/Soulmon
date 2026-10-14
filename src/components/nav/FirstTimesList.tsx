import type { Language } from '../../utils/i18n';
import type { BuildingId } from '../../utils/gates';
import { firstStatus, firstTimesFor, type FirstTime, type FirstTimesState } from '../../utils/dailyMissions';
import { mercadoLots, arenaLots, laboratorioLots, hallLots } from '../../utils/areaSheetCopy';
import { exploracaoLots, jogosLots } from '../../utils/playAreaLots';
import { sm2Button, sm2Hint } from '../form/FormKit';
import { MissionMark } from '../play/MissionMark';

export interface FirstTimesProps {
  state: FirstTimesState | undefined;
  bondLevel: number;
  onClaim: (id: string) => void;
}

/** O nome do prédio, do mesmo lugar que o Mapa lê (um dono por rótulo). */
function buildingName(id: BuildingId, language: Language): string {
  const [area, lot] = id.split('.');
  const lots = area === 'mercado' ? mercadoLots(language) : area === 'jogos' ? jogosLots(language) : area === 'exploracao' ? exploracaoLots(language)
    : area === 'arena' ? arenaLots(language) : area === 'laboratorio' ? laboratorioLots(language) : hallLots(language);
  return (lots as { id: string; label: string }[]).find(l => l.id === lot)?.label ?? id;
}

function textOf(f: FirstTime, language: Language): string {
  const isPt = language === 'pt-BR';
  if (f.descPt && f.descEn) return isPt ? f.descPt : f.descEn;
  const nome = buildingName(f.building, language);
  return isPt ? `Conheça: ${nome}` : `Visit: ${nome}`;
}

/**
 * PRIMEIRAS VEZES (`utils/dailyMissions.ts`, REGISTRO §54): missões únicas, 1× na vida. Só convite: a linha diz a estreia; quando ela
 * acontece de verdade fica pronta e o "Resgatar" paga 1 material. As já resgatadas somem da lista (viram só a contagem).
 */
export function FirstTimesList({ language, state, bondLevel, onClaim }: FirstTimesProps & { language: Language }) {
  const isPt = language === 'pt-BR';
  const todas = firstTimesFor(bondLevel);
  const abertas = todas.filter(f => firstStatus(state, f.id) !== 'claimed');
  const feitas = todas.length - abertas.length;
  if (todas.length === 0) return null;
  return (
    <div data-first-times style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {abertas.map(f => {
          const st = firstStatus(state, f.id);
          return (
            <li key={f.id} data-first-time={f.id} data-status={st} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
              <span className="sm2-title" style={{ flex: 1, minWidth: 0, fontSize: 'var(--sm2-text-md)' }}>{textOf(f, language)}</span>
              {st === 'ready' && <MissionMark kind="ready" size={24} isPt={isPt} />}
              {st === 'ready' && (
                <button type="button" style={sm2Button('primary', false, 'sm')} data-claim-first={f.id} onClick={() => onClaim(f.id)}>
                  {isPt ? 'Resgatar' : 'Claim'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p data-first-times-count className="sm2-num" style={{ ...sm2Hint, margin: 0 }}>
        {isPt ? `${feitas} de ${todas.length} já feitas` : `${feitas} of ${todas.length} done`}
      </p>
    </div>
  );
}
