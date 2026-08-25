import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import type { Language } from '../utils/i18n';
import { isAuthConfigured } from '../utils/auth';
import { readLocal } from '../utils/safeStorage';
import { STORAGE_KEYS } from '../utils/storageKeys';
import {
  requestExport, requestDelete, confirmDelete, downloadExport,
  type AccountFailure, type Bilingual, type DeletePlan, type DeleteRequest, type NotIncludedItem,
} from '../utils/accountData';

/**
 * SEUS DADOS — levar embora e apagar.
 *
 * Consome `functions/api/account.js` (contrato do servidor, não redesenhado
 * aqui). Três decisões desta tela, porque nenhuma delas é óbvia depois:
 *
 * 1. **503 é ESTADO, não erro.** As rotas são fail-closed enquanto o login não
 *    existe. A tela diz isso ANTES do toque — botão desabilitado com o motivo
 *    escrito —, em tinta neutra. Um botão que devolve erro sem explicação faz
 *    a pessoa achar que estragou alguma coisa, ou que o produto está mentindo
 *    sobre ter a função.
 * 2. **O inventário vem antes da confirmação.** O servidor devolve o que
 *    apaga, o que minimiza e o que SOBREVIVE; a pessoa lê os três antes de
 *    confirmar. Esconder o que sobrevive seria a única forma de dark pattern
 *    que ainda cabia aqui.
 * 3. **`naoIncluido` aparece NA TELA, não só dentro do arquivo baixado.** Quem
 *    exporta precisa saber que a psicometria e a data de nascimento nunca
 *    saíram do aparelho — e quem só abre o JSON depois já foi embora achando
 *    que levou tudo.
 *
 * Voz (trava do produto): quem está apagando a conta está indo embora. Sem
 * "tem certeza?", sem culpa, sem cancelar destacado. Confirmação clara, saída
 * sem fricção artificial — o Soulmon encoraja, inclusive na porta.
 */
interface AccountDataSectionProps {
  language: Language;
  /** Injeção para teste; em produção sai do localStorage. */
  saveId?: string | null;
  /** Injeção para teste: força o estado indisponível sem depender do env. */
  authAvailable?: boolean;
}

type ExportPhase = 'idle' | 'loading' | 'done';
type DeletePhase = 'idle' | 'loading' | 'plan' | 'deleting' | 'done';

const stackStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8 };

/** Painel de leitura. Superfície 2, sem borda de alerta: é informação. */
function Panel({ children, tone = 'quiet' }: { children: ReactNode; tone?: 'quiet' | 'warn' }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--sm2-surface-2)',
        border: tone === 'warn' ? '1px solid var(--sm2-danger-ink)' : '1px solid var(--sm2-line)',
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
        ...stackStyle,
      }}
    >
      {children}
    </div>
  );
}

function pick(b: Bilingual | undefined, isPt: boolean): string | null {
  if (!b) return null;
  return isPt ? b['pt-BR'] : b.en;
}

