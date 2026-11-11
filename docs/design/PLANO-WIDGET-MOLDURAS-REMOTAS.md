# Plano: molduras (e fundos) do widget V-Pet pela web, sem APK novo

> **Dono:** squad-design + staff-backend (a decidir na execução) · **Data:** 11/11/2026 (beta12 em planejamento; base `7a7ecf9`, `versionName` `1.3.0-beta11`, `versionCode` 31) · **Estado:** PLANO, nada implementado; o estado real é o código.
> **Verificação:** cada afirmação sobre o código foi lida em `7a7ecf9` (símbolos citados por nome, sem número de linha); `npx vitest run src/docsManual.contract.test.ts` verde com este arquivo indexado no `docs/manual/00-MAPA.md` §6.7.
> **Não cobre:** a arte das molduras (ver `docs/ASSETS-A-GERAR.md`; gerar pelo ChatGPT desktop, não Higgsfield), regra de posse/preço (`src/utils/widgetFrames.ts` e `docs/manual/08-INTEGRACOES-E-DEPLOY.md` §2.8), nem o desenho dos widgets em si (`docs/design/wireframes/fora-do-app/`).
> **Precedência:** código > teste > `CLAUDE.md` > este plano.

## 0. Resumo (o que o dono precisa saber)

- Hoje as 20 molduras são drawables empacotados no APK (`android/app/src/main/res/drawable-nodpi/moldura_vpet_<elemento>.png`, 576x384, 1,6 MB no total, ~80 KB cada), e a lista de ids válidos está **fixa no Kotlin** (`WidgetVpet.FRAME_ELEMENTS`) e no TS (`WIDGET_FRAME_ELEMENTS`). Moldura nova = APK novo + Play. O mesmo vale para as 57 miniaturas de cenário (`vpet_bg_<id>.webp`, 832 KB).
- Proposta: um **manifesto JSON versionado**, servido como arquivo estático pelo próprio Worker, lista molduras (e cenários) com URL de imagem **com hash no nome** e `sha256`. O Android **baixa em segundo plano** (WorkManager + ao abrir o app), guarda em disco (`noBackupFilesDir`) e o renderer do widget **só lê do disco**. As 20 embutidas continuam como **fallback**: sem rede, sem cache, arquivo corrompido ou hash errado, o widget desenha exatamente o que desenha hoje.
- **Exige UM APK (a beta12)** com o código nativo novo. Depois dele, moldura nova entra por PR de web (PNG + linha no manifesto), sem APK.
- **Não mexe em `wrangler.jsonc`**: nem `assets`, nem `run_worker_first` (regra permanente, ver §3.2). Arquivo existente em `dist/` é servido antes do fallback SPA, o mesmo mecanismo já usado por `/gm/*`.
- Esforço: ~4 PRs obrigatórios (~4 a 5 dias de agente + teste em aparelho real), 2 opcionais. Seção 9.

## 1. Estado atual (levantado no código)

