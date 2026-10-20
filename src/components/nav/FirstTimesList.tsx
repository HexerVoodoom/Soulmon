import { missionsInQueueOrder } from '../../utils/missionOrder';
import type { Language } from '../../utils/i18n';
import type { BuildingId } from '../../utils/gates';
import { firstStatus, firstTimesFor, type FirstTime, type FirstTimesState } from '../../utils/dailyMissions';
import { mercadoLots, arenaLots, laboratorioLots, hallLots } from '../../utils/areaSheetCopy';
import { exploracaoLots, jogosLots } from '../../utils/playAreaLots';
import { sm2Hint } from '../form/FormKit';
import { ClaimButton, MissionCard, MissionCardList, resolveGo, type MissionNav } from './MissionCard';

export interface FirstTimesProps {
  state: FirstTimesState | undefined;
  bondLevel: number;
  onClaim: (id: string) => void;
  /** Para onde a missão leva (REGISTRO §62). */
  nav?: MissionNav;
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

/** A6: o jogador resgatou TODAS as primeiras vezes do Vínculo dele — a seção inteira some. */
export function allFirstTimesClaimed(state: FirstTimesState | undefined, bondLevel: number): boolean {
  const todas = firstTimesFor(bondLevel);
  return todas.length > 0 && todas.every(f => firstStatus(state, f.id) === 'claimed');
}

/**
 * PRIMEIRAS VEZES (`utils/dailyMissions.ts`, REGISTRO §54): missões únicas, 1× na vida. Só convite: a linha diz a estreia; quando ela
 * acontece de verdade fica pronta e o "Resgatar" paga 1 material. As já resgatadas somem da lista (viram só a contagem).
 */
export function FirstTimesList({ language, state, bondLevel, onClaim, nav }: FirstTimesProps & { language: Language }) {
  const isPt = language === 'pt-BR';
  const todas = firstTimesFor(bondLevel);
  const abertas = todas.filter(f => firstStatus(state, f.id) !== 'claimed');
  const feitas = todas.length - abertas.length;
  if (todas.length === 0 || abertas.length === 0) return null; // A6: fez todas = a lista some
  return (
    <div data-first-times style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <MissionCardList>
        {missionsInQueueOrder(abertas, f => (firstStatus(state, f.id) === 'ready' ? 'ready' : 'open')).map(f => {
          const st = firstStatus(state, f.id);
          const go = resolveGo(nav, f.building, language);
          return (
            <MissionCard
              key={f.id}
              language={language}
              attrs={{ 'data-first-time': f.id, 'data-status': st }}
              status={st === 'available' ? 'open' : st}
              title={textOf(f, language)}
              reward="+1 material"
              onGo={go.onGo}
              lockNote={go.lockNote}
              action={<ClaimButton language={language} attrs={{ 'data-claim-first': f.id }} onClick={() => onClaim(f.id)} />}
            />
          );
        })}
      </MissionCardList>
      <p data-first-times-count className="sm2-num" style={{ ...sm2Hint, margin: 0 }}>
        {isPt ? `${feitas} de ${todas.length} já feitas` : `${feitas} of ${todas.length} done`}
      </p>
    </div>
  );
}
