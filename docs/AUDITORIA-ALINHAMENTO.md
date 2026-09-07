# Auditoria de alinhamento — 06/09/2026

Sete agentes (os seis guardas custodiais + o product-designer) releram o corpus
de pesquisa (`docs/guia-experiencia/`, incluindo as 2460 linhas do dossiê
Mobbin) e o confrontaram com o **código de hoje**, não com o ledger. Rodaram a
suíte (223 arquivos, 3359 testes, verde) e os comandos de aceite.

O plano fechou com PROPOSTO em zero. Esta auditoria responde à pergunta
seguinte, que é outra: **o que está marcado como pronto está mesmo?**

## O achado que vale mais que os outros: o ledger mente em seis lugares

Não é desleixo, é um modo de falha com causa identificada. Os pacotes que a
rodada Mobbin **revisou de spec** foram escritos contra a spec antiga e
carimbados contra a nova. O `LEDGER.md` declara isso como o único modo de falha
grave do sistema ("marcar `VERIFICADO` sem a saída") — e com PROPOSTO em zero, o
ledger é a única coisa que o dono lê para saber se está alinhado.

| WP | Estado no ledger | Comando de aceite | Resultado real |
|---|---|---|---|
| WP5.1 | VERIFICADO | `grep -q "UnlockNudge" ShopModal.tsx DailyReportModal.tsx` | **0 no ShopModal.** `grep -q` com dois arquivos sai 0 se QUALQUER um casar — o aceite passou com metade do WP faltando |
| WP2.2 | VERIFICADO | `grep -q steadyWindow` | **0.** O símbolo se chama `pureWindow` |
| WP2.4 | VERIFICADO | "o modal não fecha sozinho" | O teste afirma o contrário: `it('some depois de 2,5s sem ninguém tocar')` |
| WP2.6 | IMPLEMENTADO | `grep -c 'constancy_pct\|"shields"'` → esperado 0 | **≥2**, nas duas chaves vetadas |
| WP4.5 | VERIFICADO | "vitrine muda com `currentSeason()`" | **0 em `shop.ts`.** A linha descreve outro pacote; o que foi entregue foi o deep-start |
| WP4.6 | IMPLEMENTADO | `test -f src/components/BestiaryPage.tsx` | **Ausente.** A ressalva do ledger culpa o Abismo; o que falta é o bestiário |

**Lição de método, para não repetir:** `grep -q A B` é OR, não AND. Um comando de
aceite tem que falhar quando o pacote está pela metade — senão ele é pior que
aceite nenhum, porque ninguém volta a olhar.

## P0 — regra quebrada ou promessa negada

1. **O Glitchtama torna a escada inteira comprável com tempo de masmorra.**
   `applySpecialItem` faz `perfectDays + 1` sem teto, sem cooldown, sem dia; a
   fonte é completar 5 andares, e `dungeon.ts` declara "runs are unlimited, no
   entry gate". Rookie→mega = 14 dias perfeitos, Ultra = +45 → **59 runs**, que
   cabem num fim de semana. `progression.ts` justifica o 45 como "consistência
   ao longo de semanas, o recurso que não cresce indefinidamente". Ele cresce.
   Conserto: teto de 1 Glitchtama por `playerDayKey`, no molde de `careCaps`.

2. **O upgrade pago mostra uma criatura no reveal e entrega outra no jogo.**
   `onRevealed` não carrega `revealSprite`; `handleUpgradeRevealed` não toca em
   `spriteLibrary`. Quando `demoCharacterId` some, `birthBatch` pede o rookie do
   zero. É o dano exato que o WP1.1 consertou, vivo na única rota de quem
   **acabou de pagar** pela promessa de "uma criatura só sua".

3. **O widget ainda cobra, na superfície mais exposta do telefone.**
   `WidgetRenderer.kt` mantém `"📋 $completed de $total feitas"`, `"⚠️ Cuide de
   mim!"` e `"N task(s) left, let's go!"` — as três frases que a spec mandou
   remover. `DigiWidgetPlugin.kt` grava `constancy_pct` e `shields`, as duas
   chaves vetadas (percentual cru é linha vermelha; `shields` na home é o
   "Streak saves 0" do Alma). E `shields`/`habit_tier_max`/`bond_level` são
   escritos e **nunca lidos**.

4. **O Renascimento é invisível para quem poderia comprá-lo.** `rebirthRefusal`
   distingue `not-paid` de `not-ultra` justamente para dar saídas diferentes, e
   tem **zero** consumidores em `.tsx`. Um jogador demo no ultra vê nada,
   enquanto o `GuideModal` promete o recurso a todos sem dizer que é pago.

