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
import { ElementIcon } from '../ElementBaseSlots';
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
  /** O estágio da forma (ex.: 'Transcendent'): é o TÍTULO do modal quando vem; a frase de modo desce para a linha de baixo. */
  nomeDoEstagio?: string;
  /** Formas desbloqueadas, na ordem (a 1ª é a original), já com a arte de cada uma. */
  itens: FormaAltItem[];
  formasAlt: FormasAlt | undefined;
  equipada: string | undefined;
  /** Toque no botão de uma opção: equipar (modo `equipar`) ou degenerar para ela (modo `degenerar`). */
  onEquip: (elemento: string) => void;
  /** `equipar` (padrão): lista para equipar. `degenerar` (09/11/2026): "Degenerar para…", opções já liberadas daquela forma. `ver`: só leitura (forma mais evoluída que a atual). */
  modo?: 'equipar' | 'degenerar' | 'ver';
  /** A forma do modal é a ATUAL? Não sendo (outra linha, mesmo nível), o botão diz "Trocar forma" e nenhuma é marcada EQUIPADA. */
  ehAtual?: boolean;
  onClose: () => void;
}

export function FormasAlternativasSheet({ isPt, formId, nomeDaForma, nomeDoEstagio, itens, formasAlt, equipada, onEquip, modo = 'equipar', ehAtual = true, onClose }: Props) {
  const ocultas = ocultasDaForma(formasAlt, formId, new Set([...ALL_ELEMENT_IDS, ...CURATED_ELEMENT_IDS]).size);
  const equipadaEf = equipada ?? itens[0]?.elemento;
  const nomeEl = (el: string) => (el === ALT_ORIGINAL || el === '__atual' ? (isPt ? 'Original' : 'Original') : (isPt ? elementoNomeDe(el).pt : elementoNomeDe(el).en));
  const fraseModo = modo === 'degenerar' ? (isPt ? 'Degenerar para…' : 'Degenerate to…') : (isPt ? 'Formas alternativas' : 'Alternate forms');
  const titulo = nomeDoEstagio || fraseModo;
  return (
    <RitualDialog label={titulo} title={titulo} onClose={onClose} zIndex={130} maxWidth={360} closeLabel={isPt ? 'Fechar' : 'Close'} closeOnBackdrop>
      <div data-testid="sm-formas-alt" style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '70vh', overflowY: 'auto' }}>
        <div>
          {/* O estágio mora na PLACA (title); aqui só o subtítulo, sem repetir o título. */}
          <p style={{ ...sm2Hint, margin: 0, overflowWrap: 'normal', wordBreak: 'keep-all', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nomeDoEstagio ? `${fraseModo} · ${nomeDaForma}` : nomeDaForma}</p>
        </div>
        {modo === 'equipar' && itens.length <= 1 && (
          <p style={{ ...sm2Hint, margin: 0 }} data-testid="sm-formas-alt-dica">
            {isPt
              ? 'Se você degenerar e evoluir usando uma poção elemental, você desbloqueará uma nova forma deste nível.'
              : 'If you degenerate and evolve again using an elemental potion, you will unlock a new form of this level.'}
          </p>
        )}
        {itens.map((it, i) => {
          const eq = modo === 'equipar' && ehAtual && (it.elemento === equipadaEf || (!equipadaEf && i === 0));
          return (
            <div key={it.elemento} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }} data-testid={`sm-forma-alt-${it.elemento}`}>
              <SoulNode visual={eq ? 'current' : 'reached'} sprite={it.sprite} label={`${nomeDaForma} — ${nomeEl(it.elemento)}`} title={nomeEl(it.elemento)} />
              <div style={{ flex: '1 1 0', minWidth: 'calc(var(--sm2-space-6) * 4)' }}>
                {/* Nome da variante em NEGRITO (forma + elemento; a original leva só o nome da forma) e, embaixo, ícone + elemento. */}
                <p style={{ ...sm2Text, fontWeight: 700, margin: 0, overflowWrap: 'normal', wordBreak: 'keep-all', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} data-testid="sm-forma-alt-nome">
                  {it.elemento === ALT_ORIGINAL || it.elemento === '__atual' ? nomeDaForma : `${nomeDaForma} ${nomeEl(it.elemento)}`}
                </p>
                <p style={{ ...sm2Hint, margin: 0, display: 'flex', alignItems: 'center', gap: 4 }} data-testid="sm-forma-alt-elemento">
                  {it.elemento !== ALT_ORIGINAL && it.elemento !== '__atual' && <ElementIcon id={it.elemento} size={16} />}
                  <span>{nomeEl(it.elemento)}</span>
                </p>
                {!it.sprite && <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'sendo desenhada…' : 'being drawn…'}</p>}
              </div>
              {modo === 'ver' ? null : eq
                ? <span style={{ ...sm2Hint, color: 'var(--sm2-primary-ink)', fontWeight: 600 }}>{isPt ? 'EQUIPADA' : 'EQUIPPED'}</span>
                : modo === 'degenerar'
                  ? <button type="button" onClick={() => onEquip(it.elemento)} style={{ ...sm2Button('outline', false, 'sm'), padding: '0 var(--sm2-space-3)', whiteSpace: 'nowrap', flex: 'none' }}>{isPt ? 'Degenerar' : 'Degenerate'}</button>
                  : <button type="button" onClick={() => onEquip(it.elemento)} style={{ ...sm2Button('outline', false, 'sm'), padding: '0 var(--sm2-space-3)', whiteSpace: 'nowrap', flex: 'none' }}>{ehAtual ? (isPt ? 'Equipar' : 'Equip') : (isPt ? 'Trocar forma' : 'Switch form')}</button>}
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
