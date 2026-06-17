
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import "./index.css";
  import { ErrorBoundary } from './components/ErrorBoundary';
  import { GameStateProvider } from './contexts/GameStateContext';

  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <GameStateProvider>
        <App />
      </GameStateProvider>
    </ErrorBoundary>
  );
