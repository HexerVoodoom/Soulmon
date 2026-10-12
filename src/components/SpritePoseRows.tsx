import { SwitchRow } from './form/FormKit';
import type { Language } from '../utils/i18n';
import { applySpritePose, sanitizeSpritePose, type SpritePose } from '../utils/spritePose';

/**
 * As linhas da POSE do Soulmon nas Configurações (grupo "Aparência"):
 *  · **Virar Soulmon** (`flipX`) — espelha o desenho, para quando a arte saiu
 *    olhando para o lado errado e ele parecia andar de costas.
 *  · **Voar** (`altitude: 'air'`) — ele sobe do chão e a sombra fica no lugar;
 *    desligado, ele aterrissa.
 * Escrita só por `applySpritePose` (`utils/spritePose.ts`, dono único).
 */
export function SpritePoseRows({ language, pose }: { language: Language; pose: Partial<SpritePose> | undefined }) {
  const isPt = language === 'pt-BR';
  const p = sanitizeSpritePose(pose);
  return (
    <>
      <SwitchRow
        checked={p.flipX}
        onToggle={() => applySpritePose({ flipX: !p.flipX })}
        label={isPt ? 'Virar Soulmon' : 'Flip Soulmon'}
        hint={isPt ? 'Espelha o desenho para o outro lado.' : 'Mirrors the picture to face the other way.'}
        language={language}
        infoLabel={isPt ? 'Sobre virar o Soulmon' : 'About flipping your Soulmon'}
        info={isPt
          ? 'Se o seu Soulmon parece andar de costas, ligue aqui. Só muda o desenho na tela inicial e no desktop; combate e cuidados ficam como estão.'
          : 'If your Soulmon seems to walk backwards, turn this on. It only changes the picture on the home screen and desktop; battles and care stay as they are.'}
      />
      <SwitchRow
        checked={p.altitude === 'air'}
        onToggle={() => applySpritePose({ altitude: p.altitude === 'air' ? 'ground' : 'air' })}
        label={isPt ? 'Soulmon voando' : 'Soulmon flying'}
        hint={isPt ? 'Ligado: ele flutua. Desligado: pés no chão.' : 'On: he hovers. Off: feet on the ground.'}
        language={language}
        infoLabel={isPt ? 'Sobre o voo' : 'About flying'}
        info={isPt
          ? 'Bom para criaturas que voam. Ele sobe um pouco, a sombra fica no chão e ele flutua de leve (parado, se você usa movimento reduzido).'
          : 'Good for flying creatures. He rises a little, the shadow stays on the ground and he hovers gently (still, if you use reduced motion).'}
      />
    </>
  );
}
