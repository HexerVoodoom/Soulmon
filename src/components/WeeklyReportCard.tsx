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
import { PixelPanel, PixelButton } from './pixel/PixelKit';
import { Icon } from './ui/Icon';

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

  /** ONDA 2 — tokens da fundação; 0.75rem (12px) vira o token `xs`, o piso. */
  const muted: React.CSSProperties = {
    fontFamily: 'var(--sm2-font-text)',
    fontSize: 'var(--sm2-text-xs)',
    color: 'var(--sm2-muted)',
    lineHeight: 'var(--sm2-leading-body)',
  };
  const body: React.CSSProperties = {
    fontFamily: 'var(--sm2-font-text)',
    fontSize: 'var(--sm2-text-sm)',
    color: 'var(--sm2-ink)',
    lineHeight: 'var(--sm2-leading-body)',
  };

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
              <span aria-hidden="true" style={{ fontSize: 'var(--sm2-text-md)', width: 22, textAlign: 'center' }}>{line.emoji}</span>
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
              {/* A BARRINHA DE 64px SAIU. Ela e o "3 de 5" ao lado eram o mesmo
                  dado desenhado duas vezes na mesma linha — e a barra era a
                  versão imprecisa dos dois. O número fica (é o que a regra de
                  constância publica) e a linha volta a caber sem apertar o nome
                  do hábito, que era quem pagava a conta com reticências. */}
              <span className="sm2-num" style={muted}>
                {isPt ? `${line.done} de ${line.window}` : `${line.done} of ${line.window}`}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="sm2-num" style={{ ...body, margin: '0 0 6px' }}>
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
      {/* 🌙 era emoji marcando SEÇÃO — ícone de sistema disfarçado, não
          conteúdo escolhido por ninguém. Virou `bedtime`, decorativo (o texto
          ao lado já diz "sonhos"). O emoji do hábito, esse fica: é da pessoa. */}
      <p style={{ ...muted, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon name="bedtime" size={20} tone="muted" />
        <span className="sm2-num">
          {isPt ? `${report.dreams} sonho(s) na coleção` : `${report.dreams} dream(s) collected`}
        </span>
      </p>

      {/* A sugestão só aparece quando `stackingSuggestion` devolve alguma coisa:
          conselho inventado em cima de três registros queima a única parte do
          app que se apresenta como conselho. */}
      {suggestion && (
        <p
          style={{
            ...body,
            margin: '12px 0 0',
            // Caixa inteira → um fio de 3px na lateral. A sugestão continua
            // destacada do resto (é a única linha do cartão que aconselha) sem
            // virar mais uma moldura dentro do painel.
            padding: '2px 0 2px 10px',
            borderLeft: '3px solid var(--sm2-primary-fill)',
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