## P1 — construído e mudo

5. **`weeklyMissions.ts` tem zero consumidores** — e é o único sumidouro
   planejado dos Emblemas. `TOURNAMENT_ITEMS` somam 245 Emblemas; a 3/vitória
   são ~82 vitórias e a moeda **nunca mais compra nada, para sempre**.
6. **`bestiary` é escrito no save de todo jogador e lido por ninguém** — até 36
   strings crescendo no KV de produção. É a terceira repetição do padrão que o
   próprio ledger nomeia duas vezes (WP4.15, WP4.16).
7. **`getLocalizedPrice` existe no plugin e nenhuma tela consome** — as cinco
   superfícies mostram `R$ 29,90` fixo, e a folha do Play cobra outra moeda.
8. **`applyAggregate` joga fora as props de nove eventos.** `retained {bucket}`
   vira contador único: **WP0.2 está VERIFICADO e a retenção D1/D7/D30 continua
   ilegível**, por motivo diferente do que se pensava. Idem `app_open.source`,
   que é a decisão inteira do WP0.11. ~10 linhas, só no servidor.
9. **A aura da D4 está inerte.** A decisão diz "a aura é o que dói, e só ela" —
   e ela é um `drop-shadow` de 4px num ícone de 20px, sem nome, sem
   `aria-label`, ausente do guia. Uma régua que ninguém percebe ganhando não
   pode ser a régua de perda de nada.

## P2 — fluxo e ruído

A arquitetura está certa: existe fila de intersticiais com prioridade explícita
e slot único de avisos. O problema é o que ficou **fora** das duas filas.

10. `ProtectProgressModal` monta em z-120 sob os intersticiais (z-200) e fica
    inalcançável; o `setTimeout(15s)` não cobre um check-in de ~20s.
11. A cerimônia de marco de 66 dias tem **z-index 60** — sob o check-in — e se
    auto-destrói em 2,5s. E quem pediu movimento reduzido recebe um toast igual
    ao de qualquer tarefa: reduz-se o movimento, não a pausa.
12. Evoluir abre a cerimônia (z-500) e o `EvolveTaskModal` por baixo, que
    reaparece cobrando "crie mais atividades" quando a cerimônia fecha.
13. `FirstDayCard` pede `['pet','feed','task']`, mas o save nasce com
    `foodInventory: {}` — o gesto 2 só é possível depois do gesto 3.
14. **A noite manda três pushes que se contradizem**: 20h pede execução, 22h diz
    que o pet dormiu, ~22h30 lembra de deitar. A copy das 20h ficou fora do
    `_pushCopy.js` (footgun 9) e o teste de paridade não podia vê-la.
15. **No Android o mesmo nudge chega duas vezes**: `AlarmReceiver` notifica por
    `id.hashCode()`, `fcm.js` por `tag` — tag ≠ id.
16. `'HP baixo...'` — a criatura-alma anunciando o próprio dano com o nome da
    variável, no dia em que a pessoa não conseguiu cuidar.
17. Inflação de celebração: uma conclusão qualquer aciona até 6 canais. O
    `MilestoneCeremony` diagnosticou o ruído e a resposta foi acrescentar um
    quarto registro em vez de rebaixar os outros.

## O que NÃO está quebrado

Nenhum dark pattern ativo (sem contagem regressiva, sem preço riscado, sem
"popular"); as linhas vermelhas do motor de hábitos intactas (nenhum streak que
zera, tetos e perdões no lugar, `dayKeyOf` não redefinido); o fluxo de compra
tem saída para cada falha, incluindo `order-in-use`; o chat tem o bloco `NEVER`
com precedência e allowlist que derruba o contexto inteiro; a fila de
intersticiais serializa sem descartar nada.

## Duas correções de fato neste próprio repositório

- `src/App.tsx` tem **5772 linhas**, não 4921 (CLAUDE.md). O número apodreceu de
  novo, exatamente como o próprio arquivo avisa que acontece.
- "10 eventos" de telemetria aparece em quatro documentos contra **25** no
  código — inclusive no ledger do guarda da medição. O WP0.4 existe para
  policiar isso e está VERIFICADO.

## A pergunta que ninguém aqui pode responder

**Algum evento de telemetria já foi emitido em produção?** Sem
`METRICS_ADMIN_KEY` o GET devolve 404, e o sandbox não alcança a URL real
(footgun 7). A escrita não é inerte — o KV acumula com TTL de 730 dias, nada se
perdeu. A leitura é 100% inerte: **25/25 graváveis, 0/25 legíveis.** Um `curl`
autenticado responde em dez segundos e depende de uma variável que só o dono
define.

