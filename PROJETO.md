# DigiApp — Especificações do Projeto

> Documento gerado em 2026-06-25. Mantido manualmente conforme o projeto evolui.

---

## O que é

DigiApp é um app estilo Tamagotchi/Digimon em que o usuário cuida de um pet digital (DigiMon) completando tarefas e atividades do dia a dia. O pet evolui ou regride conforme o desempenho do usuário ao longo dos dias.

**Plataformas alvo:**
- Web / PWA (Cloudflare Pages — branch `main`)
- Android APK (Capacitor + Android Studio)

---

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| UI | React 18 + TypeScript |
| Build | Vite 6.3.5 + `@vitejs/plugin-react-swc` |
| Estilo | Tailwind CSS v4 (via CSS import) + shadcn/ui (Radix UI) |
| Mobile | Capacitor 8.4.0 (`@capacitor/android`) |
| Backend HTTP | Cloudflare Pages Functions (`functions/`) |
| Workers / Cron | Cloudflare Workers (`workers/`) |
| Storage backend | Cloudflare KV (`DIGIAPP_SAVES`, `PUSH_SUBSCRIPTIONS`) |
| IA / Chat | Groq (via `functions/api/chat.js`) |
| Cloud save | Supabase (`@jsr/supabase__supabase-js`) |
| Testes | Vitest + `@vitest/coverage-v8` |
| Push notifications | Web Push API + VAPID (RFC 8292 / 8291 / 8188) |
| i18n | `pt-BR` e `en-US` (arquivos em `src/translations/`) |

---

## Estrutura de Diretórios

```
DigiApp/
├── android/                        # Projeto Android (Capacitor)
│   └── app/src/main/java/com/digipartner/digiapp/
│       ├── plugins/
│       │   ├── DigiAlarmPlugin.kt  # AlarmManager — notificações com app fechado
│       │   └── DigiWidgetPlugin.kt # Widget Android
│       ├── widget/
│       │   ├── DigiAppWidgetProvider.kt
│       │   └── WidgetRefreshWorker.kt
│       └── notifications/
│           └── AlarmReceiver.kt    # BroadcastReceiver para alarmes
│
├── functions/                      # Cloudflare Pages Functions (HTTP)
│   ├── api/
│   │   ├── chat.js                 # POST /api/chat — resposta IA (Groq)
│   │   ├── save.js                 # GET/POST /api/save — cloud save (KV)
│   │   └── subscribe.js            # POST/DELETE /api/subscribe — push subs (KV)
│   └── .well-known/
│       └── assetlinks.json.js      # Android App Links
│
├── workers/                        # Cloudflare Worker standalone (cron)
│   ├── webpush.js                  # Implementação RFC 8291/8188/8292 (WebCrypto)
│   ├── push-scheduler.js           # Handler `scheduled` — envia push 10h/16h/21h/22h BRT
│   └── wrangler.toml               # Config do Worker + cron triggers
│
├── public/
│   ├── sw.js                       # Service Worker (cache + push handler)
│   ├── manifest.json               # PWA manifest
│   ├── favicon-192x192.png
│   ├── favicon-512x512.png
│   └── .well-known/assetlinks.json # Android App Links (estático)
│
├── src/
│   ├── App.tsx                     # Raiz do app — game state, routing, lógica principal
│   ├── components/
│   │   ├── CompanionHUD.tsx        # Pet display + speech bubble + chat
│   │   ├── NotificationManager.tsx # Orquestra todas as notificações
│   │   ├── ChatBox.tsx             # Caixa de chat com o pet
│   │   ├── TaskCard.tsx / ActivityCard.tsx
│   │   ├── EvolutionPath.tsx / EvolutionGrid.tsx
│   │   └── ui/                     # shadcn/ui (Radix UI wrappers)
│   ├── hooks/
│   │   ├── useCareSystem.ts        # Lógica de HP, evolução, regressão
│   │   ├── useDailyReset.ts        # Reset diário de progresso
│   │   ├── useProgressTracking.ts  # Contagem de tarefas/atividades
│   │   └── useItemForm.ts
│   ├── plugins/
│   │   ├── DigiAlarmPlugin.ts      # Bridge JS → DigiAlarmPlugin.kt
│   │   └── DigiWidgetPlugin.ts     # Bridge JS → DigiWidgetPlugin.kt
│   ├── utils/
│   │   ├── notifications.ts        # showNotification, subscribe/unsubscribeFromPush, sync*Alarms
│   │   ├── vapid.ts                # VAPID_PUBLIC_KEY (constante)
│   │   ├── cloudSave.ts            # Save/load via /api/save
│   │   ├── dailyReset.ts           # Lógica de reset
│   │   ├── storageKeys.ts          # Chaves do localStorage centralizadas
│   │   ├── sounds.ts               # Efeitos sonoros
│   │   ├── i18n.ts                 # Utilitários de tradução
│   │   └── chatKeywords.ts         # Respostas do pet por keyword
│   ├── types/
│   │   ├── evolution-lines.ts      # Tipos das linhas evolutivas
│   │   ├── progression.ts          # Tipos de progressão
│   │   └── attributes.ts
│   ├── translations/
│   │   ├── pt.ts                   # Strings em português
│   │   └── en.ts                   # Strings em inglês
│   └── contexts/
│       ├── GameStateContext.tsx
│       └── LanguageContext.tsx
│
├── scripts/
│   └── convert-to-webp.mjs         # Converte PNGs para WebP pós-build
│
├── dist/                           # Build output (commitado para deploy)
├── capacitor.config.json
├── vite.config.ts
├── tsconfig.json
├── vitest.config.ts
└── PROJETO.md                      # Este arquivo
```

