/**
 * Tarefa B (§2.37) — a árvore de talentos dentro da `StatsPage` (Santuário do Vínculo). A árvore em si (`TalentTree`, com o SVG,
 * os nós e a arte) é `lazy`: nada dela entra no chunk da página até a Estatística montar.
 *
 * BETA-2 (10.2, 13/10/2026): a árvore nasce ABERTA e a opção de recolher saiu — o botão "Abrir/Recolher a árvore" era um degrau a
 * mais entre a pessoa e o que ela veio ver. O cartão de RESUMO (Vínculo · pontos gastos/livres) saiu junto: a própria árvore já abre
 * com essa linha, e dizê-la duas vezes seguidas era texto redundante. O progresso (`talentPicks`) mora no save e nunca dependeu de
 * abrir ou recolher.
 */
import { lazy, Suspense } from 'react';
import { useGameStateOptional } from '../contexts/GameStateContext';
import { ScreenSkeleton } from './ui/ScreenSkeleton';

const TalentTree = lazy(() => import('./TalentTree'));

export default function TalentTreeCard({ language = 'pt-BR' }: { language?: string }) {
  const ctx = useGameStateOptional();
  if (!ctx) return null; // sem save (demo, testes): não há o que gastar
  return (
    <Suspense fallback={<ScreenSkeleton language={language === 'pt-BR' ? 'pt-BR' : 'en-US'} variant="inline" />}>
      <TalentTree language={language} />
    </Suspense>
  );
}
