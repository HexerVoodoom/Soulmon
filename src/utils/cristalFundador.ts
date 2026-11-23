// Cristal Fundador / Founder Crystal — cosmético de concessão (NUNCA à venda): sempre aceso (modo 'sempre', `decorLuz.ts`), com fogo turquesa
// animado numa 2ª camada em tira de 5 quadros. Chunk lazy (entra por `catalogosNovos.ts`). A entrega por progressão (Fundo/Moldura/Retrato/Cristal)
// NÃO existe ainda: aguarda decisão do dono. Sem campo nem chave nova no save: a posse é `ownedFurniture` e o id desconhecido não quebra save antigo.
import type { ShopItem } from './shop';
import base from '../assets/decor/furn-cristal-fundador.png';
import chama from '../assets/decor-fx/furn-cristal-fundador-chama.png';

export const CRISTAL_FUNDADOR_ID = 'furn-cristal-fundador';
export const CRISTAL_FUNDADOR_QUADROS = 5;

export const CRISTAL_FUNDADOR: ShopItem = {
  id: CRISTAL_FUNDADOR_ID, kind: 'furniture', icon: '💎', slot: 'floor-right', fits: 'any',
  namePt: 'Cristal Fundador', nameEn: 'Founder Crystal',
  descPt: 'Brilha sempre, de dia e de noite — ocupa o canto direito, combina com qualquer cenário',
  descEn: 'Always glowing, day and night — takes the right corner, fits any scene',
  price: 0,
  // Nunca comprável: a `unlock` aponta para uma missão que não existe (como a Concha da Maré). Só a concessão futura o entrega.
  unlock: { kind: 'mission', missionId: 'founder-crystal-grant' },
};

export const ARTE_CRISTAL_FUNDADOR: Readonly<Record<string, string>> = { [CRISTAL_FUNDADOR_ID]: base };
export const CHAMA_CRISTAL_FUNDADOR = { [CRISTAL_FUNDADOR_ID]: { src: chama, quadros: CRISTAL_FUNDADOR_QUADROS } } as const;
