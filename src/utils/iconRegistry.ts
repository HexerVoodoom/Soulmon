// Registro central de ícones "placeholder" — usados enquanto os créditos do
// Higgsfield (gerador de arte pixel do resto do app) estão baixos. Cada
// entrada documenta a ORIGEM pra facilitar a troca futura por arte gerada
// no nosso estilo (ver docs/PENDENCIAS-ARTE-UI-HIGGSFIELD.md pro histórico
// da rodada anterior de ícones).
//
//   source: 'higgsfield' — já é arte nossa (kit bronze/cobre gerado antes),
//           só estava solta no bundle sem estar ligada a nenhum componente.
//           Não precisa trocar, só ligar.
//   source: 'web'        — baixado de um pack CC0/CC-BY de terceiros
//           (ver `license`), estilo aproximado mas NÃO gerado no nosso
//           estilo. Candidato a substituição quando os créditos voltarem.
export interface IconEntry {
  path: string;
  source: 'higgsfield' | 'web';
  /** Só relevante pra `source: 'web'` — pacote de origem e licença. */
  license?: string;
}

/** Ícones do kit Higgsfield já gerados mas AINDA soltos (sem componente
 *  ligado) — candidatos óbvios pra próxima rodada, sem precisar gerar de
 *  novo. `bolt` fica de fora de propósito: tem um badge neon quadrado
 *  embutido na própria arte, destoa do resto (flat, sem moldura). */
export const HIGGSFIELD_UNUSED = {
  profile: '../assets/soulmon/icons/icon-profile.png',
  flame: '../assets/soulmon/icons/icon-flame.png',
  map: '../assets/soulmon/icons/icon-map.png',
  plant: '../assets/soulmon/icons/icon-plant.png',
  torch: '../assets/soulmon/icons/icon-torch.png',
  spellbook: '../assets/soulmon/icons/icon-spellbook.png',
  shard: '../assets/soulmon/icons/icon-shard.png',
  skull: '../assets/soulmon/icons/icon-skull.png',
  target: '../assets/soulmon/icons/icon-target.png',
} as const;

/**
 * Ícones sem NENHUM equivalente no kit ainda — nem gerado nem baixado.
 * Ficam como lucide-react por ora porque o crédito do Higgsfield está baixo
 * (ver docs de status) e não achei pack CC0/CC-BY web que batesse com o
 * nosso estilo pixel-art detalhado pra esses conceitos específicos.
 * DailyReportModal.tsx usa RowIcon (aceita string OU componente lucide)
 * pra já deixar o slot pronto — trocar um item aqui não exige mexer no JSX
 * de novo, só passar a string da imagem no lugar do componente.
 */
/**
 * Star / CloudRain / HeartCrack / HeartHandshake / Bell / BellOff / Clock /
 * Trash2 / Search / Globe já foram trocados por PNGs próprios (gerados no
 * Gemini, estilo bronze/turquoise batendo com o resto do app — ver
 * `src/assets/soulmon/icons/icon-{star,cloud-rain,heart-crack,
 * heart-handshake,bell,bell-off,clock,trash,search,globe}.png`).
 */
export const STILL_LUCIDE_NO_MATCH = [
  'Info / Bot / Cloud (configurações diversas)',
] as const;

/**
 * Ícones baixados da web como placeholder — QUALQUER ícone marcado aqui é
 * candidato a troca assim que o Higgsfield tiver crédito de novo. Ao trocar,
 * remova a entrada e o arquivo web correspondente.
 */
export const WEB_PLACEHOLDER_ICONS: Record<string, IconEntry> = {
  // (preenchido conforme cada ícone web for efetivamente ligado)
};

/**
 * Kit de UI gerado em 18/08/2026 e ainda FORA do repositório, guardado em
 * `E:\Soulmon-assets\out` (142 PNGs, recortados e medidos contra o guard de
 * `src/assets/assets.contract.test.ts`). A política daqui continua valendo —
 * **asset só entra no repo quando alguém o liga** —, então isto é um índice do
 * que existe pronto, não um convite a copiar tudo:
 *
 *   glyphs/      chevrons (4 direções), +/− em botão de cobre, refresh, share,
 *                editar, lixeira, filtro, menu 3-pontos, hambúrguer, sparkle
 *   icons/       45 ícones em tile (armas, baú, caveira, troféu, ampulheta,
 *                calendário, sino, cadeado…) + 15 de hábito (lótus, halteres,
 *                tênis, lua, maçã, sol, diário, música, streak)
 *   controls/    nav bar (3 destinos × ativo/inativo), chips de recurso,
 *                checkbox e radio em 3 estados, toggle, moldura de avatar
 *   bars/        moldura vazia + preenchimentos ciano/HP/mana + barra XP fina
 *   window/      janela de diálogo, slot de inventário (normal e selecionado),
 *                fechar, minimizar, placa de título, divisor
 *   logo/        marca do app (2 variantes), ícone de app, chama e cristal
 *   scenery/     fundo de circuito TILEÁVEL, balão de fala, tooltip
 *   evolution-fx/ 6 frames de efeito de evolução
 *
 * Já ligados: os 4 nós da árvore (`soulmon/evolution/`), os 9 estados de botão
 * (`soulmon/buttons/`) e `icon-chevron-right.png`.
 */
