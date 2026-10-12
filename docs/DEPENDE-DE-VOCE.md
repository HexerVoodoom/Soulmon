# Depende de você — Soulmon

> **Reescrito em 11/10/2026 (run `beta-play-01`).** A versão anterior (07/09/2026) tinha
> 20 itens, a maioria já feita ou superada: dizia que o Soulmon "não tem D1", que o
> `google-services.json` era do DigiApp e que o CI geraria o AAB. Nada disso vale mais
> (contradições C1-C12 do dossiê). O histórico completo está no git:
> `git log -p -- docs/DEPENDE-DE-VOCE.md`.
>
> **Só entra aqui o que exige conta, segredo, aparelho ou decisão sua.** O passo a passo,
> na ordem que evita retrabalho, é o **[`BETA-FECHADO-RUNBOOK.md`](BETA-FECHADO-RUNBOOK.md)**;
> quando algo quebra, **[`BETA-CONTINGENCIA.md`](BETA-CONTINGENCIA.md)**; testadores:
> **[`BETA-TESTADORES.md`](BETA-TESTADORES.md)**.

## Contexto em 3 linhas

- Ninguém nunca usou o app em produção. O alvo agora é **teste FECHADO na Google Play**:
  12+ testadores (recomendado 15+) com opt-in por 14 dias seguidos.
- O GitHub Actions está parado por cobrança desde 16/09/2026: **todo build é local**
  (`HANDOFF-LOCAL-SEM-ACTIONS.md`).
- O APK carrega `server.url` (Worker `soulmon`), então quase todo fix é só publicar o Worker.

## 1. Seu caminho crítico (cada linha aponta para o runbook)

