import { useMemo } from 'react';
import type { Language } from '../utils/i18n';
import { ModalSheet, sm2Button, sm2Hint, sm2Label, sm2Text } from './form/FormKit';
import { InfoTip } from './ui/InfoTip';
import { weekdayShort, weekdayFull, WEEKDAY_INDEXES } from '../utils/weekdays';
import {
  equilibrarSemana, type AtividadeSemanal, type PropostaDeEquilibrio,
} from '../utils/weekBalance';

/**
 * "EQUILIBRAR MINHA SEMANA" — a tela de confirmação (P4).
 *
 * Vem da queixa 2 do teste com usuários: *"tenho preguiça de planejar"*. A
 * pesquisa do dossiê é conclusiva — ninguém planeja a semana num app de
 * hábito —, então isto **não é um planejador**: é uma proposta pronta que a
 * pessoa aceita ou recusa.
 *
 * ## Por que existe uma TELA, e não um botão que já aplica
 *
 * Autoria da meta é o que sustenta a motivação intrínseca (SDT). Um app que
 * reorganiza a semana da pessoa sem mostrar o que vai fazer é o chefe de novo
 * — exatamente o que a essência declarada do Soulmon recusa. Por isso:
 *
 *  · o antes/depois é mostrado **antes** de qualquer escrita;
 *  · a confirmação é explícita, e "Agora não" é uma saída de primeira classe,
 *    não um X escondido;
 *  · a frequência de cada hábito é preservada pelo núcleo — muda QUAIS dias,
 *    nunca QUANTOS (ver `utils/weekBalance.ts`).
 *
 * ## A honestidade quando não cabe
 *
 * Quando a carga não entra em `7 × teto`, a proposta ainda melhora o pico, mas
 * a tela **diz que não resolve**. Prometer alívio que não vem é o jeito mais
 * rápido de a pessoa parar de acreditar no app — e aqui ela já chegou dizendo
 * que se sente sobrecarregada.
 */

interface Props {
  open: boolean;
  onClose: () => void;
  language: Language;
  /** Só as de `Schedule.kind === 'weekdays'` — ver o cabeçalho do núcleo. */
  atividades: Array<{ id: string; name: string; weekDays: number[] }>;
  /** O `required` do estágio. O número não é decidido aqui. */
  teto: number;
  /** Recebe SÓ o que mudou. Nunca é chamado sem confirmação. */
  onAplicar: (mudancas: AtividadeSemanal[]) => void;
}

/**
 * Uma barrinha por dia — a leitura tem que ser instantânea, sem números.
 *
 * Canvas ATIVIDADES (`EquilibrarSemana`, D-A5/R5): "hoje" em `surface-2` +
 * fronteira `muted` (fantasma), "como ficaria" em `primary-soft` + fronteira
 * `primary-ink`; sem dígito na tela — o dígito vai no `aria-label`, que a
 * leitura sonora precisa. Sem vermelho para o dia acima do teto (o convite
 * não é alarme) e sem `opacity` para o dia vazio: ele é uma barra de 8px.
 */
