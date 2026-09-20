# Mapa do manual do Soulmon — comece por aqui

> **Dono:** doc-bibliotecario · **Data:** 15/09/2026 · **Estado:** verificado em 15/09/2026 por doc-verificador (guard verde: todo doc citado, todo link resolve)
> **Verificação:** `npx vitest run src/docsManual.contract.test.ts` — o item (a) exige que TODO `.md` de `docs/` (exceto `historico-digiapp/`) esteja citado neste arquivo, e o item (b) exige que todo link relativo do manual resolva. O item (d) proíbe referência `arquivo` + número de linha em qualquer doc do manual.
> **Não cobre:** o conteúdo de nada. Este documento **aponta**; quem responde é o doc dono de cada assunto. Se você está lendo uma regra AQUI, o índice tem defeito.
> **Precedência:** código > teste > `CLAUDE.md` > este documento. Onde discordarem, o código está certo e este doc tem defeito.

---

<a id="como-ler"></a>
## 1. Como ler este manual (para IA)

Você abriu o arquivo certo. Siga na ordem, sem pular:

1. **Leia este arquivo inteiro** — ele é o único índice do repositório. Ninguém mantém índice paralelo.
2. **Ache o seu assunto** no [índice por pergunta](#indice-por-pergunta) (§4) ou no [índice por assunto](#indice-por-assunto) (§3). Se você só tem o caminho de um arquivo de código, use o [índice por arquivo](#indice-por-arquivo) (§5).
3. **Leia o doc dono do assunto, e só ele.** Cada doc declara no cabeçalho o que NÃO cobre; o que não é dele está apontado com o nome do doc que é.
4. **Antes de mudar qualquer coisa, abra as duas âncoras da linha**: o **SÍMBOLO dono** (a função que decide a regra) e a **RÉGUA** (o teste que a trava). Regra sem esses dois lidos vira regra copiada, que é o footgun 9 do `CLAUDE.md`.
5. **Precedência, sempre:** código > teste > [`CLAUDE.md`](../../CLAUDE.md) > manual. Achou divergência? O código está certo, o doc tem defeito, e o achado vai para [`docs/STATUS.md`](../STATUS.md).
6. **Ao terminar**, atualize o doc dono do assunto **e** o `STATUS.md`, e rode o guard: `npx vitest run src/docsManual.contract.test.ts src/docsSemMentira.contract.test.ts`.

**O que NÃO fazer, e por quê:**

- **Não leia `src/App.tsx` inteiro.** Meça antes (`wc -l src/App.tsx`); o número já foi documentado errado cinco vezes. Chegue nele pelo símbolo, por `grep`.
- **Não confie em número sem comando ao lado.** Contagem sem `wc -l`/`grep -c` e data é opinião; valor sem o nome da CONSTANTE é número que já mudou.
- **Não trate plano como estado.** `docs/PLANO-*.md` descreve o que se pretendia; o estado é o código, os testes e o [`STATUS.md`](../STATUS.md). A tabela da §6 diz, doc por doc, qual é qual.
- **Não escreva referência de código com número de linha.** É `caminho` + `SÍMBOLO`, sempre — há guard que reprova.
- **Não crie doc novo em `docs/` sem indexá-lo aqui.** O guard fica vermelho na hora, e é de propósito: doc que o índice não alcança é doc que nenhuma sessão lê.

---

<a id="uma-pagina"></a>
## 2. O Soulmon em uma página

**O que é.** Um app de produtividade gamificado do gênero **v-pet**: a pessoa cadastra hábitos e tarefas da vida real, e a criatura dela cresce, evolui e ramifica em função do que foi feito. Detalhe em [`01-VISAO.md` §1](01-VISAO.md#o-que-o-soulmon-e).

**Para quem.** ICP e personas em [`01-VISAO.md` §3](01-VISAO.md#para-quem-e).

**A essência declarada** (rege toda decisão de regra; fonte: [`PLANO-EVOLUCAO.md`](../PLANO-EVOLUCAO.md), reproduzida em [`01-VISAO.md` §2](01-VISAO.md#a-essencia-declarada)):

> O Soulmon é um avatar do usuário que evolui junto com ele e o encoraja — **nunca um cobrador**.

**As linhas vermelhas.** 21 proibições, separadas entre as travadas por TESTE e as travadas só por TESE — a lista canônica é [`01-VISAO.md` §7](01-VISAO.md#as-linhas-vermelhas), e nenhuma delas se rediscute aqui. As mais citadas: sem streak que zera, sem punição por sono ruim, sem recompensa por contagem de tarefas, sem score de sono na home, sem Google Fit, e **o widget não cobra**.

**As quatro superfícies** ([`01-VISAO.md` §9](01-VISAO.md#as-quatro-superficies), técnica em [`05-ARQUITETURA.md`](05-ARQUITETURA.md)):

| Superfície | O que é |
|---|---|
| **Web / PWA** | o app inteiro; a fonte de todas as regras (`src/`) |
| **APK Android** | o mesmo app num WebView do Capacitor, carregando a URL de produção (`android/`) |
| **Overlay de desktop** | app Electron que é **controle remoto** do save, não uma segunda implementação (`desktop/`) |
| **Widgets Android** | a superfície mais exposta do telefone — e a que **não cobra** |

**Estado do projeto em 09/09/2026** ([`01-VISAO.md` §10](01-VISAO.md#o-estado-do-projeto)): **ninguém nunca usou o app em produção** (informado pelo dono em 07/09/2026). Consequências: toda justificativa que começa com "quebraria o save de quem já joga" decide sobre premissa falsa — o que **não** autoriza apagar nada por conta própria —, e sem usuários não há telemetria, então retenção D1/D7/D30 é hipótese não confrontada. **O gargalo é distribuição, não produto.** O que está em aberto e depende do dono vive na seção 3 de [`docs/STATUS.md`](../STATUS.md).

---

<a id="indice-por-assunto"></a>
## 3. Índice por assunto

Uma linha por assunto: onde ele mora, quem decide no código, e o que trava.

| Assunto | Doc | Seção | Dono (símbolo) | Régua |
|---|---|---|---|---|
| O que o produto é, e o que ele nunca pode virar | [01-VISAO.md](01-VISAO.md) | [§1](01-VISAO.md#o-que-o-soulmon-e), [§7](01-VISAO.md#as-linhas-vermelhas) | — (tese) | `src/utils/monetization.fronteira.test.ts`, `src/plugins/widgetSemCobranca.contract.test.ts` |
| Monetização, moedas e o que dinheiro nunca compra | [01-VISAO.md](01-VISAO.md) | [§8](01-VISAO.md#o-modelo-de-monetizacao) | `src/utils/currencies.ts`, `functions/api/_entitlements.js` | `src/utils/currencies.test.ts`, `functions/api/entitlements.test.js` |
| Regras de cuidado (corações, carinho, comida, cocô) | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) | [§1–§10](02-REGRAS-DE-NEGOCIO.md#coracoes) | `src/utils/careRules.ts`, `src/utils/poopDrain.ts` | `src/utils/careRules.test.ts`, `src/utils/poopDrain.regression.test.ts` |
| Virada do dia e dia completo | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) | [§1](02-REGRAS-DE-NEGOCIO.md#coracoes), [§7](02-REGRAS-DE-NEGOCIO.md#dia-completo) | `src/utils/dailyReset.ts` → `computeDailyReset` | `src/hooks/useDailyReset.test.ts` |
| Progressão da criatura (estágios, atributos, evolução) | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) | [§14–§22](02-REGRAS-DE-NEGOCIO.md#escada) | `src/types/progression.ts`, `src/utils/evolutionTarget.ts` | `src/components/evolucaoManual.contract.test.ts` |
| Motor de tarefas (hábito × tarefa) | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) | [§23–§36](02-REGRAS-DE-NEGOCIO.md#meta-ponderada) | `src/types/taskModel.ts`, `src/utils/habitRhythm.ts`, `src/utils/taskTriage.ts` | `src/utils/habitRhythm.test.ts`, `src/utils/taskTriage.test.ts`, `src/utils/dailyGoal.contract.test.ts` |
| Rituais, descanso, sonhos e memória | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) | [§37–§45](02-REGRAS-DE-NEGOCIO.md#checkin) | `src/utils/rituals.ts`, `src/utils/restWindow.ts` | `src/utils/rituals.test.ts`, `src/utils/restWindow.test.ts` |
| Economia, loja, masmorra, torneio | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) | [§46–§57](02-REGRAS-DE-NEGOCIO.md#moedas) | `src/utils/shop.ts`, `src/utils/dungeon.ts`, `src/utils/tournamentSeason.ts` | `src/utils/shopBuy.test.ts`, `src/utils/dungeon.derrotaNaoCobra.test.ts` |
| Telas, navegação e as duas filas de avisos | [03-FLUXO-DE-TELAS.md](03-FLUXO-DE-TELAS.md) | §1, §3, §4 | `src/App.tsx` → `currentView`, `const interstitial` | `src/components/filaDeAvisos.contract.test.ts` |
| Onboarding e primeira abertura | [03-FLUXO-DE-TELAS.md](03-FLUXO-DE-TELAS.md) | §2 | `src/components/SoulmonOnboarding.tsx` | `src/components/upgradeReveal.contract.test.ts` |
| Tokens, tema, tipografia, ícones, movimento | [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) | §2–§6 | `src/index.css`, `src/styles/` | `src/index.css.contract.test.ts`, `src/components/ui/foundation.render.test.tsx` |
| Palco, cenários e decoração | [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) | §7 | `src/utils/petStage.ts` → `GROUND_Y` | `src/utils/petStage.test.ts` |
| Arte própria e o que nunca entra no bundle | [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) | §8 | `src/utils/sprites.ts` → `DUNGEON_LINE_NAMES` | `src/utils/sprites.dungeonRoster.test.ts` |
| Som (barramento, política de loudness, cortes) | [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) | §9 | `src/utils/audioBus.ts`, `src/utils/loudness.ts` | `src/utils/loudness.contract.test.ts`, `src/utils/cortes.contract.test.ts` |
| Stack, pastas, ciclo de vida, portões | [05-ARQUITETURA.md](05-ARQUITETURA.md) | §1–§4, §9 | `src/main.tsx`, `src/contexts/GameStateContext.tsx` | `npx tsc --noEmit`, `npx vitest run` |
| Onde vive cada regra (mapa regra → módulo) | [05-ARQUITETURA.md](05-ARQUITETURA.md) | §5 | — | `src/utils/x6Updaters.contract.test.ts` |
| Service worker, cache e CSP | [05-ARQUITETURA.md](05-ARQUITETURA.md) | §7 | `public/sw.js` → `CACHE_VERSION` | `src/deploy/swCache.contract.test.ts`, `src/security/csp.test.ts` |
| Função por função (`src/utils`) | [06-REFERENCIA/utils.md](06-REFERENCIA/utils.md) | índice por família | 120 módulos | `src/docsManual.contract.test.ts` item (c) |
| Componente por componente | [06-REFERENCIA/components.md](06-REFERENCIA/components.md) | índice por página/família | 91 módulos + `src/App.tsx` | idem |
| Hooks, contexts e types | [06-REFERENCIA/hooks-contexts-types.md](06-REFERENCIA/hooks-contexts-types.md) | índice | `src/hooks`, `src/contexts`, `src/types` | idem |
| Plugins, constantes, i18n e guards de repositório | [06-REFERENCIA/plugins-constants.md](06-REFERENCIA/plugins-constants.md) | índice | `src/plugins`, `src/constants`, `src/translations` | idem |
| Rotas `/api` e workers | [06-REFERENCIA/api-workers.md](06-REFERENCIA/api-workers.md) | índice | `functions/api`, `workers` | idem |
| Overlay Electron, módulo a módulo | [06-REFERENCIA/desktop.md](06-REFERENCIA/desktop.md) | índice | `desktop/electron`, `desktop/renderer/src` | `desktop/renderer/src/cloudSync.test.ts` |
| `GameState`, campo a campo | [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md) | §2 | `src/contexts/GameStateContext.tsx` → `hydrateSave` | `src/contexts/GameStateContext.hydrate.fuzz.test.tsx` |
| Cloud save, debounce e reconciliação | [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md) | §3 | `src/utils/cloudSave.ts` | `src/utils/cloudSave.reconcile.test.ts` |
| Chaves de `localStorage` e migrações | [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md) | §4, §5 | `src/utils/storageKeys.ts` → `STORAGE_KEYS` | `src/utils/storageKeys.migration.test.ts` |
| `saveId` e as três implementações | [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md) | §7 | `emailToSaveId` (app, overlay) + `functions/api/_auth.js` | `functions/api/saveId.parity.test.js` |
| Integrações externas (Firebase, Groq, Higgsfield, Supabase, FCM, Billing, Steam) | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) | §2 | `functions/api/*.js` | `src/security/supabase.contract.test.ts`, `src/deploy/firebaseNoBuild.contract.test.ts` |
| Deploy, URL de produção, CI e `CACHE_VERSION` | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) | §3 | `capacitor.config.json`, `desktop/renderer/src/config.ts` → `APP_URL` | `src/deploy/appUrl.contract.test.ts` |
| Como chegamos aqui (linha do tempo, tags, PRs) | [09-HISTORICO.md](09-HISTORICO.md) | §1–§5 | `git log` | os comandos colados no próprio doc |
| Onde está a discussão sobre X | [10-DISCUSSOES-E-DECISOES.md](10-DISCUSSOES-E-DECISOES.md) | §1–§18 | [`REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md) | `grep -n "^## "` nos caminhos citados |
| O que uma palavra quer dizer | [11-GLOSSARIO.md](11-GLOSSARIO.md) | A–W + "Nomes que mudaram" | — | `node scripts/docs-inventario.mjs` |
| Como escrever, verificar e travar documentação | [12-COMO-MANTER.md](12-COMO-MANTER.md) | §1–§10 | [`METODO.md`](../../.claude/skills/squad-docs/METODO.md) | `src/docsManual.contract.test.ts`, `src/docsSemMentira.contract.test.ts` |

---

<a id="indice-por-pergunta"></a>
## 4. Índice por pergunta — "vou mexer em…"

Quatro campos por linha, e nenhum fica vazio: onde **ler**, o **dono** (o símbolo que decide), a **régua** (o teste que trava — `nenhuma` quando não existe) e a **discussão** (onde está o porquê).

**Legenda da coluna Discussão:** `10 §N` = seção N de [`10-DISCUSSOES-E-DECISOES.md`](10-DISCUSSOES-E-DECISOES.md), que por sua vez aponta a fonte primária (quase sempre [`REGISTRO-DE-DECISOES.md`](../REGISTRO-DE-DECISOES.md)).

### 4.1 Os 59 sistemas de [`02-REGRAS-DE-NEGOCIO.md`](02-REGRAS-DE-NEGOCIO.md)

⚠️ As linhas 11–59 abaixo apontam para âncoras do índice do `02`; o corpo dessas seções foi escrito na mesma rodada de 09–10/09/2026 e os campos **Dono**/**Régua** aqui foram levantados do código, não copiados do `02`. Onde o `02` divergir deste índice, **o `02` manda** e esta tabela tem defeito.

| Vou mexer em… | Leia | Dono (símbolo) | Régua | Discussão |
|---|---|---|---|---|
| 1. Corações (HP) e perda na virada | [02 §1](02-REGRAS-DE-NEGOCIO.md#coracoes) | `src/utils/dailyReset.ts` → `computeDailyReset`, `heartGoalFor` | `src/hooks/useDailyReset.test.ts`, `src/utils/heartGoal.test.ts` | 10 §1 |
| 2. Carinho (esfregar, cura de HP) | [02 §2](02-REGRAS-DE-NEGOCIO.md#carinho) | `src/utils/careRules.ts` → `rubHeal`, `rubRefusal` | `src/utils/careRules.test.ts`, `src/utils/careUpdaters.test.ts` | 10 §1 |
| 3. Comida e o teto por hora | [02 §3](02-REGRAS-DE-NEGOCIO.md#comida) | `src/utils/careRules.ts` → `feedFood`, `recentFeeds` | `src/utils/careRules.test.ts` | 10 §6 |
| 4. Onde os tetos moram (`careCaps`) | [02 §4](02-REGRAS-DE-NEGOCIO.md#tetos) | `src/utils/careCaps.ts` → `hydrateCareCaps`, `mergeCareCaps` | `src/utils/careCaps.test.ts`, `src/utils/careCaps.fuso.test.ts` | 10 §17 |
| 5. O dia do jogador (fuso fixo) | [02 §5](02-REGRAS-DE-NEGOCIO.md#dia-do-jogador) | `src/utils/playerDay.ts` → `playerDayKey` | `src/utils/playerDay.contract.test.ts` | 10 §17 |
| 6. Energia e barras | [02 §6](02-REGRAS-DE-NEGOCIO.md#energia) | `src/types/progression.ts` → `getMaxEnergyForStage` | `src/types/progression.test.ts` | 10 §1 |
| 7. Dia completo (ex-"dia perfeito") | [02 §7](02-REGRAS-DE-NEGOCIO.md#dia-completo) | `src/utils/dailyReset.ts` → `computeDailyReset` (`dayWasPerfect`) | `src/hooks/useDailyReset.test.ts`, `src/utils/dailyGoal.contract.test.ts` | 10 §1 |
| 8. Cocô e dreno de HP | [02 §8](02-REGRAS-DE-NEGOCIO.md#coco) | `src/utils/poopDrain.ts` → `applyPoopDrain` | `src/utils/poopDrain.regression.test.ts` | 10 §1 |
| 9. Banho | [02 §9](02-REGRAS-DE-NEGOCIO.md#banho) | `src/utils/poopDrain.ts` → `cleanPoop` | `src/utils/poopDrain.cleanPoop.test.ts`, `desktop/renderer/src/care.banhoSono.parity.test.ts` | 10 §12 |
| 10. Dormir e sono automático | [02 §10](02-REGRAS-DE-NEGOCIO.md#dormir) | `src/App.tsx` (handler e transição) + `src/utils/restWindow.ts` | `src/utils/poopDrain.regression.test.ts`, `src/utils/noiteFuso.test.ts` | 10 §16 |
| 11. Relatório diário | [02 §11](02-REGRAS-DE-NEGOCIO.md#relatorio-diario) | `src/utils/dailyReset.ts` (escreve `lastDayReport`) + `src/components/DailyReportModal.tsx` | `src/hooks/useDailyReset.test.ts` | 10 §1 |
| 12. Check-in de humor | [02 §12](02-REGRAS-DE-NEGOCIO.md#humor) | `src/utils/mood.ts` → `recordMood`, `moodFor` | `src/utils/mood.test.ts` | 10 §8 |
| 13. Brincar | [02 §13](02-REGRAS-DE-NEGOCIO.md#brincar) | `src/utils/petNeeds.ts` → `play`, `canPlay`, `activeBuff` | `src/utils/petNeeds.test.ts`, `src/utils/petNeeds.fuso.test.ts` | 10 §6 |
| 14. A escada de estágios | [02 §14](02-REGRAS-DE-NEGOCIO.md#escada) | `src/types/progression.ts` → `FORM_REQUIREMENTS`, `MAX_HP_BY_FORM` | `src/types/progression.test.ts` | 10 §6 |
| 15. Atributos e galhos | [02 §15](02-REGRAS-DE-NEGOCIO.md#atributos) | `src/types/attributes.ts` + `src/utils/evolutionTarget.ts` → `evolutionTarget` | `src/utils/evolutionTarget.regression.test.ts` | 10 §6 |
| 16. Ritmo de cuidado | [02 §16](02-REGRAS-DE-NEGOCIO.md#ritmo) | `src/utils/carePattern.ts` → `computeCarePattern`, `resolveBranch` | `src/utils/carePattern.test.ts`, `src/utils/carePattern.threshold.test.ts` | 10 §6 |
| 17. Evolução manual e o cadeado | [02 §17](02-REGRAS-DE-NEGOCIO.md#evolucao) | `src/types/progression.ts` → `MANUAL_EVOLUTION` + `src/App.tsx` → `handleEvolve` | `src/components/evolucaoManual.contract.test.ts` | 10 §6 |
| 18. Degeneração e redenção | [02 §18](02-REGRAS-DE-NEGOCIO.md#degeneracao) | `src/utils/dailyReset.ts` (HP 0) | `src/utils/degeneracao.cenarios.test.ts`, `src/utils/redemption.test.ts` | 10 §1 |
| 19. Traços de nascimento | [02 §19](02-REGRAS-DE-NEGOCIO.md#tracos) | `src/utils/passives.ts` → `PET_PASSIVES`, `rollPetPassive` | `src/utils/passives.test.ts` | 10 §6 |
| 20. Renascimento (Rebirth) | [02 §20](02-REGRAS-DE-NEGOCIO.md#rebirth) | `src/utils/rebirth.ts` → `applyRebirth`, `rebirthRefusal` | `src/utils/rebirth.test.ts` | [`RENASCIMENTO.md`](../RENASCIMENTO.md) · 10 §6 |
| 21. O "porquê" do usuário | [02 §21](02-REGRAS-DE-NEGOCIO.md#soulgoal) | `src/utils/goalToCategory.ts` + `soulGoal`/`soulStruggle` no `GameState` | `src/utils/goalToCategory.test.ts` | 10 §3 |
| 22. O Oráculo (lado do jogador) | [02 §22](02-REGRAS-DE-NEGOCIO.md#oraculo) | `src/utils/oracle.ts` → `ORACLE_QUESTIONS` + `src/utils/soulProfile/pipeline.ts` | `src/utils/oracle.test.ts`, `src/utils/soulProfile/pipeline.test.ts` | [`ORACULO.md`](../ORACULO.md) · 10 §3 |
| 23. Meta ponderada por esforço | [02 §23](02-REGRAS-DE-NEGOCIO.md#meta-ponderada) | `src/utils/dailyReset.ts` → `dailyGoalFor`, `registeredForDay` | `src/utils/dailyGoal.contract.test.ts`, `src/utils/dailyGoalSources.test.ts` | 10 §2 |
| 24. Recorrência (`Schedule`) | [02 §24](02-REGRAS-DE-NEGOCIO.md#recorrencia) | `src/types/taskModel.ts` → `normalizeSchedule`, `weekDaysForSchedule` | `src/utils/habitRhythm.test.ts` | 10 §2 |
| 25. Constância ("N das últimas 7") | [02 §25](02-REGRAS-DE-NEGOCIO.md#constancia) | `src/utils/habitRhythm.ts` → `constancy`, `isDueOn` | `src/utils/habitRhythm.test.ts` | 10 §2 |
| 26. Escudos de descanso | [02 §26](02-REGRAS-DE-NEGOCIO.md#escudos) | `src/utils/habitRhythm.ts` → `earnShield`, `applyMissedDay` | `src/utils/dailyReset.escudos.test.ts` | 10 §1 |
| 27. Never miss twice | [02 §27](02-REGRAS-DE-NEGOCIO.md#never-miss-twice) | `src/utils/habitRhythm.ts` → `needsIntervention`, `consecutiveMisses` | `src/utils/habitRhythm.test.ts` | 10 §1 |
| 28. Marcos de hábito | [02 §28](02-REGRAS-DE-NEGOCIO.md#marcos) | `src/types/taskModel.ts` → `HABIT_MILESTONES` + `src/utils/habitRhythm.ts` → `habitTier` | `src/utils/habitRhythm.test.ts` | 10 §2 |
| 29. Tarefa assombrada | [02 §29](02-REGRAS-DE-NEGOCIO.md#assombrada) | `src/utils/taskTriage.ts` → `isHaunted` | `src/utils/taskTriage.test.ts` | 10 §2 |
| 30. Adiamentos | [02 §30](02-REGRAS-DE-NEGOCIO.md#adiamentos) | `src/utils/taskTriage.ts` → `postpone`, `shrink` | `src/utils/taskTriage.test.ts` | 10 §2 |
| 31. Algum dia / Deixar pra lá | [02 §31](02-REGRAS-DE-NEGOCIO.md#someday) | `src/utils/taskTriage.ts` → `toSomeday`, `drop`, `restore` | `src/utils/taskTriage.test.ts` | 10 §2 |
| 32. Foco do dia | [02 §32](02-REGRAS-DE-NEGOCIO.md#foco) | `src/utils/taskTriage.ts` → `setFocus`, `focusComplete` | `src/utils/taskTriage.test.ts` | 10 §2 |
| 33. Carga do dia | [02 §33](02-REGRAS-DE-NEGOCIO.md#carga) | `src/utils/taskTriage.ts` → `plannedEffort`, `isOvercommitted` | `src/utils/taskTriage.test.ts` | 10 §2 |
| 34. Arrumar a pilha (triagem) | [02 §34](02-REGRAS-DE-NEGOCIO.md#triagem) | `src/utils/taskTriage.ts` → `triageQueue` | `src/utils/taskTriage.test.ts` | 10 §2 |
| 35. Quick add e sugestões | [02 §35](02-REGRAS-DE-NEGOCIO.md#quickadd) | `src/utils/quickAdd.ts` → `parseQuickAdd`; `src/utils/taskSuggestions.ts` → `suggestTasks` | `src/utils/quickAdd.test.ts`, `src/utils/taskSuggestions.test.ts` | 10 §2 |
| 36. Equilibrar minha semana | [02 §36](02-REGRAS-DE-NEGOCIO.md#equilibrar) | `src/utils/weekBalance.ts` → `equilibrarSemana`, `valeEquilibrar` | `src/utils/weekBalance.test.ts` | 10 §2 |
| 37. Check-in | [02 §37](02-REGRAS-DE-NEGOCIO.md#checkin) | `src/utils/rituals.ts` → `checkInPlan`, `completeCheckIn` | `src/utils/rituals.test.ts` | 10 §2 |
| 38. Relatório semanal | [02 §38](02-REGRAS-DE-NEGOCIO.md#relatorio-semanal) | `src/utils/rituals.ts` → `weeklyReport`, `stackingSuggestion` | `src/utils/rituals.test.ts` | 10 §2 |
| 39. Fresh start | [02 §39](02-REGRAS-DE-NEGOCIO.md#fresh-start) | `src/utils/rituals.ts` → `isFreshStartDay`, `applyFreshStart` | `src/utils/rituals.test.ts` | 10 §1 |
| 40. Janela de descanso | [02 §40](02-REGRAS-DE-NEGOCIO.md#janela-descanso) | `src/utils/restWindow.ts` → `isWithinWindow`, `recordNight`, `restConstancy` | `src/utils/restWindow.test.ts`, `src/utils/noiteFuso.test.ts` | 10 §16 |
| 41. Sonhos | [02 §41](02-REGRAS-DE-NEGOCIO.md#sonhos) | `src/utils/restWindow.ts` → `DREAM_CATALOG`, `rollDream`, `dexProgress` | `src/utils/restWindow.test.ts` | 10 §16 |
| 42. Pesadelos | [02 §42](02-REGRAS-DE-NEGOCIO.md#pesadelos) | `src/utils/nightmares.ts` → `buildNightmareWave`, `markFought` | `src/utils/nightmares.test.ts` | 10 §16 |
| 43. Aventura da noite | [02 §43](02-REGRAS-DE-NEGOCIO.md#aventura) | `src/utils/adventure.ts` → `rollAdventure`, `collectAdventure` | `src/utils/adventure.test.ts` | 10 §16 |
| 44. Passos | [02 §44](02-REGRAS-DE-NEGOCIO.md#passos) | `src/utils/steps.ts` → `stepsDeltaFrom`, `isStepsAvailable` | `src/utils/steps.test.ts` | 10 §8 |
| 45. Aniversário e memórias | [02 §45](02-REGRAS-DE-NEGOCIO.md#aniversario) | `src/utils/anniversary.ts` → `anniversaryOn`; `src/utils/memories.ts` → `memoryToShow` | `src/utils/anniversary.test.ts`, `src/utils/memories.test.ts` | 10 §6 |
| 46. As três moedas | [02 §46](02-REGRAS-DE-NEGOCIO.md#moedas) | `src/utils/currencies.ts` → `bitsStyle`, rótulos | `src/utils/currencies.test.ts`, `src/utils/monetization.fronteira.test.ts` | 10 §4 |
| 47. Loja | [02 §47](02-REGRAS-DE-NEGOCIO.md#loja) | `src/utils/shop.ts` (catálogo) + `src/utils/shopBuy.ts` → `applyShopBuy`, `shopBuyRefusal` | `src/utils/shopBuy.test.ts` | [`SHOP-PLAN.md`](../SHOP-PLAN.md) · 10 §6 |
| 48. Itens especiais (💗, 🌀) | [02 §48](02-REGRAS-DE-NEGOCIO.md#itens-especiais) | `src/utils/specialItemUse.ts` → `applySpecialItem`, `specialRefusal` | `src/utils/specialItemUse.test.ts`, `src/utils/x6Updaters.contract.test.ts` | 10 §6 |
| 49. Missões permanentes | [02 §49](02-REGRAS-DE-NEGOCIO.md#missoes) | `src/utils/missions.ts` → `MISSIONS`, `isShopItemUnlocked` | `src/utils/missions.test.ts` | 10 §6 |
| 50. Missões semanais | [02 §50](02-REGRAS-DE-NEGOCIO.md#missoes-semanais) | `src/utils/weeklyMissions.ts` → `forWeek` + `src/App.tsx` → `contarMissao` | `src/utils/weeklyMissions.fiacao.test.ts` | 10 §6 |
| 51. Masmorra | [02 §51](02-REGRAS-DE-NEGOCIO.md#masmorra) | `src/utils/dungeon.ts` → `buildDungeonWave` + `src/components/DungeonGame.tsx` → `MAX_FLOORS` | `src/utils/dungeon.derrotaNaoCobra.test.ts`, `src/utils/dungeon.deepStart.test.ts` | 10 §6 |
| 52. Bestiário | [02 §52](02-REGRAS-DE-NEGOCIO.md#bestiario) | `src/utils/sprites.ts` → `enemyKey`, `DUNGEON_LINE_SPRITES` | `src/utils/sprites.dungeonRoster.test.ts` | 10 §6 |
| 53. Torneio, faixas e Arena | [02 §53](02-REGRAS-DE-NEGOCIO.md#torneio) | `src/utils/tournamentSeason.ts` → `getTournamentWindow`; `src/utils/tournamentTiers.ts` → `getTierStanding`; `src/utils/arena.ts` | `src/utils/tournamentSeason.test.ts`, `src/utils/tournamentTiers.test.ts`, `src/utils/arena.test.ts` | 10 §5 |
| 54. Minijogos (PPT e Dino) | [02 §54](02-REGRAS-DE-NEGOCIO.md#minijogos) | `src/components/RPSGame.tsx`, `src/components/DinoGame.tsx` + `src/utils/petNeeds.ts` → `minigameMultiplier` | `src/utils/petNeeds.test.ts` | 10 §6 |
| 55. Vínculo e o gate de PvP | [02 §55](02-REGRAS-DE-NEGOCIO.md#vinculo) | `src/utils/bond.ts` → `bondLevelFor`, `BOND_PVP_MIN_LEVEL` + `functions/api/_bond.js` | `src/utils/bond.test.ts`, `src/utils/bond.wiring.test.ts` | 10 §5 |
| 56. Comunidade e cooperativo | [02 §56](02-REGRAS-DE-NEGOCIO.md#comunidade) | `src/utils/community.ts` + `functions/api/community.js` | `src/utils/community.respostaIlegivel.test.ts`, `functions/api/community.test.js` | [`PLANO-COOP.md`](../PLANO-COOP.md) · 10 §5 |
| 57. Estações | [02 §57](02-REGRAS-DE-NEGOCIO.md#estacoes) | `src/utils/seasons.ts` → `currentSeason`, `applySeasonMedal` | `src/utils/seasons.test.ts`, `src/utils/seasons.fiada.test.ts` | 10 §6 |
| 58. Notificações como regra | [02 §58](02-REGRAS-DE-NEGOCIO.md#notificacoes) | `functions/api/_pushCopy.js` → `pushCopy`, `eveningCopy` + `src/utils/notifications.ts` | `workers/pushCopy.parity.test.js` | 10 §7 |
| 59. Divergências com o `CLAUDE.md` | [02 §59](02-REGRAS-DE-NEGOCIO.md#divergencias) | — (registro) | `npx vitest run` (é a divergência que o teste pega) | [`STATUS.md`](../STATUS.md) |

### 4.2 As superfícies de [`03-FLUXO-DE-TELAS.md`](03-FLUXO-DE-TELAS.md)

| Vou mexer em… | Leia | Dono (símbolo) | Régua | Discussão |
|---|---|---|---|---|
| Qual tela aparece (roteador) | 03 §1.1 | `src/App.tsx` → `currentView` | `src/components/filaDeAvisos.contract.test.ts` | 10 §11 |
| Barra inferior e sub-abas | 03 §1.2–§1.3 | `src/components/BottomNav.tsx` | `src/components/ui/foundation.render.test.tsx` | 10 §11 |
| Splash e vídeo de marca | 03 §2.1–§2.2 | `index.html` + `src/components/IntroScreen.tsx` | `src/deploy/swCache.contract.test.ts` | 10 §11 |
| Ritual do Oráculo (onboarding) | 03 §2.3 | `src/components/SoulmonOnboarding.tsx` | `src/components/upgradeReveal.contract.test.ts` | 10 §3 |
| Tutorial de jogo | 03 §2.4 | `src/components/GameTutorialFlow.tsx` | `nenhuma` | 10 §3 |
| Primeiro dia e prompt de boas-vindas | 03 §2.5–§2.6 | `src/utils/firstDay.ts` + `src/components/WelcomePromptModal.tsx` | `src/utils/firstDay.test.ts` | 10 §3 |
| Fila 1 — intersticiais | 03 §3.1 | `src/App.tsx` → `const interstitial` | `src/components/filaDeAvisos.contract.test.ts` | 10 §11 |
| Fila 2 — slot de avisos da Home | 03 §3.2 | `src/App.tsx` (slot da Home) | `src/components/filaDeAvisos.contract.test.ts` | 10 §11 |
| Home | 03 §4.1 | `src/App.tsx` (`currentView === 'main'`) | `src/components/filaDeAvisos.contract.test.ts` | 10 §11 |
| Área do pet (`CompanionHUD`) | 03 §4.2 | `src/components/CompanionHUD.tsx` | `src/components/sintonia-chiado.render.test.tsx` | 10 §11 |
| Barra de conversa (`ChatBox`) | 03 §4.3 | `src/components/ChatBox.tsx` + `functions/api/chat.js` | `src/security/supabase.contract.test.ts` | 10 §7 |
| Página Atividades | 03 §4.4 | `src/components/ActivitiesPage.tsx` | `src/utils/activityCreate.contract.test.ts` | 10 §2 |
| Lista de atividades e seus modais | 03 §4.5 | `src/components/EditModal.tsx`, `src/hooks/useItemForm.ts` | `src/utils/habitCreate.test.ts` | 10 §2 |
| Loja (abas) | 03 §4.6 | `src/components/ShopModal.tsx` + `src/utils/shopBuy.ts` | `src/utils/shopBuy.test.ts` | 10 §6 |
| Página Soulmon | 03 §4.7 | `src/App.tsx` (`currentView === 'pet'`) | `nenhuma` | 10 §11 |
| Estatísticas (inclui bestiário) | 03 §4.8 | `src/App.tsx` (`currentView === 'stats'`) | `src/utils/sprites.dungeonRoster.test.ts` | 10 §6 |
| `OraclePage` (inalcançável pela navegação) | 03 §4.9 | `src/components/OraclePage.tsx` | `src/utils/oracle.test.ts` | 10 §3 |
| Página de Evolução | 03 §4.10 | `src/components/EvolutionPath.tsx` | `src/components/evolucaoManual.contract.test.ts` | 10 §6 |
| Cerimônia de evolução e `EvolveTaskModal` | 03 §4.11 | `src/components/EvolutionCeremony.tsx` | `src/components/evolucaoManual.contract.test.ts` | 10 §6 |
| `RebirthModal` | 03 §4.12 | `src/components/RebirthModal.tsx` + `src/utils/rebirth.ts` | `src/utils/rebirth.test.ts` | [`RENASCIMENTO.md`](../RENASCIMENTO.md) |
| `UnlockNudge` / `UnlockAccountModal` | 03 §4.13 | `src/components/UnlockAccountModal.tsx` + `src/utils/offerMoment.ts` | `src/components/ofertaDoisCanais.contract.test.ts`, `src/utils/offerMoment.test.ts` | 10 §4 |
| Os jogos (Dino, PPT, Masmorra, Arena) | 03 §4.14 | `src/components/DungeonGame.tsx`, `src/components/ArenaGame.tsx` | `src/utils/cortes.contract.test.ts` | 10 §6 |
| Torneio | 03 §4.15 | `src/App.tsx` (`currentView === 'tournament'`) + `src/utils/tournamentTiers.ts` | `src/utils/tournamentTiers.test.ts` | 10 §5 |
| `DailyReportModal` (+ humor, aventura, memórias) | 03 §4.16 | `src/components/DailyReportModal.tsx` | `src/utils/mood.test.ts` | 10 §1 |
| `MorningCheckIn` | 03 §4.17 | `src/components/MorningCheckIn.tsx` + `src/utils/rituals.ts` | `src/utils/rituals.test.ts` | 10 §2 |
| `MorningDream` | 03 §4.18 | `src/components/MorningDream.tsx` + `src/utils/restWindow.ts` | `src/utils/restWindow.test.ts` | 10 §16 |
| `WeeklyReportCard` | 03 §4.19 | `src/components/WeeklyReportCard.tsx` | `src/utils/rituals.test.ts` | 10 §2 |
| `MilestoneCeremony` | 03 §4.20 | `src/components/MilestoneCeremony.tsx` | `src/components/filaDeAvisos.contract.test.ts` | 10 §2 |
| `ProtectProgressModal` | 03 §4.21 | `src/components/ProtectProgressModal.tsx` | `src/components/filaDeAvisos.contract.test.ts` | 10 §11 |
| Biblioteca (e aba Grupo) | 03 §4.22 | `src/components/CoopPanel.tsx` + `src/utils/libraryNpcs.ts` | `src/utils/community.respostaIlegivel.test.ts` | [`PLANO-COOP.md`](../PLANO-COOP.md) |
| Configurações | 03 §4.23 | `src/App.tsx` (`currentView === 'settings'`) | `src/utils/telemetry.test.ts` | 10 §8 |
| Créditos e Nova Leitura | 03 §4.24 | `src/utils/newReading.ts` + `src/utils/entitlements.ts` | `src/utils/newReading.test.ts` | 10 §4 |
| Superfícies globais (toasts, erro, a11y) | 03 §4.25 | `src/components/ErrorBoundary.tsx`, `src/hooks/useDialogA11y.ts` | `src/components/ui/Viewport.contract.test.tsx` | 10 §11 |
| Widgets Android | 03 §5.1 | `src/plugins/SoulmonWidgetPlugin.ts` + `android/app/src/main/java/com/hexervoodoom/soulmon/widget/WidgetRenderer.kt` | `src/plugins/widgetSemCobranca.contract.test.ts` | 10 §7 |
| Overlay Electron | 03 §5.2 | `desktop/renderer/src/care.ts` | `desktop/renderer/src/care.parity.test.ts` | 10 §12 |
| Notificações (o que a pessoa lê) | 03 §5.3 | `functions/api/_pushCopy.js` → `pushCopy` | `workers/pushCopy.parity.test.js` | 10 §7 |

### 4.3 As integrações de [`08-INTEGRACOES-E-DEPLOY.md`](08-INTEGRACOES-E-DEPLOY.md)

| Vou mexer em… | Leia | Dono (símbolo) | Régua | Discussão |
|---|---|---|---|---|
| Firebase Auth (projeto `soulmon-app`) | 08 §2.1 | `src/utils/auth.ts` + `.env.production` | `src/deploy/firebaseNoBuild.contract.test.ts`, `src/utils/auth.redirect.test.ts` | 10 §13 |
| Groq (chat do pet, sugestão de tarefas) | 08 §2.2 | `functions/api/chat.js`, `functions/api/suggest-tasks.js` | `functions/api/chat.promptInjection.test.js`, `functions/api/suggest-tasks.contract.test.js`, `src/utils/chatSafety.test.ts` | 10 §7 |
| Higgsfield / Gemini (geração de sprite) | 08 §2.3 | `functions/api/generate-sprite.js` + `src/utils/spriteRunner.ts` | `src/utils/spritePrompt.dono.contract.test.ts`, `src/utils/spriteGen.contract.test.ts` | 10 §10 |
| Supabase (transcrição de voz) | 08 §2.4 | `functions/api/transcribe.js` | `src/security/supabase.contract.test.ts` | 10 §14 |
| Web Push (VAPID) | 08 §2.5 | `functions/api/subscribe.js` + `workers/webpush.js` | `workers/vapid.parity.test.js` | 10 §7 |
| FCM (push nativo Android) | 08 §2.6 | `functions/api/fcm-subscribe.js` + `workers/fcm.js` | `workers/pushCopy.parity.test.js` | 10 §7 |
| Agendador de push | 08 §2.7 | `workers/push-scheduler.js` → `PUSH_HOURS_BRT` | `workers/pushCopy.parity.test.js` | 10 §7 |
| Google Play Billing | 08 §2.8 | `functions/api/_billing.js` → `PRODUCTS`, `claimOrder` | `functions/api/billing.test.js` | [`BILLING-SETUP.md`](../BILLING-SETUP.md) · 10 §4 |
| Steam | 08 §2.9 | `functions/api/_billing.js` → `STEAM_ITEMS` | `functions/api/billing.test.js` | [`PLANO-DESKTOP-STEAM.md`](../PLANO-DESKTOP-STEAM.md) · 10 §12 |
| Entitlements (tier e créditos) | 08 §2.10 | `functions/api/_entitlements.js` | `functions/api/entitlements.test.js`, `src/utils/monetization.fronteira.test.ts` | 10 §4 |
| Comunidade / cooperativo | 08 §2.11 | `functions/api/community.js` | `functions/api/community.test.js` | [`PLANO-COOP.md`](../PLANO-COOP.md) · 10 §5 |
| Telemetria | 08 §2.12 | `src/utils/telemetry.ts` + `functions/api/metrics.js` | `src/utils/telemetry.test.ts`, `tests/metricsReport.test.ts` | 10 §8 |
| `/api/config` e `/api/account` | 08 §2.13 | `functions/api/config.js`, `functions/api/account.js` | `functions/api/account.test.js` | 10 §14 |
| URL de produção (as fontes que concordam) | 08 §3.1 | `desktop/renderer/src/config.ts` → `APP_URL` | `src/deploy/appUrl.contract.test.ts` | 10 §13 |
| Deploy web (Cloudflare Pages) e CI | 08 §3.2–§3.3 | `.github/workflows/` | `src/deploy/firebaseNoBuild.contract.test.ts` | 10 §13 |
| APK e worker de push | 08 §3.4–§3.5 | `android/`, `workers/` | `npx vitest run workers` | 10 §13 |
| `CACHE_VERSION` | 08 §3.6 | `public/sw.js` → `CACHE_VERSION` | `src/deploy/swCache.contract.test.ts`, `tests/swOrigemDaResposta.test.ts` | 10 §13 |
| O que depende do dono | 08 §4 | — (fora do código) | `nenhuma` | [`DEPENDE-DE-VOCE.md`](../DEPENDE-DE-VOCE.md) · 10 §18 |
| Privacidade e ficha da loja | 08 §5 | `public/privacidade.html`, `public/termos.html` | `nenhuma` | [`PLAY-DATA-SAFETY.md`](../PLAY-DATA-SAFETY.md) · 10 §8 |

---

<a id="indice-por-arquivo"></a>
## 5. Índice por arquivo — do código para o doc

Você tem um caminho e quer saber quem o documenta. A referência função a função é sempre `06-REFERENCIA/`; a coluna "Contexto" diz onde está o PORQUÊ.

| Pasta / arquivo | Referência | Contexto |
|---|---|---|
| `src/App.tsx` | [06-REFERENCIA/components.md](06-REFERENCIA/components.md) | [03-FLUXO-DE-TELAS.md](03-FLUXO-DE-TELAS.md), [05-ARQUITETURA.md](05-ARQUITETURA.md) |
| `src/main.tsx` | [06-REFERENCIA/components.md](06-REFERENCIA/components.md) | [05-ARQUITETURA.md](05-ARQUITETURA.md) §3 |
| `src/components/**` | [06-REFERENCIA/components.md](06-REFERENCIA/components.md) | [03-FLUXO-DE-TELAS.md](03-FLUXO-DE-TELAS.md), [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) |
| `src/components/ui/**` | [06-REFERENCIA/components.md](06-REFERENCIA/components.md) | [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) §2, §5 |
| `src/hooks/**` | [06-REFERENCIA/hooks-contexts-types.md](06-REFERENCIA/hooks-contexts-types.md) | [05-ARQUITETURA.md](05-ARQUITETURA.md) §3.2 |
| `src/contexts/**` | [06-REFERENCIA/hooks-contexts-types.md](06-REFERENCIA/hooks-contexts-types.md) | [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md) §2–§3 |
| `src/types/**` | [06-REFERENCIA/hooks-contexts-types.md](06-REFERENCIA/hooks-contexts-types.md) | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) (constantes) |
| `src/utils/**` | [06-REFERENCIA/utils.md](06-REFERENCIA/utils.md) | [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) |
| `src/utils/soulProfile/**` | [06-REFERENCIA/utils.md](06-REFERENCIA/utils.md) | [`ORACULO.md`](../ORACULO.md), [02 §22](02-REGRAS-DE-NEGOCIO.md#oraculo) |
| `src/plugins/**` | [06-REFERENCIA/plugins-constants.md](06-REFERENCIA/plugins-constants.md) | [03-FLUXO-DE-TELAS.md](03-FLUXO-DE-TELAS.md) §5.1 |
| `src/constants/**`, `src/translations/**` | [06-REFERENCIA/plugins-constants.md](06-REFERENCIA/plugins-constants.md) | [05-ARQUITETURA.md](05-ARQUITETURA.md) §6 (idioma) |
| `src/security/**`, `src/deploy/**` | [06-REFERENCIA/plugins-constants.md](06-REFERENCIA/plugins-constants.md) | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) |
| `src/styles/**`, `src/index.css` | [06-REFERENCIA/plugins-constants.md](06-REFERENCIA/plugins-constants.md) | [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) §2–§6 |
| `src/test/**` | [06-REFERENCIA/plugins-constants.md](06-REFERENCIA/plugins-constants.md) | [05-ARQUITETURA.md](05-ARQUITETURA.md) §10.3 |
| `src/assets/soulmon/**` | — (arte, sem módulo) | [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) §8, [`Attributions.md`](../Attributions.md) |
| `functions/api/**` | [06-REFERENCIA/api-workers.md](06-REFERENCIA/api-workers.md) | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) §1–§2 |
| `workers/**` | [06-REFERENCIA/api-workers.md](06-REFERENCIA/api-workers.md) | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) §2.5–§2.7 |
| `desktop/electron/**`, `desktop/renderer/src/**` | [06-REFERENCIA/desktop.md](06-REFERENCIA/desktop.md) | [05-ARQUITETURA.md](05-ARQUITETURA.md) §4, [`PLANO-DESKTOP-STEAM.md`](../PLANO-DESKTOP-STEAM.md) |
| `android/**` | — (Kotlin/Java, fora das árvores medidas) | [03-FLUXO-DE-TELAS.md](03-FLUXO-DE-TELAS.md) §5.1, [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) §3.4, [`APK-BUILD-INFO.md`](../APK-BUILD-INFO.md) (registro) |
| `public/sw.js`, `public/_headers` | — | [05-ARQUITETURA.md](05-ARQUITETURA.md) §7, [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) §3.6 |
| `public/manifest.json`, `public/fonts/**` | — | [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) §10 |
| `migrations/**` | — | [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md) §8.3 (`order_claims`) |
| `scripts/**` | — | [12-COMO-MANTER.md](12-COMO-MANTER.md) §4 (inventário), [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) §8 (geração de arte) |
| `tests/**`, `tools/**` | — | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) §2.12 (telemetria) |
| `types/**`, `vendor/**` | — | [05-ARQUITETURA.md](05-ARQUITETURA.md) §2.1 |
| `.github/workflows/**` | — | [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) §3.3 |

---

<a id="outros-documentos"></a>
## 6. Os outros documentos, e para que servem

Uma linha por arquivo. **Etiqueta**: `vivo` (descreve o estado e é mantido) · `registro` (foto datada; não se reescreve) · `pesquisa` (levantamento externo) · `plano` (o que se pretendia — **não é estado**).

### 6.1 Fora de `docs/`

| Arquivo | O que é | Etiqueta | Absorvido pelo manual? |
|---|---|---|---|
| [`CLAUDE.md`](../../CLAUDE.md) | guia canônico para agentes: regras de jogo, arquitetura, footguns, convenções. **Precede o manual** na hierarquia | vivo | não — o manual DETALHA o que ele resume; onde discordarem, o `CLAUDE.md` ganha do manual e o código ganha dos dois |
| [`README.md`](../../README.md) | ⚠️ **ainda diz "DigiApp Design Prototype"** e aponta para o Figma do fork (`grep -c -i digiapp README.md` → 2, em 10/09/2026) | registro | não; substituído na prática por este mapa e por [`00-START-HERE.md`](../00-START-HERE.md) |
| [`PROJETO.md`](../../PROJETO.md) | ⚠️ **especificação de 25/06/2026 assinada "DigiApp"** (`grep -c -i digiapp PROJETO.md` → 16, em 10/09/2026); descreve o produto antes da virada | registro | sim, substituído por [01-VISAO.md](01-VISAO.md) + [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) + [05-ARQUITETURA.md](05-ARQUITETURA.md) |
| [`PLANO_MELHORIAS.md`](../../PLANO_MELHORIAS.md) | plano de refatoração de 17/06/2026, da era DigiApp (não confundir com [`docs/PLANO-MELHORIAS.md`](../PLANO-MELHORIAS.md), que é outro documento) | registro | sim, o que sobrou está em [09-HISTORICO.md](09-HISTORICO.md) §1.1 |
| [`CONTRACT.md`](../../CONTRACT.md) | contrato do kit ProdSquad (orquestrador × agentes), validado por `scripts/validate_squad.py` | vivo | não — é sobre o processo de squad, não sobre o produto |
| [`PWA-CHECKLIST.md`](../../PWA-CHECKLIST.md), [`PWA-SETUP.md`](../../PWA-SETUP.md) | checklists de PWA da era DigiApp (cópias também em `public/`) | registro | sim, o vigente está em [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) §3 e [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) §10 |
| [`brand/README.md`](../../brand/README.md) | instrução do kit: "coloque aqui o design system" | vivo | não |
| [`brand/design-system.md`](../../brand/design-system.md) | ⚠️ **é o design system da "Consultech360", OUTRO produto** — veio no kit e nunca foi trocado. Não descreve o Soulmon | registro | sim, e o achado está registrado em [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) §12 |
| [`memory/company.md`](../../memory/company.md) | contexto de empresa que toda persona do squad lê antes de agir (já reescrito para o Soulmon) | vivo | parcial — a tese está em [01-VISAO.md](01-VISAO.md) |
| [`memory/product-context.md`](../../memory/product-context.md) | brief compartilhado do produto para as personas do squad | vivo | parcial — idem |
| [`desktop/README.md`](../../desktop/README.md) | build, release e política de publicação do overlay Electron | vivo | parcial — [06-REFERENCIA/desktop.md](06-REFERENCIA/desktop.md) e [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) §3.3 |
| [`migrations/README.md`](../../migrations/README.md) | como aplicar as migrações D1 | vivo | parcial — [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md) §8.3 |
| [`.claude/agents/`](../../.claude/agents/) | 51 definições de agente (`ls .claude/agents/*.md \| wc -l` → 51, em 10/09/2026): os `soulmon-*` da revisão e dos guardas, os `som-*`, os `doc-*` da SQUAD-DOCS, e os dois que nasceram em 10/09/2026 — **`soulmon-coordenador`** (toda sessão começa e termina por ele) e **`doc-mantenedor`** (sincroniza este manual a cada merge) | vivo | não — o roster está resumido em [12-COMO-MANTER.md](12-COMO-MANTER.md) §9 |
| [`.claude/skills/squad-docs/METODO.md`](../../.claude/skills/squad-docs/METODO.md) | **fonte canônica das dez regras R1–R10** de documentação | vivo | sim, em versão operacional: [12-COMO-MANTER.md](12-COMO-MANTER.md) |
| [`.claude/commands/`](../../.claude/commands/) | 8 comandos de barra (`/soulmon`, `/manter-docs`, `/documentar`, `/squad-design`, `/revisao-soulmon`, `/implementar-wp`, `/destrinchar-estudo`, `/guarda-soulmon`) | vivo | não |
| [`.claude/skills/squad-design/`](../../.claude/skills/squad-design/) | a **SQUAD-DESIGN** (13/09/2026): redesenho em duas fases — wireframes em cinza de todas as telas, depois a identidade. `SKILL.md` (comandos `desenhar/criticar/decidir/identidade`), `CONTRACT.md` (roster: `design-curador-padroes`, `design-wireframer` + design-lead, cartógrafo, product-designer, design-critic, guarda-linha-vermelha, visual-designer), `METODO.md` (regras **W1–W10**) | vivo | §8 e [HANDOFF-WIREFRAMES.md](../HANDOFF-WIREFRAMES.md) |
| [`.claude/skills/soulmon-coordenador/SKILL.md`](../../.claude/skills/soulmon-coordenador/SKILL.md) | a **tabela de roteamento** (pedido → orquestrador dono → o que vai no briefing) e o protocolo de fechamento de sessão | vivo | resumido em §8 abaixo |
| [`.claude/skills/manter-docs/SKILL.md`](../../.claude/skills/manter-docs/SKILL.md) | o procedimento de sincronização pós-merge do manual (delta → redatores → verificação → carimbo → `.sincronizado.json`) | vivo | resumido em [12-COMO-MANTER.md](12-COMO-MANTER.md) §11 |
| [`.claude/hooks/session-start.sh`](../../.claude/hooks/session-start.sh) + [`.claude/settings.json`](../../.claude/settings.json) | o hook de início de sessão: instala dependências se faltarem e imprime o briefing (git, delta do manual, guard — as linhas `Test Files` **e** `Tests` do vitest, desde `708893c0` em 14/09/2026; ⚰️ era só `Tests`, e uma suíte que falha ao parsear não roda teste nenhum, então a falha só aparece em `Test Files` —, o que depende do dono) com a ordem de invocar `/soulmon start` | vivo | §8 |
| [`.github/workflows/docs-sync.yml`](../../.github/workflows/docs-sync.yml) | a cada push na `main`: mede o delta do manual, roda o guard e — se `ANTHROPIC_API_KEY` existir — levanta o `doc-mantenedor` para sincronizar e abrir/mergear o PR `docs/sync-<sha>` | vivo | §8 |
| `docs/manual/.sincronizado.json` | o SHA da última sincronização do manual, gravado pelo `doc-mantenedor`; base de `scripts/docs-delta.mjs`. **Nunca se edita à mão** | vivo (máquina) | — |
| [`product/soulmon-01/`](../../product/soulmon-01/) | 28 relatórios de rodadas de balanceamento, varredura de QA e alinhamento de UI (`find product -name '*.md' \| wc -l` → 28, em 10/09/2026). O mais citado pelo `CLAUDE.md` é [`balance/carga-diaria.md`](../../product/soulmon-01/balance/carga-diaria.md) (decisões P1–P5) | registro | parcial — as decisões P1/P5 estão em [02 §1](02-REGRAS-DE-NEGOCIO.md#coracoes) e [02 §7](02-REGRAS-DE-NEGOCIO.md#dia-completo) |

### 6.2 `docs/` — primeiro nível

| Arquivo | O que é | Etiqueta | Absorvido pelo manual? |
|---|---|---|---|
| [00-START-HERE.md](../00-START-HERE.md) | porta de entrada mínima: a ordem de leitura e o ponteiro para este mapa | vivo | é o vestíbulo deste mapa |
| [APK-BUILD-INFO.md](../APK-BUILD-INFO.md) | build Android da era DigiApp (23/12/2024), marcado `doc-historico`; foi onde a SQUAD-DOCS achou um JWT do Supabase do fork em texto plano | registro | sim — o vigente é [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) §3.4 |
| [ASSINATURA-SPEC.md](../ASSINATURA-SPEC.md) | especificação WP5.4 de assinatura/trial, que responde "não" quase inteira (decisão **D10**) | plano | parcial — a decisão está em [10 §4](10-DISCUSSOES-E-DECISOES.md) |
| [AUDITORIA-ALINHAMENTO.md](../AUDITORIA-ALINHAMENTO.md) | auditoria de 06/09/2026: sete agentes releram o corpus contra o código | registro | parcial — os achados viraram linhas de [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) e [`STATUS.md`](../STATUS.md) |
| [Attributions.md](../Attributions.md) | o que de terceiro entrou no bundle, o que saiu e o que a declaração antiga errou | vivo | parcial — [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) §8.3 |
| [BACKLOG-ARTE-GERAR.md](../BACKLOG-ARTE-GERAR.md) | fila de arte a gerar, com prompt e destino por item | plano | não — é backlog de produção |
| [BILLING-SETUP.md](../BILLING-SETUP.md) | o que configurar FORA do código para o pagamento funcionar | vivo | parcial — [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) §2.8 |
| [BRIEF-ARTE-DECORACAO.md](../BRIEF-ARTE-DECORACAO.md) | brief das 14 peças de decoração que ainda são emoji | plano | parcial — o contrato de caixa está em [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) §7 |
| [CHANGELOG.md](../CHANGELOG.md) | changelog; as entradas até a v1.0.x são do DigiApp (marcado `doc-historico`) | registro | não se reescreve — [09-HISTORICO.md](09-HISTORICO.md) o cita, não o substitui |
| [DEPENDE-DE-VOCE.md](../DEPENDE-DE-VOCE.md) | tudo que exige conta, cartão, painel ou aparelho do dono | vivo | parcial — [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) §4 e [`STATUS.md`](../STATUS.md) §3 |
| [GUIA-EXPERIENCIA.md](../GUIA-EXPERIENCIA.md) | documento mestre da pesquisa de setembro/2026, consolidando os 7 relatórios de `guia-experiencia/` | pesquisa | parcial — o que virou regra está em [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md); o que virou decisão, em [10-DISCUSSOES-E-DECISOES.md](10-DISCUSSOES-E-DECISOES.md) |
| [HANDOFF-ARTE-GEMINI.md](../HANDOFF-ARTE-GEMINI.md) | roteiro da sessão de geração de arte no navegador (08/09/2026) | plano | não |
| [HANDOFF-QA-REVISAO.md](../HANDOFF-QA-REVISAO.md) | handoff para a sessão de QA, incluindo "onde eu provavelmente errei" | registro | parcial — os achados foram para [`STATUS.md`](../STATUS.md) |
| [HANDOFF-SESSAO-LOCAL.md](../HANDOFF-SESSAO-LOCAL.md) | o que só uma sessão na máquina do dono consegue terminar | plano | parcial — [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) §4 |
| [HANDOFF-WIREFRAMES.md](../HANDOFF-WIREFRAMES.md) | **o handoff da Fase 1 do redesenho** (13/09/2026): o que ler, a squad, os 10 fluxos na ordem de frequência, o formato do canvas, o aceite W1–W10, a Fase 2 combinada | cumprido em 15/09/2026 (os 13 canvases aprovados) | é a porta de entrada de `docs/design/` (§6.7) |
| [HANDOFF-IDENTIDADE.md](../HANDOFF-IDENTIDADE.md) | **o handoff da Fase 2 do redesenho** (15/09/2026): a identidade que já existe (`04`) aplicada sobre os wireframes aprovados, sem reabrir estrutura; as quatro escolhas do dono (canvas primeiro, o canvas "Sistema" antes da Home, escuro em tudo + claro no `Main`, checkpoint por canvas); a ordem, o ciclo, o aceite (200×200 + AA) | vivo | é a porta de entrada da Fase 2 |
| [HANDOFF-IMPLEMENTACAO-IDENTIDADE.md](../HANDOFF-IMPLEMENTACAO-IDENTIDADE.md) | **o handoff de implementação para uma sessão especialista** (15/09/2026): inventário completo de assets (`src/assets/soulmon/`, backgrounds, ícones, catálogo da loja), as divergências código×tese que precisam ser respeitadas, o critério pra classificar cada tela em já-existe/precisa-retrabalho/precisa-criar, e o prompt de partida | vivo | complementa `HANDOFF-IDENTIDADE.md`, não substitui |
| [INVENTARIO-ASSETS.md](../INVENTARIO-ASSETS.md) | **todo asset visual medido** (15/09/2026): repo, `_gemini_out`, kit `E:\Soulmon-assets`, Class-System, marca — veredito dentro/fora do visor por família, ~150 instalados sem uso, 5 levas não instaladas, decisões do dono D1–D9 | vivo | re-varrer com `/squad-arte inventario` após cada instalação |
| [ASSETS-A-GERAR.md](../ASSETS-A-GERAR.md) | **a fila de arte**: por família, o que falta, uso, tela, formato, destino, mapa e o prompt pronto; blocos de estilo [CENA]/[PET-BOX]/[SPRITE] | vivo | executada pela SQUAD-ARTE (`.claude/skills/squad-arte/`, 8 agentes `arte-*`) |
| [INVENTARIO-TELAS.md](../INVENTARIO-TELAS.md) | mapa da superfície visual medido em 19/08/2026 pelo cartógrafo de telas | registro | parcial — [03-FLUXO-DE-TELAS.md](03-FLUXO-DE-TELAS.md) é o vigente e cita esta medição |
| [ORACULO.md](../ORACULO.md) | as duas metades do oráculo (leitura e criação), ponta a ponta | vivo | parcial — [02 §22](02-REGRAS-DE-NEGOCIO.md#oraculo) resume; o detalhe continua aqui |
| [PALCO-E-DECORACAO.md](../PALCO-E-DECORACAO.md) | contrato com quem desenha: espaços do palco em px, `setting`, `fits` | vivo | parcial — [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) §7 |
| [PENDENCIAS-ARTE-UI-HIGGSFIELD.md](../PENDENCIAS-ARTE-UI-HIGGSFIELD.md) | pendências da rodada de arte/UI de 09/08/2026 | registro | não |
| [PLANO-COOP.md](../PLANO-COOP.md) | modo cooperativo leve — **implementado em 07/09/2026**, com as diferenças anotadas | plano (executado) | parcial — [02 §56](02-REGRAS-DE-NEGOCIO.md#comunidade) |
| [PLANO-DESIGN.md](../PLANO-DESIGN.md) | a virada visual "O Visor"; documento que DECIDE | plano | sim, o que está no ar virou [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) §11 (no ar × plano) |
| [PLANO-DESKTOP-STEAM.md](../PLANO-DESKTOP-STEAM.md) | estado real e o que falta do overlay + Steam (2ª redação, depois de a 1ª ser medida como falsa) | plano | parcial — [06-REFERENCIA/desktop.md](06-REFERENCIA/desktop.md), [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) §2.9 |
| [PLANO-EVOLUCAO.md](../PLANO-EVOLUCAO.md) | benchmark de agosto/2026 e o plano em fases; **guarda a essência declarada** | plano | a essência está citada em [01-VISAO.md §2](01-VISAO.md#a-essencia-declarada) |
| [PLANO-MELHORIAS.md](../PLANO-MELHORIAS.md) | plano de execução ancorado no código, com WPs numerados | plano | parcial — o estado durável é [plano-melhorias/LEDGER.md](../plano-melhorias/LEDGER.md) |
| [PLANO-PRODUTO.md](../PLANO-PRODUTO.md) | core, objetivos, negócio e progressão, consolidado em 19/08/2026 | plano | sim, nas partes que decidem: [01-VISAO.md](01-VISAO.md) §1, §5, §8, §10 |
| [PLANO-TAREFAS.md](../PLANO-TAREFAS.md) | o motor de tarefas (hábito × tarefa), revisão 2 de 19/08/2026 | plano (executado) | sim — [02 §23–§36](02-REGRAS-DE-NEGOCIO.md#meta-ponderada) |
| [PLANO-TELA-IDENTIDADE.md](../PLANO-TELA-IDENTIDADE.md) | tela de identidade antes da escolha grátis/completo — implementada em 07/09/2026 | plano (executado) | parcial — [03-FLUXO-DE-TELAS.md](03-FLUXO-DE-TELAS.md) §2.3 |
| [PLAY-DATA-SAFETY.md](../PLAY-DATA-SAFETY.md) | respostas do formulário de Segurança de Dados do Google Play | vivo | parcial — [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) §5 |
| [PROMPT-ARTE-ARCANO-TECH.md](../PROMPT-ARTE-ARCANO-TECH.md) | prompt canônico de arte (decisão do dono, 08/09/2026) | vivo | parcial — [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) §8 |
| [REGISTRO-DE-DECISOES.md](../REGISTRO-DE-DECISOES.md) | **cada decisão de produto com evidência, alternativa que perdeu e gatilho de revisão** — a fonte primária dos porquês | vivo | não — [10-DISCUSSOES-E-DECISOES.md](10-DISCUSSOES-E-DECISOES.md) INDEXA este arquivo, não o copia |
| [RENASCIMENTO.md](../RENASCIMENTO.md) | o rebirth e as quatro decisões de forma do dono (D-R1..D-R4) | vivo | parcial — [02 §20](02-REGRAS-DE-NEGOCIO.md#rebirth) |
| [SEPARACAO-DIGIAPP.md](../SEPARACAO-DIGIAPP.md) | inventário do que ainda é compartilhado com o fork e a ordem segura de separar | vivo | parcial — [09-HISTORICO.md](09-HISTORICO.md) §1.4, [10 §15](10-DISCUSSOES-E-DECISOES.md) |
| [SHOP-PLAN.md](../SHOP-PLAN.md) | a loja de Bits, já implementada | plano (executado) | sim — [02 §47](02-REGRAS-DE-NEGOCIO.md#loja) |
| [SOM.md](../SOM.md) | guia do eixo sonoro: onde cada regra mora, quem é dono, que gate roda | vivo | parcial — [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) §9 descreve; quem decide são as decisões S1..S13 do [REGISTRO-DE-DECISOES.md](../REGISTRO-DE-DECISOES.md) |
| [STATUS.md](../STATUS.md) | **registro vivo do projeto**: achados em aberto, o que foi corrigido, o que depende do dono | vivo | não — é o estado; o manual descreve o sistema |

### 6.3 `docs/guia-experiencia/` — a rodada de pesquisa de setembro/2026

Todos são **pesquisa**. O que virou regra está em [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md); o que virou escolha está indexado em [10-DISCUSSOES-E-DECISOES.md](10-DISCUSSOES-E-DECISOES.md).

- [guia-experiencia/00-BRIEFING-SESSAO-NOTEBOOKLM.md](../guia-experiencia/00-BRIEFING-SESSAO-NOTEBOOKLM.md) — briefing autossuficiente para a sessão que opera o NotebookLM.
- [guia-experiencia/00-LINKS-VIDEOS.md](../guia-experiencia/00-LINKS-VIDEOS.md) — biblioteca de vídeos, cada link verificado pelo oEmbed do YouTube.
- [guia-experiencia/00-PROMPTS-NOTEBOOKLM.md](../guia-experiencia/00-PROMPTS-NOTEBOOKLM.md) — fila de perguntas que fecha a lacuna do que só existe em vídeo.
- [guia-experiencia/01-youtube-mobbin-timgabe.md](../guia-experiencia/01-youtube-mobbin-timgabe.md) — lições dos canais @Mobbingdesign e @TimGabe, com os limites do método declarados.
- [guia-experiencia/02-tamagotchi-effect-psicologia.md](../guia-experiencia/02-tamagotchi-effect-psicologia.md) — psicologia do vínculo com criaturas virtuais; origem de várias linhas vermelhas.
- [guia-experiencia/03-gamificacao-streaks.md](../guia-experiencia/03-gamificacao-streaks.md) — gamificação e streaks sem culpa; base do "streak que zera não entra".
- [guia-experiencia/04-monster-taming.md](../guia-experiencia/04-monster-taming.md) — benchmark do gênero monster taming.
- [guia-experiencia/05-onboarding.md](../guia-experiencia/05-onboarding.md) — leitura do ritual do Oráculo contra o benchmark.
- [guia-experiencia/06-paywall-monetizacao.md](../guia-experiencia/06-paywall-monetizacao.md) — paywall e monetização.
- [guia-experiencia/07-retencao-engajamento.md](../guia-experiencia/07-retencao-engajamento.md) — retenção; é o relatório que estabelece "não há telemetria, logo tudo aqui é hipótese".
- [guia-experiencia/08-transcricoes-notebooklm.md](../guia-experiencia/08-transcricoes-notebooklm.md) — as 16 transcrições lidas via NotebookLM.
- [guia-experiencia/09-mobbin-dossie.md](../guia-experiencia/09-mobbin-dossie.md) — dossiê Mobbin de 02/09/2026, a fonte de UI mais citada pelos guardas.

### 6.4 `docs/plano-melhorias/` — os guardas, o ledger e os estudos

Anexos factuais (**registro**, cada um é a foto do código no dia): [plano-melhorias/A-onboarding.md](../plano-melhorias/A-onboarding.md) · [plano-melhorias/B-habitos.md](../plano-melhorias/B-habitos.md) · [plano-melhorias/C-presenca.md](../plano-melhorias/C-presenca.md) · [plano-melhorias/D-monetizacao.md](../plano-melhorias/D-monetizacao.md) · [plano-melhorias/E-telemetria.md](../plano-melhorias/E-telemetria.md) · [plano-melhorias/F-conteudo.md](../plano-melhorias/F-conteudo.md). ⚠️ Estes seis citam código por número de linha; onde discordarem do código, o código manda — a versão sem endereço está em [06-REFERENCIA/](06-REFERENCIA/utils.md).

- [plano-melhorias/BRIEF-MOBBIN.md](../plano-melhorias/BRIEF-MOBBIN.md) — **plano**: briefing da sessão com Mobbin Pro.
- [plano-melhorias/LEDGER.md](../plano-melhorias/LEDGER.md) — **vivo**: o estado durável do [PLANO-MELHORIAS.md](../PLANO-MELHORIAS.md); é aqui que se lê o que foi de fato entregue.
- Ledgers por guarda (**vivo**, um dono cada): [plano-melhorias/ledger/constancia.md](../plano-melhorias/ledger/constancia.md) · [plano-melhorias/ledger/medicao.md](../plano-melhorias/ledger/medicao.md) · [plano-melhorias/ledger/nascimento.md](../plano-melhorias/ledger/nascimento.md) · [plano-melhorias/ledger/permanencia.md](../plano-melhorias/ledger/permanencia.md) · [plano-melhorias/ledger/sustento.md](../plano-melhorias/ledger/sustento.md) · [plano-melhorias/ledger/vinculo.md](../plano-melhorias/ledger/vinculo.md) · [plano-melhorias/ledger/vetos.md](../plano-melhorias/ledger/vetos.md) (o guarda da linha vermelha, sem WP próprio de propósito).
- Estudos pré-Mobbin (**pesquisa**, 03/09/2026): [plano-melhorias/estudo/constancia.md](../plano-melhorias/estudo/constancia.md) · [plano-melhorias/estudo/medicao.md](../plano-melhorias/estudo/medicao.md) · [plano-melhorias/estudo/nascimento.md](../plano-melhorias/estudo/nascimento.md) · [plano-melhorias/estudo/permanencia.md](../plano-melhorias/estudo/permanencia.md) · [plano-melhorias/estudo/sustento.md](../plano-melhorias/estudo/sustento.md) · [plano-melhorias/estudo/vinculo.md](../plano-melhorias/estudo/vinculo.md).
- Leituras do dossiê Mobbin (**pesquisa**, 02/09/2026): [plano-melhorias/mobbin/constancia.md](../plano-melhorias/mobbin/constancia.md) · [plano-melhorias/mobbin/nascimento.md](../plano-melhorias/mobbin/nascimento.md) · [plano-melhorias/mobbin/permanencia.md](../plano-melhorias/mobbin/permanencia.md) · [plano-melhorias/mobbin/sustento.md](../plano-melhorias/mobbin/sustento.md) · [plano-melhorias/mobbin/vinculo.md](../plano-melhorias/mobbin/vinculo.md) · [plano-melhorias/mobbin/linha-vermelha.md](../plano-melhorias/mobbin/linha-vermelha.md).

### 6.5 `docs/reviews/`, `docs/squad/`, `docs/ui-refs/`

| Arquivo | O que é | Etiqueta | Absorvido? |
|---|---|---|---|
| [reviews/2026-08-03/00-CONSOLIDADO.md](../reviews/2026-08-03/00-CONSOLIDADO.md) | relatório consolidado da revisão de 03/08/2026 ("o que falta para o Soulmon ser um produto de sucesso") | registro | parcial — [01-VISAO.md](01-VISAO.md) §10 e [10 §4](10-DISCUSSOES-E-DECISOES.md) |
| [reviews/2026-08-03/soulmon-growth-aso.md](../reviews/2026-08-03/soulmon-growth-aso.md) | growth, ASO, posicionamento e canais | registro | parcial — a tese de distribuição está em [01-VISAO.md §10](01-VISAO.md#o-estado-do-projeto) |
| [reviews/2026-08-03/soulmon-monetization-strategist.md](../reviews/2026-08-03/soulmon-monetization-strategist.md) | modelo de receita, preço e custo marginal | registro | parcial — [01-VISAO.md §8](01-VISAO.md#o-modelo-de-monetizacao) |
| [reviews/2026-08-03/soulmon-user-researcher.md](../reviews/2026-08-03/soulmon-user-researcher.md) | ICP, personas e walkthrough pelos olhos do usuário | registro | parcial — [01-VISAO.md §3](01-VISAO.md#para-quem-e) |
| [squad/00-BRIEFING.md](../squad/00-BRIEFING.md) | contexto compartilhado do squad de revisão (02/08/2026) | registro | não — processo, não produto |
| [squad/01-RUBRICA.md](../squad/01-RUBRICA.md) | rubrica e template que tornam 14 análises comparáveis | vivo | não |
| [squad/02-SQUAD.md](../squad/02-SQUAD.md) | mapa dos 14 agentes de revisão | vivo | não |
| [ui-refs/SPEC-UI-PIXEL.md](../ui-refs/SPEC-UI-PIXEL.md) | spec textual da direção pixel-art a partir das referências de 14/08/2026 (as folhas `.png` estão na mesma pasta) | plano | parcial — [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) §1 e §11 |

### 6.7 `docs/design/` — o redesenho em duas fases (desde 13/09/2026)

| Doc | O que é | Etiqueta | Dono |
|---|---|---|---|
| [design/PRINCIPIOS-DE-WIREFRAME.md](../design/PRINCIPIOS-DE-WIREFRAME.md) | a pesquisa (dossiê Mobbin, os seis dossiês por área, estudos, decisões, linhas vermelhas) reduzida ao que cada FAMÍLIA de tela obriga e proíbe, com a seção de origem de cada regra | vivo | `design-curador-padroes` |
| [design/INVENTARIO-WIREFRAMES.md](../design/INVENTARIO-WIREFRAMES.md) | a tabela-mestra: toda tela × estado derivada do [03-FLUXO-DE-TELAS.md](03-FLUXO-DE-TELAS.md), com `id`, fluxo, prioridade P0–P2 e o estado do wireframe (`a desenhar` → `desenhado` → `criticado` → `aprovado`); o link do canvas de cada fluxo entra aqui — os treze fluxos já estão em `aprovado` (`grep -c "\| aprovado \|"` → 268 das 273 linhas tela × estado (a linha `ONB-44`, o reveal demo, entrou pela 13.19 no checkpoint final) e `grep -c "\| fora \|"` → 5, em 15/09/2026 — a Fase 1 completa; tabela dos canvases com **13 fluxos**): a Home (48 linhas `HOME-*`, [canvas publicado](https://claude.ai/code/artifact/935e9dc7-3597-465d-b2ad-54ea65aa0332), §2.1 com três achados para o cartógrafo), Atividades (27 linhas `ATIV-*`, [canvas publicado](https://claude.ai/code/artifact/4c632c62-a413-42f3-b6a4-35244038bde1), §2.2 com o parágrafo do que foi desenhado, criticado e aprovado), Rituais (26 linhas `RIT-*`, [canvas publicado](https://claude.ai/code/artifact/526d821f-9d70-497e-bb70-c932701c3a3a), §2.3 com o parágrafo do que foi desenhado, criticado em duas rodadas e aprovado), Pet — canvas próprio por D1, ids `EVO-22`→`EVO-29` renumerados para `PET-01`→`PET-08` (nova §1.4a; §1.5 Evolução perdeu a sub-aba), 7 linhas `PET-*` em `aprovado` e `PET-02` em `fora` ([canvas publicado](https://claude.ai/code/artifact/80f27593-30d4-4c5d-a322-8f9ef3d0549e), 4º na tabela dos canvases, §2.3a com o parágrafo "Desenhado, criticado e aprovado…"), Evolução — canvas próprio (crítica em duas rodadas, `design-critic` B1–B3/W3 aplicados), 21 linhas `EVO-*` em `aprovado` ([canvas publicado](https://claude.ai/code/artifact/60ad4289-eaba-4485-9d01-5b2015daa0ed), 5º na tabela dos canvases, §2.4 com o parágrafo "Desenhado, criticado e aprovado pelo dono em 14/09/2026…"), Onboarding-funil — por **D3** o Onboarding virou dois canvases (o funil e o Oráculo), 25 linhas `ONB-*` do funil em `aprovado` e `ONB-13` em `fora` por D4 ([canvas publicado](https://claude.ai/code/artifact/443c5305-7e71-4a8f-8e2e-ca343206e8c6), 8º na tabela dos canvases, §2.7 com o parágrafo "Funil desenhado, criticado e aprovado…") e Onboarding-oráculo — o segundo canvas do Onboarding por D3, 18 linhas `ONB-*` (21→33, 35→38, + `ONB-44` o reveal demo pela 13.19) em `aprovado` (12 artboards no canvas) ([canvas publicado](https://claude.ai/code/artifact/6dcb1aed-d52c-4c7c-ada1-c3de69f0de38), 13º e último na tabela dos canvases, §2.7 com o parágrafo "Oráculo desenhado, criticado e aprovado…") e Jogos — canvas próprio (crítica em duas rodadas, `design-critic` B1–B6 aplicados, `soulmon-guarda-linha-vermelha` aprovada com ressalva e veto à faixa do oponente), 25 linhas `JOGO-*` em `aprovado` ([canvas publicado](https://claude.ai/code/artifact/baa66565-81e1-4256-b54e-97da6fcc265a), 6º na tabela dos canvases, §2.5 com o parágrafo "Desenhado, criticado e aprovado pelo dono em 15/09/2026…") e Loja — canvas próprio (crítica em duas rodadas, `design-critic` B1–B4 aplicados, `soulmon-product-designer` #1–#5, `soulmon-guarda-linha-vermelha` aprovada com veto ao Coraçãozinho na vitrine), 12 linhas `LOJA-*` em `aprovado` e `LOJA-12` em `fora` por D5 ([canvas publicado](https://claude.ai/code/artifact/ef3ed287-1ecd-466a-a8de-c5aea415f2f8), 7º na tabela dos canvases, §2.6 com o parágrafo "Desenhado, criticado e aprovado em 15/09/2026…") e Estatísticas — canvas próprio (crítica em duas rodadas, `design-critic` B1–B8 aplicados e re-carimbo, `soulmon-guarda-linha-vermelha` aprovada com ressalva, sem veto), 9 linhas `STAT-*` em `aprovado` e `STAT-10` em `fora` por D4 ([canvas publicado](https://claude.ai/code/artifact/b35cbac1-de65-4b5d-a17a-760f94e4d6df), 9º na tabela dos canvases, §2.8 com o parágrafo "Desenhado, criticado e aprovado em 15/09/2026…") e Social — a Biblioteca virou canvas próprio por **D2**, ids `CONTA-26`→`CONTA-32` renumerados para `SOC-01`→`SOC-07` (nova §1.9a; §1.9 Conta perdeu a Biblioteca; nova §2.9a), 7 linhas `SOC-*` em `aprovado` ([canvas publicado](https://claude.ai/code/artifact/7abe2a04-90db-43f1-9d75-dd8a742f3ff0), 10º na tabela dos canvases, §2.9a com o parágrafo "Desenhado, criticado e aprovado em 15/09/2026…") e Conta — canvas próprio (crítica em duas rodadas, `design-critic` r1 "não passa" — o preço da Nova Leitura e o `ConfirmDialog` com ×, aplicados e re-carimbo PASSA, `soulmon-guarda-linha-vermelha` aprovada com ressalva, sem veto), 25 linhas `CONTA-*` em `aprovado` e `CONTA-13` em `fora` pelo precedente da D5 ([canvas publicado](https://claude.ai/code/artifact/c5fba27a-548f-444c-890f-10f4d482229f), 11º na tabela dos canvases, §2.9 com o parágrafo "Desenhado, criticado e aprovado em 15/09/2026…") e Fora do app — canvas próprio (crítica em duas rodadas, `design-critic` r1 "não passa" — 7 bloqueantes, todos no overlay, aplicados e re-carimbo PASSA na r2; `soulmon-product-designer` 7 achados; `soulmon-guarda-linha-vermelha` aprovada com ressalva e 1 veto ao CÓDIGO), 18 linhas `FORA-*` em `aprovado` (`FORA-01` corrigido — corações/energia são do widget E) ([canvas publicado](https://claude.ai/code/artifact/89cc5550-5b1a-4f2b-8929-759a4a68373b), 12º na tabela dos canvases, §2.10 com o parágrafo "Desenhado, criticado e aprovado em 15/09/2026…") | vivo | `soulmon-screen-cartographer` |
| [design/DECISOES-WIREFRAME.md](../design/DECISOES-WIREFRAME.md) | as 20 decisões prévias do dono (13/09/2026: 11 dúvidas do inventário + 9 tensões da pesquisa, cinco reabertas no `REGISTRO-DE-DECISOES.md` §13) e, a cada `decidir`, o entra/volta/sai por fluxo — a **§5 é a Home** (E1–E9 entra · V1–V7 volta · S1–S7 sai; decisão do design-lead em 13/09/2026, checkpoint do dono **aprovado** em 14/09/2026, com 13.6 e 13.7 no `REGISTRO-DE-DECISOES.md`), a **§6 é Atividades** (A1–A8 entra · V1–V5 volta · S1–S7 sai; decisão do design-lead e checkpoint do dono **aprovado** em 14/09/2026, com 13.8 e 13.9 no `REGISTRO-DE-DECISOES.md`), a **§7 é Rituais** (R1–R8 entra · V1–V6 volta · S1–S8 sai; decisão do design-lead e checkpoint do dono **aprovado** em 14/09/2026, com 13.10 e 13.11 no `REGISTRO-DE-DECISOES.md`; §7.4 fechada), a **§8 é Pet** (P1–P4 entra · V1–V5 volta · S1–S5 sai; decisão do design-lead e checkpoint do dono **aprovado** em 14/09/2026), a **§9 é Onboarding-funil** (O1–O7 entra · V1–V4 volta · S1–S5 sai; decisão do design-lead e checkpoint do dono **aprovado** em 14/09/2026 — V1 pedia reordenar o funil, o dono MANTEVE a ordem de hoje; sem decisão de regra nova), a **§10 é Evolução** (X1–X5 entra · V1–V5 volta · S1–S5 sai; decisão do design-lead e checkpoint do dono **aprovado** em 14/09/2026) a **§11 é Jogos** (J1–J5 entra · V1–V4 volta · S1–S4 sai; decisão do design-lead e checkpoint do dono **aprovado** em 15/09/2026 — V1 pedia zerar o "N pts" do resultado do Torneio, o dono MANTEVE, registrado em 13.13 no `REGISTRO-DE-DECISOES.md`) a **§12 é Loja** (L1–L4 entra · V1–V4 volta · S1–S5 sai; decisão do design-lead, checkpoint fechado em 15/09/2026 por **aprovação automática** — meta do dono; a decisão de regra, o Coraçãozinho fora da vitrine, já era do dono desde o início da meta, registrada em 13.14 no `REGISTRO-DE-DECISOES.md`) a **§13 é Estatísticas** (E1–E5 entra · V1–V5 volta · S1–S4 sai; decisão do design-lead, checkpoint fechado em 15/09/2026 por **aprovação automática** — meta do dono; sem decisão de regra nova no `REGISTRO-DE-DECISOES.md`; o "0" grande do primeiro uso ficou pendente do dono) e a **§14 é Social** (C1–C5 entra · V1–V6 volta · S1–S4 sai; decisão do design-lead, checkpoint fechado em 15/09/2026 por **aprovação automática** — meta do dono; sem decisão de regra nova no `REGISTRO-DE-DECISOES.md`; T10 "N days playing" e T11 lista × cena pendentes do dono) e a **§15 é Conta** (K1–K5 entra · V1–V7 volta · S1–S4 sai; decisão do design-lead, checkpoint fechado em 15/09/2026 por **aprovação automática** — meta do dono; sem decisão de regra nova no `REGISTRO-DE-DECISOES.md`; reordenar a página por prioridade (V1) e `CONTA-13` fora pendentes do dono) e a **§16 é Fora do app** (F1–F5 entra · V1–V8 volta · S1–S5 sai; decisão do design-lead, checkpoint fechado em 15/09/2026 por **aprovação automática** — meta do dono; sem decisão de regra nova no `REGISTRO-DE-DECISOES.md`; cinco pendentes do dono: o "—" × remover a linha, o badge de pendentes do overlay, o piso da energia, o idioma pela bridge, o widget E em HP crítico) e a **§17 é Onboarding-oráculo** (R1–R5 entra · V1–V8 volta · S1–S4 sai; decisão do design-lead, checkpoint fechado em 15/09/2026 por **aprovação automática** — meta do dono; sem decisão de regra nova; dois pendentes do dono: T1/13.1 sem piso no funil (reveal demo?) e o voltar na 1ª pergunta) — **os pendentes das §13–§17 foram fechados pelo dono no modal final de 15/09/2026 — 13.15 a 13.19 no `REGISTRO`** | decisões | `soulmon-design-lead` |
| `design/wireframes/<fluxo>/` | os arquivos de trabalho de cada canvas (`Main.dc.html`, um `.dc.html` por tela × estado, `canvas.json`) — commitados; o `.html` publicado não. **Existem treze fluxos** (contagem por `ls docs/design/wireframes/<fluxo>/ \| grep -c '\.dc\.html$'`, em 15/09/2026): `design/wireframes/home/` — 28 artboards (`Main.dc.html` + 27 telas × estado), estado `aprovado` em 14/09/2026, [canvas publicado](https://claude.ai/code/artifact/935e9dc7-3597-465d-b2ad-54ea65aa0332); `design/wireframes/atividades/` — 17 artboards (`Main.dc.html` + 16 telas × estado), estado `aprovado` em 14/09/2026, [canvas publicado](https://claude.ai/code/artifact/4c632c62-a413-42f3-b6a4-35244038bde1); `design/wireframes/rituais/` — 21 artboards (`Main.dc.html` + 20 telas × estado, em 4 páginas, rodada 2 pós-crítica), estado `aprovado` em 14/09/2026, [canvas publicado](https://claude.ai/code/artifact/526d821f-9d70-497e-bb70-c932701c3a3a); `design/wireframes/pet/` — 9 artboards (`Main.dc.html` + 8 telas × estado, ids `PET-01`→`PET-08`), estado `aprovado` em 14/09/2026, [canvas publicado](https://claude.ai/code/artifact/80f27593-30d4-4c5d-a322-8f9ef3d0549e); `design/wireframes/evolucao/` — 15 artboards (`Main.dc.html` + 14 telas × estado, em 3 páginas, rodada 2 pós-crítica), estado `aprovado` em 14/09/2026, [canvas publicado](https://claude.ai/code/artifact/60ad4289-eaba-4485-9d01-5b2015daa0ed); `design/wireframes/onboarding-funil/` — 17 artboards (`Main.dc.html` + 16 telas × estado, em 4 páginas, rodada 2 pós-crítica), estado `aprovado` em 14/09/2026, [canvas publicado](https://claude.ai/code/artifact/443c5305-7e71-4a8f-8e2e-ca343206e8c6); `design/wireframes/jogos/` — 16 artboards (`Main.dc.html` + 15 telas × estado, em 4 páginas, rodada 2 pós-crítica), estado `aprovado` em 15/09/2026, [canvas publicado](https://claude.ai/code/artifact/baa66565-81e1-4256-b54e-97da6fcc265a); `design/wireframes/loja/` — 7 artboards (`Main.dc.html` + 6 telas × estado, em 2 páginas, rodada 2 pós-crítica), estado `aprovado` em 15/09/2026, [canvas publicado](https://claude.ai/code/artifact/ef3ed287-1ecd-466a-a8de-c5aea415f2f8); `design/wireframes/estatisticas/` — 7 artboards (`Main.dc.html` + 6 telas × estado, em 2 páginas, rodada 2 pós-crítica), estado `aprovado` em 15/09/2026, [canvas publicado](https://claude.ai/code/artifact/b35cbac1-de65-4b5d-a17a-760f94e4d6df); `design/wireframes/social/` — 8 artboards (`Main.dc.html` + 7 telas × estado, em 2 páginas, rodada 2 pós-crítica, ids `SOC-01`→`SOC-07`), estado `aprovado` em 15/09/2026, [canvas publicado](https://claude.ai/code/artifact/7abe2a04-90db-43f1-9d75-dd8a742f3ff0); `design/wireframes/conta/` — 14 artboards (`Main.dc.html` + 13 telas × estado, em 2 páginas, rodada 2 pós-crítica), estado `aprovado` em 15/09/2026, [canvas publicado](https://claude.ai/code/artifact/c5fba27a-548f-444c-890f-10f4d482229f); `design/wireframes/fora-do-app/` — 7 artboards (`Main.dc.html` + 6 telas × estado, em 3 páginas, rodada 2 pós-crítica), estado `aprovado` em 15/09/2026, [canvas publicado](https://claude.ai/code/artifact/89cc5550-5b1a-4f2b-8929-759a4a68373b); e `design/wireframes/onboarding-oraculo/` — 12 artboards (`Main.dc.html` + 11 telas × estado, em 2 páginas, rodada 3 — checkpoint final do dono, + `ONB-44` o reveal demo pela 13.19), estado `aprovado` em 15/09/2026, [canvas publicado](https://claude.ai/code/artifact/6dcb1aed-d52c-4c7c-ada1-c3de69f0de38) | canvas | `design-wireframer` |
| `design/wireframes/sistema/identidade/` | o **primeiro canvas da Fase 2 (identidade)**: o SISTEMA aplicado, não uma tela — 8 artboards (`Main.dc.html` escuro + `MainClaro.dc.html`, `Botoes`, `Cards`, `Dados`, `FolhaNav`, `Visor`, `Estados`; ids SIS-01→SIS-07), `design/wireframes/sistema/identidade/README.md` (o que cada artboard prova, rodada 2, achados para o `staff-frontend`, `[pendente do dono]` P1–P3) e `design/wireframes/sistema/identidade/CRITICA.md` (revisão bloqueante do `design-critic`, rodada 1: VOLTA; rodada 2 fechou). Checkpoint do dono em 16/09/2026: ENTRA (`design/DECISOES-WIREFRAME.md` §18). Implementado no código no mesmo dia: `src/components/pixel/PixelKit.tsx` em vetor, tokens `--sm2-space-*`, `Viewport frame`, `VisorBar scale` | canvas | `soulmon-visual-designer` |
| `design/wireframes/home/identidade/` | o **segundo canvas da Fase 2**: a HOME com a identidade — 29 artboards (os 28 nomes do wireframe + `MainClaro`), `design/wireframes/home/identidade/README.md` (o que cada artboard prova, decisões D-H1→D-H9, rodada 2, achados para o `staff-frontend`, `[pendente do dono]` P4–P7) e `design/wireframes/home/identidade/CRITICA.md` (revisão bloqueante do `design-critic`: rodada 1 VOLTA — F1 assombrada por opacidade, F2 dobra; rodada 2 fechou). Checkpoint do dono em 16/09/2026: ENTRA (`design/DECISOES-WIREFRAME.md` §19: P4 textura a 10%, P5 `--sm2-haunted`, P6 `toys`/`groups`, P7 cubo). Implementado no código no mesmo dia: `CompanionHUD` (só anel + vidro, placa `.sm2-visor-plate`, EVOLVE em Silkscreen na moldura pixel, deck de 5 com Brincar), `HomeHud` só marca + selo, `VisorBar` ao `max`, lista com `--sm2-haunted`, folhas em `.sm2-gcell`, nav Rubik, `ScreenSkeleton`, `ErrorBoundary` | canvas | `soulmon-visual-designer` |
| `design/wireframes/atividades/identidade/` | o **terceiro canvas da Fase 2**: ATIVIDADES com a identidade — 17 artboards + `MainClaro`, `design/wireframes/atividades/identidade/README.md` (o que cada artboard prova, decisões D-A1→D-A9, rodada 2, achados 1–17 para o `staff-frontend`) e `design/wireframes/atividades/identidade/CRITICA.md` (rodada 1 VOLTA — F1 opacidade herdada; rodada 2 fechou, gerador reprova `opacity < 1`). Checkpoint do dono em 16/09/2026: ENTRA (`design/DECISOES-WIREFRAME.md` §20). Implementação no código a partir de 20/09/2026: `components/DailyRituals.tsx` (lista extraída do `App.tsx`), `RitualRow` com selo de tipo, `HabitConstancy` em formas ● ◆ ○ —, `TaskMeta` em chips 24, aviso de carga `role=status` | canvas | `soulmon-visual-designer` |
| `design/wireframes/rituais/identidade/` | o **quarto canvas da Fase 2**: RITUAIS com a identidade — 21 artboards + `MainClaro`, `design/wireframes/rituais/identidade/README.md` (o que cada artboard prova, decisões D-R1→D-R12, rodada 2, achados 1–19 para o `staff-frontend`) e `design/wireframes/rituais/identidade/CRITICA.md` (0 fatais; X1–X5 aplicados — escala inteira na cerimônia, confete fora do título, copy sem emoji, emblemas `habit-7/21/66`, `role=dialog`). Checkpoint do dono em 20/09/2026: ENTRA (`design/DECISOES-WIREFRAME.md` §21). Implementação no código a partir de 20/09/2026: `components/ritual/RitualKit.tsx` (`.dlg` centrado sobre o scrim literal, vidro sem anel, linha rótulo/valor), `MorningCheckIn`, `ProtectProgressModal`, `FirstTaskCompletedPopup` (classe de cerimônia, z-300), `DailyReportModal`, `WeeklyReportCard`, `MorningDream`, `MilestoneCeremony`, `WelcomePromptModal` | canvas | `soulmon-visual-designer` |
| `design/wireframes/onboarding-funil/identidade/` | o **sexto canvas da Fase 2**: ONBOARDING-FUNIL com a identidade — 17 artboards + `MainClaro`, `design/wireframes/onboarding-funil/identidade/README.md` (o que cada artboard prova, decisões D-O1→D-O16, rodada 2, achados 1–13 para o `staff-frontend`, pendente 13.19 para o lead) e `design/wireframes/onboarding-funil/identidade/CRITICA.md` (0 fatais; X1–X6 aplicados — "Suggest tasks with AI" vivo, "Enter a valid email." em `role=alert` âmbar, chama num slot `viewport-bg`, intro no `.screen.splash` full-bleed, `aria-busy`, "·" fora). Checkpoint do dono em 20/09/2026: ENTRA (`design/DECISOES-WIREFRAME.md` §23). Implementação no código a partir de 20/09/2026: `index.html #splash` lendo o escopo `.sm2-visor` do `index.css` (D-O16, paleta do visor num lugar só), `brand/flame.ts` + `brand/BrandFlame.tsx` (a chama do kit, paridade travada), `IntroScreen` no mesmo `.sm2-splash`, `SoulmonOnboarding` (portão, perguntas, escolha, personagens, cadastro demo), `GameTutorialFlow` em vetor | canvas | `soulmon-visual-designer` |
| `design/wireframes/pet/identidade/` | o **quinto canvas da Fase 2**: PET (a ficha viva) com a identidade — `design/wireframes/pet/identidade/README.md` (decisões D-P1→D-P12: sub-aba ativa em `primary-soft`, heroína 128 no vidro 192², aura a 2× com corte declarado, silhueta por `mask-image`, forma anterior a 64) e `design/wireframes/pet/identidade/CRITICA.md` (X1–X7 aplicados). Checkpoint do dono em 20/09/2026: ENTRA (`design/DECISOES-WIREFRAME.md` §22) | canvas | `soulmon-visual-designer` |
| `design/wireframes/evolucao/identidade/` | o **sétimo canvas da Fase 2**: EVOLUÇÃO com a identidade — 15 artboards + `MainClaro`, `design/wireframes/evolucao/identidade/README.md` (o que cada artboard prova, decisões D-E1→D-E12, rodada 2, achados 1–17 para o `staff-frontend`; H1 = nó em SVG por token, decisão do dono) e `design/wireframes/evolucao/identidade/CRITICA.md` (0 fatais; X1–X9 aplicados — burst 3× só na cerimônia, faísca quadro 4 no canto, vidro do nó 80, anel ALCANÇADO `primary-deep`, BLOQUEADO `muted`, demo sem aura, plural real, degeneração `outline`). Checkpoint do dono em 20/09/2026: ENTRA (`design/DECISOES-WIREFRAME.md` §24). Implementação no código em 20/09/2026: `components/evolution/nodeArt.tsx` (anel SVG por token) + `SoulNode.tsx` (vidro circular 80, sprite 64, silhueta por `mask-image`), `EvolutionPath` (visor 192² `role=button`, `.meter` vetor, cadeado tonal + placa "ON HOLD", cards por nó, offline `role=status`), `EvolutionCeremony` (visor de tela cheia, burst 3×, faixa de aparelho, `role=dialog`), `EvolveTaskModal` (`RitualDialog`, plural real), `RebirthModal` (inerte por superfície, alerta âmbar), `UnlockNudge` âmbar na Evolução; `EvoTrail.tsx` apagado (S1 da Home) | canvas | `soulmon-visual-designer` |
| `design/wireframes/jogos/identidade/` | o **oitavo canvas da Fase 2**: JOGOS com a identidade — 16 artboards + `MainClaro`, `design/wireframes/jogos/identidade/README.md` (decisões D-J1→D-J16; D-J13 mini-visor 32 do ranking condicionado aos ícones da `squad-arte`; D-J5 barra do inimigo em `gold-fill`) e `design/wireframes/jogos/identidade/CRITICA.md` (0 fatais; X1–X7 aplicados). Checkpoint do dono em 20/09/2026: ENTRA (`design/DECISOES-WIREFRAME.md` §25) | canvas | `soulmon-visual-designer` |

### 6.6 `docs/historico-digiapp/` — o que NÃO se lê

Onze documentos da era DigiApp, aposentados em 07/09/2026 porque afirmavam como fato estágios (`DigiEgg`, `Baby I`), tabela de HP de 1 a 14, evolução automática e um roster com nomes de personagem registrado. **A pasta é isenta deste índice de propósito** e tem guard próprio (`src/docsSemMentira.contract.test.ts`). O que cada um ensinava de errado está listado no `LEIA-ANTES.md` de lá. Não use nenhum deles como fonte.

---

<a id="estado-do-manual"></a>
## 7. Estado do manual

Lido dos cabeçalhos em 10/09/2026 com `grep -o '\*\*Dono:\*\* [a-z-]*\|\*\*Data:\*\* [0-9/]*\|\*\*Estado:\*\* [^·]*' docs/manual/*.md docs/manual/06-REFERENCIA/*.md`. **Carimbo `rascunho` = não foi verificado pelo `doc-verificador`**; a promoção para `verificado em dd/mm/aaaa por doc-verificador` está descrita em [12-COMO-MANTER.md](12-COMO-MANTER.md) §6.

| Doc | Dono | Carimbo | Data |
|---|---|---|---|
| [00-MAPA.md (este)](00-MAPA.md) | doc-bibliotecario | verificado em 10/09/2026 | 10/09/2026 |
| [01-VISAO.md](01-VISAO.md) | doc-redator-regras | verificado em 10/09/2026 | 09/09/2026 |
| [02-REGRAS-DE-NEGOCIO.md](02-REGRAS-DE-NEGOCIO.md) | doc-redator-regras | verificado em 10/09/2026 | 10/09/2026 |
| [03-FLUXO-DE-TELAS.md](03-FLUXO-DE-TELAS.md) | doc-redator-telas | verificado em 10/09/2026 | 09/09/2026 |
| [04-IDENTIDADE-VISUAL.md](04-IDENTIDADE-VISUAL.md) | doc-redator-identidade | verificado em 10/09/2026 | 09/09/2026 |
| [05-ARQUITETURA.md](05-ARQUITETURA.md) | doc-redator-arquitetura | verificado em 10/09/2026 | 09/09/2026 |
| [07-DADOS-E-SAVE.md](07-DADOS-E-SAVE.md) | doc-redator-arquitetura | verificado em 10/09/2026 | 09/09/2026 |
| [08-INTEGRACOES-E-DEPLOY.md](08-INTEGRACOES-E-DEPLOY.md) | doc-redator-arquitetura | verificado em 10/09/2026 | 09/09/2026 |
| [09-HISTORICO.md](09-HISTORICO.md) | doc-historiador | verificado em 10/09/2026 | 09/09/2026 |
| [10-DISCUSSOES-E-DECISOES.md](10-DISCUSSOES-E-DECISOES.md) | doc-historiador | verificado em 10/09/2026 | 09/09/2026 |
| [11-GLOSSARIO.md](11-GLOSSARIO.md) | doc-bibliotecario | verificado em 10/09/2026 | 09/09/2026 |
| [12-COMO-MANTER.md](12-COMO-MANTER.md) | doc-bibliotecario | verificado em 10/09/2026 | 09/09/2026 |
| [06-REFERENCIA/api-workers.md](06-REFERENCIA/api-workers.md) | doc-redator-referencia | verificado em 10/09/2026 | 09/09/2026 |
| [06-REFERENCIA/components.md](06-REFERENCIA/components.md) | doc-redator-referencia | verificado em 10/09/2026 | 09/09/2026 |
| [06-REFERENCIA/desktop.md](06-REFERENCIA/desktop.md) | doc-redator-referencia | verificado em 10/09/2026 | 09/09/2026 |
| [06-REFERENCIA/hooks-contexts-types.md](06-REFERENCIA/hooks-contexts-types.md) | doc-redator-referencia | verificado em 10/09/2026 | 09/09/2026 |
| [06-REFERENCIA/plugins-constants.md](06-REFERENCIA/plugins-constants.md) | doc-redator-referencia | verificado em 10/09/2026 | 09/09/2026 |
| [06-REFERENCIA/utils.md](06-REFERENCIA/utils.md) | doc-redator-referencia | verificado em 10/09/2026 | 09/09/2026 |

---

<a id="como-manter"></a>
## 8. Como manter

O método completo — as dez regras R1–R10, o cabeçalho obrigatório, o ciclo, como carimbar e o que fazer quando cada item do guard fica vermelho — está em **[12-COMO-MANTER.md](12-COMO-MANTER.md)**. A fonte canônica das regras é [`.claude/skills/squad-docs/METODO.md`](../../.claude/skills/squad-docs/METODO.md).

### 8.1 Quem mantém, e quando roda sozinho (desde 10/09/2026)

| Momento | O que roda | Quem |
|---|---|---|
| **Início de toda sessão** | `.claude/hooks/session-start.sh` (registrado em `.claude/settings.json`) instala dependências se faltarem e imprime o briefing: git, `node scripts/docs-delta.mjs --resumo`, o guard (as linhas `Test Files` + `Tests` do vitest — as duas desde 14/09/2026, porque só `Tests` deixava verde uma suíte que falha ao parsear), o topo do `STATUS.md` — e a ordem de invocar **`/soulmon start`** | `soulmon-coordenador` — lê este mapa inteiro, roteia o pedido pela tabela de [`soulmon-coordenador/SKILL.md`](../../.claude/skills/soulmon-coordenador/SKILL.md), e se o briefing disser `docs: DEFASADO` manda o mantenedor rodar antes de qualquer trabalho |
| **Fechamento de sessão** | `/soulmon fechar`: portões, bloco no STATUS, PR + merge ff-only, e então **`/manter-docs auto`** | `soulmon-coordenador` → `doc-mantenedor` |
| **A cada push na `main`** | [`.github/workflows/docs-sync.yml`](../../.github/workflows/docs-sync.yml): job `delta` (sempre: mede + guard + sumário) e job `mantenedor` (só com delta e `ANTHROPIC_API_KEY`): `/manter-docs auto` numa branch `docs/sync-<sha>`, PR e merge | `doc-mantenedor` |

O que o mantenedor faz: `node scripts/docs-delta.mjs` compara `docs/manual/.sincronizado.json` com o HEAD e devolve, por doc, os arquivos que o afetam (mais módulos novos sem entrada, entradas de módulos apagados e módulos com exports mudados); um redator por doc recebe o diff; o `doc-verificador` confere o que mudou e recarimba; o `doc-bibliotecario` atualiza este mapa se nasceu doc/módulo/skill; o SHA é gravado. **Delta só** — o commit de sincronização toca `docs/manual/`, `docs/STATUS.md` e nada mais. Detalhe em [12-COMO-MANTER.md](12-COMO-MANTER.md) §11.

### 8.2 Os comandos

O guard, que roda antes de todo commit que toca `docs/`:

```bash
npx vitest run src/docsManual.contract.test.ts src/docsSemMentira.contract.test.ts
node scripts/docs-delta.mjs          # o manual está defasado? por doc
```

Para uma rodada completa da squad de documentação (medir → redigir → verificar → indexar → travar), use a skill **`/squad-docs`**. Para a sincronização pós-merge, **`/manter-docs`**. Para uma correção pontual, edite o doc dono à mão, rode o guard e carimbe conforme [12-COMO-MANTER.md](12-COMO-MANTER.md) §6.

**A trava que este arquivo guarda:** um doc novo em `docs/` só nasce se entrar neste mapa. O item (a) do guard fica vermelho enquanto ele não entrar, e a etiqueta certa (`vivo`/`registro`/`pesquisa`/`plano`) é obrigatória — "é antigo demais para indexar" não é uma saída, é como a pasta `historico-digiapp/` nasceu.
