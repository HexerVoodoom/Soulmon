# Estudo pré-Mobbin × sustento — o corpus de monetização contra o código

**Guarda:** sustento (WP0.6, WP5.1–WP5.5). **Ledger:** `../ledger/sustento.md`.
**Data:** 03/09/2026.
**Escopo:** o material estudado ANTES do dossiê Mobbin. O Mobbin já foi destrinchado em
`../mobbin/sustento.md` e não é repetido aqui.

**Fontes lidas (inteiras):**
- `docs/guia-experiencia/06-paywall-monetizacao.md` (rel. 06 — 16 recomendações + benchmarks)
- `docs/guia-experiencia/08-transcricoes-notebooklm.md` blocos **C3** (19 dark patterns nomeados,
  GDC/Extra Credits), **C5** (checklist de 8 critérios — Dark Side of Gacha, Business of Fair Play,
  Sub Club) e **C6** (Emily Greer — armadilhas de métrica; só a parte que toca monetização)
- `docs/GUIA-EXPERIENCIA.md` seções **B.6** (M-1…M-11 + arbitragem), **C.1/C.2/C.3** (DON'Ts e
  os 7 conflitos arbitrados), **H** (decisões do dono 1–4) e **I.2/I.4/I.5**
- `docs/guia-experiencia/01-youtube-mobbin-timgabe.md` lições 4–8, 12 e a síntese §3
- `docs/plano-melhorias/D-monetizacao.md` e `docs/BILLING-SETUP.md`

**Código lido/grepado nesta sessão:** `src/components/UnlockAccountModal.tsx`, `CreditsModal.tsx`,
`ShopModal.tsx`, `SoulmonOnboarding.tsx`, `AccountSection.tsx`, `form/FormKit.tsx`,
`src/utils/monetization.ts`, `playBilling.ts`, `entitlements.ts`, `currencies.ts`, `instantHeal.ts`,
`shop.ts`, `telemetry.ts`, `src/App.tsx` (handlers de Créditos), `functions/api/_entitlements.js`,
`_billing.js`, `entitlements.js`, `android/.../plugins/BillingPlugin.kt`, `public/termos.html`.

**Regra deste arquivo:** nenhuma célula da coluna do meio sem `grep`/leitura. Referência é
`arquivo` + SÍMBOLO, nunca número de linha. `NÃO ENCONTRADO` significa que foi procurado.

---

## 1. Onde o corpus pré-Mobbin discorda de si mesmo (ler antes da tabela)

| Tema | Posição A | Posição B | Como o guia arbitrou |
|---|---|---|---|
| **Momento do paywall** | Rel. 01 lição 4 e síntese §3 item 1: "paywall no momento do reveal" ("seu plano está pronto", padrão Noom/Cal AI, Adam Lyttle) | Rel. 06 rec. 4/5: nunca no reveal, "cobrar ali contamina o momento emocional mais forte"; value moment = 1º dia perfeito | **C.3 #1: 1º dia perfeito.** Reabrir só com conversão < 1% |
| **Preço do vitalício** | Rel. 06 rec. 3: R$ 29,90 "barato demais", subir para 49,90–69,90 ou rotular como lançamento | C5 #6 (Sub Club): preço regionalizado **agressivamente reduzido** no Brasil é prática JUSTA; C5 #4: excedente do consumidor é o que gera promotor | Guia H.2: decisão do dono; C.4/I.5 registram que o benchmark de 06 é US/EU e que a rodada 2 reposicionou o preço baixo como justiça, não desconto |
| **Trial** | Rel. 06 rec. 6 e benchmark: trial de 7 dias é "a maior alavanca isolada" (+38–52%) | Rel. 06 tabela: em produtividade o comprador direto **out-earns** o trial em 1 ano (US$ 56,95 vs 49,13) — "trial não é obrigatório na categoria" | Guia M-9 P2, decisão do dono (H.1). O próprio rel. 06 se contradiz e não resolve |
| **Assinatura** | Rel. 06 rec. 1–2: assinatura "Vínculo" com Créditos recorrentes | `PLANO-EVOLUCAO` Princípios 1 e 4 (dinheiro compra só conveniência/cosmético/identidade; jogo íntegro com backend morto) | **C.3 #3: admissível com 3 travas**, decisão do dono |
| **Reroll pago** | Rel. 01 lição 12: "único ponto de fricção", mitigação = declarar equivalência mecânica na tela | Guia H.4 + M-6: risco ECA Digital, saída = "Nova Leitura" determinística | Ambos convivem: a declaração já está na tela (ver tabela); a "Nova Leitura" está sem WP (ver C-S4) |

---

## 2. A tabela — fonte × Soulmon hoje × veredito

Legenda: **já faz** · **lacuna** · **conflita com a tese** · **não se aplica** · **já coberto por WP (qual)**.

### 2.1 Relatório 06 — as 16 recomendações

