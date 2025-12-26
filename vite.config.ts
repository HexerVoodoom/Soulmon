
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      manifest: {
        name: 'DigiApp - Gamified Productivity',
        short_name: 'DigiApp',
        description: 'Gamified Productivity App',
        theme_color: '#ffffff',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        icons: [
          {
            src: 'favicon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'favicon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      'vaul@1.1.2': 'vaul',
      'sonner@2.0.3': 'sonner',
      'recharts@2.15.2': 'recharts',
      'react-resizable-panels@2.1.7': 'react-resizable-panels',
      'react-hook-form@7.55.0': 'react-hook-form',
      'react-day-picker@8.10.1': 'react-day-picker',
      'next-themes@0.4.6': 'next-themes',
      'lucide-react@0.487.0': 'lucide-react',
      'input-otp@1.4.2': 'input-otp',
      'figma:asset/cfe5f78d2ba5745cf2fab94f2ea9e70d1b5bfc0a.png': path.resolve(__dirname, './src/assets/cfe5f78d2ba5745cf2fab94f2ea9e70d1b5bfc0a.png'),
      'figma:asset/cc04120f94ce0a4ae081b26d2359ca0dd7488f6d.png': path.resolve(__dirname, './src/assets/cc04120f94ce0a4ae081b26d2359ca0dd7488f6d.png'),
      'figma:asset/99ff747d7f7ecc2424e131a43c54669bcba9a301.png': path.resolve(__dirname, './src/assets/99ff747d7f7ecc2424e131a43c54669bcba9a301.png'),
      'figma:asset/91974d820051b34dd9e9db8f1b4f72ae1216ed98.png': path.resolve(__dirname, './src/assets/91974d820051b34dd9e9db8f1b4f72ae1216ed98.png'),
      'figma:asset/90d2794255a0abd49ab9e2ca8c9f1c54b45d7cd0.png': path.resolve(__dirname, './src/assets/90d2794255a0abd49ab9e2ca8c9f1c54b45d7cd0.png'),
      'figma:asset/9087038914d85d3c74c1b4c1fb6e2b91f486cbee.png': path.resolve(__dirname, './src/assets/9087038914d85d3c74c1b4c1fb6e2b91f486cbee.png'),
      'figma:asset/8deb0c4ab0625c36e8f7d8484d047391e366e6cd.png': path.resolve(__dirname, './src/assets/8deb0c4ab0625c36e8f7d8484d047391e366e6cd.png'),
      'figma:asset/7e77e9ec45ca6381843c93b205d4f8cdd7ddf568.png': path.resolve(__dirname, './src/assets/7e77e9ec45ca6381843c93b205d4f8cdd7ddf568.png'),
      'figma:asset/7d2b0a9b519f16f1d0a258d9670cfc62230e1903.png': path.resolve(__dirname, './src/assets/7d2b0a9b519f16f1d0a258d9670cfc62230e1903.png'),
      'figma:asset/7bc96986446973a3544f57a9055e59fc87022f42.png': path.resolve(__dirname, './src/assets/7bc96986446973a3544f57a9055e59fc87022f42.png'),
      'figma:asset/7b96e3369daf15ffc8ed062b986db273c0416930.png': path.resolve(__dirname, './src/assets/7b96e3369daf15ffc8ed062b986db273c0416930.png'),
      'figma:asset/7ad0373538d7e96df49e437c4c65f56e56ae6f30.png': path.resolve(__dirname, './src/assets/7ad0373538d7e96df49e437c4c65f56e56ae6f30.png'),
      'figma:asset/797dcc096094cec27969dafb7d0d37cddbe6a1d5.png': path.resolve(__dirname, './src/assets/797dcc096094cec27969dafb7d0d37cddbe6a1d5.png'),
      'figma:asset/7342065b1193c2befe599eb2d86ef8641f1a596c.png': path.resolve(__dirname, './src/assets/7342065b1193c2befe599eb2d86ef8641f1a596c.png'),
      'figma:asset/66717674e9ddce8b8e301126dbc9422279967bda.png': path.resolve(__dirname, './src/assets/66717674e9ddce8b8e301126dbc9422279967bda.png'),
      'figma:asset/61935125c675c3d79b74bdfbb783563de187250a.png': path.resolve(__dirname, './src/assets/61935125c675c3d79b74bdfbb783563de187250a.png'),
      'figma:asset/58d45f952e9e7f056445aa37544fa488bbfda16f.png': path.resolve(__dirname, './src/assets/58d45f952e9e7f056445aa37544fa488bbfda16f.png'),
      'figma:asset/50a3811e08593d7a5f52463335a0bdcb7a2e181f.png': path.resolve(__dirname, './src/assets/50a3811e08593d7a5f52463335a0bdcb7a2e181f.png'),
      'figma:asset/4545c1113c2742541bfa287e8aaad34d540d5188.png': path.resolve(__dirname, './src/assets/4545c1113c2742541bfa287e8aaad34d540d5188.png'),
      'figma:asset/439ea88abadb584d8abd075df0fff253301f3fcf.png': path.resolve(__dirname, './src/assets/439ea88abadb584d8abd075df0fff253301f3fcf.png'),
      'figma:asset/2f5fefb3d68da3d20ef1d5195a8f0ddc506b1149.png': path.resolve(__dirname, './src/assets/2f5fefb3d68da3d20ef1d5195a8f0ddc506b1149.png'),
      'figma:asset/2289f0ba6bd5182e66b3253be305d6860dbe1148.png': path.resolve(__dirname, './src/assets/2289f0ba6bd5182e66b3253be305d6860dbe1148.png'),
      'figma:asset/15b86f9a6a117217f92fc8c35383b8ba7a68d995.png': path.resolve(__dirname, './src/assets/15b86f9a6a117217f92fc8c35383b8ba7a68d995.png'),
      'figma:asset/104dc13e2c146bb51e00903d6eaa5f6fae7619c6.png': path.resolve(__dirname, './src/assets/104dc13e2c146bb51e00903d6eaa5f6fae7619c6.png'),
      'embla-carousel-react@8.6.0': 'embla-carousel-react',
      'cmdk@1.1.1': 'cmdk',
      'class-variance-authority@0.7.1': 'class-variance-authority',
      '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
      '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
      '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
      '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
      '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
      '@radix-ui/react-slider@1.2.3': '@radix-ui/react-slider',
      '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
      '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
      '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
      '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
      '@radix-ui/react-progress@1.1.2': '@radix-ui/react-progress',
      '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
      '@radix-ui/react-navigation-menu@1.2.5': '@radix-ui/react-navigation-menu',
      '@radix-ui/react-menubar@1.1.6': '@radix-ui/react-menubar',
      '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
      '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
      '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
      '@radix-ui/react-context-menu@2.2.6': '@radix-ui/react-context-menu',
      '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
      '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
      '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
      '@radix-ui/react-aspect-ratio@1.1.2': '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
      '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
      '@jsr/supabase__supabase-js@2.49.8': '@jsr/supabase__supabase-js',
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
  },
  server: {
    port: 3000,
    open: true,
  },
});