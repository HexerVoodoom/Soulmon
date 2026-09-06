/**
 * NOVA LEITURA — a tela que substituiu o sorteio pago (WP5.7 / decisão H.4).
 *
 * O reroll cobrava 50 Créditos e sorteava a criatura com `Math.random()`. O
 * próprio `termos.html` chamava a peça de "sorteio pago", que é a definição de
 * uma mecânica de gacha e era a única violação declarada da lista de proibições
 * ainda de pé no código.
 *
 * A troca não é de rótulo: **a semente passa a vir das respostas**
 * (`utils/newReading.ts`). Para receber outra criatura, a pessoa muda o que
 * respondeu sobre si mesma — que é o gesto que este produto quer cobrar, em vez
 * de "tenta de novo".
 *
 * Duas regras de forma, e as duas são a diferença entre leitura e caça-níquel:
 *  · **a tela diz a regra ANTES de cobrar.** "Mesma resposta, mesma criatura"
 *    aparece de cara, não num rodapé depois do pagamento.
 *  · **o botão fica desligado enquanto nada mudou.** Sem isso, pagar 50
 *    Créditos para receber exatamente a mesma criatura seria possível — e um
 *    produto que aceita esse pagamento está vendendo confusão.
 */
import { useState } from 'react';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { ORACLE_QUESTIONS } from '../utils/oracle';
import { answersChanged } from '../utils/newReading';
import { REROLL_COST_CREDITS } from '../utils/monetization';
import type { Language } from '../utils/i18n';

interface NewReadingModalProps {
  language: Language;
  /** As respostas da leitura ATUAL (do `SOULMON_PROFILE`). */
  answers: Record<string, string>;
  credits: number;
  onConfirm: (answers: Record<string, string>) => Promise<boolean>;
  onClose: () => void;
}

export function NewReadingModal({ language, answers, credits, onConfirm, onClose }: NewReadingModalProps) {
  const isPt = language === 'pt-BR';
  const L = (t: { pt: string; en: string }) => (isPt ? t.pt : t.en);
  const [rascunho, setRascunho] = useState<Record<string, string>>({ ...answers });
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const mudou = answersChanged(answers, rascunho);
  const podePagar = credits >= REROLL_COST_CREDITS;

  const confirmar = async () => {
    setOcupado(true);
    setErro(null);
    const ok = await onConfirm(rascunho);
    setOcupado(false);
    if (!ok) {
      setErro(isPt
        ? 'Não foi possível fazer a leitura agora. Nada foi cobrado.'
        : "Couldn't do the reading right now. Nothing was charged.");
    }
  };

  return (
    <ModalSheet
      open
      onClose={onClose}
      language={language}
      title={isPt ? 'Nova Leitura' : 'New Reading'}
      maxWidth={520}
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button
            type="button"
            onClick={confirmar}
            disabled={!mudou || !podePagar || ocupado}
            style={{ ...sm2Button('primary', !mudou || !podePagar || ocupado), width: '100%' }}
          >
            {ocupado
              ? (isPt ? 'Lendo…' : 'Reading…')
              : (isPt ? `Ler de novo — ${REROLL_COST_CREDITS} créditos` : `Read again — ${REROLL_COST_CREDITS} credits`)}
          </button>
          <button type="button" onClick={onClose} style={{ ...sm2Button('ghost'), width: '100%' }}>
            {isPt ? 'Agora não' : 'Not now'}
          </button>
        </div>
      }
    >
      {/* A REGRA, antes de qualquer pergunta e antes de qualquer preço. */}
      <p style={{ ...sm2Text, margin: 0 }}>
        {isPt
          ? 'A leitura sai das suas respostas, não de um sorteio. Mesma resposta, mesma criatura — mudar uma resposta é o que muda quem ela vai ser.'
          : 'The reading comes from your answers, not from a roll. Same answers, same creature — changing an answer is what changes who they become.'}
      </p>

      {ORACLE_QUESTIONS.map(q => (
        <div key={q.id}>
          <p style={{ ...sm2Hint, marginBottom: 6 }}>{L(q.text)}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {q.options.map(opt => {
              const escolhida = rascunho[q.id] === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={escolhida}
                  onClick={() => setRascunho(prev => ({ ...prev, [q.id]: opt.id }))}
                  style={{
                    ...sm2Text,
                    padding: '8px 12px',
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontSize: 'var(--sm2-text-xs)',
                    ...(escolhida
                      ? { backgroundColor: 'var(--sm2-primary-fill)', color: 'var(--sm2-on-primary)', border: '1px solid transparent' }
                      : { backgroundColor: 'transparent', color: 'var(--sm2-ink)', border: '1px solid var(--sm2-line)' }),
                  }}
                >
                  {L(opt.text)}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!mudou && (
        <p style={sm2Hint}>
          {isPt
            ? 'Nada mudou ainda — e sem mudança a criatura seria a mesma, então não há o que cobrar.'
            : 'Nothing changed yet — with the same answers the creature would be the same, so there is nothing to charge for.'}
        </p>
      )}
      {mudou && !podePagar && (
        <p style={sm2Hint}>
          {isPt ? 'Créditos insuficientes.' : 'Not enough credits.'}
        </p>
      )}
      {erro && <p role="alert" style={{ ...sm2Hint, color: 'var(--sm2-danger-ink)' }}>{erro}</p>}

      <p style={sm2Hint}>
        {isPt
          ? 'A criatura recomeça em Rookie. Atividades, tarefas, hábitos e Bits continuam exatamente como estão.'
          : 'The creature restarts at Rookie. Activities, tasks, habits and Bits stay exactly as they are.'}
      </p>
    </ModalSheet>
  );
}