| O que a fonte diz (fonte + bloco) | O que o Soulmon faz hoje (arquivo + símbolo) | Veredito |
|---|---|---|
| Rel. 06 §1: billing server-authoritative, cliente nunca decide tier/créditos | `functions/api/_entitlements.js` `readEntitlement`/`writeEntitlement`/`applyVerifiedPurchase` — único escritor de `ent:<saveId>`; `src/utils/entitlements.ts` cabeçalho "espelho somente-leitura"; `requirePaidTier` fail-closed (503/402) | **já faz** |
| Rel. 06 §1: um comprovante vale para uma conta (`claimOrder` + `obfuscatedExternalAccountId`) | `_entitlements.js` `claimOrder` (KV best-effort) e `claimOrderAtomic` (D1); `_billing.js` `isPlayPurchaseBoundTo`. **Mas** `setObfuscatedAccountId` — `NÃO ENCONTRADO` em `BillingPlugin.kt` (só `setProductType(INAPP)`) nem em `playBilling.ts` `purchase` | **já coberto por WP (WP0.6)** — a metade "de verdade" da trava não pode ser ligada |
| Rel. 06 §1: catálogo = unlock R$ 29,90 + packs 4,90/9,90/19,90 | `_billing.js` `PRODUCTS` (4 SKUs); `monetization.ts` `CREDIT_PACKS`, `FULL_UNLOCK_SKU`, `FULL_UNLOCK_PRICE_LABEL`; `publishedPrice.test.ts` trava igualdade com `public/termos.html` `data-price="full-unlock"` | **já faz** |
| Rel. 06 §1: anúncios desligados; endpoint recusa creditar sem SSV | `monetization.ts` `ADS_ENABLED = false` (D-13); `CreditsModal` só renderiza a `Row` de anúncio com `ADS_ENABLED && adsEnabled` (palavra do servidor) | **já faz** |
| Rel. 06 §1 diag. (a): ninguém descobre a oferta antes do cap | `UnlockNudge` em 3 pontos: `CreateModal` (`isAtCap && capIsDemoBoundary`), `EditModal` (`blocked && capIsDemoBoundary`), `App.tsx` view `evolution` com `demoCharacterId`. `ShopModal`: `NÃO ENCONTRADO`. `DailyReportModal`: `NÃO ENCONTRADO` (grep `unlock|paid|offer|credit|tier` vazio) | **já coberto por WP (WP5.1)** |
| Rel. 06 §1 diag. (b): compra única não cobre custo recorrente de IA | `_billing.js` `PRODUCTS` só tem INAPP; `BillingPlugin.kt` `ProductType.INAPP` nos dois pontos; assinatura `NÃO ENCONTRADO` | **já coberto por WP (WP5.4)** — spec, decisão D10 |
| Rec. 1: assinatura "Vínculo" ao lado do vitalício, nada de progresso | idem acima — `NÃO ENCONTRADO` | **já coberto por WP (WP5.4)** |
| Rec. 2: assinatura com Créditos recorrentes por dentro | `NÃO ENCONTRADO` | **já coberto por WP (WP5.4)** — e C5 #5 (double dipping) é a trava da spec |
| Rec. 3: reprecificar o vitalício (49,90–69,90) ou "oferta de lançamento" com data real | `FULL_UNLOCK_PRICE_LABEL = 'R$ 29,90'`; nenhum timer/contador (`countdown|limited time|expira em` → `NÃO ENCONTRADO` em `UnlockAccountModal`/`CreditsModal`/`ShopModal`) | **não se aplica ao guarda** — D10 (dono); e ver §1: C5 #6 lê o preço baixo no Brasil como JUSTIÇA, não como erro |
| Rec. 4: primeira oferta proativa no `DailyReportModal` do 1º dia perfeito | `DailyReportModal`: `NÃO ENCONTRADO`; `telemetry.ts` `TELEMETRY_UNLOCK_REASON.report = 2` já existe e o allowlist `unlock_view.reason max:3` já aceita — mas ninguém emite `report` (grep `TELEMETRY_UNLOCK_REASON.report` fora de `telemetry.ts` vazio) | **já coberto por WP (WP5.1b)** — a telemetria chegou antes da UI |
| Rec. 5: não adotar hard paywall nem paywall pós-quiz | `SoulmonOnboarding` `handleUnlockFull` é botão `quiet` abaixo de "Começar agora — é grátis" (`primary`); o ritual termina em `onRevealed`, sem cobrança (grep `unlock|purchase|R$` no arquivo só acha a intro e mensagens de erro) | **já faz** |
| Rec. 6: trial de 7 dias como presente do pet após 3º dia perfeito | `NÃO ENCONTRADO` (D §5: trial e presente monetizado inexistem; só gift social de 20 Bits em `community.js`) | **já coberto por WP (WP5.4)** — C3 "Assinaturas ocultas" exige lembrete antes de cobrar; a spec já leva a trava |
| Rec. 7: restaurar compras visível em Conta; "Já sou apoiador" na tela de oferta | `AccountSection.tsx` importa `restorePurchases` ("NÃO é opcional: a Play exige"); `UnlockAccountModal` botão `quiet` "Já comprei — restaurar" `handleRestore` com tratamento de `order-in-use` | **já faz** |
| Rec. 8: 4º ponto passivo = aba/cartão "Apoie o Soulmon" na Loja | `ShopModal` `sections` = Itens/Cenários/Mobílias (+ `seg === 'tournament'`); único toque em Créditos é o câmbio `BITS_EXCHANGE` (`exchange`); `apoie|support|unlock` → `NÃO ENCONTRADO` | **já coberto por WP (WP5.1a)** |
| Rec. 9: fechar com um toque, X no primeiro frame, recusa não repete no mesmo dia (`lastNudgeDay`) | `FormKit.tsx` `ModalSheet` renderiza o botão `aria-label="Fechar"` sem delay; `UnlockAccountModal` `handleDismiss` → `unlock_dismiss` (WP5.5). **`lastNudgeDay|offerDismissed|offerShown|lastOffer`: `NÃO ENCONTRADO`** — hoje não precisa, porque nenhum convite é proativo | **já faz** (fechar) / **já coberto por WP (WP5.1)** (memória da recusa — entra junto com o 1º convite proativo) |
| Rec. 10: cap global de 1 oferta proativa por semana | `isoWeekKey` existe em `telemetry.ts` (testado em `telemetry.test.ts`); `offerShownWeek` `NÃO ENCONTRADO` no save | **já coberto por WP (WP5.1)** — a helper de semana já existe, reutilizar |
| Rec. 11: título "Seu Soulmon cresce porque você cresce. Faça dele algo só seu." | `UnlockAccountModal` título = "Soulmon completo"/"Full Soulmon"; corpo = "No modo grátis cabem N hábitos ativos…" / "Esta é a árvore de um personagem de demonstração…" (`reason`); grep `cresce porque você cresce|grows because you` em `src`/`public` → `NÃO ENCONTRADO` | **lacuna** → C-S1 |
| Rec. 12: enquadrar como APOIO ("ajude a manter o Soulmon vivo"), não como desbloqueio de poder | `UnlockAccountModal` `Perk` ×3: "Sua criatura, só sua" / "Atividades sem limite" / "Reroll liberado" — os dois últimos são FEATURE, e "Reroll liberado (custa Créditos)" vende um gasto futuro dentro da oferta | **lacuna** → C-S1 |
| Rec. 13: "Pagar nunca deixa sua criatura mais forte. Não tem como." dentro do paywall | grep `nunca deixa sua criatura|never makes your creature` → `NÃO ENCONTRADO` no `UnlockAccountModal`. A frase equivalente EXISTE, mas noutro lugar: `CreditsModal` hint do reroll ("Todo pet é igual em atributos: muda a identidade, não o poder") e `termos.html` §5 | **lacuna** → C-S1 (mover a frase para onde o dinheiro é pedido) |
| Rec. 14: nunca vender evolução, perfectDays, HP irrestrito, escudos, conclusão de tarefa, pular dia, vantagem em Torneio/PvP, Glitchtama; **revisar a cura instantânea** | `PRODUCTS` concede só `tier`/`credits`; `shop.ts` comenta "Glitchtama is deliberately NOT sold"; Emblemas travados em cosmético (C.1 #6). **Cura instantânea:** `App.tsx` `handleInstantHealWithCredits` + `CreditsModal` `Row` "Curar 1 coração agora" (`HEART_COST_CREDITS = 10`) — existe | **já faz** (lista) / **já coberto por WP (WP5.2, D7)** (cura) — **mas ver a linha seguinte** |
| Rec. 14 (desdobrado por este guarda): "a cura instantânea é a ÚNICA peça que vende HP por dinheiro real" | **Falso por um caminho indireto:** `currencies.ts` `BITS_EXCHANGE` (10 Créditos → 100 Bits, `CREDIT_TO_BITS = 10`) + `shop.ts` `heart-item` `price: 150` + `HEART_HEAL = 1`. Logo **15 Créditos → 150 Bits → 💗 → +1 coração**, sem teto de frequência (o câmbio não tem cap; `handleExchangeCredits` só chama `spendCredits`). Remover a `Row` de cura (D7 opção a) deixa este caminho intacto, 50% mais caro | **conflita com a tese** ("dinheiro nunca compra a barra") → C-S3, extensão de D7 |
| Rec. 15: rewarded ads só por Bits cosméticos, com SSV; recomendação = não ligar | `ADS_ENABLED = false`; `grantAdReward` credita **Créditos** (`AD_REWARD_CREDITS = 5`), não Bits — se um dia ligar como está, anúncio vira moeda de dinheiro real e paga reroll (o caminho que D-13 fechou de propósito) | **já faz** (desligado) / **conflita com a tese** se religado sem mudar a moeda — registrar, sem WP (é decisão do dono, e a peça está inerte) |
| Rec. 16: instrumentar nudge-mostrado / tocado / compra-verificada por origem antes de otimizar | `telemetry.ts` `EVENT_SCHEMA`: `unlock_view {reason, tier}`, `unlock_dismiss {reason}`, `purchase {tier}`, `demo_cap_hit {path}`; `TELEMETRY_UNLOCK_REASON = {taskLimit, evolution, report, shop}`; emitidos em `App.tsx` (`track('unlock_view')`, `track('purchase')`) e `UnlockAccountModal` `handleDismiss` | **já faz** (para os 3 pontos atuais; `report`/`shop` reservados e ainda sem emissor) |
| Rel. 06 §2: "o comparável certo é o Finch, não o Duolingo"; Duolingo monetiza a fricção que cria (corações infinitos pagos) | O Soulmon não vende "HP irrestrito" — mas vende HP unitário (`handleInstantHealWithCredits`) e o caminho indireto acima. A dungeon nunca cobra coração (CLAUDE.md ⚔️) | **conflita com a tese** — é o mesmo achado de D7/C-S3, com precedente nomeado |
| Rel. 06 §2: estrutura (trial, mix, placement) vale ~2× copy | WP5.1 (placement) está PROPOSTO; C-S1 (copy) é PP | **não se aplica ao código** — regra de priorização: se só couber um, é o placement |

### 2.2 Transcrição C3 — os 19 dark patterns nomeados

| O que a fonte diz (C3, padrão) | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| Bait and Switch — X que leva à loja | `ModalSheet` `onClose` fecha e só; `UnlockAccountModal` `handleDismiss` chama `onClose` após `track` | **já faz** (não faz) |
| Misuse of Graphic Design — cancelar sem contraste | `UnlockAccountModal`: "Agora não" é `sm2Button('ghost')` com `width: 100%`, mesma largura do primário (WP5.5, comentário no footer) | **já faz** (WP5.5 VERIFICADO) |
| Unbalanced UI — pré-selecionar o pack mais caro | `CreditsModal` mapeia `CREDIT_PACKS` em 3 `Row` idênticas, sem pré-seleção nem "melhor valor"; ordem crescente (60/150/400) | **já faz** (não faz) |
| Assinaturas ocultas / dificuldade de cancelamento | Sem assinatura (`INAPP` only). Reembolso: `auditRefunds` rebaixa `paid→demo` e debita créditos com piso 0 — nunca trava o save | **não se aplica hoje** / trava obrigatória em WP5.4 |
| Guilt-tripping — mascote que chora se você não pagar | `UnlockAccountModal` e `UnlockNudge` não usam a voz do pet; o nudge é "uma linha clicável, sem badge piscando nem contagem regressiva" (comentário do componente). C.2 #17 proíbe a voz do pet cobrar | **já faz** (não faz) — e é a trava que WP5.1b precisa levar para o `DailyReportModal`, onde o PET fala (C-S2) |
| Social validation / pressão por contatos | Nenhum ponto de oferta usa amigos; gift social é 20 Bits, não dinheiro (`community.js`) | **não se aplica** |
| Daily rewards enganosas (prêmio de 0,003%) | Não existe login reward. Drop de 💗 na masmorra é 5%/inimigo, cap 2/dia, e não é pago (`DUNGEON_HEART_DROPS`) | **não se aplica** |
| Probabilidades enganosas em loot box | Reroll: `CreditsModal` confirmação in-line declara "sorteado aleatoriamente… todo pet é mecanicamente igual"; `termos.html` §5 "O reroll (sorteio pago)" idem | **já faz** (transparência) — a peça continua sendo sorteio pago; ver C-S4 |
| Forced Play — punir inatividade | Fora do domínio (C.1 #1 travado por teste); no dinheiro: nada cobra por ausência | **não se aplica** |
| Legalese obfuscation | `termos.html` 1.638 palavras, 10 seções curtas com títulos em linguagem comum ("O que o serviço é", "O reroll (sorteio pago)"); `privacidade.html` 2.566 palavras com linha PT+EN por evento | **já faz** |
| Price manipulation dinâmica por perfil | Preço vem do Play Console (`_billing.js` cabeçalho de `PRODUCTS`: "a loja é a fonte da verdade do valor"); o app só tem rótulo fixo | **já faz** (não faz) — e é o gancho para preço regionalizado JUSTO (C5 #6): a Play faz por país, sem código |
| Decision fatigue — bombardeio de decisões na loja | `CreditsModal`: 3 packs + 2 gastos; `ShopModal` câmbio: 3 pacotes. Nenhuma oferta aparece em outra tela | **já faz** (não faz) |
| Eye-level shelf — pago onde o olho cai primeiro | `ShopModal` abre em Itens (Bits); o câmbio de Créditos vem DEPOIS das seções (`exchange` renderizado após `sections`); `CreditsModal` só pelo menu sanduíche (`BottomNav` `onOpenCredits`) | **já faz** (não faz) — WP5.1a precisa manter o card **no fim** da aba, como a spec já diz |
| End caps — pop-up de oferta na abertura/fechamento do app | Nenhum `UnlockAccountModal` abre sozinho (grep: só via `onOpen` dos 3 nudges e `handleUnlockFull` da intro); `DailyReportModal` hoje não tem oferta | **já faz** (não faz) — **atenção:** o relatório diário É um "end cap" natural (aparece 1×/dia na abertura); WP5.1b precisa ser linha dentro do relatório, nunca modal por cima (C-S2) |
| Checkout candy — microtransação barata no fim do fluxo | Não há "fim de fluxo" com oferta; a compra de pack não sugere um segundo pack | **não se aplica** |
| Sensory priming — cinemática de poder antes da barreira | O reveal do Oráculo mostra a criatura e NÃO cobra (C.3 #1); a intro do onboarding mostra os 3 demos e o botão pago é `quiet` | **já faz** (não faz) |
| Wandering — esconder o resgate grátis atrás de abas pagas | O oposto: o pago é que está escondido (menu sanduíche) — esse é o diagnóstico (a) do rel. 06 | **já faz** (não faz) — e é o motivo de WP5.1 ser descoberta, não interrupção |
| Timing / drip feeding — recompensa em intervalos para visitar a loja | Comida vem de concluir tarefa; teto por hora é regra de cuidado (`FOOD_LIMIT_PER_HOUR`), não gatilho de loja | **não se aplica** |
| Definição Extra Credits: dark pattern = subverter a autonomia | `monetization.ts` comentário D-12: "NÃO É TRAVA DE SEGURANÇA. É desenho de produto" e "`kind: 'task'` responde SEMPRE true… punir o espontâneo é punir exatamente o que se quer" | **já faz** — precedente escrito no código |

### 2.3 Transcrição C5 — checklist de monetização justa (8 critérios)

| O que a fonte diz (C5 #) | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| #1 Kinder Joy — rodada paga aleatória sempre entrega utilidade | `App.tsx` `handleRerollCharacter`: **gera ANTES de cobrar** (`try { generateOracle… } catch { return false; // nada foi cobrado }`, depois `spendCredits`); toda rodada devolve uma criatura completa | **já faz** |
| #2 Transparência do custo real; preferir oferta direta a loop indireto | Custos literais na UI: `REROLL_COST_CREDITS`/`HEART_COST_CREDITS` impressos nas `Row`; `CREDIT_PACKS` com `priceLabel`. **Exceção:** o caminho Créditos→Bits→💗 é exatamente uma "venda indireta" cujo custo real (15 Créditos por coração) não aparece em lugar nenhum | **já faz** (direto) / **conflita com a tese** (indireto) → C-S3 |
| #3 Valores sagrados — o "terceiro trilho" nunca leva paywall | O trilho tem nome: a barra de cuidado. Livre: masmorra sem custo de coração, carinho, 💗 por Bits. **Pago:** `handleInstantHealWithCredits` (10) e o caminho indireto (15) | **conflita com a tese** — **é a resposta à pergunta da tarefa: o corpus pré-Mobbin TEM posição sobre D7, e é contra.** C5 #3 é a fonte primária; rel. 06 rec. 14, guia C.3 #7, H.3 e I.5 derivam dela |
| #4 Excedente do consumidor; preço alto sem diferenciação gera churn | R$ 29,90 vitalício; nada a verificar em código | **não se aplica ao guarda** (D10) — mas é o argumento contra rec. 3 do rel. 06 (ver §1) |
| #5 Double dipping — assinatura + consumível exige franquia robusta | Sem assinatura hoje | **já coberto por WP (WP5.4)** — a spec já lista como trava |
| #6 Preço democrático: regionalizado agressivo no Brasil + compra avulsa para quem não assina | Compra avulsa: SIM (`soulmon.unlock.full` não consumível + packs). Regional: preço é do Play Console por país; o rótulo `FULL_UNLOCK_PRICE_LABEL` é BRL fixo e `publishedPrice.test.ts` trava o par com `termos.html` — se a Play cobrar diferente em outro país, o rótulo mente | **já faz** (avulso) / **lacuna pequena** (rótulo hard-coded em BRL para quem está em EN) → C-S5 |
| #7 Promoções espaçadas e imprevisíveis | Nenhuma promoção existe (`countdown|limited time` `NÃO ENCONTRADO`) | **já faz** (por ausência) — verdade do ledger, sem WP |
| #8 Framework GAMES — métrica holística, não só conversão | `telemetry.ts` mede funil (`unlock_view`/`dismiss`/`purchase`); não há métrica de "Good times"/"Social health" ligada à monetização | **não se aplica ao guarda** (domínio medição); registrar para o consolidador |

### 2.4 Transcrição C6 — armadilhas de métrica (a parte de monetização)

| O que a fonte diz (C6 #) | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| #3 Curva normal mente: receita é power law; usar mediana e métricas binárias | `EVENT_SCHEMA` só tem contadores binários/categóricos (`purchase {tier}`), nenhum valor monetário — por construção não dá para calcular ARPU enganoso | **já faz** (por desenho da telemetria) |
| #7 Atribuir ao teste quando interage com o recurso, não no login; rodar semanas | `experiment|abtest|variant` em `telemetry.ts` → `NÃO ENCONTRADO`; não há infra de A/B | **não se aplica hoje** — vira trava de qualquer WP futuro: `unlock_view` já É o evento de atribuição certo (dispara na interação, não no login) |
| #8 Avaliação precoce — "Office Space" −11% líquido em 30 dias | Nenhum experimento de monetização rodando | **já faz** (verdade do ledger: "nenhum experimento julgado antes de 30 dias") — sem WP |

### 2.5 Guia mestre — B.6, C.1/C.2, C.3, H

| O que a fonte diz | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| B.6 M-1 P0: aba "Apoie o Soulmon" na Loja | `NÃO ENCONTRADO` em `ShopModal` | **já coberto por WP (WP5.1a)** |
| B.6 M-2 P0: copy de resultado + "Pagar nunca deixa sua criatura mais forte" | `NÃO ENCONTRADO` (ver 2.1 rec. 11–13) | **lacuna** → C-S1 — **é P0 no guia e não tem WP**; foi a peça que escorregou entre o guia e o plano |
| B.6 M-3 P0: instrumentar o funil | feito (ver 2.1 rec. 16) | **já faz** |
| B.6 M-4 P1: oferta no `DailyReportModal` do 1º dia perfeito | `NÃO ENCONTRADO` | **já coberto por WP (WP5.1b)** |
| B.6 M-5 P1: cap 1/semana + `lastNudgeDay` via `playerDayKey` | `NÃO ENCONTRADO`; `playerDayKey` existe (`src/utils/playerDay.ts`) | **já coberto por WP (WP5.1)** |
| B.6 M-6 P1: reroll → "Nova Leitura" (seed derivada das respostas, não `Math.random`) | `App.tsx` `handleRerollCharacter`: `newSeed = Math.floor(Math.random() * 2 ** 31)`; `oracle.ts` também usa `Math.random` como fallback de `salt`. `Nova Leitura|New Reading` → `NÃO ENCONTRADO`. **E não há WP para isso** (`PLANO-MELHORIAS.md` grep `Nova Leitura|M-6|reroll` vazio) | **lacuna** → C-S4 (cruza com nascimento; decisão H.4 do dono) |
| B.6 M-7 P1: cura instantânea — remover ou 1/semana como presente do pet | `handleInstantHealWithCredits` existe, sem cap de frequência | **já coberto por WP (WP5.2, D7)** |
| B.6 M-8/M-9/M-10 P2: assinatura, trial, preço | inexistentes | **já coberto por WP (WP5.4)** / D10 |
| B.6 M-11 P2: X no primeiro frame + "Já sou apoiador" | `ModalSheet` X imediato; "Já comprei — restaurar" `quiet` | **já faz** |
| B.6 arbitragem: assinatura admissível com 3 travas (nada de progresso; cancelar não remove nada; conteúdo = IA + cosmético + estatísticas) | Trava (b) já tem precedente no código: `auditRefunds` rebaixa tier mas "na dúvida nunca se tira o que o jogador pagou" e o save fica intacto | **já coberto por WP (WP5.4)** — a spec deve citar `auditRefunds` como o comportamento a herdar |
| C.1 #7: Bits→Créditos proibido (travado por teste) | `currencies.ts` `CREDIT_TO_BITS` só nessa direção; `monetization.fronteira.test.ts` | **já faz** |
| C.1 #6: Emblemas só cosmético | `TOURNAMENT_ITEMS` `bg`/`furniture`; teste travando | **já faz** |
| C.2 #13: nunca cobrar da barra de cuidado por conteúdo | masmorra/torneio sem custo de HP (CLAUDE.md ⚔️) | **já faz** (fora do domínio, confirma a tese) |
| C.2 #14: lista do "nunca vender" (= rel. 06 rec. 14) | ver 2.1 | **já faz** + C-S3 |
| C.2 #15: nunca vender proteção contra punição (freeze comprável) | Escudos de descanso não estão em `PRODUCTS` nem em `shop.ts` (grep `shield` em `shop.ts` não consta do catálogo) | **já faz** (não vende) |
| C.2 #16: nunca conteúdo aleatório vendido; se houver, publicar probabilidades | Reroll é aleatório e pago; "probabilidade" aqui é degenerada (todo resultado é equivalente e a tela diz isso) | **conflita com a tese** de forma declarada — a saída é C-S4 |
| C.2 #18: nunca escassez com janela de horas | nenhum timer | **já faz** |
| C.2 #23: degeneração nunca reversível por pagamento | `handleInstantHealWithCredits` cura HP — se o pet está em degeneração (HP 0), 10 Créditos revertem? `applyInstantHeal` só checa `healthPoints < maxHealthPoints`, sem exceção para HP 0 | **conflita com a tese** — mesmo item de D7; reforça a opção (a) remover |
| C.3 #1: paywall no 1º dia perfeito, não no reveal | reveal sem cobrança (2.1 rec. 5) | **já faz** (a metade "não cobrar") / WP5.1b (a metade "cobrar no dia perfeito") |
| C.3 #3: assinatura com 3 travas | — | **WP5.4** |
| C.3 #7: cura instantânea — rever | — | **WP5.2 / D7** |
| H.1–H.4: assinatura, preço, cura, reroll = decisões do dono | — | **não se aplica ao guarda** — o guarda escreve spec (WP5.4) e recomendação (D7 = remover; H.4 = "Nova Leitura"), e para |
| I.2: "Forced Play" nomeado como dark pattern reposiciona a tese anti-punição | Sem efeito no dinheiro | **não se aplica** |
| I.4: nunca julgar experimento antes de 30 dias; eixo Y no zero; amostra visível | sem experimento | **já faz** (verdade do ledger) |
| I.5: preço regionalizado agressivo no Brasil é prática JUSTA | preço é da Play por país | **já faz** (mecanismo) / C-S5 (rótulo) |

### 2.6 Relatório 01 — o que fala de paywall

| O que a fonte diz (rel. 01, lição) | O que o Soulmon faz hoje | Veredito |
|---|---|---|
| Lição 4: paywall no reveal ("seu plano está pronto"); "o gatilho é o momento, não o pop-up" | Reveal sem cobrança; a segunda metade da lição (nunca abre sozinho) é regra do componente | **conflita com a decisão C.3 #1** (a primeira metade) / **já faz** (a segunda) — não reabrir sem conversão < 1% |
| Lição 5: venda o resultado, não a feature; os 3 pontos do modal devem ser resultados | `Perk` 1 é resultado ("Sua criatura, só sua"); `Perk` 2–3 são feature ("Atividades sem limite", "Reroll liberado") | **lacuna** → C-S1 |
| Lição 6: um preço, uma decisão; destacar UM caminho | `UnlockAccountModal`: um único preço, um primário | **já faz** |
| Lição 7: nunca esconda o que o dinheiro compra; moedas não se misturam | `currencies.ts` (3 estilos, tokens de contraste medidos); `CreditsModal` cabeçalho "desenho ÚNICO dos Créditos" | **já faz** (travado por teste) |
| Lição 8: a recusa precisa ter saída (`24870bf7`) | os 3 `UnlockNudge` são exatamente isso | **já faz** |
| Lição 12: drop raro ganho jogando = deleite; comprado = loot box; reroll é o ponto de fricção | Glitchtama nunca vendido; 💗 5%/inimigo; reroll pago com declaração de equivalência | **já faz** + C-S4 |
| Lição 12 (mitigação): "declarar na tela que todo resultado é mecanicamente equivalente" | `CreditsModal` confirmação in-line + `termos.html` §5 — **já está na tela** | **já faz** — a mitigação do rel. 01 foi implementada; o rel. 01 não pedia mais que isso |

**Contagem:** 62 linhas · **já faz** 33 · **lacuna** 6 (C-S1 ×4 linhas, C-S4, C-S5) · **conflita com a tese** 7 (todas na mesma família: HP por dinheiro — direto, indireto, degeneração — e o reroll aleatório) · **já coberto por WP** 16 · **não se aplica** 12. (Algumas linhas têm veredito duplo; a soma passa de 62.)

---

## 3. WPs existentes × corpus pré-Mobbin

| WP | Estado | O corpus pré-Mobbin… | Fonte |
|---|---|---|---|
| **WP0.6** `setObfuscatedAccountId` | PROPOSTO, requer APK | **Indiferente por nome, sustentado por consequência.** Nenhuma transcrição fala de Play Billing. Mas C5 #2/#3 e o rel. 06 §1 elogiam "um comprovante vale para uma conta" como integridade — e a verificação desta sessão confirma que a metade que a Google decide (`isPlayPurchaseBoundTo`) não pode ser ligada: `BillingPlugin.kt` não chama `setObfuscatedAccountId`. Continua o mais urgente | rel. 06 §1; `_billing.js` `isPlayPurchaseBoundTo`; `BILLING-SETUP.md` "Vínculo do recibo" |
| **WP5.1** descoberta na Loja + 1º dia perfeito | PROPOSTO | **Sustentado por 4 fontes independentes**: rel. 06 rec. 4/8/9/10; guia M-1/M-4/M-5; C3 "Wandering" e "Eye-level shelf" (fixam a FORMA: no fim da aba, nunca no topo; nunca modal por cima do relatório — "End caps"); C6 #7 (`unlock_view` como atribuição na interação). **Contradito por 1**: rel. 01 lição 4 (reveal) — já arbitrado em C.3 #1 | ver 2.1, 2.2, 2.5 |
| **WP5.2** cura instantânea | BLOQUEADO:D7 | **Contra a peça, a favor do WP, com a posição mais forte do corpus**: C5 #3 (valores sagrados) é fonte primária; rel. 06 rec. 14, guia C.3 #7/H.3/I.5 derivam; C.2 #23 acrescenta que a cura reverte degeneração por dinheiro. **E o corpus derruba a premissa "única peça"**: existe o caminho Créditos→Bits→💗 (C5 #2, venda indireta). A recomendação (a) remover fica; C-S3 amplia o escopo de D7 | C5 #3; C.2 #23; `currencies.ts` `BITS_EXCHANGE` + `shop.ts` `heart-item` |
| **WP5.3** idempotência de `spend` | PROPOSTO | **Indiferente** no corpus (nenhuma fonte fala de retry). Sustentado indiretamente por C5 #2 (custo previsível: cobrar 2× por 1 toque é o oposto) e pela dívida declarada em `instantHeal.ts` ("estornar exige idempotência no servidor") | `instantHeal.ts` cabeçalho; `entitlements.js` `action === 'spend'` sem `opId` |
| **WP5.4** spec de assinatura/trial | BLOQUEADO:D10 | **Sustentado com travas**: rel. 06 rec. 1/2/6; C5 #5 (double dipping) e #6 (avulso para quem não assina — o vitalício fica); C3 "Assinaturas ocultas" (lembrete antes de cobrar, cancelamento sem funil); `auditRefunds` como precedente de "cancelar não remove nada". **Contradito internamente** pelo próprio rel. 06 (comprador direto out-earns trial em produtividade) — a spec deve registrar o desacordo, não escolher | ver §1 |
| **WP5.5** "Agora não" | VERIFICADO | **Sustentado retroativamente** por C3 "Misuse of Graphic Design" (cancelar sem contraste é dark pattern nomeado) — o WP veio do Mobbin, mas o corpus anterior já o pedia | C3; `UnlockAccountModal` footer |

**Ponto mais sensível (pergunta da tarefa):** o corpus pré-Mobbin **tem posição sobre D7 e ela é
unívoca** — C5 #3 nomeia o "valor sagrado" que nunca leva paywall, o rel. 06 §2 chama corações pagos
de "o dark pattern que o Soulmon jurou não ter", C.2 #23 proíbe reverter degeneração por pagamento.
Nenhuma fonte defende manter. A única variante tolerada é "1/semana como presente do pet" (rel. 06
rec. 14, guia H.3), e ela continua sendo HP por dinheiro. A recomendação registrada do guarda
(remover) fica, e ganha um adendo: **remover só a `Row` não fecha o trilho** (C-S3).

---

## 4. Candidatas a WP novo (não integradas — o consolidador passa pela linha vermelha)

### C-S1 · Copy do `UnlockAccountModal`: resultado, apoio e a frase que não existe — PP
- **Fonte:** rel. 06 rec. 11/12/13; guia **M-2 P0** (sem WP hoje); rel. 01 lições 5 e 6.
- **Evidência:** título "Soulmon completo"; `Perk` 2–3 são feature; "Reroll liberado (custa Créditos)"
  vende gasto futuro dentro da oferta; `cresce porque você cresce|nunca deixa sua criatura` →
  `NÃO ENCONTRADO`. A frase de equivalência mecânica existe só no `CreditsModal` (reroll) e em
  `termos.html` §5 — longe de onde o dinheiro é pedido.
- **Spec:** (1) título EN "Your Soulmon grows because you do. Make it truly yours." / PT "Seu Soulmon
  cresce porque você cresce. Faça dele algo só seu."; (2) `Perk` ×3 reescritos como resultado — a
  criatura própria, a árvore própria (teto que cresce com ela), "ajude a manter o Soulmon vivo" (apoio,
  modelo Finch) — **sem** "Reroll liberado"; (3) linha fixa acima do footer, EN "Paying never makes your
  creature stronger. It can't." / PT "Pagar nunca deixa sua criatura mais forte. Não tem como."
  Nenhum número novo; `FULL_UNLOCK_PRICE_LABEL` e `DEMO_ACTIVITY_TOTAL_CAP` continuam vindo das
  constantes.
- **Aceite:** render test com os 3 `Perk` sem a palavra "Reroll"/"Créditos"; a frase (3) presente em
  PT e EN; `unlock_view`/`unlock_dismiss` inalterados.
- **Verificação:** `grep -q "cresce porque você cresce" src/components/UnlockAccountModal.tsx && grep -q "never makes your creature" src/components/UnlockAccountModal.tsx && ! grep -q "Reroll liberado" src/components/UnlockAccountModal.tsx`
- **Ordem:** depois de WP5.1 (estrutura vale 2× copy, rel. 06 §2) — mas é PP e pode ir junto.

### C-S2 · Travas de forma para o convite no `DailyReportModal` (adendo a WP5.1b) — sem código próprio
- **Fonte:** C3 "End caps" (pop-up na abertura é dark pattern), "Guilt-tripping" (mascote que
  cobra), C.2 #17 (a voz do pet nunca cobra); rel. 06 rec. 9.
- **Por que é adendo e não WP:** o `DailyReportModal` é a única tela onde o PET fala E a oferta vai
  entrar; sem trava escrita, "uma linha do pet + `UnlockNudge`" (spec atual) pode virar o pet
  pedindo dinheiro.
- **Spec a acrescentar em WP5.1b:** (1) a linha do pet celebra o dia perfeito e NÃO menciona compra
  — o convite é um `UnlockNudge` separado, na voz do app; (2) nunca modal por cima do relatório,
  sempre linha dentro dele, abaixo do conteúdo do dia; (3) `unlock_dismiss` com `reason: report`
  grava `offerDismissedWeek`, e a semana seguinte não repete se o usuário dispensou (o cap de
  1/semana é de EXIBIÇÃO; a recusa vale por 2 semanas).
- **Aceite:** teste de texto: nenhum `speak()`/fala do pet no relatório contém `R$`,
  `FULL_UNLOCK_PRICE_LABEL` ou "desbloque".
- **Verificação:** `grep -n "FULL_UNLOCK_PRICE_LABEL" src/components/DailyReportModal.tsx` só dentro do bloco do `UnlockNudge`, nunca em string de fala.

### C-S3 · O trilho indireto: Créditos → Bits → 💗 (extensão de D7 / WP5.2) — P · **decisão do dono**
- **Fonte:** C5 #3 (valores sagrados) e #2 (venda indireta esconde o custo real); rel. 06 §2
  (corações pagos = Duolingo); C.2 #14/#23.
- **Evidência:** `currencies.ts` `BITS_EXCHANGE` `{credits: 10, bits: 100}` + `shop.ts` `heart-item`
  `price: 150` + `HEART_HEAL = 1` → **15 Créditos = +1 coração**, sem cap; `handleExchangeCredits`
  (`App.tsx`) só chama `spendCredits('exchange-bits')`. A premissa "cura instantânea é a ÚNICA peça"
  (rel. 06 rec. 14, guia H.3, ledger, D-monetizacao) está **errada**: são duas, e remover a `Row`
  deixa a segunda.
- **Opções para o dono (o guarda recomenda a 1ª):**
  1. **Aceitar e nomear**: o câmbio é troca de moeda, e 💗 é item da loja de Bits — o dinheiro compra
     Bits, não HP; o mesmo Bits compra cenário. Registrar em CLAUDE.md 💎 e no `termos.html` §4 que
     Créditos→Bits→coraçãozinho existe (transparência, C5 #2). Custo: zero código; a tese passa a
     dizer "dinheiro nunca compra HP **diretamente**".
  2. **Fechar o trilho**: `heart-item` deixa de ser comprável com Bits vindos de câmbio — inviável
     (Bits não têm procedência) — ou 💗 sai da loja e fica só como drop da masmorra. Custo: quem hoje
     compra 💗 com Bits ganhos jogando perde a cura alternativa.
  3. **Cap**: câmbio limitado a N/semana. Não resolve o princípio, só o volume.
- **Aceite (opção 1):** CLAUDE.md 💎 e `termos.html` §4 citam o caminho; `D-monetizacao.md` §2
  corrigido ("duas peças"). **Aceite (opção 2):** `! grep -q "id: 'heart-item'" src/utils/shop.ts`.
- **Verificação:** `grep -n "heart-item" src/utils/shop.ts; grep -n "CREDIT_TO_BITS" src/utils/currencies.ts`.

### C-S4 · Reroll → "Nova Leitura" determinística (M-6 do guia, sem WP) — M · cruza com **nascimento** · decisão H.4
- **Fonte:** guia M-6 P1 e H.4; C.2 #16; rel. 01 lição 12; C5 #1/#2; `termos.html` §5 já chama o
  reroll de "sorteio pago".
- **Evidência:** `handleRerollCharacter` usa `Math.random()` para a seed; `oracle.ts` `salt` idem;
  `Nova Leitura|New Reading` → `NÃO ENCONTRADO`; **`PLANO-MELHORIAS.md` não tem nenhum WP para M-6**
  — é a segunda recomendação P1 do guia que escorregou entre guia e plano (a outra é M-2, C-S1).
- **Spec (rascunho do guarda; o dono do Oráculo é o guarda-nascimento):** "Nova Leitura" = reabrir
  as 6 perguntas (`ORACLE_QUESTIONS`) com as respostas anteriores preenchidas; a seed passa a ser
  `hash(respostas + contador de leituras)` em vez de `Math.random`; mesma resposta → mesma criatura
  (determinístico), resposta diferente → criatura diferente. Custo em Créditos igual
  (`REROLL_COST_CREDITS`); a geração continua ANTES da cobrança (C5 #1). O texto "sorteado
  aleatoriamente" sai do `CreditsModal` e do `termos.html` §5, porque deixa de ser verdade.
- **Aceite:** teste: mesmas respostas + mesmo contador → mesmo `result.seed`; `! grep -q "Math.random" src/App.tsx` no bloco de `handleRerollCharacter`; `termos.html` §5 sem "aleatoriamente".
- **Verificação:** `grep -n "Math.random" src/App.tsx | grep -i reroll` vazio.
- **Nota de linha vermelha:** é a única candidata que resolve um item de C.2 (#16) hoje em violação
  declarada; também é a que mais depende de decisão externa (ECA Digital / Lei 15.211/2025 é
  argumento jurídico, não de produto — o guarda não o pesa).

### C-S5 · Rótulo de preço hard-coded em BRL para quem está em EN — PP
- **Fonte:** C5 #6 (preço regionalizado) + C3 "Price manipulation" (o preço tem que ser o que a loja
  cobra).
- **Evidência:** `FULL_UNLOCK_PRICE_LABEL = 'R$ 29,90'` e `CREDIT_PACKS[].priceLabel` são strings BRL
  usadas nos dois idiomas (`UnlockAccountModal`, `UnlockNudge`, `CreditsModal`, `SoulmonOnboarding`);
  `BILLING-SETUP.md` §1 admite "os rótulos no app são só texto de UI". Se a Play cobrar em outra
  moeda, o app promete R$ e cobra outra coisa.
- **Spec:** `BillingPlugin.kt` `getPurchases`/`purchase` já consultam `ProductDetails`; expor
  `queryProducts(skus)` → `formattedPrice` da Play; `playBilling.ts` `getLocalizedPrice(sku)` com
  fallback para o rótulo BRL quando o plugin não existe (web). O rótulo fixo vira fallback, não
  verdade. **Requer APK** — agrupar com WP0.6 no mesmo build.
- **Aceite:** com plugin presente, a UI mostra `formattedPrice`; sem plugin, mostra o fallback e a
  mensagem "compra pelo app Android" que já existe; `publishedPrice.test.ts` continua travando o
  fallback com `termos.html`.
- **Verificação:** `grep -q "formattedPrice" android/app/src/main/java/com/hexervoodoom/soulmon/plugins/BillingPlugin.kt && grep -q "getLocalizedPrice" src/utils/playBilling.ts`.

**Fora de candidatura (registrado, sem WP):** `grantAdReward` credita **Créditos**, não Bits — se
`ADS_ENABLED` for religado como está, anúncio vira dinheiro real e paga reroll, o caminho que D-13
fechou. Não é lacuna hoje (a peça está inerte) — é uma trava a escrever na decisão do dono que
religar anúncios, junto com "só Bits cosméticos" (rel. 06 rec. 15).

---

## 5. O que este guarda mudou de opinião

1. **"A cura instantânea é a única peça que vende HP por dinheiro real" — era a frase-âncora do meu
   ledger, do D-monetizacao, do rel. 06 e do guia H.3, e está errada.** `BITS_EXCHANGE` +
   `heart-item` fazem 15 Créditos virarem +1 coração, sem cap. Descobri porque C5 #2 pergunta pelo
   custo REAL de um recurso, e fui somar. Remover a `Row` do `CreditsModal` (D7 opção a) não fecha o
   trilho; D7 precisa de um adendo (C-S3), e a recomendação do guarda passa a ser "remover a `Row`
   **e** nomear o caminho indireto" — não "remover e declarar resolvido".
2. **A telemetria chegou antes da UI, e isso muda a ordem de WP5.1.** `TELEMETRY_UNLOCK_REASON`
   já tem `report: 2` e `shop: 3`, o allowlist já aceita `max: 3`, e `isoWeekKey` já existe e é
   testada. Eu listava isso como pré-requisito de WP5.1; é entrega feita. WP5.1 é só UI + `offerShownWeek`
   no save.
3. **Duas recomendações P1/P0 do guia não têm WP e eu não tinha percebido**: M-2 (copy, P0) e M-6
   ("Nova Leitura", P1). Nenhuma é da minha série 5.x hoje. Viram C-S1 e C-S4; a segunda cruza com
   o guarda-nascimento e é decisão H.4 do dono.
4. **O rel. 06 discorda de si mesmo sobre trial** (maior alavanca isolada × comprador direto
   out-earns trial em produtividade), e eu vinha lendo só a primeira metade. A spec de WP5.4 tem que
   apresentar os dois números ao dono, não um.
5. **A mitigação que o rel. 01 pedia para o reroll já está implementada** ("declarar na tela que
   todo resultado é mecanicamente equivalente" — `CreditsModal` confirmação in-line e `termos.html`
   §5). O que continua aberto é a versão mais forte (C.2 #16 / M-6), não a do rel. 01. Registrar
   isso evita que alguém "implemente de novo" o que já existe.
6. **O corpus pré-Mobbin não ampara a subida de preço do vitalício** que o rel. 06 rec. 3 propõe:
   C5 #4 e #6 (Sub Club, a fonte de maior autoridade do bloco) leem preço agressivamente baixo no
   Brasil como prática justa e excedente do consumidor como motor de recomendação. Quando D10 vier à
   mesa, o guarda apresenta esse desacordo em vez de ecoar "barato demais".
7. **`grantAdReward` paga em Créditos.** Eu tratava "anúncios desligados" como assunto encerrado;
   religar do jeito que está reabre anúncio→moeda de dinheiro real→reroll. Vira trava escrita na
   decisão de religar, não WP.

**Pontos de descoberta da oferta hoje:** **3**, todos de recusa — `CreateModal` (`isAtCap &&
capIsDemoBoundary`), `EditModal` (`blocked && capIsDemoBoundary`), `App.tsx` view `evolution` com
`demoCharacterId`. O último a entrar foi o `EditModal` (`24870bf7`). Fora da contagem, por não serem
`UnlockNudge`: o botão `quiet` "Quero o completo" da intro do onboarding (pré-D0, escolha e não
convite) e a linha sem botão do rodapé do `CreditsModal` para `tier === 'demo'`.
