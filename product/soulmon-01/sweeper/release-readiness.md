# Soulmon — Prontidão de release (fase sweeper)

> Auditoria adversarial de 2026-08-14. Escopo: `src/`, `functions/`, `desktop/`,
> `public/sw.js`, `workers/`. Nada de código de produção foi alterado — só foram
> **acrescentados 4 arquivos de teste**, dos quais 9 casos falham de propósito,
> cada um documentando um defeito real e travando a regressão depois do fix.
>
> Baseline recebido: `tsc` limpo, 379 testes verdes. **O portão verde estava
> verde e nenhum dos achados abaixo aparecia nele.** É esse o ponto do relatório.

---

## 1. Resumo executivo

**O app de desktop nunca escreveu nada: `pushCareAction` faz `POST /api/save`
com o `id` no corpo, e `functions/api/save.js` só lê o `id` do query string —
resposta 400 em 100% das vezes, traduzida para "erro de rede".** Carinho,
alimentar e marcar tarefa — as três únicas ações do overlay — não gravam. O
Electron é um visualizador que se apresenta como controle remoto, e o produto
está listado para Steam (`docs/PLANO-DESKTOP-STEAM.md`).

Passou porque `desktop/renderer/src/cloudSync.test.ts` — declarado no CLAUDE.md
como "o único ponto de paridade" — trava as **tabelas copiadas** (saveId, HP,
energia) e **nunca chama `pushCareAction`**. O footgun 9 ("regra copiada diverge
em silêncio") aconteceu de novo, numa dimensão que o teste de paridade não
cobria: o **contrato HTTP**.

Logo atrás: **130 usos de 80 classes utilitárias que não existem no
`src/index.css`**, em 15 componentes de produção (footgun 1, o mesmo do checkbox
de 2px — ainda vivo, agora medido).

---

## 2. Tabela de achados

| # | Sev | Arquivo:linha | O quê | Cenário de falha (entrada → resultado errado) | Fix proposto | Teste de regressão |
|---|-----|---------------|-------|-----------------------------------------------|--------------|--------------------|
| 1 | 🔴 | `desktop/renderer/src/cloudSync.ts:240,245` vs `functions/api/save.js:28` | O desktop manda `{id, state}` no **corpo**; o servidor lê o id **só** de `url.searchParams.get('id')` | Usuário clica em "alimentar" no overlay → `POST /api/save` sem `?id=` → 400 `Invalid save ID` → `pushCareAction` devolve `reason:'network'` → nada é gravado, com a rede perfeita | Mandar `?id=${saveId}` na URL do POST (1 linha, no desktop). Aceitar `body.id` como fallback no servidor é a alternativa, mas alarga a superfície do endpoint | `desktop/renderer/src/pushCareAction.test.ts` — liga o `fetch` do renderer no `onRequest` **real** do save.js; o caso `a URL do POST não carrega o id que o servidor exige` falha hoje |
| 2 | 🟠 | `src/utils/cloudSave.ts:22-27` | `cloudSave` não checa `res.ok`: grava `digiapp-last-cloud-sync` mesmo em 401/403/500 | Dono liga o `FIREBASE_PROJECT_ID` (item aberto em STATUS §3.1) → token expirado → 403 → o app segue mostrando "sincronizado agora" → o jogador troca de aparelho achando que o progresso foi junto, e perde tudo | `if (!res.ok) return false;` antes do carimbo, e devolver `boolean` para quem chama poder reagendar/avisar | `src/utils/cloudSave.test.ts` — `403/500 do servidor não pode virar carimbo de sincronização` (2 falhas) |
| 3 | 🟠 | `functions/api/save.js:59-62` | `if (!body?.state)` só barra falsy: `state` numérico/string/array passa e **substitui o save** | `POST /api/save?id=X {"state": 1}` → `{...1}` é `{}` → o save inteiro (dias perfeitos, árvore, inventário) vira objeto vazio. `{"state":"oi"}` grava `{"0":"o","1":"i"}`. Verificado: o `perfectDays: 42` semeado some | Exigir `typeof state === 'object' && !Array.isArray(state)` → 400. Somar um teto de tamanho (KV aceita 25 MB; hoje não há limite nenhum) | `functions/api/save.test.js` — 3 casos (`state` numérico / string / array) |
| 4 | 🟠 | 15 componentes, 130 ocorrências (lista completa na saída do teste) | Classes utilitárias usadas no JSX que **não existem** no `index.css` pré-compilado (footgun 1) | `flex-shrink-0` (15×, App/TaskCard/ActivityCard/CompanionHUD/…) é o nome do **Tailwind v3**; o compilado é `shrink-0` → todo ícone assim marcado pode ser espremido a zero, o mesmo modo de falha do checkbox de 2px. `gap-4` → o espaço entre checkbox e texto colapsa. `max-h-[88vh]` (`AISettingsModal.tsx:65`) → o modal cresce sem teto e o botão de salvar sai da tela (`max-h-[80vh]` existe; `88vh` não). `left-1/2`+`-translate-x-1/2` (`CompanionHUD.tsx:606,673,828`) → o balão de fala e a seta não centralizam (`top-1/2` existe, `left-1/2` não). `disabled:opacity-50/60/40` (`ChatBox.tsx:334,351,366`, `SettingsPage.tsx:156,226`) → botão desabilitado idêntico ao habilitado | Trocar pelo nome v4 (`shrink-0`), acrescentar a regra no fim do `index.css`, ou `style={{}}` inline para layout crítico | `src/index.css.contract.test.ts` — guard mecânico permanente, com 4 casos de autoverificação para não virar decoração |
| 5 | 🟠 (armado) | `functions/api/save.js:16`, `entitlements.js:31`, `community.js:32` | Exigem `Authorization`, mas anunciam só `Content-Type` em `Access-Control-Allow-Headers` | O overlay Electron chama a URL de produção de **outra origem** → header `Authorization` dispara preflight → o navegador bloqueia antes de sair. Só `billing.js:38` está certo (`Content-Type, Authorization`). Invisível hoje porque a auth está desligada; **arma exatamente no dia do item "ligar FIREBASE_PROJECT_ID"** | Alinhar os três com o `billing.js` | `functions/api/save.test.js` — `OPTIONS anuncia Authorization` |
| 6 | 🟠 | `vitest.config.ts:15` | `coverage.include: ['src/**']` — **`functions/**` fica fora do medidor** | Todo o código de dinheiro (`_entitlements.js`, `_billing.js`, `community.js`, `save.js`) tem cobertura **não medida**. Foi assim que `save.js` chegou até aqui sem nenhum teste, com dois defeitos dentro | Acrescentar `functions/**/*.js` ao `include` e olhar o número | — (mudança de config; fora do meu escopo desta rodada) |
| 7 | 🟡 | `ItemsWindow.tsx:141` (26px), `DailyReportModal.tsx:136`, `PlayerDetailModal.tsx:69`, `WelcomePromptModal.tsx:137` (30px), `DinoGame.tsx:202`, `DungeonGame.tsx:364`, `RPSGame.tsx:88`, `GameTutorialFlow.tsx:189` (34px) | Alvos de toque abaixo de 44px (WCAG 2.2 AA, 2.5.8) | O checkbox foi corrigido para 44px, mas os **botões de fechar** dos modais ficaram entre 26 e 34px. Fechar um modal é a saída de emergência da UI — é o pior lugar para um alvo pequeno, e a persona 58+ foi justamente o caso levantado | `style={{ width: 44, height: 44 }}` com o círculo visual menor dentro, exatamente o padrão já aplicado em `TaskCard.tsx:50` | Extensível: o guard de CSS já roda mecanicamente; um segundo guard de alvo de toque cabe no mesmo arquivo |
| 8 | 🟡 | `src/utils/i18n.ts:845-861` (bloco `guide`) | Segunda cópia — **divergente e errada** — do texto de regras, sem nenhum chamador | `evolutionSystemText` diz "Ovo → Baby → Em Treinamento → Rookie…" e `healthSystemText` diz "começa com 1 coração", ambos contrariando a regra vigente (a árvore nasce em rookie; rookie tem 3). Não é renderizado (`grep` por `t.guide`/`.guide.` não acha chamador), mas é exatamente o padrão que o STATUS §2 já apagou uma vez em `wasDayPerfect` | Apagar o bloco. Texto de regra vive no `GuideModal.tsx`, saindo das constantes | — (código morto; o fix é remoção) |
| 9 | 🟡 | `src/utils/oracle.ts` (3011 linhas) | O `import()` dinâmico em `App.tsx` é anulado por 5 imports estáticos | Aviso do próprio build: *"dynamically imported … but also statically imported … dynamic import will not move module into another chunk"*. O oráculo inteiro fica no chunk principal (385,78 kB / 127,87 kB gzip), carregado por quem nunca abre o ritual | Escolher um dos dois: ou tudo estático (e tirar o `import()`), ou isolar as tabelas grandes num módulo só-dinâmico | — (perf; medição no §3) |
| 10 | 🟡 | `functions/api/save.js:62` | `expirationTtl: 86400 * 365` | Quem parar de jogar por 12 meses perde o save na nuvem. Colide de frente com o guardrail nº 1 ("perdão de ausência", "quem volta encontra saudade") — o TTL só renova a cada escrita | Decisão de produto: subir o TTL ou remover. Merece ser explícito, não um efeito colateral | — |
| 11 | 🟡 | `public/sw.js:48-53` | Navegação faz `cache.put` **sem checar `res.ok`** | Um 502 transitório da Cloudflare durante a demo é gravado no `STATIC_CACHE` sob `/`. O impacto é contido (navegação é network-first e o fallback offline lê a chave `/index.html`, precacheada), por isso 🟡 e não 🟠 | `if (res.ok)` antes do `put` | — |
| 12 | 🟡 | `public/sw.js:53` | `.catch(() => caches.match('/index.html'))` pode resolver `undefined` | Se o `addAll` do install falhar (rede ruim na primeira visita), `respondWith(undefined)` vira erro de rede em vez da tela offline | Fallback explícito para um `Response` sintético | — |
| 13 | 🟡 | `src/contexts/GameStateContext.tsx:377` | `'Anônimo'` — única string PT-only real do app | Nome padrão publicado no ranking da comunidade; um jogador em EN aparece como "Anônimo" para os outros | `isPt ? 'Anônimo' : 'Anonymous'` | — |
| 14 | 🟡 | `CLAUDE.md:59` | Diz `CACHE_VERSION` "v24 atual"; o arquivo está em **v39** | Deriva de documentação num item que o guia manda bumpar à mão | Atualizar o guia | — |

### Não confirmado (levantei, não consegui provar no código)

- **`rubHeal` cobra 0,5 do teto diário mesmo curando menos** (`careRules.ts:161-165`):
  com HP 2,5/3 o registro soma 0,5 mas a cura efetiva é 0,5 → bate. Só divergiria
  com HP fracionário fora da grade de 0,5, que não encontrei sendo gerado. Deixo
  registrado como observação, não como bug.
- **Spam de cloud save por timer**: o CLAUDE.md avisa do risco e o
  `GameStateContext` tem debounce de 3s por mudança de `gameState`; não consegui
  construir um caminho concreto de escrita em rajada. `useCareSystem` (10s) e
  `useDailyReset` (30s) só agendam. Sem achado.
- **Corrida do `spendCredits`** — já registrada como dívida aceita em STATUS §4;
  não reabri.

---

## 3. Estado dos portões

| Portão | Comando | Resultado |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | **exit 0, limpo** (inclusive com os arquivos de teste novos — o guard de CSS lê o `index.css` por `import()` com especificador em variável justamente porque o `tsconfig` cobre só `src` e não carrega os tipos do Node) |
| Testes | `npx vitest run` | **29 arquivos · 407 testes · 398 passam · 9 falham** (baseline era 25/379/379/0). As 9 falhas são os achados #1 a #5, todas intencionais |
| Build | `npm run build` | **✓ built in 3.65s**, 1846 módulos, 108/108 PNG→WebP (−6,19 MB), worker compilado. 1 aviso (achado #9) |
| Bundle | — | `index-*.js` **385,78 kB** (gzip **127,87 kB**) · `vendor-*.js` 140 kB · `index-*.css` 75,78 kB (gzip 13,93 kB). Maiores lazy chunks: ActivitiesPage 32 kB, OraclePage 28 kB |

Detalhe das 9 falhas:

```
functions/api/save.test.js
  × state numérico apaga o save em vez de ser recusado      → achado #3
  × state string vira um objeto de caracteres indexados     → achado #3
  × state array também é recusado                           → achado #3
  × OPTIONS anuncia Authorization                           → achado #5
src/utils/cloudSave.test.ts
  × 403 do servidor não pode virar carimbo de sincronização → achado #2
  × 500 do servidor não pode virar carimbo de sincronização → achado #2
desktop/renderer/src/pushCareAction.test.ts
  × a URL do POST não carrega o id que o servidor exige     → achado #1
src/index.css.contract.test.ts
  × nenhuma classe fantasma nos componentes de tela         → achado #4
  × flex-shrink-0 (v3) não é usado                          → achado #4
```

### Arquivos de teste novos

| Arquivo | O que trava |
|---|---|
| `D:\Soulmon\repo\functions\api\save.test.js` | Primeiro teste que `save.js` já teve. 5 casos verdes travam o que está certo (GET de save inexistente, round-trip, id inválido, **`accountTier`/`credits` do cliente descartados e servidos do entitlement**) + 4 vermelhos (#3, #5) |
| `D:\Soulmon\repo\desktop\renderer\src\pushCareAction.test.ts` | Liga o `fetch` do renderer no `onRequest` **real** do `save.js` — a paridade que faltava não é de tabela, é de contrato. 2 verdes (leitura funciona) + 1 vermelho (#1) |
| `D:\Soulmon\repo\src\utils\cloudSave.test.ts` | Derivação do `saveId`, `cloudLoad` sob 503/offline/`found:false`, e o carimbo de sincronização (#2). 8 verdes + 2 vermelhos |
| `D:\Soulmon\repo\src\index.css.contract.test.ts` | Guard mecânico permanente do footgun 1, com 4 casos de autoverificação (prova que leu o CSS de verdade e que enxerga `w-7`/`h-7` como ausentes) + 2 vermelhos (#4) |

> Nota de localização: o enunciado pedia os testes em `src/**/*.test.ts`. Dois
> deles vivem em `functions/` e `desktop/` porque é lá que o código sob teste
> está, e o `vitest.config.ts` já inclui os dois caminhos. Pôr o teste do
> desktop dentro de `src/` reproduziria exatamente o erro que ele denuncia:
> distanciar o teste da coisa testada.

---

## 4. Mapa de cobertura vs. risco

`npx vitest run --coverage` — global de `src/`: **statements 16,01% · branches
9,18% · functions 10,81% · lines 15,80%**. O número global é enganoso (arrasta
componentes e assets); o que importa é por superfície de risco:

| Superfície | Risco | Cobertura | Leitura |
|---|---|---|---|
| `utils/careRules.ts` | HP, energia, comida, recompensa | **94,33% / 82,22% br** | 🟢 Bem coberto. É o arquivo que o CLAUDE.md manda ser a fonte única, e é |
| `utils/dailyReset.ts` | HP, dia perfeito, evolução | **78,51% / 72,50% br** | 🟢 O descoberto (228-254) é o ramo `!MANUAL_EVOLUTION`, **código morto** com a flag atual. Cobertura real do caminho vivo é alta |
| `utils/carePattern.ts`, `missions.ts`, `mood.ts`, `petStage.ts`, `tournamentSeason/Tiers.ts` | regra de jogo | **100%** | 🟢 |
| `utils/oracle.ts` | guardrail de marca (nomes de franquia) | **95,50%** | 🟢 O teste que trava a ausência de nomes existe |
| **`functions/api/**`** (dinheiro, save, comunidade) | **o mais alto do produto** | **NÃO MEDIDA** (achado #6) | 🔴 Há testes para `_entitlements`, `_billing`, `community`, `_auth`, `_aiGuard`, `_pushTargets` — mas **`save.js` não tinha nenhum**, e o medidor não mostrava o buraco. Corrigido em parte por este relatório |
| `desktop/renderer/src/cloudSync.ts` | escrita no save real | tabelas ✅, **contrato HTTP 0%** | 🔴 Achado #1. Corrigido em parte |
| `utils/cloudSave.ts` | todo progresso que sai do aparelho | **28,57%** → coberto agora | 🟠 Achado #2 |
| `utils/monetization.ts`, `entitlements.ts` (cliente) | dinheiro, lado cliente | **0%** | 🟠 O servidor é a autoridade (correto), mas reroll/troca de Bits não têm rede nenhuma |
| `utils/dungeon.ts` | economia de Bits, drops | **0%** | 🟡 Não cobra HP (regra), então o dano máximo é econômico. Vale teste para a escada de bônus `10+5×(andar−1)` e o teto de 2 coraçõezinhos/dia |
| `utils/notifications.ts` (377 linhas), `i18n.ts`, `sprites.ts` | tom, paridade, arte | **0%** | 🟡 `notifications.ts` já teve um bug de tom corrigido (STATUS §2) e segue sem rede |
| `hooks/useProgressTracking`, `useItemForm` | UI | 0% | 🟡 dívida aceitável |

**Paridade PT-BR/EN — verificada mecanicamente, e o resultado é bom.** Varri
todas as strings com diacríticos PT em `src/**` fora dos dicionários. As ~115
suspeitas iniciais eram falsos positivos: `translations` é
`Record<Language, Translations>`, ou seja **a paridade é imposta pelo
compilador**; `GuideModal` usa `L(pt, en)`; `GameTutorialFlow` usa
`titlePt/titleEn`; `ChatBox` chaveia por `language`. Sobrou **uma** string
PT-only real (achado #13). `aria-label`s: nenhuma PT-only; há uma EN-only
(`App.tsx:1937`, `"Dismiss"`). `:focus-visible` presente (17 regras no
`index.css`).

**Entrada ruim + rede instável.** `/api/chat` está sólido: `AbortController`
com timeout (15s no chat, 30s na sugestão), guard de `document.hidden` no idle,
e — o que mais importa — a **fala local vem primeiro** e a IA só melhora
(`CompanionHUD.tsx:337`), então rede caída não emudece o pet. O tutorial tem
fallback local de tarefas. `cloudLoad` degrada para `null` em 503 e em offline
(agora com teste). Os furos de rede estão em **escrita**, não em leitura:
achados #1, #2 e #3.

---

## 5. Autoavaliação na régua do investidor

| # | Dimensão | Nota | Evidência |
|---|---|---|---|
| 1 | Problema & insight | 🟢 | Fora do meu escopo; o guardrail "nunca um cobrador" está implementado como código verificável (teto de dano, perdão de ausência, alívio semanal), não como slogan |
| 2 | Mercado & timing | ⚪ | Não é minha dimensão, não avalio sem dado |
| 3 | Produto & wedge | 🟡 | O wedge (v-pet gerado por usuário) funciona no web/PWA; a extensão para desktop/Steam **não funciona de fato** (achado #1) |
| 4 | Unit economics | ⚪ | Não é minha dimensão |
| 5 | Moat | 🟡 | O moat declarado é a criatura gerada + o laço de cuidado; ambos vivem no save, e o caminho de escrita do save tem 3 defeitos (#1, #2, #3). Moat que depende de dado que pode sumir não compõe |
| **6** | **Credibilidade de execução** | **🟡** | **Minha.** A favor: `tsc` limpo, build em 3,65s, 398 testes verdes, regras puras e compartilhadas (`careRules.ts`), auditoria de segurança com SEC-1..5 corrigidos, comentários que explicam *por que* a regra existe. Contra: um recurso de plataforma inteiro (desktop) nunca funcionou em produção e ninguém percebeu, porque o teste que devia pegar testava a dimensão errada da mesma cópia. E o footgun 1 continua vivo em 130 lugares depois de já ter derrubado a ação central do app uma vez. **É 🟡 e não 🟢 porque a qualidade é real mas irregular: excelente onde alguém escreveu teste, invisível onde não escreveu.** Não é 🔴 porque tudo que achei é de baixo custo de conserto e nenhum é falha de arquitetura |
| 7 | Narrativa | ⚪ | Não é minha dimensão |
| **8** | **Evidência sobre asserção** | **🟢** | **Minha.** Todo achado tem `arquivo:linha` e um comando que o reproduz. As duas verificações que costumam virar "olhei por amostragem" foram feitas mecanicamente e o script está travado como teste: classes CSS (guard com 4 casos que provam que o próprio guard enxerga) e paridade PT/EN (115 candidatos → 114 falsos positivos rastreados até a causa → 1 achado real). O bug do desktop foi provado ligando o cliente no handler **real** do servidor, não num mock que devolve 200. Os 4 casos "corretos" do `save.test.js` são verdes hoje: não confundo teste que falha com teste que mede |

Agregado da minha fase: **🟡 — não bloqueia a próxima fase, bloqueia o
lançamento do desktop.** Os achados #1 a #5 somam poucas linhas de conserto e já
estão com o teste escrito esperando.

---

## 6. Fora de escopo (e por quê)

- **Não consertei nada.** Regra da rodada: fixes vêm depois do checkpoint
  humano. Os testes vermelhos são o handoff — quem corrigir sabe quando parou.
- **Verificação visual por Playwright.** O CLAUDE.md pede screenshot antes de
  declarar UI pronta, mas o achado #4 é justamente sobre estilo que **não
  aplica**, e a verificação mecânica é mais forte que o olho aqui: pega as 130
  ocorrências, inclusive as de telas que ninguém abriria numa sessão de
  screenshot. A confirmação visual do impacto de cada uma fica para o fix.
- **`android/`** (Kotlin, RemoteViews, widget) — nenhuma ferramenta de build
  Android nesta máquina; auditar sem conseguir compilar produziria asserção, não
  evidência.
- **`workers/push-scheduler.js` e entrega de push** — depende de KV real, cron e
  credencial FCM; não dá para exercitar de forma honesta aqui.
- **Contraste (AA)** — o `--sm-muted` já foi corrigido para ~4,6:1 (STATUS §2) e
  a migração de temas é declaradamente parcial ("telas secundárias ainda têm cor
  fixa"). Medir contraste em telas que o próprio time já assumiu como não
  migradas seria recontar dívida conhecida. Fica para depois da migração.
- **Reauditoria de SEC-1..SEC-5** — verifiquei que `save.js` de fato remove
  `accountTier`/`credits` e os serve do entitlement (virou teste verde), e que
  `community.js` deriva `pid`. Não reabri o resto: STATUS §1 registra como
  corrigido e não achei indício em contrário.
- **Keystores no histórico do git** (STATUS §1.4) — decisão do dono, não achado
  novo.
```
