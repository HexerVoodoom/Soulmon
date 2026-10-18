import { FUNCTION_NPC_ART } from '../../assets/soulmon/npcs';
import { functionNpcVoice, type FunctionNpcId } from '../../utils/areaNpcVoice';
import type { Language } from '../../utils/i18n';
import { sm2Hint } from '../form/FormKit';

/**
 * O NPC de FUNÇÃO de uma tela (14/10/2026, dono): busto pequeno + nome + fala curta, no topo da tela que ele "mora".
 * Nuri = Cuidados (Mochila). Faro/Sona/Tobi saíram (18/10/2026). A fala é só acolhida (sem cobrança).
 */
export function FunctionNpcNote({ id, language, size = 64 }: { id: FunctionNpcId; language: Language; size?: number }) {
  const v = functionNpcVoice(id, language);
  return (
    <div data-function-npc={id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
      <img src={FUNCTION_NPC_ART[id]} alt="" width={size} height={size} style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />
      <p style={{ ...sm2Hint, margin: 0 }}>
        <strong>{v.name}</strong>{' — '}{v.line}
      </p>
    </div>
  );
}
