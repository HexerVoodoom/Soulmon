/**
 * O SONHO DA MANHÃ — a revelação.
 *
 * O ÚNICO feedback desta mecânica, e ele é de MANHÃ (restWindow.ts, regra 4):
 * a ortossonia é ansiedade ANTES de dormir, então nada aqui aparece à noite e
 * nada aqui é notificação noturna de desempenho.
 *
 * Componente puro: recebe o sonho já sorteado (`rollDream` + `collectDream`
 * rodam no App), não lê GameState nem localStorage, não decide nada.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * NÃO EXISTE PERDA NESTA MECÂNICA
 * ───────────────────────────────────────────────────────────────────────────
 * Nenhuma variante desta tela julga a noite. Não há "você dormiu tarde", não
 * há "sua regularidade caiu", não há score, não há duração, não há nota. Uma
 * noite fora da janela devolve **alguma coisa boa ou nada** — jamais uma
 * cobrança. Com `dream === null` a tela é um bom-dia carinhoso e neutro, e é
 * de propósito: quem passou uma noite ruim é exatamente quem menos aguenta
 * abrir o app e encontrar uma fatura.
 */
import type { Dream, DreamRarity } from '../utils/restWindow';
import type { Language } from '../utils/i18n';
import { Icon } from './ui/Icon';
import { useDialogA11y } from '../hooks/useDialogA11y';

export interface MorningDreamProps {
  open: boolean;
  /** O sonho da noite. `null` = a manhã chega sem cena, e isso não é falha. */
  dream: Dream | null;
  /** Primeira vez que esta cena entra no Dex. */
  isNew: boolean;
  language: Language;
  onClose: () => void;
}

/**
 * A raridade aparece como TEXTO, então precisa dos tokens com par por tema:
 * `--sm-px-cyan` media 1,40:1 sobre a superfície clara e `--sm-px-copper`
 * 3,05:1 — o rótulo "Raro" era praticamente invisível no tema claro, que é o
 * padrão de quem abre o app de manhã.
 */
const RARITY_TONE: Record<DreamRarity, string> = {
  common: 'var(--sm-muted)',
  rare: 'var(--sm-px-cyan-ink)',
  legendary: 'var(--sm-px-copper-ink)',
};

function rarityLabel(rarity: DreamRarity, isPt: boolean): string {
  if (rarity === 'legendary') return isPt ? 'Lendário' : 'Legendary';
  if (rarity === 'rare') return isPt ? 'Raro' : 'Rare';
  return isPt ? 'Comum' : 'Common';
}

export function MorningDream({ open, dream, isNew, language, onClose }: MorningDreamProps) {
  // Trap + Escape + devolução de foco (`hooks/useDialogA11y.ts`). O Escape
  // daqui funcionava POR ACIDENTE: o handler estava na div do véu, que não é
  // focável, e só recebia a tecla porque o `autoFocus` do botão OK fazia o
  // evento borbulhar até lá. Um Tab do usuário já matava o acidente.
  // Chamado ANTES do `return null` — hook depois de retorno condicional quebra
  // a ordem dos hooks.
  const dialogRef = useDialogA11y<HTMLDivElement>(open, onClose);

  if (!open) return null;

  const isPt = language === 'pt-BR';
  const label = dream ? (isPt ? dream.labelPt : dream.labelEn) : null;

  const headline = dream
    ? (isPt ? 'Bom dia! Seu Soulmon sonhou...' : 'Good morning! Your Soulmon dreamed...')
    : (isPt ? 'Bom dia!' : 'Good morning!');

  // A linha do que o pet sonhou. Descritiva e curta — nunca avaliativa.
  const line = dream && label
    ? (isPt
      ? `Seu Soulmon passou a noite ${label.charAt(0).toLowerCase()}${label.slice(1)}.`
      : `Your Soulmon spent the night ${label.charAt(0).toLowerCase()}${label.slice(1)}.`)
    : (isPt
      ? 'Seu Soulmon acordou primeiro e ficou esperando você. Hoje ele não trouxe nenhuma cena da noite — e está tudo bem.'
      : 'Your Soulmon woke up first and waited for you. No scene came back from the night today — and that’s okay.');

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(6, 24, 26, 0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={headline}
        className="sm-px-card"
        style={{ width: '100%', maxWidth: 320, position: 'relative', padding: '26px 20px 20px', textAlign: 'center' }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={isPt ? 'Fechar' : 'Close'}
          /* 44x44 de alvo de toque (WCAG 2.2 AA 2.5.8), ícone pelado dentro —
             ícone NUNCA dentro de box (regra visual do dono). */
          style={{
            position: 'absolute', top: 4, right: 4, width: 44, height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          {/* CHROME da cena, não conteúdo do visor: o fechar é interface e
              fala Material Symbols, não pixel. */}
          <Icon name="close" size={22} tone="muted" />
        </button>

        <p style={{ fontSize: '0.76rem', color: 'var(--sm-muted)', margin: '0 0 10px' }}>
          {headline}
        </p>

        <div aria-hidden="true" style={{ fontSize: 56, lineHeight: 1.1, margin: '0 0 8px' }}>
          {dream ? dream.emoji : '🌅'}
        </div>

        {dream && (
          <>
            <p className="sm-display" style={{ fontSize: '0.98rem', margin: '0 0 6px', color: 'var(--sm-ink)' }}>
              {label}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: RARITY_TONE[dream.rarity] }}>
                {rarityLabel(dream.rarity, isPt)}
              </span>
              {isNew && (
                <span style={{ fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--sm-px-cyan-ink)', fontWeight: 800 }}>
                  {isPt ? '· Novo!' : '· New!'}
                </span>
              )}
            </div>
          </>
        )}

        <p style={{ fontSize: '0.8rem', color: 'var(--sm-muted)', lineHeight: 1.5, margin: '0 0 6px' }}>
          {line}
        </p>

        {dream && isNew && (
          <p style={{ fontSize: '0.75rem', color: 'var(--sm-muted)', lineHeight: 1.45, margin: '0 0 6px' }}>
            {isPt ? 'Cena nova na coleção de sonhos.' : 'New scene in the dream collection.'}
          </p>
        )}

        <div style={{ paddingTop: 12 }}>
          <button autoFocus onClick={onClose} className="sm-btn" style={{ width: '100%' }}>
            {isPt ? 'Bom dia!' : 'Good morning!'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MorningDream;
