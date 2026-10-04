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
import { useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { PET_BACKGROUNDS } from '../utils/backgrounds';
import { BackArrow } from './ui/BackArrow';
import { Icon } from './ui/Icon';
import { InfoTip, InfoTipSection } from './ui/InfoTip';
// `findAnyById` resolve também os postais das regiões do Passeio (`trv-*`,
// 30/09/2026) — o MESMO diário, sem silhueta, contagem nem raridade (R-12/R-13).
import { findAnyById } from '../utils/travessias';
import { ADVENTURE_ART } from '../utils/adventureArt';
import { sm2Hint, sm2Text, SM2_SHADOW_CARD } from './form/FormKit';
import { MiniGlass } from './ui/MiniGlass';
import { dayKeyLabel } from '../utils/dayKeyLabel';
import type { Language } from '../utils/i18n';

/**
 * RODADA 7 (I7, 04/10/2026): o diário abre em TELA CHEIA — o cenário do jogador
 * ao fundo, o Soulmon na cena e as historinhas por cima. No Laboratório fica só
 * a entrada (o card com o título); o "i" único mora no canto superior direito
 * do modal.
 */
interface AdventureDiaryProps {
  /** `{ id, day }` — o diário do save, em ordem de coleta. */
  entries: ReadonlyArray<{ id: string; day: string }>;
  language: Language;
  /** O sprite do Soulmon atual, para a cena do modal. */
  spriteUrl?: string;
  /** O cenário equipado (`PET_BACKGROUNDS`); sem ele, o Quarto. */
  sceneId?: string | null;
}

const card: CSSProperties = {
  backgroundColor: 'var(--sm2-surface)',
  border: '1px solid var(--sm2-line)',
  borderRadius: 12,
  boxShadow: SM2_SHADOW_CARD,
  padding: 16,
};

export function AdventureDiary({ entries, language, spriteUrl, sceneId }: AdventureDiaryProps) {
  const isPt = language === 'pt-BR';
  const [open, setOpen] = useState(false);
  const total = entries.filter(e => !!findAnyById(e.id)).length;

  return (
    <>
      <section style={card} aria-labelledby="sm2-diario-title">
        <button
          type="button"
          data-adventure-open
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          style={{
            width: '100%', minHeight: 44, display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left',
          }}
        >
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
          {total > 0 && <span className="sm2-num" style={sm2Hint}>{total}</span>}
          <Icon name="chevron_right" size={24} tone="muted" />
        </button>
      </section>
      {open && createPortal(
        <DiaryScreen entries={entries} language={language} spriteUrl={spriteUrl} sceneId={sceneId} onClose={() => setOpen(false)} />,
        document.body,
      )}
    </>
  );
}

function DiaryScreen({ entries, language, spriteUrl, sceneId, onClose }: AdventureDiaryProps & { onClose: () => void }) {
  const isPt = language === 'pt-BR';
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onClose);
  const bg = PET_BACKGROUNDS[sceneId ?? ''] ?? PET_BACKGROUNDS['bg-room'];
  // Do mais recente para o mais antigo, sem mutar a lista do save.
  const linhas = [...entries].reverse()
    .map(e => ({ e, achado: findAnyById(e.id) }))
    // Id órfão (achado removido numa versão futura) some da lista em vez de
    // derrubar a tela de quem já o tinha.
    .filter((l): l is { e: { id: string; day: string }; achado: NonNullable<ReturnType<typeof findAnyById>> } => !!l.achado);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={isPt ? 'Diário de aventuras' : 'Adventure diary'}
      data-adventure-screen
      className="sm2-sheet-fade"
      style={{
        position: 'fixed', inset: 0, zIndex: 120, display: 'flex', flexDirection: 'column',
        backgroundColor: bg?.baseColor ?? '#031716',
        backgroundImage: bg?.css, backgroundSize: 'cover', backgroundPosition: 'center bottom',
      }}
    >
      {/* Cabeçalho: fechar à esquerda, o "i" ÚNICO à direita (I2). */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px 0 12px', flexShrink: 0 }}>
        <BackArrow icon="close" onClick={onClose} language={language} style={{ margin: 0 }} />
        <span style={{ flex: 1 }} />
        <InfoTip language={language} label={isPt ? 'Sobre o diário de aventuras' : 'About the adventure diary'} align="right">
          <InfoTipSection title={isPt ? 'O diário' : 'The diary'} last>
            {isPt
              ? 'O que ele trouxe de cada dia lá fora.'
              : 'What it brought back from each day out there.'}
          </InfoTipSection>
        </InfoTip>
      </div>

      {/* A cena: o Soulmon em pé no cenário. */}
      <div style={{ flex: '0 0 auto', minHeight: 150, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 8 }}>
        {spriteUrl && (
          <img data-adventure-pet src={spriteUrl} alt="" aria-hidden="true" width={128} height={128}
               style={{ display: 'block', imageRendering: 'pixelated', width: 128, height: 128, objectFit: 'contain' }} />
        )}
      </div>

      {/* A historinha: um painel rolável por cima do chão do cenário. */}
      <div
        style={{
          flex: 1, minHeight: 0, overflowY: 'auto',
          backgroundColor: 'color-mix(in srgb, var(--sm2-surface) 88%, transparent)',
          borderTop: '1px solid var(--sm2-line)', borderRadius: '20px 20px 0 0',
          padding: '16px 16px calc(16px + env(safe-area-inset-bottom, 0px))',
          maxWidth: 560, width: '100%', boxSizing: 'border-box', alignSelf: 'center',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--sm2-font-display)', fontSize: 'var(--sm2-text-md)',
            fontWeight: 600, lineHeight: 'var(--sm2-leading-title)',
            color: 'var(--sm2-ink)', margin: '0 0 10px',
          }}
        >
          {isPt ? 'Diário de aventuras' : 'Adventure diary'}
        </h2>
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
      </div>
    </div>
  );
}
