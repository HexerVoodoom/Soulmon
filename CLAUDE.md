# DigiApp — Guia para agentes

App de produtividade gamificado (bichinho virtual estilo Digimon/Tamagotchi).
React 18 + TypeScript + Vite 6 (web) e Capacitor 8.4 (APK Android).
UI/textos do app em PT-BR e EN (sempre os dois, via `language === 'pt-BR'`).

## Comandos (rode ANTES de todo commit)

```bash
npx tsc --noEmit     # typecheck — deve sair limpo (exit 0)
npx vitest run       # testes — todos devem passar
npm run build        # vite build + conversão PNG→WebP (dist/ é commitado!)
```

## Deploy (regra combinada com o dono do projeto)

- **Toda alteração** → commit → push para os TRÊS branches: `main`, `version-b`,
  `claude/digiapp-code-improvements-q44ol2` (mesmo commit nos três).
- `main` é o branch de produção do **Cloudflare Pages** (`digiapp-a5e.pages.dev`) —
  o push publica sozinho em ~2 min. `dist/` é commitado (o CF também builda).
- O **APK carrega a URL de produção** (`capacitor.config.json > server.url`), então
  mudança web NÃO precisa de APK novo. Só mudanças em `android/` precisam — o
  GitHub Actions (`android-build.yml`) builda no push; o artefato fica em
  `github.com/HexerVoodoom/DigiApp/actions/runs/<id>`.
- Ao mudar assets estáticos/HTML de forma incompatível, **bump `CACHE_VERSION`**
  em `public/sw.js` (v7 atual) — senão usuários ficam presos em cache velho.

## Regras do jogo (fonte da verdade — NÃO reinventar)

| Sistema | Regra |
|---|---|
| ❤️ Corações (HP) | Perde na virada do dia: `floor((1 − feitas/meta) × maxHP)`, onde meta = `min(cadastradas, requisito do estágio)`. Cumpriu o requisito (ou fez tudo que cadastrou) = não perde. HP aceita frações de 0.5. HP 0 → degeneração. |
| 🫶 Carinho | Cura principal de HP. Esfregar o pet (pointer drag): ~2s = +0.5 coração, **máx. 1 coração/dia** (`RUB_HEAL_DAY` no localStorage). Animação (explosão de corações) sempre toca. Alternativa: item **Coraçãozinho** (`💗`, comprado na loja ou dropado na masmorra) cura +1 coração ao ser usado na pastinha. |
| 🍎 Comida | Máx. **5 por hora** (janela deslizante, `FOOD_FEED_TIMES`). Dá +1 energia + pontos de atributo (vírus/dado/vacina → galho de evolução). NÃO cura HP. Recusa = pet fala que está cheio (sem toast). Ganha-se comida completando atividades. Chips/coraçõezinhos NÃO contam no limite de 5/h. |
| ⚡ Energia | Enche só comendo, zera todo dia. **Barras de energia = requisito de tarefas do estágio** (`getMaxEnergyForStage` = `FORM_REQUIREMENTS.required`; ex.: rookie precisa de 4 tarefas → 4 barras). **Cheia no fim do dia = condição do dia perfeito.** |
| ⭐ Dia perfeito | `tarefas ≥ min(cadastradas, requisito) && ≥1 cadastrada && energia cheia (≥ requisito)` → +1 ponto de evolução (perfectDays). Mesma meta da regra de HP. |
| 💩 Cocô | Até 2×/dia: 1º agendado 07–15h; 2º agendado 8–10h após o 1º APARECER. Nunca aparece dormindo. Não limpo = **−1 coração a cada 6h** (`poopPenaltyClockAt`; pausa dormindo; banho zera). Notificação ~30min antes do tick. Ovo/baby-i isentos. |
| 🚿 Banho | Sempre disponível. Limpa o cocô (para o dreno). |
| 💤 Dormir | Toggle manual (persistido) + sono automático opcional (janela nas Configurações; age só nas transições). Dormindo: sem cocô, dreno pausado. |
| 📊 Relatório diário | Escrito no reset (`lastDayReport` no GameState), mostrado 1×/dia (`DAILY_REPORT_SHOWN`). |
| 🎖️ Pontos de jogo | Minijogos (página Atividades): Dino floor(score/100) · PPT 5/vitória · **Masmorra** (`utils/dungeon.ts`): cada **onda** é uma escada de inimigos **aleatórios** subindo os tiers em ordem (baby-i→baby-ii→rookie→champion→ultimate→mega, via `LADDER_TIERS`+`STAGE_SPRITES`; inclui Greymon/Meramon/Etemon etc.). Limpar a onda inteira sobe o **nível da masmorra** (`buildDungeonWave(level)`): inimigos causam +dano (`atkMult`) e recebem −dano (`dmgReduction`). Nível **persiste e reseta todo mês** (`DUNGEON_DIFFICULTY`, `setDungeonDifficultyAtLeast`) — a run começa no nível salvo e o HP do jogador carrega entre ondas (+25% de cura ao limpar). **Limite diário** de 3 entradas (`DUNGEON_RUNS`). **Perder custa 1 coração real** (`onLose`) → **não dá pra entrar com ≤1 coração**. **Ranking** = melhor placar (`DUNGEON_BEST`). Dropa **coraçãozinho** (`💗`, máx. 2/dia, `DUNGEON_HEART_DROPS`) — **NÃO dropa comida**. Stats do jogador escalam com o estágio (`PLAYER_STATS`). |
| 🛒 Loja | Na página Atividades (`ShopModal`, estética 8-bit). Catálogo em `utils/shop.ts`: **chips** de atributo (40🎖️) — NÃO aplicam na hora, vão pra **pastinha de itens** (`foodInventory`, emoji 🦠/💾/💉); ao USAR dão +3 no atributo e **nada mais** (sem energia) · **coraçãozinho** (`💗`, 60🎖️) — vai pra pastinha, cura +1 HP ao usar · **itens de digievolução** (180–220🎖️, `equippedEvoItem`: quando os critérios são cumpridos E o item está equipado, a forma do nível vira a alternativa — Greymon/Garurumon/Meramon no champion, Monzaemon/Etemon no ultimate; consumido ao evoluir; próximo estágio segue o branch normal via substituição em `getNextEvolution`; degeneração volta pra forma do branch pois as artificiais estão em `STAGES_BY_LEVEL` mas fora das tabelas de linha; a forma NATURAL é a que entra em `unlockedEvolutions`) · cenários CSS (50🎖️). Consumíveis especiais em `SPECIAL_ITEMS` (distinguidos no `handleFeed`). Sprites DMC novos em `src/assets/*_dmc.png` (fonte: repo wayland-vpets). Efeitos em `handleShopBuy`. |

