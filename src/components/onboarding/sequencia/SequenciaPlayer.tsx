import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import type { Language } from '../../../utils/i18n';
import { ASSETS, urlDoAsset, type AssetKey } from './assets';
import { t, UI } from './copy';
import { aposPular, proximo } from './logic';
import { ehInterativo, type Efeito, type Quadro, type SlotProps, type SlotRenderers } from './types';

/** Stub de slot: as outras frentes substituem via `slots`. Só avança. */
export function SlotStub({ slotId, language, onDone }: SlotProps & { slotId: string }) {
  return (
    <div style={caixaSlot} data-testid={`slot-stub-${slotId}`}>
      <p style={{ margin: 0 }}>[{slotId}]</p>
      <button type="button" style={botao} onClick={() => onDone()}>{t(UI.continuar, language)}</button>
    </div>
  );
}

export interface SequenciaPlayerProps {
  quadros: Quadro[];
  language: Language;
  /** Componentes das outras frentes (puzzle/tarefa/duelo). Ausente = stub. */
  slots?: SlotRenderers;
  onDone: () => void;
  /** Escolha cosmética da bifurcação (guardada por quem chama). */
  onChoice?: (id: string) => void;
  /** Pedido de faixa de ambiente; o app decide como tocar. */
  onMusica?: (faixa: 'suspense' | null) => void;
  /** Resultado de cada slot concluído. */
  onSlotDone?: (slot: string, resultado?: Record<string, unknown>) => void;
}

const CSS = `
@keyframes seq-glitch{0%,100%{transform:translate(0);filter:none}20%{transform:translate(-3px,1px);filter:hue-rotate(40deg)}40%{transform:translate(3px,-2px)}60%{transform:translate(-2px,2px);filter:saturate(2)}80%{transform:translate(2px,0)}}
@keyframes seq-pixels{0%{opacity:.0}50%{opacity:.5}100%{opacity:.15}}
@keyframes seq-clarao{0%{opacity:0}15%{opacity:1}100%{opacity:0}}
@keyframes seq-fade{from{opacity:1}to{opacity:0}}
@keyframes seq-parallax{from{transform:translateX(-1.5%) scale(1.05)}to{transform:translateX(1.5%) scale(1.05)}}
@media (prefers-reduced-motion: reduce){.seq-anim{animation:none!important}}
`;

function Arte({ k, extra, language }: { k: AssetKey; extra?: CSSProperties; language: Language }) {
  const url = urlDoAsset(k);
  if (url) return <img src={url} alt="" draggable={false} style={{ ...imgBase, ...extra }} />;
  // Placeholder nomeado: arte ainda não existe.
  return (
    <div style={{ ...placeholder, ...extra }} data-asset={k} role="img" aria-label={ASSETS[k].arquivo}>
      <span>{ASSETS[k].arquivo}</span>
      <small>{t(UI.semArte, language)}</small>
    </div>
  );
}

function Glitch({ efeito }: { efeito: Efeito }) {
  if (efeito === 'clarao') {
    return <div className="seq-anim" data-efeito="clarao" style={{ ...cobertura, background: '#7ff7e6', animation: 'seq-clarao 1.4s ease-out forwards' }} />;
  }
  return (
    <div className="seq-anim" data-efeito="glitch" style={{ ...cobertura, mixBlendMode: 'screen', animation: 'seq-pixels .5s steps(4) infinite',
      backgroundImage: 'repeating-linear-gradient(0deg,rgba(255,255,255,.08) 0 2px,transparent 2px 6px),radial-gradient(circle at 30% 40%,rgba(0,255,220,.25) 0 6px,transparent 7px),radial-gradient(circle at 70% 60%,rgba(255,0,120,.2) 0 8px,transparent 9px)' }} />
  );
}