| Peça | Onde | Fato |
|---|---|---|
| Arte da moldura | `res/drawable-nodpi/moldura_vpet_<id>.png` (20) + `vpet_moldura.png` (padrão) | 576x384; todas com a MESMA abertura de LCD (x 108..467, y 71..263) |
| Allowlist | `WidgetVpet.FRAME_ELEMENTS` (Kotlin) ↔ `WIDGET_FRAME_ELEMENTS = BASE_ELEMENT_IDS` (TS) | id fora dos 20 é descartado em dois lugares (plugin e `isWidgetFrameId`) |
| Resolução da arte | `WidgetRenderer.vpetCasingRes` | `getIdentifier("moldura_vpet_<id>")`; `0` = cai em `R.drawable.vpet_moldura`; nunca lança |
| Desenho | `WidgetRenderer.drawVpet` | um único bitmap 576x384 ARGB_8888 (~884 KB), `inScaled=false`; casco decodificado por `decodeResource`; se falhar cai no padrão; `OutOfMemoryError` no `renderVpet` cai em `setImageViewResource` |
| Seleção do jogador | `App.tsx`: `vpetFrame: resolveWidgetFrame(gameState.widgetFrame, effectiveOwnedFrames(...))`; `vpetBg: widgetBgId(gameState.equippedBackground)` | id vai ao Android por `SoulmonWidgetPlugin.updateData` |
| Bridge | `SoulmonWidgetPlugin.kt` grava `vpet_frame` / `vpet_bg` nas SharedPreferences do widget (`PREFS_NAME`), só se o id passar `frameDrawableName` / `bgDrawableName` | chave ausente = casco padrão / sem cenário |
| Rede no widget | `WidgetOwnSprite` já baixa o sprite do jogador (HTTPS, host por igualdade exata, `MAX_BYTES` 6 MB, cópia em `filesDir`) | **precedente direto**: a mesma política serve às molduras |
| Agendamento | `WidgetRefreshWorker` (`PeriodicWorkRequest` 15 min + `OneTimeWork` da fome), `androidx.work:work-runtime-ktx:2.9.0` | WorkManager já é dependência |
| Permissão | `AndroidManifest.xml` já declara `android.permission.INTERNET` | **nenhuma permissão nova** |
| Web servida pelo Worker | `capacitor.config.json` aponta `server.url` para `https://soulmon.mateus-sprnd.workers.dev`; `wrangler.jsonc` `assets.directory = ./dist`, `not_found_handling = single-page-application`; sem R2, só KV e D1 | o JS do app já vem do Worker; só o código nativo exige APK |
| Compra | `PRODUCTS` em `functions/api/_billing.js`: `moldura_<elemento>` por base de `COUNTER_RING` (20), `grantFrame` empurra o elemento em `ent.frames` | posse paga é do servidor |

Consequência de design: **a posse** (quem pode usar) já é decidida pelo app/servidor; o que falta é **o catálogo de arte** deixar de ser constante de compilação.

## 2. Arquitetura

### 2.1 Visão geral

```
 PR (dono) ──► public/widget-frames/{manifest.json, <id>.<sha8>.png, bg/<id>.<sha8>.webp}
                      │  npm run build (dist/ é commitado) + deploy normal do Worker
                      ▼
   https://soulmon.mateus-sprnd.workers.dev/widget-frames/manifest.json   (arquivo estático, ASSETS)
         ▲                                              ▲
         │ fetch (If-None-Match)                        │ fetch (catálogo p/ o seletor e a prévia)
   Android: WidgetFramesSync (Worker + plugin)     Web: useRemoteFrameCatalog()
         │ valida host, tamanho, sha256, dimensões
         ▼
   noBackupFilesDir/widget_frames/{manifest.json, <id>.<sha8>.png ...}
         ▲
         │ só LEITURA, síncrona, sem rede
   WidgetRenderer.renderVpet  → ordem: cache válido → drawable embutido (20) → casco padrão
```

### 2.2 Manifesto (`/widget-frames/manifest.json`)

```json
{
  "schema": 1,
  "version": 7,
  "enabled": true,
  "geometry": { "w": 576, "h": 384, "screen": { "l": 108, "t": 71, "r": 467, "b": 263 } },
  "frames": [
    {
      "id": "fogo",
      "name": { "pt-BR": "Fogo", "en": "Fire" },
      "url": "fogo.3fa91c02.png",
      "sha256": "…64 hex…",
      "bytes": 75786,
      "acquire": { "type": "element", "element": "fogo" }
    },
    {
      "id": "festa_2026",
      "name": { "pt-BR": "Festa de fim de ano", "en": "Year-end party" },
      "url": "festa_2026.b81d00ee.png",
      "sha256": "…",
      "bytes": 91230,
      "acquire": { "type": "free" },
      "minVersionCode": 32,
      "until": "2027-01-31"
    }
  ],
  "backgrounds": [
    { "id": "bg-forest", "url": "bg/bg-forest.9c1a77d0.webp", "sha256": "…", "bytes": 10872 }
  ]
}
```

Regras do formato:

