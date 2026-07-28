import { X, Clock, ListChecks, Trophy } from 'lucide-react';
import { PowerIcon, HarmonyIcon, BenevolenceIcon } from './AlignmentIcons';
import { getStageBranch } from '../types/progression';
import { getSpriteForStage } from '../utils/sprites';
import type { DirectoryPlayer } from '../utils/community';
import type { Language } from '../utils/i18n';

type Attr = 'virus' | 'data' | 'vaccine';
const ATTR_LABEL: Record<Attr, { pt: string; en: string }> = {
  virus: { pt: 'Poder', en: 'Power' },
  data: { pt: 'Harmonia', en: 'Harmony' },
  vaccine: { pt: 'Benevolência', en: 'Benevolence' },
};
const ATTR_ICON: Record<Attr, typeof PowerIcon> = { virus: PowerIcon, data: HarmonyIcon, vaccine: BenevolenceIcon };
const ATTR_COLOR: Record<Attr, string> = { virus: '#e0483e', data: '#009ED8', vaccine: '#d9a441' };

interface PlayerDetailModalProps {
  player: DirectoryPlayer & { isNpc?: boolean; spriteUrl?: string };
  language: Language;
  onClose: () => void;
}

/**
 * Perfil resumido de outro jogador (Biblioteca) — nick, tempo de jogo,
 * tarefas feitas, rank e SOMENTE o branch atual do pet (derivado do próprio
 * `stage`, então nunca vaza forma além da que o jogador já alcançou).
 */
export function PlayerDetailModal({ player, language, onClose }: PlayerDetailModalProps) {
  const isPt = language === 'pt-BR';
  const branch = getStageBranch(player.stage);
  const BranchIcon = branch ? ATTR_ICON[branch] : null;

  const rows: { Icon: typeof Clock; label: string; value: string }[] = [
    { Icon: Clock, label: isPt ? 'Tempo de jogo' : 'Playtime', value: isPt ? `${player.daysPlaying} dias` : `${player.daysPlaying} days` },
    { Icon: ListChecks, label: isPt ? 'Tarefas feitas' : 'Tasks done', value: `${player.tasksDone}` },
    { Icon: Trophy, label: isPt ? 'Rank' : 'Rank', value: `${player.rankPoints}` },
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
            style={{ position: 'absolute', top: 12, right: 12, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sm-bg)', border: 'none', borderRadius: 999, color: 'var(--sm-muted)', cursor: 'pointer' }}
          >
            <X size={16} strokeWidth={2.2} />
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
              <span style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--sm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <r.Icon size={16} color="var(--sm-muted)" strokeWidth={2.2} />
              </span>
              <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--sm-muted)' }}>{r.label}</span>
              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--sm-ink)' }}>{r.value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
            <span style={{ width: 30, height: 30, borderRadius: 10, background: branch ? `${ATTR_COLOR[branch]}22` : 'var(--sm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {BranchIcon ? <BranchIcon size={16} color={ATTR_COLOR[branch!]} strokeWidth={2.2} /> : <span style={{ fontSize: 13, color: 'var(--sm-muted)' }}>?</span>}
            </span>
            <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--sm-muted)' }}>{isPt ? 'Caminho do pet' : "Pet's path"}</span>
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: branch ? ATTR_COLOR[branch] : 'var(--sm-muted)' }}>
              {branch ? (isPt ? ATTR_LABEL[branch].pt : ATTR_LABEL[branch].en) : (isPt ? 'Ainda não escolhido' : 'Not chosen yet')}
            </span>
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
