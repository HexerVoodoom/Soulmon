import { sm2Button, sm2Text } from './form/FormKit';
import { AreaSheet } from './nav/AreaSheet';
import type { Language } from '../utils/i18n';
import { MERC_NOME, MERC_RETRATO, MERC_TIPO, pontosMerc, sortearMerc, tarefaDaMissao, type MercMissionState, type MercOrdem } from '../utils/mercMission';
import { ATTR_LABEL } from '../types/attributes';
import { arteOnboarding } from './onboarding/sequencia/assets';

interface Props {
  ordem: MercOrdem;
  onClose: () => void;
  language?: Language;
  /** A missão de HOJE (já filtrada pelo dia do jogador), ou `null` se ainda não aceitou nenhuma. */
  hoje: MercMissionState | null;
  /** Dia do jogador: o convite mostrado é o MESMO que `escolherMerc` vai gravar ao aceitar. */
  dayKey: string;
  /** O BB fica de fora (M5). */
  bb?: boolean;
  onAccept: (ordem: MercOrdem) => void;
  /** "Vou pensar": fecha a folha; quem chama deixa o aviso de uma missão por dia. */
  onThink: () => void;
  /** "Sim, fiz" (a pergunta de honestidade do onboarding, D11). */
  onConfirm: () => void;
}

/** Thassia (dono, 05/11/2026): maior e mais baixa, a folha corta embaixo; o espadão fica inteiro em cima e dos lados. */
const THASSIA_FRAME = { zoom: 1.35, underSheet: 0, flushLeft: true };

/** A folha do LÍDER de uma Ordem (dono, 05/11/2026): o NPC grande no alto, primeiro o que é a missão, depois aceitar ou pensar. */
export function MercGuildSheet({ ordem, onClose, language = 'pt-BR', hoje, dayKey, bb = false, onAccept, onThink, onConfirm }: Props) {
  const isPt = language === 'pt-BR';
  const t = (p: { pt: string; en: string }) => (isPt ? p.pt : p.en);
  const lider = MERC_NOME[ordem];
  const minha = hoje?.ordem === ordem ? hoje : null;
  const outra = hoje && hoje.ordem !== ordem ? hoje : null;
  const item = minha ? tarefaDaMissao(minha) : !hoje ? sortearMerc(dayKey, ordem) : undefined;
  const tipo = ATTR_LABEL[MERC_TIPO[ordem]];
  const premio = item && (isPt ? `Vale ${pontosMerc(item)} pontos de ${tipo.pt}.` : `Worth ${pontosMerc(item)} ${tipo.en} points.`);

  const fala = bb
    ? t({ pt: 'Volte quando o seu Soulmon deixar de ser bebê.', en: 'Come back once your Soulmon is no longer a baby.' })
    : outra
      ? t({ pt: `Hoje você está com ${MERC_NOME[outra.ordem].pt}. Volte amanhã.`, en: `Today you are with ${MERC_NOME[outra.ordem].en}. Come back tomorrow.` })
      : minha?.done
        ? t({ pt: 'Feito. Volte amanhã, se quiser.', en: 'Done. Come back tomorrow if you like.' })
        : minha
          ? t({ pt: 'Você fez de verdade?', en: 'Did you really do it?' })
          : t({ pt: 'Tenho uma missão para você.', en: 'I have a mission for you.' });

  return (
    <AreaSheet
      open
      language={language}
      onClose={onClose}
      title={t({ pt: lider.ordemPt, en: lider.ordemEn })}
      closeLabel={isPt ? 'Fechar' : 'Close'}
      npcArt={arteOnboarding(MERC_RETRATO[ordem])}
      npcVoice={{ name: t(lider), line: fala }}
      npcFrame={ordem === 'rompente' ? THASSIA_FRAME : undefined}
    >
      <div data-merc-guild data-merc-lider={ordem} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!bb && !outra && item && !minha?.done && (
          <>
            <p data-merc-atividade style={{ ...sm2Text, margin: 0 }}>
              {item.emoji} <strong>{t(item.name)}</strong>{' — '}{t(item.target)}
            </p>
            <p data-merc-premio style={{ ...sm2Text, margin: 0 }}>{premio}</p>
            <p data-merc-beneficio style={{ ...sm2Text, margin: 0, fontSize: 'var(--sm2-text-xs)', opacity: 0.75, fontStyle: 'italic' }}>{t(item.benefit)}</p>
          </>
        )}

        {!bb && !hoje && item && (
          <>
            <button type="button" data-merc-aceito onClick={() => onAccept(ordem)} style={{ ...sm2Button('primary'), width: '100%' }}>
              {isPt ? 'Pegar missão' : 'Take the mission'}
            </button>
            <button type="button" data-merc-pensar onClick={onThink} style={{ ...sm2Button('outline'), width: '100%' }}>
              {isPt ? 'Decidir depois' : 'Decide later'}
            </button>
          </>
        )}

        {!bb && minha && !minha.done && (
          <>
            <button type="button" data-merc-resp="sim" onClick={onConfirm} style={{ ...sm2Button('primary'), width: '100%' }}>
              {isPt ? 'Sim, fiz' : 'Yes, I did'}
            </button>
            <button type="button" data-merc-resp="nao" onClick={onClose} style={{ ...sm2Button('outline'), width: '100%' }}>
              {isPt ? 'Ainda não' : 'Not yet'}
            </button>
          </>
        )}

        {!bb && outra && (
          <p data-merc-uma-por-dia style={{ ...sm2Text, margin: 0 }}>
            {isPt ? 'Só dá para pegar uma missão por dia, de um dos três.' : 'You can take only one mission a day, from one of the three.'}
          </p>
        )}
      </div>
    </AreaSheet>
  );
}
