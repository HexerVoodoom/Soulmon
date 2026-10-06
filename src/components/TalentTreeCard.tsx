/**
 * Combate v3 / PR7 — a árvore de talentos do usuário (o Vínculo é o level dele). Carregada sob demanda pela
 * `StatsPage` (`lazy`), junto com a arte (`utils/talentArt.ts`).
 *
 * Todas as regras vêm de `utils/talents.ts` (pontos, graus, respec) e `utils/gates.ts`. A tela só mostra e
 * chama os puros. Estados: árvore vazia, pontos disponíveis, todos gastos, respec sem Bits. Local-first: o
 * pick vale na hora e o servidor valida na sincronia (vetor inválido é descartado lá, nunca "corrigido").
 *
 * Copy (`copy.semFomo`): sem cobrança, sem contagem que apressa. "Vínculo N", nunca "nível".
 */
import { useEffect, useState } from 'react';
import { useGameStateOptional } from '../contexts/GameStateContext';
import { bondLevelFor } from '../utils/bond';
import {
  TALENT_TREE, ranksOf, talentPointsFor, pointsLeft, canPick, pickTalent, isPickable, respecCost, applyRespec,
  sanitizeTalentPicks, canRespecOne, respecOneCost, applyRespecOne, type TalentNode, type TalentPath,
} from '../utils/talents';
import { loadTalentArt } from '../utils/talentArt';
import { TALENT_COPY } from '../utils/talentCopy';

const PATHS: readonly { id: TalentPath; art: string; pt: string; en: string; hintPt: string; hintEn: string }[] = [
  { id: 'pvp', art: 'talent-path-pvp', pt: 'Duelo', en: 'Duel', hintPt: 'Vale só nos Duelos e no Torneio.', hintEn: 'Counts only in Duels and the Tournament.' },
  { id: 'pve', art: 'talent-path-pve', pt: 'Fenda', en: 'Rift', hintPt: 'Vale na Arena, na Masmorra e no Pesadelo.', hintEn: 'Counts in the Arena, Dungeon and Nightmare.' },
  { id: 'comercio', art: 'talent-path-comercio', pt: 'Comércio', en: 'Trade', hintPt: 'Mexe em preço e em ganho de moeda, nunca em combate.', hintEn: 'Touches prices and coin gains, never combat.' },
];

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

function Art({ nome, size }: { nome: string; size: number }) {
  const url = useArt(nome);
  if (!url) return <span aria-hidden="true" style={{ width: size, height: size, display: 'inline-block' }} />;
  return <img src={url} alt="" aria-hidden="true" draggable={false} width={size} height={size} style={{ width: size, height: size, objectFit: 'contain', imageRendering: 'pixelated' }} />;
}

export default function TalentTreeCard({ language = 'pt-BR' }: { language?: string }) {
  const ctx = useGameStateOptional();
  const [confirmando, setConfirmando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
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
      return re.ok ? { ...prev, talentPicks: [], gamePoints: re.state.gamePoints } : prev;
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
        : null);
      return;
    }
    setGameState((prev) => {
      const re = applyRespecOne({ talentPicks: sanitizeTalentPicks(prev.talentPicks, bondLevelFor(prev.totalXP ?? 0)), gamePoints: prev.gamePoints ?? 0 }, id);
      return re.ok ? { ...prev, talentPicks: re.state.talentPicks, gamePoints: re.state.gamePoints } : prev;
    });
    setAviso(isPt ? 'Um ponto voltou para você.' : 'One point is back with you.');
  };

  const estado = picks.length === 0
    ? (isPt ? 'Árvore vazia. Cada Vínculo traz um ponto.' : 'Empty tree. Each Bond brings one point.')
    : livres === 0
      ? (isPt ? 'Todos os pontos estão gastos.' : 'All points are spent.')
      : (isPt ? `${livres} ${livres === 1 ? 'ponto' : 'pontos'} para gastar.` : `${livres} ${livres === 1 ? 'point' : 'points'} to spend.`);

  const nodo = (n: TalentNode) => {
    const g = graus.get(n.id) ?? 0;
    const pegavel = isPickable(n);
    const pode = pegavel && canPick(picks, n.id, bond);
    const txt = TALENT_COPY[n.id];
    const nome = txt ? (isPt ? txt.namePt : txt.nameEn) : n.id;
    return (
      <li key={n.id} data-talent={n.id} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: pegavel ? 1 : 0.6 }}>
        <Art nome={n.id} size={32} />
        <span style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontWeight: 500 }}>{nome}</b>{' '}
          <span className="sm2-num">{pegavel ? `${g}/${n.maxRank}` : (isPt ? 'em breve' : 'soon')}</span>
          <br />
          <span className="sm2-stats-s">{txt ? (isPt ? txt.descPt : txt.descEn) : ''}</span>
        </span>
        {pegavel && (
          <button
            type="button"
            className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline"
            disabled={!pode}
            onClick={() => comprar(n.id)}
            aria-label={isPt ? `Pôr um ponto em ${nome}` : `Put a point into ${nome}`}
          >
            +1
          </button>
        )}
        {pegavel && umPorVez && g > 0 && (
          <button
            type="button"
            className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-ghost"
            data-talent-respec-one={n.id}
            onClick={() => tirarUm(n.id)}
            aria-label={isPt ? `Tirar um ponto de ${nome} (${custoUm} Bits)` : `Take one point back from ${nome} (${custoUm} Bits)`}
          >
            −1
          </button>
        )}
      </li>
    );
  };

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
      {PATHS.map((p) => (
        <div key={p.id} data-talent-path={p.id} style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Art nome={p.art} size={24} />
            <h3 style={{ margin: 0, fontWeight: 500 }}>{isPt ? p.pt : p.en}</h3>
          </div>
          <p className="sm2-stats-s" style={{ margin: '2px 0 6px' }}>{isPt ? p.hintPt : p.hintEn}</p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 10 }}>
            {TALENT_TREE.filter((n) => n.path === p.id).map(nodo)}
          </ul>
        </div>
      ))}
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
