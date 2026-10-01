// ─────────────────────────────────────────────────────────────────────────────
// O PALCO do pet — a composição do box (CompanionHUD).
//
// Antes disto, "decoração" era um badge de 32px jogado no canto inferior
// esquerdo: não compunha com o cenário, não tinha tamanho previsível e não dava
// para desenhar arte pensando nela. Aqui o box vira um palco com geometria
// fixa e ESPAÇOS (slots) definidos.
//
// As três regras que sustentam tudo:
//
//   1. TODO cenário compartilha a MESMA linha de chão (`GROUND_Y`). É onde os
//      pés do pet caem hoje (o sprite é 80px centrado em 50% de um box de
//      250px → base em 74%). Cenário que desenhar o chão em outra altura faz a
//      decoração flutuar — por isso o CSS dos cenários foi alinhado a este
//      valor, e não o contrário.
//
//   2. Cada slot tem TAMANHO FIXO em px. A arte é desenhada PARA a caixa; o
//      renderizador não a redimensiona por conta própria. Mudar um tamanho aqui
//      significa redesenhar a arte que ocupa o slot.
//
//   3. Slot vazio é VAZIO. Sem contorno tracejado, sem "+", sem marcação
//      nenhuma — quem não tem decoração vê o cenário limpo, não um formulário
//      pela metade.
//
// Coordenadas: `x`/`y` em % da ÁREA DO PET (a caixa arredondada de 250px de
// altura à direita da coluna de botões), `w`/`h` em px.
// ─────────────────────────────────────────────────────────────────────────────

/** Linha do chão, em % da altura do palco. Os pés do pet caem exatamente aqui. */
export const GROUND_Y = 74;

/** Altura do palco em px (CompanionHUD — área do pet). */
export const STAGE_HEIGHT = 250;

export type SlotId = 'rug' | 'floor-left' | 'trophy' | 'floor-right' | 'wall';

/**
 * Espaços da MOBÍLIA BASE — a peça que fica debaixo do pet (hoje: o berço).
 *
 * Por que NÃO é um `SlotId`: os cinco espaços acima são o catálogo de
 * decoração do jogador — a loja vende para eles, `equippedDecor` os grava no
 * save e há teste exigindo que **todo** `SlotId` tenha ao menos um item à
 * venda. O berço não é comprado nem equipado: é a mobília que o app põe
 * sempre, para NORMALIZAR um sprite imprevisível (o pet é gerado pelo
 * usuário). Enfiá-lo em `SlotId` quebraria as duas regras de uma vez, e
 * enfiá-lo no `rug` roubaria do jogador o espaço do tapete que ele comprou.
 *
 * O que ele compartilha com os outros espaços é o que importa: **caixa de
 * tamanho fixo em px e arte que entra por FORA**. A arte mora em
 * `components/nestArt.ts` (a fronteira de troca), não aqui — trocar o berço
 * por outra mobília é acrescentar uma entrada lá e mudar qual `BaseSlotId` o
 * `CompanionHUD` pede, sem tocar em geometria.
 */
export type BaseSlotId = 'nest';

/**
 * Onde a decoração encosta:
 * - 'ground' → a BASE da caixa fica na linha do chão (móvel apoiado no piso)
 * - 'ground-flat' → a caixa fica DEITADA sobre a linha do chão (tapete)
 * - 'hang' → a caixa é presa pelo topo, na altura declarada (parede)
 */
export type SlotAnchor = 'ground' | 'ground-flat' | 'hang';

export interface DecorSlot {
  id: SlotId | BaseSlotId;
  /** Centro horizontal, em % da largura do palco. */
  x: number;
  /** Só para 'hang': topo da caixa, em % da altura do palco. */
  y?: number;
  /** Caixa da arte, em px. É o contrato com quem desenha. */
  w: number;
  h: number;
  anchor: SlotAnchor;
  namePt: string;
  nameEn: string;
}

/**
 * Os cinco espaços do palco, na ordem em que se lêem da esquerda para a
 * direita. A distribuição é deliberada: nada no centro exato do chão, porque é
 * onde o pet passa a maior parte do tempo, e nada colado nas bordas, que o box
 * arredondado corta.
 */
