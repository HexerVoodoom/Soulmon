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
import imgHeartSprite from 'figma:asset/7e77e9ec45ca6381843c93b205d4f8cdd7ddf568.png';

interface HomeHudProps {
  energyPoints: number;
  maxEnergyPoints: number;
  credits: number;
  /** HP — rodada 3 (B1): saiu de "3 corações no ar" sobre o palco para dentro
   *  de uma cápsula emoldurada, na mesma fileira de Energia. */
  healthPoints?: number;
  maxHealthPoints?: number;
  language?: Language;
  /** Abre o modal de Créditos — a cápsula é clicável, não é enfeite. */
  onOpenCredits?: () => void;
}

/**
 * Corações de HP em miniatura (14px), com suporte a meio coração — é a MESMA
 * arte e a mesma regra de meio-a-meio do "carinho" que vivia solta em cima do
 * palco. Mudou o CONTINENTE (agora tem moldura), não a informação.
 */
function Hearts({ value, max }: { value: number; max: number }) {
  const cheios = Math.floor(value);
  const meio = value - cheios >= 0.5;
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: Math.max(0, max) }, (_, i) => (
        <span key={i} style={{ position: 'relative', width: 14, height: 13, flexShrink: 0 }}>
          <img
            src={imgHeartSprite}
            alt=""
            className={i < cheios ? undefined : 'sm-hp-empty'}
            style={{ position: 'absolute', inset: 0, width: 14, height: 13, imageRendering: 'pixelated' }}
          />
          {i === cheios && meio && (
            <span style={{ position: 'absolute', inset: 0, width: '50%', overflow: 'hidden' }}>
              <img src={imgHeartSprite} alt="" style={{ width: 14, height: 13, maxWidth: 'none', imageRendering: 'pixelated' }} />
            </span>
          )}
        </span>
      ))}
    </span>
  );
}

export function HomeHud({
  energyPoints, maxEnergyPoints, credits,
  healthPoints, maxHealthPoints,
  language = 'en-US', onOpenCredits,
}: HomeHudProps) {
  const isPt = language === 'pt-BR';
  const temHp = typeof healthPoints === 'number' && typeof maxHealthPoints === 'number' && maxHealthPoints > 0;
  return (
    <div className="sm-px-hud">
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

      {/* A cápsula de Créditos é a ÚNICA ação da fileira da marca — por isso
          ela fica aqui em cima, e os dois medidores (que são leitura, não
          ação) descem para a fileira própria. */}
      <PixelChip
        label={isPt ? 'Créditos' : 'Credits'}
        icon={iconGem}
        value={credits}
        title={isPt ? 'Créditos — comprados com dinheiro real' : 'Credits — bought with real money'}
        onClick={onOpenCredits ?? (() => {})}
        ariaLabel={isPt ? `Créditos: ${credits}` : `Credits: ${credits}`}
        style={{ minHeight: 44 }}
      />
    </div>

    {/* Fileira de medidores: HP e Energia, cada um na SUA moldura e com o
        MESMO peso. Antes o HP eram três corações soltos sobre o palco e a
        Energia era uma barra vertical vazia colada na margem direita — dois
        medidores, duas linguagens, nenhuma superfície (B1). */}
    <div className="sm-px-hud-meters">
      {temHp && (
        <PixelChip
          style={{ flex: 1, minWidth: 0 }}
          label={isPt ? 'Vida' : 'Health'}
          title={isPt
            ? `HP: ${healthPoints}/${maxHealthPoints} — cai quando você perde cuidados; faça carinho no pet para curar`
            : `HP: ${healthPoints}/${maxHealthPoints} — drops when care is missed; rub the pet to heal`}
          value={
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Hearts value={healthPoints as number} max={maxHealthPoints as number} />
              {healthPoints}/{maxHealthPoints}
            </span>
          }
        />
      )}
      <PixelChip
        style={{ flex: 1, minWidth: 0 }}
        label={isPt ? 'Energia' : 'Energy'}
        icon={iconFlame}
        title={isPt
          ? `Energia: ${energyPoints}/${maxEnergyPoints} — sobe comendo; cheia no fim do dia = ponto de evolução`
          : `Energy: ${energyPoints}/${maxEnergyPoints} — fills by eating; full at day's end = evolution point`}
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
    </div>
    </div>
  );
}
