import { useEffect } from 'react';
import type { Language } from '../../utils/i18n';
import { sm2Button, sm2Text } from '../form/FormKit';

/**
 * O CARTÃO DO CONVITE AO REFÚGIO — entra no slot de avisos da Home (fila
 * única), nunca como modal solto. Copy do parecer do
 * `soulmon-behavioral-psychologist` (30/09/2026): a voz é do pet falando de
 * SI ("vou passar uns minutos"), o cartão não cita o humor, não diz
 * "percebi", não promete efeito e não traz linguagem de crise — o aviso de
 * ajuda mora no rodapé do Refúgio, sempre visível lá. A regra de quando
 * aparece é de `utils/refugio/convite.ts`.
 *
 * `onShown` roda ao MONTAR: o convite só conta como exibido se foi desenhado
 * (escondido no "+N" do slot ele não monta e não gasta a vez).
 */
export function RefugeInviteCard({ language, onShown, onAccept, onDismiss }: {
  language: Language;
  onShown: () => void;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  const isPt = language === 'pt-BR';
  useEffect(() => { onShown(); }, [onShown]);
  return (
    <section
      data-refugio-convite
      style={{
        padding: 14, borderRadius: 12, marginBottom: 12,
        border: '1px solid var(--sm2-line)', backgroundColor: 'var(--sm2-surface)',
      }}
    >
      <p style={{ ...sm2Text, margin: '0 0 4px', fontWeight: 600 }}>{isPt ? 'Um respiro?' : 'A breather?'}</p>
      <p style={{ ...sm2Text, margin: '0 0 10px' }}>
        {isPt
          ? 'Vou passar uns minutos no Refúgio, só respirando. Vem comigo, se quiser.'
          : "I'm spending a few minutes in the Refuge, just breathing. Come with me if you want."}
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" data-refugio-convite-aceitar style={{ ...sm2Button('primary'), flex: 1 }} onClick={onAccept}>
          {isPt ? 'Respirar com o Soulmon' : 'Breathe with Soulmon'}
        </button>
        <button type="button" data-refugio-convite-dispensar style={{ ...sm2Button('outline'), flex: 1 }} onClick={onDismiss}>
          {isPt ? 'Hoje não' : 'Not today'}
        </button>
      </div>
    </section>
  );
}
