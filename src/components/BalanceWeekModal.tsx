import { useMemo } from 'react';
import type { Language } from '../utils/i18n';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from './form/FormKit';
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

/** Uma barrinha por dia — a leitura tem que ser instantânea, sem números. */
function Semana({
  contagem, teto, language, titulo,
}: { contagem: number[]; teto: number; language: Language; titulo: string }) {
  const pico = Math.max(...contagem, teto, 1);
  return (
    <div>
      <p style={{ ...sm2Hint, margin: '0 0 6px' }}>{titulo}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, alignItems: 'end' }}>
        {WEEKDAY_INDEXES.map(dia => {
          const n = contagem[dia] ?? 0;
          const acima = n > teto;
          return (
            <div key={dia} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div
                // O número vai no `aria-label` porque a barra é a leitura
                // rápida e o leitor de tela precisa do dado, não da altura.
                role="img"
                aria-label={`${weekdayFull(dia, language)}: ${n}`}
                style={{
                  width: '100%',
                  height: Math.max(4, Math.round((n / pico) * 56)),
                  borderRadius: 4,
                  backgroundColor: acima ? 'var(--sm2-danger-ink)' : 'var(--sm2-primary-fill)',
                  opacity: n === 0 ? 0.25 : 1,
                }}
              />
              <span style={{ ...sm2Hint, margin: 0 }}>{weekdayShort(dia, language)}</span>
            </div>
          );
        })}
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

  return (
    <ModalSheet open={open} title={t.titulo} onClose={onClose} language={language}>
      {semMudanca ? (
        <p style={{ ...sm2Text, margin: 0 }}>{t.semMudanca}</p>
      ) : (
        <>
          <p style={{ ...sm2Text, margin: '0 0 18px' }}>{t.intro}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Semana contagem={proposta.antes} teto={teto} language={language} titulo={t.antes} />
            <Semana contagem={proposta.depois} teto={teto} language={language} titulo={t.depois} />
          </div>

          <p style={{ ...sm2Hint, margin: '18px 0 0' }}>{t.mesmaFrequencia}</p>

          {!proposta.cabe && (
            <p role="status" style={{ ...sm2Hint, color: 'var(--sm2-danger-ink)', margin: '10px 0 0' }}>
              {t.naoCabe}
            </p>
          )}

          {/* A lista nominal do que muda: "confie em mim" não é confirmação
              informada. Quem aceita precisa poder ver o que aceitou. */}
          <p style={{ ...sm2Hint, margin: '18px 0 6px' }}>{t.oQueMuda}</p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {proposta.mudancas.map(m => (
              <li key={m.id} style={{ ...sm2Text, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span>{nomePorId.get(m.id) ?? m.id}</span>
                <span style={{ color: 'var(--sm2-muted)' }}>
                  {m.days.map(d => weekdayShort(d, language)).join(' · ')}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
        {!semMudanca && (
          <button
            type="button"
            style={{ ...sm2Button('primary'), width: '100%' }}
            onClick={() => { onAplicar(proposta.mudancas); onClose(); }}
          >
            {t.aplicar}
          </button>
        )}
        {/* "Agora não" é ação de primeira classe, e não um X no canto: recusar
            uma sugestão tem que ser tão fácil quanto aceitá-la. */}
        <button type="button" style={{ ...sm2Button('outline'), width: '100%' }} onClick={onClose}>
          {semMudanca ? (isPt ? 'Entendi' : 'Got it') : t.agoraNao}
        </button>
      </div>
    </ModalSheet>
  );
}

export default BalanceWeekModal;
