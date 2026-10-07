import { useEffect, useMemo, useState } from 'react';
import { ModalSheet, Field, Segment, sm2Hint, sm2Text } from '../form/FormKit';
import { FrameSelector } from '../ui/AvatarFrame';
import { UserAvatar } from '../ui/UserAvatar';
import { AvatarImg } from '../ui/AvatarImg';
import { lineIconForStage } from '../../utils/lineIcons';
import { getSpriteForStage } from '../../utils/sprites';
import { getRank } from '../../utils/community';
import { getTierStanding, resolveSeasonPlace } from '../../utils/tournamentTiers';
import { resolveEquippedFrame, type FrameContext } from '../../utils/frames';
import { resolveAvatarId } from '../../utils/avatar';
import { AVATAR_CATALOG, AVATAR_GROUPS, avatarAlt } from '../../utils/avatarCopy';
import type { Language } from '../../utils/i18n';

/** Contexto de moldura (rank vivo do servidor), o mesmo cálculo do Torneio. Sem rede, só posse/faixa mais baixa. */
function useFrameContext(saveId: string, owned: string[]): FrameContext {
  const [ctx, setCtx] = useState<FrameContext>({ owned, lifetimeTierId: getTierStanding(0).tier.id, seatIds: [] });
  useEffect(() => {
    let vivo = true;
    getRank(undefined, saveId).then(r => {
      if (!vivo) return;
      const rows = r.rank ?? [];
      const life = rows.find(x => x.id === saveId)?.lifetime ?? r.me?.lifetime ?? 0;
      const place = resolveSeasonPlace(typeof r.myPlace === 'number' ? r.myPlace : null, rows.findIndex(x => x.id === saveId));
      const st = getTierStanding(life, place);
      setCtx({ owned, lifetimeTierId: getTierStanding(life).tier.id, seatIds: st.seat ? (st.tier.id === 'grao-mestre' ? ['mestre', 'grao-mestre'] : ['mestre']) : [] });
    }).catch(() => {});
    return () => { vivo = false; };
  }, [saveId, owned]);
  return ctx;
}

/** EDITAR PERFIL: e-mail (em breve), moldura e foto. Só IDs de listas fechadas vão para o save. */
export function ProfileEditor({ open, onClose, language, saveId, email, avatarId, equippedFrame, ownedFrames, petStage, onChangeAvatar, onChangeFrame }: {
  open: boolean; onClose: () => void; language: Language; saveId: string; email?: string | null;
  avatarId: string | null; equippedFrame: string | null; ownedFrames: string[]; petStage: string;
  onChangeAvatar: (id: string) => void; onChangeFrame: (id: string | null) => void;
}) {
  const isPt = language === 'pt-BR';
  const ctx = useFrameContext(saveId, ownedFrames);
  const frame = resolveEquippedFrame(equippedFrame, ctx);
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('all');
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return AVATAR_CATALOG.map((e, i) => ({ e, i })).filter(({ e, i }) =>
      (group === 'all' || e.g === group) && (!t || avatarAlt(e, i, isPt).toLowerCase().includes(t) || e.n.includes(t)));
  }, [q, group, isPt]);
  const current = resolveAvatarId(avatarId, saveId);
  const groups = ['all', ...Array.from(new Set(AVATAR_CATALOG.map(e => e.g)))];
  const sec = { margin: '16px 0 8px', fontSize: 'var(--sm2-text-sm)', fontWeight: 600, color: 'var(--sm2-ink)' } as const;
  return (
    <ModalSheet open={open} onClose={onClose} language={language} title={isPt ? 'Editar perfil' : 'Edit profile'}>
      <div data-profile-editor style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
          <UserAvatar avatarId={avatarId} frameId={frame?.id ?? null} seed={saveId} size={72} alt={isPt ? 'Sua foto de perfil' : 'Your profile picture'} />
        </div>
        <label style={sm2Text} htmlFor="sm-profile-email">{isPt ? 'E-mail' : 'Email'}</label>
        <Field id="sm-profile-email" type="email" value={email ?? ''} disabled readOnly placeholder={isPt ? 'em breve' : 'coming soon'} />
        <p style={sm2Hint}>{isPt ? 'Trocar o e-mail: em breve.' : 'Changing your email: coming soon.'}</p>

        <h3 style={sec}>{isPt ? 'Moldura' : 'Frame'}</h3>
        <FrameSelector ctx={ctx} equipped={frame?.id ?? null} onEquip={onChangeFrame} previewSrc={lineIconForStage(petStage, 32) ?? getSpriteForStage(petStage)} isPt={isPt} />

        <h3 style={sec}>{isPt ? 'Foto' : 'Picture'}</h3>
        <Field type="search" value={q} onChange={e => setQ(e.target.value)} aria-label={isPt ? 'Buscar foto' : 'Search pictures'} placeholder={isPt ? 'Buscar' : 'Search'} />
        <div role="radiogroup" aria-label={isPt ? 'Domínio' : 'Domain'} style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '8px 0' }}>
          {groups.map(g => (
            <Segment key={g} tonal selected={group === g} onSelect={() => setGroup(g)}
              label={g === 'all' ? (isPt ? 'Todos' : 'All') : (isPt ? AVATAR_GROUPS[g]?.pt : AVATAR_GROUPS[g]?.en) ?? g} />
          ))}
        </div>
        <ul data-avatar-grid style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 64px)', justifyContent: 'space-between', gap: 8 }}>
          {shown.map(({ e, i }) => {
            const on = e.id === current;
            return (
              <li key={e.id}>
                <button type="button" data-avatar-option={e.id} aria-pressed={on} onClick={() => onChangeAvatar(e.id)}
                  aria-label={avatarAlt(e, i, isPt)}
                  style={{ width: 64, height: 64, padding: 0, cursor: 'pointer', borderRadius: '50%', overflow: 'hidden',
                    background: 'var(--sm2-surface-2)', border: on ? '2px solid var(--sm2-primary-ink)' : '1px solid var(--sm2-line)' }}>
                  <AvatarImg id={e.id} size={64} alt="" />
                </button>
              </li>
            );
          })}
        </ul>
        {shown.length === 0 && <p style={sm2Hint}>{isPt ? 'Nada encontrado.' : 'Nothing found.'}</p>}
      </div>
    </ModalSheet>
  );
}