function Semana({
  contagem, teto, language, titulo, proposta,
}: { contagem: number[]; teto: number; language: Language; titulo: string; proposta: boolean }) {
  const pico = Math.max(...contagem, teto, 1);
  return (
    <div>
      <p style={{ ...sm2Label, marginBottom: 8, letterSpacing: '.06em', textTransform: 'uppercase' }}>{titulo}</p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 60 }}>
        {WEEKDAY_INDEXES.map(dia => {
          const n = contagem[dia] ?? 0;
          return (
            <div
              key={dia}
              // O número vai no `aria-label` porque a barra é a leitura
              // rápida e o leitor de tela precisa do dado, não da altura.
              role="img"
              aria-label={`${weekdayFull(dia, language)}: ${n}`}
              style={{
                flex: 1,
                boxSizing: 'border-box',
                height: Math.max(8, Math.round((n / pico) * 56)),
                borderRadius: '4px 4px 0 0',
                borderStyle: 'solid',
                borderWidth: '1px 1px 0',
                backgroundColor: proposta ? 'var(--sm2-primary-soft)' : 'var(--sm2-surface-2)',
                borderColor: proposta ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)',
              }}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {WEEKDAY_INDEXES.map(dia => (
          <span key={dia} style={{ ...sm2Hint, flex: 1, textAlign: 'center' }}>{weekdayShort(dia, language)}</span>
        ))}
      </div>
    </div>
  );
}

export function BalanceWeekModal({
  open, onClose, language, atividades, teto, onAplicar,
}: Props) {
  const isPt = language === 'pt-BR';

  const proposta: PropostaDeEquilibrio = useMemo(
    () => equilibrarSemana(atividades.map(a => ({ id: a.id, days: a.weekDays })), teto),
    [atividades, teto],
  );

  const nomePorId = useMemo(
    () => new Map(atividades.map(a => [a.id, a.name])),
    [atividades],
  );
  /* Os dias de HOJE, para a lista "Name: Mon · Wed → Tue · Thu". */
  const diasPorId = useMemo(
    () => new Map(atividades.map(a => [a.id, a.weekDays])),
    [atividades],
  );

  const t = {
    titulo: isPt ? 'Equilibrar minha semana' : 'Balance my week',
    // Tom de companheiro, nunca de auditor. Ela não fez nada errado.
    intro: isPt
      ? 'Quer que eu espalhe isso pela semana? Assim sobram dias mais leves.'
      : 'Want me to spread this across the week? That leaves lighter days.',
    antes: isPt ? 'Como está hoje' : 'How it is today',
    depois: isPt ? 'Como ficaria' : 'How it would look',
    oQueMuda: isPt ? 'O que muda' : 'What changes',
    // A frase que impede o mal-entendido mais provável.
    mesmaFrequencia: isPt
      ? 'Cada hábito continua acontecendo o mesmo número de vezes por semana — muda só em quais dias.'
      : 'Each habit still happens the same number of times per week — only which days change.',
    naoCabe: isPt
      ? 'Mesmo espalhando, alguns dias seguem cheios: há mais coisas do que cabe numa semana equilibrada. Ainda ajuda, mas não resolve sozinho.'
      : "Even spread out, some days stay full: there's more here than fits in a balanced week. It still helps, but it won't solve it alone.",
    aplicar: isPt ? 'Pode espalhar' : 'Go ahead',
    agoraNao: isPt ? 'Agora não' : 'Not now',
    semMudanca: isPt
      ? 'Sua semana já está equilibrada — não há nada que eu melhore aqui.'
      : "Your week is already balanced — there's nothing for me to improve here.",
  };

  const semMudanca = proposta.mudancas.length === 0;

  const dias = (ds: number[]) => ds.map(d => weekdayShort(d, language)).join(' · ');

  return (
    <ModalSheet open={open} title={t.titulo} onClose={onClose} language={language}>
      {semMudanca ? (
        <>
          <p style={{ ...sm2Hint, fontSize: 'var(--sm2-text-sm)', margin: 0 }}>{t.semMudanca}</p>
          <button type="button" style={{ ...sm2Button('outline', false, 'sm'), alignSelf: 'flex-start' }} onClick={onClose}>
            {isPt ? 'Entendi' : 'Got it'}
          </button>
        </>
      ) : (
        <>
          <p style={{ ...sm2Text, margin: 0 }}>{t.intro}</p>

          <Semana contagem={proposta.antes} teto={teto} language={language} titulo={t.antes} proposta={false} />
          <Semana contagem={proposta.depois} teto={teto} language={language} titulo={t.depois} proposta />

          {/* A lista nominal do que muda: "confie em mim" não é confirmação
              informada. Quem aceita precisa poder ver o que aceitou. */}
          <div>
            <p style={{ ...sm2Label, marginBottom: 8, letterSpacing: '.06em', textTransform: 'uppercase' }}>{t.oQueMuda}</p>
            <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {proposta.mudancas.map(m => (
                <li key={m.id} style={sm2Hint}>
                  <span>{nomePorId.get(m.id) ?? m.id}</span>
                  <span>{`: ${dias(diasPorId.get(m.id) ?? [])} → ${dias(m.days)}`}</span>
                </li>
              ))}
            </ul>
          </div>

          <InfoTip language={language} label={isPt ? 'Sobre a frequência dos hábitos' : 'About habit frequency'} align="left" style={{ minHeight: 24, justifyContent: 'flex-start' }}>{t.mesmaFrequencia}</InfoTip>

          {/* Honestidade quando não cabe — em `muted`, não em vermelho: é
              informação, e a proposta continua sendo a melhor possível. */}
          {!proposta.cabe && (
            <p role="status" style={{ ...sm2Hint, margin: 0 }}>
              {t.naoCabe}
            </p>
          )}

          {/* "Not now" com o MESMO peso de "Go ahead" (D-A5, 02 §36: saída de
              primeira classe) — os dois `outline`: a folha mostra, não decide. */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={{ ...sm2Button('outline'), flex: 1 }} onClick={onClose}>
              {t.agoraNao}
            </button>
            <button
              type="button"
              style={{ ...sm2Button('outline'), flex: 1 }}
              onClick={() => { onAplicar(proposta.mudancas); onClose(); }}
            >
              {t.aplicar}
            </button>
          </div>
        </>
      )}
    </ModalSheet>
  );
}

export default BalanceWeekModal;
