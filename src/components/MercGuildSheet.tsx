import { useState } from 'react';
import { ModalSheet, sm2Button, sm2Text } from './form/FormKit';
import type { Language } from '../utils/i18n';
import { ACTIVITY_CATALOG_BY_ID } from '../data/activityCatalog';
import { MERC_ORDENS, MERC_NOME, MERC_RETRATO, MERC_TIPO, pontosMerc, type MercMissionState, type MercOrdem } from '../utils/mercMission';
import { ATTR_LABEL } from '../types/attributes';
import { arteOnboarding } from './onboarding/sequencia/assets';

interface Props {
  open: boolean;
  onClose: () => void;
  language?: Language;
  /** A missão de HOJE (já filtrada pelo dia do jogador), ou `null` se ainda não escolheu. */
  hoje: MercMissionState | null;
  /** O BB fica de fora (M5): o painel só mostra o convite para voltar depois. */
  bb?: boolean;
  onChoose: (ordem: MercOrdem) => void;
  /** "Sim, fiz" (a pergunta de honestidade do onboarding, D11). */
  onConfirm: () => void;
}

/** Guilda dos Mercenários (§11): um Desbravador de cada Ordem principal; 1 convite por dia. Retratos = placeholder até a arte. */
export function MercGuildSheet({ open, onClose, language = 'pt-BR', hoje, bb = false, onChoose, onConfirm }: Props) {
  const isPt = language === 'pt-BR';
  const [adiado, setAdiado] = useState(false);
  const item = hoje ? ACTIVITY_CATALOG_BY_ID[hoje.activityId] : undefined;
  const t = (p: { pt: string; en: string }) => (isPt ? p.pt : p.en);

  return (
    <ModalSheet open={open} onClose={onClose} language={language} maxWidth={440}
      title={isPt ? 'Guilda dos Mercenários' : 'Mercenary Guild'}>
      <div data-merc-guild style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {bb && (
          <p data-merc-bb style={{ ...sm2Text, margin: 0 }}>
            {isPt ? 'Os Desbravadores esperam o seu Soulmon crescer. Volte quando ele deixar de ser bebê.'
                  : 'The Pathfinders wait for your Soulmon to grow. Come back once it is no longer a baby.'}
          </p>
        )}

        {!bb && !hoje && (
          <>
            <p style={{ ...sm2Text, margin: 0 }}>
              {isPt ? 'Cada Desbravador tem um convite para hoje. Escolha um, se quiser; os outros esperam amanhã.'
                    : 'Each Pathfinder has an invitation for today. Pick one if you like; the others wait until tomorrow.'}
            </p>
            {MERC_ORDENS.map(o => (
              <button key={o} type="button" data-merc-ordem={o} onClick={() => onChoose(o)}
                style={{ ...sm2Button('outline'), width: '100%', justifyContent: 'flex-start', gap: 12 }}>
                {arteOnboarding(MERC_RETRATO[o])
                  ? <img data-merc-retrato={MERC_RETRATO[o]} src={arteOnboarding(MERC_RETRATO[o])} alt="" aria-hidden style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  : <span data-merc-retrato={MERC_RETRATO[o]} aria-hidden style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--sm2-surface-2, #2a2a2a)', flexShrink: 0 }} />}
                <span style={{ textAlign: 'left' }}>
                  <strong>{t({ pt: MERC_NOME[o].pt, en: MERC_NOME[o].en })}</strong>
                  <br />
                  <small>{isPt ? MERC_NOME[o].ordemPt : MERC_NOME[o].ordemEn} · {t(ATTR_LABEL[MERC_TIPO[o]])}</small>
                </span>
              </button>
            ))}
          </>
        )}

        {!bb && hoje && (
          <>
            <p style={{ ...sm2Text, margin: 0 }}>
              <strong>{isPt ? MERC_NOME[hoje.ordem].pt : MERC_NOME[hoje.ordem].en}</strong>
              {': '}{isPt ? 'o convite de hoje.' : "today's invitation."}
            </p>
            {item && (
              <p data-merc-atividade style={{ ...sm2Text, margin: 0 }}>
                {item.emoji} {t(item.name)}{' — '}{t(item.levels[0].target)}
              </p>
            )}
            {hoje.done ? (
              <p role="status" data-merc-feita style={{ ...sm2Text, margin: 0 }}>
                {isPt ? 'Feito. O Desbravador agradece. Volte amanhã, se quiser.' : 'Done. The Pathfinder thanks you. Come back tomorrow if you like.'}
              </p>
            ) : (
              <>
                <p style={{ ...sm2Text, margin: 0, fontWeight: 600 }}>{isPt ? 'Você fez de verdade?' : 'Did you really do it?'}</p>
                <p data-merc-premio style={{ ...sm2Text, margin: 0 }}>
                  {isPt ? `Vale ${item ? pontosMerc(item) : 3} pontos de ${ATTR_LABEL[MERC_TIPO[hoje.ordem]].pt}.`
                        : `Worth ${item ? pontosMerc(item) : 3} ${ATTR_LABEL[MERC_TIPO[hoje.ordem]].en} points.`}
                </p>
                <button type="button" data-merc-resp="sim" onClick={onConfirm} style={{ ...sm2Button('primary'), width: '100%' }}>
                  {isPt ? 'Sim, fiz' : 'Yes, I did'}
                </button>
                <button type="button" data-merc-resp="nao" onClick={() => setAdiado(true)} style={{ ...sm2Button('outline'), width: '100%' }}>
                  {isPt ? 'Ainda não' : 'Not yet'}
                </button>
                {adiado && (
                  <p role="status" data-merc-espera style={{ ...sm2Text, margin: 0 }}>
                    {isPt ? 'Sem pressa. O convite fica aberto até o fim do dia.' : 'No rush. The invitation stays open until the end of the day.'}
                  </p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </ModalSheet>
  );
}
