import { useState } from 'react';
import { toast } from 'sonner';
import { ModalSheet, sm2Button, sm2Hint, sm2Text, SM2_SHADOW_CARD } from './form/FormKit';
import { Icon } from './ui/Icon';
import { NPC_MENSAGEIRO_ART } from '../assets/soulmon/npcs';
import {
  hasPendingReward, isUnread, mailBody, mailTitle, rewardText, sumGrants,
  type MailGrant, type MailItem,
} from '../utils/mensageiro';
import type { Language } from '../utils/i18n';

/**
 * A CAIXA DE CARTAS do Papus (§245), aberta pelo ícone de carta da Home. Folha padrão (`ModalSheet`).
 *
 *  · accordion: o título é um botão; tocar expande o conteúdo, e abrir outra fecha a anterior (UMA aberta por vez, `aberta` é um `mid` só);
 *  · carta com item: "Resgatar"; toda carta: "Deletar". Apagar carta com item NÃO resgatado pede confirmação (o servidor também recusa sem `force`);
 *  · rodapé fixo: "Excluir todas lidas" (nunca apaga carta com item pendente) e "Resgatar tudo" (pop-up com o total e a lista);
 *  · sem deslocar layout: o rodapé está sempre montado (desativado quando não há o que fazer), o ponto de "nova" ocupa sempre o mesmo espaço
 *    e a linha do título tem altura mínima fixa. Só a carta aberta cresce, para baixo.
 */
