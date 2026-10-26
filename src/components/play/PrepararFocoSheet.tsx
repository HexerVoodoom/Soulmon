import { useState } from 'react';
import { sm2Hint, sm2Text } from '../form/FormKit';
import { Icon } from '../ui/Icon';
import { sheetCard, sheetCardTitle } from '../nav/sheetKit';
import type { Language } from '../../utils/i18n';
import { emptyDraft, normalizeSession, saveSession as buildSession, type SessionDraft } from '../../utils/focoSessao';
import { readJson, writeJson } from '../../utils/safeStorage';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { playerDayIso } from '../../utils/playerDay';
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
  const day = todayKey ?? playerDayIso(new Date(), undefined);
  const [editing, setEditing] = useState(!keyActive);
  /** Falha de salvar: visível (antes o toque no Salvar não fazia nada e ninguém sabia por quê). */
  const [saveError, setSaveError] = useState<string | null>(null);
  /** Troca a chave para remontar o formulário vazio quando Cancelar é tocado sem uma chave ativa para voltar. */
  const [formKey, setFormKey] = useState(0);
  const saveDraft = (draft: SessionDraft) => {
    const prev = normalizeSession(readJson<unknown>(STORAGE_KEYS.FOCO_WORKSHOP_PLAN, null));
    const next = buildSession(draft, tasks, { id: `foco-${Date.now()}`, day, prev: prev?.status === 'ready' ? prev : null });
    if (!next) { setSaveError(isPt ? 'Falta algo para salvar: escolha ao menos uma tarefa ou escreva um plano.' : 'Something is missing: pick at least one task or write a plan.'); return; }
    if (!writeJson(STORAGE_KEYS.FOCO_WORKSHOP_PLAN, next)) { setSaveError(isPt ? 'Não deu para salvar a sessão neste aparelho. Tente de novo.' : "Couldn't save the session on this device. Try again."); return; }
    setSaveError(null);
    onPrepared();
    setEditing(false);
  };
  /** Cancelar: com chave ativa volta ao cartão da chave; sem ela, descarta o rascunho (formulário limpo). */
  const cancel = () => { setSaveError(null); if (keyActive) setEditing(false); else setFormKey(k => k + 1); };
  return (
    <div data-preparar-foco style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {editing
        ? <>
          <p data-preparar-hint style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Planeje a sessão, passo a passo. Ao salvar, a segunda etapa (a Oficina do Foco) se abre.' : 'Plan the session, step by step. When you save it, the second step (the Focus Workshop) opens.'}</p>
          {saveError && <p role="alert" data-preparar-erro style={{ ...sm2Text, margin: 0, color: 'var(--sm2-gold-ink, var(--sm2-ink))' }}>{saveError}</p>}
          <OficinaPlano key={formKey} language={language} tasks={tasks} initial={emptyDraft()} onSave={saveDraft} onCancel={cancel} />
        </>
        : <article data-preparar-chave style={{ ...sheetCard, alignItems: 'stretch', gap: 8 }}>
          <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="lock_open" size={24} tone="primary" />
            <h3 style={{ ...sheetCardTitle, margin: 0 }}>{isPt ? 'Chave da Oficina do Foco' : 'Focus Workshop key'}</h3>
          </header>
          <p role="status" style={{ ...sm2Text, margin: 0 }}>{isPt ? 'Pronto: a Oficina do Foco está liberada hoje. Quando o timer de foco rodar, o Soulmon desce a Fenda sozinho.' : 'Done: the Focus Workshop is open today. While the focus timer runs, your Soulmon goes down the Endless Rift on its own.'}</p>
          <button type="button" data-preparar-nova onClick={() => setEditing(true)} style={{ background: 'none', border: 0, color: 'var(--sm2-muted)', textDecoration: 'underline', cursor: 'pointer', minHeight: 40, alignSelf: 'flex-start' }}>{isPt ? 'Planejar outra sessão' : 'Plan another session'}</button>
        </article>}
    </div>
  );
}
