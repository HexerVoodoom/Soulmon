# DigiApp PWA Setup

## ✅ Arquivos Criados

- **manifest.json** - Configuração PWA completa
- **icon-template.svg** - Template SVG do ícone (512x512)
- **favicon.svg** - Favicon SVG temporário (32x32)

## Manifest.json Configurado ✅

O arquivo `manifest.json` foi criado com a identidade visual do DigiApp:
- **Theme Color**: `#2bff95` (verde-menta vibrante)
- **Background Color**: `#0a0a0a` (preto profundo)
- **Display Mode**: `standalone` (experiência de app nativo)
- **Orientation**: `portrait-primary` (mobile-first)

## Próximos Passos

### 1. Converter SVG para PNG (Ícones PWA)

Você tem duas opções:

#### Opção A: Usar Ferramentas Online (Mais Rápido)
1. Abra `/public/icon-template.svg` no navegador
2. Use uma dessas ferramentas para converter:
   - **CloudConvert**: https://cloudconvert.com/svg-to-png
   - **SVG to PNG Converter**: https://svgtopng.com/
   - **Vertopal**: https://www.vertopal.com/en/svg-to-png/
3. Converta em dois tamanhos:
   - 192x192 → salvar como `favicon-192x192.png`
   - 512x512 → salvar como `favicon-512x512.png`
4. Coloque ambos na pasta `/public/`

#### Opção B: Usar Ferramentas de Design
- **Figma**: Importe o SVG → Exporte como PNG nos tamanhos necessários
- **Canva**: Abra o SVG → Redimensione → Baixe como PNG
- **Photoshop/GIMP**: Abra o SVG → Salve como PNG

### 2. Criar Ícone Personalizado (Opcional)

Se quiser personalizar o design do ícone:
- **Figma**: Crie um novo design → Exporte como SVG → Converta para PNG
- **Canva**: Crie um novo design → Redimensione → Baixe como PNG
- **Photoshop/GIMP**: Crie um novo design → Salve como SVG → Converta para PNG

### 3. Verificar a Referência no HTML

O arquivo HTML principal deve incluir no `<head>`:

```html
<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.json">

<!-- Theme Color -->
<meta name="theme-color" content="#2bff95">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" href="/favicon-192x192.png">

<!-- Standard Favicon -->
<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/favicon-512x512.png">
```

### 4. Testar a PWA

Após criar os ícones:

1. **Chrome DevTools**:
   - Abra DevTools (F12)
   - Vá para "Application" → "Manifest"
   - Verifique se o manifest está carregado corretamente
   - Verifique "Service Workers" se implementado

2. **Lighthouse**:
   - DevTools → "Lighthouse"
   - Rode audit PWA
   - Objetivo: Score 100% em PWA

3. **Instalar no Mobile**:
   - Acesse via navegador mobile
   - Toque no menu → "Add to Home Screen"
   - O app deve aparecer com ícone e nome corretos

### 5. Service Worker (Opcional - Para Offline)

Para tornar o app funcional offline, considere adicionar um Service Worker:

```javascript
// public/service-worker.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('digiapp-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/App.tsx',
        '/styles/globals.css',
        // ... outros recursos críticos
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

## Características do Manifest Atual

```json
{
  "short_name": "DigiApp",
  "name": "DigiApp - Gamified Productivity",
  "description": "Complete real-life tasks to evolve and care for your digital companion",
  "theme_color": "#2bff95",
  "background_color": "#0a0a0a",
  "display": "standalone",
  "orientation": "portrait-primary",
  "categories": ["productivity", "lifestyle", "games"],
  "lang": "pt-BR"
}
```

## Benefícios da PWA

✅ Instalável no dispositivo sem app store  
✅ Funciona offline (com Service Worker)  
✅ Notificações push (se implementado)  
✅ Carregamento rápido  
✅ Experiência nativa de app  
✅ Menor uso de dados  
✅ Auto-atualização  

---

**Status**: ⚠️ Aguardando criação dos ícones PNG