export const DECOR_SLOTS: Record<SlotId, DecorSlot> = {
  // Deitado no chão, atravessando o centro — o pet anda POR CIMA dele.
  rug: {
    id: 'rug', x: 50, w: 104, h: 16, anchor: 'ground-flat',
    namePt: 'Chão', nameEn: 'Floor',
  },
  // Peça grande: sofá, estante, fogueira, barraca.
  'floor-left': {
    id: 'floor-left', x: 16, w: 56, h: 56, anchor: 'ground',
    namePt: 'Canto esquerdo', nameEn: 'Left corner',
  },
  // Vitrine de conquistas — mostra os troféus REAIS ganhos no Torneio.
  trophy: {
    id: 'trophy', x: 47, w: 46, h: 50, anchor: 'ground',
    namePt: 'Vitrine de troféus', nameEn: 'Trophy display',
  },
  // Peça pequena: luminária, planta, pedra.
  'floor-right': {
    id: 'floor-right', x: 84, w: 48, h: 52, anchor: 'ground',
    namePt: 'Canto direito', nameEn: 'Right corner',
  },
  // Pendurado, acima da cabeça do pet (que ocupa de 42% a 74%). Fica logo
  // abaixo do topo, e não colado nele, para ler como preso a alguma coisa —
  // parede, mastro, galho — em vez de boiando no céu.
  wall: {
    id: 'wall', x: 68, y: 20, w: 56, h: 40, anchor: 'hang',
    namePt: 'Parede', nameEn: 'Wall',
  },
};

export const SLOT_ORDER: SlotId[] = ['rug', 'floor-left', 'trophy', 'floor-right', 'wall'];

// ── Mobília base: o berço ────────────────────────────────────────────────────

/**
 * Deslocamento vertical do PET dentro da área, em px a partir de `top: 50%`.
 * É o topo da caixa do sprite (152×152, com a arte contida e centrada nela).
 *
 * ⚠️ Isto **não** sai de `GROUND_Y`, e é de propósito: `GROUND_Y` foi medido
 * quando o sprite tinha 80px e o documento (`docs/PALCO-E-DECORACAO.md`) ainda
 * descreve essa conta. O sprite virou 152px e a renderização real deixou de
 * bater com os 74%. Deduzir a posição do berço de um `GROUND_Y` defasado
 * colocaria a mobília num chão que não existe mais. Enquanto a conta do palco
 * não for refeita, berço e pet dividem ESTA origem — uma só, declarada aqui.
 */
export const PET_TOP_OFFSET = -38;

/** Lado da caixa do sprite do pet, em px (a arte é contida e centrada nela). */
export const PET_BOX = 152;

/* ── A GRADE DE PIXEL DO SPRITE ────────────────────────────────────────────
   Todo PNG de linha do roster é 256 ou 384 de lado, e 128 é o maior divisor
   útil dos dois (2:1 e 3:1, os dois INTEIROS). Cada pixel de origem vira
   exatamente um bloco de destino e o `image-rendering: pixelated` passa a ser
   decisão em vez de remendo.

   Mora AQUI, e não no `CompanionHUD`, por duas razões que se somam:
   (a) é geometria do palco, e este arquivo já é o dono declarado da geometria
       do palco — `PET_GROUND_KEEP` no HUD é literalmente `PET_BOX - PET_RENDER`,
       ou seja, a constante já era derivada de um número daqui;
   (b) o guard de escala de render (`src/assets/assets.contract.test.ts`) precisa
       do número REAL, nunca copiado. Enquanto ele vivia no `CompanionHUD`, ler
       o número obrigava o teste a transformar/importar as 1469 linhas do
       componente e todo o grafo React/asset atrás dele — ~600ms ociosos e >4,4s
       sob carga, dentro de um orçamento de 5s. Este módulo não importa nada.
   O `CompanionHUD` reexporta `PET_RENDER` para quem já o importava de lá. */
const SPRITE_SRC_PX = 256;
const SPRITE_SCALE = 2;
/** Lado da caixa em que o sprite do pet é RENDERIZADO, em px. */
export const PET_RENDER = SPRITE_SRC_PX / SPRITE_SCALE;

