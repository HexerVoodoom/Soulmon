import { lazy, Suspense } from 'react';
import type { Language } from '../../utils/i18n';

/** O avatar (moldura + miniatura) mora em chunk próprio: o botão é só a casca no bundle de entrada (orçamento de bytes). */
const UserAvatar = lazy(() => import('../ui/UserAvatar').then(m => ({ default: m.UserAvatar })));

/**
 * O botão do USUÁRIO no canto superior esquerdo da Home (Tarefa C, 07/10/2026): substitui o sanduíche.
 * Abre as Configurações (e, de lá, "Editar perfil"). Alvo de 44; o avatar tem 28 para a moldura (que
 * transborda ~90% do lado) caber na coluna de 48 do HUD sem invadir o nome do Soulmon.
 */
export function ProfileAvatarButton({ avatarId, frameId, seed, language, onClick }: {
  avatarId?: string | null; frameId?: string | null; seed?: string | null; language: Language; onClick: () => void;
}) {
  const label = language === 'pt-BR' ? 'Configurações e perfil' : 'Settings and profile';
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      data-profile-avatar-btn
      className="sm2-corner-link"
      style={{
        width: 44, height: 44, flex: '0 0 44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', overflow: 'visible',
      }}
    >
      <Suspense fallback={<span aria-hidden="true" style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--sm2-surface-2)' }} />}>
        <UserAvatar avatarId={avatarId} frameId={frameId} seed={seed} size={28} />
      </Suspense>
    </button>
  );
}
