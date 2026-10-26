import type { GuildCasa } from '../../utils/community';
import type { Language } from '../../utils/i18n';
import { LOJA_ITENS, lojaText } from '../../utils/guildLoja';
import { DECOR_ART } from '../../utils/decorArt';
import { Icon } from '../ui/Icon';

/**
 * A LOJA do clã (R5/A): cosméticos da Casa comprados com os Bits do CLÃ. Nada por pessoa: o saldo é um número do
 * clã e quem comprou não aparece. O que o clã já levou fica numa fileira "Na casa" (arte da decoração existente);
 * o resto mostra o preço e um botão. Sem saldo, o botão só descansa — nenhuma frase cobra ou culpa. O preço aqui
 * é só exibição: o servidor cobra o dele.
 */
export function GuildLoja({ casa, language, ocupado, onComprar }: {
  casa: GuildCasa; language: Language; ocupado: boolean; onComprar: (itemId: string) => void;
}) {
  const isPt = language === 'pt-BR';
  const saldo = casa.loja.saldo;
  const doClan = new Set(casa.loja.itens);
  const dele = LOJA_ITENS.filter(i => doClan.has(i.id));
  const venda = LOJA_ITENS.filter(i => !doClan.has(i.id));
  const nome = (i: (typeof LOJA_ITENS)[number]) => (isPt ? i.namePt : i.nameEn);
  return (
    <section className="sm2-guild-sec" aria-label={lojaText(language, 'titulo')} data-guild-room="loja">
      <h3 className="sm2-stats-lab">{lojaText(language, 'titulo')}</h3>
      <p className="sm2-lib-s" style={{ margin: 0 }}>{lojaText(language, 'linha')}</p>
      {saldo !== null && <p className="sm2-lib-s" style={{ margin: 0 }} data-loja-saldo>{lojaText(language, 'saldo', { n: saldo })}</p>}

      {dele.length > 0 && (
        <>
          <p className="sm2-stats-t" style={{ margin: 0 }}>{lojaText(language, 'naCasa')}</p>
          <ul className="sm2-grove-list" data-loja-na-casa style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: 0, listStyle: 'none' }}>
            {dele.map(i => (
              <li key={i.id} data-loja-dele={i.id} title={nome(i)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {DECOR_ART[i.arte] && <img src={DECOR_ART[i.arte]} alt="" width={32} height={32} style={{ width: 32, height: 32, imageRendering: 'pixelated' }} />}
                <span className="sm2-lib-s">{nome(i)}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <ul className="sm2-grove-list" data-loja-itens style={{ padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
        {venda.map(i => {
          const pode = saldo !== null && saldo >= i.preco;
          return (
            <li key={i.id} data-loja-item={i.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {DECOR_ART[i.arte] && <img src={DECOR_ART[i.arte]} alt="" width={32} height={32} style={{ width: 32, height: 32, imageRendering: 'pixelated' }} />}
              <span className="sm2-lib-s" style={{ flex: 1, minWidth: 0 }}>{nome(i)}</span>
              <button
                type="button"
                data-loja-comprar={i.id}
                disabled={ocupado || !pode}
                aria-disabled={ocupado || !pode ? true : undefined}
                onClick={() => onComprar(i.id)}
                className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline"
              >
                <Icon name="diamond" size={20} />
                {lojaText(language, 'comprar', { n: i.preco })}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
