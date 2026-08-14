
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  // Fonte de display do kit pixel (Silkscreen, SIL OFL 1.1 — livre para uso
  // comercial). Importados os subsets `latin` (400/700) e SÓ eles: o subset
  // `latin-ext` desta fonte tem 18 glifos e NENHUM acento do PT-BR — os
  // acentos (ã ç õ á ê …) estão todos no `latin` (U+0000–00FF, 215 glifos,
  // conferidos no cmap do arquivo). Puxar `latin-ext` custaria 6,8 kB para
  // ganhar zero letra que o app use. `font-display: swap` vem do pacote.
  import "@fontsource/silkscreen/latin-400.css";
  import "@fontsource/silkscreen/latin-700.css";
  import "./index.css";
  import { ErrorBoundary } from './components/ErrorBoundary';
  import { GameStateProvider } from './contexts/GameStateContext';
  import { ThemeProvider } from './contexts/ThemeContext';

  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <ThemeProvider>
        <GameStateProvider>
          <App />
        </GameStateProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
