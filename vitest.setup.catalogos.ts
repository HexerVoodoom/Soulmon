// Nos testes os catálogos novos (cosméticos e Honra) já nascem injetados: o app os carrega por `import()` antes do 1º render
// (`main.tsx` + `utils/catalogosNovosLoader.ts`), mas o código dos testes lê as listas de forma síncrona.
import { aplicarCatalogosNovos } from './src/utils/catalogosNovos';

aplicarCatalogosNovos();
