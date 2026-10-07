
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
  import { migrateLegacyStorageKeys } from './utils/storageKeys';
  import { armarTemaNoPrimeiroGesto } from './utils/tema';

  // ANTES de montar qualquer provider: o `GameStateProvider` lê o save no
  // inicializador do próprio estado, então uma migração que rodasse depois
  // chegaria tarde. Copia as chaves `digiapp-*` para os nomes novos, uma vez,
  // sem apagar nada — ver o cabeçalho de `migrateLegacyStorageKeys`.
  migrateLegacyStorageKeys();

  // A música-TEMA (S17, 07/10/2026): só instala ouvintes de gesto. Nada toca nem
  // é baixado até o primeiro toque/clique/tecla da sessão — D11, sem autoplay cego.
  armarTemaNoPrimeiroGesto();

  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <ThemeProvider>
        <GameStateProvider>
          <App />
        </GameStateProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );

  // Splash estática do index.html: some com fade assim que o app pinta o
  // primeiro frame (2× rAF = depois do primeiro paint de verdade). Sem timer
  // artificial — a splash dura exatamente o que o carregamento durar. O nó
  // sai do DOM no fim da transição pra não ficar um overlay morto por cima
  // de tudo (mesmo invisível, é um fixed inset-0 no topo do stacking).
  //
  // ⚠️ 27/08/2026 — a rede de segurança vivia DENTRO do duplo rAF, e por isso
  // não era rede de segurança nenhuma: `requestAnimationFrame` NUNCA dispara
  // numa aba em segundo plano (a aba some assim que o app abre atrás de outro
  // app, o celular bloqueia com a tela em carregamento, ou o WebView abre
  // oculto) — e como o `setTimeout` só era agendado DEPOIS do rAF rodar, ele
  // também nunca disparava. Resultado: a splash (fixed, no topo do
  // stacking) ficava para sempre em cima de um app que já tinha carregado
  // por baixo — "não consigo passar da tela de loading", reportado pelo
  // dono. Agora o timeout é agendado NA HORA, fora do rAF: ele dispara
  // independente de a aba estar visível, e some a splash mesmo sem o fade.
  const remover = () => {
    const sp = document.getElementById('splash');
    if (!sp) return;
    sp.remove();
  };
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const sp = document.getElementById('splash');
    if (!sp) return;
    sp.classList.add('done');
    sp.addEventListener('transitionend', remover, { once: true });
  }));
  window.setTimeout(remover, 1200);
