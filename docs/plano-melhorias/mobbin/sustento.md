# Mobbin × sustento — Dossiê 11 (oferta dentro do app, sem bloquear)

**Guarda:** sustento (WP0.6, WP5.1–WP5.4). **Ledger:** `../ledger/sustento.md`.
**Fonte lida:** `docs/guia-experiencia/09-mobbin-dossie.md` §1 (método e limites) + §12
(Dossiê 11, 11A/11B) + §15.4 + §8 (Finch `always available`, Deepstash escudo pago) + §4
(Shopify, oferta enxertada no checklist). **Contra:** `../D-monetizacao.md`, WP5.1 em
`docs/PLANO-MELHORIAS.md`, decisão C.3 #1/#3/#7 em `docs/GUIA-EXPERIENCIA.md`, rel. 06
(`docs/guia-experiencia/06-paywall-monetizacao.md` §3), C5 (`08-transcricoes-notebooklm.md`
itens 5, 6 e 8).

**Data:** 02/09/2026. **Regra deste arquivo:** nenhuma afirmação sobre o código sem `grep`;
cada célula da coluna "Soulmon hoje" cita arquivo + símbolo confirmado nesta sessão.

## 0. Limite do dossiê que muda a leitura

O próprio §1 declara: de 20 telas nas duas buscas, **1** é oferta genuinamente
dispensável (Garmin Connect); as outras 19 são paywall de tela cheia ou faixa
permanente. O Dossiê 11 é um **catálogo de anti-padrões com um único modelo positivo**.
Consequência para este guarda: o dossiê **valida a estrutura** que o Soulmon já tem
(soft paywall que nunca abre sozinho) e **corrige a forma** do que o WP5.1 propõe
(como o card se dispensa, que largura tem o botão, em que container vive). Ele **não**
muda o "onde" (o value moment continua sendo o 1º dia perfeito) — ver §4.

Limites herdados do §1 que afetam este dossiê: só iOS (nada de Android — o Soulmon é
Android-first e o Play Billing é o único provedor real, anexo D §1), sem data de captura,
e o acervo não fotografa estados transitórios — ou seja, o dossiê **não viu** nenhum toast
de recusa nem animação de fechamento de paywall.

## 1. Achado a achado — três colunas

Inventário confirmado por `grep` antes da tabela:

- `UnlockNudge` é exportado em `src/components/UnlockAccountModal.tsx` (`export function UnlockNudge`), com `UnlockReason = 'task-limit' | 'evolution'`. Ele é renderizado em **exatamente três** pontos: `src/components/CreateModal.tsx` (`<UnlockNudge … reason="task-limit"`, sob `isAtCap && capIsDemoBoundary`), `src/components/EditModal.tsx` (`<UnlockNudge … reason="task-limit"`) e `src/App.tsx` (`currentView === 'evolution' && gameState.demoCharacterId`, `reason="evolution"`, `variant` `reveal` se `accountTier === 'paid'`). Os três são de **recusa ou de árvore emprestada** — nenhum é de valor entregue.
- `src/components/ShopModal.tsx`: **zero** ocorrências de `UnlockNudge`, `accountTier`, `onUnlock` ou `onOpenCredits`; as props (`ShopModalProps`: `points`, `credits`, `onBuy`, `onExchangeCredits`, …) não recebem tier. A única presença de Créditos é o câmbio Créditos→Bits (`exchange`, `onExchangeCredits`). Segmentos: `ShopSegment = 'shop' | 'tournament'`; seções `items`/`bg`/`furniture`.
- `src/components/DailyReportModal.tsx`: **zero** ocorrências de `UnlockNudge`/`accountTier`; props (`DailyReportModalProps`) são `report`, `onClose`, `language`, `soulGoal`, `onRecoverHearts`, `moodToday`, `onPickMood`, `moodNote`. Modo acolhida = `const welcome = !!report.welcomeBack`. A recuperação de corações (`canRecover` → botão `ghost` "Eu fiz, esqueci de marcar") é **gratuita** — não passa por Créditos.
- `CreditsModal` abre por **um único caminho**: `App.tsx` `openCredits` → prop `onOpenCredits` da `BottomNav` → `MenuRow icon="diamond"` dentro do menu sanduíche (`BottomNav.tsx`, `{onOpenCredits && (<MenuRow …`). O rodapé demo do `CreditsModal` (`accountTier === 'demo'` → "Reroll é exclusivo de contas completas — desbloqueie por …") é **texto sem botão**.
- Telemetria: `TELEMETRY_UNLOCK_REASON = { taskLimit: 0, evolution: 1 }` e o allowlist `unlock_view: { reason: { min: 0, max: 1 } … }` em `src/utils/telemetry.ts` — **um `reason` 2 ou 3 seria descartado hoje**.
- Sinal de D0: `lastDayReport.saveDay` (`src/utils/dailyReset.ts`, "Viradas já vividas por este save, contando esta"), `NEW_SAVE_GRACE_DAYS = 3`, `looksLikeVeteranSave`. Contador vitalício: `totalPerfectDays` (`dailyReset.ts` na escrita da virada; `GameStateContext.tsx` no tipo).
- `isoWeekKey(day)` já existe em `src/utils/telemetry.ts`; `weekKey` em `src/utils/dungeon.ts` é outro (localStorage, semana da masmorra). **Não existe** `lastNudgeDay`, `offerShownWeek` nem `lastOffer*` em `src/` — o cap de 1/semana ainda não tem estado.
- `UnlockAccountModal` (modal completo): fecha pelo `onClose` do `ModalSheet`; segunda ação é `sm2Button('quiet')` "Já comprei — restaurar". `grep` por `line-through`, `riscad`, `timer`, `countdown`, `OFF`, `tabela`, `Free…Pago` devolve **nada**. Mesmo `grep` (`popular`, `line-through`, `desconto`, `economize`) em `CreditsModal.tsx` devolve **nada**.
- `functions/api/_billing.js` `PRODUCTS`: `soulmon.unlock.full` + `soulmon.credits.60/150/400`. Nenhum SKU de escudo, HP, evolução ou dia perfeito.
- `android/…/BillingPlugin.kt`: `grep setObfuscatedAccountId` devolve **nada** (WP0.6 segue aberto).

