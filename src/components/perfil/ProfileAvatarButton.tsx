import { lazy, Suspense } from 'react';
import type { Language } from '../../utils/i18n';

/** O avatar (moldura + miniatura) mora em chunk próprio: o botão é só a casca no bundle de entrada (orçamento de bytes). */
const UserAvatar = lazy(() => import('../ui/UserAvatar').then(m => ({ default: m.UserAvatar })));

/**
 * O botão do USUÁRIO no canto superior esquerdo da Home (Tarefa C, 07/10/2026): substitui o sanduíche.
 * Abre as Configurações (e, de lá, "Editar perfil"). O alvo no FLUXO é de 44 (a coluna de 48 do HUD, como antes de
 * 07/10/2026); o avatar tem 42 (era 28; +50% a pedido do dono) e a moldura (que transborda ~90% do lado) SOBREPÕE:
 * o conjunto é posicionado em `absolute`, centrado no botão (6px mais baixo, para a moldura alta não cortar na borda do aparelho) e acima do pet e do nome (z-index), então não ocupa
 * altura nem largura a mais — o pet e o nome ficam onde estavam. O alvo de toque é o conjunto inteiro (transborda).
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
        position: 'relative', zIndex: 20, width: 44, height: 44, flex: '0 0 44px',
        background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', overflow: 'visible',
      }}
    >
      <span data-profile-avatar-overlay style={{ position: 'absolute', left: '50%', top: 'calc(50% + 6px)', transform: 'translate(-50%, -50%)', display: 'flex', pointerEvents: 'none' }}>
      <Suspense fallback={<span aria-hidden="true" style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--sm2-surface-2)' }} />}>
        <UserAvatar avatarId={avatarId} frameId={frameId} seed={seed} size={42} />
      </Suspense>
      </span>
    </button>
  );
}