export function MailboxSheet({ open, language, mail, onClose, onOpenLetter, onClaim, onClaimAll, onDelete, onDeleteRead }: {
  open: boolean;
  language: Language;
  mail: readonly MailItem[];
  onClose: () => void;
  onOpenLetter: (mid: string) => void;
  onClaim: (mid: string) => Promise<MailGrant[]>;
  onClaimAll: () => Promise<MailGrant[]>;
  onDelete: (mid: string, force: boolean) => Promise<'removed' | 'blocked'>;
  onDeleteRead: () => Promise<number>;
}) {
  const isPt = language === 'pt-BR';
  const [aberta, setAberta] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [confirmar, setConfirmar] = useState<MailItem | null>(null);
  const [resumo, setResumo] = useState<MailGrant[] | null>(null);

  const falhou = () => toast(isPt ? 'Sem conexão. Nada foi alterado.' : 'No connection. Nothing was changed.');
  const rodar = async (fn: () => Promise<void>) => {
    if (ocupado) return;
    setOcupado(true);
    try { await fn(); } catch { falhou(); } finally { setOcupado(false); }
  };

  const alternar = (m: MailItem) => {
    const abrir = aberta !== m.mid;
    setAberta(abrir ? m.mid : null);
    if (abrir) onOpenLetter(m.mid);
  };
  const resgatar = (m: MailItem) => rodar(async () => {
    const g = await onClaim(m.mid);
    toast(g.length
      ? (isPt ? `Resgatado: ${rewardText(sumGrants(g), true)}.` : `Claimed: ${rewardText(sumGrants(g), false)}.`)
      : (isPt ? 'Essa carta já foi resgatada.' : 'This letter was already claimed.'));
  });
  const deletar = (m: MailItem) => rodar(async () => {
    if (hasPendingReward(m)) { setConfirmar(m); return; }
    await onDelete(m.mid, false);
    if (aberta === m.mid) setAberta(null);
  });
  const deletarMesmoAssim = (m: MailItem) => rodar(async () => {
    await onDelete(m.mid, true);
    setConfirmar(null);
    if (aberta === m.mid) setAberta(null);
  });
  const resgatarTudo = () => rodar(async () => {
    const g = await onClaimAll();
    if (g.length) setResumo(g); else toast(isPt ? 'Não há nada a resgatar.' : 'Nothing to claim.');
  });
  const excluirLidas = () => rodar(async () => {
    const n = await onDeleteRead();
    toast(n > 0
      ? (isPt ? `${n} ${n === 1 ? 'carta apagada' : 'cartas apagadas'}.` : `${n} ${n === 1 ? 'letter' : 'letters'} deleted.`)
      : (isPt ? 'Nenhuma carta lida para apagar.' : 'No read letters to delete.'));
  });

  const temItem = mail.some(hasPendingReward);
  const temLida = mail.some(m => m.read === true && !hasPendingReward(m));
  const total = resumo ? sumGrants(resumo) : { bits: 0, emblems: 0 };

  return (
    <>
      <ModalSheet
        open={open}
        title={isPt ? 'Caixa de cartas' : 'Mailbox'}
        onClose={onClose}
        language={language}
        footer={(
          <div data-mail-footer style={{ display: 'flex', gap: 8 }}>
            <button type="button" data-mail-delete-read disabled={!temLida || ocupado} onClick={() => void excluirLidas()}
              style={{ ...sm2Button('outline', !temLida || ocupado, 'sm'), flex: 1 }}>
              {isPt ? 'Excluir todas lidas' : 'Delete all read'}
            </button>
            <button type="button" data-mail-claim-all disabled={!temItem || ocupado} onClick={() => void resgatarTudo()}
              style={{ ...sm2Button('primary', !temItem || ocupado, 'sm'), flex: 1 }}>
              {isPt ? 'Resgatar tudo' : 'Claim all'}
            </button>
          </div>
        )}
      >
        <div data-mailbox style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 64 }}>
            <img src={NPC_MENSAGEIRO_ART} alt="" aria-hidden="true" width={56} height={56} draggable={false}
              style={{ width: 56, height: 56, objectFit: 'contain', flex: 'none' }} />
            <p style={{ ...sm2Text, margin: 0 }}>
              {isPt ? 'Papus: as cartas dos últimos dias. As sem item somem em 3 dias.' : 'Papus: the last few days of letters. Ones without an item vanish in 3 days.'}
            </p>
          </div>

          {mail.length === 0 && (
            <p data-mail-empty style={{ ...sm2Hint, textAlign: 'center', padding: '24px 0' }}>
              {isPt ? 'Nenhuma carta por enquanto.' : 'No letters for now.'}
            </p>
          )}

          {mail.map(m => {
            const aberto = aberta === m.mid;
            const item = hasPendingReward(m);
            const premio = rewardText(m, isPt);
            const nova = isUnread(m);
            return (
              <section key={m.mid} data-mail-letter={m.mid} data-mail-open={aberto ? 'true' : 'false'}
                style={{ border: '1px solid var(--sm2-muted)', borderRadius: 'var(--sm2-radius-md)', background: 'var(--sm2-surface)', boxShadow: SM2_SHADOW_CARD }}>
                <button type="button" aria-expanded={aberto} aria-controls={`mail-${m.mid}`} onClick={() => alternar(m)}
                  style={{
                    ...sm2Text, width: '100%', minHeight: 56, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                    background: 'none', border: 'none', cursor: 'pointer', fontWeight: nova ? 700 : 400,
                  }}>
                  <span data-mail-new={nova ? 'true' : 'false'} aria-hidden="true"
                    style={{ width: 8, height: 8, borderRadius: '50%', flex: 'none', background: nova ? '#E5484D' : 'transparent' }} />
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mailTitle(m, isPt)}{nova ? <span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{isPt ? ' (nova)' : ' (new)'}</span> : null}
                  </span>
                  {item && <Icon name="volunteer_activism" size={20} tone="gold" />}
                  <Icon name={aberto ? 'expand_less' : 'expand_more'} size={24} tone="muted" />
                </button>
                {aberto && (
                  <div id={`mail-${m.mid}`} role="region" aria-label={mailTitle(m, isPt)} style={{ padding: '0 14px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <p style={{ ...sm2Text, margin: 0 }}>{mailBody(m, isPt)}</p>
                    {premio && (
                      <p data-mail-reward style={{ ...sm2Hint, margin: 0 }}>
                        {m.claimedAt ? (isPt ? 'Resgatado: ' : 'Claimed: ') : (isPt ? 'Na bolsa: ' : 'In the bag: ')}{premio}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {item && (
                        <button type="button" data-mail-claim disabled={ocupado} onClick={() => void resgatar(m)}
                          style={{ ...sm2Button('primary', ocupado, 'sm'), flex: 1 }}>
                          {isPt ? 'Resgatar' : 'Claim'}
                        </button>
                      )}
                      <button type="button" data-mail-delete disabled={ocupado} onClick={() => void deletar(m)}
                        style={{ ...sm2Button('outline', ocupado, 'sm'), flex: 1, color: 'var(--sm2-danger-ink)' }}>
                        {isPt ? 'Deletar' : 'Delete'}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </ModalSheet>

      {/* Confirmação: carta com item NÃO resgatado. Escolha padrão = não apagar (o fundo não fecha). */}
      <ModalSheet open={confirmar !== null} placement="center" dismissOnBackdrop={false}
        title={isPt ? 'Apagar sem resgatar?' : 'Delete without claiming?'} onClose={() => setConfirmar(null)} language={language}
        footer={confirmar && (
          <div data-mail-confirm style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button type="button" disabled={ocupado} onClick={() => { const m = confirmar; setConfirmar(null); void resgatar(m); }}
              style={{ ...sm2Button('primary', ocupado, 'sm'), width: '100%' }}>{isPt ? 'Resgatar' : 'Claim'}</button>
            <button type="button" data-mail-delete-anyway disabled={ocupado} onClick={() => void deletarMesmoAssim(confirmar)}
              style={{ ...sm2Button('quiet', ocupado, 'sm'), width: '100%', color: 'var(--sm2-danger-ink)' }}>{isPt ? 'Apagar mesmo assim' : 'Delete anyway'}</button>
          </div>
        )}>
        {confirmar && (
          <p style={{ ...sm2Text, margin: 0 }}>
            {isPt
              ? `Esta carta ainda tem um item a resgatar (${rewardText(confirmar, true)}). Se apagar, o item se perde.`
              : `This letter still has an item to claim (${rewardText(confirmar, false)}). If you delete it, the item is lost.`}
          </p>
        )}
      </ModalSheet>

      {/* O pop-up do "Resgatar tudo": tudo o que saiu, e o total. */}
      <ModalSheet open={resumo !== null} placement="center" title={isPt ? 'Resgatado!' : 'Claimed!'} onClose={() => setResumo(null)} language={language}
        footer={<button type="button" data-mail-summary-ok onClick={() => setResumo(null)} style={{ ...sm2Button('primary', false, 'sm'), width: '100%' }}>Ok</button>}>
        {resumo && (
          <div data-mail-summary style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <ul style={{ ...sm2Text, margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {resumo.map(g => (
                <li key={g.mid} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(isPt ? g.titlePt : g.titleEn) || (isPt ? 'Carta' : 'Letter')}</span>
                  <span style={{ flex: 'none' }}>{rewardText(g, isPt)}</span>
                </li>
              ))}
            </ul>
            <p data-mail-total style={{ ...sm2Text, margin: 0, fontWeight: 700 }}>Total: {rewardText(total, isPt)}</p>
          </div>
        )}
      </ModalSheet>
    </>
  );
}
