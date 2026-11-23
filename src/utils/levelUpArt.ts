// Arte OPCIONAL do display de level up (pedido do dono, 11/10/2026). Dois slots em
// `src/assets/soulmon/levelup/`: `levelup-burst.png` (os raios
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

// O emblema (folhas do dono, 05/11/2026): Bond Up em inglês, Vínculo Up em português. `entrada` toca uma vez (asas abrem, texto
// acende), `laco` repete o fim e `fixo` é o último quadro, para movimento reduzido. Recorte em E:/Soulmon-assets/bond-up/recorte.py.
import enEntrada from '../assets/soulmon/levelup/bond-up-en-entrada.webp';
import enLaco from '../assets/soulmon/levelup/bond-up-en-laco.webp';
import enFixo from '../assets/soulmon/levelup/bond-up-en-fixo.webp';
import ptEntrada from '../assets/soulmon/levelup/bond-up-pt-entrada.webp';
import ptLaco from '../assets/soulmon/levelup/bond-up-pt-laco.webp';
import ptFixo from '../assets/soulmon/levelup/bond-up-pt-fixo.webp';

/** Largura e altura nativas (a proporção reserva o espaço antes de carregar). */
export const BOND_UP_W = 342;
export const BOND_UP_H = 256;
/** Duração da `entrada`: soma dos 15 quadros; depois dela entra o `laco`. */
export const BOND_UP_ENTRADA_MS = 1500;
export const bondUpArt = (fase: 'entrada' | 'laco' | 'fixo', isPt: boolean): string => {
  const c = isPt ? { entrada: ptEntrada, laco: ptLaco, fixo: ptFixo } : { entrada: enEntrada, laco: enLaco, fixo: enFixo };
  return c[fase];
};

const modules = import.meta.glob('../assets/soulmon/levelup/*.png', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

export type LevelUpSlot = 'burst' | 'frame';

const ART: Partial<Record<LevelUpSlot, string>> = {};
for (const [path, url] of Object.entries(modules)) {
  const m = /\/levelup-(burst|frame)\.png$/.exec(path);
  if (m) ART[m[1] as LevelUpSlot] = url;
}

/** URL do slot, ou `undefined` (sem arte instalada → o overlay usa o fallback procedural). */
export const levelUpArt = (slot: LevelUpSlot): string | undefined => ART[slot];
