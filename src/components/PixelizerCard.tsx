import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import type { Language } from '../utils/i18n';
import { pixelizeBuffer } from '../utils/pixelizer';
import { InfoTip } from './ui/InfoTip';

interface PixelizerCardProps {
  language?: Language;
}

const PREVIEW_SIZE = 160;   // px do preview na tela
const DOWNLOAD_SCALE = 20;  // fator de ampliação do PNG baixado (16 → 320px)

/**
 * Pixelador: cola (Ctrl+V) ou envia a imagem gerada pela IA e converte em
 * sprite v-pet DE VERDADE — reduz ao grid, quantiza a paleta e devolve
 * pixels duros. Garante o resultado 16x16/4 cores que o prompt pede.
 */
export function PixelizerCard({ language = 'en-US' }: PixelizerCardProps) {
  const isPt = language === 'pt-BR';

  const [source, setSource] = useState<HTMLImageElement | null>(null);
  const [grid, setGrid] = useState(16);
  const [colors, setColors] = useState(4);
  const [transparentBg, setTransparentBg] = useState(true);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cardCls = 'sm-card rounded-xl p-3';
  const titleCls = '';
  const mutedCls = '';
  const selectCls = 'rounded px-1.5 py-1 text-xs';
  const selectStyle = { background: 'var(--sm-bg)', border: '1px solid var(--sm-line)', color: 'var(--sm-ink)' };
  const btnCls = 'text-xs px-2 py-1 rounded';
  const btnStyle = { border: '1px solid #5eead4', color: '#0f766e' };
  const mono = { fontFamily: 'monospace' } as const;
  const titleStyle = { color: 'var(--sm-ink)' };
  const mutedStyle = { color: 'var(--sm-muted)' };

  const loadImageFile = useCallback((file: File | Blob) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => setSource(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      toast.error(isPt ? 'Não consegui ler essa imagem' : 'Could not read that image');
    };
    img.src = url;
  }, [isPt]);

  // Colar (Ctrl+V) em qualquer lugar da página funciona enquanto o card existe
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items ?? []).find(i => i.type.startsWith('image/'));
      const file = item?.getAsFile();
      if (file) {
        e.preventDefault();
        loadImageFile(file);
        toast.success(isPt ? 'Imagem colada!' : 'Image pasted!');
      }
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [loadImageFile, isPt]);

  // Reprocessa sempre que a imagem ou as opções mudam
  useEffect(() => {
    if (!source) return;
    // 1. Recorte quadrado central + redução ao grid (média de área = smoothing)
    const small = document.createElement('canvas');
    small.width = grid;
    small.height = grid;
    const ctx = small.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    const side = Math.min(source.width, source.height);
    const sx = (source.width - side) / 2;
    const sy = (source.height - side) / 2;
    ctx.drawImage(source, sx, sy, side, side, 0, 0, grid, grid);

    // 2. Fundo transparente + quantização de paleta (lógica pura testada)
    const imageData = ctx.getImageData(0, 0, grid, grid);
    pixelizeBuffer(imageData.data, grid, grid, { colors, transparentBg });
    ctx.putImageData(imageData, 0, 0);

    // 3. Preview ampliado com pixels duros
    const preview = previewRef.current;
    if (preview) {
      preview.width = PREVIEW_SIZE;
      preview.height = PREVIEW_SIZE;
      const pctx = preview.getContext('2d');
      if (pctx) {
        pctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
        pctx.imageSmoothingEnabled = false;
        pctx.drawImage(small, 0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
      }
    }

    // 4. PNG ampliado para download
    const out = document.createElement('canvas');
    out.width = grid * DOWNLOAD_SCALE;
    out.height = grid * DOWNLOAD_SCALE;
    const octx = out.getContext('2d');
    if (octx) {
      octx.imageSmoothingEnabled = false;
      octx.drawImage(small, 0, 0, out.width, out.height);
      setResultUrl(out.toDataURL('image/png'));
    }
  }, [source, grid, colors, transparentBg]);

  return (
    <div className={cardCls} style={mono}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="mb-1">
        <h3 className={titleCls} style={titleStyle}>🕹️ {isPt ? 'Pixelador v-pet' : 'V-pet Pixelizer'}</h3>
        {/* K6 (04/10/2026): o como-usar mora atrás do "?". */}
        <InfoTip language={language} label={isPt ? 'Como usar o Pixelador' : 'How to use the Pixelizer'} align="left" style={{ minHeight: 24 }}>
          {isPt
            ? 'Cole (Ctrl+V) ou envie a imagem gerada pela IA — o app converte em sprite 16x16 de verdade, com paleta limitada e fundo transparente.'
            : 'Paste (Ctrl+V) or upload the AI-generated image — the app converts it into a REAL 16x16 sprite with a limited palette and transparent background.'}
        </InfoTip>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
        <button onClick={() => fileInputRef.current?.click()} className={btnCls} style={{ ...mono, ...btnStyle }}>
          📁 {isPt ? 'Enviar imagem' : 'Upload image'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) loadImageFile(f); e.target.value = ''; }}
        />
        <select className={selectCls} style={{ ...mono, ...selectStyle }} value={grid} onChange={e => setGrid(Number(e.target.value))}>
          {[16, 24, 32, 48].map(g => <option key={g} value={g}>{g}×{g}</option>)}
        </select>
        <select className={selectCls} style={{ ...mono, ...selectStyle }} value={colors} onChange={e => setColors(Number(e.target.value))}>
          {[2, 4, 6, 8].map(c => <option key={c} value={c}>{c} {isPt ? 'cores' : 'colors'}</option>)}
        </select>
        <label className={`flex items-center gap-1 ${mutedCls}`} style={{ ...mono, ...mutedStyle }}>
          <input type="checkbox" checked={transparentBg} onChange={e => setTransparentBg(e.target.checked)} />
          {isPt ? 'fundo transparente' : 'transparent bg'}
        </label>
      </div>

      {source ? (
        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <p className={`text-[10px] mb-1 ${mutedCls}`} style={mutedStyle}>{isPt ? 'Original' : 'Original'}</p>
            <img
              src={source.src}
              alt=""
              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--sm-line)' }}
            />
          </div>
          <div>
            <p className={`text-[10px] mb-1 ${mutedCls}`} style={mutedStyle}>{isPt ? `Sprite ${grid}×${grid}` : `${grid}×${grid} sprite`}</p>
            <canvas
              ref={previewRef}
              style={{
                width: PREVIEW_SIZE,
                height: PREVIEW_SIZE,
                imageRendering: 'pixelated',
                borderRadius: 8,
                border: '1px solid var(--sm-line)',
                // xadrez para enxergar a transparência
                background: 'repeating-conic-gradient(#e5e7eb 0% 25%, #ffffff 0% 50%) 0 0 / 16px 16px',
              }}
            />
          </div>
          {resultUrl && (
            <a
              href={resultUrl}
              download={`sprite-${grid}x${grid}.png`}
              className={btnCls}
              style={{ ...mono, ...btnStyle, textDecoration: 'none' }}
            >
              ⬇️ {isPt ? 'Baixar PNG' : 'Download PNG'}
            </a>
          )}
        </div>
      ) : (
        <p className={`text-[10px] ${mutedCls}`} style={mutedStyle}>
          {isPt ? 'Nenhuma imagem ainda — gere no Nanobanana, copie e cole aqui.' : 'No image yet — generate it, copy and paste it here.'}
        </p>
      )}
    </div>
  );
}
