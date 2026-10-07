// Monetização — SCAFFOLD. Nada aqui processa dinheiro real ainda.
// purchaseCredits/purchaseFullUnlock são placeholders que sempre retornam
// false (nunca fingem cobrar) até conectar um processador de pagamento de
// verdade (Google Play Billing no Android / Stripe Checkout no web).
// watchRewardedAd() simula um anúncio recompensado (sem SDK real ainda) só
// pra dar pra testar o loop de recompensa fim-a-fim — troque por AdMob (ou
// equivalente) quando a conta de anúncios existir; a assinatura já serve.
import { FORM_REQUIREMENTS } from '../types/progression';
import { getSpriteForStage, STARTER_NAMES, type StarterId } from './sprites';
import { STAGE_NAMES } from './oracle/base';
import type { CreatureStage, StageId, AlignmentId, ElementId } from './oracle';

export type AccountTier = 'demo' | 'paid';

// ── Personagens pré-prontos (os 5 iniciais) ─────────────────────────────────
// Desde 07/10/2026 os pré-prontos oferecidos ao jogador são os 5 INICIAIS
// (`STARTER_*` em `utils/sprites.ts`, dono de id, arte e nome). Os 6 antigos
// (Pyraka, Akashai, Nimbrata, Igni, Nautil, Astria) NÃO são mais oferecidos, mas
// seguem resolvendo sprite para save antigo (`LEGACY_PREMADE_IDS`) — eles
// continuam existindo como linhas de masmorra e NPCs da Biblioteca.
// Cada inicial tem UM sprite só, igual em todos os estágios (a evolução visual
// vem depois); por isso o modo demo evolui num caminho ÚNICO e capa em Mega.
export interface PremadeCharacter {
  id: StarterId;
  name: string;
  bioPt: string;
  bioEn: string;
  /** Elemento do vocabulário do ORÁCULO (`ElementId`) — o que a ficha/ritual enxerga. */
  elementId: ElementId;
  /** Essências do class-system (ids de `derivedElements.ts`): um par ou uma essência só. */
  essence: readonly string[];
  /** Rótulo de TIPO exibido (par PT/EN dos nomes de `derivedElements`/`essenceLabels`; há teste de igualdade). */
  typePt: string;
  typeEn: string;
}

/**
 * Os 5 personagens iniciais, na ordem da tela de escolha.
 *
 * Mapeamento pedido pelo dono (07/10/2026), em ids REAIS do class-system:
 *  - Crato  (pilha de caixotes, "tartaruga") — domínio industrial: `aco` + `ariete`
 *    (Aço + Aríete; o Aríete é gravidade+marcial). `ElementId`: `industrial`.
 *  - Brooka (ave-lontra verde, "pato") — `nascente` + `melodia` (Nascente + Melodia
 *    Vital). `ElementId`: `agua`.
 *  - Zefi   (borboleta-coruja) — `alento` (Alento = ar+vida). `ElementId`: `ar`.
 *  - Oaken  (árvore) — `vida` (elemento base Vida). `ElementId`: `planta`.
 *  - Bolid  (criatura de fogo) — `meteoro` (Meteoro = espaço+fogo). `ElementId`: `fogo`.
 * O NOME vem de `STARTER_NAMES` (dono único, nunca escrito à mão aqui).
 */
export const PREMADE_CHARACTERS: PremadeCharacter[] = [
  {
    id: 'industrial', name: STARTER_NAMES.industrial, elementId: 'industrial', essence: ['aco', 'ariete'],
    typePt: 'Aço + Aríete', typeEn: 'Steel + Battering Ram',
    bioPt: 'Uma pilha de caixotes que anda devagar e nunca deixa nada cair.',
    bioEn: 'A stack of crates that walks slowly and never drops a thing.',
  },
  {
    id: 'nascente', name: STARTER_NAMES.nascente, elementId: 'agua', essence: ['nascente', 'melodia'],
    typePt: 'Nascente + Melodia Vital', typeEn: 'Spring + Vital Melody',
    bioPt: 'Uma ave de riacho que assobia a água para fora da pedra.',
    bioEn: 'A brook bird that whistles water out of the stone.',
  },
  {
    id: 'alento', name: STARTER_NAMES.alento, elementId: 'ar', essence: ['alento'],
    typePt: 'Alento', typeEn: 'Breath',
    bioPt: 'Uma criatura de asas de maré que respira junto com você.',
    bioEn: 'A tide-winged creature that breathes along with you.',
  },
  {
    id: 'vida', name: STARTER_NAMES.vida, elementId: 'planta', essence: ['vida'],
    typePt: 'Vida', typeEn: 'Life',
    bioPt: 'Uma árvore pequena e paciente que cresce no seu ritmo.',
    bioEn: 'A small, patient tree that grows at your pace.',
  },
  {
    id: 'meteoro', name: STARTER_NAMES.meteoro, elementId: 'fogo', essence: ['meteoro'],
    typePt: 'Meteoro', typeEn: 'Meteor',
    bioPt: 'Uma brasa que veio do céu e ficou para aquecer.',
    bioEn: 'An ember that fell from the sky and stayed to keep you warm.',
  },
];