---

## Configuração de App

**capacitor.config.json**
```json
{
  "appId": "com.digipartner.digiapp",
  "appName": "DigiApp",
  "webDir": "dist"
}
```

**App ID Android:** `com.digipartner.digiapp`

---

## Branches e Deploy

| Branch | Finalidade |
|--------|-----------|
| `main` | Produção — Cloudflare Pages faz deploy automático |
| `version-b` | Branch de trabalho principal |
| `claude/digiapp-code-improvements-q44ol2` | Branch de sessão Claude Code |

**Fluxo de commit:**
```bash
npm run build          # Sempre buildar antes de commitar
git add dist/ src/ ... # Incluir dist/ no commit
git commit -m "..."
git push -u origin version-b
git push origin version-b:main
git push origin version-b:claude/digiapp-code-improvements-q44ol2
```

---

## Scripts

```bash
npm run dev           # Dev server em localhost:3000
npm run build         # Vite build + convert-to-webp.mjs
npm run test          # Vitest (run once)
npm run test:watch    # Vitest (watch mode)
npm run test:coverage # Vitest com coverage
npm run typecheck     # tsc --noEmit
```

---

## Notificações — Estratégia Completa

### Android APK (app fechado ✅)
- Plugin nativo `DigiAlarmPlugin.kt` usa `AlarmManager.setExactAndAllowWhileIdle()`
- `AlarmReceiver.kt` dispara `NotificationManager` do Android
- Bridge JS: `src/plugins/DigiAlarmPlugin.ts` → chama via Capacitor
- Alarmes agendados em `NotificationManager.tsx` no useEffect

### Web / PWA — app aberto
- Polling a cada 60s em `NotificationManager.tsx`
- Dispara via `showNotification()` em `src/utils/notifications.ts`
- Usa SW (`showNotification` via registration) quando disponível, fallback `new Notification()`

### Web / PWA — app fechado ✅ (implementado)
- **Cloudflare Worker** (`workers/push-scheduler.js`) com cron triggers envia push pelo servidor
- **VAPID + RFC 8291/8188** implementado do zero em `workers/webpush.js` (WebCrypto puro)
- Subscriptions armazenadas no KV `PUSH_SUBSCRIPTIONS`
- Frontend subscreve via `subscribeToPush()` em `src/utils/notifications.ts`
- Service Worker recebe em `public/sw.js` → handler `push` event

### Horários dos push (BRT = UTC-3)

