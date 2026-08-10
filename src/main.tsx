
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
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