- `version`: inteiro **monotônico**. O cliente nunca aceita manifesto com `version` menor que o que já guarda (impede "downgrade" por cache velho de CDN/intermediário).
- `enabled: false` = **kill-switch**: o Android ignora o remoto e volta só às embutidas (e apaga o cache).
- `geometry`: se divergir das constantes compiladas (`WidgetVpet.W/H/SCREEN_*`), as molduras remotas são **ignoradas** (o sprite, o texto e os ícones são posicionados por constantes nativas; ver §7). Protege contra arte feita para uma abertura diferente.
- `id`: `^[a-z][a-z0-9_]{1,31}$` (frames) e o `^bg-[a-z0-9-]{1,48}$` já existente (cenários). Nada de `/`, `.`, `..`: o id vira parte de nome de arquivo.
- `url`: **relativa** ao manifesto; o cliente monta e confere que o host resultante é exatamente `APP_HOST` (mesma `Policy` do `WidgetOwnSprite`), esquema `https`, sem redirecionamento para outro host.
- `acquire`: como se conquista. Fase 1 suporta `element` (as 20, comportamento de hoje: evolução ou compra `moldura_<elemento>`) e `free` (todo jogador possui). `paid` com SKU novo e `event` ficam para a PR opcional (§9).
- `minVersionCode` / `until` (opcionais): filtro de janela por versão do app e por data (UTC).
- Tamanho do manifesto: alvo < 16 KB (20 + dezenas de linhas).

### 2.3 Hospedagem das imagens e do manifesto

**Escolha (fase 1): arquivos estáticos em `public/widget-frames/`.** Entram em `dist/` no `npm run build` e vão no deploy normal. Justificativa:

- zero mudança em `wrangler.jsonc`; arquivo existente em `dist/` é servido antes do fallback SPA (o mesmo caminho que o `scripts/build-gm-pages.mjs` já usa para `/gm/*`, e o motivo de nunca precisar de `run_worker_first`);
- revisável em PR, versionado no git, passa pelos 10 checks, rollback por revert;
- sem R2 no projeto, sem custo novo, sem Function nova no caminho crítico.

Cabeçalhos (em `public/_headers`, que já existe; **não é** `wrangler.jsonc`):

- `/widget-frames/manifest.json` → `Cache-Control: no-cache` (sempre revalida; ETag do edge permite `304`);
- `/widget-frames/*` (imagens com hash no nome) → `public, max-age=31536000, immutable`.

O guard de CSP/headers (`src/security/csp.test.ts` e o contrato de `_headers`) deve ser rodado na PR 1; nenhuma regra nova toca a CSP.

**Alternativa descartada por ora (fase 2, se o dono quiser publicar sem PR):** rota `GET /api/widget-frames` lendo KV (como `sprite-image` guarda binário na KV de saves) + página `/gm/*` de upload. Mais flexível, porém: namespace KV novo ou prefixo no de saves (decisão sensível desde 20/10), nova superfície de escrita e de segurança, e a página GM precisaria entrar no `build-gm-pages.mjs`. Só vale se o ritmo de molduras virar semanal.

**Service worker da web:** `public/sw.js` não deve cachear o manifesto de forma agressiva. A web busca `/widget-frames/manifest.json` com `cache: 'no-cache'`; confirmar na PR 3 que o ramo de `fetch` do `sw.js` deixa esse caminho em rede (ele só trata `/assets/` e navegação com política própria). Imagens com hash são seguras em qualquer cache.

### 2.4 Formato, tamanho e limites de memória da arte

| Item | Regra | Por quê |
|---|---|---|
| Dimensão | exatamente **576x384** | é o tamanho do bitmap do widget (`WidgetVpet.W/H`); outro tamanho = rejeitado |
| Formato | PNG com alfa real (frames); WebP (cenários, como as miniaturas de hoje) | `BitmapFactory` decodifica os dois no `minSdk` 26; PNG preserva pixel art |
| Peso | alvo ≤ 120 KB; **teto 256 KB por frame**, 64 KB por cenário | as 20 atuais têm ~75 a 90 KB |
| Abertura do LCD | pixels da abertura (x 108..467, y 71..263) **100% transparentes** | o LCD, o sprite e o texto são desenhados SOB o casco; se a abertura estiver opaca, o widget fica cego (o script de publicação valida) |
| Cache total | teto de **6 MB** no disco; frames que saíram do manifesto são apagados (LRU) | a conta de uso do aparelho |
| Memória por render | inalterada: 1 bitmap de saída (576x384x4 ≈ 884 KB) + 1 decodificação do casco (mesmo tamanho) | o limite de bitmap dos `RemoteViews` (alguns MB por update, escala com a tela) já comporta isso hoje; **a arte remota não pode ser maior que a embutida**, por isso o rigor de 576x384 |

