import { useEffect, useMemo, useRef, useState } from 'react';
import { ModalSheet, Field, Segment, sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { EspecialNomeLeitura } from './EspecialNomeLeitura';
import { FrameSelector } from '../ui/AvatarFrame';
import { UserAvatar } from '../ui/UserAvatar';
import { AvatarImg } from '../ui/AvatarImg';
import { lineIconForStage } from '../../utils/lineIcons';
import { getSpriteForStage } from '../../utils/sprites';
import { getRank, reserveNickname } from '../../utils/community';
import { getTierStanding, resolveSeasonPlace } from '../../utils/tournamentTiers';
import { resolveEquippedFrame, type FrameContext } from '../../utils/frames';
import { resolveAvatarId } from '../../utils/avatar';
import { requestOpenFrameShop } from '../../utils/frameShopNav';
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
export function ProfileEditor({ open, onClose, language, saveId, email, avatarId, equippedFrame, ownedFrames, fundadorPremios, petStage, petElement, onChangeAvatar, onChangeFrame, userName = '', onChangeName, petName = '', onOpenFrameShop, especialNome }: {
  open: boolean; onClose: () => void; language: Language; saveId: string; email?: string | null;
  avatarId: string | null; equippedFrame: string | null; ownedFrames: string[]; fundadorPremios?: string[]; petStage: string; petElement?: string;
  onChangeAvatar: (id: string) => void; onChangeFrame: (id: string | null) => void;
  /** Nome público do jogador (B8). Sem `onChangeName` o campo não aparece. */
  userName?: string; onChangeName?: (name: string) => void;
  /** Nome do Soulmon (`soulmonMeta.petName`): só leitura aqui, a troca é na Hexsmith. */
  petName?: string;
  /** D-16: o Perfil NÃO compra moldura. A de loja que a pessoa não tem aparece trancada e o toque abre Mercado > Frames
   *  (por padrão, o pedido vai pelo evento de `utils/frameShopNav`, que o `App` atende). */
  onOpenFrameShop?: () => void;
  /** Nome do especial do Soulmon (público para quem duela): só leitura aqui, a troca é na Hexsmith. */
  especialNome?: string;
}) {
  const isPt = language === 'pt-BR';
  const ctx = useFrameContext(saveId, ownedFrames);
  const frame = resolveEquippedFrame(equippedFrame, ctx);
  const [q, setQ] = useState('');
  const [nameDraft, setNameDraft] = useState(userName);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  useEffect(() => { setNameDraft(userName); setNameSaved(false); setNameError(null); }, [userName, open]);
  const nameTrim = nameDraft.trim();
  const nameOk = nameTrim.length >= 2;
  const nameCanSave = nameOk && nameTrim !== userName;
  /** Reserva no servidor antes de gravar: nome em uso por OUTRA conta é recusado com aviso; falha de rede não bloqueia (o servidor confere de novo ao publicar). */
  /** Guarda de reentrada: blur + clique no Salvar disparavam `commitName` 2× (e 2 reservas) antes de o `userName` mudar. */
  const savingName = useRef<string | null>(null);
  const commitName = async () => {
    if (!onChangeName || !nameOk || nameTrim === userName || savingName.current === nameTrim) return;
    savingName.current = nameTrim;
    try {
      await commitNameInner();
    } finally {
      savingName.current = null;
    }
  };
  const commitNameInner = async () => {
    try {
      await reserveNickname(saveId, nameTrim);
    } catch (e) {
      if (e instanceof Error && e.message === 'name taken') {
        setNameError(isPt ? 'Esse nome já está em uso. Escolha outro.' : 'That name is already taken. Pick another.');
        setNameSaved(false);
        return;
      }
    }
    setNameError(null);
    onChangeName?.(nameTrim);
    setNameSaved(true);
  };


  const [group, setGroup] = useState('all');
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return AVATAR_CATALOG.map((e, i) => ({ e, i })).filter(({ e }) => e.g !== 'founder' || !!fundadorPremios?.includes(e.id)).filter(({ e, i }) =>
      (group === 'all' || e.g === group) && (!t || avatarAlt(e, i, isPt).toLowerCase().includes(t) || e.n.includes(t)));
  }, [q, group, isPt, fundadorPremios]);
  const current = resolveAvatarId(avatarId, saveId);
  const groups = ['all', ...Array.from(new Set(AVATAR_CATALOG.filter(e => e.g !== 'founder' || !!fundadorPremios?.includes(e.id)).map(e => e.g)))];
  const sec = { margin: '16px 0 8px', fontSize: 'var(--sm2-text-sm)', fontWeight: 600, color: 'var(--sm2-ink)' } as const;
  return (
    <ModalSheet open={open} onClose={onClose} language={language} title={isPt ? 'Editar perfil' : 'Edit profile'}>
      <div data-profile-editor style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: 16 }}>
          <UserAvatar avatarId={avatarId} frameId={frame.id} seed={saveId} size={72} alt={isPt ? 'Sua foto de perfil' : 'Your profile picture'} />
        </div>
        {onChangeName && (
          <>
            <label style={sm2Text} htmlFor="sm-profile-name">{isPt ? 'Apelido' : 'Nickname'}</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
              <Field id="sm-profile-name" type="text" value={nameDraft} maxLength={24} autoComplete="nickname"
                style={{ flex: 1 }}
                warn={!!nameError} aria-invalid={nameError ? true : undefined} aria-describedby={nameError ? 'sm-profile-name-err' : undefined}
                onChange={e => { setNameDraft(e.target.value); setNameSaved(false); setNameError(null); }}
                onBlur={() => { void commitName(); }} />
              <button
                type="button"
                data-save-user-name
                disabled={!nameCanSave}
                style={sm2Button('primary', !nameCanSave, 'sm')}
                onClick={() => { void commitName(); }}
              >
                {nameSaved && !nameCanSave ? (isPt ? 'Salvo' : 'Saved') : (isPt ? 'Salvar' : 'Save')}
              </button>
            </div>
            {nameError && <p id="sm-profile-name-err" role="alert" style={sm2Hint}>{nameError}</p>}
            <p style={sm2Hint}>{isPt ? 'É o nome que outros jogadores veem. Mínimo de 2 letras.' : 'The name other players see. At least 2 letters.'}</p>
          </>
        )}
        {petName && (
          <div data-profile-pet-name style={{ marginTop: 12 }}>
            <span style={sm2Text}>{isPt ? 'Nome do Soulmon' : 'Soulmon name'}</span>
            <p style={{ ...sm2Text, margin: '4px 0 0', fontWeight: 600 }} data-profile-pet-name-valor>{petName}</p>
            <p style={sm2Hint}>{isPt ? 'Troque na Hexsmith.' : 'Change it at the Hexsmith.'}</p>
          </div>
        )}
        {especialNome !== undefined && <EspecialNomeLeitura language={language} nome={especialNome} />}
        <label style={{ ...sm2Text, display: 'block', marginTop: 12 }} htmlFor="sm-profile-email">{isPt ? 'E-mail' : 'Email'}</label>
        <Field id="sm-profile-email" data-profile-email type="email" value={email ?? ''} disabled readOnly tabIndex={-1} aria-disabled="true" style={{ background: 'var(--sm2-surface-2)', color: 'var(--sm2-muted)', cursor: 'not-allowed' }} placeholder={isPt ? 'em breve' : 'coming soon'} />
        <p style={sm2Hint}>{isPt ? 'Trocar o e-mail: em breve.' : 'Changing your email: coming soon.'}</p>

        <h3 style={sec}>{isPt ? 'Moldura' : 'Frame'}</h3>
        <FrameSelector ctx={ctx} equipped={frame.id} onEquip={onChangeFrame} previewSrc={lineIconForStage(petStage, 32) ?? getSpriteForStage(petStage)} isPt={isPt} petElement={petElement} onOpenShop={onOpenFrameShop ?? requestOpenFrameShop} />

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
