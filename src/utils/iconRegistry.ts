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

/** Ícones do kit Higgsfield já gerados mas ainda soltos — ligados aqui pra
 *  virarem o resto do app aos poucos, sem precisar gerar de novo. */
export const HIGGSFIELD_UNUSED = {
  close: '../assets/soulmon/icons/icon-close.png',
  profile: '../assets/soulmon/icons/icon-profile.png',
  shield: '../assets/soulmon/icons/icon-shield.png',
  gearGold: '../assets/soulmon/icons/icon-gear-gold.png',
  flame: '../assets/soulmon/icons/icon-flame.png',
  map: '../assets/soulmon/icons/icon-map.png',
  plant: '../assets/soulmon/icons/icon-plant.png',
  potion: '../assets/soulmon/icons/icon-potion.png',
  torch: '../assets/soulmon/icons/icon-torch.png',
  spellbook: '../assets/soulmon/icons/icon-spellbook.png',
  shard: '../assets/soulmon/icons/icon-shard.png',
  skull: '../assets/soulmon/icons/icon-skull.png',
  bolt: '../assets/soulmon/icons/icon-bolt.png',
  target: '../assets/soulmon/icons/icon-target.png',
  exit: '../assets/soulmon/icons/icon-exit.png',
} as const;

/**
 * Ícones baixados da web como placeholder — QUALQUER ícone marcado aqui é
 * candidato a troca assim que o Higgsfield tiver crédito de novo. Ao trocar,
 * remova a entrada e o arquivo web correspondente.
 */
export const WEB_PLACEHOLDER_ICONS: Record<string, IconEntry> = {
  // (preenchido conforme cada ícone web for efetivamente ligado)
};