---

# Fecho da auditoria — 07/09/2026

Os 17 achados foram trabalhados até o fim, mais a limpeza da herança do
DigiApp que o dono autorizou depois ("ninguém nunca usou o app em produção").
Suíte no fecho: **235 arquivos, 3456 testes, verde**; `tsc` do app e do
overlay limpos; `npm run build` OK.

## Os 17, com o comando que agora responde

| # | Achado | Verificação |
|---|---|---|
| 1 | Glitchtama sem teto | `GLITCHTAMA_PER_DAY` em `specialItemUse.ts`, recusa `'daily-cap'` ANTES do decremento |
| 2 | Reveal pago entrega outra criatura | `revealSprite` atravessa `handleUpgradeRevealed` |
| 3 | Widget cobra | `grep -c 'constancy_pct\|"shields"' android/**/widget/*.kt` → **0 em todos**; guard em `widgetSemCobranca.contract.test.ts` |
| 4 | Renascimento invisível | `rebirthRefusal` consumido no `App.tsx`; `not-paid` renderiza `UnlockNudge` |
| 5 | `weeklyMissions` mudo | consumido em `ShopModal.tsx` + `App.tsx`; guard de fiação exige gatilho por missão |
| 6 | `bestiary` escrito e não lido | `BestiaryCard.tsx`, com condição PRÓPRIA (não aninhada no álbum de formas) |
| 7 | Preço localizado inerte | `priceLabel.ts` consumido nas telas de compra |
| 8 | `applyAggregate` descartava props | buckets por prop em `metrics.js`; teste de cobertura evento a evento |
| 9 | Aura da D4 inerte | `pureWindow` nomeado, com rótulo, respeitando `hideMetrics` |
| 10 | `ProtectProgressModal` sob os intersticiais | gate REATIVO `interstitial === 'welcome'`, no lugar do `setTimeout(15s)` |
| 11 | Marco em z-60 e auto-dismiss | z-**300**, espera o gesto; o teste foi invertido para afirmar o aceite escrito |
| 12 | `EvolveTaskModal` por baixo da cerimônia | resolvido na fila |
| 13 | `FirstDayCard` pedia comida antes de existir | entrou na fila de avisos, em primeiro (é o mais perecível) |
| 14 | Três pushes que se contradizem | copy das 20h em `_pushCopy.js`; a noite cede a vez à janela de descanso |
| 15 | Nudge duplicado no Android | `notify(tag, 0, …)` no `AlarmReceiver`, casando com a tag do FCM |
| 16 | `'HP baixo...'` | frase removida; guard de tom em `petVoice.test.ts` |
| 17 | Inflação de celebração | canais rebaixados em vez de somado um quarto |

## Dois achados que nenhum agente pegou, e o método que os pegou

- **`isoWeekKey` rejeitava o formato de `playerDayKey`** (`Www Mmm DD YYYY` ≠
  `YYYY-MM-DD`): a oferta do WP5.1 **nunca apareceu para ninguém**, e nada
  ficava vermelho. Falha silenciosa total.
- **`purchase.reason` era descartado** pelo agregador — achado pelo teste de
  cobertura que se escreveu para o achado 8, não por leitura.

A lição de método do topo deste arquivo (`grep -q A B` é OR) tem uma segunda
metade: **aceite que só lê o código não pega parâmetro que atravessa dois
formatos.** Os dois casos acima só apareceram executando.

## Limpeza da herança do DigiApp (autorizada em 07/09/2026)

Os 57 nomes da Bandai, as 34 chaves `digiapp-*`, o binding KV, a bridge do
widget, o canal de push e as sobras de doc. Três problemas **não cosméticos**
apareceram no caminho, e nenhum estava na lista:

1. O widget Android desenhava **um personagem da Bandai** como fallback, para
   todo usuário, sempre (`R.drawable.triceramon_dot`).
2. `src/supabase/functions/server/chat.tsx` era um **segundo endpoint de LLM,
   publicado e sem autenticação**, sem nenhuma das 13 proteções da rota real e
   sem o teto de custo do `_aiGuard`. Apagado.
3. `assetlinks.json` declarava, no nosso domínio, que **outro app** é dono dos
   nossos links. Hoje, sem fingerprint, responde lista vazia — ausência é
   inconveniente; mentira é problema de segurança.

O binding aceita os DOIS nomes (`kv(env)`), então a ordem entre mergear e
clicar no painel não importa e não existe janela de queda.
