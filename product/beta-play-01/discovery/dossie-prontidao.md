# Dossiê de prontidão — beta fechado Google Play (`beta-play-01`, Fase 0, validar-o-que-existe)

Data do dossiê: 2026-10-11. Repo `D:\Soulmon\repo` (main). Modo: só leitura de docs/arquivos; **nada foi medido ao vivo** (sem wrangler, sem gh, sem Play Console). Todo "FEITO" abaixo é evidência de doc ou arquivo, com data; o que é só doc está marcado `[doc]`.
Limitação: o git log não pôde ser rodado (sem shell). Features em andamento vieram de `docs/STATUS.md` (blocos de 08–11/10/2026) e de `.git/logs/HEAD` (402 linhas de commit/merge, não lidas).

Legenda: FEITO · PENDENTE-SQUAD (dá sem o dono) · PENDENTE-DONO (segredo/conta/aparelho/decisão) · DESCONHECIDO.

## 1. Itens de lançamento

| # | Item | Estado | Evidência / caminho / data | Nota |
|---|---|---|---|---|
| 1 | Conta Play Console + US$ 25 | FEITO [doc] | `docs/DEPENDE-DE-VOCE.md` (informado 08/09/2026) | Conta pessoal nova -> regra 12 testadores x 14 dias |
| 2 | Keystore de upload | PENDENTE-DONO | `docs/PLAY-LANCAMENTO.md` §B.1; nenhum `*.jks`/`*.keystore` no repo (Glob vazio, 11/10) | Dono decidiu Play App Signing. `android/.gitignore` ignora `*.jks`. Nunca digitar senha pela squad |
| 3 | AAB assinado (versionCode 15 / 1.1.4) | PENDENTE-DONO (build local) | `android/app/build.gradle` (15 / "1.1.4", `signingConfigs.release` só se `RELEASE_STORE_FILE`); `docs/HANDOFF-LOCAL-SEM-ACTIONS.md` §2: `gradlew bundleRelease -PRELEASE_*` | Actions parado desde 16/09 (cobrança). Nenhum artefato novo desde então. Sem keystore a squad só pode validar `assembleDebug`/`bundleRelease` sem assinar |
| 3b | Billing Library 8.3.0 compila? | DESCONHECIDO | `build.gradle` linha `billing-ktx:8.3.0`; `PLAY-LANCAMENTO.md` §G: "só o CI prova que compila" | Nunca compilado (CI morto). PENDENTE-SQUAD: rodar `gradlew assembleDebug` local (JDK 21) e ler o log. targetSdk/compileSdk 36 e AGP 8.2.1 igualmente não provados |
| 3c | versionCode / patch Capacitor 8.4.3 | PENDENTE-SQUAD | `LANCAMENTO-CHECKLIST.md` linha "Novo APK"; STATUS 11/10 (auditoria) | O versionCode 15 pode precisar subir se algum AAB já foi enviado (nenhum foi). Capacitor 8.4.0->8.4.3 já em `package.json`? `[verificar]` |
| 4 | Firebase app Android + `google-services.json` | FEITO (arquivo) / DESCONHECIDO (Console) | `android/app/google-services.json` contém `package_name: com.hexervoodoom.soulmon`, projeto `soulmon-app`, app id `1:517597188438:android:7f79...`, `certificate_hash bcaee2d8...` (SHA-1, provavelmente da chave de DEBUG fixa — ver `build.gradle` comentário 07/10) | **Contradiz** `PLAY-LANCAMENTO.md` §C.2, `BILLING-SETUP.md` topo e `DEPENDE-DE-VOCE.md` #10, que dizem "arquivo ainda é do DigiApp". PENDENTE-DONO: SHA-1/SHA-256 da chave de Play App Signing e da de upload no Firebase (login Google no APK vindo da Play usa outro certificado) |
| 5 | Play Console: app criado | DESCONHECIDO | nenhum doc registra criação | PENDENTE-DONO (squad pode dirigir Chrome com submissão confirmada) |
| 6 | Ficha PT/EN (texto) | FEITO (texto pronto, não colado) | `docs/PLAY-FICHA.md` (22/09/2026) | Colagem no Console = PENDENTE-SQUAD via Chrome. Rever contra features novas (ver §3) |
| 6b | Gráficos: ícone 512, feature 1024x500, screenshots | PENDENTE-SQUAD (arte) | `PLAY-LANCAMENTO.md` §D.2/§I: "ainda não existem" (21/09) | Para teste fechado a Play exige ícone/feature/screenshots? `[a confirmar no Console]`. Lacuna conhecida: arte Higgsfield travada (crédito 1,5; `DEPENDE-DE-VOCE` #19) |
| 7 | Classificação IARC / público-alvo 18+ / anúncios / acesso ao app / IA generativa | FEITO (respostas prontas) / PENDENTE-DONO (envio) | `PLAY-FICHA.md` §4–5; `PLAY-LANCAMENTO.md` §D.5 | "Acesso ao app" exige conta de teste do revisor criada pelo dono (segredo) |
| 8 | Data Safety | FEITO (respostas prontas, 22/09) / DESATUALIZADO? | `docs/PLAY-DATA-SAFETY.md` §3 | **Não menciona guilda/guerra/doação/ritmo de refeições/telemetria `meal_ritual`** (grep: 0 ocorrências de "guilda" nele e na FICHA; privacidade.html tem 12). Ver contradição C5 |
| 9 | Política de privacidade publicada | FEITO [doc] | `https://soulmon.mateus-sprnd.workers.dev/privacidade.html` (22/09; EN primeiro desde 30/09); `public/termos.html` §8 | Conferir ao vivo (WebFetch) é PENDENTE-SQUAD trivial |
| 10 | Produtos IAP: 4 SKUs (`soulmon.unlock.full`, `credits.60/150/400`) | PENDENTE-DONO | código OK: `functions/api/_billing.js` `PRODUCTS`; criação no Console não registrada | Exige perfil de pagamentos (D.6, dono). Preços: lacuna aberta (contexto §Lacunas); `FULL_UNLOCK_PRICE_LABEL_USD` US$ 6.99 |
| 10b | SKU de assinatura cosmética trimestral | PENDENTE-SQUAD (implementar) | `docs/ASSINATURA-SPEC.md`: "Não implementado, de propósito"; `PRODUCTS` não tem SKU de assinatura; `src/utils/monetization.ts` 0 menções a subscription | Fora de `PLAY-LANCAMENTO.md`. Exige: `_billing.js` com `purchases.subscriptions` (outro endpoint/escopo da conta de serviço), plugin Kotlin (`BillingClient` subs), `shop.ts` `unlock: {kind:'subscription'}`, termos/ficha/Data Safety, produto de assinatura + base plan no Console (dono) |
| 11 | Conta de serviço API Play (`play-billing-verify`) | PENDENTE-DONO | `PLAY-LANCAMENTO.md` §D.8; nenhum registro de criação | Propagação leva horas; antes disso `/api/billing` 502 |
| 12 | Secrets Cloudflare — raiz | PARCIAL | Medido 22/09 (`PLAY-LANCAMENTO.md` §E cabeçalho): definidos `GROQ_API_KEY`, `HF_API_KEY`, `HF_SECRET`, `METRICS_ADMIN_KEY`, `SEASON_ADMIN_KEY`; var `FIREBASE_PROJECT_ID=soulmon-app` em `wrangler.jsonc` | Ausentes em 22/09 (sem registro posterior): `ENTITLEMENTS_ADMIN_KEY` (cortesia 404), `COURTESY_MAX_ACCOUNTS`, `GEMINI_API_KEY`, `ADMIN_EMAILS`, `SUPABASE_PROJECT_ID`/`SUPABASE_ANON_KEY` (transcrição de voz), e os da Play. Todos PENDENTE-DONO (`wrangler secret put`). Estado de 11/10 = DESCONHECIDO (releitura `wrangler secret list` é leitura, mas exige login do dono) |
| 12b | Secrets da Play: `GOOGLE_PLAY_SERVICE_ACCOUNT`, `ANDROID_PACKAGE_NAME`, `ASSETLINKS_SHA256` | PENDENTE-DONO | `PLAY-LANCAMENTO.md` §E.5 | Sem eles `/api/billing?provider=play` = 503 (nenhuma compra concedida) |
| 13 | Worker de push: deploy + secrets | PARCIAL | Deploy 21/09 12:57Z; `VAPID_JWK` e `SEASON_ADMIN_KEY` definidos (22/09); `FIREBASE_SERVICE_ACCOUNT` AUSENTE (22/09) | Ritmo das refeições (11/10) mudou `workers/push-scheduler.js` + novo cron `*/30`: **redeploy pendente** (STATUS 11/10; `LANCAMENTO-CHECKLIST`). PENDENTE-DONO (precisa `wrangler login`). Commit "gira o par VAPID" no reflog: conferir que o `VAPID_JWK` em produção é o novo |
| 14 | D1 `soulmon-billing` + migrações | FEITO | `wrangler.jsonc` `d1_databases`; aplicado 22/09/2026 (#65): 0001 ok, 0002 marcada, "No migrations to apply" | Só doc de 22/09; reconferir é leitura |
| 15 | `PLAY_REQUIRE_ACCOUNT_BINDING=true` | PENDENTE-DONO (e ordem) | `PLAY-LANCAMENTO.md` §E.6; `_billing.js` `isPlayPurchaseBoundTo` | Só depois de o AAB 15 estar nos testadores. **Atenção ao beta:** se ligado antes de todo testador estar no AAB novo, recusa toda compra. Para teste fechado, ligar após o 1º upload |
| 16 | assetlinks | PENDENTE-DONO | `functions/.well-known/assetlinks.json.js` existe; `ASSETLINKS_SHA256` ausente; fingerprint só nasce após o 1º upload (§D.10) | Sem ele App Links e o portão de e-mail no APK não valem |
| 17 | Push/FCM no APK | PENDENTE-DONO | `google-services.json` ok (item 4) mas `FIREBASE_SERVICE_ACCOUNT` ausente no worker | Web Push funciona; FCM do APK não envia |
| 18 | Licença de teste + testadores | PENDENTE-DONO (lista) | `PLAY-LANCAMENTO.md` §D.9/§D.11; lista de e-mails = lacuna aberta do contexto | Tem que criar trilha de teste FECHADO (não "interno"): `PLAY-LANCAMENTO.md` descreve teste interno + produção, **não descreve teste fechado 12x14** (ver C3) |
| 19 | Teste de compra ponta a ponta | DESCONHECIDO / nunca executado | `BILLING-SETUP.md` §6 roteiro; "ninguém nunca usou em produção" | Depende de itens 3, 10, 11, 12b |
| 20 | GitHub Actions | PENDENTE-DONO | `HANDOFF-LOCAL-SEM-ACTIONS.md` §1: 641 runs 0 success (30/09); billing da conta `HexerVoodoom` | Contornável localmente (`npm run portoes`) |
| 21 | Rate Limiting Cloudflare, host CDN Higgsfield | PENDENTE-DONO | `LANCAMENTO-CHECKLIST.md`; `AUDITORIA-SEGURANCA-LANCAMENTO.md` | Não bloqueia beta com 12-15 amigos; risco de custo/abuso |
| 22 | Plano de contingência (obrigatório, contexto §10) | PENDENTE-SQUAD | não encontrado doc dedicado | Vazio |

## 2. Features em andamento (risco para o beta)

Fonte: `docs/STATUS.md` topo (11/10/2026), branch `claude/guilda-lancamento`, `docs/PERGUNTAS-DO-DONO.md` L1–L11.

| Feature | Estado | Onde incompleto | Risco beta |
|---|---|---|---|
| Guilda de lançamento PR1–PR5 (Torneio x Arena, Casa, Missão/Feira, Guerra 4x4, Sombras do Pesadelo) | Implementada; branch `claude/guilda-lancamento`, fecho 11/10. Não confirmado se já está na `main` | Casa x Bosque seguem 2 progressos separados (decidido, mas dívida); guerra: recompensa só seiva, 1/dia; fila TTL 2 dias | MÉDIO. Social/UGC novo sem Data Safety/FICHA atualizados; servidor com orçamento de KV +1 leitura/ação; precisa de 2+ guildas para a guerra parear (12–15 testadores: guerra raramente resolve, UX "esperando") |
| Pesadelo (sombras de Solmons) | Placeholder: sprite da linha pintado de preto em tempo de desenho | 12 slots de arte `dino-shadow-*` não gerados (`ASSETS-A-GERAR.md` §17) | BAIXO (só visual, colisão/recompensa iguais); `orcamentoDeBytes` já vermelho |
| Masmorra idle | 08/10 descida idle; 11/10 REGISTRO §31: energia por camada, cap 999, Level Up restaura. `LANCAMENTO-CHECKLIST.md` linha "Próxima rodada" diz "não implementado" — **desatualizado**, o STATUS diz implementado | Constantes (4 h, 25%, curva da zona, sumidouro de Bits) pendem do dono; CLAUDE.md velho na linha Masmorra | MÉDIO: balanceamento e economia de Bits sem usuário; campo novo `dungeonDepthRecord`/`dungeonHp` no save (risco de migração e de perda de save) |
| Gauge de evolução substitui "dia completo"; energia x2 | Implementado 11/10 (`evolutionPoints`, migra de `perfectDays`) | Números 30/45/60 e crédito só na virada = decisão aberta L5/L6 | ALTO para a métrica "zero perda de save" (migração na hidratação, fuzz2 122 campos). Muda a regra central; CLAUDE.md velho |
| Soulsmith 15 níveis | Implementado 11/10, migração sem confisco | Ritmo ~100 dias (dono avalia) | BAIXO/MÉDIO (paridade cliente/servidor `_forge.js`) |
| Ritmo das refeições (push 3x/dia) | Implementado; **depende de `wrangler deploy` em `workers/`** | Cron `*/30` não deployado; Kotlin inalterado | MÉDIO: push de refeição só sai após deploy + FCM service account |
| Pedido nativo de notificação na 1ª abertura | Implementado (revoga G6/WP1.5) | Sem APK novo não chega ao aparelho | MÉDIO: política Play de permissões/Data Safety e experiência |
| Level Up display / apresentação de prédio (NPC) | `LevelUpOverlay`: STATUS diz que o TODO de encaixe (`levelUpOpen` hoje `false`) existia; outro bloco do mesmo dia indica que o display entrou | Confirmar se `levelUpOpen` já está ligado | MÉDIO: possível colisão de intersticiais (tour, intro de prédio, level up) |
| Onboarding 3 blocos, tour do corvo (só EN), "+" nova tarefa/hábito | Implementado | PT-BR do tour ausente; "Mysterious Soulmon" provisório; arte `mascot-raven.png` provisória | BAIXO; testadores majoritariamente PT-BR veem tour em EN |
| Oficina do Foco (etapas, loot de expedição) | Implementado 09–10/10 | Anti-cheat não autoritativo (`save.js` aceita estado do cliente); tetos pendentes do dono | BAIXO |
| Música por superfície / loudness | Implementado, sem escuta humana (S8) | Gate de escuta pendente do dono | BAIXO |
| Assinatura cosmética trimestral | NÃO iniciada (ASSINATURA-SPEC: "não implementado") | Tudo | ALTO para o escopo declarado: nova SKU, Kotlin, `_billing.js`, textos legais |
| Missões do primeiro dia / indicador "?" | Corrigido 11/10 | Dono reporta caso a reproduzir; Pets de costas corrigido | BAIXO |
| Testes vermelhos conhecidos na main | `orcamentoDeBytes`, `docsManual (a)`, `iconInventory`/`iconScale`, `CompanionHUD.cta`, `convertToWebp` (STATUS 11/10, ritmo das refeições) | Sem CI para detectar regressão | MÉDIO: sem portão verde não há corte limpo de release |
| Higiene | `node_modules` symlink versionado (removido 11/10); alteração local pendente em `src/assets/soulmon/bosses/boss-arauto-do-fim-full.png` (STATUS 09/10) | | BAIXO |

Corte do beta (contexto §5): esperar guilda, masmorra e pesadelo fecharem. Pelo STATUS os três **já têm fecho datado de 11/10**; o que resta são decisões do dono e arte. Quem define "fechado" é o dono.

## 3. Contradições e docs desatualizados

| # | Doc A | Doc B | Contradição |
|---|---|---|---|
| C1 | `PLAY-LANCAMENTO.md` §C.2: "Substituir `android/app/google-services.json` (hoje é do projeto `digiapp-88296`...)" e `BILLING-SETUP.md` topo "build vai FALHAR até substituir" | `android/app/google-services.json` real: `project_id soulmon-app`, `package_name com.hexervoodoom.soulmon` | Arquivo já foi trocado; os docs seguem dizendo que não. Fonte de verdade = arquivo |
| C2 | `PLAY-LANCAMENTO.md` §D.8–§E.5 e `STATUS.md` §3.2 (22/09): `FIREBASE_SERVICE_ACCOUNT` ausente | Nenhum doc posterior | Estado de secrets é de 22/09 (19 dias); nada prova mudança. Tratar como DESCONHECIDO |
| C3 | Contexto do run / dono: teste FECHADO 12x14 dias | `PLAY-LANCAMENTO.md` §D.9 teste INTERNO -> §D.12 Produção | Roteiro não cobre a trilha de teste fechado nem pré-requisitos dela (lista de testadores/Google Group, 14 dias, formulário de acesso à produção). `[a confirmar no Console]` |
| C4 | `DEPENDE-DE-VOCE.md` (07/09, quase todo lixo histórico): "Soulmon não tem keystore", "item 3 D1 não existe", "#17 não dá para produzir", "Fase 4" | `PLAY-LANCAMENTO.md` (22/09) e `STATUS.md` §3.2 | Doc defasado em 34 dias; D1 está aplicado (22/09). Usar `PLAY-LANCAMENTO.md` + `LANCAMENTO-CHECKLIST.md` |
| C5 | `PLAY-DATA-SAFETY.md` §3 / `PLAY-FICHA.md` (22/09): sem guilda, guerra, doação de Bits, ritmo de refeições, nome de guilda (UGC), telemetria `meal_ritual` | `STATUS.md` 11/10 (PR1–PR5, `meal_ritual` entra na privacidade EN/PT) | Data Safety e ficha anteriores às features; `privacidade.html` já cita guilda (12 ocorrências) -> divergência entre política publicada e formulário |
| C6 | `LANCAMENTO-CHECKLIST.md` (11/10): "Próxima rodada: masmorra usa energia da Home e teto de andares. Não implementado" | `STATUS.md` topo 11/10 (REGISTRO §31): masmorra com energia por camada, teto 999 | Checklist atrasado em horas |
| C7 | `STATUS.md` PR4: D-G4 de `PLAN0-GUILDA.md` revertida | mesmo STATUS (fecho): "`CLAUDE.md` e `PLANO-GUILDA.md` atualizados" | O PR4 diz que plano e CLAUDE.md "seguem dizendo o contrário"; o fecho diz que foram atualizados. Verificar `PLANO-GUILDA.md` (cabeçalho ainda marca "rascunho, 29/09") |
| C8 | `PLAY-LANCAMENTO.md` §G e `build.gradle` comentário: "billing-ktx 8.3.0 obrigatório... compila só no CI" | `build.gradle` ainda tem o bloco de comentário antigo "[a confirmar no Play Console] ... NÃO foi bumpado aqui de propósito" logo acima da linha 8.3.0 | Comentário interno contraditório: diz que não foi bumpado e a linha está em 8.3.0 |
| C9 | `PLAY-LANCAMENTO.md` (21/09) "versionCode 15" + `HANDOFF-LOCAL`: "gerar `.aab` local" | `STATUS.md` 11/10 / `LANCAMENTO-CHECKLIST`: mudanças em Kotlin/notificações e Capacitor 8.4.3 | Sem decisão se o versionCode 15 continua (nenhum AAB subiu, então 15 serve); apenas conferir `versionName` |
| C10 | `CLAUDE.md` (linhas ⚔️ Masmorra, ⚡ Energia, ⭐, ❤️, 🌀, Cadeado) | `STATUS.md` 11/10 | Admitido no próprio STATUS ("CLAUDE.md velho"); D41–D46 "fechadas" no bloco do manual mas Masmorra/gauge ainda apontadas velhas em blocos posteriores |
| C11 | `docs/APK-BUILD-INFO.md` | build real | Doc da era DigiApp (package `com.digiapp.productivity`, minSdk 24, target 34). Marcado `doc-historico`; não usar |
| C12 | `PLAY-LANCAMENTO.md` §D.7 preço US$/BRL | contexto: preço dos SKUs = lacuna aberta | Doc sugere R$ 29,90/4,90/9,90/19,90 e US$ 6.99; dono não confirmou |

`docs/VINCULO-STEAM-PLAY.md` e `docs/CHECKLIST-MESTRE.md`: não são do caminho crítico. O CHECKLIST-MESTRE é de ajustes de UX (reverificado 04/10; lacunas só de arte). VINCULO-STEAM-PLAY só cita Soulmon em 3 pontos (não lido em detalhe).

## 4. Três leituras que mais economizam tempo (ordem)

1. `docs/PLAY-LANCAMENTO.md` (21–22/09): roteiro completo com ordem, portões e o que é segredo. Ler com o desconto C1/C3.
2. `docs/LANCAMENTO-CHECKLIST.md` + `docs/STATUS.md` linhas 1–140 (11/10): estado de features e o que falta do dono.
3. `docs/HANDOFF-LOCAL-SEM-ACTIONS.md`: como validar/buildar sem Actions (`npm run portoes`, `gradlew bundleRelease`).

## 5. Vazios

- Roteiro de TESTE FECHADO (12–15 testadores x 14 dias, Google Group/lista, acompanhamento de opt-in e instalação).
- Plano de contingência (rollback de AAB, falha de compra, perda de save, corte de feature).
- Especificação de implementação da assinatura trimestral (SKU, base plan, plugin, produto de teste).
- Lista de testadores (e-mails) e data-alvo.
- Prova de compilação local do Android (billing 8.3.0, compileSdk 36).
- Data Safety/FICHA revisados contra features de 11/10.
- Estado ao vivo dos secrets do Cloudflare (último medido 22/09).
- Estado do Play Console (nada indica app criado, produtos criados ou ficha enviada).
- Nenhum doc de canal de feedback/crash reporting para o beta (Crashlytics/ANR) — `[não buscado a fundo]`.