| # | O que o app faz (dossiê) | O que o Soulmon faz hoje (arquivo + símbolo) | Veredito |
|---|---|---|---|
| 1 | **Garmin Connect** (11A, PADRÃO): card de oferta no feed com `×` **no próprio card** (dispensa em um toque, permanente), **botão de largura parcial** quando os CTAs do app são de largura total, **container idêntico** ao do card não-comercial ("What's New"), acima do conteúdo mas removível. Risco declarado: ainda é o primeiro conteúdo ao abrir; dispensa permanente = uma chance por usuário. | Não há card de oferta em feed nenhum. Os três `UnlockNudge` são botões de **largura total** (`nudgeStyle: width: '100%'`) e **não têm `×`** — somem só quando a condição some. Nenhum aparece na Home (o `HomeHud.tsx` declara no cabeçalho que tirou até o contador de Créditos). | **Adotar a forma, não a posição.** O `×` por card, o botão parcial e o container-irmão entram na spec do WP5.1 para o card do relatório. A Home continua sem oferta (o risco "primeiro conteúdo ao abrir" é justamente o que não queremos). |
| 2 | **Meetup** (11A): oferece **proativamente lembrete de fim de trial** dois dias antes — "We'll remind you inside the app 2 days before the end of your trial" / "Get reminder" / "No, thanks". Único do acervo. | Não existe trial nem assinatura (anexo D §4: só `ProductType.INAPP` no `BillingPlugin.kt`; `PRODUCTS` só tem unlock e créditos). | **Vai para o WP5.4** como trava obrigatória da spec de trial (não é WP novo — é texto no documento que é do dono, D10). Rel. 06 #6 já pedia "lembrete antes de cobrar"; o dossiê dá a copy e a antecedência (2 dias). |
| 3 | **Character AI** (11A): o melhor `Skip for now` do acervo — **bold, largura total, logo abaixo do CTA**, peso tipográfico comparável ao do primário; "for now" deixa a porta aberta. | `UnlockAccountModal`: a recusa é o `onClose` do `ModalSheet` (o `×` do container) e a segunda ação é `quiet` "Já comprei — restaurar" — que é **restauração, não recusa**. Não há botão "Agora não". Mitigante: o modal **só abre por toque** (comentário de cabeçalho do arquivo: "o modal só abre por toque, nunca sozinho"), então o `×` é volta, não fuga de interrupção. | **Lacuna real, pequena.** Candidato sem número em §3 (botão "Agora não" com peso do primário). Não entra no WP5.1 porque é o modal, não o ponto de descoberta. |
| 4 | **Alan** (11A): `Charities` como aba irmã de `Avatar` — pontos de comportamento viram cosmético **ou** doação. Risco declarado: culpa assimétrica em quem escolhe o cosmético; exige infra de doação. | Bits compram só cosmético/consumível de pastinha (`utils/shop.ts`, `ShopModal` seções `items`/`bg`/`furniture`); Emblemas só cosmético (`TOURNAMENT_ITEMS`). Não há destino filantrópico. | **Não adotar.** O dossiê mesmo aponta o custo (culpa + infra). A parte transferível — "gastar em si mesmo não compete com progresso" — o Soulmon **já cumpre por construção**. |
| 5 | **Finch** (§8, `Everyday Collection` / "The items below are always available!"): anti-FOMO declarado na loja; e a Divergência do Dossiê 11 nomeia Finch como um dos três modelos do Soulmon. | O `ShopModal` tem `role="status"` com "Ganhe Bits nos minijogos." e nada declara permanência do catálogo. Rel. 06 #8 já pedia a Loja como 4º ponto de descoberta. | **Adotar a copy** no card da Loja do WP5.1: a oferta de unlock na Loja é **permanente e não conta no cap semanal** — é o canal passivo. "Sempre aqui, sem pressa" é a frase que separa card de anúncio. |
| 6 | **Convergência 11** (6+ apps: ChatGPT, Fixtured, Character AI, Mimo, Vibecode, Manus): **tabela comparativa Free vs Pago** funcionando por **privação visualizada** (`—`/`×` na coluna grátis). | `UnlockAccountModal` lista **três `Perk`** ("Sua criatura, só sua" / "Atividades sem limite" / "Reroll liberado") sem coluna "grátis". `grep` por `tabela`, `line-through`, `Free…Pago` devolve nada. | **Já evita.** Manter como regra escrita (§3 abaixo). |
| 7 | **Divergência 11** — "onde a oferta vive": fluxo (interrompe, 9 apps) · feed com `×` (Garmin) · topo permanente (9 apps de e-commerce). Conclusão do dossiê para o Soulmon: "se dinheiro nunca compra vantagem de progresso, a oferta nunca tem urgência legítima — e sem urgência legítima o paywall interruptivo não tem justificativa funcional, só extrativa." | Nenhum nudge abre sozinho; nenhum fica no topo; nenhum interrompe fluxo — os três são inline na tela onde a falta é sentida (`CreateModal`, `EditModal`, `App.tsx` view `evolution`). | **Confirma a arquitetura.** O WP5.1 acrescenta o 4º e o 5º ponto **no mesmo regime** (feed com `×`, nunca fluxo). |
| 8 | **Shopify** (11B + §4): oferta enxertada **dentro do checklist de ativação**, em cima e embaixo — "cerca o onboarding". | Onboarding (`SoulmonOnboarding`) não tem `UnlockNudge` (os únicos três pontos estão listados acima e nenhum é de onboarding). O 1º dia guiado (WP da presença) é de outro guarda, mas a regra vale: **nada de oferta no checklist**. | **Já evita; registrar como proibição** para quando o checklist de ativação existir. |
| 9 | **Deepstash** (§8B): "With Pro, you receive 2 extra freezes / week" — vende proteção contra punição que o próprio produto inventou. | Escudos de descanso são automáticos e invisíveis (`applyMissedDay`, decisão §16.1 #4 do dossiê); `PRODUCTS` não tem SKU de escudo; rel. 06 #14 os lista entre o que nunca se vende. **A única peça que ainda flerta com isso é a cura por 10 Créditos** (`handleInstantHealWithCredits`, `App.tsx`; `Row` "Curar 1 coração agora" no `CreditsModal`). | **D7 continua sendo a recomendação: remover.** O dossiê dá o nome do anti-padrão (Deepstash) para a decisão do dono. |

## 2. O dossiê muda a spec do WP5.1?

**Sim — na forma e no aceite; não no momento.** O texto atual do WP5.1 (`PLANO-MELHORIAS.md`)
diz "card fixo no fim da aba Itens" e "uma linha do pet + `UnlockNudge` novo
`reason='report'`; cap 1/semana (`offerShownWeek` no save, `isoWeekKey`)". Ele não diz
**como o card se dispensa**, **que largura tem o botão**, **em que container vive**, nem
distingue canal **passivo** (Loja) de canal **proativo** (relatório) para efeito de cap.
O Garmin responde às quatro coisas de uma vez, e o dossiê é explícito em que "as quatro
decisões são necessárias juntas".

### ONDE no fluxo os apps põem a oferta dispensável

Só um app do acervo tem oferta dispensável, e ela vive **no feed, entre conteúdo real, com
container igual ao dos vizinhos** — não em modal, não no topo fixo, não no fluxo. Para o
Soulmon, o "feed" equivalente é: (a) o **corpo do `DailyReportModal`**, entre as `rows` e
as `notes` (o card vira mais uma linha do relatório, no mesmo container das outras); e (b) o
**fim da seção `items` do `ShopModal`** (depois do último item comprável, antes do câmbio).
Nunca o primeiro elemento da tela — o próprio dossiê marca "ainda é o primeiro conteúdo ao
abrir" como o risco residual do Garmin.

### COMO comunicam valor sem ameaça

- Garmin: título de benefício ("Nutrition made easy"), duas linhas de corpo, CTA de trial;
  **zero** menção ao que a pessoa não tem.
- Character AI: recusa com peso visual próprio ("Skip for now").
- Meetup: o app **se compromete** com algo pró-usuário ("We'll remind you…").
- Finch: "always available" — retira a escassez em vez de fabricá-la.
- Rel. 06 #12/#13 (copy do repo): enquadrar como **apoio**, e dizer dentro da própria oferta
  o que **não** muda ("Pagar nunca deixa sua criatura mais forte. Não tem como.").

### Texto proposto para o WP5.1 (substitui a spec; evidência e título ficam)

> **Spec.** Dois pontos novos de descoberta, em regimes diferentes:
>
> **(a) Loja — canal PASSIVO, permanente, fora do cap.** Em `ShopModal`, para
> `accountTier === 'demo'` (prop nova `accountTier` + `onUnlock`), um card ao **fim da
> seção `items`** (nunca acima de item comprável), no **mesmo container** de item da loja
> (mesma borda/raio de `sm2`), com: título "Seu Soulmon, do seu jeito" / "Your Soulmon,
> your way"; corpo "Crie sua própria criatura a partir da sua leitura de alma — e ajude a
> manter o Soulmon vivo. Sempre aqui, sem pressa." / "Create your own creature from your
> soul reading — and help keep Soulmon alive. Always here, no rush."; **botão de largura
> parcial** (`alignSelf: 'flex-start'`, não `width: '100%'`) "Ver — R$ 29,90" / "See —
> R$ 29,90" que abre `UnlockAccountModal` com `reason='shop'`; e uma linha `sm2Hint`
> "Pagar nunca deixa sua criatura mais forte. Não tem como." / "Paying never makes your
> creature stronger. It can't." **Sem `×`** — é o `always available` do Finch; quem não
> quer, rola. Para `accountTier === 'paid'`: no mesmo lugar, uma `Row` "Créditos" que chama
> `onOpenCredits` (hoje o `CreditsModal` só abre pela `BottomNav`). O comentário de
> `HomeHud.tsx` ("continua acionável no menu e na Loja") passa a ser verdadeiro — hoje é
> falso, a Loja só tem o câmbio.
>
> **(b) Relatório — canal PROATIVO, uma vez por semana, dispensável para sempre.** Em
> `DailyReportModal`, quando **todas** valem: `report.wasPerfect`; `totalPerfectDays === 1`
> (é o **primeiro** dia perfeito vitalício — prop nova, lida do `gameState`, não do
> `report`); `accountTier === 'demo'`; `!report.welcomeBack`; `offerShownWeek !==
> isoWeekKey(report.date)`; `!offerDismissed`. Renderiza **uma linha do pet** acrescentada a
> `notes` — "Seu Soulmon cresceu porque você cresceu." / "Your Soulmon grew because you
> did." — e, logo abaixo, no **mesmo container visual das `rows`**, um card com `×` no
> canto ("Dispensar" / "Dismiss", `aria-label`), título "Quer criá-lo à sua imagem?" /
> "Want to make it truly yours?", corpo "Sua leitura de alma vira uma criatura só sua.
> Tudo que você já fez continua." / "Your soul reading becomes a creature that's only
> yours. Everything you've done stays.", **botão de largura parcial** "Ver — R$ 29,90" /
> "See — R$ 29,90" (`reason='report'`) e a linha "Pagar nunca deixa sua criatura mais
> forte. Não tem como." O `×` grava `offerDismissed: true` no save (**permanente** — é a
> decisão de negócio do Garmin: uma chance por usuário no canal proativo; a Loja continua
> sendo o canal que não some). O botão primário "Começar o dia" **não muda** de posição nem
> de largura.
>
> **Estado no save (`GameState`):** `offerShownWeek?: string` (chave `isoWeekKey`, gravada
> ao renderizar o card) e `offerDismissed?: boolean`. Ambos hidratados com `??` (campo de
> topo desconhecido não sobrevive a `hydrateSave` — ver comentário em `dailyReset.ts` sobre
> `saveDay`). **Nunca no localStorage** — o cap é regra de produto, não de aparelho (mesma
> lição de `careCaps`).
>
> **Telemetria (WP0.5):** `TELEMETRY_UNLOCK_REASON` ganha `shop: 2, report: 3`; o
> allowlist `unlock_view.reason` sobe de `max: 1` para `max: 3` (hoje o evento seria
> descartado); evento novo `unlock_dismiss { reason }`. Sem isso o funil por origem (rel. 06
> #16) não existe.
>
> **Comentários a corrigir no mesmo PR:** `UnlockAccountModal.tsx` ("só aparece nos dois
> momentos" — são três hoje, cinco depois) e `HomeHud.tsx` ("na Loja").
>
> **Aceite:** (1) nunca antes da primeira virada — por construção, o `DailyReportModal` só
> existe com `lastDayReport`, que é output exclusivo de `computeDailyReset`; teste afirma
> que `saveDay ≥ 1` em todo relatório que exibe o card; (2) nunca duas vezes na mesma
> `isoWeekKey`; (3) nunca com `welcomeBack`; (4) nunca depois de `offerDismissed`; (5)
> nunca para `paid`; (6) o card da Loja nunca aparece acima de um item comprável; (7)
> `grep -c "UnlockNudge\|reason='shop'\|reason=\"shop\"" src/components/ShopModal.tsx ≥ 1`
> e idem `report` em `DailyReportModal.tsx`; (8) nenhum dos dois cards contém coluna
> "grátis", preço riscado ou contagem regressiva (`grep -L "line-through\|countdown"`).
> Julgamento do experimento só após **30 dias** (C5 item 8, "Office Space").

**Sobre "nunca no D0", para não haver duas leituras.** Rel. 06 #4 diz que "o primeiro dia
perfeito alcançável no D0 mantém o timing". Não há conflito: o dia perfeito **acontece** no
D0, mas o relatório que o conta é **escrito na virada e visto no D1**. A regra "nunca no D0"
significa "nunca antes da primeira virada" — e o `DailyReportModal` não existe antes dela.
O onboarding, a tela inicial e o reveal continuam sem oferta.

## 3. Candidatos a WP (sem número) — só onde há lacuna real

### Candidato A — "Agora não" com peso de primário no `UnlockAccountModal`
- **Lacuna (grep):** `UnlockAccountModal.tsx` tem só `onClose` (o `×` do `ModalSheet`) e um
  `sm2Button('quiet')` "Já comprei — restaurar". Não há recusa textual.
- **Spec:** botão "Agora não" / "Not now" em `sm2Button('ghost')`, **largura igual à do
  primário**, imediatamente abaixo de "Desbloquear — R$ 29,90"; "Já comprei — restaurar"
  continua `quiet` abaixo dele. Chama `onClose` e emite `unlock_dismiss { reason }`.
  Modelo: Character AI "Skip for now" (11A).
- **Aceite:** teste de render afirma três botões na ordem Desbloquear / Agora não /
  Restaurar, e que "Agora não" não tem `opacity`/`fontSize` menor que o primário.
- **Comando:** `grep -q "Agora não" src/components/UnlockAccountModal.tsx && npx vitest run src/components/UnlockAccountModal`.
- **Por que não está no WP5.1:** é o modal (destino), não o ponto de descoberta (origem).
  Pode ir junto no mesmo PR, mas é aceite separado.

### Candidato B — Lembrete de fim de trial como trava da spec do WP5.4 (não é WP novo)
- Entra como texto no documento de assinatura/trial (D10, do dono): "o app lembra dentro
  do app **2 dias antes** do fim do trial, com botão 'Quero o lembrete' / 'Get reminder' e
  recusa 'Não, obrigado' / 'No, thanks'" (Meetup, 11A). É a única jogada de confiança do
  acervo em trial, e é compatível com "cancelar não remove nada" (C.3 #3).
- **Sem comando** — é documento, e a decisão é do dono.

### Rejeitados (registrados para não voltar)
- **Aba de doação na Loja (Alan):** custo declarado no dossiê (culpa assimétrica, infra).
- **Card de oferta na Home (Garmin literal):** o Soulmon tirou da Home até o saldo de
  Créditos (`HomeHud.tsx`, cabeçalho); pôr ali uma oferta reintroduz o "primeiro conteúdo
  ao abrir".
- **Faixa de "oferta de lançamento com contador"** (rel. 06 #3): o dossiê não tem um único
  exemplo positivo de contador; e C5 item 6 diz que desconto programado ensina a esperar.

## 4. Anti-padrões do Dossiê 11 — proibição citada e o que o Soulmon faz que evita

| App (11B) | Anti-padrão, com a copy literal do dossiê | Proibição que se aplica | O que o Soulmon faz (grep) |
|---|---|---|---|
| Vibecode | Tela cheia, sem `Skip`, só `×`; `$299.98 / month` em destaque | "nunca abre sozinho" (rel. 06 #8/#9; cabeçalho de `UnlockAccountModal.tsx`) | O modal só abre por toque num `UnlockNudge` (`onOpen` → `setUnlockReason`); nunca é interstitial. A recusa textual falta — Candidato A. |
| Manus | "Upgrade your plan for **instant** full credits" — impaciência como gatilho | "não monetizar a dor" (C.3 #7; rel. 06 #14); "dinheiro nunca compra a barra do cuidado" (C5) | A única palavra "agora" vendida é "Curar 1 coração **agora**" (`CreditsModal` `Row`, `handleInstantHealWithCredits`) — **D7: remover**. Fora isso, nada de "instantâneo" no catálogo. |
| Mimo | Ancoragem: anual pré-selecionado com `Most Popular`, mensal 60% mais caro | "promoção espaçada e imprevisível" (C5 item 6); sem double dipping (C5 item 5) | `CREDIT_PACKS` 60/150/400 (`utils/monetization.ts`) sem pílula "popular", sem pré-seleção (`grep -i popular CreditsModal.tsx` vazio). Preço único do unlock travado com `public/termos.html` (`publishedPrice.test.ts`). |
| ChatGPT | Tabela `Features / Free / Go` com `—` na coluna grátis — "privação visualizada" | Copy do que **não** muda (rel. 06 #13); Perks sem coluna grátis | `UnlockAccountModal` lista três `Perk` positivos; `grep tabela\|line-through` vazio. Regra a escrever no aceite do WP5.1 (item 8). |
| Fixtured | Seis `×` empilhados na coluna `Free`; `38% OFF`; `Skip for now` só no fim | Idem + sem desconto programado | Idem; nenhum "OFF" no código (`grep OFF UnlockAccountModal.tsx` vazio). |
| Craft | Paywall **sem preço e sem CTA** | Preço público e travado (`FULL_UNLOCK_PRICE_LABEL` ↔ `termos.html`) | O preço está no próprio `UnlockNudge` ("Desbloqueie o Soulmon completo por R$ 29,90") e no botão "Desbloquear — R$ 29,90". |
| Revolut Business | "Upgrade to unlock" sem dizer o quê, sem preço, sem `Skip` | Idem | Três perks nomeados + preço; "Já comprei — restaurar" como saída de reinstalação. |
| Tinder | Upsell **empilhado sobre outra oferta**; `$22.98` riscado → `$19.98`; `SAVE 13%` | Uma oferta por vez; sem preço riscado; cap 1/semana | Um `UnlockNudge` por tela; `line-through` inexistente; o WP5.1 fixa `offerShownWeek`. |
| Shopify | Oferta enxertada **dentro do checklist de ativação**, em cima e embaixo | Nunca no D0 / onboarding (WP5.1 aceite; rel. 06 #4/#5) | Onboarding sem nudge (os três pontos são `CreateModal`/`EditModal`/view `evolution`). Proibição registrada para o futuro checklist do 1º dia. |
| Nove apps de e-commerce | Faixa promocional permanente no topo, **zero botões de dispensa** | Ícone nunca em box; Home sem moeda paga (`HomeHud.tsx`) | A Home não mostra Créditos nem oferta; o único card permanente proposto (Loja) fica **no fim** da seção e é declarado "sempre aqui". |
| Deepstash (§8B) | "With Pro, you receive 2 extra freezes / week" — vende escudo contra punição própria | Escudos nunca à venda (rel. 06 #14); escudo invisível (§16.1 #4) | `PRODUCTS` só tem unlock + créditos; `applyMissedDay` consome escudo automaticamente; nenhum SKU de escudo, HP, evolução ou `perfectDays`. |

Convergência a evitar de propósito: **"a tabela Free vs Pago é o padrão dominante"**. É o
único lugar em que o Soulmon deve estar **contra** a maioria do acervo, e o dossiê explica
por quê: ela funciona desenhando o que a pessoa não tem.

## 5. Algum padrão sugere oferta no D0 ou no reveal?

**Sim, dois — e ambos rejeitados.**

1. **Shopify (11B)** enxerta a oferta no checklist de ativação — é oferta no D0 por
   definição. **Rejeitado** pela decisão **C.3 #1** (`docs/GUIA-EXPERIENCIA.md`): "Não
   cobrar no reveal. Value moment = 1º dia perfeito", e pelo aceite do WP5.1 ("nunca no
   D0"). O próprio dossiê o classifica ANTI-PADRÃO ("cerca o onboarding").
2. **Replika (Dossiê 1, "A silhueta, e o pedágio no clímax"; §15.1 fluxo "Creating a
   Replika")** — o quiz termina numa silhueta da criatura que "só se resolve depois do
   paywall" ("Your personalized Replika is ready" · "Annual $89.99" · "Continue"); no
   fluxo, a criatura é entregue na **última tela, atrás do paywall**. É a oferta no reveal
   em estado puro — o "seu plano está pronto" que o rel. 01 defendia. O próprio dossiê
   classifica: "a técnica é PADRÃO, a colocação é ANTI-PADRÃO" e "para o Soulmon isto é a
   linha vermelha". **Rejeitado** por **C.3 #1**, cujo argumento perdedor está registrado
   ("o quiz longo cria investimento…; reconsiderar só com dado de conversão < 1%"). Nenhum
   dado de conversão existe ainda (o funil não está instrumentado por origem — rel. 06
   #16), então a condição de reconsiderar não foi atingida. O rel. 06 #5 fecha: "cobrar ali
   contamina o momento emocional mais forte do produto". A silhueta em si (sem pedágio) é
   assunto do guarda do onboarding, não deste.

O único PADRÃO positivo do dossiê (Garmin) vive **no feed do dia a dia**, não no D0 nem no
reveal — coerente com a decisão tomada.

## 6. Estado dos WPs deste guarda (só leitura; o ledger é a fonte)

| WP | Estado | O que o dossiê mudou |
|---|---|---|
| WP0.6 | `PROPOSTO` (requer APK) — `grep setObfuscatedAccountId BillingPlugin.kt` continua vazio | Nada (o dossiê não fala de integridade de compra). Continua o mais urgente. |
| WP5.1 | `PROPOSTO` — spec **reescrita em §2** (forma Garmin: `×` por card, botão parcial, container-irmão; canal passivo vs proativo; `offerDismissed`; telemetria `reason` 2/3) | Forma e aceite; não o momento. |
| WP5.2 | `BLOQUEADO:D7` | O dossiê dá o nome do anti-padrão (Deepstash/Manus "instant") para a decisão do dono. Recomendação segue: **remover**. |
| WP5.3 | `PROPOSTO` | Nada. |
| WP5.4 | `BLOQUEADO:D10` | Ganha a trava "lembrete 2 dias antes do fim do trial" (Meetup). |

**Pontos de descoberta da oferta hoje: 3, todos de recusa** — `CreateModal.tsx`
(`isAtCap && capIsDemoBoundary`), `EditModal.tsx` (`blocked && capIsDemoBoundary`) e
`App.tsx` (view `evolution` com `demoCharacterId`). O último a entrar foi o do
**`EditModal`** (`24870bf7`, fechando o caminho que contornava o cap). Depois do WP5.1
serão **5**: dois de valor (Loja passiva, 1º dia perfeito proativo) e três de recusa.