| # | O que só você faz | Runbook | Antes de |
|---|---|---|---|
| 1 | `wrangler login` e **migração D1 remota** (`d1 migrations apply soulmon-billing --remote`) **antes do merge** da assinatura | Fase 0.3 | merge |
| 2 | **Gerar a keystore de upload** em `E:\soulmon-secrets\` + **backup offline** | Fase 1 | tudo |
| 3 | Digitar as senhas no build local do AAB (`ORG_GRADLE_PROJECT_*`) | Fase 3.3 | upload |
| 4 | Fazer o **upload** do AAB no teste interno e aceitar **Play App Signing** | Fase 4 | Firebase/billing |
| 5 | **Restringir a API key** e cadastrar os SHA (upload e App Signing) no Firebase | Fase 5 | beta |
| 6 | **Perfil de pagamentos** da Play (dados bancários/fiscais) — comece cedo, pode demorar dias | Fase 6.1 | produtos |
| 7 | Criar a **service account** da Play, os **secrets** do Worker e `FIREBASE_SERVICE_ACCOUNT` do push | Fase 7 | compras |
| 8 | **Pub/Sub + RTDN** da assinatura | Fase 7.3 | assinatura |
| 9 | **Deploy do worker de push** (`cd workers; npx wrangler deploy -c wrangler.toml`) — pendente desde o ritmo das refeições | Fase 7.4 | push |
| 10 | Testar compra no aparelho e só então ligar **`PLAY_REQUIRE_ACCOUNT_BINDING=true`** | Fase 8 | testadores |
| 11 | Criar o **Google Group**, a faixa de **teste fechado**, mandar os convites e manter o relógio | Fases 9-10 | produção |
| 12 | **Recrutar** (a squad redige os textos; você envia) e preencher a **licença de teste** | `BETA-TESTADORES.md` | D0 |

A squad faz o resto via Chrome **com o seu "sim" em cada envio** (ficha, Data Safety, IARC, IA,
produtos, leitura de painéis). Ela nunca digita senha, keystore, JSON de service account nem dado
bancário.

## 2. Decisões suas que ainda estão abertas

| # | Decisão | Por que importa | Padrão se não decidir |
|---|---|---|---|
| D1 | **Preço dos 4 SKUs** (`soulmon.unlock.full`, `credits.60/150/400`) | folha da Play mostra o preço; `FULL_UNLOCK_PRICE_LABEL_USD` (US$ 6.99) tem que bater com os Termos (C12) | sugestão R$ 29,90 / 4,90 / 9,90 / 19,90 |
| D2 | **Reembolso da assinatura**: fecha a vitrine futura, não retira o já entregue (R8 do threat model) | abre abuso assinar -> resgatar -> reembolsar; no beta (licença de teste) o impacto é zero | ✅ **decidido em 11/10/2026**: fecha a vitrine, não retira (REGISTRO §33) |
| D2b | **Revisão jurídica** de `termos.html` §4b (assinatura) e `privacidade.html` §6b (assinatura) e §6c (diagnóstico de falhas) | publicados em 11/10/2026 para o beta por decisão sua, a partir dos rascunhos da squad; o jurídico é seu | revisar **antes de pedir produção**; mudança relevante sobe `TERMS_VERSION`/`PRIVACY_VERSION` (`src/utils/consent.ts`) |
| D3 | **Padrão de verificação** (MASVS-L1 + ASVS-L1 nas rotas de dinheiro/auth) | norteia as checagens de segurança | assumido L1 |
| D4 | **Data de início (D0)** e **lista de testadores** | sem eles não há relógio | — |
| D5 | **`SCHEDULE_EXACT_ALARM`**: trocar por alarme inexato ou manter com declaração | permissão que gera declaração extra na Play | a branch de correções propõe remover |
| D6 | **Constantes da masmorra e do gauge de evolução** (4 h, 25%, curva da zona, sumidouro de Bits; números 30/45/60) | balanceamento sem usuário ainda | os valores atuais do código |
| D7 | **Quando cortar o `release/beta-1`** (guilda, masmorra e pesadelo já têm fecho datado de 11/10 no STATUS) | congela feature durante os 14 dias | você dá o "fechou" |

## 3. Pendências suas que não bloqueiam o beta

| Item | Nota |
|---|---|
| **Regularizar o billing do GitHub** (`github.com/settings/billing`) | volta o CI; hoje o portão é `npm run portoes` |
| **Rotacionar a chave de upload do DigiApp** (as keystores do DigiApp estão no histórico público do repo, commit `c47776e51`) | é do outro app, não do Soulmon; formulário da Play |
| **Rate Limiting da Cloudflare** em `/api/billing*` e `/api/rtdn` | antes da produção; 15 testadores autenticados não precisam |
| **Host do CDN Higgsfield** (CSP `img-src https:` aberto) | fecha a CSP; sem pressa no beta |
| **Arte de loja** (ícone 512, feature graphic, 8 screenshots por idioma) | obrigatória para a **produção**; para teste fechado confira se o Console exige. Higgsfield travado por crédito (#19) |
| **Plano pago Cloudflare (Workers Paid, ≈ US$ 5/mês)** | recomendado se o KV gratuito (poucas gravações/dia) apertar — `BETA-CONTINGENCIA.md` §8 |
| **Steam** (conta Steamworks, App ID, `STEAM_PUBLISHER_KEY`) | fora do beta |
| **Conta de organização / Health Connect** | só se os passos migrarem do sensor para o Health Connect |
| **Revogar o JWT anônimo do Supabase do fork** (aparece no histórico) | decisão sua sobre o histórico (`STATUS.md`) |

## 4. Já resolvido (não volte a esta lista)

Deploy do worker de push e VAPID (07/09; **redeploy** pendente, item 9 acima) · `FIREBASE_PROJECT_ID`
no `wrangler.jsonc` · `VITE_FIREBASE_*` · **projeto Firebase `soulmon-app` e `google-services.json`
do pacote `com.hexervoodoom.soulmon`** · **D1 `soulmon-billing` criado e migrações 0001/0002
aplicadas (22/09)** · política de privacidade no ar (`privacidade.html`) · conta do Play Console
paga (08/09) · `minSdkVersion` 26 · TTL do save renova a cada acesso · exclusão de conta e o
destino do recibo (declarado em `PLAY-DATA-SAFETY.md` §1) · `applicationId` próprio.
Para o estado dos secrets do Cloudflare use `npx wrangler secret list` (a última medição, 22/09, está
em `PLAY-LANCAMENTO.md` §E).
