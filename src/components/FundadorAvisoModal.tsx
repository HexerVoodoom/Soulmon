import { ModalSheet } from './form/FormKit';
import type { Language } from '../utils/i18n';
import { FUNDADOR_FUNDO_ID, FUNDADOR_MOLDURA_ID, FUNDADOR_RETRATO_ID, FUNDADOR_CRISTAL_ID } from '../utils/fundador';
import fundo from '../assets/backgrounds/founder-fundo.webp';
import moldura from '../assets/soulmon/molduras/founder-moldura.png';
import retrato from '../assets/avatares/founder-retrato.webp';
import cristal from '../assets/decor/furn-cristal-fundador.png';

/**
 * AVISO DO CONJUNTO FUNDADOR (23/11/2026, PR 2 de 2): popup central (padrão do `ForgeResultModal`: título inline, ✕ à direita) quando o
 * jogador GANHA prêmio(s). Um prêmio = arte + nome + uma frase + "Equipar" (fundo/moldura/retrato; o Cristal só "Fechar"). Vários de uma
 * vez (conta existente) = UM popup com a grade dos prêmios e só "Fechar". Só apresenta: quem o monta decide QUANDO abrir e marca os avisados.
 */
const NOMES: Record<string, { pt: string; en: string }> = {
  [FUNDADOR_FUNDO_ID]: { pt: 'Fundo Fundador', en: 'Founder Background' },
  [FUNDADOR_MOLDURA_ID]: { pt: 'Moldura Fundadora', en: 'Founder Frame' },
  [FUNDADOR_RETRATO_ID]: { pt: 'Retrato Fundador', en: 'Founder Portrait' },
  [FUNDADOR_CRISTAL_ID]: { pt: 'Cristal Fundador', en: 'Founder Crystal' },
};
const ARTES: Record<string, string> = {
  [FUNDADOR_FUNDO_ID]: fundo, [FUNDADOR_MOLDURA_ID]: moldura, [FUNDADOR_RETRATO_ID]: retrato, [FUNDADOR_CRISTAL_ID]: cristal,
};
export const FUNDADOR_EQUIPAVEIS: readonly string[] = [FUNDADOR_FUNDO_ID, FUNDADOR_MOLDURA_ID, FUNDADOR_RETRATO_ID];

export interface FundadorAvisoModalProps {
  language: Language;
  /** Prêmios a avisar (≥ 1), na ordem de entrega. */
  premios: string[];
  /** Dias acumulados (frase do prêmio único). */
  dias: number;
  onClose: () => void;
  onEquip: (premio: string) => void;
}

export function FundadorAvisoModal({ language, premios, dias, onClose, onEquip }: FundadorAvisoModalProps) {
  const pt = language === 'pt-BR';
  const nome = (id: string) => (pt ? NOMES[id]?.pt : NOMES[id]?.en) ?? id;
  const unico = premios.length === 1 ? premios[0] : null;
  const equipavel = unico !== null && FUNDADOR_EQUIPAVEIS.includes(unico);
  const titulo = unico ? (pt ? 'Prêmio de Fundador' : 'Founder reward') : (pt ? 'Conjunto Fundador' : 'Founder Set');
  const frase = unico
    ? (pt ? `Ganho por constância: ${dias} ${dias === 1 ? 'dia' : 'dias'}.` : `Earned by consistency: ${dias} ${dias === 1 ? 'day' : 'days'}.`)
    : (pt ? 'Presente para quem chegou cedo.' : 'A gift for those who arrived early.');
  return (
    <ModalSheet open placement="center" titulo="inline" sobreTelas title={titulo} onClose={onClose} language={language} maxWidth={328}
      footer={(
        <div className="sm2-forja-resultado-acoes">
          {equipavel && <button type="button" data-fundador-equip className="sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-primary" onClick={() => onEquip(unico!)}>{pt ? 'Equipar' : 'Equip'}</button>}
          <button type="button" data-fundador-close className="sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-outline" onClick={onClose}>{pt ? 'Fechar' : 'Close'}</button>
        </div>
      )}>
      <div data-fundador-aviso className="sm2-forja-resultado" role="status">
        <span className="sm2-forja-resultado-arte" aria-hidden="true" style={{ gap: 12, flexWrap: 'wrap' }}>
          {premios.map(id => (
            <img key={id} data-fundador-arte={id} src={ARTES[id]} alt="" draggable={false}
              style={{ width: unico ? 112 : 64, height: unico ? 112 : 64, objectFit: id === FUNDADOR_FUNDO_ID ? 'cover' : 'contain', borderRadius: id === FUNDADOR_FUNDO_ID ? 12 : 0 }} />
          ))}
        </span>
        {unico
          ? <strong data-fundador-nome className="sm2-forja-resultado-nome">{nome(unico)}</strong>
          : <ul data-fundador-lista className="sm2-forja-resultado-nome" style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 'var(--sm2-text-md)' }}>{premios.map(id => <li key={id}>{nome(id)}</li>)}</ul>}
        <p data-fundador-frase className="sm2-forja-resultado-efeito">{frase}</p>
      </div>
    </ModalSheet>
  );
}
