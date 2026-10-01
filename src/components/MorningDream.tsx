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
import { RitualDialog, ritualLabel } from './ritual/RitualKit';

export interface MorningDreamProps {
  open: boolean;
  /** O sonho da noite. `null` = a manhã chega sem cena, e isso não é falha. */
  dream: Dream | null;
  /** Primeira vez que esta cena entra no Dex. */
  isNew: boolean;
  language: Language;
  onClose: () => void;
  /** F2 (dono, 01/10/2026): a decoração gêmea da cena, que o sonho DEU
   *  (`utils/dreamDecorTwin.ts`). Ausente = a cena não tem gêmeo. */
  decor?: { namePt: string; nameEn: string };
  /** "Equipar" ao lado do "Bom dia!" — existe SEMPRE que há `decor`; equipa
   *  na hora e fecha. Ausente = sem botão. */
  onEquip?: () => void;
}

function rarityLabel(rarity: DreamRarity, isPt: boolean): string {
  if (rarity === 'legendary') return isPt ? 'Lendário' : 'Legendary';
  if (rarity === 'rare') return isPt ? 'Raro' : 'Rare';
  return isPt ? 'Comum' : 'Common';
}

export function MorningDream({ open, dream, isNew, language, onClose, decor, onEquip }: MorningDreamProps) {
  if (!open) return null;

  const isPt = language === 'pt-BR';
  const label = dream ? (isPt ? dream.labelPt : dream.labelEn) : null;

  /* F2 (navegação do dono, 01/10/2026): a manchete diz o que a pessoa GANHOU.
     "Seu Soulmon sonhou..." lia como enfeite; a cena entra na coleção e isso
     tem de estar escrito, não subentendido. */
  const headline = dream
    ? (isNew
      ? (isPt ? 'Bom dia! Você ganhou uma cena de sonho' : 'Good morning! You got a new dream scene')
      : (isPt ? 'Bom dia! Seu Soulmon sonhou de novo com' : 'Good morning! Your Soulmon dreamed again of'))
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
    /* F2: cartão CLARO mesmo com o app no escuro (`theme="light"` redefine os
       tokens no próprio cartão) — prêmio de manhã não é tela de visor. */
    <RitualDialog label={headline} onClose={onClose} maxWidth={320} closeLabel={isPt ? 'Fechar' : 'Close'} theme="light">
      <p style={{ ...centered, margin: '0 36px', color: 'var(--sm2-ink)', fontWeight: 500 }}>{headline}</p>

      {/* A cena do sonho (utils/dreamArt.ts), DIRETO no cartão — o vidro com
          gradiente que a emoldurava saiu (F2). O emoji fica como saída só para
          um sonho novo entrar no catálogo antes de a arte dele existir. Sem
          sonho, o sol. */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {dream && art
          ? <img src={art} alt="" width={128} height={128} data-dream-art style={{ width: 128, height: 128, display: 'block', imageRendering: 'pixelated' }} />
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
          {isPt ? 'Ela já está guardada na sua coleção de sonhos.' : 'It is already saved in your dream collection.'}
        </p>
      )}

      {/* A decoração que veio com a cena (F2). "já está com você" vale para
          quem acabou de ganhar e para quem já tinha — o texto não depende de
          ler a posse de antes do sonho. */}
      {dream && decor && (
        <p style={centered} data-dream-decor>
          {isPt
            ? `Com ela veio a decoração ${decor.namePt} — já está com você.`
            : `The ${decor.nameEn} decoration came with it — it is already yours.`}
        </p>
      )}

      {/* "Equipar" AO LADO do "Bom dia!" (F2), sempre que a cena deu decoração. */}
      <div style={{ paddingTop: 4, display: 'flex', gap: 8 }}>
        {onEquip && (
          <button type="button" onClick={onEquip} data-dream-equip style={{ ...sm2Button('outline'), flex: 1, minWidth: 0 }}>
            {isPt ? 'Equipar' : 'Equip'}
          </button>
        )}
        <button type="button" onClick={onClose} style={{ ...sm2Button('primary'), flex: 1, minWidth: 0 }}>
          {isPt ? 'Bom dia!' : 'Good morning!'}
        </button>
      </div>
    </RitualDialog>
  );
}

export default MorningDream;
