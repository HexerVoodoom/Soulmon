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
import { sm2Button, sm2Hint } from './form/FormKit';
import { DREAM_ART } from '../utils/dreamArt';
import { RitualDialog, RitualGlass, ritualLabel } from './ritual/RitualKit';

export interface MorningDreamProps {
  open: boolean;
  /** O sonho da noite. `null` = a manhã chega sem cena, e isso não é falha. */
  dream: Dream | null;
  /** Primeira vez que esta cena entra no Dex. */
  isNew: boolean;
  language: Language;
  onClose: () => void;
}

function rarityLabel(rarity: DreamRarity, isPt: boolean): string {
  if (rarity === 'legendary') return isPt ? 'Lendário' : 'Legendary';
  if (rarity === 'rare') return isPt ? 'Raro' : 'Rare';
  return isPt ? 'Comum' : 'Common';
}

export function MorningDream({ open, dream, isNew, language, onClose }: MorningDreamProps) {
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
      ? 'Seu Soulmon acordou primeiro e ficou esperando você. Hoje não veio nenhuma cena da noite — e está tudo bem.'
      : 'Your Soulmon woke up first and waited for you. No scene came back from the night today — and that’s okay.');

  const art = dream ? DREAM_ART[dream.id] : undefined;
  const centered = { ...sm2Hint, textAlign: 'center' as const };

  return (
    /* Trap + Escape + devolução de foco vêm do `RitualDialog` (`useDialogA11y`).
       O Escape daqui funcionava POR ACIDENTE: o handler estava na div do véu,
       que não é focável, e só recebia a tecla pelo `autoFocus` do botão. */
    <RitualDialog label={headline} onClose={onClose} maxWidth={320} closeLabel={isPt ? 'Fechar' : 'Close'}>
      <p style={{ ...centered, margin: '0 36px' }}>{headline}</p>

      {/* A cena do sonho (utils/dreamArt.ts) a 1× num vidro 128². O emoji fica
          como saída só para um sonho novo entrar no catálogo antes de a arte
          dele existir — conteúdo, não pixel: fora do vidro. Sem sonho, o sol. */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {dream && art
          ? (
            <RitualGlass width={128}>
              <img src={art} alt="" width={96} height={96} style={{ width: 96, height: 96, display: 'block' }} />
            </RitualGlass>
          )
          : dream
            ? <span aria-hidden="true" style={{ fontSize: 56, lineHeight: 1.1 }}>{dream.emoji}</span>
            : <Icon name="wb_sunny" size={48} tone="gold" />}
      </div>

      {dream && (
        <>
          <p style={{
            fontFamily: 'var(--sm2-font-display)', fontWeight: 600, fontSize: 'var(--sm2-text-md)',
            lineHeight: 'var(--sm2-leading-title)', color: 'var(--sm2-ink)', margin: 0, textAlign: 'center',
          }}>
            {label}
          </p>
          {/* Raridade sem cor por tier e sem duração (2e): é rótulo, não nota. */}
          <p style={{ ...ritualLabel, textAlign: 'center' }}>
            {rarityLabel(dream.rarity, isPt)}
            {isNew && <b style={{ color: 'var(--sm2-gold-ink)', fontWeight: 600 }}>{isPt ? ' · Novo!' : ' · New!'}</b>}
          </p>
        </>
      )}

      <p style={centered}>{line}</p>

      {dream && isNew && (
        <p style={centered}>
          {isPt ? 'Cena nova na coleção de sonhos.' : 'New scene in the dream collection.'}
        </p>
      )}

      <div style={{ paddingTop: 4 }}>
        <button type="button" onClick={onClose} style={{ ...sm2Button('primary'), width: '100%' }}>
          {isPt ? 'Bom dia!' : 'Good morning!'}
        </button>
      </div>
    </RitualDialog>
  );
}

export default MorningDream;
