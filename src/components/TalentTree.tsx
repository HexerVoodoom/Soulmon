/**
 * Combate v3 / PR7 + Tarefa B (§2.37) — a árvore de talentos DESENHADA como árvore: o hub no centro, três caminhos (PvP, PvE,
 * Comércio) que se bifurcam e se reencontram, linhas de pré-requisito e um painel que diz, em texto, o que falta para abrir um nó.
 * Carregada sob demanda (`lazy`) pelo `TalentTreeCard` (o resumo da `StatsPage`), junto com a arte (`utils/talentArt.ts`).
 *
 * Regras: tudo vem de `utils/talents.ts` (pontos, graus, pré-requisitos, respec); o desenho vem de `utils/talentLayout.ts`.
 * A tela só mostra e chama os puros. Local-first: o pick vale na hora e o servidor valida na sincronia (poda o que viola
 * pré-requisito, descarta o que é malformado). Nós são BOTÕES HTML (foco, rótulo, teclado) sobre um SVG só de linhas.
 * Teclado: Tab entra no tabuleiro (um nó com tabindex 0), setas andam entre vizinhos, Enter/Espaço selecionam.
 * Copy (`copy.semFomo`): sem cobrança, sem contagem que apressa. "Vínculo N", nunca "nível".
 */
import { useEffect, useRef, useState } from 'react';
import { useGameStateOptional } from '../contexts/GameStateContext';
import { bondLevelFor } from '../utils/bond';
import {
  TALENT_TREE, TALENT_BY_ID, ranksOf, talentPointsFor, pointsLeft, canPick, pickTalent, isPickable, respecCost, applyRespec,
  sanitizeTalentPicks, canRespecOne, respecOneCost, applyRespecOne, prereqsMet, missingPrereqs, canTakeBack, type TalentNode, type TalentPath, type TalentReq,
} from '../utils/talents';
import { LAYOUT_NODES, LAYOUT_EDGES, BOARD, NODE_SIZE, HUB, HUB_POINT, ARM_ANGLE, pointOf, neighborIn } from '../utils/talentLayout';
import { loadTalentArt } from '../utils/talentArt';
import { spendBits } from '../utils/equipment';
import { TALENT_COPY } from '../utils/talentCopy';

const PATHS: readonly { id: TalentPath; art: string; root: string; pt: string; en: string; hintPt: string; hintEn: string }[] = [
  { id: 'pvp', art: 'talent-path-pvp', root: 'talent-root-pvp', pt: 'Duelo', en: 'Duel', hintPt: 'Vale só nos Duelos e no Torneio.', hintEn: 'Counts only in Duels and the Tournament.' },
  { id: 'pve', art: 'talent-path-pve', root: 'talent-root-pve', pt: 'Fenda', en: 'Rift', hintPt: 'Vale na Arena, na Masmorra e no Pesadelo.', hintEn: 'Counts in the Arena, Dungeon and Nightmare.' },
  { id: 'comercio', art: 'talent-path-comercio', root: 'talent-root-com', pt: 'Comércio', en: 'Trade', hintPt: 'Mexe em preço e em ganho de moeda, nunca em combate.', hintEn: 'Touches prices and coin gains, never combat.' },
];

const ZOOMS = [0.5, 0.65, 0.8, 1, 1.25] as const;

/** Carrega a peça e devolve a URL (ou `null`: a tela segue sem a imagem). */
function useArt(nome: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let vivo = true;
    void loadTalentArt(nome).then((u) => { if (vivo) setUrl(u); });
    return () => { vivo = false; };
  }, [nome]);
  return url;
}

function Art({ nome, size, style }: { nome: string; size: number; style?: React.CSSProperties }) {
  const url = useArt(nome);
  if (!url) return <span aria-hidden="true" style={{ width: size, height: size, display: 'inline-block', ...style }} />;
  return <img src={url} alt="" aria-hidden="true" draggable={false} width={size} height={size} style={{ width: size, height: size, objectFit: 'contain', imageRendering: 'pixelated', ...style }} />;
}

type NodeState = 'bought' | 'available' | 'locked' | 'soon';

