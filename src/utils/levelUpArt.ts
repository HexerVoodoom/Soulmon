// Arte OPCIONAL do display de level up (pedido do dono, 11/10/2026). Três slots em
// `src/assets/soulmon/levelup/`: `levelup-banner.png` (a palavra LEVEL UP), `levelup-burst.png` (os raios
// atrás do número) e `levelup-frame.png` (a moldura do número). O pacote de geração (prompts, formato,
// destino e mapa) está em `docs/ASSETS-A-GERAR.md` §16 e em `INSTALAR.md` ao lado da pasta.
//
// ⚠️ Enquanto o arquivo não existe o glob volta VAZIO e o `LevelUpOverlay` desenha tudo de forma
// procedural (texto em fonte de calculadora + a luz em canvas da cerimônia de evolução): o display
// funciona HOJE, sem arte. Instalar o PNG liga o slot sozinho — nenhuma linha de código muda.
// Fronteira de troca no molde de `emblemArt.ts`.
// O chevron triplo de 96² (`gain-levelup.png`, entrega2 — JÁ instalado, no vocabulário do visor): reaproveitado
// ao lado do número (gate "Existe?" da squad-arte: não regerar o que existe). Arte própria, sempre presente.
import chevron from '../assets/soulmon/fx/gain-levelup.png';

/** O chevron do level up (96², exibido a 48 = 0,5×). */
export const LEVELUP_CHEVRON: string = chevron;

const modules = import.meta.glob('../assets/soulmon/levelup/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

export type LevelUpSlot = 'banner' | 'burst' | 'frame';

const ART: Partial<Record<LevelUpSlot, string>> = {};
for (const [path, url] of Object.entries(modules)) {
  const m = /\/levelup-(banner|burst|frame)\.png$/.exec(path);
  if (m) ART[m[1] as LevelUpSlot] = url;
}

/** URL do slot, ou `undefined` (sem arte instalada → o overlay usa o fallback procedural). */
export const levelUpArt = (slot: LevelUpSlot): string | undefined => ART[slot];