/** Sprite de um personagem pré-pronto (modo demo) num nível dado — usado na
 *  tela de escolha do onboarding. getSpriteForStage já sabe resolver isso
 *  quando um demoCharacterId é passado (ver utils/sprites.ts). */
export function getDemoSprite(characterId: string, stage: string): string {
  return getSpriteForStage(stage, characterId);
}

const DEMO_BRANCH_ALIGNMENTS: AlignmentId[] = ['poder', 'harmonia', 'benevolencia'];

/**
 * Formas do modo demo pra alimentar a página de Evolução (EvolutionPath.tsx),
 * que espera uma árvore CreatureStage[] no formato do oráculo. Como o
 * personagem pré-pronto só tem UM sprite por nível (sem variação por
 * branch), as 3 linhas ficam idênticas — não tem escolha de caminho real,
 * só o nome/descrição do personagem repetido em cada nível. Sem 'ultra'
 * (cap em Mega, sem arte pra Ultra ainda).
 */
export function getDemoCreatureStages(character: PremadeCharacter): CreatureStage[] {
  const description = { pt: character.bioPt, en: character.bioEn };
  const stages: CreatureStage[] = [
    { stage: 'rookie', stageName: STAGE_NAMES.rookie, name: character.name, description, imagePrompt: '', imagePromptFallback: '' },
  ];
  (['champion', 'perfeito', 'mega'] as StageId[]).forEach(stage => {
    DEMO_BRANCH_ALIGNMENTS.forEach(branch => {
      stages.push({ stage, branch, stageName: STAGE_NAMES[stage], name: character.name, description, imagePrompt: '', imagePromptFallback: '' });
    });
  });
  return stages;
}

// ── Créditos (moeda premium, dinheiro real) ─────────────────────────────────
export const REROLL_COST_CREDITS = 50;   // regenerar personagem (novo oráculo)
// ⚰️ `HEART_COST_CREDITS = 10` saiu em 06/09/2026 (D7+D15). Era o preço de
// curar 1 coração na hora. A peça inteira foi removida; se alguém for
// reintroduzir um preço em Créditos, que NÃO seja para HP.

/** Um pacote à venda. `id` é o SKU no Google Play Console (tem que bater
 *  EXATAMENTE com PRODUCTS em functions/api/billing.js). O preço mostrado aqui
 *  é só rótulo de UI — quem cobra e define o valor real é a Play. */
export interface CreditPack { id: string; credits: number; priceLabel: string }
export const CREDIT_PACKS: CreditPack[] = [
  { id: 'soulmon.credits.60', credits: 60, priceLabel: 'R$ 4,90' },
  { id: 'soulmon.credits.150', credits: 150, priceLabel: 'R$ 9,90' },
  { id: 'soulmon.credits.400', credits: 400, priceLabel: 'R$ 19,90' },
];

/**
 * SKU do desbloqueio completo (compra única, NÃO consumível).
 *
 * ☞ **Ponteiro (decisão do dono #55, 22/09/2026)**: o modelo de receita ganhou
 * uma segunda peça — **assinatura de IA de R$ 9,90/mês com 300 mensagens, só
 * texto e voz (chat, sugestões, transcrição); o sprite fica FORA**; créditos
 * para quem estoura; 1º mês de cortesia para quem comprou este SKU. Ela se
 * **constrói DEPOIS do E0** e por isso **não existe SKU recorrente neste
 * arquivo** — a ausência é proposital, não esquecimento. Decisão inteira
 * (alternativas que perderam + gatilhos de revisão) em
 * `docs/REGISTRO-DE-DECISOES.md` §5.4. Até lá o que limita custo de IA é o teto
 * por tier em `functions/api/_aiGuard.js` › `AI_LIMITS`.
 */
export const FULL_UNLOCK_SKU = 'soulmon.unlock.full';
/** Rotulo do preco do desbloqueio completo. **Ao mudar aqui, mude tambem
 *  `public/termos.html`** (secao 4, PT e EN) — o HTML estatico nao importa TS,
 *  entao quem guarda a igualdade e `src/utils/publishedPrice.test.ts`, que
 *  reprova a divergencia em vez de confiar neste comentario. */
export const FULL_UNLOCK_PRICE_LABEL = 'R$ 29,90';
/** Preco de referencia em dolar, so para os Termos EM INGLES (decisao do dono
 *  #25, 21/09/2026). Valor de `docs/PLANO-PRODUTO.md` Parte 3 (R$ 29,90 /
 *  US$ 6,99) — confirmar no Play Console antes da 1a venda. O app NUNCA
 *  cobra por este rotulo: quem cobra e o Play, em moeda local. */
export const FULL_UNLOCK_PRICE_LABEL_USD = 'US$ 6.99';

