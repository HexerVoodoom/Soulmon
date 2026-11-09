import { useState } from 'react';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { ElementIcon as Icon, elName } from './ElementBaseSlots';
import { potionArt } from '../utils/potionArt';
import { POTION_COSTS } from '../utils/elementPotion';
import { areaNpcVoice } from '../utils/areaNpcVoice';
import type { Language } from '../utils/i18n';

/**
 * Oferta da Vesca (08/11/2026, dono): quando a essência de um elemento BASE chega a `POTION_COSTS.baseOwn`, a cientista pergunta se o
 * jogador quer fazer a poção agora. Recusar é de graça e a poção segue disponível no Laboratório. Quem decide QUANDO abrir é o App
 * (`essenceThresholdCrossings`); aqui só a pergunta. Custo e regra: `utils/elementPotion.ts`.
 */
export interface VescaPotionOfferProps {
  language: Language;
  elementId: string | null;
  onMake: (elementId: string) => void;
  onDismiss: () => void;
}

export function VescaPotionOffer({ language, elementId, onMake, onDismiss }: VescaPotionOfferProps) {
  const isPt = language === 'pt-BR';
  const [made, setMade] = useState(false);
  if (!elementId) return null;
  const vesca = areaNpcVoice('laboratorio', language).name;
  const el = elName(elementId, isPt);
  const close = () => { setMade(false); onDismiss(); };
  return (
    <ModalSheet open title={vesca} onClose={close} language={language}
      footer={made ? (
        <button type="button" data-vesca-ok style={sm2Button('primary')} onClick={close}>OK</button>
      ) : (
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button type="button" data-vesca-later style={sm2Button('quiet')} onClick={close}>{isPt ? 'Depois' : 'Later'}</button>
          <button type="button" data-vesca-make style={sm2Button('primary')} onClick={() => { onMake(elementId); setMade(true); }}>
            {isPt ? 'Fazer a poção' : 'Make the potion'}
          </button>
        </div>
      )}>
      <div data-vesca-offer style={{ display: 'grid', gap: 10, justifyItems: 'center', textAlign: 'center' }}>
        {potionArt(elementId) ? <img src={potionArt(elementId)} alt="" aria-hidden="true" width={64} height={64} draggable={false} data-vesca-potion-art /> : <Icon id={elementId} size={32} />}
        {made
          ? <p role="status" style={sm2Text}>{isPt ? `Poção de ${el} pronta! Está na pasta de itens.` : `${el} potion ready! It is in your item folder.`}</p>
          : <>
            <p style={sm2Text}>{isPt ? `Você já juntou ${POTION_COSTS.baseOwn} essências de ${el}. Quer que eu faça a poção agora?` : `You have gathered ${POTION_COSTS.baseOwn} ${el} essences. Shall I brew the potion now?`}</p>
            <p style={sm2Hint}>{isPt ? 'Gasta 100 essências. Se preferir, faça depois no Laboratório.' : 'Costs 100 essences. You can also do it later in the Laboratory.'}</p>
          </>}
      </div>
    </ModalSheet>
  );
}
