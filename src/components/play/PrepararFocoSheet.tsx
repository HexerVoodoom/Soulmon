import { useState } from 'react';
import { sm2Hint, sm2Text } from '../form/FormKit';
import { Icon } from '../ui/Icon';
import { sheetCard, sheetCardTitle } from '../nav/sheetKit';
import type { Language } from '../../utils/i18n';
import { emptyDraft, normalizeSession, saveSession as buildSession, type SessionDraft } from '../../utils/focoSessao';
import { readJson, writeJson } from '../../utils/safeStorage';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { OficinaPlano } from './OficinaPlano';

type PrepTask = { id: string; name: string; completed: boolean; steps?: Array<{ id: string; label: string; completed: boolean }> };

/**
 * PREPARE TO FOCUS (beta3 F1): o prédio da PREPARAÇÃO da sessão — o mesmo fluxo de etapas que morava na Focus Workshop
 * (`OficinaPlano`). Concluir (salvar a sessão pronta) dá a CHAVE do dia que libera a Workshop (`utils/focusKey.ts`, no save).
 * A sessão salva vai para a MESMA chave de storage que a Workshop lê, então ela já a encontra pronta.
 */
export function PrepararFocoSheet({ language, todayKey, tasks = [], keyActive = false, onPrepared = () => {} }: {
  language: Language; todayKey?: string; tasks?: PrepTask[]; keyActive?: boolean; onPrepared?: () => void;
}) {
  const isPt = language === 'pt-BR';
  const day = todayKey ?? new Date().toISOString().slice(0, 10);
  const [editing, setEditing] = useState(!keyActive);
  const saveDraft = (draft: SessionDraft) => {
    const prev = normalizeSession(readJson<unknown>(STORAGE_KEYS.FOCO_WORKSHOP_PLAN, null));
    const next = buildSession(draft, tasks, { id: `foco-${Date.now()}`, day, prev: prev?.status === 'ready' ? prev : null });
    if (!next) return;
    writeJson(STORAGE_KEYS.FOCO_WORKSHOP_PLAN, next);
    onPrepared();
    setEditing(false);
  };
  return (
    <div data-preparar-foco style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {editing
        ? <>
          <p data-preparar-hint style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Planeje a sessão, passo a passo. Ao salvar, você ganha a chave da Oficina do Foco.' : 'Plan the session, step by step. When you save it, you get the key to the Focus Workshop.'}</p>
          <OficinaPlano language={language} tasks={tasks} initial={emptyDraft()} onSave={saveDraft} onCancel={() => setEditing(!keyActive ? true : false)} />
        </>
        : <article data-preparar-chave style={{ ...sheetCard, alignItems: 'stretch', gap: 8 }}>
          <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="lock_open" size={24} tone="primary" />
            <h3 style={{ ...sheetCardTitle, margin: 0 }}>{isPt ? 'Chave da Oficina do Foco' : 'Focus Workshop key'}</h3>
          </header>
          <p role="status" style={{ ...sm2Text, margin: 0 }}>{isPt ? 'Pronto: a Oficina do Foco está liberada hoje. Quando o timer de foco rodar, o Soulmon desce a masmorra sozinho.' : 'Done: the Focus Workshop is open today. While the focus timer runs, your Soulmon goes down the dungeon on its own.'}</p>
          <button type="button" data-preparar-nova onClick={() => setEditing(true)} style={{ background: 'none', border: 0, color: 'var(--sm2-muted)', textDecoration: 'underline', cursor: 'pointer', minHeight: 40, alignSelf: 'flex-start' }}>{isPt ? 'Planejar outra sessão' : 'Plan another session'}</button>
        </article>}
    </div>
  );
}
