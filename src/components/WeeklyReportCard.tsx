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
 * Textos em EN com par PT-BR, como todo texto de UI do app.
 */
import type { WeeklyReport } from '../utils/rituals';
import type { Language } from '../utils/i18n';
import { categoryLabel } from '../types/category-icons';
import type { ActivityCategory } from '../types/attributes';
import { PixelPanel, PixelMeter, PixelButton } from './pixel/PixelKit';

export interface WeeklyReportCardProps {
  report: WeeklyReport;
  /** Sugestão de âncora (`stackingSuggestion`), ou `null` sem dados bastantes. */
  suggestion: string | null;
  language: Language;
  onDismiss: () => void;
}

export function WeeklyReportCard({ report, suggestion, language, onDismiss }: WeeklyReportCardProps) {
  const isPt = language === 'pt-BR';

  // Hábito sem nenhum dia devido na janela sai da lista: uma linha "0 de 0" não
  // descreve nada e só faria o cartão parecer uma cobrança vazia.
  const lines = report.perHabit.filter(l => l.window > 0);

  const muted: React.CSSProperties = { fontSize: '0.72rem', color: 'var(--sm-muted)', lineHeight: 1.45 };

  return (
    <PixelPanel title={isPt ? 'SUA SEMANA' : 'YOUR WEEK'}>
      <p style={{ ...muted, margin: '0 0 12px' }}>
        {isPt
          ? 'Uma leitura dos últimos sete dias. Nada aqui é nota — é só o que aconteceu.'
          : 'A read on the last seven days. None of this is a grade — it is just what happened.'}
      </p>

      {lines.length > 0 && (
        <ul style={{ listStyle: 'none', margin: '0 0 12px', padding: 0, display: 'grid', gap: 8 }}>
          {lines.map(line => (
            <li key={line.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span aria-hidden="true" style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{line.emoji}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: '0.8rem', color: 'var(--sm-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {line.name}
                {line.id === report.bestHabitId && (
                  <span style={{ ...muted, marginLeft: 6 }}>
                    {isPt ? '· o mais constante' : '· most consistent'}
                  </span>
                )}
              </span>
              <span style={{ ...muted, fontVariantNumeric: 'tabular-nums' }}>
                {isPt ? `${line.done} de ${line.window}` : `${line.done} of ${line.window}`}
              </span>
              <PixelMeter
                ratio={line.ratio}
                tone={line.ratio >= 0.8 ? 'gold' : 'cyan'}
                height={12}
                label={isPt
                  ? `Constância de ${line.name}: ${line.done} de ${line.window}`
                  : `${line.name} consistency: ${line.done} of ${line.window}`}
                style={{ width: 64, flexShrink: 0 }}
              />
            </li>
          ))}
        </ul>
      )}

      <p style={{ fontSize: '0.8rem', color: 'var(--sm-ink)', lineHeight: 1.5, margin: '0 0 6px' }}>
        {isPt
          ? `${report.tasksDone} tarefa(s) concluída(s) · ${report.effortDone} ponto(s) de esforço`
          : `${report.tasksDone} task(s) done · ${report.effortDone} effort point(s)`}
      </p>
      {report.dominantCategory && (
        <p style={{ ...muted, margin: '0 0 6px' }}>
          {isPt ? 'Mais forte em: ' : 'Strongest in: '}
          {categoryLabel(report.dominantCategory as ActivityCategory, isPt)}
        </p>
      )}
      <p style={{ ...muted, margin: 0 }}>
        {isPt ? `🌙 ${report.dreams} sonho(s) na coleção` : `🌙 ${report.dreams} dream(s) collected`}
      </p>

      {/* A sugestão só aparece quando `stackingSuggestion` devolve alguma coisa:
          conselho inventado em cima de três registros queima a única parte do
          app que se apresenta como conselho. */}
      {suggestion && (
        <p
          style={{
            margin: '12px 0 0',
            padding: '8px 10px',
            fontSize: '0.8rem',
            lineHeight: 1.5,
            color: 'var(--sm-ink)',
            backgroundColor: 'var(--sm-surface)',
            border: '1px solid color-mix(in srgb, var(--sm-px-cyan) 45%, transparent)',
          }}
        >
          {suggestion}
        </p>
      )}

      <div style={{ marginTop: 14 }}>
        <PixelButton size="md" onClick={onDismiss}>
          {isPt ? 'Fechar' : 'Close'}
        </PixelButton>
      </div>
    </PixelPanel>
  );
}

export default WeeklyReportCard;
