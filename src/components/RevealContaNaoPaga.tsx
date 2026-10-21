import { sm2Button, sm2Hint } from './form/FormKit';

/**
 * O aviso do REVEAL quando a geração do desenho foi RECUSADA por conta não paga (402 `paid-tier-required`).
 *
 * Antes o cristal ficava parado e o texto dizia "o desenho ainda está sendo feito" — mentira calma: nada ia chegar enquanto a
 * conta não fosse paga (QA, dono, 21/10/2026). Agora diz o porquê, sem culpa nem cobrança, e oferece o desbloqueio pelo MESMO
 * modal de compra do jogo. O ritual não bloqueia: dá para chocar com a arte de reserva.
 */
export function RevealContaNaoPaga({ isPt, onDesbloquear }: { isPt: boolean; onDesbloquear: () => void }) {
  return (
    <div data-reveal-conta-nao-paga style={{ margin: '12px 0 0', textAlign: 'center' }}>
      <p role="status" style={{ ...sm2Hint, margin: 0 }}>
        {isPt
          ? 'Desenhar o seu próprio Soulmon pede a conta completa. Enquanto isso, a arte de reserva fica com você.'
          : 'Drawing your own Soulmon needs the full account. Until then, the stand-in art stays with you.'}
      </p>
      <button type="button" data-reveal-desbloquear onClick={onDesbloquear} style={{ ...sm2Button('outline'), marginTop: 10 }}>
        {isPt ? 'Desbloquear a conta' : 'Unlock the account'}
      </button>
    </div>
  );
}

export default RevealContaNaoPaga;
