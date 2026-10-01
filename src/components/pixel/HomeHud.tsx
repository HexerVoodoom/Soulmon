import type { ReactNode } from 'react';
/**
 * HUD do topo da Home — a MARCA (o `<h1>` da página) e o selo do dia. Só.
 *
 * ══ ORÇAMENTO DE LEITURAS DA HOME (PLANO-DESIGN §5.1) ══════════════════════
 *
 * O teto é de **5 leituras numéricas simultâneas** na Home, e a pendência do
 * PLANO-PRODUTO é explícita: *o Nível de Vínculo só entra na Home se DUAS
 * outras leituras saírem no mesmo PR*. As que saíram, em ordem:
 *
 *  1. **Contador de Créditos** — saiu DESTE arquivo. Moeda comprada com
 *     dinheiro real, gasta em reroll / cura / troca por Bits: tudo fora da
 *     Home. Saldo permanente de moeda paga na tela principal é vitrine de
 *     loja, e o produto não é isso. Ela continua acionável no menu e na Loja
 *     (`CreditsModal`), que é onde a pessoa está decidindo gastar.
 *  2. **Os 3 atributos** (poder/harmonia/benevolência) — insumo de GALHO DE EVOLUÇÃO,
 *     não leitura diária. Casa própria em "CURRENT ALIGNMENT", na página de
 *     Evolução (`EvolutionPath`), onde a decisão acontece.
 *  3. **HP e Energia em DOM** (16/09/2026, canvas Home, achado 1 / DECISÕES
 *     §19): este componente desenhava a barra segmentada vetor (`SegBar`,
 *     `.sm2-meter`) E o `CompanionHUD` montava a `VisorBar` em pixel dentro
 *     do vidro — o jogador lia o MESMO número duas vezes na mesma tela
 *     (`HomeHudEstados` desenhou as duas para provar). A leitura fica no
 *     vidro, em pixel, uma vez só; a DOM saiu. Se um dia a leitura vetor
 *     precisar existir (ficha do pet, widget), é o medidor segmentado do
 *     SIS-07 (`PixelSegmentedBar`), nunca as duas na Home.
 *
 * O que fica na Home, contado: HP e Energia (no vidro), o contador de rituais
 * (x/y, no `RitualPanel`) — e os Bits, que são a moeda ganha na própria
 * sessão, NÃO aparecem no topo (o canvas não os desenha; este HUD continua
 * sem moeda nenhuma, e é assim que ele deixa de poder repetir o bug dos dois
 * 💎, ver `utils/currencies.ts`).
 *
 * // TODO(Vínculo): a vaga aberta continua sendo uma terceira leitura no
 * // vidro (`src/utils/bond.ts` já existe e está testado). NÃO ligue junto
 * // de mais nada: o teto de 5 é o limite.
 */
import { Icon } from '../ui/Icon';
// PROVISÓRIO (01/10/2026): wordmark recortado localmente do original do
// Gemini, com autorização explícita do dono, até chegar a versão com alfa real
// (prompts em E:/Soulmon-assets/out/ajustes-20261001/PROMPTS-PARA-O-DONO.md).
// Quando chegar, troque SÓ o arquivo `logo-wordmark.png` (e a proporção abaixo).
import logoUrl from '../../assets/brand/final/logo-wordmark.png';

/** O wordmark (SOUL/MON) é 1175×840 (pixel art 235×168 ampliada 5× nearest).
 *  No header da Home ele ocupa 32 px de altura, dentro da linha de 44. */
const LOGO_H = 32;
const LOGO_W = Math.round(LOGO_H * 1175 / 840);

/**
 * C1 — o MENU da Home é um hambúrguer simples: três tracinhos, pelado (regra
 * do dono: ícone nunca em caixa). Desenho em SVG com `currentColor`, para o
 * tom vir do botão que o envolve; decorativo (o botão carrega o nome).
 */
export function MenuBars({ size = 28 }: { size?: number }) {
  return (
    <svg
      data-menu-bars
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      style={{ display: 'block', color: 'var(--sm2-ink)' }}
    >
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </svg>
  );
}
import type { Language } from '../../utils/i18n';

interface HomeHudProps {
  language?: Language;
  /**
   * O SELO DO DIA (WP2.12): os três focos escolhidos no check-in foram
   * concluídos. `focusComplete` (`utils/taskTriage.ts`) existia com teste e
   * nenhum chamador, enquanto o guia e o glossário prometiam o selo.
   *
   * É estado do DIA, não conquista: some na virada sozinho, sem toast de
   * perda e sem histórico. E é binário — nunca "2 de 3", porque um placar
   * parcial de um objetivo de três itens é a fatura que este produto não
   * emite. Ou está completo, ou não há selo.
   */
  focusSealed?: boolean;
  /**
   * O que vai na PONTA DIREITA da linha da marca — o menu só ícone da Home
   * (minimal-ui D6). Slot e não botão embutido: o HUD não sabe o que o menu
   * abre, e não deveria.
   */
  trailing?: ReactNode;
}

export function HomeHud({ language = 'en-US', focusSealed = false, trailing }: HomeHudProps) {
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
      {/* A marca é o `<h1>` DA HOME. A Home era a tela mais vista do app e não
          tinha um único heading — um leitor de tela entrava nela sem nenhum
          ponto de partida e sem como pular para a lista de rituais (que agora
          é o `<h2>` do `RitualPanel`). O wordmark já era o primeiro elemento
          da tela e o nome do lugar onde a pessoa está: ele é o heading certo,
          e virar `<h1>` não muda um pixel (`.sm2-hud-wordmark` traz família,
          tamanho e cor — Fredoka 20, caixa alta; a margem do `h1` é zerada
          aqui). */}
      <div className="sm2-hud-brand" style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44 }}>
        {/* C1 (navegação do dono, 01/10/2026): a marca deixa de ser a PALAVRA
            e vira o LOGO do app (`assets/brand/final/logo-wordmark.png`, o
            wordmark SOUL/MON — PROVISÓRIO, recorte local). Continua sendo o `<h1>` da Home: o
            nome acessível "Soulmon" é texto visualmente oculto ao lado da
            imagem decorativa, então o leitor de tela ouve o mesmo que ouvia. */}
        <h1 className="sm2-hud-wordmark" style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
          <img
            src={logoUrl}
            alt=""
            aria-hidden="true"
            data-home-logo
            width={LOGO_W}
            height={LOGO_H}
            draggable={false}
            style={{ display: 'block', width: LOGO_W, height: LOGO_H, imageRendering: 'pixelated' }}
          />
          <span className="sm2-sr-only">Soulmon</span>
        </h1>
        {/* O selo = chip de etiqueta 24 em `primary-soft` (canvas Home,
            HOME-07): `check_circle` FILL 1 + "focus done" Rubik 12/500. Ícone
            pelado dentro de um CHIP de texto — a regra do dono é sobre ícone
            sozinho em box; aqui o chip é a etiqueta inteira. */}
        {focusSealed && (
          <span
            className="sm2-hud-seal"
            title={language === 'pt-BR' ? 'Foco do dia completo' : "Today's focus complete"}
          >
            <Icon name="check_circle" size={20} fill={1} tone="primary" />
            <span>{language === 'pt-BR' ? 'foco do dia' : 'focus done'}</span>
          </span>
        )}
        {trailing && <div style={{ marginLeft: 'auto', display: 'flex' }}>{trailing}</div>}
      </div>
    </div>
  );
}
