/**
 * Ícone de MATERIAL (REGISTRO §88, D1): a arte pixel de `assets/soulmon/materiais/mat-<id>.png` (64², alfa binário), carregada
 * SOB DEMANDA (não entra no chunk de entrada). Sem arte (ou enquanto carrega) cai no emoji de `MaterialDef.icon`.
 */
import { useEffect, useState } from 'react';

const mods = import.meta.glob<string>('../assets/soulmon/materiais/mat-*.png', { import: 'default' });
const porId = new Map<string, () => Promise<string>>();
for (const [caminho, load] of Object.entries(mods)) porId.set(caminho.split('/').pop()!.replace(/^mat-|\.png$/g, ''), load);

/** Os ids com arte instalada (para teste). */
export function materialArtIds(): string[] { return [...porId.keys()]; }

export function MaterialIcon({ id, emoji, size = 18 }: { id: string; emoji: string; size?: number }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let vivo = true;
    const load = porId.get(id);
    if (load) void load().then((u) => { if (vivo) setUrl(u); }).catch(() => {});
    return () => { vivo = false; };
  }, [id]);
  if (!url) return <span aria-hidden="true">{emoji}</span>;
  return <img src={url} alt="" aria-hidden="true" draggable={false} width={size} height={size} style={{ width: size, height: size, verticalAlign: '-0.3em', imageRendering: 'pixelated' }} />;
}