Decodificação segura no renderer: `inJustDecodeBounds` primeiro (confere 576x384 e aborta senão), depois decode real com `inScaled = false`, `inPreferredConfig = ARGB_8888`, dentro do `try/catch` que já trata `OutOfMemoryError`.

### 2.5 Cache em disco e ordem de resolução

- Pasta: `Context.noBackupFilesDir/widget_frames/` (fora do auto backup, que está `allowBackup="true"`, e fora do `cacheDir` que o sistema limpa sem aviso). Arquivos: `manifest.json` (o último aceito) e `<id>.<sha8>.png`.
- Escrita **atômica**: baixa para `*.tmp`, confere tamanho, `sha256` e dimensões, só então `renameTo`. Manifesto novo só é promovido depois que **todas as imagens novas que ele cita** foram validadas (ou as que faltam são ignoradas individualmente, ver abaixo); nunca fica meio estado.
- Resolução no `renderVpet` (síncrona, sem rede):
  1. id no manifesto em cache E arquivo `<id>.<sha8>.png` presente E (checagem barata) tamanho bate com `bytes` → usa;
  2. senão, id entre as 20 embutidas → `getIdentifier("moldura_vpet_<id>")`;
  3. senão → `R.drawable.vpet_moldura` (padrão).
  Mesma ordem para cenários (`vpet_bg_<id>` embutido como fallback).
- O remoto **sobrepõe** o embutido do mesmo id (permite corrigir uma arte sem APK). Reverter = tirar a linha/alterar o manifesto. Decisão do dono em §8.
- Falha de qualquer natureza num passo desce para o seguinte; o widget nunca fica sem casco.

### 2.6 Atualização (quando baixa)

1. **WorkManager periódico** `WidgetFramesSyncWorker`: único (`enqueueUniquePeriodicWork`, `UPDATE`), a cada 24 h (mínimo seguro; o `WidgetRefreshWorker` de 15 min NÃO faz rede), `Constraints(NetworkType.CONNECTED)`, backoff exponencial em falha (`Result.retry()` até 3 vezes, depois `success` para esperar o próximo ciclo). Agendado no `onEnabled` do provider do V-Pet e a cada `updateData`.
2. **Ao abrir o app**: a web chama um método novo `SoulmonWidget.syncWidgetFrames()` (uma vez por sessão, depois do login, sem argumentos: a URL é constante nativa, **a web não consegue mandar URL**). Limitado a 1 chamada por hora (timestamp em SharedPreferences) e usa `If-None-Match` com o ETag guardado (`304` = nada a fazer).
3. **Ao escolher uma moldura ainda não baixada** (o jogador toca no seletor): o plugin baixa só esse id na hora e, ao terminar, chama `WidgetRenderer.updateAll`; enquanto isso o widget mostra o casco anterior.
4. Depois de qualquer download bem-sucedido, `WidgetRenderer.updateAll(context)` redesenha os widgets.

### 2.7 Integridade, segurança e offline

- **Transporte:** só `https` e só o host do app (igualdade exata, nunca sufixo); sem seguir redirecionamento para fora; `connectTimeout`/`readTimeout` curtos (10 s), corpo limitado por `MAX_BYTES` do tipo (frame 256 KB, manifesto 64 KB, cenário 64 KB).
- **Integridade:** `sha256` por arquivo no manifesto, conferido ANTES de promover o arquivo. O hash está no nome do arquivo também (`<id>.<sha8>.png`): arquivo diferente = nome diferente = nunca confunde cache.
- **Confiança do manifesto:** o mesmo domínio que já serve o JavaScript do app inteiro (`server.url`). Assinar o manifesto não aumenta a segurança real (quem controla o Worker já controla o app); por isso **não se propõe assinatura**. Se o dono preferir defesa em profundidade, a chave pública vai embutida no APK da beta12 (custo: ~0,5 dia e gestão de chave).
- **Offline / sem rede / CDN fora:** o widget continua com o último cache ou com as 20 embutidas. Nenhuma tela de erro, nenhum redesenho em branco.
- **Privacidade:** requisição GET sem cookie, sem cabeçalho de identidade, sem id de usuário; o servidor só vê um IP como em qualquer asset. Não muda o Data Safety da Play.

