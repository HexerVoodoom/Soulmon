/**
 * ⚒️ A entrada do Soulsmith (08/11/2026, pedido do dono): a Vitra fala no balão da folha (`AreaSheet` + `NpcSpeech`, a mesma
 * fala de `areaNpcVoice` › `forja:ferreiro`) e a folha mostra um texto curto + UM botão primário que abre a Forja de Alma
 * (o mapa em tela cheia da `ForgeCard`, via `onGo`). Nada da forja foi removido: o botão só troca a vista.
 */
import { lazy, Suspense, useState } from 'react';
import { sm2Button, sm2Text } from './form/FormKit';

const ForgeCard = lazy(() => import('./ForgeCard'));

export const SOULSMITH_COPY = {
  en: { intro: 'Your companion’s gear takes shape here. Bring materials and choose what to strengthen.', go: 'Go to the Soul Forge' },
  pt: { intro: 'O equipamento do seu companheiro ganha forma aqui. Traga materiais e escolha o que reforçar.', go: 'Ir para a Forja de Alma' },
} as const;

/** `onGo` (AreaView): abre o mapa da forja em tela cheia; sem ele, a lista da `ForgeCard` monta aqui mesmo. */
export default function SoulsmithSheet({ language = 'en-US', onGo }: { language?: string; onGo?: () => void }) {
  const [forge, setForge] = useState(false);
  const t = language === 'pt-BR' ? SOULSMITH_COPY.pt : SOULSMITH_COPY.en;
  if (forge) {
    return (
      <Suspense fallback={null}>
        <ForgeCard language={language} />
      </Suspense>
    );
  }
  return (
    <div data-soulsmith-intro style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
      <p style={{ ...sm2Text, margin: 0 }}>{t.intro}</p>
      <button type="button" data-soulsmith-go onClick={() => (onGo ? onGo() : setForge(true))} style={{ ...sm2Button('primary'), width: '100%' }}>
        {t.go}
      </button>
    </div>
  );
}
