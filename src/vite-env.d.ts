/// <reference types="vite/client" />

// Figma asset imports resolve to string URLs via vite.config.ts aliases
declare module 'figma:asset/*.png' {
  const url: string;
  export default url;
}

// Versioned package aliases (vite.config.ts maps pkg@version → pkg)
declare module 'lucide-react@*' {
  export * from 'lucide-react';
}
declare module 'sonner@*' {
  export * from 'sonner';
}
declare module 'vaul@*' {
  export * from 'vaul';
}
declare module 'recharts@*' {
  export * from 'recharts';
}
declare module 'cmdk@*' {
  export * from 'cmdk';
}
declare module 'input-otp@*' {
  export * from 'input-otp';
}
declare module 'embla-carousel-react@*' {
  export * from 'embla-carousel-react';
  export { default } from 'embla-carousel-react';
}
declare module 'next-themes@*' {
  export * from 'next-themes';
}
declare module 'react-hook-form@*' {
  export * from 'react-hook-form';
}
declare module 'react-day-picker@*' {
  export * from 'react-day-picker';
}
declare module 'react-resizable-panels@*' {
  export * from 'react-resizable-panels';
}
declare module 'class-variance-authority@*' {
  export * from 'class-variance-authority';
}
// Specific Radix packages that use named imports (export * from the real installed package)
declare module '@radix-ui/react-slot@*' {
  export * from '@radix-ui/react-slot';
}

// Wildcard fallback for all other @radix-ui/* packages (namespace imports)
declare module '@radix-ui/*' {
  const mod: Record<string, any>;
  export = mod;
}
declare module '@jsr/supabase__supabase-js@*' {
  export * from '@jsr/supabase__supabase-js';
}