## 3. Mudanças nativas mínimas (a beta12)

### 3.1 Arquivos

| Arquivo | Mudança |
|---|---|
| `android/app/src/main/java/com/soulmon/widget/WidgetFrameStore.kt` (**novo**) | `object` com a parte PURA (testável em JUnit, sem Android): `Policy` (regex de id, `isAllowedUrl`, limites de bytes/dimensão), `parseManifest(json)`, `pickPlan(manifest, cache, nowMs, versionCode)`, `resolveOrder(...)`; e a parte com `Context` (dir, escrita atômica, leitura do arquivo, limpeza LRU) |
| `.../widget/WidgetFramesSync.kt` (**novo**) | `suspend fun sync(context, force: Boolean)`: baixa manifesto (ETag), valida geometria/`enabled`/`version`, baixa imagens faltantes com sha256, promove, limpa excedentes, chama `WidgetRenderer.updateAll`; também `ensureOne(context, id)` |
| `.../widget/WidgetFramesSyncWorker.kt` (**novo**) | `CoroutineWorker` fino que chama `WidgetFramesSync.sync`; `schedule(context)` com `NetworkType.CONNECTED` |
| `.../widget/WidgetVpet.kt` | `FRAME_ELEMENTS` fica como **conjunto de embutidas** (fallback); novo `isValidFrameId(id)` por regex; `frameDrawableName(id)` continua só para as embutidas; `bgDrawableName` idem |
| `.../widget/WidgetRenderer.kt` | `vpetCasingRes` → `vpetCasing(context, frameId): Casing` (sealed: `Res(id)` ou `File(path)`); `drawVpet` decodifica um ou outro; idem o fundo; `OutOfMemoryError`/decode falho continuam descendo ao padrão |
| `.../widget/SoulmonWidgetVpetProvider.kt` | `onEnabled` também agenda `WidgetFramesSyncWorker` |
| `.../plugins/SoulmonWidgetPlugin.kt` | aceita `vpetFrame`/`vpetBg` com a **forma** válida (regex) em vez da allowlist fechada; novo `@PluginMethod syncWidgetFrames`; ao gravar `vpet_frame` que não está em cache, dispara `ensureOne` |
| `android/app/build.gradle` | só `versionCode` 32 e `versionName "1.3.0-beta12"` (e, se couber, o comentário do histórico). **Sem dependência nova** |
| `android/app/src/main/AndroidManifest.xml` | **nenhuma mudança**: `INTERNET` já está declarado e o WorkManager 2.9.0 não pede permissão extra além das que já existem |
| `android/app/src/test/java/com/soulmon/widget/WidgetFrameStoreTest.kt` (**novo**) e `WidgetVpetTest.kt` | JUnit da parte pura (§6) |

### 3.2 Web e regra do Worker (resumo)

Nenhuma alteração em `wrangler.jsonc`. **Regra permanente: NUNCA mexer em `assets`/`run_worker_first`** (incidente de 09/11/2026: derrubou `/api/*`; o teste `src/deploy/gmPaginasEstaticas.contract.test.ts` falha se `run_worker_first` reaparecer). Arquivo estático em `dist/` basta.

## 4. Mudanças web

