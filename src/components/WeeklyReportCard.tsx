/**
 * RELATÓRIO SEMANAL — o ritual de domingo
 * =======================================
 *
 * Parte 2.4 do `docs/PLANO-TAREFAS.md`. O `DailyReportModal` continua sendo o
 * ritual da NOITE e tem dono próprio; este cartão é a leitura da SEMANA e por
 * isso vive fora dele: um bloco discreto no topo da lista, nunca um modal que
 * tranca a tela. Domingo é o dia em que o app tem mais chance de ser fechado
 * sem ler — um relatório que bloqueia é o relatório que ensina a fechar.
 *
 * Tudo aqui é DESCRIÇÃO, nunca veredito (é a regra de `utils/rituals.ts`):
 * constância por hábito, esforço concluído, categoria dominante, sonhos
 * colecionados e — só quando os dados bastarem — uma sugestão de habit
 * stacking. Nenhum número deste cartão pode diminuir por castigo.
 *
 * CANVAS RITUAIS (`SemanaCartao`/`SemanaSemSugestao`, RIT-18/19; DECISÕES §7
 * R5/S2/S7, §21): cartão SIS-03 no slot da Home — "YOUR WEEK" em `ink`, a
 * frase-tese 12 `muted`, cada hábito com UMA anatomia: `event_repeat` 20 +
 * nome 14 + a janela de 7 (léxico A2, `ConstancyWindow`) + "N of M" só com
 * N ≥ 1; a linha de tarefas/esforço some com `tasksDone === 0` e usa plural
 * real (sem "(s)"); `nightlight` 20 + "N dreams collected"; sugestão com
 * filete 3px `primary-ink`; "Close" `quiet sm` 44. Pixel nenhum: o
 * `PixelPanel`/`PixelButton` saíram (achado 16).
 *
 * Textos em EN com par PT-BR, como todo texto de UI do app.
 */
import type { CSSProperties } from 'react';
import type { WeeklyReport } from '../utils/rituals';
import type { HabitRhythm } from '../utils/habitRhythm';
import type { Language } from '../utils/i18n';
import { categoryLabel } from '../types/category-icons';
import type { ActivityCategory } from '../types/attributes';
import { Icon } from './ui/Icon';
import { sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { ConstancyWindow } from './HabitConstancy';
import { ritualLabel } from './ritual/RitualKit';

export interface WeeklyReportCardProps {
  report: WeeklyReport;
  /** Sugestão de âncora (`stackingSuggestion`), ou `null` sem dados bastantes. */
  suggestion: string | null;
  language: Language;
  onDismiss: () => void;
  /** Os ritmos, para a janela de 7 de cada hábito (a mesma da lista). Sem
   *  eles a linha fica só com o nome — nunca uma janela inventada. */
  rhythms?: Record<string, HabitRhythm>;
  /** "Agora" — o fim da janela. Padrão: `new Date()`. */
  now?: Date;
}

export function WeeklyReportCard({ report, suggestion, language, onDismiss, rhythms, now }: WeeklyReportCardProps) {
  const isPt = language === 'pt-BR';
  const agora = now ?? new Date();

  // Hábito sem nenhum dia devido na janela sai da lista: uma linha "0 de 0" não
  // descreve nada e só faria o cartão parecer uma cobrança vazia.
  const lines = report.perHabit.filter(l => l.window > 0);

  const muted: CSSProperties = sm2Hint;
  const body: CSSProperties = { ...sm2Text, margin: 0 };
  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  return (
    <section
      aria-label={isPt ? 'Sua semana' : 'Your week'}
      style={{
        backgroundColor: 'var(--sm2-surface)',
        border: '1px solid var(--sm2-line)',
        borderRadius: 'var(--sm2-radius-md)',
        boxSizing: 'border-box',
        padding: 12,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
      <p style={{ ...ritualLabel, color: 'var(--sm2-ink)' }}>{isPt ? 'SUA SEMANA' : 'YOUR WEEK'}</p>
      <p style={muted}>
        {isPt
          ? 'Uma leitura dos últimos sete dias. Nada aqui é nota — é só o que aconteceu.'
          : 'A read on the last seven days. None of this is a grade — it is just what happened.'}
      </p>

      {lines.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {lines.map(line => (
            <li key={line.id} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 32 }}>
              {/* Selo de TIPO (D-A2): `event_repeat` = hábito. O emoji do
                  usuário fica na lista; aqui a linha é leitura. */}
              <Icon name="event_repeat" size={20} tone="muted" />
              {/* `title`: o nome é cortado por reticências e não havia como ler
                  o resto — nem com o mouse, nem com o dedo. */}
              <span
                title={line.name}
                style={{ ...body, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {line.name}
                {line.id === report.bestHabitId && (
                  <span style={{ ...muted, marginLeft: 6 }}>
                    {isPt ? '· o mais constante' : '· most consistent'}
                  </span>
                )}
              </span>
              {rhythms?.[line.id] && (
                <ConstancyWindow rhythm={rhythms[line.id]} now={agora} language={language} />
              )}
              {/* R5 — "N of M" só com N ≥ 1: "0 of 4" é o mesmo zero que E5
                  vetou; a janela já conta a semana sem dígito. */}
              {line.done >= 1 && (
                <span className="sm2-num" style={muted}>
                  {isPt ? `${line.done} de ${line.window}` : `${line.done} of ${line.window}`}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* S2/S7 — some com `tasksDone === 0`; plural real, sem "(s)". */}
      {report.tasksDone > 0 && (
        <p className="sm2-num" style={body}>
          {isPt
            ? `${plural(report.tasksDone, 'tarefa concluída', 'tarefas concluídas')} · ${plural(report.effortDone, 'ponto de esforço', 'pontos de esforço')}`
            : `${plural(report.tasksDone, 'task done', 'tasks done')} · ${plural(report.effortDone, 'effort point', 'effort points')}`}
        </p>
      )}
      {report.dominantCategory && (
        <p style={muted}>
          {isPt ? 'Mais forte em: ' : 'Strongest in: '}
          {categoryLabel(report.dominantCategory as ActivityCategory, isPt)}
        </p>
      )}
      {/* `nightlight` = sonhos (o Someday/noite do sistema); decorativo — o
          texto ao lado já diz "sonhos". */}
      <p style={{ ...muted, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name="nightlight" size={20} tone="muted" />
        <span className="sm2-num">
          {isPt
            ? plural(report.dreams, 'sonho na coleção', 'sonhos na coleção')
            : plural(report.dreams, 'dream collected', 'dreams collected')}
        </span>
      </p>

      {/* A sugestão só aparece quando `stackingSuggestion` devolve alguma coisa:
          conselho inventado em cima de três registros queima a única parte do
          app que se apresenta como conselho. Filete 3px `primary-ink`, nunca
          outra moldura dentro do card. */}
      {suggestion && (
        <p style={{ ...body, padding: '2px 0 2px 12px', borderLeft: '3px solid var(--sm2-primary-ink)' }}>
          {suggestion}
        </p>
      )}

      <div>
        {/* "Close" em `quiet sm` 44: o cartão não é diálogo — fechar é sair
            sem peso (D-R7). */}
        <button type="button" onClick={onDismiss} style={{ ...sm2Button('quiet', false, 'sm'), minWidth: 120 }}>
          {isPt ? 'Fechar' : 'Close'}
        </button>
      </div>
    </section>
  );
}

export default WeeklyReportCard;
