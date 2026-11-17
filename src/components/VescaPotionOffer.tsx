import { useState } from 'react';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { ElementIcon as Icon, elName } from './ElementBaseSlots';
import { potionArt } from '../utils/potionArt';
import { limiarDaPocao } from '../utils/elementPotion';
import { PocaoCriada } from './PocaoCriada';
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
  /** Todos os elementos na fila agora (16/11/2026): 2+ = UM pop-up em lista, sem spam. Ausente = só `elementId`. */
  elementIds?: readonly string[];
  /** `false` = não deu para fazer (sem saldo): a tela de "criada" não aparece. */
  onMake: (elementId: string) => boolean | void;
  onDismiss: () => void;
}

export function VescaPotionOffer({ language, elementId, elementIds, onMake, onDismiss }: VescaPotionOfferProps) {
  const isPt = language === 'pt-BR';
  const [made, setMade] = useState<string | null>(null);
  const [feitas, setFeitas] = useState<readonly string[]>([]);
  if (!elementId) return null;
  const lista = (elementIds && elementIds.length > 1 ? elementIds : [elementId]).filter(i => !feitas.includes(i));
  if (!made && elementIds && elementIds.length > 1 && lista.length === 0) { onDismiss(); return null; }
  const vesca = areaNpcVoice('laboratorio', language).name;
  const el = elName(elementId, isPt);
  const close = () => { setMade(null); onDismiss(); };
  const fecharFeita = () => { const id = made; setMade(null); if (id) setFeitas(f => [...f, id]); if (lista.length <= 1 || !(elementIds && elementIds.length > 1)) onDismiss(); };
  const limiar = limiarDaPocao(elementId) ?? 100;
  // 12/11/2026: depois de fazer, o modalzinho com OK dá lugar à tela cheia "Poção de X criada" (sem caixa; véu, luz, ícone, texto e OK).
  if (made) return <PocaoCriada language={language} elementId={made} onClose={fecharFeita} />;
  const grupo = !!elementIds && elementIds.length > 1;
  return (
    <ModalSheet open title={vesca} onClose={close} language={language}
      footer={(
        // §316c (13/11/2026, dono): popup branco pequeno volta ao par padrão do app, em linha (sem o CTA do site).
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button type="button" data-vesca-later style={sm2Button('quiet')} onClick={close}>{isPt ? 'Depois' : 'Later'}</button>
          {!grupo && <button type="button" data-vesca-make style={sm2Button('primary')} onClick={() => { if (onMake(elementId) !== false) setMade(elementId); }}>
            {isPt ? 'Fazer a poção' : 'Make the potion'}
          </button>}
        </div>
      )}>
      <div data-vesca-offer style={{ display: 'grid', gap: 10, justifyItems: 'center', textAlign: 'center' }}>
        {grupo && (
          <>
            <p style={sm2Text}>{isPt ? 'Você já juntou essências para estas poções. Quer fazer alguma agora?' : 'You have gathered enough essence for these potions. Shall I brew any now?'}</p>
            <ul data-vesca-lista style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 8, width: '100%' }}>
              {lista.map(id => (
                <li key={id} data-vesca-item={id} style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44 }}>
                  <Icon id={id} size={24} /><span style={{ ...sm2Text, flex: 1, textAlign: 'left' }}>{elName(id, isPt)}</span>
                  <button type="button" data-vesca-make={id} style={sm2Button('primary')} onClick={() => { if (onMake(id) !== false) setMade(id); }}>{isPt ? 'Fazer a poção' : 'Make the potion'}</button>
                </li>
              ))}
            </ul>
          </>
        )}
        {!grupo && (potionArt(elementId) ? <img src={potionArt(elementId)} alt="" aria-hidden="true" width={64} height={64} draggable={false} data-vesca-potion-art /> : <Icon id={elementId} size={32} />)}
        {!grupo && <p style={sm2Text}>{isPt ? `Você já juntou ${limiar} essências de ${el}. Quer que eu faça a poção agora?` : `You have gathered ${limiar} ${el} essences. Shall I brew the potion now?`}</p>}
        {!grupo && <p style={sm2Hint}>{isPt ? `Gasta ${limiar} essências. Se preferir, faça depois no Laboratório.` : `Costs ${limiar} essences. You can also do it later in the Laboratory.`}</p>}
      </div>
    </ModalSheet>
  );
}
