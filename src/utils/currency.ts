// Compatibilidade: os estilos de moeda vivem agora em utils/currencies.ts,
// junto do modelo das TRÊS moedas (Bits, Emblemas, Créditos). Manter dois
// arquivos de estilo de moeda foi o que deixou Bits e Créditos idênticos.
export { bitsStyle, bitsStyleLight, CURRENCIES } from './currencies';
export const BITS_NAME = 'Bits';
export const BITS_COLOR = '#39ff14';