export function SequenciaPlayer({ quadros, language, slots, onDone, onChoice, onMusica, onSlotDone }: SequenciaPlayerProps) {
  const [i, setI] = useState(0);
  const [preto, setPreto] = useState(false);
  const fim = useRef(false);
  const q: Quadro | undefined = quadros[i];

  const ir = useCallback((n: number) => {
    if (n >= quadros.length) {
      if (!fim.current) { fim.current = true; onDone(); }
      return;
    }
    const alvo = quadros[n];
    if (alvo.tipo === 'cena' && alvo.transicaoPreta) {
      setPreto(true);
      setTimeout(() => { setI(n); setPreto(false); }, 350);
    } else setI(n);
  }, [quadros, onDone]);

  useEffect(() => {
    if (q?.tipo === 'cena' && q.musica !== undefined) onMusica?.(q.musica);
  }, [q, onMusica]);

  useEffect(() => { if (!q && quadros.length === 0) ir(0); }, [q, quadros.length, ir]);

  if (!q) return null;
  const interativo = ehInterativo(q);
  const avancar = () => { if (!interativo) ir(proximo(quadros, i)); };
  const falar = q.tipo === 'cena' || q.tipo === 'video' ? q.fala : undefined;
  const efeito = q.tipo === 'cena' || q.tipo === 'video' ? q.efeito : undefined;

  return (
    <div style={raiz} data-testid="sequencia-player" data-quadro={i}>
      <style>{CSS}</style>
      {q.tipo === 'slot' ? (
        (() => {
          const Slot = slots?.[q.slot];
          const done = (r?: Record<string, unknown>) => { onSlotDone?.(q.slot, r); ir(proximo(quadros, i)); };
          return Slot ? <Slot language={language} onDone={done} /> : <SlotStub slotId={q.slot} language={language} onDone={done} />;
        })()
      ) : (
        <div style={palco} onClick={avancar} data-testid="sequencia-palco">
          {q.tipo === 'cena' && q.preto ? null : q.tipo === 'video' ? (
            urlDoAsset(q.video)
              ? <video src={urlDoAsset(q.video)} muted autoPlay playsInline onEnded={() => ir(proximo(quadros, i))} style={imgBase} />
              : <Arte k={q.video} language={language} extra={{ position: 'absolute', inset: 0 }} />
          ) : (
            <>
              {q.fundo && <Arte k={q.fundo} language={language} extra={{ position: 'absolute', inset: '-3%', width: '106%', height: '106%',
                ...(q.tipo === 'cena' && q.parallax ? { animation: 'seq-parallax 9s ease-in-out infinite alternate' } : {}) }} />}
              {q.npc && <Arte k={q.npc} language={language} extra={{ position: 'absolute', bottom: '14%', left: '50%', width: '46%', height: '52%', marginLeft: '-23%' }} />}
            </>
          )}
          {efeito && <Glitch efeito={efeito} />}
          {q.tipo === 'escolha' && (
            <div style={caixaFala} onClick={(e) => e.stopPropagation()}>
              <p style={{ margin: '0 0 10px' }}>{t(q.pergunta, language)}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {q.opcoes.map((o) => (
                  <button key={o.id} type="button" style={botao}
                    onClick={() => { onChoice?.(o.id); ir(proximo(quadros, i)); }}>{t(o.rotulo, language)}</button>
                ))}
              </div>
            </div>
          )}
          {falar && <div style={caixaFala} data-testid="sequencia-fala"><p style={{ margin: 0 }}>{t(falar, language)}</p></div>}
        </div>
      )}
      {!interativo && (
        <button type="button" style={pular} onClick={() => ir(aposPular(quadros, i))}>{t(UI.pular, language)}</button>
      )}
      {preto && <div className="seq-anim" style={{ ...cobertura, background: '#000', zIndex: 5 }} />}
    </div>
  );
}

const raiz: CSSProperties = { position: 'fixed', inset: 0, background: '#000', color: '#f2f2f2', zIndex: 1000, overflow: 'hidden' };
const palco: CSSProperties = { position: 'absolute', inset: 0, overflow: 'hidden', cursor: 'pointer' };
const cobertura: CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none' };
const imgBase: CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
const placeholder: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, border: '1px dashed #5b6b70', background: 'rgba(40,60,66,.35)', color: '#9fb2b7', fontSize: 12, textAlign: 'center' };
const caixaFala: CSSProperties = { position: 'absolute', left: 16, right: 16, bottom: 24, padding: '12px 14px', background: 'rgba(0,0,0,.72)', border: '1px solid #3b4a4f', borderRadius: 6, fontSize: 16, lineHeight: 1.4 };
const caixaSlot: CSSProperties = { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 };
const botao: CSSProperties = { minHeight: 44, padding: '0 16px', background: '#1d2b2f', color: '#f2f2f2', border: '1px solid #4a6068', borderRadius: 6, fontSize: 15 };
const pular: CSSProperties = { ...botao, position: 'absolute', top: 12, right: 12, minHeight: 44, zIndex: 6, opacity: 0.85 };
