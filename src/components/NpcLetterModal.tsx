/**
 * A CARTA de NPC aberta (D-14, REGISTRO §115): modal centralizado da fila (`npcLetter`), até 3 linhas na voz do NPC
 * que assina. Um único botão "Fechar" (e Esc/voltar). Sem recompensa, sem contador, sem som, sem cobrança.
 */
import type { Language } from '../utils/i18n';
import { letterCopy, type LetterState } from '../utils/npcLetter';
import { lotNpcVoice } from '../utils/areaNpcVoice';
import { sm2Button } from './form/FormKit';
import { RitualDialog, ritualTitle } from './ritual/RitualKit';

export function NpcLetterModal({ letter, language, onClose }: { letter: LetterState; language: Language; onClose: () => void }) {
  const c = letterCopy(letter, language);
  const from = lotNpcVoice(c.from.area, c.from.lot, language).name;
  return (
    <RitualDialog label={c.title} onClose={onClose} maxWidth={340}>
      <p style={{ ...ritualTitle, margin: 0 }}>{c.title}</p>
      <div data-npc-letter-body style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {c.lines.map((line, i) => <p key={i} style={{ margin: 0, fontSize: 14 }}>{line}</p>)}
      </div>
      <p data-npc-letter-from style={{ margin: 0, fontSize: 12, color: 'var(--sm2-muted)', textAlign: 'right' }}>{`- ${from}`}</p>
      <button type="button" onClick={onClose} style={{ ...sm2Button('primary'), width: '100%' }}>{c.closeLabel}</button>
    </RitualDialog>
  );
}

export default NpcLetterModal;
