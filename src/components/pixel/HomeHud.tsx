/**
 * HUD do topo da Home — marca à esquerda, medidores segmentados abaixo.
 *
 * ══ ORÇAMENTO DE LEITURAS DA HOME (PLANO-DESIGN §5.1) ══════════════════════
 *
 * O teto é de **5 leituras numéricas simultâneas** na Home, e a pendência do
 * PLANO-PRODUTO é explícita: *o Nível de Vínculo só entra na Home se DUAS
 * outras leituras saírem no mesmo PR*. As duas que saíram:
 *
 *  1. **Contador de Créditos** — saiu DESTE arquivo. Moeda comprada com
 *     dinheiro real, gasta em reroll / cura / troca por Bits: tudo fora da
 *     Home. Saldo permanente de moeda paga na tela principal é vitrine de
 *     loja, e o produto não é isso. Ela continua acionável no menu e na Loja
 *     (`CreditsModal`), que é onde a pessoa está decidindo gastar.
 *  2. **Os 3 atributos** (vírus/dado/vacina) — insumo de GALHO DE EVOLUÇÃO,
 *     não leitura diária. Casa própria em "CURRENT ALIGNMENT", na página de
 *     Evolução (`EvolutionPath`), onde a decisão acontece. Verificado: eles já
 *     não são renderizados por nenhuma superfície da Home.
 *
 * Ficam aqui: **HP** e **Energia**. Mais o contador de rituais (x/y, no
 * `RitualPanel`) e os Bits, que são a moeda ganha na própria sessão.
 *
 * // TODO(Vínculo): a vaga aberta é ESTA — uma terceira `.sm2-meter` na
 * // fileira abaixo, lendo `src/utils/bond.ts` (o módulo já existe e está
 * // testado). NÃO ligue junto de mais nada: o teto de 5 já estará no limite,
 * // e qualquer leitura nova depois dela precisa tirar outra antes.
 *
 * ══ GUARDRAIL DAS TRÊS MOEDAS (`src/utils/currencies.ts`) ══════════════════
 * Bits e Créditos já apareceram com o mesmo ícone 💎. Com os Créditos fora,
 * o HUD não mostra moeda NENHUMA — e é assim que ele deixa de poder repetir o
 * bug. Se um dia os Bits entrarem, é sem ícone e com a fonte de calculadora.
 */
import type { CSSProperties } from 'react';
import { Icon } from '../ui/Icon';
import type { Language } from '../../utils/i18n';

interface HomeHudProps {
  energyPoints: number;
  maxEnergyPoints: number;
  /** HP — na MESMA fileira e com o MESMO peso da energia. */
  healthPoints?: number;
  maxHealthPoints?: number;
  language?: Language;
}

/**
 * Barra segmentada do aparelho — blocos discretos, trilho escuro, **meia
 * unidade = meio bloco**.
 *
 * Por que não `PixelSegmentedBar` nem `PixelMeter`:
 *  · `PixelSegmentedBar` arredonda (`Math.round(ratio * total)`), então HP 1,5
 *    de 3 acenderia 2 blocos inteiros — a barra mentiria sobre a regra do
 *    jogo, que aceita frações de 0,5 (o carinho cura meio coração);
 *  · `PixelMeter` é CONTÍNUA (um preenchimento liso em %), e continuidade é
 *    exatamente o que se perde aqui: num v-pet você CONTA os blocos.
 *
 * É a leitura instantânea do gênero, e por isso é DOM e não PNG: a arte do kit
 * é uma barra fixa de 9 blocos cheios, incapaz de mostrar 3/7.
 */
function SegBar({
  value, max, tone, label,
}: { value: number; max: number; tone: string; label: string }) {
  const total = Math.max(0, Math.round(max));
  const seguro = Math.min(Math.max(0, value), total);
  const cheios = Math.floor(seguro);
  // 0,5 é o único passo fracionário que a regra produz; qualquer resto ≥0,25
  // lê como meio bloco em vez de sumir.
  const meio = seguro - cheios >= 0.25;
  return (
    <div
      className="sm2-seg"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      style={{ height: 12, '--sm2-seg-tone': tone } as CSSProperties}
    >
      {Array.from({ length: Math.max(1, total) }, (_, i) => {
        const cls = i < cheios
          ? 'sm2-seg-blk sm2-seg-on'
          : (i === cheios && meio ? 'sm2-seg-blk sm2-seg-half' : 'sm2-seg-blk');
        return <div key={i} className={cls} />;
      })}
    </div>
  );
}