export default function TalentTree({ language = 'pt-BR' }: { language?: string }) {
  const ctx = useGameStateOptional();
  const [confirmando, setConfirmando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [sel, setSel] = useState<string>(TALENT_TREE[0].id);
  const [zoomIdx, setZoomIdx] = useState(1);
  const boardRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // O hub fica no meio da janela de rolagem ao abrir e a cada zoom (o tabuleiro é maior que a tela).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const z = ZOOMS[zoomIdx];
    el.scrollLeft = HUB_POINT.x * z - el.clientWidth / 2;
    el.scrollTop = HUB_POINT.y * z - el.clientHeight / 2;
  }, [zoomIdx, !!ctx]);
  if (!ctx) return null; // sem save (demo, testes): não há o que gastar
  const isPt = language === 'pt-BR';
  const { gameState, setGameState } = ctx;
  const bond = bondLevelFor(gameState.totalXP ?? 0);
  // Defensivo: a tela nunca mostra um vetor que o servidor descartaria.
  const picks = sanitizeTalentPicks(gameState.talentPicks, bond);
  const total = talentPointsFor(bond);
  const livres = pointsLeft(picks, bond);
  const graus = ranksOf(picks);
  const custo = respecCost(picks);

  const comprar = (id: string) => {
    setAviso(null);
    setGameState((prev) => {
      const b = bondLevelFor(prev.totalXP ?? 0);
      const atuais = sanitizeTalentPicks(prev.talentPicks, b);
      const novo = pickTalent(atuais, id, b);
      return novo === atuais ? prev : { ...prev, talentPicks: [...novo] };
    });
  };

  const refazer = () => {
    const r = applyRespec({ talentPicks: picks, gamePoints: gameState.gamePoints ?? 0 });
    if (!r.ok) {
      setAviso(r.reason === 'no-bits'
        ? (isPt ? `Refazer custa ${r.cost} Bits. Você pode voltar quando tiver juntado.` : `Rebuilding costs ${r.cost} Bits. Come back whenever you have them.`)
        : null);
      setConfirmando(false);
      return;
    }
    setGameState((prev) => {
      const re = applyRespec({ talentPicks: sanitizeTalentPicks(prev.talentPicks, bondLevelFor(prev.totalXP ?? 0)), gamePoints: prev.gamePoints ?? 0 });
      return re.ok ? spendBits({ ...prev, talentPicks: [] }, re.cost) : prev;
    });
    setConfirmando(false);
    setAviso(isPt ? 'Árvore refeita. Os pontos voltaram todos.' : 'Tree rebuilt. All points are back.');
  };

  const umPorVez = canRespecOne(picks);
  const custoUm = respecOneCost(picks);
  const tirarUm = (id: string) => {
    const r = applyRespecOne({ talentPicks: picks, gamePoints: gameState.gamePoints ?? 0 }, id);
    if (!r.ok) {
      setAviso(r.reason === 'no-bits'
        ? (isPt ? `Tirar um ponto custa ${r.cost} Bits. Você pode voltar quando tiver juntado.` : `Taking back one point costs ${r.cost} Bits. Come back whenever you have them.`)
        : r.reason === 'needed' ? (isPt ? 'Outro nó depende deste grau.' : 'Another node depends on this rank.') : null);
      return;
    }
    setGameState((prev) => {
      const re = applyRespecOne({ talentPicks: sanitizeTalentPicks(prev.talentPicks, bondLevelFor(prev.totalXP ?? 0)), gamePoints: prev.gamePoints ?? 0 }, id);
      return re.ok ? spendBits({ ...prev, talentPicks: re.state.talentPicks }, re.cost) : prev;
    });
    setAviso(isPt ? 'Um ponto voltou para você.' : 'One point is back with you.');
  };

  const estado = picks.length === 0
    ? (isPt ? 'Árvore vazia. Cada Vínculo traz um ponto.' : 'Empty tree. Each Bond brings one point.')
    : livres === 0
      ? (isPt ? 'Todos os pontos estão gastos.' : 'All points are spent.')
      : (isPt ? `${livres} ${livres === 1 ? 'ponto' : 'pontos'} para gastar.` : `${livres} ${livres === 1 ? 'point' : 'points'} to spend.`);

  const nome = (id: string) => {
    const t = TALENT_COPY[id];
    return t ? (isPt ? t.namePt : t.nameEn) : id;
  };
  const stateOf = (n: TalentNode): NodeState => {
    if (!isPickable(n)) return 'soon';
    if ((graus.get(n.id) ?? 0) > 0) return 'bought';
    return prereqsMet(n, graus) ? 'available' : 'locked';
  };
  const reqTxt = (r: TalentReq) => (isPt ? `${nome(r.id)} com ${r.rank} ${r.rank === 1 ? 'grau' : 'graus'}` : `${nome(r.id)} at rank ${r.rank}`);
  /** Em texto, o que falta para abrir o nó (nunca só uma linha apagada). */
  const faltaTxt = (n: TalentNode): string | null => {
    const m = missingPrereqs(n, graus);
    const partes: string[] = [];
    if (m.all.length) partes.push(m.all.map(reqTxt).join(isPt ? ' e ' : ' and '));
    if (m.any.length) partes.push((isPt ? 'um destes: ' : 'one of: ') + m.any.map(reqTxt).join(isPt ? ' ou ' : ' or '));
    if (!partes.length) return null;
    return (isPt ? 'Para abrir, falta ' : 'To open it you still need ') + partes.join(isPt ? ', além de ' : ', plus ') + '.';
  };
  const STATE_LABEL: Record<NodeState, [string, string]> = {
    bought: ['comprado', 'bought'], available: ['disponível', 'available'], locked: ['trancado', 'locked'], soon: ['em breve', 'coming soon'],
  };

  const foco = (id: string) => {
    setSel(id);
    boardRef.current?.querySelector<HTMLButtonElement>(`[data-talent="${id}"]`)?.focus();
  };
  const onKey = (e: React.KeyboardEvent, id: string) => {
    const dir = ({ ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' } as const)[e.key as 'ArrowLeft'];
    if (!dir) return;
    e.preventDefault();
    const next = neighborIn(id, dir);
    if (next) foco(next);
  };

  const zoom = ZOOMS[zoomIdx];
  const node = TALENT_BY_ID.get(sel)!;
  const nodeState = stateOf(node);
  const g = graus.get(node.id) ?? 0;
  const txt = TALENT_COPY[node.id];
  const falta = nodeState === 'locked' || nodeState === 'soon' ? faltaTxt(node) : null;
  const pode = isPickable(node) && canPick(picks, node.id, bond);
  const semPonto = nodeState !== 'soon' && g < node.maxRank && prereqsMet(node, graus) && livres === 0;
  const podeTirar = umPorVez && g > 0 && canTakeBack(picks, node.id);

  const boughtOf = (id: string) => id === HUB || (graus.get(id) ?? 0) > 0;

  return (
    <section className="sm2-stats-card" aria-labelledby="sm2-talent-title" data-talent-tree>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Art nome="talent-point-chip" size={24} />
        <p id="sm2-talent-title" className="sm2-stats-lab" style={{ margin: 0 }}>{isPt ? 'Talentos do Vínculo' : 'Bond talents'}</p>
      </div>
      <p className="sm2-stats-s" data-talent-state aria-live="polite">
        {isPt ? `Vínculo ${bond} · ${picks.length}/${total} pontos gastos. ` : `Bond ${bond} · ${picks.length}/${total} points spent. `}
        {estado}
      </p>
      <p className="sm2-stats-s">
        {isPt
          ? 'Os pontos nunca dão para tudo: escolha o caminho. Somando talento, equipamento e Comércio, o bônus de combate para em 5%. Nada disto se compra com dinheiro.'
          : 'Points never cover everything, so pick a path. Talent, equipment and Trade together cap combat bonus at 5%. None of it can be bought with real money.'}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }} role="group" aria-label={isPt ? 'Zoom da árvore' : 'Tree zoom'}>
        <button type="button" className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline" data-talent-zoom="out" disabled={zoomIdx === 0}
          onClick={() => setZoomIdx((z) => Math.max(0, z - 1))} aria-label={isPt ? 'Afastar' : 'Zoom out'}>−</button>
        <span className="sm2-stats-s sm2-num" aria-live="polite">{Math.round(zoom * 100)}%</span>
        <button type="button" className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline" data-talent-zoom="in" disabled={zoomIdx === ZOOMS.length - 1}
          onClick={() => setZoomIdx((z) => Math.min(ZOOMS.length - 1, z + 1))} aria-label={isPt ? 'Aproximar' : 'Zoom in'}>+</button>
      </div>

      <div className="sm-talent-scroll" ref={scrollRef} tabIndex={-1} style={{ overflow: 'auto', maxHeight: '62vh', marginTop: 8, borderRadius: 12, border: '1px solid var(--sm2-outline-variant, rgba(128,128,128,.3))' }}>
        <div style={{ width: BOARD.width * zoom, height: BOARD.height * zoom, position: 'relative' }}>
          <div ref={boardRef} role="group" aria-label={isPt ? 'Árvore de talentos' : 'Talent tree'}
            style={{ position: 'absolute', left: 0, top: 0, width: BOARD.width, height: BOARD.height, transform: `scale(${zoom})`, transformOrigin: '0 0' }}>
            <svg width={BOARD.width} height={BOARD.height} aria-hidden="true" style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}>
              {LAYOUT_EDGES.map((e) => {
                const a = pointOf(e.from), b = pointOf(e.to);
                const to = TALENT_BY_ID.get(e.to)!;
                const on = boughtOf(e.from) && boughtOf(e.to);
                const open = boughtOf(e.from) && stateOf(to) === 'available';
                return (
                  <line key={`${e.from}>${e.to}`} data-edge={`${e.from}>${e.to}`} data-edge-state={on ? 'bought' : open ? 'open' : 'locked'}
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y} strokeLinecap="round"
                    stroke={on ? 'var(--sm2-primary, #5ee)' : open ? 'var(--sm2-primary, #5ee)' : 'var(--sm2-outline, #888)'}
                    strokeWidth={on ? 5 : 3} strokeOpacity={on ? 1 : open ? 0.7 : 0.35} strokeDasharray={e.any ? '2 9' : on || open ? undefined : '10 8'} />
                );
              })}
            </svg>

            <div aria-hidden="true" style={{ position: 'absolute', left: HUB_POINT.x - 36, top: HUB_POINT.y - 36, width: 72, height: 72, display: 'grid', placeItems: 'center', borderRadius: '50%', border: '2px solid var(--sm2-primary, #5ee)', background: 'var(--sm2-surface, rgba(0,0,0,.25))' }}>
              <Art nome="talent-point-chip" size={40} />
            </div>

            {PATHS.map((p) => {
              const a = (ARM_ANGLE[p.id] * Math.PI) / 180;
              const rx = HUB_POINT.x + Math.cos(a) * 62, ry = HUB_POINT.y + Math.sin(a) * 62;
              return (
                <div key={p.id} data-talent-path={p.id} style={{ position: 'absolute', left: rx - 70, top: ry - 22, width: 140, textAlign: 'center', pointerEvents: 'none' }}>
                  <Art nome={p.root} size={28} style={{ display: 'block', margin: '0 auto' }} />
                  <span className="sm2-stats-s" style={{ fontWeight: 600 }}>{isPt ? p.pt : p.en}</span>
                </div>
              );
            })}

            {LAYOUT_NODES.map((ln) => {
              const n = TALENT_BY_ID.get(ln.id)!;
              const st = stateOf(n);
              const gr = graus.get(n.id) ?? 0;
              const frame = st === 'bought' ? 'talent-node-bought' : st === 'available' ? 'talent-node-available' : 'talent-node-locked';
              return (
                <button
                  key={n.id}
                  type="button"
                  data-talent={n.id}
                  data-state={st}
                  className="sm-talent-node"
                  tabIndex={sel === n.id ? 0 : -1}
                  aria-current={sel === n.id ? 'true' : undefined}
                  aria-label={`${nome(n.id)}, ${isPickable(n) ? `${gr}/${n.maxRank}` : ''} ${STATE_LABEL[st][isPt ? 0 : 1]}`}
                  onClick={() => setSel(n.id)}
                  onKeyDown={(e) => onKey(e, n.id)}
                  style={{ position: 'absolute', left: ln.x - NODE_SIZE / 2, top: ln.y - NODE_SIZE / 2, width: NODE_SIZE, height: NODE_SIZE, padding: 0, border: 0, background: 'none', cursor: 'pointer', opacity: st === 'soon' ? 0.55 : 1, outlineOffset: 3, outline: sel === n.id ? '2px solid var(--sm2-primary, #5ee)' : undefined, borderRadius: 12 }}
                >
                  <Art nome={frame} size={NODE_SIZE} style={{ position: 'absolute', left: 0, top: 0 }} />
                  <Art nome={n.id} size={34} style={{ position: 'absolute', left: 11, top: 11, opacity: st === 'locked' ? 0.45 : 1 }} />
                  {isPickable(n) && <span className="sm2-num" aria-hidden="true" style={{ position: 'absolute', right: -4, bottom: -6, fontSize: 11, padding: '0 4px', borderRadius: 8, background: 'var(--sm2-surface, #111)', color: 'var(--sm2-on-surface, #fff)' }}>{gr}/{n.maxRank}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div data-talent-panel={node.id} style={{ marginTop: 12, display: 'grid', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Art nome={node.id} size={32} />
          <b style={{ fontWeight: 500 }}>{nome(node.id)}</b>
          <span className="sm2-num">{isPickable(node) ? `${g}/${node.maxRank}` : (isPt ? 'em breve' : 'soon')}</span>
        </div>
        <p className="sm2-stats-s" style={{ margin: 0 }}>{txt ? (isPt ? txt.descPt : txt.descEn) : ''}</p>
        {falta && <p className="sm2-stats-s" data-talent-missing role="status" style={{ margin: 0 }}>{falta}</p>}
        {semPonto && <p className="sm2-stats-s" style={{ margin: 0 }}>{isPt ? 'Sem pontos livres agora. Cada Vínculo traz um novo.' : 'No free points right now. Each Bond brings a new one.'}</p>}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {isPickable(node) && (
            <button type="button" className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-primary" data-talent-buy={node.id} disabled={!pode} onClick={() => comprar(node.id)}
              aria-label={isPt ? `Pôr um ponto em ${nome(node.id)}` : `Put a point into ${nome(node.id)}`}>+1</button>
          )}
          {isPickable(node) && umPorVez && g > 0 && (
            <button type="button" className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-ghost" data-talent-respec-one={node.id} disabled={!podeTirar} onClick={() => tirarUm(node.id)}
              aria-label={isPt ? `Tirar um ponto de ${nome(node.id)} (${custoUm} Bits)` : `Take one point back from ${nome(node.id)} (${custoUm} Bits)`}>−1</button>
          )}
        </div>
        {isPickable(node) && umPorVez && g > 0 && !podeTirar && (
          <p className="sm2-stats-s" style={{ margin: 0 }}>{isPt ? 'Outro nó depende deste grau. Tire primeiro o que ele abriu.' : 'Another node depends on this rank. Take back what it opened first.'}</p>
        )}
      </div>

      <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
        {!confirmando ? (
          <button
            type="button"
            className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-ghost"
            disabled={picks.length === 0}
            onClick={() => { setAviso(null); setConfirmando(true); }}
          >
            <Art nome="talent-respec" size={20} />
            {isPt ? `Refazer a árvore (${custo} Bits)` : `Rebuild the tree (${custo} Bits)`}
          </button>
        ) : (
          <div role="group" aria-label={isPt ? 'Confirmar' : 'Confirm'} style={{ display: 'grid', gap: 8 }}>
            <p className="sm2-stats-s" style={{ margin: 0 }}>
              {isPt ? `Refazer custa ${custo} Bits (moeda que você ganhou jogando) e devolve todos os pontos.` : `Rebuilding costs ${custo} Bits (coin you earned by playing) and gives every point back.`}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-primary" onClick={refazer}>{isPt ? 'Refazer' : 'Rebuild'}</button>
              <button type="button" className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-quiet" onClick={() => setConfirmando(false)}>{isPt ? 'Agora não' : 'Not now'}</button>
            </div>
          </div>
        )}
        {aviso && <p className="sm2-stats-s" role="status" data-talent-aviso>{aviso}</p>}
      </div>
    </section>
  );
}
