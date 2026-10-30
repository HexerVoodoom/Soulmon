/**
 * Mapa CENTRAL de arte da sequência. A arte ainda não existe: cada chave aponta para o
 * arquivo esperado (ausente = o player desenha silhueta/retângulo nomeado). Para trocar,
 * edite só aqui. Preencha `url` quando o PNG/MP4 existir (import estático ou caminho).
 */
export type AssetKey =
  | 'bg-malha-escura' | 'bg-malha-clara' | 'bg-bifurcacao' | 'bg-core-cidade'
  | 'velado-anciao' | 'velado-anciao-mao' | 'velado-anciao-preocupado'
  | 'velado-mao' | 'velado-mao-lanterna'
  | 'video-fuga' | 'video-resgate';

export interface AssetDef {
  /** Caminho final esperado (relativo a src/assets/soulmon/onboarding/). */
  arquivo: string;
  /** Cena(s) em que aparece. */
  cenas: number[];
  tipo: 'imagem' | 'video';
  /** Quando a arte existir, ponha a URL resolvida aqui. */
  url?: string;
}

export const ASSETS: Record<AssetKey, AssetDef> = {
  'bg-malha-escura': { arquivo: 'bg-malha-escura.png', cenas: [2, 3], tipo: 'imagem' },
  'bg-malha-clara': { arquivo: 'bg-malha-clara.png', cenas: [2], tipo: 'imagem' },
  'bg-bifurcacao': { arquivo: 'bg-bifurcacao.png', cenas: [5], tipo: 'imagem' },
  'bg-core-cidade': { arquivo: 'bg-core-cidade.png', cenas: [9], tipo: 'imagem' },
  'velado-anciao': { arquivo: 'velado-anciao.png', cenas: [0, 2, 5, 9], tipo: 'imagem' },
  'velado-anciao-mao': { arquivo: 'velado-anciao-mao.png', cenas: [2], tipo: 'imagem' },
  'velado-anciao-preocupado': { arquivo: 'velado-anciao-preocupado.png', cenas: [3, 6, 7], tipo: 'imagem' },
  'velado-mao': { arquivo: 'velado-mao.png', cenas: [8], tipo: 'imagem' },
  'velado-mao-lanterna': { arquivo: 'velado-mao-lanterna.png', cenas: [8], tipo: 'imagem' },
  'video-fuga': { arquivo: 'video-fuga.mp4', cenas: [3], tipo: 'video' },
  'video-resgate': { arquivo: 'video-resgate.mp4', cenas: [8], tipo: 'video' },
};

export function urlDoAsset(k: AssetKey): string | undefined {
  return ASSETS[k].url;
}
