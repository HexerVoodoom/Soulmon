/**
 * Sprite que o perfil público publica (Torneio, Biblioteca, Bosque do Clã). Bosque/Maslin (22/11/2026): quando o estágio atual ainda não tinha
 * entrada no acervo, o perfil caía em `Object.values(sprites)[0]`, quase sempre o ROOKIE, e o Bosque mostrava rookie para quem já era ultimate.
 * Agora vale a ÚLTIMA arte já alcançada: a do estágio atual, senão a do estágio mais avançado já desbloqueado que tenha arte; sem nenhuma, `null`.
 * Nunca "a primeira do acervo". Só escolhe QUAL entrada vai ao perfil: o acervo não é tocado.
 */
import { displaySprite, type SpriteLibrary } from './spriteLibrary';

export function spriteDoPerfilUrl(lib: SpriteLibrary, evolutionStage: string, unlocked: readonly string[] | undefined): string | null {
  const atual = displaySprite(lib, evolutionStage)?.url;
  if (atual) return atual;
  for (let i = (unlocked?.length ?? 0) - 1; i >= 0; i--) {
    const url = displaySprite(lib, unlocked![i])?.url;
    if (url) return url;
  }
  return null;
}
