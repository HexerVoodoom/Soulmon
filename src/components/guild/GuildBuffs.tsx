import type { GuildCasa } from '../../utils/community';
import type { Language } from '../../utils/i18n';
import { BUFF_IDS, BUFF_DIAS, buffText, type BuffId } from '../../utils/guildBuffs';
import { BitsAmount } from '../ui/BitsAmount';

/**
 * Os BUFFS DO CLÃ (10/11/2026; substituem a Loja do clã, aposentada). O tesouro é um número do CLÃ (nunca por pessoa);
 * cada Buff vale para a roda inteira por 7 dias. Quem compra é o anfitrião (`euPosso`); os outros só veem o que está ativo.
 * Sem saldo, o botão só descansa: nenhuma frase cobra, culpa ou apressa. O preço aqui é exibição; o servidor cobra o dele.
 */
export function GuildBuffs({ casa, language, ocupado, now, onComprar }: {
  casa: GuildCasa; language: Language; ocupado: boolean; now: number; onComprar: (buffId: BuffId) => void;
}) {
  const { saldo, preco, ativos, euPosso } = casa.buffs;
  const pode = euPosso && saldo !== null && saldo >= preco;
  const quando = (ms: number) => new Date(ms).toLocaleDateString(language === 'pt-BR' ? 'pt-BR' : 'en-US', { day: 'numeric', month: 'short' });
  return (
    <section className="sm2-guild-sec" aria-label={buffText(language, 'titulo')} data-guild-room="buffs">
      <h3 className="sm2-stats-lab">{buffText(language, 'titulo')}</h3>
      <p className="sm2-lib-s" style={{ margin: 0 }}>{buffText(language, 'linha', { dias: BUFF_DIAS })}</p>
      {saldo !== null && (
        <p className="sm2-lib-s" style={{ margin: 0, display: 'flex', gap: 6, alignItems: 'center' }} data-buffs-saldo>
          {buffText(language, 'saldo')} <BitsAmount value={saldo} size={16} />
        </p>
      )}
      {!euPosso && <p className="sm2-lib-s" style={{ margin: 0 }} data-buffs-so-anfitriao>{buffText(language, 'soAnfitriao')}</p>}
      <ul className="sm2-grove-list" data-buffs-lista style={{ padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
        {BUFF_IDS.map(id => {
          const a = ativos[id];
          const ativo = !!a && a.ate > now;
          return (
            <li key={id} data-buff={id} data-buff-ativo={ativo ? 'true' : undefined} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="sm2-stats-t" style={{ display: 'block' }}>{buffText(language, `${id}.nome`)}</span>
                <span className="sm2-lib-s" style={{ display: 'block' }}>{buffText(language, `${id}.desc`)}</span>
                {ativo && <span className="sm2-lib-s" style={{ display: 'block' }} data-buff-ate>{buffText(language, 'ativo', { quando: quando(a!.ate) })}</span>}
              </span>
              {euPosso && (
                <button
                  type="button"
                  data-buff-comprar={id}
                  disabled={ocupado || !pode}
                  aria-disabled={ocupado || !pode ? true : undefined}
                  onClick={() => onComprar(id)}
                  className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline"
                >
                  {buffText(language, ativo ? 'renovar' : 'comprar', { dias: BUFF_DIAS })}
                  <BitsAmount value={preco} size={16} dim={!pode} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