// ── Anúncio recompensado — DESLIGADO (decisão D-13, 25/08/2026) ─────────────
// O caminho anúncio → moeda premium → reroll aleatório fica FECHADO: com o
// público em 18+ (D-06) e o SDK de anúncio ainda inexistente, desligar hoje
// custa zero e evita nascer uma engrenagem de sorte paga por atenção.
// A mecânica NÃO foi arrancada — segue inteira e inerte. Para reativar:
// ponha `ADS_ENABLED = true` (e o servidor ainda precisa devolver
// `adsEnabled`, que é quem manda de verdade).
export const ADS_ENABLED = false;
// Os valores abaixo espelham functions/api/_entitlements.js — o teto diário
// que VALE é o do servidor; este aqui é só para a UI.
export const AD_REWARD_CREDITS = 5;
export const AD_DAILY_CAP = 3;

// ── Modo demo: A FRONTEIRA DO GRÁTIS (D-12, 26/08/2026) ────────────────────
//
// O teto DIÁRIO de criação (1/dia) morreu aqui, e não por generosidade.
//
// 1. Ele racionava o VERBO CENTRAL do produto. `docs/PLANO-PRODUTO.md:70` lista,
//    como primeiro não-objetivo do Soulmon, "app que tranca cuidado atrás de
//    paywall" — e o objeto trancado era o ato de escrever o que se pretende
//    fazer da própria vida.
// 2. Ele não protegia custo nenhum. Todo o COGS do produto (sprite por IA,
//    Oráculo, criatura única, reroll) já está trancado em outro lugar, com
//    `requirePaidTier` falhando FECHADO no servidor. Um item de paywall que não
//    protege custo só se justifica se converter — e isso é NÃO MEDIDO.
// 3. Ele mal existia. Só o `CreateModal` o consultava, e o botão principal da
//    tela inicial não passa por ele: na prática o demo criava sem limite, por
//    fora. Consertar a fiação SEM afrouxar a regra seria um APERTO — por isso as
//    duas coisas saem juntas, no mesmo release, ou nenhuma sai.
//
// No lugar dele entra um teto TOTAL de ativas, e ele é o MESMO do pagante no
// Rookie. A fronteira deixa de separar "quanto cuidado cabe" e passa a separar
// IDENTIDADE de CUIDADO: o que se compra é a criatura própria, a árvore própria
// — e, como consequência dela, um teto que CRESCE (7/8/9/10). O demo recebe a
// rotina inteira do Rookie e nada além.
//
// NÃO É TRAVA DE SEGURANÇA. É desenho de produto, 100% cliente. Quem quiser
// burlar abre o DevTools; o que está aqui é a regra que o app propõe, não uma
// fronteira que ele defende.

/** O teto de hábitos ATIVOS do modo grátis.
 *
 *  Não é um número escolhido: é o teto do Rookie, que o pagante também tem.
 *  Escrever `6` aqui faria a escada de `progression.ts` mudar um dia e este
 *  valor ficar para trás em silêncio. */
export const DEMO_ACTIVITY_TOTAL_CAP = FORM_REQUIREMENTS.rookie.cap;

/** Tarefa avulsa (uma vez) × hábito (recorrente). São regras diferentes. */
export type ActivityKind = 'task' | 'habit';

/**
 * O teto EFETIVO de hábitos ativos, dado o tier e o teto do estágio.
 *
 * É aqui que a paywall passa a cair: `stageCap` cresce com a evolução
 * (`FORM_REQUIREMENTS`), e para o demo esse crescimento é aparado. A elevação
 * do teto vira consequência de ter uma árvore própria — o diferencial — em vez
 * de uma cota diária cobrada sobre o cuidado.
 *
 * Aparar com `Math.min` (e não devolver a constante) importa: um save de demo
 * que por qualquer razão chegue com teto MENOR que 6 continua com o dele. O teto
 * do grátis é um limite, nunca uma promoção.
 */
export function activityCapFor(tier: AccountTier, stageCap: number): number {
  return tier === 'demo' ? Math.min(stageCap, DEMO_ACTIVITY_TOTAL_CAP) : stageCap;
}

/**
 * O PORTÃO. Pergunte a esta função antes de criar qualquer coisa, por qualquer
 * caminho — é o ponto único de decisão que o vazamento de D-12 não tinha.
 *
 * `kind: 'task'` responde SEMPRE `true`, e isso é decisão, não esquecimento: no
 * desenho antigo um hábito e uma tarefa de hoje custavam a mesma cota, então
 * quem anotava "ligar pro médico" gastava o orçamento inteiro do dia na coisa
 * de menor valor. Tarefa avulsa é o uso espontâneo — o que gera a métrica-norte
 * — e punir o espontâneo é punir exatamente o que se quer.
 *
 * A regra vale para os DOIS tiers. O pagante bate no teto do estágio dele pela
 * mesma porta; o que muda entre eles é só o número que `activityCapFor` devolve.
 */
export function canCreateActivity(args: {
  tier: AccountTier;
  kind: ActivityKind;
  /** Quantos hábitos JÁ existem na lista. Tarefas não entram nesta conta. */
  habitCount: number;
  /** O teto do estágio atual (`gameState.maxActivityCap`). */
  stageCap: number;
}): boolean {
  if (args.kind === 'task') return true;
  return args.habitCount < activityCapFor(args.tier, args.stageCap);
}