| Horário BRT | Horário UTC | Mensagem |
|-------------|-------------|---------|
| 10:00 | 13:00 | ☀️ Bom dia — foco no dia |
| 16:00 | 19:00 | 📋 Lembrete — tarefas esperando |
| 21:00 | 00:00 | ⏰ Urgente — ainda dá tempo |
| 22:00 | 01:00 | 🌙 Boa noite |

Nudges de 10h/16h/21h só são enviados se `completedSteps < totalRequired`.
Boa noite (22h) sempre é enviada.

---

## Chaves VAPID

> **ATENÇÃO:** Nunca commitar a chave privada em texto plano. Usar `wrangler secret`.

**Public Key (hardcoded em `src/utils/vapid.ts` e `workers/wrangler.toml`):**
```
BK2MsJZtN6ancQBtKZYLFxe_avXfIPqRs28szlgRXJGfQcJlrd4wtBhzMr6t2zPvz7HUeJv-jpleDaNfmRZIlXY
```

**Private Key JWK** — salvar como secret no CF Worker:
```bash
cd workers
npx wrangler secret put VAPID_JWK
# Colar o JWK completo quando solicitado:
# {"key_ops":["sign"],"ext":true,"kty":"EC","x":"rYywlm03pqdxAG0plgsXF79q9d8g-pGzbyzOWBFckZ8","y":"QcJlrd4wtBhzMr6t2zPvz7HUeJv-jpleDaNfmRZIlXY","crv":"P-256","d":"nUiUk84giV_Do7fho0QVk30ZoagvhB5ES52O5JSmM7g"}
```

---

## Cloudflare — Setup Pendente

### 1. KV Namespace `PUSH_SUBSCRIPTIONS`
```bash
npx wrangler kv namespace create PUSH_SUBSCRIPTIONS
# Copiar o ID retornado e colar em workers/wrangler.toml:
# id = "REPLACE_WITH_KV_NAMESPACE_ID"
```

### 2. Deploy do Worker
```bash
cd workers
npx wrangler deploy
```

### 3. Verificar KV `DIGIAPP_SAVES` (já existe)
- Binding usado em `functions/api/save.js`
- Configurado no painel Cloudflare Pages → Settings → Functions → KV Bindings

### 4. Variáveis de ambiente no Pages
Configurar em **Cloudflare Dashboard → Pages → DigiApp → Settings → Environment Variables:**
- `GROQ_API_KEY` — chave da API Groq para o chat
- Qualquer chave Supabase se usada no backend

---

## Cloudflare KV — Convenções de Chaves

| Namespace | Prefixo | Formato | TTL |
|-----------|---------|---------|-----|
| `DIGIAPP_SAVES` | `save:{saveId}` | JSON do game state | 365 dias |
| `PUSH_SUBSCRIPTIONS` | `push:{sha256[:32]}` | `{ endpoint, keys, digimonName, language }` | 365 dias |

---

## Capacitor / Android — Build e Install

### Pré-requisitos
- Android Studio instalado (com SDK 33+)
- Java 17+

### Build do APK
```bash
# 1. Build web
npm run build

# 2. Sync para Android
npx cap sync android

# 3. Via Android Studio (recomendado)
npx cap open android
# Build → Build APK(s) → Debug / Release

# 3. Ou via CLI (Gradle)
cd android
./gradlew assembleDebug
# APK em: android/app/build/outputs/apk/debug/app-debug.apk
```

### Instalar no dispositivo
```bash
# Com dispositivo conectado via USB (USB Debugging ativado)
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Ou enviar o APK por qualquer meio e abrir no Android
```

---

## Plugins Nativos Android

### DigiAlarmPlugin (`DigiAlarmPlugin.kt`)
Capacitor plugin que expõe `AlarmManager` para o JavaScript.

| Método JS | Descrição |
|-----------|-----------|
| `DigiAlarm.scheduleAlarm({ id, title, body, scheduledTime })` | Agenda notificação em `HH:mm` |
| `DigiAlarm.cancelAlarm({ id })` | Cancela alarme pelo ID |

`scheduledTime` é no formato `"HH:mm"` — o plugin calcula a próxima ocorrência do dia.

### DigiWidgetPlugin (`DigiWidgetPlugin.kt`)
Expõe atualização do widget Android para o JavaScript.

---

## Persistência de Dados