| Arquivo | Mudança |
|---|---|
| `public/widget-frames/manifest.json` + imagens (**novos**) | v1 = as 20 molduras atuais (copiadas dos `res/`, renomeadas com hash) + os 57 cenários (miniaturas já existentes), de modo que manifesto = embutidas; zero mudança visível |
| `public/_headers` | as duas regras da §2.3 |
| `scripts/widget-frames-publish.mjs` (**novo**) | CLI do dono (§5): valida PNG, calcula hash, grava arquivo e linha do manifesto, sobe `version` |
| `src/utils/widgetFrames.ts` | `WIDGET_FRAME_ELEMENTS` continua sendo as 20 (posse por elemento, compra, evolução: inalterados). Novo `useRemoteFrameCatalog()` (busca o manifesto com `no-cache`, valida com o mesmo schema, cai em "só as 20" se offline) e `widgetFrameRows` passa a listar embutidas + remotas; `isWidgetFrameId` vira dois conceitos: `isFrameIdShape` (forma, usada no hydrate) e `isCatalogFrame` (existe no catálogo, usada em `resolveWidgetFrame`) |
| `src/components/WidgetFramePicker.tsx` | lista do catálogo; prévia vem da própria URL do PNG remoto (a prévia opcional de `src/assets/soulmon/widget-molduras/` vira fallback); frames `free` aparecem como possuídos |
| `src/plugins/SoulmonWidgetPlugin.ts` | novo método `syncWidgetFrames()` (no-op na web/desktop); comentário de `vpetFrame` atualizado |
| `src/App.tsx` | chamada de `syncWidgetFrames()` uma vez por sessão após o login |
| `src/contexts/GameStateContext.tsx` | o hydrate de `widgetFrame` passa a aceitar a FORMA do id (hoje apaga ids fora dos 20), senão uma moldura remota escolhida seria zerada antes do catálogo carregar; `resolveWidgetFrame` (no envio ao Android) é quem confere com o catálogo, e só envia depois que o catálogo carregou (ou reenvia o último id válido) |
| `public/sw.js` | só conferir (e, se preciso, excluir) `/widget-frames/manifest.json` do cache agressivo; sem bump de `CACHE_VERSION` se o arquivo não mudar |
| Testes | contrato do manifesto (§6), `widgetFrames.test.ts`, `WidgetFramePicker.render.test.tsx`, `widgetVpetSonoFundo.contract.test.ts` |
| Servidor (`functions/api/_billing.js`) | **fase 1: nada**. Só as 20 têm SKU; `sanitizeOwnedWidgetFrames` do servidor continua restrito às 20 (a paridade com o TS é travada por `_billing.moldura.test.js`) |
| Manual | `docs/manual/00-MAPA.md` (esta PR já indexa o plano); na execução, `docs/manual/08-INTEGRACOES-E-DEPLOY.md` §2.8 e `06-REFERENCIA/plugins-constants.md` pelo `manter-docs` |

## 5. Como o dono adiciona uma moldura nova SEM APK (depois da beta12)

1. **Gerar a arte** 576x384 PNG com alfa real, abertura do LCD (x 108..467, y 71..263) transparente, seguindo a identidade de UI. Gerar pelo ChatGPT desktop (regra de 09/11/2026: arte nova de design não sai do Higgsfield); registrar prompt e tags em `registro.jsonl`/`meta.json` (regra de 10/11/2026).
2. **Publicar localmente:** `node scripts/widget-frames-publish.mjs add festa_2026 caminho/arte.png --pt "Festa de fim de ano" --en "Year-end party" --acquire free [--until 2027-01-31] [--min-version-code 32]`. O script falha se: dimensão errada, abertura opaca, peso > 256 KB, id fora do formato ou repetido. Grava `public/widget-frames/festa_2026.<sha8>.png`, acrescenta a linha ao manifesto e incrementa `version`.
3. **Teste e build:** `npx vitest run src/utils/widgetFrames.test.ts src/widgetFramesManifest.contract.test.ts` e `npm run build` (atualiza `dist/`, que é commitado).
4. **PR → 10 checks verdes → merge → deploy normal do Worker.** Nenhum APK, nenhuma Play Console (para `free`).
5. **Propagação:** o seletor do app já mostra a moldura na próxima abertura; o widget a baixa ao escolher ou em até 24 h (ou quando o app abre). Para **retirar**: `... remove festa_2026` (o widget volta ao padrão/embutida no próximo sync).
6. **Moldura PAGA** com SKU novo (fora da fase 1): além dos passos acima, criar o produto permanente na Play Console e a linha em `PRODUCTS` (`_billing.js`) + paridade em `widgetFrames.ts`; isso é deploy do Worker e Play Console, **não APK**. Entra como PR opcional (§9).

## 6. Testes