/**
 * A caixa do berço. Ancorada ao PET (não à linha do chão, ver acima): `y` é o
 * topo da caixa em px a partir de `top: 50%`, o mesmo zero de
 * `PET_TOP_OFFSET`. O valor foi escolhido para que os pés do sprite caiam a
 * ~⅔ da altura do berço — que é o que faz ler como "o pet ESTÁ no berço" em
 * vez de duas imagens sobrepostas por acaso.
 *
 * Como todo espaço do palco: **a arte é desenhada PARA esta caixa** e o app
 * não a redimensiona por conta própria.
 */
export const BASE_SLOTS: Record<BaseSlotId, DecorSlot & { yPx: number }> = {
  nest: {
    // 220×104 desde 15/09/2026 (berço largo, `nest-cradle-wide.png` em 3×
    // exato — a caixa antiga de 148×83 esmagava a arte anisotropicamente, ver
    // o guard de escala em `assets.contract.test.ts`). `yPx` reencontrado para
    // manter os pés do sprite no MESMO y de antes (17 + ⅔·83 = 3 + ⅔·104).
    // C4 (navegação do dono, 01/10/2026): "cradle bem menor". 110×52 = a
    // mesma arte em 6× EXATO (660×312 ÷ 6), então a grade de pixel continua
    // inteira. `yPx` medido no navegador (375×812): com 66 os pés VISÍVEIS do
    // sprite (a arte tem margem transparente embaixo) caem a ~⅔ do berço.
    id: 'nest', x: 50, w: 110, h: 52, yPx: 66, anchor: 'ground',
    namePt: 'Berço', nameEn: 'Nest',
  },
};

/**
 * Onde o cenário se passa. Define que TIPO de elemento faz sentido nele — um
 * sofá no fundo do mar não é charmoso, é erro de composição.
 * - 'indoor'  → tem parede e piso (aceita mobília e coisas penduradas)
 * - 'outdoor' → céu aberto e terreno (aceita fogueira, pedra, barraca…)
 * - 'void'    → abstrato/sem chão legível (matriz, fundo do mar): sem decoração
 */
export type StageSetting = 'indoor' | 'outdoor' | 'void';

/** O que um item de decoração aceita como cenário. */
export type DecorFit = 'indoor' | 'outdoor' | 'any';

/** Um item de decoração cabe no cenário? */
export function decorFitsSetting(fit: DecorFit, setting: StageSetting): boolean {
  if (setting === 'void') return false;   // cenário sem chão não recebe nada
  return fit === 'any' || fit === setting;
}

/**
 * Estilo absoluto da caixa de um slot, pronto para o `style` do elemento.
 * Uma função só — se cada tela recalcular isso na mão, elas divergem e a
 * decoração deixa de bater com o chão.
 */
export function slotBoxStyle(slot: DecorSlot): {
  position: 'absolute'; left: string; top: string; width: number; height: number;
  marginLeft: number; marginTop: number;
} {
  const topPct = slot.anchor === 'hang' ? (slot.y ?? 0) : GROUND_Y;
  // 'ground' sobe a caixa inteira (base no chão); 'ground-flat' fica metade
  // acima e metade abaixo da linha, como um tapete em perspectiva; 'hang'
  // desce a partir do topo declarado.
  const marginTop = slot.anchor === 'ground' ? -slot.h
    : slot.anchor === 'ground-flat' ? -Math.round(slot.h / 2)
    : 0;
  return {
    position: 'absolute',
    left: `${slot.x}%`,
    top: `${topPct}%`,
    width: slot.w,
    height: slot.h,
    marginLeft: -Math.round(slot.w / 2),
    marginTop,
  };
}

/**
 * Aplica um equipar/desequipar sobre o mapa de decoração.
 *
 * `itemId` null LIMPA o espaço — e por isso `slot` é obrigatório: sem item não
 * há de onde deduzir o espaço. A primeira versão disto deduzia o slot a partir
 * do id e devolvia o estado intocado quando o id era null, ou seja, o botão
 * "Equipado" não desequipava nada. Função pura para que isso seja testável.
 */
export function applyDecorEquip(
  current: Partial<Record<SlotId, string>>,
  itemId: string | null,
  slot: SlotId,
): Partial<Record<SlotId, string>> {
  const next = { ...current };
  if (itemId === null) delete next[slot];
  else next[slot] = itemId;      // um espaço, um item: substitui quem estava lá
  return next;
}
