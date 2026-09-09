/**
 * O DIÁRIO DE AVENTURAS — o que a criatura trouxe, noite após noite.
 *
 * Mora ao lado do Dex de Sonhos, na página do pet, pelo MESMO motivo escrito
 * lá: é coleção DELE, não métrica sua. Numa tela de estatísticas isto viraria
 * um painel de desempenho, que é exatamente a leitura que o plano manda evitar.
 *
 * O QUE ESTA TELA NÃO FAZ, e é o desenho inteiro:
 *
 * - **Não mostra o que falta.** O Dex de Sonhos mostra silhuetas do não
 *   coletado porque lá a coleção É o jogo. Aqui não: um diário com lacunas
 *   visíveis vira lista de pendências, e o app tem uma regra escrita contra
 *   painel de pendências (`docs/PLANO-TAREFAS.md` — "painel de pendências é o
 *   Habitica: a pessoa abre o app e encontra uma fatura"). O que ela viu, ela
 *   viu; o que não viu ainda não existe para ela.
 * - **Não mostra raridade.** Rotular o achado de ontem como "comum" é dizer à
 *   pessoa que a noite dela valeu pouco.
 * - **Não conta nada nem premia.** Sem porcentagem, sem barra de progresso,
 *   sem Bits. A recompensa é a cena.
 *
 * O mais recente primeiro: o diário é lido para reencontrar ontem, não para
 * auditar o mês.
 */
import type { CSSProperties } from 'react';
import { findById } from '../utils/adventure';
import { ADVENTURE_ART } from '../utils/adventureArt';
import { sm2Hint, sm2Text, SM2_SHADOW_CARD } from './form/FormKit';
import type { Language } from '../utils/i18n';

interface AdventureDiaryProps {
  /** `{ id, day }` — o diário do save, em ordem de coleta. */
  entries: ReadonlyArray<{ id: string; day: string }>;
  language: Language;
}

const card: CSSProperties = {
  backgroundColor: 'var(--sm2-surface)',
  border: '1px solid var(--sm2-line)',
  borderRadius: 12,
  boxShadow: SM2_SHADOW_CARD,
  padding: 16,
};

/**
 * `day` é um `dayKey` do jogador — pode ser ISO (`2026-09-08`) ou o
 * `toDateString()` (`Tue Sep 08 2026`), porque as duas formas circulam no save.
 *
 * ⚠️ O ISO é montado NA MÃO, e não com `new Date(day)`: a string `AAAA-MM-DD`
 * é interpretada pelo JS como **meia-noite UTC**, então em qualquer fuso
 * negativo (o Brasil inteiro) ela vira o dia ANTERIOR na hora de exibir. O
 * diário mostraria 07/09 para um achado do dia 08. Um teste pegou isto.
 */
function dataCurta(day: string, isPt: boolean): string {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (iso) {
    const [, ano, mes, dia] = iso;
    if (isPt) return `${dia}/${mes}`;
    const meses = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${meses[Number(mes) - 1]} ${Number(dia)}`;
  }
  const d = new Date(day);
  if (Number.isNaN(d.getTime())) return day;
  return isPt
    ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function AdventureDiary({ entries, language }: AdventureDiaryProps) {
  const isPt = language === 'pt-BR';
  // Do mais recente para o mais antigo, sem mutar a lista do save.
  const linhas = [...entries].reverse()
    .map(e => ({ e, achado: findById(e.id) }))
    // Id órfão (achado removido numa versão futura) some da lista em vez de
    // derrubar a tela de quem já o tinha.
    .filter((l): l is { e: { id: string; day: string }; achado: NonNullable<ReturnType<typeof findById>> } => !!l.achado);

  return (
    <section style={card} aria-labelledby="sm2-diario-title">
      <h2
        id="sm2-diario-title"
        style={{
          fontFamily: 'var(--sm2-font-display)', fontSize: 'var(--sm2-text-md)',
          fontWeight: 600, lineHeight: 'var(--sm2-leading-title)',
          color: 'var(--sm2-ink)', margin: '0 0 4px',
        }}
      >
        {isPt ? 'Diário de aventuras' : 'Adventure diary'}
      </h2>
      <p style={{ ...sm2Hint, marginBottom: 14 }}>
        {isPt
          ? 'O que ele trouxe de cada dia lá fora.'
          : 'What it brought back from each day out there.'}
      </p>

      {linhas.length === 0 ? (
        // O vazio é uma promessa, não uma falta: nada de "0 de 24".
        <p style={sm2Hint}>
          {isPt
            ? 'Ainda não há nada aqui. Ele conta o que viu no relatório do fim do dia.'
            : "Nothing here yet. It tells you what it saw in the end-of-day report."}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {linhas.map(({ e, achado }) => (
            <li key={e.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {/* Arte pixel quando existe, emoji quando não (ver
                  `utils/adventureArt.ts`: a cobertura é parcial de propósito). */}
              {ADVENTURE_ART[achado.id]
                ? <img src={ADVENTURE_ART[achado.id]} alt="" width={24} height={24}
                       style={{ objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} />
                : <span aria-hidden style={{ fontSize: 24, lineHeight: 1.2 }}>{achado.emoji}</span>}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <p style={{ ...sm2Text, fontWeight: 500, margin: 0 }}>
                    {isPt ? achado.titlePt : achado.titleEn}
                  </p>
                  {/* A data é o que faz isto ser história e não lista: "esse foi
                      na primeira semana". */}
                  <span className="sm2-num" style={{ ...sm2Hint, flexShrink: 0 }}>
                    {dataCurta(e.day, isPt)}
                  </span>
                </div>
                <p style={{ ...sm2Hint, margin: '2px 0 0' }}>
                  {isPt ? achado.textPt : achado.textEn}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
