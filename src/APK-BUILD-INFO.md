# 📱 DigiApp - Informações Completas para Build APK

> **Última Atualização**: 23 de dezembro de 2024  
> **Versão do App**: 1.0.0  
> **Platform Target**: Android APK via Antigravity/PWABuilder/Capacitor

---

## 🔐 CREDENCIAIS E CHAVES DE ACESSO

### Supabase Backend

```
Project ID: evvcdsnijxbyctipfnkt
Project URL: https://evvcdsnijxbyctipfnkt.supabase.co
Anon Public Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2dmNkc25panhieWN0aXBmbmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwOTA4MzYsImV4cCI6MjA3ODY2NjgzNn0.XqluSl53fBP9ys_ynSD95_FAVkeLvYVZN65_stE0XDA
```

**Edge Function Endpoint**:
```
https://evvcdsnijxbyctipfnkt.supabase.co/functions/v1/make-server-7de212d9
```

**Credenciais adicionais** (já configuradas no servidor, NÃO expor no APK):
- SUPABASE_SERVICE_ROLE_KEY: [Configurada no servidor]
- SUPABASE_DB_URL: [Configurada no servidor]

### API Groq (IA Chat)

```
Variável de Ambiente: GROQ_API_KEY
Status: ✅ Configurada no servidor Supabase
Endpoint: Chamado via Edge Function (não requer configuração no APK)
```

**IMPORTANTE**: As chaves sensíveis estão armazenadas no servidor Supabase Edge Functions e NÃO devem ser incluídas no código do APK. O app mobile faz requisições apenas com a `Anon Public Key`.

---

## 📁 ESTRUTURA DE ARQUIVOS DO PROJETO

### Arquivos Principais

```
/
├── App.tsx                          # Componente principal (entrypoint)
├── index.html                       # HTML principal (se existir)
│
├── /public/                         # Assets públicos
│   ├── manifest.json               # ✅ PWA manifest (OBRIGATÓRIO)
│   ├── favicon.svg                 # ✅ Favicon SVG
│   ├── icon-template.svg           # Template do ícone
│   ├── browserconfig.xml           # Config Windows
│   ├── index.html.example          # Exemplo de HTML
│   ├── PWA-SETUP.md               # Documentação PWA
│   ├── PWA-CHECKLIST.md           # Checklist PWA
│   │
│   └── [PENDENTE] Ícones PNG:
│       ├── favicon-192x192.png    # ⚠️ CRIAR ANTES DO BUILD
│       └── favicon-512x512.png    # ⚠️ CRIAR ANTES DO BUILD
│
├── /components/                    # Todos os componentes React
│   ├── ActivityCard.tsx
│   ├── ActivityList.tsx
│   ├── AISettingsModal.tsx
│   ├── BranchForecast.tsx
│   ├── CareSystem.tsx
│   ├── ChatBox.tsx
│   ├── CompanionHUD.tsx
│   ├── ConfirmDialog.tsx
│   ├── CreateModal.tsx
│   ├── DigivolutionGauge.tsx
│   ├── EditModal.tsx
│   ├── EnergyBar.tsx
│   ├── EvolutionGrid.tsx
│   ├── EvolutionPath.tsx
│   ├── Header.tsx
│   ├── HealthHearts.tsx
│   ├── SaveLoadButton.tsx
│   ├── StatsModal.tsx
│   ├── StepRow.tsx
│   ├── TaskCard.tsx
│   ├── TaskEditModal.tsx
│   ├── WidgetView.tsx
│   ├── XPTracker.tsx
│   │
│   ├── /ui/                       # Componentes UI (shadcn)
│   │   └── [40+ componentes]
│   │
│   └── /figma/
│       └── ImageWithFallback.tsx  # Componente de imagem
│
├── /styles/
│   └── globals.css                # Estilos globais (Tailwind v4)
│
├── /utils/
│   └── /supabase/
│       └── info.tsx               # Credenciais Supabase
│
├── /types/
│   └── attributes.ts              # TypeScript types
│
├── /imports/                      # Assets importados
│   ├── Container.tsx
│   ├── Group1.tsx
│   └── svg-j2qepgzb6a.ts
│
├── /guidelines/                   # Documentação
│   ├── AI-Personality.md
│   ├── Como-Configurar-IA.md
│   └── Guidelines.md
│
└── /supabase/                     # Backend (não incluir no APK)
    └── /functions/
        └── /server/
            ├── index.tsx          # Hono web server
            ├── chat.tsx           # Chat AI endpoint
            ├── transcribe.tsx     # Transcription endpoint
            └── kv_store.tsx       # KV database utils
```

