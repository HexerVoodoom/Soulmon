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
 *
 * CANVAS PET (identidade, D-P8, 20/09/2026): **o texto em 1ª pessoa é o
 * CONTEÚDO do card, em Rubik 14 `ink`** — não metadado em 12 `muted`, que
 * era como o código o tratava. Título 14/500, data 12 `muted` `tabular` à
 * direita, e a arte 96² a 48 num **vidro 48² sem anel** (`MiniGlass`, a
 * mesma peça da aventura do relatório, D-R3) — antes era um `<img 24>`
 * solto no `li`. Vazio = card com título, tese e promessa; nenhum slot,
 * silhueta ou "0 of 24".
 */
import type { CSSProperties } from 'react';
// `findAnyById` resolve também os postais das regiões do Passeio (`trv-*`,
// 30/09/2026) — o MESMO diário, sem silhueta, contagem nem raridade (R-12/R-13).
import { findAnyById } from '../utils/travessias';
import { ADVENTURE_ART } from '../utils/adventureArt';
import { sm2Hint, sm2Text, SM2_SHADOW_CARD } from './form/FormKit';
import { MiniGlass } from './ui/MiniGlass';
import { InfoTip } from './ui/InfoTip';
import { dayKeyLabel } from '../utils/dayKeyLabel';
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

export function AdventureDiary({ entries, language }: AdventureDiaryProps) {
  const isPt = language === 'pt-BR';
  // Do mais recente para o mais antigo, sem mutar a lista do save.
  const linhas = [...entries].reverse()
    .map(e => ({ e, achado: findAnyById(e.id) }))
    // Id órfão (achado removido numa versão futura) some da lista em vez de
    // derrubar a tela de quem já o tinha.
    .filter((l): l is { e: { id: string; day: string }; achado: NonNullable<ReturnType<typeof findAnyById>> } => !!l.achado);

  return (
    <section style={card} aria-labelledby="sm2-diario-title">
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
      <h2
        id="sm2-diario-title"
        style={{
          fontFamily: 'var(--sm2-font-display)', fontSize: 'var(--sm2-text-md)',
          fontWeight: 600, lineHeight: 'var(--sm2-leading-title)',
          color: 'var(--sm2-ink)', margin: 0, flex: 1, minWidth: 0,
        }}
      >
        {isPt ? 'Diário de aventuras' : 'Adventure diary'}
      </h2>
      {/* K6 (04/10/2026): a legenda do diário mora atrás do "?". */}
      <InfoTip language={language} label={isPt ? 'Sobre o diário de aventuras' : 'About the adventure diary'} align="right" style={{ minHeight: 24 }}>
        {isPt
          ? 'O que ele trouxe de cada dia lá fora.'
          : 'What it brought back from each day out there.'}
      </InfoTip>
      </div>

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
            <li key={e.id} data-adventure={achado.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {/* A arte 96² a 48 num vidro 48² sem anel (D-P8/D-R3). Emoji só
                  quando não há arte (ver `utils/adventureArt.ts`: a cobertura é
                  parcial de propósito) — e mesmo assim dentro do vidro, para a
                  coluna de texto alinhar entre as linhas. */}
              <MiniGlass size={48}>
                {ADVENTURE_ART[achado.id]
                  ? <img src={ADVENTURE_ART[achado.id]} alt="" width={48} height={48}
                         style={{ display: 'block', imageRendering: 'pixelated' }} />
                  : <span aria-hidden style={{ fontSize: 24, lineHeight: 1 }}>{achado.emoji}</span>}
              </MiniGlass>
              <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <p style={{ ...sm2Text, fontWeight: 500, margin: 0 }}>
                    {isPt ? achado.titlePt : achado.titleEn}
                  </p>
                  {/* A data é o que faz isto ser história e não lista: "esse foi
                      na primeira semana". */}
                  <span className="sm2-num" data-adventure-date style={{ ...sm2Hint, flexShrink: 0 }}>
                    {dayKeyLabel(e.day, isPt)}
                  </span>
                </div>
                {/* A voz da criatura é o CONTEÚDO: Rubik 14 `ink` (D-P8). */}
                <p data-adventure-text style={{ ...sm2Text, margin: 0 }}>
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
