/// <reference types="vite/client" />

// Figma asset imports resolve to string URLs via vite.config.ts aliases
declare module 'figma:asset/*.png' {
  const url: string;
  export default url;
}

// Plain PNG imports (e.g. src/assets/*_dmc.png) resolve to string URLs
declare module '*.png' {
  const url: string;
  export default url;
}

// Versioned package aliases (vite.config.ts maps pkg@version → pkg)
//
// `lucide-react@*` saiu daqui junto com a dependência: era a quarta linguagem
// de ícone do app e o `GameTutorialFlow` (o segundo onboarding, obrigatório)
// foi o último consumidor. Reintroduzir o alias sem reinstalar o pacote deixa
// o reexport apontando para o vazio e o `tsc` acusa — mas o guard
// `src/styles/iconScale.contract.test.ts` acusa antes disso.
// (A linha de import NÃO é reescrita aqui de propósito: o guard detecta a
// FORMA do import e não a menção, então citá-la literalmente reprovaria.)
declare module 'sonner@*' {
  export * from 'sonner';
}
// ⚰️ 21/09/2026 (decisão #33): os `declare module` de `vaul@*`, `recharts@*`,
// `cmdk@*`, `input-otp@*`, `embla-carousel-react@*`, `next-themes@*`,
// `react-hook-form@*`, `react-day-picker@*`, `react-resizable-panels@*`,
// `class-variance-authority@*`, `@radix-ui/react-slot@*`, `@radix-ui/*` e
// `@jsr/supabase__supabase-js@*` saíram junto com os pacotes (38 sem import).
// Guard: `src/deploy/depsVivas.contract.test.ts`.