**JUnit (parte pura Kotlin):** regex de id (rejeita `../x`, `a/b`, vazio, maiúscula, 33+ chars); `isAllowedUrl` (host exato, `https`, rejeita `http`, `evil.soulmon...`, userinfo `@`); `parseManifest` (JSON ruim, `schema` desconhecido, campo faltando, `bytes` > teto); `pickPlan` (`version` menor ignorado, `enabled:false`, geometria divergente ignora frames, `minVersionCode`, `until` vencido); ordem de resolução (cache > embutida > padrão).
**Vitest:**
- contrato do manifesto (`src/widgetFramesManifest.contract.test.ts`): todo arquivo citado existe, `sha256` e `bytes` batem, PNG 576x384, abertura transparente, ids únicos e com a forma certa, `version` maior que a do `origin/main`, as 20 embutidas todas presentes, `public/_headers` com as regras, `run_worker_first` ausente (reaproveita o espírito de `gmPaginasEstaticas`);
- `widgetFrames.test.ts`: hydrate aceita forma, `resolveWidgetFrame` confere catálogo, posse por elemento inalterada, catálogo offline = só as 20;
- render do `WidgetFramePicker` com catálogo remoto, com catálogo falho e com moldura `free`.
**Aparelho real (checklist da beta12, obrigatório, não substitui nada acima):** (a) avião: widget idêntico ao de hoje; (b) instalação limpa sem cache; (c) moldura remota escolhida aparece em ≤ 1 min com rede; (d) truncar o PNG no disco (adb) → widget cai na embutida sem piscar vazio; (e) manifesto com sha errado → arquivo descartado, log, widget intacto; (f) `enabled:false` → apaga cache e volta às embutidas; (g) 404 do manifesto; (h) PNG 1024x1024 e abertura opaca; (i) widget em 3 tamanhos/launchers e em aparelho de pouca RAM (OOM cai no casco padrão); (j) troca de moldura com widget na tela e com app fechado.

## 7. Riscos e mitigação

| Risco | Efeito | Mitigação |
|---|---|---|
| Widget sem rede / manifesto 404 | nenhum | cache + embutidas; o renderer nunca faz rede |
| Imagem corrompida / truncada | casco quebrado | `sha256` + tamanho + `inJustDecodeBounds` antes de promover; falha no decode desce à embutida |
| Arte maior que o esperado | OOM / limite de bitmap dos `RemoteViews` | 576x384 exato, teto de bytes, decode ARGB_8888 uma vez, `OutOfMemoryError` já tratado; arte remota não excede a embutida |
| Abertura do LCD opaca | widget "cego" | validação no script e no contrato (alfa zero na abertura) |
| Arte com abertura diferente | sprite/texto/ícones fora do vidro | `geometry` no manifesto; divergiu = remotas ignoradas. Abertura nova por moldura é APK (ou, no futuro, `screen` por moldura derivando `WidgetVpet.sprite/iconRow/text`) |
| Manifesto errado publicado | todos os widgets com arte ruim | `enabled:false` e revert do PR; `version` monotônica; o contrato barra o pior no CI |
| Cache velho de CDN / downgrade | arte antiga volta | `no-cache` no manifesto, hash no nome das imagens, `version` nunca recua |
| Hospedagem fora do ar | sem moldura nova | cai nas embutidas; sem dependência crítica |
| **Política da Play sobre conteúdo dinâmico** | rejeição | a política veda baixar **código executável** (dex, nativo, interpretado) de fora da Play; aqui só **imagens e JSON de dados**, sem lógica, sem `DexClassLoader`, sem WebView nova. O app já carrega a web inteira do Worker, então o padrão "conteúdo remoto" já é aceito. Declarar na ficha/Data Safety: nenhum dado novo coletado |
| Moldura vendida e depois removida | jogador reclama | `acquire` pago só na fase opcional, e remover um id pago exige decisão do dono (a posse continua no servidor; o widget cai no padrão) |
| `allowBackup="true"` | cache restaurado em outro aparelho | cache em `noBackupFilesDir` |
| Consumo de bateria/dados | pouco | 1 GET de manifesto por dia (304 na maioria), imagens só quando mudam, só com rede |
| Contrato `elementoLeitores`/`widgetFrames` quebrar por relaxar `isWidgetFrameId` | CI vermelho | separar forma × catálogo (§4) e rodar `src/utils/elementoLeitores.contract.test.ts` |

## 8. Decisões do dono (precisam de modal antes de executar)