---

## 🎨 MANIFEST.JSON (PWA Configuration)

**Localização**: `/public/manifest.json`

```json
{
  "short_name": "DigiApp",
  "name": "DigiApp - Gamified Productivity",
  "description": "Complete real-life tasks to evolve and care for your digital companion in this retro pixel-art productivity app",
  "icons": [
    {
      "src": "/favicon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/favicon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#2bff95",
  "background_color": "#0a0a0a",
  "categories": ["productivity", "lifestyle", "games"],
  "lang": "pt-BR",
  "dir": "ltr",
  "scope": "/",
  "prefer_related_applications": false
}
```

---

## 🖼️ ÍCONES E ASSETS

### Ícones Obrigatórios

**⚠️ ANTES DE GERAR O APK, CRIAR:**

1. **favicon-192x192.png**
   - Tamanho: 192x192 pixels
   - Formato: PNG com ou sem transparência
   - Localização: `/public/favicon-192x192.png`
   - Origem: Converter `/public/icon-template.svg`

2. **favicon-512x512.png**
   - Tamanho: 512x512 pixels
   - Formato: PNG com ou sem transparência
   - Localização: `/public/favicon-512x512.png`
   - Origem: Converter `/public/icon-template.svg`

### Design dos Ícones

O template SVG (`/public/icon-template.svg`) possui:
- **Background**: Gradiente verde-menta (#2bff95) → teal (#14b8a6)
- **Símbolo**: Letra "D" estilo pixel-art em preto (#0a0a0a)
- **Detalhe**: Coração pixel em rosa neon (#ff2b95)
- **Estilo**: Pixel-art retrô, bordas arredondadas

**Ferramenta para conversão**:
- Online: https://cloudconvert.com/svg-to-png
- Figma: Importar SVG → Export PNG nos tamanhos corretos

### Assets Adicionais

**Splash Screen** (opcional, mas recomendado para APK):
- Tamanho: 2732x2732 pixels (quadrado)
- Background: `#0a0a0a` (preto profundo)
- Logo centralizado: Design do ícone
- Texto: "DigiApp" em fonte pixel/monospace

---

## ⚙️ CONFIGURAÇÕES DO APK

### Informações do Aplicativo

```
App Name: DigiApp
Package Name: com.digiapp.productivity
Version: 1.0.0
Version Code: 1
Min SDK Version: 24 (Android 7.0)
Target SDK Version: 34 (Android 14)
```

### Permissões Necessárias

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.VIBRATE" />
```

**Permissões opcionais** (para futuras features):
```xml
<!-- Para notificações -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

<!-- Para áudio (transcrição) -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

### Orientação de Tela

```xml
android:screenOrientation="portrait"
```

### Theme Color

```xml
<meta-data android:name="theme-color" android:value="#2bff95" />
```

---

## 🌐 ENDPOINTS E URLs

### URLs de Produção

```
App URL: [Seu domínio ou Vercel/Netlify URL]
API Base URL: https://evvcdsnijxbyctipfnkt.supabase.co/functions/v1/make-server-7de212d9
```

### Endpoints da API

```
POST /chat              # Chat com IA Groq
POST /transcribe        # Transcrição de áudio (Whisper)
```

**Autenticação**:
- Header: `Authorization: Bearer [publicAnonKey]`
- Formato: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 📦 DEPENDÊNCIAS PRINCIPAIS

### Libraries Externas

```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "lucide-react": "latest",
  "sonner": "2.0.3",
  "react-hook-form": "7.55.0",
  "recharts": "latest",
  "motion": "latest",
  "@supabase/supabase-js": "latest"
}
```

### Tailwind CSS

- Versão: 4.0
- Configuração: `/styles/globals.css`
- **IMPORTANTE**: Não há `tailwind.config.js` (usando v4)

---

## 🚀 PASSOS PARA BUILD DO APK

### Opção 1: Antigravity (Recomendado)

1. **Preparação**:
   ```bash
   # Criar os ícones PNG (se ainda não existirem)
   # Converter /public/icon-template.svg para:
   # - favicon-192x192.png
   # - favicon-512x512.png
   ```

2. **Upload para Antigravity**:
   - URL do app: [Seu domínio web]
   - Manifest: `/public/manifest.json`
   - Ícones: `/public/favicon-192x192.png` e `favicon-512x512.png`

3. **Configurações**:
   ```
   App Name: DigiApp
   Package: com.digiapp.productivity
   Version: 1.0.0
   Theme Color: #2bff95
   Background Color: #0a0a0a
   Orientation: portrait
   Display Mode: standalone
   ```

4. **Assets**:
   - Icon 192x192: `/public/favicon-192x192.png`
   - Icon 512x512: `/public/favicon-512x512.png`
   - Splash Screen: [Criar se necessário]

5. **Build**:
   - Selecionar "Android APK"
   - Configurar assinatura (keystore) ou usar debug
   - Gerar APK

### Opção 2: PWA Builder

1. Acessar: https://www.pwabuilder.com/

2. Input da URL do app web

3. Configurar:
   - Platform: Android
   - Package Name: com.digiapp.productivity
   - App Name: DigiApp
   - Theme Color: #2bff95

4. Download do projeto Android

5. Build com Android Studio ou CLI

### Opção 3: Capacitor (Manual)

```bash
# Instalar Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android

# Inicializar
npx cap init DigiApp com.digiapp.productivity

# Adicionar plataforma Android
npx cap add android

# Copiar web assets
npx cap copy

# Abrir no Android Studio
npx cap open android

# Build APK no Android Studio
```

**capacitor.config.json**:
```json
{
  "appId": "com.digiapp.productivity",
  "appName": "DigiApp",
  "webDir": "dist",
  "server": {
    "androidScheme": "https",
    "hostname": "app.digiapp.com"
  },
  "android": {
    "backgroundColor": "#0a0a0a"
  }
}
```

---

## 🎨 CORES E BRANDING

### Paleta de Cores Principal

```css
/* Primary */
--mint-green: #2bff95;
--teal: #14b8a6;
--teal-light: #5eead4;

/* Attributes */
--virus-pink: #ff2b95;
--virus-coral: #ff6b6b;
--data-cyan: #2bfff9;
--data-blue: #4d9aff;
--vaccine-mint: #2bff95;
--vaccine-teal: #5eead4;

/* Background */
--black-deep: #0a0a0a;
--gray-dark: #1a1a1a;

/* Accents */
--pink-neon: #ff2b95;
--purple-magenta: #ff00ff;
--cyan-bright: #00ffff;
```

### Gradientes

```css
/* Primary Gradient */
background: linear-gradient(135deg, #2bff95, #14b8a6);

/* Virus Gradient */
background: linear-gradient(90deg, #ff2b95, #ff6b6b);

/* Data Gradient */
background: linear-gradient(90deg, #2bfff9, #4d9aff);

/* Vaccine Gradient */
background: linear-gradient(90deg, #2bff95, #5eead4);
```

---

## 🔧 VARIÁVEIS DE AMBIENTE

### No Servidor Supabase (Edge Functions)

```bash
SUPABASE_URL=https://evvcdsnijxbyctipfnkt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=[SECRETO - Configurado no Supabase]
SUPABASE_DB_URL=[SECRETO - Configurado no Supabase]
GROQ_API_KEY=[SECRETO - Configurado no Supabase]
```

### No APK (Frontend)

**APENAS** incluir no código do app:
```javascript
export const projectId = "evvcdsnijxbyctipfnkt"
export const publicAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2dmNkc25panhieWN0aXBmbmt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwOTA4MzYsImV4cCI6MjA3ODY2NjgzNn0.XqluSl53fBP9ys_ynSD95_FAVkeLvYVZN65_stE0XDA"
```

**🚨 NUNCA incluir no APK:**
- SUPABASE_SERVICE_ROLE_KEY
- GROQ_API_KEY
- Qualquer chave "SECRET" ou "PRIVATE"

---

## 📱 FEATURES DO APP

### Funcionalidades Implementadas

✅ Sistema de evolução de Digimon (3 ramos: Virus, Data, Vaccine)  
✅ Gestão de tarefas e atividades gamificadas  
✅ Sistema de atributos (XP, HP, Energy)  
✅ Chat com IA (Groq) para criar atividades  
✅ Sistema de cuidados (alimentação, sleep, limpeza)  
✅ 3 skins temáticas (Default, Windows 98, Glitch Cyberpunk)  
✅ Sincronização local (localStorage)  
✅ UI pixel-art retrô mobile-first  
✅ Sistema de evolução com múltiplos estágios  
✅ Previsão de ramo evolutivo  
✅ Histórico e estatísticas  

### Features Offline

✅ Armazenamento local completo  
✅ Funciona sem internet (exceto chat IA)  
✅ Save/Load manual de progresso  

### Features Online (Requer Internet)

🌐 Chat com IA via Groq  
🌐 Criação automática de atividades via IA  
🌐 Transcrição de áudio (se implementado)  

---

## ⚠️ CHECKLIST PRÉ-BUILD

Antes de gerar o APK, verifique:

- [ ] **Ícones PNG criados** (192x192 e 512x512)
- [ ] **manifest.json configurado** corretamente
- [ ] **URLs de produção** atualizadas (se houver)
- [ ] **Credenciais Supabase** funcionando
- [ ] **App testado** em navegador mobile
- [ ] **Responsividade** verificada (portrait mode)
- [ ] **localStorage** funcionando corretamente
- [ ] **Chat IA** testado e funcional
- [ ] **Cores e gradientes** aplicados corretamente
- [ ] **Package name** definido (com.digiapp.productivity)
- [ ] **Version number** configurado (1.0.0)
- [ ] **Splash screen** criada (opcional)
- [ ] **Orientação portrait** forçada
- [ ] **Permissões** definidas corretamente

---

## 📞 SUPORTE E TROUBLESHOOTING

### Problemas Comuns

**1. API não responde no APK**
```
Causa: CORS ou URL incorreta
Solução: Verificar CORS no servidor Supabase
        Configurar allowedOrigins para aceitar app://
```

**2. LocalStorage não persiste**
```
Causa: Capacitor webView isolado
Solução: Usar Capacitor Storage Plugin
        npm install @capacitor/preferences
```

**3. Ícones não aparecem**
```
Causa: Arquivos PNG não encontrados
Solução: Verificar paths em manifest.json
        Copiar PNGs para pasta assets do Android
```

**4. App não abre em fullscreen**
```
Causa: Display mode incorreto
Solução: Verificar manifest.json: "display": "standalone"
        Verificar AndroidManifest.xml
```

### Logs e Debug

**Chrome Remote Debugging**:
```
1. Conectar device via USB
2. Ativar USB Debugging no Android
3. Chrome → chrome://inspect
4. Inspecionar WebView do app
```

**Logcat Android**:
```bash
adb logcat | grep "DigiApp"
```

---

## 📄 LICENÇA E CRÉDITOS

### Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase Edge Functions (Hono)
- **Database**: Supabase Postgres (KV Store)
- **AI**: Groq API (Llama models)
- **Icons**: Lucide React
- **UI Components**: shadcn/ui
- **Animations**: Motion (Framer Motion)

### Supabase Project

```
Project: evvcdsnijxbyctipfnkt
Region: [Auto-configurado]
Database: Postgres 15
Edge Functions: Deno runtime
```

---

## 🚀 DEPLOY FINAL

### Fluxo Recomendado

```
1. Desenvolvimento Local → Testar todas as features
2. Deploy Web → Vercel/Netlify/Supabase Hosting
3. Criar Ícones PNG → Converter SVG templates
4. Configurar Manifest → Validar PWA
5. Gerar APK → Antigravity/PWABuilder/Capacitor
6. Testar APK → Device físico ou emulador
7. Assinar APK → Keystore de produção
8. Distribuir → Google Play ou direto (sideload)
```

### URLs Importantes

```
Web App: [Seu domínio]
Supabase Dashboard: https://supabase.com/dashboard/project/evvcdsnijxbyctipfnkt
API Endpoint: https://evvcdsnijxbyctipfnkt.supabase.co/functions/v1/make-server-7de212d9
```

---

**✨ DigiApp está pronto para ser transformado em APK! ✨**

> Para dúvidas ou suporte, consulte a documentação em `/guidelines/` ou `/public/PWA-SETUP.md`
