import { useState } from 'react';
import { ActionRow, GroupCard, sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import type { Language } from '../utils/i18n';
import { useAdmin } from '../utils/adminFlag';
import { GM_BALANCE, GM_FORMS, GM_PERFECT_DAY_STEPS } from '../utils/gmTools';
import { corvoFormName } from '../utils/corvoPet';

/**
 * PAINEL DE GM — Configurações, visível SÓ para `useAdmin() === true`.
 *
 * A flag vem apenas da resposta do servidor nesta abertura (`utils/adminFlag.ts`);
 * nada no save ou no localStorage abre este painel. Cada ação é um updater puro
 * de `utils/gmTools.ts` / `utils/corvoPet.ts`, disparado pelo `App.tsx` (que
 * memoiza os callbacks — footgun 5). Tudo mexe só no save deste aparelho.
 */
export interface GmActions {
  isCorvo: boolean;
  currentForm: string;
  onGiveBalance: () => void;
  onUnlockAll: () => void;
  onGoToForm: (formId: string) => void;
  onAdoptCorvo: () => void;
  onFillCare: () => void;
  onAddPerfectDays: (n: number) => void;
}

export function GmPanel({ language, gm }: { language: Language; gm: GmActions }) {
  const admin = useAdmin();
  const isPt = language === 'pt-BR';
  const [form, setForm] = useState(gm.currentForm);
  if (!admin) return null;

  return (
    <GroupCard title={isPt ? 'Painel de GM' : 'GM panel'}>
      <div data-gm-panel>
        <p style={{ ...sm2Hint, margin: '0 0 8px' }}>
          {isPt
            ? 'Só você vê isto. Tudo aqui muda apenas o save deste aparelho.'
            : 'Only you see this. Everything here changes only this device’s save.'}
        </p>
        <ActionRow
          label={isPt ? 'Dar saldo' : 'Give balance'}
          hint={isPt
            ? `Bits e Emblemas em ${GM_BALANCE.toLocaleString('pt-BR')}. Créditos vêm do servidor e já são ilimitados.`
            : `Bits and Emblems at ${GM_BALANCE.toLocaleString('en-US')}. Credits come from the server and are already unlimited.`}
          onClick={gm.onGiveBalance}
        />
        <ActionRow
          label={isPt ? 'Desbloquear tudo' : 'Unlock everything'}
          hint={isPt
            ? 'Todos os cenários, decorações, formas e missões permanentes.'
            : 'Every scene, decoration, form and permanent mission.'}
          onClick={gm.onUnlockAll}
        />
        {!gm.isCorvo && (
          <ActionRow
            label={isPt ? 'Adotar o Corvinho' : 'Adopt the Little Raven'}
            hint={isPt
              ? 'Troca só a criatura. Forma, atividades e moedas continuam.'
              : 'Swaps only the creature. Form, activities and coins stay.'}
            onClick={gm.onAdoptCorvo}
          />
        )}
        <ActionRow
          label={isPt ? 'Encher cuidados' : 'Fill care'}
          hint={isPt ? 'Corações e energia cheios, cocô limpo.' : 'Full hearts and energy, poop cleaned.'}
          onClick={gm.onFillCare}
        />
        <div style={{ marginTop: 12 }}>
          <p style={{ ...sm2Text, fontWeight: 500, margin: '0 0 4px' }}>{isPt ? 'Ir para forma' : 'Go to form'}</p>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              aria-label={isPt ? 'Forma' : 'Form'}
              value={form}
              onChange={e => setForm(e.target.value)}
              style={{
                flex: 1, minWidth: 0, minHeight: 44, borderRadius: 12, padding: '0 10px',
                background: 'var(--sm2-surface-2)', color: 'var(--sm2-ink)', border: '1px solid var(--sm2-line)',
              }}
            >
              {GM_FORMS.map(id => (
                <option key={id} value={id}>{corvoFormName(id, language)} · {id}</option>
              ))}
            </select>
            <button type="button" style={sm2Button('outline', false, 'sm')} onClick={() => gm.onGoToForm(form)}>
              {isPt ? 'Ir' : 'Go'}
            </button>
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <p style={{ ...sm2Text, fontWeight: 500, margin: '0 0 4px' }}>{isPt ? 'Somar dias completos' : 'Add complete days'}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {GM_PERFECT_DAY_STEPS.map(n => (
              <button key={n} type="button" style={{ ...sm2Button('outline', false, 'sm'), flex: 1 }} onClick={() => gm.onAddPerfectDays(n)}>
                +{n}
              </button>
            ))}
          </div>
        </div>
      </div>
    </GroupCard>
  );
}
