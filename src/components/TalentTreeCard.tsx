/**
 * Tarefa B (§2.37) — o RESUMO dos talentos na `StatsPage`: pontos, uma linha e o botão que MONTA a árvore. A árvore em si
 * (`TalentTree`, com o SVG, os nós e a arte) só é baixada quando a pessoa abre: nada dela entra no chunk da página.
 * Montagem, não navegação: um nó selecionado não se perde ao recolher, porque recolher desmonta e reabrir recomeça.
 */
import { lazy, Suspense, useState } from 'react';
import { useGameStateOptional } from '../contexts/GameStateContext';
import { bondLevelFor } from '../utils/bond';
import { sanitizeTalentPicks, talentPointsFor, pointsLeft } from '../utils/talents';

const TalentTree = lazy(() => import('./TalentTree'));

export default function TalentTreeCard({ language = 'pt-BR' }: { language?: string }) {
  const ctx = useGameStateOptional();
  const [aberta, setAberta] = useState(false);
  if (!ctx) return null; // sem save (demo, testes): não há o que gastar
  const isPt = language === 'pt-BR';
  const bond = bondLevelFor(ctx.gameState.totalXP ?? 0);
  const picks = sanitizeTalentPicks(ctx.gameState.talentPicks, bond);
  const livres = pointsLeft(picks, bond);
  const resumo = isPt
    ? `Vínculo ${bond} · ${picks.length}/${talentPointsFor(bond)} pontos gastos${livres > 0 ? ` · ${livres} ${livres === 1 ? 'livre' : 'livres'}` : ''}.`
    : `Bond ${bond} · ${picks.length}/${talentPointsFor(bond)} points spent${livres > 0 ? ` · ${livres} free` : ''}.`;
  return (
    <>
      <section className="sm2-stats-card" aria-labelledby="sm2-talent-sum" data-talent-summary>
        <p id="sm2-talent-sum" className="sm2-stats-lab" style={{ margin: 0 }}>{isPt ? 'Talentos do Vínculo' : 'Bond talents'}</p>
        <p className="sm2-stats-s">{resumo}</p>
        <button type="button" className="sm2-kit-btn sm2-kit-btn-sm sm2-kit-btn-outline" aria-expanded={aberta} data-talent-toggle onClick={() => setAberta((v) => !v)}>
          {aberta ? (isPt ? 'Recolher a árvore' : 'Fold the tree') : (isPt ? 'Abrir a árvore' : 'Open the tree')}
        </button>
      </section>
      {aberta && (
        <Suspense fallback={null}>
          <TalentTree language={language} />
        </Suspense>
      )}
    </>
  );
}
