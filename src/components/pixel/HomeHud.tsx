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
  /**
   * Some a marca (`<h1>Soulmon</h1>`) — usado quando os medidores migram
   * para DENTRO do corpo do aparelho (`CompanionHUD`) e a marca continua
   * sozinha, no topo da Home, como o `<h1>` da página (27/08/2026: "vida,
   * energia... ocupam espaço demais — deixe isso dentro da área do pet").
   */
  hideBrand?: boolean;
  /** Some os medidores — usado pela instância que só carrega a marca/h1. */
  hideMeters?: boolean;
  /**
   * Medidores mais apertados, para caber no corpo do aparelho sem competir
   * com o pet. Aperta só a MOLDURA: padding, gap e a altura do trilho da
   * barra (12px → 7px). **O rótulo continua sempre visível** e **o ícone
   * continua fixo em 20px** — o degrau `inline` da escala fechada
   * (`tokens.md` §6.1), abaixo do qual não existe degrau. (Esta linha dizia
   * "rótulo oculto, ícone 16px" até 27/08/2026; era falsa nas duas metades —
   * o código nunca fez isso.)
   */
  compact?: boolean;
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
  value, max, tone, label, height = 12,
}: { value: number; max: number; tone: string; label: string; height?: number }) {
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
      style={{ height, '--sm2-seg-tone': tone } as CSSProperties}
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
  hideBrand = false,
  hideMeters = false,
  compact = false,
}: HomeHudProps) {
  const isPt = language === 'pt-BR';
  const temHp = typeof healthPoints === 'number' && typeof maxHealthPoints === 'number' && maxHealthPoints > 0;
  const hp = healthPoints as number;
  const hpMax = maxHealthPoints as number;

  return (
    <div className={compact ? 'sm2-hud sm2-hud--compact' : 'sm2-hud'}>
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
      {/* A marca é o `<h1>` DA HOME. A Home era a tela mais vista do app e não
          tinha um único heading — um leitor de tela entrava nela sem nenhum
          ponto de partida e sem como pular para a lista de rituais (que agora
          é o `<h2>` do `RitualPanel`). O wordmark já era o primeiro elemento
          da tela e o nome do lugar onde a pessoa está: ele é o heading certo,
          e virar `<h1>` não muda um pixel (`.sm2-hud-wordmark` traz família,
          tamanho e cor; a margem do `h1` é zerada aqui).

          `hideBrand`: a instância COMPACTA que mora dentro do `.sm2-device`
          (27/08/2026) não repete o `<h1>` — ele continua único, sozinho, no
          topo da Home. */}
      {!hideBrand && (
        <div className="sm2-hud-brand">
          <h1 className="sm2-hud-wordmark" style={{ margin: 0 }}>Soulmon</h1>
        </div>
      )}

      {/* Fileira de medidores: HP e Energia, cada um na SUA caixa e com o mesmo
          peso. O trilho é escuro nos dois temas (é a tela do aparelho) e o
          número usa tabular-nums — sem isso o valor "dança" na horizontal a
          cada tick e a barra inteira parece tremer. */}
      {!hideMeters && (
      <div className="sm2-hud-meters">
        {temHp && (
          <div
            className="sm2-meter"
            title={isPt
              ? `HP: ${hp}/${hpMax} — cai quando você perde cuidados; faça carinho no pet para curar`
              : `HP: ${hp}/${hpMax} — drops when care is missed; rub the pet to heal`}
          >
            <div className="sm2-meter-head">
              {/* 20px sempre (degrau `inline`, tokens.md §6.1) — é a escala
                  FECHADA do app, não há degrau menor. O `compact` encolhe
                  padding/gap/trilho ao redor (CSS), não o ícone. */}
              <Icon name="favorite" size={20} fill={1} tone={hp <= 1 ? 'viewport-danger' : 'viewport'} />
              <span className="sm2-meter-label">{isPt ? 'Vida' : 'Health'}</span>
              <span className="sm2-meter-value sm2-num">{hp}/{hpMax}</span>
            </div>
            <SegBar
              value={hp}
              max={hpMax}
              height={compact ? 7 : 12}
              /* Tinta de VISOR (cobre), clara nos dois temas. O HP baixo NÃO
                 troca a cor da barra — `--sm2-danger-fill` é calibrado para
                 SURFACE clara (a `-surface` de cada tema), não para o vidro
                 do visor, que é escuro nos dois (28/08/2026: `.sm2-meter`
                 passou a viver dentro do `.sm2-device`, sempre sobre o vidro
                 — o comentário antigo falava de uma superfície clara que não
                 existe mais aqui). Quem carrega o alarme é o glifo do coração
                 (`viewport-danger`, calibrado pro vidro) e o número ao lado,
                 os dois em `--sm2-viewport-ink`/`-danger`. */
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
            <Icon name="bolt" size={20} fill={1} tone="viewport" />
            <span className="sm2-meter-label">{isPt ? 'Energia' : 'Energy'}</span>
            <span className="sm2-meter-value sm2-num">{energyPoints}/{maxEnergyPoints}</span>
          </div>
          <SegBar
            value={energyPoints}
            max={maxEnergyPoints}
            height={compact ? 7 : 12}
            tone="var(--sm2-viewport-ink)"
            label={isPt ? 'Energia' : 'Energy'}
          />
        </div>
      </div>
      )}
    </div>
  );
}