/** O que NÃO está aqui — lista legível, com a chave técnica como rótulo. */
function NotIncluded({ items, isPt }: { items: NotIncludedItem[]; isPt: boolean }) {
  if (!items?.length) return null;
  return (
    <div style={stackStyle}>
      <p style={{ ...sm2Text, fontWeight: 500 }}>
        {isPt ? 'O que NÃO está aqui' : 'What is NOT here'}
      </p>
      <ul style={{ ...stackStyle, listStyle: 'none', margin: 0, padding: 0 }}>
        {items.map(item => (
          <li key={item.what}>
            <p className="sm2-num" style={{ ...sm2Hint, fontWeight: 500 }}>{item.what}</p>
            <p style={sm2Hint}>{pick(item, isPt)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** As três colunas do inventário, sempre as três — inclusive a que sobrevive. */
function Inventory({ plan, isPt }: { plan: DeletePlan; isPt: boolean }) {
  const blocks: Array<{ key: keyof DeletePlan; title: string; hint: string }> = [
    {
      key: 'apaga',
      title: isPt ? 'Some para sempre' : 'Gone for good',
      hint: isPt ? 'Seu bichinho, seu progresso e seu perfil público.' : 'Your buddy, your progress and your public profile.',
    },
    {
      key: 'minimiza',
      title: isPt ? 'Fica só o essencial' : 'Only the essentials stay',
      hint: isPt ? 'Sai o uso (IA, anúncios); ficam os campos da compra.' : 'Usage (AI, ads) goes; the purchase fields stay.',
    },
    {
      key: 'sobrevive',
      title: isPt ? 'Continua existindo' : 'Stays around',
      hint: isPt
        ? 'O vínculo do seu comprovante de compra. É ele que impede um recibo de virar várias contas pagas — e é ele que deixa você restaurar a compra se voltar com o mesmo e-mail.'
        : 'The link to your purchase receipt. It is what stops one receipt from becoming several paid accounts — and what lets you restore your purchase if you come back with the same email.',
    },
  ];
  return (
    <div style={stackStyle}>
      {blocks.map(b => (
        <div key={b.key}>
          <p style={{ ...sm2Text, fontWeight: 500 }}>{b.title}</p>
          <p style={sm2Hint}>{b.hint}</p>
          {plan[b.key].length > 0 ? (
            <ul className="sm2-num" style={{ ...sm2Hint, margin: '4px 0 0', paddingLeft: 18 }}>
              {plan[b.key].map(line => <li key={line}>{line}</li>)}
            </ul>
          ) : (
            <p style={{ ...sm2Hint, marginTop: 4 }}>{isPt ? '— nada aqui' : '— nothing here'}</p>
          )}
        </div>
      ))}
    </div>
  );
}

export function AccountDataSection({ language, saveId: saveIdProp, authAvailable }: AccountDataSectionProps) {
  const isPt = language === 'pt-BR';
  const saveId = saveIdProp !== undefined ? saveIdProp : readLocal(STORAGE_KEYS.SAVE_ID);
  const available = authAvailable !== undefined ? authAvailable : isAuthConfigured();

  const [exportPhase, setExportPhase] = useState<ExportPhase>('idle');
  const [exportNote, setExportNote] = useState<string | null>(null);
  const [notIncluded, setNotIncluded] = useState<NotIncludedItem[] | null>(null);
  const [exportFail, setExportFail] = useState<AccountFailure | null>(null);

  const [deletePhase, setDeletePhase] = useState<DeletePhase>('idle');
  const [pending, setPending] = useState<DeleteRequest | null>(null);
  const [deleteFail, setDeleteFail] = useState<AccountFailure | null>(null);
  const [farewell, setFarewell] = useState<string | null>(null);

  // A janela é de 15 minutos e ela pode vencer com a tela aberta. Deixar o
  // botão vivo depois do vencimento entrega um 409 no rosto de quem já tinha
  // decidido — melhor a tela virar sozinha e oferecer pedir de novo.
  const expiryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (expiryTimer.current) clearTimeout(expiryTimer.current); }, []);

  /**
   * Sem 503 do servidor a gente ainda sabe: as rotas exigem login verificado e
   * o login não está configurado neste build. Dizer isso antes do toque é a
   * diferença entre "indisponível" e "quebrado".
   */
  const localUnavailable: AccountFailure | null = available ? null : { kind: 'unavailable' };

  const failText = (f: AccountFailure | null): string | null => {
    if (!f) return null;
    if (f.kind === 'unavailable') {
      return pick(f.aviso, isPt) ?? (isPt
        ? 'Esta função ainda não está disponível — ela liga junto com o login, porque sem login não temos como ter certeza de que é você. Preferimos deixar indisponível a deixar arriscada. Não é nada que você fez.'
        : 'This feature is not available yet — it turns on together with sign-in, because without sign-in we cannot be sure it is you. We would rather leave it unavailable than leave it risky. Nothing you did caused this.');
    }
    if (f.kind === 'expired') {
      return isPt
        ? 'Este pedido venceu (ele vale 15 minutos). Peça de novo e a lista volta igual.'
        : 'This request has expired (it lasts 15 minutes). Ask again and the list comes back the same.';
    }
    if (f.kind === 'denied') {
      return isPt
        ? 'Entre com o e-mail desta conta para continuar.'
        : 'Sign in with this account’s email to continue.';
    }
    if (f.kind === 'network') {
      return isPt
        ? 'Não conseguimos falar com o servidor. Nada foi alterado — dá para tentar de novo quando a conexão voltar.'
        : 'We could not reach the server. Nothing changed — you can try again when the connection is back.';
    }
    return isPt
      ? `O servidor respondeu ${f.status}. Nada foi alterado.`
      : `The server answered ${f.status}. Nothing changed.`;
  };

  const handleExport = async () => {
    if (!saveId) return;
    setExportPhase('loading');
    setExportFail(null);
    const res = await requestExport(saveId);
    if (!res.ok) {
      setExportFail(res.failure);
      setExportPhase('idle');
      return;
    }
    setNotIncluded(res.value.naoIncluido || []);
    const delivered = downloadExport(res.value);
    setExportNote(delivered
      ? pick(res.value.aviso, isPt)
      : (isPt ? 'Seus dados vieram, mas este aparelho não conseguiu salvar o arquivo.' : 'Your data arrived, but this device could not save the file.'));
    setExportPhase('done');
  };

  const handleDeleteRequest = async () => {
    if (!saveId) return;
    setDeletePhase('loading');
    setDeleteFail(null);
    const res = await requestDelete(saveId);
    if (!res.ok) {
      setDeleteFail(res.failure);
      setDeletePhase('idle');
      return;
    }
    setPending(res.value);
    setDeletePhase('plan');
    if (expiryTimer.current) clearTimeout(expiryTimer.current);
    expiryTimer.current = setTimeout(() => {
      setPending(null);
      setDeletePhase('idle');
      setDeleteFail({ kind: 'expired' });
    }, Math.max(1, res.value.expiresInSeconds) * 1000);
  };

  const handleDeleteConfirm = async () => {
    if (!saveId || !pending) return;
    setDeletePhase('deleting');
    setDeleteFail(null);
    const res = await confirmDelete(saveId, pending.confirmToken);
    if (!res.ok) {
      setDeleteFail(res.failure);
      // Token vencido/recusado: a lista antiga não vale mais, volta ao começo.
      setDeletePhase(res.failure.kind === 'expired' ? 'idle' : 'plan');
      if (res.failure.kind === 'expired') setPending(null);
      return;
    }
    // A resposta do servidor DECLARA que as inscrições de push não são
    // alcançáveis por ele. Desfazer as deste aparelho é o que torna aquela
    // frase verdadeira — melhor esforço, e o resultado não bloqueia a saída.
    try {
      const notif = await import('../utils/notifications');
      await notif.unsubscribeFromPush();
      await notif.unregisterFromPushNotifications();
    } catch { /* sem push neste ambiente: a exclusão já aconteceu */ }
    setPending(null);
    setFarewell(pick(res.value.aviso, isPt));
    setNotIncluded(res.value.naoIncluido || []);
    setDeletePhase('done');
  };

  const busy = exportPhase === 'loading' || deletePhase === 'loading' || deletePhase === 'deleting';
  const blocked = !!localUnavailable || !saveId;

  return (
    <div style={stackStyle}>
      {/* INDISPONÍVEL — primeiro, e antes de qualquer botão. */}
      {localUnavailable && (
        <Panel>
          <p style={{ ...sm2Text, fontWeight: 500 }}>
            {isPt ? 'Ainda não disponível' : 'Not available yet'}
          </p>
          <p id="sm-account-unavailable" style={sm2Hint}>{failText(localUnavailable)}</p>
        </Panel>
      )}
      {!localUnavailable && !saveId && (
        <p style={sm2Hint}>
          {isPt
            ? 'Entre com seu e-mail acima para ver e apagar o que o servidor guarda.'
            : 'Sign in with your email above to see and erase what the server keeps.'}
        </p>
      )}

      {/* ── LEVAR EMBORA ────────────────────────────────────────────────── */}
      <p style={sm2Hint}>
        {isPt
          ? 'Você pode baixar tudo que o Soulmon guarda de você nos servidores dele, quando quiser.'
          : 'You can download everything Soulmon keeps about you on its servers, whenever you want.'}
      </p>
      <button
        type="button"
        onClick={handleExport}
        disabled={blocked || busy}
        aria-describedby={localUnavailable ? 'sm-account-unavailable' : undefined}
        style={{ ...sm2Button('ghost', blocked || busy), alignSelf: 'flex-start' }}
      >
        {exportPhase === 'loading'
          ? (isPt ? 'Preparando…' : 'Preparing…')
          : (isPt ? 'Baixar meus dados' : 'Download my data')}
      </button>

      {/* ── APAGAR ──────────────────────────────────────────────────────── */}
      <p style={{ ...sm2Hint, marginTop: 8 }}>
        {isPt
          ? 'E pode ir embora quando quiser. Primeiro a gente mostra exatamente o que some; você confirma depois.'
          : 'And you can leave whenever you want. First we show exactly what goes; you confirm after that.'}
      </p>
      {deletePhase !== 'plan' && deletePhase !== 'done' && (
        <button
          type="button"
          onClick={handleDeleteRequest}
          disabled={blocked || busy}
          style={{ ...sm2Button('ghost', blocked || busy), alignSelf: 'flex-start' }}
        >
          {deletePhase === 'loading'
            ? (isPt ? 'Montando a lista…' : 'Building the list…')
            : (isPt ? 'Apagar minha conta' : 'Delete my account')}
        </button>
      )}

      {/* O INVENTÁRIO — o que você perde, antes de confirmar. */}
      {deletePhase === 'plan' || deletePhase === 'deleting' ? (
        <Panel tone="warn">
          <p style={sm2Text}>{pick(pending?.aviso, isPt)}</p>
          {pending && <Inventory plan={pending.plano} isPt={isPt} />}
          {pending && <NotIncluded items={pending.naoIncluido} isPt={isPt} />}
          <p style={sm2Hint}>{pick(pending?.prazo, isPt)}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={deletePhase === 'deleting'}
              style={{
                ...sm2Button('ghost', deletePhase === 'deleting'),
                ...(deletePhase === 'deleting' ? {} : { borderColor: 'var(--sm2-danger-ink)', color: 'var(--sm2-danger-ink)' }),
              }}
            >
              {deletePhase === 'deleting'
                ? (isPt ? 'Apagando…' : 'Erasing…')
                : (isPt ? 'Apagar agora' : 'Erase now')}
            </button>
            {/* Voltar existe, e é QUIETO. Destacar o "cancelar" numa saída é a
                definição de dark pattern — quem chegou até aqui decidiu. */}
            <button
              type="button"
              onClick={() => { setDeletePhase('idle'); setPending(null); setDeleteFail(null); }}
              disabled={deletePhase === 'deleting'}
              style={sm2Button('quiet')}
            >
              {isPt ? 'Voltar' : 'Go back'}
            </button>
          </div>
        </Panel>
      ) : null}

      {/* ── SAÍDAS: sucesso, o que não estava incluído, e as falhas ─────── */}
      <div aria-live="polite" style={stackStyle}>
        {exportPhase === 'done' && exportNote && (
          <p style={{ ...sm2Hint, color: 'var(--sm2-primary-ink)' }}>{exportNote}</p>
        )}
        {farewell && <p style={{ ...sm2Text, color: 'var(--sm2-primary-ink)' }}>{farewell}</p>}
        {(exportPhase === 'done' || deletePhase === 'done') && notIncluded && (
          <Panel><NotIncluded items={notIncluded} isPt={isPt} /></Panel>
        )}
        {exportFail && exportFail.kind !== 'unavailable' && (
          <p style={{ ...sm2Hint, color: 'var(--sm2-danger-ink)' }}>{failText(exportFail)}</p>
        )}
        {exportFail?.kind === 'unavailable' && <p style={sm2Hint}>{failText(exportFail)}</p>}
        {deleteFail && deleteFail.kind !== 'unavailable' && (
          <p style={{ ...sm2Hint, color: 'var(--sm2-danger-ink)' }}>{failText(deleteFail)}</p>
        )}
        {deleteFail?.kind === 'unavailable' && <p style={sm2Hint}>{failText(deleteFail)}</p>}
      </div>
    </div>
  );
}
