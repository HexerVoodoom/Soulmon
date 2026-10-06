import { lazy, Suspense } from 'react';
import { AvatarFrame } from './AvatarFrame';
import { frameById } from '../../utils/frames';
import { resolveAvatarId } from '../../utils/avatar';

/** A imagem mora num mini-chunk (glob preguiçoso de `AvatarImg`): o bundle de entrada só paga este invólucro. */
const AvatarImg = lazy(() => import('./AvatarImg').then(m => ({ default: m.AvatarImg })));

/**
 * O ÍCONE DO USUÁRIO: a foto de perfil (um NPC, recorte circular) com a moldura equipada. Serve ao topo da
 * Home, à folha de editar perfil e (com `avatarId` do servidor) ao oponente. `seed` dá o padrão determinístico
 * de quem não escolheu (saveId do próprio jogador, id público de outra pessoa). `alt=""` = decorativo (o botão
 * que o envolve já carrega o nome acessível).
 */
export function UserAvatar({ avatarId, frameId, seed, size = 36, alt = '' }: {
  avatarId?: string | null;
  frameId?: string | null;
  seed?: string | null;
  size?: number;
  alt?: string;
}) {
  const id = resolveAvatarId(avatarId, seed);
  const frame = frameById(frameId);
  return (
    <AvatarFrame frame={frame} size={size}>
      <span
        data-user-avatar={id}
        style={{
          display: 'block', width: size, height: size, borderRadius: '50%', overflow: 'hidden', flex: 'none',
          background: 'var(--sm2-surface-2)', boxShadow: frame ? undefined : '0 0 0 1px var(--sm2-line)',
        }}
      >
        <Suspense fallback={null}><AvatarImg id={id} size={size} alt={alt} /></Suspense>
      </span>
    </AvatarFrame>
  );
}
