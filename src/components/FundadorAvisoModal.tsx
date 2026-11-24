import { ModalSheet } from './form/FormKit';
import type { Language } from '../utils/i18n';
import { FUNDADOR_MARCOS, FUNDADOR_FUNDO_ID, FUNDADOR_MOLDURA_ID, FUNDADOR_RETRATO_ID, FUNDADOR_CRISTAL_ID } from '../utils/fundador';
import fundo from '../assets/backgrounds/founder-fundo.webp';
import moldura from '../assets/soulmon/molduras/founder-moldura.png';
import retrato from '../assets/avatares/founder-retrato.webp';
import cristal from '../assets/decor/furn-cristal-fundador.png';

/**
 * AVISO DO CONJUNTO FUNDADOR (decisão do dono 24/11/2026: UM MODAL PARA CADA PRÊMIO). Popup central (título inline, ✕ à direita) de UM prêmio:
 * arte grande + nome + "Ganho por constância: N dias." + "Equipar" (fundo/moldura/retrato; o Cristal só "Fechar") + "Fechar". Quem o monta
 * (App, item `fundador` da fila) mostra um por vez, na ordem Fundo → Moldura → Retrato → Cristal, e grava só o id fechado.
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
  /** O prêmio desta vez (um por modal). */
  premio: string;
  onClose: () => void;
  onEquip: (premio: string) => void;
}

/** Dias acumulados que o marco do prêmio exige (a frase "Ganho por constância"). */
const diasDoMarco = (id: string): number => FUNDADOR_MARCOS.find(m => m.premio === id)?.dias ?? 0;

export function FundadorAvisoModal({ language, premio, onClose, onEquip }: FundadorAvisoModalProps) {
  const pt = language === 'pt-BR';
  const nome = (pt ? NOMES[premio]?.pt : NOMES[premio]?.en) ?? premio;
  const equipavel = FUNDADOR_EQUIPAVEIS.includes(premio);
  const dias = diasDoMarco(premio);
  const frase = pt ? `Ganho por constância: ${dias} ${dias === 1 ? 'dia' : 'dias'}.` : `Earned by consistency: ${dias} ${dias === 1 ? 'day' : 'days'}.`;
  const fundo = premio === FUNDADOR_FUNDO_ID;
  return (
    <ModalSheet open placement="center" titulo="inline" title={pt ? 'Prêmio de Fundador' : 'Founder reward'} onClose={onClose} language={language} maxWidth={328}
      footer={(
        <div className="sm2-forja-resultado-acoes">
          {equipavel && <button type="button" data-fundador-equip className="sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-primary" onClick={() => onEquip(premio)}>{pt ? 'Equipar' : 'Equip'}</button>}
          <button type="button" data-fundador-close className="sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-outline" onClick={onClose}>{pt ? 'Fechar' : 'Close'}</button>
        </div>
      )}>
      <div data-fundador-aviso={premio} className="sm2-forja-resultado" role="status">
        <span className="sm2-forja-resultado-arte" aria-hidden="true">
          <img data-fundador-arte={premio} src={ARTES[premio]} alt="" draggable={false}
            style={{ width: fundo ? 200 : 160, height: fundo ? 120 : 160, objectFit: fundo ? 'cover' : 'contain', borderRadius: fundo ? 12 : 0 }} />
        </span>
        <strong data-fundador-nome className="sm2-forja-resultado-nome">{nome}</strong>
        <p data-fundador-frase className="sm2-forja-resultado-efeito">{frase}</p>
      </div>
    </ModalSheet>
  );
}