export function HomeHud({
  energyPoints, maxEnergyPoints,
  healthPoints, maxHealthPoints,
  language = 'en-US',
}: HomeHudProps) {
  const isPt = language === 'pt-BR';
  const temHp = typeof healthPoints === 'number' && typeof maxHealthPoints === 'number' && maxHealthPoints > 0;
  const hp = healthPoints as number;
  const hpMax = maxHealthPoints as number;

  return (
    <div className="sm2-hud">
      {/* A marca é a PALAVRA, sem ícone ao lado.
          Aqui havia um `local_fire_department`, e ele era errado por dois
          motivos independentes. O primeiro é de produto: chama é o vocabulário
          visual de STREAK, e este app recusa streak por tese — o contador que
          zera dispara o "já quebrei, quebra tudo". Pôr a chama na marca é
          prometer, no primeiro elemento da tela, exatamente a mecânica que o
          jogo não tem. O segundo é de identidade: a marca do Soulmon é o
          VISOR (o aparelho), não um glifo de biblioteca — e um ícone genérico
          coberto ao lado do nome é o caminho mais curto para o app parecer um
          template, que é o risco declarado desta virada. Enquanto o glifo
          proprietário do visor não existir, a palavra sozinha carrega melhor
          a marca do que um símbolo emprestado. */}
      <div className="sm2-hud-brand">
        <span className="sm2-hud-wordmark">Soulmon</span>
      </div>

      {/* Fileira de medidores: HP e Energia, cada um na SUA caixa e com o mesmo
          peso. O trilho é escuro nos dois temas (é a tela do aparelho) e o
          número usa tabular-nums — sem isso o valor "dança" na horizontal a
          cada tick e a barra inteira parece tremer. */}
      <div className="sm2-hud-meters">
        {temHp && (
          <div
            className="sm2-meter"
            title={isPt
              ? `HP: ${hp}/${hpMax} — cai quando você perde cuidados; faça carinho no pet para curar`
              : `HP: ${hp}/${hpMax} — drops when care is missed; rub the pet to heal`}
          >
            <div className="sm2-meter-head">
              <Icon name="favorite" size={20} fill={1} tone={hp <= 1 ? 'danger' : 'gold'} />
              <span className="sm2-meter-label">{isPt ? 'Vida' : 'Health'}</span>
              <span className="sm2-meter-value sm2-num">{hp}/{hpMax}</span>
            </div>
            <SegBar
              value={hp}
              max={hpMax}
              /* Tinta de VISOR (cobre), clara nos dois temas e medida em 4,1:1
                 sobre o trilho escuro do tema claro — acima do 3:1 de
                 componente não-textual. O HP baixo NÃO troca a cor da barra:
                 `--sm2-danger-fill` no tema claro é um vermelho escuro que dá
                 2,8:1 ali dentro e sumiria. Quem carrega o alarme é o glifo do
                 coração (tom `danger`) e o número ao lado — os dois sobre
                 superfície clara, onde o vermelho passa AA. */
              tone="var(--sm2-viewport-ring)"
              label={isPt ? 'Vida' : 'Health'}
            />
          </div>
        )}

        <div
          className="sm2-meter"
          title={isPt
            ? `Energia: ${energyPoints}/${maxEnergyPoints} — sobe comendo; cheia no fim do dia = ponto de evolução`
            : `Energy: ${energyPoints}/${maxEnergyPoints} — fills by eating; full at day's end = evolution point`}
        >
          <div className="sm2-meter-head">
            <Icon name="bolt" size={20} fill={1} tone="primary" />
            <span className="sm2-meter-label">{isPt ? 'Energia' : 'Energy'}</span>
            <span className="sm2-meter-value sm2-num">{energyPoints}/{maxEnergyPoints}</span>
          </div>
          <SegBar
            value={energyPoints}
            max={maxEnergyPoints}
            tone="var(--sm2-viewport-ink)"
            label={isPt ? 'Energia' : 'Energy'}
          />
        </div>
      </div>
    </div>
  );
}
