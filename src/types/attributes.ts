export interface AttributePoints {
  virus: number;
  data: number;
  vaccine: number;
}

export type ActivityCategory = 
  | 'Health' 
  | 'Creativity' 
  | 'Discipline' 
  | 'Study' 
  | 'Work' 
  | 'Social' 
  | 'Wellness' 
  | 'Fitness';

/** Alinhamento do oráculo → galho de evolução. Era um mapa LOCAL do
 *  `EvolutionPath`; virou compartilhado quando o `EvoTrail` da Home passou a
 *  precisar dele — duas cópias divergiriam em silêncio (footgun 9). Chaves em
 *  união literal (e não `AlignmentId` de utils/oracle) de propósito: evita
 *  import de módulo de lógica num módulo de dados, e o TS estrutural aceita. */
export const ALIGN_TO_ATTR: Record<'poder' | 'harmonia' | 'benevolencia', 'virus' | 'data' | 'vaccine'> = {
  poder: 'virus',
  harmonia: 'data',
  benevolencia: 'vaccine',
};

export const CATEGORY_ATTRIBUTES: Record<ActivityCategory, AttributePoints> = {
  Health: { virus: 1, data: 1, vaccine: 2 },
  Creativity: { virus: 3, data: 1, vaccine: 0 },
  Discipline: { virus: 0, data: 1, vaccine: 3 },
  Study: { virus: 0, data: 3, vaccine: 1 },
  Work: { virus: 1, data: 2, vaccine: 1 },
  Social: { virus: 1, data: 1, vaccine: 2 },
  Wellness: { virus: 1, data: 2, vaccine: 1 },
  Fitness: { virus: 2, data: 1, vaccine: 1 },
};

export const XP_THRESHOLDS = {
  champion: 600,      // Rookie → Champion (7 days)
  ultimate: 1000,     // Champion → Ultimate (9 days)
  mega: 1500,         // Ultimate → Mega (11 days)
  itto: 2300,         // Mega → Itto Mode (14 days)
};

export type BranchType = 'virus' | 'data' | 'vaccine';

/** Cor de cada atributo (Poder/Harmonia/Benevolência) — FONTE ÚNICA DA VERDADE.
 *  Toda tela que pinta um atributo importa daqui; não redeclare localmente. */
export const ATTR_COLOR: Record<BranchType, string> = {
  virus: '#22A900',   // Poder
  data: '#009ED8',    // Harmonia
  vaccine: '#E69600', // Benevolência
};

/**
 * NOME que o jogador vê — FONTE ÚNICA DA VERDADE, pelo mesmo motivo da cor.
 *
 * `virus`/`data`/`vaccine` são identificadores INTERNOS, herdados do fork.
 * ⚠️ Este comentário justificava mantê-los "porque aparecem em save de quem já
 * joga" — não havia quem (07/09/2026). O motivo real de ficarem é outro e é
 * bom: são palavras genéricas (não são marca de ninguém), estão em dezenas de
 * arquivos e nos três campos do save, e trocá-las não entrega nada ao jogador,
 * que **nunca as vê**. Ele conhece Poder, Harmonia e Benevolência — e é isso
 * que esta tabela garante.
 *
 * Este mapa estava DUPLICADO em `EvolutionPath.tsx` e `PlayerDetailModal.tsx`,
 * e a `StatsPage` não usava nenhum dos dois — mostrava "Virus / Data / Vaccine"
 * cru, e só em inglês. É o mesmo padrão de "regra copiada diverge em silêncio"
 * do footgun 9 do CLAUDE.md, e é por isso que ele vive aqui agora.
 */
export const ATTR_LABEL: Record<BranchType, { pt: string; en: string }> = {
  virus: { pt: 'Poder', en: 'Power' },
  data: { pt: 'Harmonia', en: 'Harmony' },
  vaccine: { pt: 'Benevolência', en: 'Benevolence' },
};

/**
 * NÃO EXISTE `ATTR_ICON` AQUI — de propósito, e a ausência é a decisão.
 *
 * O desenho de cada atributo é UM SÓ no app inteiro: os SVG inline de
 * `components/AlignmentIcons.tsx` (`PowerIcon`/`HarmonyIcon`/
 * `BenevolenceIcon`), que já são a arte usada por `EvolutionPath` e
 * `PlayerDetailModal`. Este módulo tinha um mapa PARALELO de três PNGs
 * (`icon-attr-*`) — um segundo desenho para a mesma ideia, que ninguém
 * renderizava mais e que, se alguém ligasse, colocaria PNG e SVG do mesmo
 * atributo na mesma tela (bug 4.3 do `docs/PLANO-DESIGN.md`, cuja decisão é
 * "o SVG vence"). Um módulo de DADOS também não deve devolver JSX.
 *
 * Precisa do ícone de um atributo? Importe de `components/AlignmentIcons`.
 */

/**
 * A mesma cor de `ATTR_COLOR`, mas na luminosidade que passa 4,5:1 como
 * TEXTO — por tema, via variável CSS (o tema é resolvido no CSS, e prender
 * isto a um hook faria cada tela repetir a decisão).
 *
 * Regra: preenchimento, ícone e linha usam `ATTR_COLOR`; TEXTO usa isto.
 * Os valores e as razões medidas estão em `src/index.css` (bloco
 * "Tinta de TEXTO dos três atributos").
 */
export const ATTR_INK: Record<BranchType, string> = {
  virus: 'var(--sm-attr-virus-ink)',
  data: 'var(--sm-attr-data-ink)',
  vaccine: 'var(--sm-attr-vaccine-ink)',
};

/** Tinta escura para texto POR CIMA de um preenchimento de atributo.
 *  Branco sobre eles mede 2,4–3,1:1; esta mede 5,4–7,0:1. */
export const ATTR_ON_FILL_INK = '#04211f';

export interface EvolutionBranch {
  type: BranchType;
  name: string;
  color: string;
  emoji: string;
  description: string;
}

export const EVOLUTION_BRANCHES: Record<BranchType, EvolutionBranch> = {
  virus: {
    type: 'virus',
    name: 'Virus',
    color: '#E94F4F',
    emoji: '🦠',
    description: 'Instinct, intensity, creative chaos',
  },
  data: {
    type: 'data',
    name: 'Data',
    color: '#4F80E9',
    emoji: '💾',
    description: 'Intellect, balance, knowledge',
  },
  vaccine: {
    type: 'vaccine',
    name: 'Vaccine',
    color: '#66E94F',
    emoji: '💉',
    description: 'Discipline, empathy, control',
  },
};
