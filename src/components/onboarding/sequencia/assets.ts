/**
 * Mapa CENTRAL de arte da sequência. Arte ausente = o player desenha uma silhueta/retângulo
 * nomeado (nunca trava). Para trocar, edite só aqui: soltar o arquivo em
 * `src/assets/soulmon/onboarding/` com o nome abaixo já basta (o glob o encontra).
 */
export type AssetKey =
  | 'bg-malha-escura' | 'bg-malha-clara' | 'bg-core-cidade'
  | 'velado-anciao' | 'velado-anciao-mao' | 'velado-anciao-preocupado' | 'velado-anciao-costas'
  | 'velado-mao'
  | 'desfeito' | 'desfeito-soulmon' | 'anciao-soulmon'
  | 'penhasco-borda' | 'penhasco-panorama' | 'bg-penhasco-topo'
  | 'cristal-praca';

export interface AssetDef {
  /** Caminho final esperado (relativo a src/assets/soulmon/onboarding/). */
  arquivo: string;
  /** Cena(s) da intro em que aparece. */
  cenas: number[];
  tipo: 'imagem';
  /** `true` enquanto a arte ainda não foi gerada (silhueta nomeada no lugar). */
  pendente?: boolean;
  /** Quando a arte existir fora da pasta, ponha a URL resolvida aqui. */
  url?: string;
}

export const ASSETS: Record<AssetKey, AssetDef> = {
  'bg-malha-escura': { arquivo: 'bg-malha-escura.jpg', cenas: [1, 2, 3], tipo: 'imagem' },
  'bg-malha-clara': { arquivo: 'bg-malha-clara.jpg', cenas: [1], tipo: 'imagem' },
  'bg-core-cidade': { arquivo: 'bg-core-cidade.jpg', cenas: [8, 9], tipo: 'imagem' },
  'velado-anciao': { arquivo: 'velado-anciao.png', cenas: [1, 8, 9], tipo: 'imagem' },
  'velado-anciao-mao': { arquivo: 'velado-anciao-mao.png', cenas: [1], tipo: 'imagem' },
  'velado-anciao-preocupado': { arquivo: 'velado-anciao-preocupado.png', cenas: [3, 4, 5, 6], tipo: 'imagem' },
  'velado-anciao-costas': { arquivo: 'velado-anciao-costas.png', cenas: [2], tipo: 'imagem', pendente: true },
  'velado-mao': { arquivo: 'velado-mao.png', cenas: [6, 7], tipo: 'imagem' },
  desfeito: { arquivo: 'desfeito.png', cenas: [3], tipo: 'imagem' },
  'desfeito-soulmon': { arquivo: 'desfeito-soulmon.png', cenas: [5], tipo: 'imagem' },
  'anciao-soulmon': { arquivo: 'anciao-soulmon.png', cenas: [5], tipo: 'imagem', pendente: true },
  'penhasco-borda': { arquivo: 'penhasco-borda.png', cenas: [3], tipo: 'imagem', pendente: true },
  'penhasco-panorama': { arquivo: 'penhasco-panorama.jpg', cenas: [3], tipo: 'imagem', pendente: true },
  'bg-penhasco-topo': { arquivo: 'bg-penhasco-topo.jpg', cenas: [6, 7], tipo: 'imagem', pendente: true },
  'cristal-praca': { arquivo: 'cristal-praca.png', cenas: [7, 8], tipo: 'imagem', pendente: true },
};

const ARQUIVOS = import.meta.glob('../../../assets/soulmon/onboarding/*.{png,jpg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

/** URL de um arquivo de `src/assets/soulmon/onboarding/` (ausente = undefined). */
export function arteOnboarding(arquivo: string): string | undefined {
  return ARQUIVOS[`../../../assets/soulmon/onboarding/${arquivo}`];
}

export function urlDoAsset(k: AssetKey): string | undefined {
  return ASSETS[k].url ?? arteOnboarding(ASSETS[k].arquivo);
}