| Dado | Onde fica |
|------|-----------|
| Game state completo | `localStorage` (chave: `STORAGE_KEYS.*`) |
| Game state cloud backup | Cloudflare KV via `/api/save` |
| Notificações agendadas (web) | `localStorage[SCHEDULED_NOTIFICATIONS]` |
| Push subscriptions | Cloudflare KV `PUSH_SUBSCRIPTIONS` |
| Daily check flags | `localStorage[DAILY_NOTIFICATION_CHECK]` |

Chaves centralizadas em `src/utils/storageKeys.ts`.

---

## Temas Visuais

O app suporta múltiplos temas/estilos visuais detectados via flags no game state:
- **Padrão** — visual clean/moderno
- **Glitch** — efeito glitch neon (`glitch-activity-card`)
- **Win98** — estilo Windows 98 com fonte Courier New e efeitos ciano/magenta (`win98-activity-card`)

A lógica de tema é aplicada principalmente em `CompanionHUD.tsx` e propagada via props.

---

## Arquivos de Configuração Importantes

| Arquivo | Propósito |
|---------|-----------|
| `vite.config.ts` | Build config + aliases de path (`@` → `src/`) + aliases de versão de pacotes |
| `tsconfig.json` | TypeScript config |
| `vitest.config.ts` | Configuração dos testes |
| `capacitor.config.json` | ID do app Android + webDir |
| `workers/wrangler.toml` | CF Worker name, cron triggers, KV binding |
| `public/manifest.json` | PWA manifest (ícones, nome, cores) |
| `public/sw.js` | Service Worker (cache strategy + push handler) |
| `public/.well-known/assetlinks.json` | Android App Links (deep link verification) |
| `functions/.well-known/assetlinks.json.js` | Mesma coisa servida dinamicamente pelo Pages |

---

## Links Úteis

### Cloudflare
- Dashboard: https://dash.cloudflare.com
- Documentação Pages Functions: https://developers.cloudflare.com/pages/functions/
- Documentação Workers + Cron: https://developers.cloudflare.com/workers/configuration/cron-triggers/
- Documentação KV: https://developers.cloudflare.com/kv/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/

### Web Push
- RFC 8292 — VAPID: https://datatracker.ietf.org/doc/html/rfc8292
- RFC 8291 — Message Encryption: https://datatracker.ietf.org/doc/html/rfc8291
- RFC 8188 — aes128gcm: https://datatracker.ietf.org/doc/html/rfc8188
- MDN PushManager: https://developer.mozilla.org/en-US/docs/Web/API/PushManager
- MDN Service Worker Push: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification

### Android / Capacitor
- Capacitor Docs: https://capacitorjs.com/docs
- AlarmManager Android: https://developer.android.com/reference/android/app/AlarmManager
- ADB Install: https://developer.android.com/studio/command-line/adb

### Stack
- Vite: https://vitejs.dev
- React 18: https://react.dev
- Tailwind CSS v4: https://tailwindcss.com/docs/v4-beta
- shadcn/ui: https://ui.shadcn.com
- Radix UI: https://www.radix-ui.com
- Vitest: https://vitest.dev
- Groq API: https://console.groq.com

---

## Checklist de Deploy (Web)

- [ ] `npm run build` sem erros de TypeScript
- [ ] `dist/` commitado junto com o código
- [ ] Push para `main` (Cloudflare Pages faz deploy automático)
- [ ] Worker `digiapp-push-scheduler` deployado: `cd workers && npx wrangler deploy`
- [ ] KV `PUSH_SUBSCRIPTIONS` criado e ID atualizado no `wrangler.toml`
- [ ] Secret `VAPID_JWK` configurado no Worker via `wrangler secret put VAPID_JWK`
- [ ] KV `DIGIAPP_SAVES` vinculado no Pages (Settings → Functions → KV Bindings)
- [ ] `GROQ_API_KEY` configurado nas env vars do Pages

## Checklist de Build Android

- [ ] `npm run build` executado
- [ ] `npx cap sync android` executado
- [ ] APK gerado via Android Studio ou `./gradlew assembleDebug`
- [ ] Testado em dispositivo físico com USB Debugging
