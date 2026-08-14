/**
 * HUD do topo da Home (Ref C): marca à esquerda, medidores à direita.
 *
 * **Guardrail das três moedas** (`src/utils/currencies.ts`, e há teste
 * travando): a referência rotula a cápsula da direita como "SOUL CRYSTAL".
 * Aqui ela é rotulada **CREDITS / CRÉDITOS**, que é o nome real da moeda de
 * dinheiro real, e usa o `icon-gem` — o MESMO ícone que o menu já usa para
 * Créditos, e só ele. Bits não aparecem neste HUD; quando aparecerem, será
 * sem ícone e com a fonte de calculadora (`bitsStyle`). Um rótulo de fantasia
 * ("SOUL CRYSTAL") sobre uma moeda paga é exatamente como Bits e Créditos
 * viraram a mesma coisa aos olhos do jogador da última vez.
 */
import { PixelChip, PixelSegmentedBar } from './PixelKit';
import type { Language } from '../../utils/i18n';
import iconFlame from '../../assets/soulmon/icons/icon-flame.png';
import iconGem from '../../assets/soulmon/icons/icon-gem.png';

interface HomeHudProps {
  energyPoints: number;
  maxEnergyPoints: number;
  credits: number;
  language?: Language;
  /** Abre o modal de Créditos — a cápsula é clicável, não é enfeite. */
  onOpenCredits?: () => void;
}

export function HomeHud({ energyPoints, maxEnergyPoints, credits, language = 'en-US', onOpenCredits }: HomeHudProps) {
  const isPt = language === 'pt-BR';
  return (
    <div className="flex items-center justify-between gap-3">
      {/* `minWidth: 0` para a marca poder encolher em vez de vazar por baixo
          das cápsulas num flex row (o padrão é `min-width: auto`). */}
      <div className="flex items-center gap-2" style={{ minWidth: 0 }}>
        <img
          src={iconFlame}
          alt=""
          width={26}
          height={26}
          style={{ objectFit: 'contain', imageRendering: 'pixelated' }}
        />
        {/* A MARCA é o lugar mais óbvio da fonte bitmap: duas palavras, sem
            acento, caixa alta por definição. */}
        <span
          className="sm-px-font"
          style={{
            /* 11px, não 14: a Silkscreen é MUITO mais larga que a sans no
               mesmo corpo, e a 14 a marca invadia a cápsula de Energia
               (medido: "SOUL MON" saía cortado em "SOUL MO"). */
            fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
            textTransform: 'uppercase', color: 'var(--sm-primary)',
            whiteSpace: 'nowrap', lineHeight: 1.4,
          }}
        >
          Soul Mon
        </span>
      </div>

      <div className="flex items-center gap-2">
        <PixelChip
          label={isPt ? 'Energia' : 'Energy'}
          icon={iconFlame}
          title={isPt
            ? `Energia: ${energyPoints}/${maxEnergyPoints} — sobe comendo`
            : `Energy: ${energyPoints}/${maxEnergyPoints} — fills by eating`}
          value={
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <PixelSegmentedBar
                value={energyPoints}
                max={maxEnergyPoints}
                segments={Math.max(1, maxEnergyPoints)}
                height={10}
                style={{ width: 46 }}
                label={isPt ? 'Energia' : 'Energy'}
              />
              {energyPoints}/{maxEnergyPoints}
            </span>
          }
        />
        <button
          type="button"
          onClick={onOpenCredits}
          aria-label={isPt ? `Créditos: ${credits}` : `Credits: ${credits}`}
          style={{ background: 'none', border: 'none', padding: 0, minHeight: 44, cursor: onOpenCredits ? 'pointer' : 'default' }}
        >
          <PixelChip
            label={isPt ? 'Créditos' : 'Credits'}
            icon={iconGem}
            value={credits}
            title={isPt ? 'Créditos — comprados com dinheiro real' : 'Credits — bought with real money'}
          />
        </button>
      </div>
    </div>
  );
}
