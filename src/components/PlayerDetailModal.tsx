import { RowIcon } from './RowIcon';
import iconActivities from '../assets/soulmon/icons/icon-activities.png';
import iconClock from '../assets/soulmon/icons/icon-clock.png';
import iconTrophy from '../assets/soulmon/icons/games/icon-game-tournament.png';
import iconClose from '../assets/soulmon/icons/icon-close.png';
import { FORM_REQUIREMENTS, getStageBranch, getStageLevel } from '../types/progression';
import { getSpriteForStage } from '../utils/sprites';
import { ATTR_COLOR, ATTR_ICON, ATTR_LABEL } from '../types/attributes';
import type { DirectoryPlayer } from '../utils/community';
import type { Language } from '../utils/i18n';

// Rótulo e ícone vêm de `types/attributes.ts`. Este arquivo mantinha uma
// SEGUNDA cópia do mapa de rótulos, idêntica à de `EvolutionPath` — e enquanto
// as duas concordavam, a `StatsPage` não usava nenhuma e mostrava o nome
// interno cru. Duas cópias que concordam ainda são duas cópias.

const LEVEL_LABEL: Record<string, { pt: string; en: string }> = {
  rookie: { pt: 'Rookie', en: 'Rookie' },
  champion: { pt: 'Campeão', en: 'Champion' },
  ultimate: { pt: 'Supremo', en: 'Ultimate' },
  mega: { pt: 'Mega', en: 'Mega' },
  ultra: { pt: 'Ultra', en: 'Ultra' },
};
const LEVEL_ORDER = Object.keys(FORM_REQUIREMENTS);

interface PlayerDetailModalProps {
  player: DirectoryPlayer & { isNpc?: boolean; spriteUrl?: string };
  language: Language;
  onClose: () => void;
}

/**
 * Perfil resumido de outro jogador (Biblioteca) — nick, tempo de jogo,
 * tarefas feitas, rank e o branch ATUAL do pet com TODO o progresso já
 * desbloqueado nele (não só o nível atual) — sempre derivado do próprio
 * `unlockedStages`, então nunca vaza forma além da já alcançada.
 */
export function PlayerDetailModal({ player, language, onClose }: PlayerDetailModalProps) {
  const isPt = language === 'pt-BR';
  const branch = getStageBranch(player.stage);
  const branchIcon = branch ? ATTR_ICON[branch] : null;

  // Todos os estágios desbloqueados NO branch atual (rookie é o tronco
  // comum, sem branch, sempre incluído), ordenados por nível.
  const branchLevels = (player.unlockedStages ?? [])
    .filter(s => s === 'rookie' || getStageBranch(s) === branch)
    .sort((a, b) => LEVEL_ORDER.indexOf(getStageLevel(a)) - LEVEL_ORDER.indexOf(getStageLevel(b)));

  const rows: { icon: string; label: string; value: string }[] = [
    { icon: iconClock, label: isPt ? 'Tempo de jogo' : 'Playtime', value: isPt ? `${player.daysPlaying} dias` : `${player.daysPlaying} days` },
    { icon: iconActivities, label: isPt ? 'Tarefas feitas' : 'Tasks done', value: `${player.tasksDone}` },
    { icon: iconTrophy, label: isPt ? 'Rank' : 'Rank', value: `${player.rankPoints}` },
  ];

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(42,36,64,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}
    >
      <div className="sm-card" style={{ width: '100%', maxWidth: 320, padding: 0, overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ position: 'relative', padding: '24px 20px 16px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            aria-label={isPt ? 'Fechar' : 'Close'}
            /* 44x44 de area de toque (WCAG 2.2 AA 2.5.8) com o circulo de 30px
               desenhado dentro; top/right recuados em 7px para o circulo ficar
               exatamente onde estava. Fechar um modal e a saida de emergencia
               da UI — e o pior lugar para um alvo pequeno. */
            style={{ position: 'absolute', top: 5, right: 5, width: 44, height: 44, padding: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span aria-hidden="true" style={{ width: 30, height: 30, borderRadius: 999, background: 'var(--sm-bg)', color: 'var(--sm-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={iconClose} alt="" width={16} height={16} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
            </span>
          </button>
          <img
            src={player.spriteUrl ?? getSpriteForStage(player.stage)}
            alt=""
            style={{ width: 64, height: 64, objectFit: 'contain', imageRendering: 'pixelated', margin: '0 auto 8px', display: 'block' }}
          />
          <p style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--sm-ink)', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {player.name}
            {player.isNpc && (
              <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--sm-muted)', background: 'var(--sm-bg)', borderRadius: 999, padding: '2px 7px' }}>
                NPC
              </span>
            )}
          </p>
          {player.petName && <p style={{ fontSize: '0.8rem', color: 'var(--sm-muted)', margin: '2px 0 0' }}>{player.petName}</p>}
        </div>

        <div style={{ padding: '4px 20px 6px' }}>
          {rows.map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
              <span style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <RowIcon icon={r.icon} size={22} color="var(--sm-muted)" />
              </span>
              <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--sm-muted)' }}>{r.label}</span>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--sm-ink)' }}>{r.value}</span>
            </div>
          ))}

          {/* Caminho do pet — TODO o branch já desbloqueado, não só o nível atual */}
          <div style={{ padding: '8px 0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ width: 30, height: 30, borderRadius: 10, background: branch ? `${ATTR_COLOR[branch]}22` : 'var(--sm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {branchIcon
                  ? <img src={branchIcon} alt="" width={18} height={18} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
                  : <span style={{ fontSize: 13, color: 'var(--sm-muted)' }}>?</span>}
              </span>
              <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--sm-muted)' }}>
                {isPt ? 'Caminho do pet' : "Pet's path"}
                {branch && <> · <span style={{ color: ATTR_COLOR[branch], fontWeight: 700 }}>{isPt ? ATTR_LABEL[branch].pt : ATTR_LABEL[branch].en}</span></>}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingLeft: 40 }}>
              {branchLevels.length === 0 ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--sm-muted)' }}>{isPt ? 'Ainda não escolhido' : 'Not chosen yet'}</span>
              ) : branchLevels.map(stage => {
                const level = getStageLevel(stage);
                const isCurrent = stage === player.stage;
                return (
                  <span
                    key={stage}
                    style={{
                      fontSize: '0.74rem', fontWeight: isCurrent ? 800 : 600,
                      padding: '4px 10px', borderRadius: 999,
                      background: isCurrent ? (branch ? ATTR_COLOR[branch] : 'var(--sm-primary)') : 'var(--sm-bg)',
                      color: isCurrent ? '#fff' : 'var(--sm-ink)',
                    }}
                  >
                    {isPt ? LEVEL_LABEL[level].pt : LEVEL_LABEL[level].en}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 20px 20px' }}>
          <button onClick={onClose} className="sm-btn sm-btn-secondary" style={{ width: '100%' }}>
            {isPt ? 'Fechar' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
