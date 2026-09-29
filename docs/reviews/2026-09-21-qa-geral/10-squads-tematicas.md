# QA-10 — As quatro squads temáticas: entregue × backlog × cego

> Termos renomeados em 29/09/2026: vírus→poder, dado→harmonia, vacina→benevolência.

> Somente leitura, 21/09/2026, sobre `D:\Soulmon\repo`. Regra: `caminho` + SÍMBOLO, sem número
> de linha; todo número traz o comando que o produziu. Precedência: código > teste > `CLAUDE.md`
> > manual > doc da squad.

## Resumo em 10 linhas

1. **Narrativa** entregou bíblia + copy aplicada (`PET_VOICE_LINES`, `moodSummary`, grupo `Sobre`) + régua `narrativa.contract.test.ts` (5/5 verde). 10 propostas abertas; 6 fechadas pelo dono.
2. O guard cobre **só `src/**/*.ts(x)` não-teste**; `public/`, `android/`, `dist/` e `workers/` estão limpos por grep manual — mas não por régua.
3. Ponto cego da narrativa: **`WidgetRenderer.kt` (`CHAT_FIXED_PHRASES`) diz "I missed you!"**, EN-only, fora do doc de copy — viola os critérios (a)/(b) da P2 e a regra bilíngue.
4. **Som** entregou barramento (`tocarNa`), escada (`CATEGORIA_DO_SOM`), 5 `.webm` (258 248 B) com atribuição por hash; 8 sons, todos categorizados.
5. S16 deixou: A/B cego **não ouvido** (#8 "fica aberto"), 5 sons curtos procedurais (#9: regerar 4 + reescrever `transaction`), `SettingsModal` **não é órfão** — abre via `ChatBox.onOpenAISettings`; é um **segundo** switch de mudo, candidato a remoção.
6. **Arte** entregou C1–C5, 8 emblemas, M1, H1–H3 e a rodada 2 (R2-1..R2-6); `auraForElement` já devolve PNG 96² (não é mais CSS).
7. `restaurant`/`bedtime` são Material **por decisão** (fora do visor); o fallback real que resta é o **emoji textual de `FxPopup` quando `FX_ART` não tem a chave** e `.sm-px-*` em 14 `.tsx`.
8. Ponto cego da arte: **~1.720 imagens em `src/assets/` sem uma linha de procedência** em `docs/Attributions.md` (modelo/prompt/data) — o som tem, a imagem não.
9. **Design**: os 14 canvases da Fase 2 têm código que os cita (Sistema 43 arquivos … Estatísticas 1); divergências que sobram: `.sm-px-*` em 14 arquivos, `OraclePage` no bundle (inalcançável), `PixelFrame` em 3 arquivos.
10. `INVENTARIO-TELAS.md` (19/08) está **apodrecido**: 3 componentes citados não existem mais; o inventário vivo é `design/INVENTARIO-WIREFRAMES.md` §3.

---

## 1. SQUAD-NARRATIVA

### (a) Entregue
- Docs: `docs/NARRATIVA-E-UNIVERSO.md` (bíblia, L1–L12, §12 vocabulário), `docs/NARRATIVA-COPY.md` (548 linhas, "APLICADA em 21/09/2026", §8 tabela ✅/⏸️), `docs/NARRATIVA-PROPOSTAS.md` (16 propostas).
- Código que prova:
  - `src/utils/petVoice.ts` › `PET_VOICE_LINES` — kinds novos `full`, sono, `residue`, etc. (§1 da copy, sha `a2ded861`).
  - `src/utils/mood.ts` › `moodSummary` — frase de normalização trocada (§6-bis, `5b91717c`).
  - `src/components/SettingsPage.tsx` › `<Group title={isPt ? 'Sobre' : 'About'}>` — os três limites da §16 (L10) existem.
  - `src/narrativa.contract.test.ts` › `TERMOS` / `EXCECOES` — a régua (P13).

### (b) Backlog × estado
`docs/NARRATIVA-PROPOSTAS.md`: 16 itens; fechados P1, P2, P5, P8, P9, P10 (REGISTRO §14). **10 abertos:**

| # | O que | Quem decide |
|---|---|---|
| P3 | nomear as 5 camadas das fendas (`dungeonScenes.ts`, só rótulo) | **dono** (nome novo = gate humano da skill) |
| P4 | linha de mundo no reveal (`SoulmonOnboarding`) | **dono** (mexe na tela mais frágil do funil) + design-lead decide *onde* |
| P6 | nota junguiana pública | squad recomenda "interno"; **dono** ratifica |
| P7 | "Contraparte" como termo de UI | squad recomenda "não"; **dono** ratifica |
| P11 | escada `rookie→…→mega` como rótulo (candidata Encosto→…→Vasto) | **dono**, v1.1 — "Inteiro" já vetado pelo guarda |
| P12 | `fendas` → `dobras` | **dono** (termo novo) |
| P13 | régua existe; texto diz "resta P1/P5" — **ambas fechadas** → item deveria estar marcado como concluído | squad (loremaster) fecha o texto |
| P14 | redação de `moodSummary` | ✅ **já aplicada** (`5b91717c`, §6-bis) — o doc ainda a lista como aberta; loremaster fecha |
| P15 | vocabulário de término no combate (`DungeonGame`/`NightmareBattle`/`ArenaGame`, `dungeonKills` fica) | copy-redator mede + guarda; **dono** se a régua ganhar família nova |
| P16 | linha de mundo no bestiário (`StatsPage`, bloco `bestiary`) | copy-redator escreve; design-lead decide onde; dono aprova |

Medição da P15: `grep -niE "derrot|matou|abat|elimin|kill|defeat" src/components/{DungeonGame,NightmareBattle,ArenaGame}.tsx` → só identificadores (`defeatEnemy`, `onEnemyDefeated`, `data-visor-fx="defeat"`) e comentários; nenhuma string de jogador com "matar". O comentário em `DungeonGame.tsx` já cita "vencer é PASSAR, não matar" (§4 da copy).

`docs/NARRATIVA-COPY.md` §8 — ficou ⏸️: §2.2 "Ontem fechou.", §2.7 (P2 fechada = faixas mantidas), §3.6 sprout/sapling, §5.5 frase do `UnlockNudge`, §6 texto de suporte/crise (já no `ChatBox`).

### (c) Vocabulário vetado
- `npx vitest run src/narrativa.contract.test.ts` → **Test Files 1 passed, Tests 5 passed** (1,40 s).
- O guard varre **apenas** `src/**/*.ts|tsx` excluindo `.test/.spec` (`fontesDeTexto`). Não alcança `public/`, `android/`, `workers/`, `functions/`, `desktop/`, `dist/`.
- Grep manual (`grep -rliE "tamer|domador|treinador|digievolu|mundo digital|digimon"`):
  - `public/` → **0** arquivos; `android/app/src/main/` → **0**; `dist/assets/*.js` → **0**; `workers/`, `functions/api/_pushCopy.js` → 0.
  - `public/termos.html`, `public/privacidade.html`, `strings.xml`, `manifest.json` → 0 para `vírus|vacina|glitchtama|weave`.
  - `docs/` → 34 arquivos com "digimon" (histórico/lápides, esperado — e o guard é só de fonte).
- **Resposta: sim, o guard cobre só `src/`. As outras árvores estão limpas hoje por sorte, não por régua.** Precedente do próprio cabeçalho do teste: o widget Kotlin já manteve frases que a spec mandou tirar porque "nenhum teste em `node` alcança Kotlin".

### (d) O que a squad nunca olhou
1. **`android/.../widget/WidgetRenderer.kt` › `CHAT_FIXED_PHRASES`** — 9 frases **só em EN** ("I missed you!", "Let's tackle our tasks together?", "Ready to evolve today?"). `grep -c WidgetRenderer docs/NARRATIVA-COPY.md` = 0. "I missed you!" é saudade atribuída à criatura → viola L11 e os critérios (a)/(b) da P2 que a própria squad escreveu; e a regra bilíngue (copy: "String só em português já chegou ao usuário" — vale ao contrário também).
2. **Push**: `functions/api/_pushCopy.js` (dono único do texto do push) e `workers/push-scheduler.js` — 0 menções na COPY/PROPOSTAS. Frases como "dê uma comidinha pro seu Soulmon — energia cheia fecha o dia completo" e "seu Soulmon adora companhia" nunca passaram pelo narrative-critic (teste "companheiro ou chefe?").
3. **`desktop/renderer/src/menu.ts`** (overlay Electron, `t('Comida','Feed')` etc.) — fora do escopo do doc.
4. **`public/termos.html` / `privacidade.html`** — moldura declarada (L10), nunca revisada quanto a registro/voz.
5. P13/P14 ainda listadas como abertas no doc quando já estão feitas — o doc da squad já diverge do código.

---

## 2. SQUAD-SOM

### (a) Entregue
- Docs: `docs/SOM.md` (§1–§8), `docs/HANDOFF-SOM.md`, `docs/REGISTRO-DE-DECISOES.md` §6.1 (S1–S16, sem S14), `docs/Attributions.md` › "Áudio" (5 linhas com sha256), `docs/PERGUNTAS-DO-DONO.md` #8/#9.
- Código que prova:
  - `src/utils/audioBus.ts` › `tocarNa`, `JANELA_DE_COINCIDENCIA_MS = 120` (R-EX), `duckMarco`/`liberarMarco`, `definirTrilhaLigada`.
  - `src/utils/loudness.ts` › `CATEGORIA_DO_SOM` (8 entradas: marco, presenca, degeneracao, sintonia, cuidado×3, conclusao), `ALVO_LUFS_M`, `TETO_LUFS_INTEGRADO = -16`, `TRIM_TRILHA_POR_CAMADAS_DB`.
  - `src/utils/sonsAssets.ts` › `ASSETS_DE_SOM`, `CAMADAS_DA_TRILHA`, `carregarAsset`; `src/utils/trilha.ts` › `ligarTrilha`/`pausarTrilha`; `src/utils/sounds.ts` › `playComAsset` (3 usos).
  - Réguas: `src/utils/sonsAssets.contract.test.ts`, `loudness.contract.test.ts`, `cortes.contract.test.ts` (R-NOVA), `src/components/settingsSom.render.test.tsx`.
- Medido: `ls -l public/sounds/` → 5 arquivos, 4498+7641+1570+122447+122092 = **258 248 bytes** (bate com S16). `grep -nE "^export function play" src/utils/sounds.ts` → **8** símbolos.

### (b) Backlog × estado (o que S16 deixou pendente)
| Pendência | Estado medido |
|---|---|
| **A/B cego** | `PERGUNTAS-DO-DONO.md` #8: "fica aberto" — dono respondeu "aceito como está". Arnês em `E:/Soulmon-assets/som-01/ab/escuta.html` (fora do repo). Gatilho da S10 continua armado: procedural vence/empata em ≥2 de 3 → os 3 assets saem. **"IA venceu"/"procedural venceu" seguem proibidas** (SOM §5). |
| **`SettingsModal` órfão** | **Falso hoje, parcialmente.** `src/App.tsx` › `handleOpenAISettings = () => setSettingsOpen(true)` → passado como `onOpenAISettings` ao `CompanionHUD` → `ChatBox`. Logo o modal abre pelo chat. Mas o mudo agora mora **em dois lugares** (`SettingsModal` › `onToggleSound` e `SettingsPage` grupo "Som"). STATUS de 21/09 diz "segue sem gatilho vivo — candidato a remoção": a frase "sem gatilho" está errada; "candidato a remoção" (duplicata) está certo. |
| **Sons curtos procedurais** | 5 (`playPresence`, `playFeed`, `playShower`, `playSleep`, `playVisorTune`) sem asset; #9 respondido: regerar 4 com cláusula de duração + reescrever `transaction` sem click (limite 6,0 dB mantido). Nada gerado ainda no repo. |
| Recaptura dos 8 sons pelo `audioBus` no arnês | pendente (SOM §7 O-7). |
| Degeneração sem linha na spec (`pos-processar.mjs` recusa) | aberta, dono do número = `som-engenheiro-audio`. |
| Provedor terceiro do `seed_audio` não nomeado (S15 §8) | aberta; risco aceito com registro. |
| Microfone do `ChatBox` × Data Safety | 🔴 fora do escopo do som, **bloqueia publicação** (SOM §7). |

### (c) Vocabulário
`grep -riE "tamer|domador|digievolu|mundo digital" src/utils/{sounds,audioBus,loudness,sonsAssets,trilha}.ts public/sounds/` → 0. Nomes de asset (`evolve`, `degenerate`, `task-complete`, `trilha-*`) limpos.

### (d) O que a squad nunca olhou
1. **Nenhum asset foi ouvido pelo gate humano (S8)** — taxa de aprovação não existe; "toda parte de som pronta" foi instalada sem uma única linha em `escuta/<fase>.md`.
2. **Som sem categoria: nenhum** (8/8 em `CATEGORIA_DO_SOM`) — mas a **trilha não é categoria** da escada; vive só em `ALVO_TRILHA_LUFS_S`. Se um dia entrar um SFX novo via `playComAsset` sem entrada em `CATEGORIA_DO_SOM`, o AC-4 do arnês (fora do repo, exige Chromium) é quem reprova, não a suíte `vitest`.
3. **`desktop/` (Electron) e o widget Android**: som nunca mapeado lá — R-NOVA diz que nasce mudo; ninguém mediu se `desktop/renderer` emite algo.
4. A duplicidade do mudo (item (b)) não foi vista pela squad de som — foi o doc-mantenedor.
5. Codec = MediaRecorder do Chrome (48/32 kbps Opus) — escolha por falta de `ffmpeg`, nunca avaliada contra o alvo de −1 dBTP após decodificação em outro motor (Safari/WebKit).

---

## 3. SQUAD-ARTE

### (a) Entregue
- Docs: `docs/INVENTARIO-ASSETS.md` (15/09, censo), `docs/ASSETS-A-GERAR.md` §11 (estado) e §13 (rodada 2, 21/09), `docs/BACKLOG-ARTE-GERAR.md` (A1–A21, maioria ✅), `docs/PENDENCIAS-ARTE-UI-HIGGSFIELD.md` (09/08, sessão Higgsfield).
- Código que prova:
  - `src/utils/attackFxArt.ts` › `auraForElement(el, size: 96 | 128)` — R2-3, aura em PNG (usada em `PetPage.tsx` e `EvolutionPath.tsx`).
  - `src/utils/fxArt.ts` › `FX_ART` (chave emoji → PNG) consumido por `games/GameKit.tsx` › `VisorFx`/`FxPopup`.
  - `src/utils/lineIcons.ts` (R2-2, 72 ícones), `ANIM_ART.sleepZLight` (R2-4), `desktop/renderer/src/main.ts` › `EFFECT_ART` (R2-5, `EFFECT_ICON` removido), `android/.../drawable/ic_notification.xml` (C4).
- Medido: `find src/assets -type f \( -name "*.png" -o -name "*.webp" -o -name "*.svg" \) | wc -l` → **1720**.

### (b) Backlog × estado — o que ainda é fallback
| grep | Resultado | Veredito |
|---|---|---|
| `auraForElement` | `PetPage.tsx`, `EvolutionPath.tsx`, `attackFxArt.ts` — devolve PNG 96²/128² | ✅ **não é mais CSS** (R2-3, `118131f4`) |
| `'restaurant'` / `'bedtime'` | `CompanionHUD.tsx` (ações Alimentar/Dormir), `DailyReportModal.tsx`, `StatsPage.tsx` (`guloso: 'restaurant'`), `desktop/renderer/src/menu.ts` | Material Symbols **por decisão** ("O Visor": fora do vidro é vetor). Não é fallback — o overlay de desktop (D-F10) já trocou para glifo pixel via `EFFECT_ART` (R2-5); `menu.ts` `careButton('restaurant')` segue Material, coerente com a tese |
| emoji fallback | `games/GameKit.tsx` › `FxPopup`: "sem arte cai no texto" (`<span>{icon}</span>`) — fallback vivo por desenho; `VisorFx` usa chave emoji mas renderiza PNG | Único emoji que ainda pode ir à tela **dentro do visor** é um popup cuja chave não esteja em `FX_ART` |
| `.sm-px-*` (kit pixel fora do visor) | `grep -rl 'sm-px-' src --include=*.tsx \| grep -v test \| wc -l` → **14** (era 28 em 09/09): App, AccountSection, ActivitiesPage, ChatBox, CityPicker, FormKit, GameTutorialFlow, LibraryPage, OraclePage, PixelFrame, SettingsPage, SoulmonOnboarding, SoulTestItem, TournamentPage | dívida da tese, compartilhada com design |
| BACKLOG A13 splash, A15 traços, A16 relatório, A7 decoração 14 peças | A15: `StatsPage.tsx` usa Material por traço (D-S2) — resolvido por vetor, não por pixel; A13/A16 sem marca ✅ no doc | doc não fechado |
| `ASSETS-A-GERAR` §11 F6 `anim-hunger-drop` | "gerado, sem chamada" | asset instalado sem uso |
| §13 R2-6 | "`dist/` ainda não rebuildado" | verificar no próximo build |

### (c) Vocabulário
Nomes de arquivo de asset não varridos exaustivamente nesta QA; o guard `sprites.dungeonRoster.test.ts` varre o bundle e os drawables por nomes Bandai (Attributions §"Hoje há régua").

### (d) O que a squad nunca olhou
1. **Asset sem attribution**: `grep -c "src/assets\|_gemini_out\|gpt_image" docs/Attributions.md` → **2** (só os 25 `*_dmc.png` legados e "arte própria em `src/assets/soulmon/`"). Para ~1.720 imagens geradas por IA (Gemini, `gpt_image_2`, `nano_banana_pro`, Seedream) **não há linha de procedência** (modelo, job, prompt, data, versão dos termos) — o som tem exatamente isso por arquivo (S9/S15). O risco §13.2 dos termos vale igual para imagem, e `dist/` é commitado.
2. **~150 arquivos instalados sem referência** (`INVENTARIO-ASSETS.md` §2) — vereditos escritos em 15/09, limpeza (§8) não executada; o inventário se declara "estado ANTES da rodada; re-varrer com `/squad-arte inventario`" e ninguém re-varreu após a rodada 2.
3. **`PENDENCIAS-ARTE-UI-HIGGSFIELD.md`** (09/08) nunca foi conciliado: item "-1" (`desktop/` não builda: `LEFT_FACING_STAGES`, `getSpriteForStage` 3 args) — conferir se ainda vale; scripts `gen-decor-remaining.sh`/`gen-ui-assets.sh` sem decisão.
4. **Kit de UI pixel `E:\Soulmon-assets\out\` (179)** — "nunca instalado; quase todo FORA do visor" (§4): decisão de descarte formal não registrada.
5. `INVENTARIO-ASSETS.md` §0 diz `public/` tem 6 imagens — hoje há também `badge-96.png`, `push-large-192.png`, `favicon.svg`, `screenshots/`; número apodreceu.

---

## 4. SQUAD-DESIGN

### (a) Entregue
- Docs: `docs/HANDOFF-WIREFRAMES.md` (Fase 1, 13 canvases), `docs/HANDOFF-IDENTIDADE.md` (processo Fase 2), `docs/HANDOFF-IMPLEMENTACAO-IDENTIDADE.md` (inventário de material), `docs/design/INVENTARIO-WIREFRAMES.md` (tabela-mestra, §2 fluxos, §3 fora), `docs/design/DECISOES-WIREFRAME.md` §5–§17 (wireframe) e §18–§31 (identidade), `docs/design/PRINCIPIOS-DE-WIREFRAME.md`, `docs/design/wireframes/<14 fluxos>/identidade/` (`ls -d docs/design/wireframes/*/identidade/ | wc -l` → 14).
- Código que prova:
  - `src/components/BottomNav.tsx` — "Rótulo em Rubik 12px, caixa mista. Era Silkscreen a 8px" (`--sm2-font-text`, `--sm2-text-xs`): divergência #2 do HANDOFF fechada.
  - `src/components/form/FormKit.tsx` › `SwitchRow` etc. — átomos do canvas Sistema (SIS-0x citados em 43 arquivos).
  - `src/components/StatsPage.tsx` — "Canvas Estatísticas (§27, identidade): cards SIS-03 (`.sm2-stats-card`)", mapa D-S2.
  - `lucide-react`: `grep -rl "from 'lucide-react'" src | grep -v test | wc -l` → **0** (era 8): divergência #3 fechada.

### (b) Os 14 canvases × código
Comando: `grep -rlE "<id do canvas>" src desktop/renderer/src --include=*.tsx --include=*.ts --include=*.css | grep -v test | wc -l` (ids D-H/D-A/D-R/D-P/D-O/EVO/D-J/D-L/D-S/D-C/D-K/D-F/D-Q + "canvas <nome>" + "SIS-0").

| Canvas | Arquivos que citam | Componente-âncora |
|---|---|---|
| Sistema (§18) | 43 | `form/FormKit.tsx`, `BottomNav.tsx`, `ScreenSkeleton` |
| Home (§19) | 18 | `CompanionHUD.tsx`, `ItemsWindow.tsx`, `CareSystem.tsx` |
| Atividades (§20) | 16 | `ActivitiesPage.tsx`, `CreateModal.tsx`, `EditModal.tsx` |
| Rituais (§21) | 14 | `DailyReportModal.tsx`, `MilestoneCeremony.tsx`, `MorningCheckIn.tsx` |
| Pet (§22) | 13 | `PetPage.tsx`, `DreamDex.tsx`, `AdventureDiary.tsx` |
| Onboarding-funil (§23) | 7 | `SoulmonOnboarding.tsx`, `IntroScreen.tsx`, `BrandFlame.tsx` |
| Evolução (§24) | 9 | `EvolutionPath.tsx`, `evolution/SoulNode.tsx`, `nodeArt.tsx` |
| Jogos (§25) | 11 | `games/GameKit.tsx`, `DungeonGame.tsx`, `TournamentPage.tsx` |
| Loja (§26) | 7 | `ShopModal.tsx`, `CreditsModal.tsx`, `currencies.ts` |
| Estatísticas (§27) | 1 por id (+ `§27` em `StatsPage.tsx`, `BestiaryCard.tsx`, `FormAlbum.tsx`) | `StatsPage.tsx` |
| Social (§28) | 1 por id (+ `LibraryPage.tsx`, `CoopPanel.tsx`, `PlayerDetailModal.tsx` citam `§28`) | `LibraryPage.tsx` |
| Conta (§29) | 17 | `SettingsPage.tsx`, `AccountSection.tsx`, `AccountDataSection.tsx` |
| Fora do app (§30) | 6 | `desktop/renderer/src/main.ts`, `menu.ts`, `src/utils/notifications.ts` |
| Onboarding-oráculo (§31) | 5 | `SoulmonOnboarding.tsx`, `BirthCard.tsx`, `UnlockAccountModal.tsx` |

**Todos os 14 têm implementação que cita o canvas.** Não implementado / dívida que fica:
- `.sm-px-*` em **14** `.tsx` (tese "O Visor" ainda furada em `SettingsPage`, `AccountSection`, `ChatBox`, `FormKit`, `SoulmonOnboarding`, `TournamentPage`…).
- `OraclePage` **ainda no bundle** (`grep -c OraclePage src/App.tsx` → 2: lazy import + render), inalcançável por medição (`INVENTARIO-WIREFRAMES` §3.1); `PixelizerCard` junto.
- `PixelFrame` em 3 arquivos — ornamento pixel fora do visor, sem canvas e sem decisão de saída.
- `src/components/ui/` (shadcn): `ls | wc -l` → **9** (eram 44) — resto de dívida de sistema.
- Fase 2 §2 escolha 3: só o `Main` de cada fluxo tem tema claro desenhado; estados secundários claros nunca foram vistos.

### (b') `INVENTARIO-TELAS.md` sem canvas
`grep -oE "[A-Z][A-Za-z0-9]+\.tsx" docs/INVENTARIO-TELAS.md | sort -u` → 60 nomes; 7 não aparecem em `design/INVENTARIO-WIREFRAMES.md`:
- **Não existem mais** (`ls src/components/**`): `DigivolutionProgress.tsx`, `RowIcon.tsx`, `WalkingPetStrip.tsx`.
- **Existem, sem canvas**: `AlignmentIcons.tsx`, `PetStageDecor.tsx` (decoração dentro do visor — conteúdo, não tela), `pixel/PixelKit.tsx` (kit, dívida), `evolution/SoulNode.tsx` (átomo do canvas Evolução, citado em código mas não no inventário).
Conclusão: `INVENTARIO-TELAS.md` (19/08/2026) foi **substituído** por `manual/03-FLUXO-DE-TELAS.md` (47 superfícies `###`) + `INVENTARIO-WIREFRAMES.md`; ninguém o marcou como ⚰️.

### (c) Vocabulário
Canvases `.dc.html` em `docs/design/wireframes/` não foram varridos nesta QA (fora do guard; texto de canvas vira copy por cópia).

### (d) O que a squad nunca olhou
1. **Tela sem canvas que está no ar**: `OraclePage` + `PixelizerCard` (bundle, inalcançável — "não vira artboard" mas também não saiu), `PixelFrame`, `ErrorBoundary` (1 menção), `AISettingsModal` (1 menção), `SettingsModal` "Ajustes rápidos" (duplicata do mudo, ver som).
2. **Tema claro dos estados secundários** — decisão explícita de não desenhar; nenhum teste de render em tema claro além de `tokens.contrast.test.ts`.
3. **`desktop/` Electron** — canvas Fora do app cobre widgets e overlay, mas `HANDOFF-IMPLEMENTACAO` §5 admite "não confirmou onde vive o código dos widgets Android" (vive em `android/app/src/main/java/.../widget/`).
4. **Grid/tokens de espaço** — divergência #5 do HANDOFF (literal em todo lugar) sem régua nem canvas.
5. `INVENTARIO-TELAS.md` e `HANDOFF-WIREFRAMES.md` seguem como docs vivos sem lápide.

---

## 5. Cruzamentos (o que uma squad deixou para a outra e ninguém pegou)

| Buraco | Entre | Prova |
|---|---|---|
| Copy do widget Android EN-only com "I missed you!" | narrativa × design (canvas Fora do app aprovou o widget) | `WidgetRenderer.kt` › `CHAT_FIXED_PHRASES` |
| Copy do push | narrativa × som (push toca na D11) | `functions/api/_pushCopy.js`, 0 menções em NARRATIVA-COPY |
| Procedência de imagem gerada por IA | arte × PI (guardian) | `docs/Attributions.md` só tem áudio com hash |
| Mudo em dois lugares | som × design | `SettingsModal.onToggleSound` + `SettingsPage` grupo Som |
| Emoji dentro do visor via `FxPopup` sem `FX_ART` | arte × design | `games/GameKit.tsx` › `FxPopup` fallback textual |
| `.sm-px-*` em 14 arquivos | arte × design | comando em §3(b) |
| Guard de vocabulário só em `src/` | narrativa × todas | `fontesDeTexto` em `narrativa.contract.test.ts` |