1. **Hospedagem:** arquivo estático no Worker com PR (recomendado, fase 1) ou rota KV + página GM (fase 2) desde já?
2. **Remoto sobrepõe embutido do mesmo id?** Recomendado SIM (permite corrigir arte sem APK).
3. **Frequência de sync:** 24 h + ao abrir o app (recomendado) ou mais curto?
4. **Escopo:** incluir os 57 cenários do V-Pet na mesma beta12 (recomendado, o custo marginal é baixo e resolve "cenário novo sem miniatura") ou só molduras?
5. **Tipos de aquisição de moldura nova:** `free` basta na fase 1? Moldura paga nova (SKU na Play) e de evento/sazonal entram na PR opcional?
6. **Assinatura do manifesto:** dispensar (recomendado) ou embutir chave pública na beta12?
7. **Abertura de LCD por moldura:** manter fixa (recomendado) ou já parametrizar `screen` por moldura na beta12 (custo: refatorar as caixas de `WidgetVpet`)? Se ficar fixa, arte com recorte diferente continua exigindo APK.

## 9. Esforço, PRs e ordem

| # | PR | Conteúdo | Esforço | Depende de |
|---|---|---|---|---|
| 1 | **web: manifesto + arte + script** | `public/widget-frames/*` (20 + 57, v1 = embutidas), `public/_headers`, `scripts/widget-frames-publish.mjs`, contrato do manifesto | 0,5 a 1 dia | nada; pode ir antes da beta12 e já fica no ar |
| 2 | **android: cache + sync + renderer** (vira a beta12) | `WidgetFrameStore/Sync/SyncWorker`, `WidgetRenderer`, `WidgetVpet`, `SoulmonWidgetPlugin`, `versionCode` 32, JUnit | 2 dias + teste em aparelho | PR 1 no ar (o worker precisa de algo para baixar em teste) |
| 3 | **web: catálogo remoto no app** | `useRemoteFrameCatalog`, picker, hydrate por forma, `syncWidgetFrames()` no `App.tsx`, testes | 1 dia | PR 2 (o método nativo) ou chamada guardada por `Capacitor.isPluginAvailable` para poder entrar antes |
| 4 | **docs: sincronizar manual** | `manter-docs`: 08 §2.8, `plugins-constants.md`, MAPA | 0,25 dia | 1 a 3 |
| 5 (opcional) | **cenários remotos no picker/loja** | só se a decisão 4 ficar para depois | 0,5 dia | 2, 3 |
| 6 (opcional) | **moldura paga/evento nova** | `PRODUCTS` data-driven, Play Console, paridade server/TS, hint de aquisição | 1 a 1,5 dia + Play Console do dono | 1 a 3 |

Total obrigatório: **~4 PRs, ~4 a 5 dias de agente** + um ciclo de AAB/Play (versionCode 32) e o checklist de aparelho real. Merge sequencial PR 1 → 2 → 3, sem force-push, cada um com 10 checks verdes.

## 10. O que CONTINUA exigindo APK novo

- Qualquer mudança de **código nativo** (Kotlin/Java), novos layouts de widget, novos tipos de widget, nova lógica de desenho (animação, camadas extras, outro tamanho de bitmap).
- **Geometria** do LCD, posição do sprite/texto/ícones (constantes de `WidgetVpet`), a menos que a decisão 7 pare parametrizada.
- Novas **permissões**, dependências nativas, mudança de host permitido (`APP_HOST`) ou da política de segurança de download.
- Novos **sprites embutidos** (`sprite_starter_*`), ícones do V-Pet (`vpet_fome_*`, energia), a moldura padrão `vpet_moldura`, e qualquer arte que o widget precise **antes** do primeiro sync.
- Trocar o conjunto de embutidas de fallback (por exemplo, enxugar o APK: não recomendado; as 20 são a rede de segurança).
- Mudança no formato do manifesto que o cliente nativo não entende (`schema` novo): o Android antigo ignora o manifesto de `schema` desconhecido e fica nas embutidas/cache, sem quebrar.

Não exigem APK: nova moldura/cenário `free` (ou de elemento já existente), correção de arte, janela sazonal (`until`), retirada de moldura, kill-switch, e (via Worker + Play Console) produto pago novo.
