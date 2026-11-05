/**
 * FORMAS ALTERNATIVAS (pedido do dono, 05/11/2026) — a tela que lista as versões por elemento de UMA forma.
 *
 * Em cima, as formas já desbloqueadas daquele nível (a 1ª é a original); cada uma pode ser equipada. Embaixo, sempre
 * `ocultasDaForma` interrogações (3, a menos que todos os elementos já tenham sido feitos). Sem nenhuma alternativa ainda, a
 * tela ensina o caminho: degenerar e evoluir de novo com uma poção elemental. A regra mora em `utils/formasAlternativas.ts`.
 */
import { RitualDialog } from '../ritual/RitualKit';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { SoulNode } from './SoulNode';
import { ALT_ORIGINAL, ocultasDaForma, type FormasAlt } from '../../utils/formasAlternativas';
import { ALL_ELEMENT_IDS } from '../../utils/elementDex';
import { CURATED_ELEMENT_IDS } from '../../utils/elementosCurados';
import { elementoNomeDe } from '../../utils/soulProfile/ficha/elementoNome';

export interface FormaAltItem {
  elemento: string;
  sprite?: string;
}

interface Props {
  isPt: boolean;
  formId: string;
  nomeDaForma: string;
  /** Formas desbloqueadas, na ordem (a 1ª é a original), já com a arte de cada uma. */
  itens: FormaAltItem[];
  formasAlt: FormasAlt | undefined;
  equipada: string | undefined;
  onEquip: (elemento: string) => void;
  onClose: () => void;
}

export function FormasAlternativasSheet({ isPt, formId, nomeDaForma, itens, formasAlt, equipada, onEquip, onClose }: Props) {
  const ocultas = ocultasDaForma(formasAlt, formId, new Set([...ALL_ELEMENT_IDS, ...CURATED_ELEMENT_IDS]).size);
  const equipadaEf = equipada ?? itens[0]?.elemento;
  const nomeEl = (el: string) => (el === ALT_ORIGINAL || el === '__atual' ? (isPt ? 'Original' : 'Original') : (isPt ? elementoNomeDe(el).pt : elementoNomeDe(el).en));
  const titulo = isPt ? 'Formas alternativas' : 'Alternate forms';
  return (
    <RitualDialog label={titulo} onClose={onClose} zIndex={130} maxWidth={360} closeLabel={isPt ? 'Fechar' : 'Close'} closeOnBackdrop>
      <div data-testid="sm-formas-alt" style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '70vh', overflowY: 'auto' }}>
        <div>
          <p style={{ ...sm2Text, fontWeight: 600, margin: 0 }}>{titulo}</p>
          <p style={{ ...sm2Hint, margin: 0 }}>{nomeDaForma}</p>
        </div>
        {itens.length <= 1 && (
          <p style={{ ...sm2Hint, margin: 0 }} data-testid="sm-formas-alt-dica">
            {isPt
              ? 'Se você degenerar e evoluir usando uma poção elemental, você desbloqueará uma nova forma deste nível.'
              : 'If you degenerate and evolve again using an elemental potion, you will unlock a new form of this level.'}
          </p>
        )}
        {itens.map((it, i) => {
          const eq = it.elemento === equipadaEf || (!equipadaEf && i === 0);
          return (
            <div key={it.elemento} style={{ display: 'flex', gap: 12, alignItems: 'center' }} data-testid={`sm-forma-alt-${it.elemento}`}>
              <SoulNode visual={eq ? 'current' : 'reached'} sprite={it.sprite} label={`${nomeDaForma} — ${nomeEl(it.elemento)}`} title={nomeEl(it.elemento)} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ ...sm2Text, fontWeight: 500, margin: 0 }}>{nomeEl(it.elemento)}</p>
                {!it.sprite && <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'sendo desenhada…' : 'being drawn…'}</p>}
              </div>
              {eq
                ? <span style={{ ...sm2Hint, color: 'var(--sm2-primary-ink)', fontWeight: 600 }}>{isPt ? 'EQUIPADA' : 'EQUIPPED'}</span>
                : <button type="button" onClick={() => onEquip(it.elemento)} style={sm2Button('outline', false, 'sm')}>{isPt ? 'Equipar' : 'Equip'}</button>}
            </div>
          );
        })}
        {Array.from({ length: ocultas }, (_, i) => (
          <div key={`oculta-${i}`} style={{ display: 'flex', gap: 12, alignItems: 'center' }} data-testid="sm-forma-alt-oculta">
            <SoulNode visual="locked" label={isPt ? 'Forma oculta' : 'Hidden form'} title={isPt ? 'Forma oculta' : 'Hidden form'} />
            <p style={{ ...sm2Text, margin: 0, color: 'var(--sm2-muted)' }}>???</p>
          </div>
        ))}
      </div>
    </RitualDialog>
  );
}