Estágios/HP máx: digiegg,baby-i=1 · baby-ii=2 · rookie/champion/ultimate=3 · mega=4 · ultra=5.

## Arquitetura

- `src/App.tsx` (~1500 linhas) — orquestra tudo: handlers (feed/pet/shower/sleep),
  efeitos de jogo (dreno de cocô, sono automático, relatório), navegação de páginas.
- `src/contexts/GameStateContext.tsx` — `GameState` + persistência: todo setGameState
  grava no localStorage (`digiapp_state_v3`) e agenda cloud save (3s debounce).
  **Cuidado**: qualquer efeito que grave estado em timer vira spam de cloud save —
  throttle (ex.: relógio do cocô dormindo só grava a cada ≥5min).
- Cloud save: `src/utils/cloudSave.ts` → `functions/api/save.js` (Cloudflare KV
  `DIGIAPP_SAVES`). saveId = SHA-256 do e-mail (mesmo e-mail = mesmo save).
  Campos novos sincronizam sozinhos; no load use fallback `?? padrão` SEMPRE.
- `src/hooks/useDailyReset.ts` — reset na virada (check a cada 30s). NÃO reintroduzir
  ticker de 1s (re-renderizava o app inteiro).
- `src/hooks/useCareSystem.ts` — agendamento/polling do cocô (10s).
- `src/components/CompanionHUD.tsx` — área do pet: sprites, gesto de esfregar,
  falas (idle a cada 3min chama `/api/chat` — Groq; TEM guard de `document.hidden`).
- `src/utils/storageKeys.ts` — TODAS as chaves de localStorage passam por aqui.
- IA: `functions/api/chat.js` (Groq llama-3.1-8b-instant, personalidade via aiSettings).
- Push: Web Push VAPID nativo (SEM Firebase) — `functions/api/subscribe.js` + `public/sw.js`.
- Widgets Android: `android/.../widget/WidgetRenderer.kt` + layouts. Dados via
  `DigiWidgetPlugin` (SharedPreferences). Testes: `npx vitest run` cobre lógica de reset.

## Footguns (aprendidos a dor — não repita)

1. **`src/index.css` é o ÚNICO CSS empacotado** (Tailwind v4 pré-compilado; NÃO há
   plugin do Tailwind no Vite). Keyframes/estilos novos vão NELE (no fim).
   Não existe geração de classes: **classe utilitária que não está no index.css
   não aplica nada** (foi o bug do `bottom-2`). Para posicionamento/layout crítico,
   prefira `style={{}}` inline.
2. **RemoteViews (widgets Android)** só suporta: ImageView, TextView, ProgressBar,
   Linear/Relative/FrameLayout, ViewFlipper. `<View>` quebra o widget ("não foi
   possível carregar"). `setImageViewResource` é confiável; `setInt(…background…)` não.
3. **Build Android**: JDK 21 no CI, Kotlin jvmTarget **17**, compileOptions do app
   re-pinados para 17 DEPOIS do `apply from: 'capacitor.build.gradle'`.
4. Vários PNGs antigos em git são **0 bytes** (ex.: `partner_area.png` original era
   quebrado — o fundo do widget é vetor `pet_grid.xml`).
5. `handleX = useCallback` com deps certas — CompanionHUD é `memo()`; lambda inline
   nas props dele anula o memo.
6. Side effects NUNCA dentro de updater do setGameState (StrictMode invoca 2×).
7. O sandbox de dev **não acessa** `digiapp-a5e.pages.dev` (proxy 403) — teste local
   com `npx vite preview` + Playwright (`/opt/pw-browsers/chromium`, import
   `/opt/node22/lib/node_modules/playwright/index.js`).
8. Sprites: importados via alias `figma:asset/<hash>.png` (mapa no `vite.config.ts`)
   → arquivos reais em `src/assets/`. `assetsInlineLimit: 0` (nunca inline base64).

## Convenções

- Commits em PT-BR, `tipo(escopo): resumo` (feat/fix/refactor/style/chore).
- Textos de UI sempre PT-BR + EN. Falas do pet: curtas, fofas, sem emoji nas
  frases faladas (o `speak()` remove emojis; `speakRaw()` preserva).
- Ao mudar regra de jogo: atualizar `GuideModal.tsx` (guia) E `HelpModal.tsx`
  (glossário PT/EN) E os testes em `src/hooks/useDailyReset.test.ts`.
- Verificação visual: screenshot via Playwright antes de declarar UI pronta.
