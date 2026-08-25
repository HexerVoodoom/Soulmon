# Tese de negócio e unit-economics — Soulmon (run `soulmon-01`, Fase 0)

> **P3–P8 respondidas por default do HANDOFF, não por escolha explícita do dono.**
>
> **Trava do run (P4=B): não existe telemetria coletando.** Nenhum número deste documento é
> medido. Cada linha tem fórmula visível e cada entrada é rotulada `[fonte: arquivo:linha]` ou
> `[suposição]`. Onde uma faixa aparece, ela é consequência aritmética das suposições rotuladas —
> não é observação. Um modelo honesto com suposições rotuladas é entregável; um número sem
> procedência não é.
>
> **Escopo respeitado:** contexto §10.7 proíbe recomendar mudança de preço neste run
> (`docs/PLANO-PRODUTO.md:124`). Este documento **analisa a consequência do preço atual** e não
> propõe outro.

> ## ⚠️ CORREÇÃO PÓS-GATE (2026-08-25)
>
> Este documento nunca afirmou população real — todo o modelo já era construído sobre
> `[fonte]`/`[suposição]`/`[derivado]`, sem depender de "jogadores reais" existirem.
> **Nenhuma correção in loco foi necessária.**
>
> **O que a correção de contexto reforça, e onde muda a leitura de §10:**
> - **D-04 (`DECISOES.md`) já respondeu a pergunta de §10**: "Primeiro se bancar. Depois de
>   validado e testado, quer lucro." Isso resolve a dicotomia de §10 a favor da linha
>   **"precisa se bancar"** — o modelo fecha com folga (5–17 unlocks/mês), e a prioridade
>   passa a ser fechar os 🔴 de segurança/billing e lançar, não descobrir CAC/canal ainda.
> - O achado central (§0: o custo de IA não está preso ao lado pago, `generate-sprite.js`
>   não checa `accountTier`) **fica mais urgente, não menos**, com zero população paga real:
>   significa que hoje **qualquer** chamada não autenticada gera custo sem nenhum controle
>   por tier — é `requisitos.md` O-13.
> - O sizing de mercado (§6) e a análise de CAC seguem corretamente `[a definir]`/`não
>   estimável` — a correção de contexto não muda isso, porque §6 já tratava a ausência de
>   dado como fato, não como suposição a mais.

---

## 0. Conclusão primeiro (o número que enfraquece a tese)

**A intuição de que "pagamento único + custo recorrente de IA acaba dando prejuízo por usuário"
está aritmeticamente ERRADA no Soulmon — e é por isso que ela é perigosa: ela aponta para o lugar
errado.** O custo recorrente real (chat Groq, llama-3.1-8b-instant, `max_tokens: 120`) é de ordem
de **centavos por ano por usuário**. O usuário pago só passaria a dar prejuízo em **~24 meses no
cenário pessimista (uso colado no teto de 120 chats/dia) e em ~30 anos no cenário base**. Não é
aqui que o modelo quebra.

**Onde ele quebra de verdade — achado de código, não de planilha:**
`docs/PLANO-PRODUTO.md:128` afirma que o custo de IA está *"travado atrás de `accountTier:'paid'`,
então só quem paga gera"*. **Isso não é verdade no servidor.** `functions/api/generate-sprite.js:175-204`
— a rota mais cara do produto — passa **somente** por `guardAiRequest(request, env, 'sprite', id)`
(`:184`). **Não existe nenhuma checagem de `accountTier` na rota.** A única defesa é a cota do
`_aiGuard.js` (20/conta/dia, 400/dia global — `functions/api/_aiGuard.js:32-36`), e a cota por conta
é explicitamente declarada **inoperante** enquanto `FIREBASE_PROJECT_ID` estiver desligado
(`_aiGuard.js:16-19`; `docs/BILLING-SETUP.md:232-235`: *"um atacante inventa um novo [saveId] a cada
chamada e passa por baixo dela"*).

Consequência para o modelo: **o COGS não está preso ao lado pago da fronteira demo/pago.** A tese
nº 3 ("custo de IA por usuário pago ≤ R$ 8") mede a unidade errada, porque o denominador dela
("usuário pago") não é o que o servidor cobra. Isso é `[achado de código verificado]`, não hipótese.

---

## 1. Tese do negócio — 1 linha + 3 números

> **Um v-pet em que a criatura é gerada de quem a pessoa é, vendido por pagamento único de
> R$ 29,90 num nicho pt-BR que o Finch não serve — cuja viabilidade depende inteiramente de a
> aquisição se pagar, porque não existe base instalada amortecendo um mês ruim.**

| # | Número | Valor | Estado |
|---|---|---|---|
| 1 | Conversão demo→pago em 14 dias | **≥ 3%** | `[fonte: docs/PLANO-PRODUTO.md:229]` — **alvo declarado, NÃO medido** |
| 2 | Retenção D30 | **≥ 12%** | `[fonte: docs/PLANO-PRODUTO.md:230]` — **alvo declarado, NÃO medido** |
| 3 | Custo de IA por usuário pago | **≤ R$ 8** | `[fonte: docs/PLANO-PRODUTO.md:231]` — **alvo declarado, NÃO medido** |

**Nenhum dos três é medido.** `docs/PLANO-PRODUTO.md:227`: *"O produto vive ou morre por três
números, e nenhum é legível hoje."* `:88`: *"um north star que ninguém consegue medir é um slogan."*

Ressalva sobre o número 3: como mostrado em §0, ele está formulado sobre um denominador que o
servidor não implementa. **É a tese pior definida das três**, independente de estar medida ou não.

---

## 2. Modelo declarado

**Unidade = uma conta que compra o desbloqueio completo** (`soulmon.unlock.full`, não consumível,
R$ 29,90 — `[fonte: docs/BILLING-SETUP.md:81]`). O dinheiro entra **uma única vez** por conta, via
Play Billing, e vira `accountTier:'paid'` no entitlement do servidor
(`[fonte: docs/BILLING-SETUP.md:33-44]`). O dinheiro sai em duas formas: **um pulso** (geração dos
sprites das 11 formas, Higgsfield/Gemini) e **um fluxo perpétuo e pequeno** (chat Groq, enquanto a
conta existir e o app for aberto). Camadas opcionais (créditos R$ 4,90–19,90) existem mas **não
entram no modelo base** — só quem compra a mais paga a mais, então são margem incremental.

---

## 3. Fórmulas (visíveis)

```
receita_bruta_unidade   = 29,90                                    [fonte: BILLING-SETUP.md:81]
taxa_loja               = receita_bruta × 0,15                     [fonte: PLANO-PRODUTO.md:129]
receita_líquida_unidade = 29,90 × (1 − 0,15) = 25,415              → doc arredonda "~R$ 25,40"

custo_pulso_unidade     = n_sprites × preço_imagem × câmbio
                        = 11 × US$X × 5,40

custo_chat_chamada      = (tok_in/1e6 × preço_in + tok_out/1e6 × preço_out) × câmbio
custo_chat_mês          = custo_chat_chamada × chamadas_dia × 30

margem_contribuição(t)  = receita_líquida − custo_pulso − (custo_chat_mês × t)

★ MESES_ATÉ_PREJUÍZO    = (receita_líquida − custo_pulso) / custo_chat_mês

custo_fixo_mensal       = 100 a 300                                [fonte: PLANO-PRODUTO.md:130 — confirmado pelo dono: ~R$ 200/mês, DECISOES.md]
BREAKEVEN_MENSAL        = custo_fixo_mensal / margem_contribuição(0)
CAC                     = [NÃO ESTIMÁVEL — ver §6]
LTV                     ≈ receita_líquida (pagamento único, sem recorrência no modelo base)
payback                 = CAC / margem_contribuição(0)             = [NÃO CALCULÁVEL sem CAC]
```

---

## 4. Tabela de premissas

| # | Premissa | Valor (faixa) | Rótulo | Origem |
|---|---|---|---|---|
| P-01 | Preço do desbloqueio | R$ 29,90, **pagamento único** | `fonte` | `docs/BILLING-SETUP.md:81` (produto **Não consumível**) |
| P-02 | Taxa da loja | 15% | `fonte` | `docs/PLANO-PRODUTO.md:129` |
| P-03 | Receita líquida por unidade | R$ 25,42 | `derivado` | P-01 × (1 − P-02) |
| P-04 | Modelo do chat | `llama-3.1-8b-instant` | `fonte` | `functions/api/chat.js:113` |
| P-05 | Teto de saída por chamada | 120 tokens | `fonte` | `functions/api/chat.js:118` |
| P-06 | Entrada por chamada | ~450 tok (system prompt) + ~125 tok (msg, truncada em 500 chars) ≈ **575 tok** | `[suposição]` de contagem; a **estrutura** é fonte | prompt em `chat.js:47-68`; truncagem em `chat.js:94` (`minimizeForAi(message, 500)`) |
| P-07 | Preço Groq llama-3.1-8b-instant | US$ 0,05/M in · US$ 0,08/M out | **`[suposição]`** | **Nenhuma fonte no repo.** Conhecimento geral de tabela pública. Se errar por 10×, ver sensibilidade §7 |
| P-08 | Câmbio | R$ 5,40/US$ | **`[suposição]`** | Nenhuma fonte no repo |
| P-09 | Custo por chamada de chat | **R$ 0,000199** | `derivado` | (575/1e6 × 0,05 + 120/1e6 × 0,08) × 5,40 |
| P-10 | Fala idle dispara a cada | 3 min (`180000` ms) | `fonte` | `src/components/CompanionHUD.tsx:592` e `:544` |
| P-11 | Chamadas de chat por dia | 3 (otim.) / 10 (base) / **120 (pess., = o teto)** | `[suposição]` de uso; o **teto de 120** é `fonte` | teto: `functions/api/_aiGuard.js:33` (`chat.perAccount: 120`). 10/dia ≈ 30 min de app aberto sob P-10 |
| P-12 | Custo de chat por mês/usuário | R$ 0,018 / R$ 0,060 / R$ 0,717 | `derivado` | P-09 × P-11 × 30 |
| P-13 | Sprites gerados no reveal | 11 formas | `fonte` | `docs/PLANO-PRODUTO.md:128` (*"11 formas via Higgsfield"*) |
| P-14 | Custo de IA por usuário pago (pulso) | R$ 3 – R$ 8 | **`[suposição]` do próprio doc** | `docs/PLANO-PRODUTO.md:128` diz literalmente *"(estimativas — medir antes de confiar)"* (`:126`) |
| P-15 | Custo fixo mensal | R$ 100 – 300, **confirmado pelo dono em ~R$ 200/mês** | `fonte` (atualizado) | `docs/PLANO-PRODUTO.md:130`; `DECISOES.md` (25/08/2026) |
| P-16 | Cota global de sprite | 400/dia | `fonte` | `functions/api/_aiGuard.js:35` |
| P-17 | Cota por conta é inoperante hoje | verdadeiro | `fonte` | `_aiGuard.js:16-19`; `docs/BILLING-SETUP.md:232-235` |
| P-18 | `generate-sprite` **não** checa `accountTier` | verdadeiro | **`fonte` (verificado no código)** | `functions/api/generate-sprite.js:175-204` — só `guardAiRequest` em `:184` |
| P-19 | Créditos/estação sazonal | fora do modelo base | `decisão` | `docs/PLANO-PRODUTO.md:119-123` (camada *"opcional e não-bloqueante"*) |
| P-20 | Base de usuários pagos hoje | **0** | `fonte` (correção de contexto) | Billing nunca funcionou (`playBilling.ts:5-6`); Soulmon tem zero usuários de terceiro (`DECISOES.md`) |

---

## 5. O achado central — o ponto em que o usuário pago passa a dar prejuízo

```
MESES_ATÉ_PREJUÍZO = (receita_líquida − custo_pulso) / custo_chat_mês
```

| Cenário | custo_pulso (P-14) | custo_chat_mês (P-12) | Margem no dia 0 | **Meses até prejuízo** | Em anos |
|---|---|---|---|---|---|
| **Otimista** | R$ 3,00 | R$ 0,018 (3 chats/dia) | R$ 22,42 | **1.245** | ~104 anos |
| **Base** | R$ 5,50 | R$ 0,060 (10 chats/dia) | R$ 19,92 | **332** | ~28 anos |
| **Pessimista** | R$ 8,00 | R$ 0,717 (**teto de 120/dia**) | R$ 17,42 | **24** | **~2,0 anos** |

**Leitura honesta:** mesmo no cenário em que o usuário consome **100% da cota diária de chat, todo
dia, para sempre** — comportamento que nenhuma fonte observa e que o `document.hidden` guard
(`CLAUDE.md`, seção CompanionHUD) torna improvável — o usuário pago leva **dois anos** para consumir
a própria margem. No cenário base, leva mais tempo que a vida útil provável do produto.

**Portanto: pagamento-único contra custo-recorrente-de-IA NÃO é a fratura do modelo.** Registrar
isso é o resultado mais útil deste despacho, porque desarma uma preocupação que consumiria
engenharia (cotas, degradação de chat para usuários antigos) sem retorno.

**Teto de fatura, não de usuário.** O disjuntor global de chat (`_aiGuard.js:33`: 20.000/dia) limita
o dano agregado a `20.000 × R$ 0,000199 × 30` = **~R$ 119/mês** `[derivado de P-07/P-08]` — mesma
ordem de grandeza do custo fixo declarado (P-15, agora confirmado em ~R$ 200/mês). Consistente.
O de sprite é que não é: `400/dia × 30` = 12.000 gerações/mês contra um custo unitário desconhecido
— e, com zero usuários pagos reais hoje (P-20), **qualquer geração que aconteça hoje é, por
definição, não paga por ninguém**, o que torna O-13 (`requisitos.md`) mais urgente, não menos.

---

## 6. Sizing do mercado endereçável em pt-BR

### Declaração explícita: **não é estimável com o que existe no repositório.**

A única âncora quantitativa disponível é `docs/PLANO-PRODUTO.md:117`: *"num nicho de talvez ~300k
pessoas no Brasil"*. **A palavra "talvez" está no original.** Não há metodologia, fonte externa nem
derivação — é um número declarado, não apurado. Usá-lo como base de um TAM/SAM/SOM produziria
exatamente o anti-padrão que este papel existe para recusar: sizing de cima para baixo apoiado numa
fração de um número que ninguém construiu.

**O que dá para dizer com procedência**, e só isso:

| Camada | Valor | Rótulo |
|---|---|---|
| Prova de que a categoria existe e é grande | Finch: US$ 30M ARR bootstrapped, ~US$ 4M/mês, assinatura US$ 9,99 | `[fonte: docs/PLANO-PRODUTO.md:96]` — número de terceiro, não auditado aqui |
| Ambição declarada pelo dono | *"Não precisamos de 1% dele; precisamos de 0,2%"* | `[fonte: docs/PLANO-PRODUTO.md:96]` |
| Ausência de competidor local | *"não há competidor brasileiro relevante no nicho"* | `[fonte: docs/PLANO-PRODUTO.md:106]` — **afirmação sem levantamento anexo** |
| Nicho pt-BR | *"talvez ~300k"* | **`[suposição] do próprio doc, com hedge no original`** |

**O que muda a decisão, e é o único sizing que importa agora — a conta de baixo para cima:**

```
unidades_para_cobrir_fixos = custo_fixo_mensal / margem_contribuição(0)
                           = (100 a 300, confirmado ~200) / (17,42 a 22,42)
                           = 4,5 a 17,2 unlocks/mês (≈9 unlocks/mês no custo fixo confirmado de R$ 200)
```
`[derivado de P-15 e §5]` — converge com `docs/PLANO-PRODUTO.md:131` (*"~10–15 unlocks/mês"*),
o que é um bom sinal de consistência interna do doc.

```
unidades_para_renda_relevante = 5.000 / 19,92 = 251 unlocks/mês   [derivado; doc diz ~200 em :131]
```

**A pergunta que o sizing precisa responder não é "qual o TAM" — é se o dono consegue,
mês após mês, colocar 250 pessoas novas na frente do app.** Em pagamento único, essa conta
**recomeça do zero todo mês**. ⚠️ **Correção de contexto:** hoje esse número é 0/mês — não há
canal de aquisição ativo nem usuário pago algum.

### CAC: não estimável, e isso é a lacuna nº 1 do modelo, se a resposta a §10 for "precisa me pagar"

Não existe no repositório: canal de aquisição declarado, custo de aquisição observado, orçamento de
marketing (contexto §5, agora **confirmado em ~R$ 200/mês** — orçamento operacional, não de
aquisição paga declarada), nem ferramenta de analytics (contexto §8: *"Analytics: `[a definir]`"*,
segue assim). **Sem CAC, `payback` não é calculável.** Não vou inventar um.

O que se sabe é o **teto**: como LTV ≈ R$ 25,42 e não há recorrência amortecendo, **qualquer CAC
acima de ~R$ 8–12 já torna a aquisição paga estruturalmente inviável** (regra de 2–3× é convenção
do setor, `[suposição]`). Isso não é opinião sobre o canal — é a consequência aritmética de P-03.
Entregar isso ao `alpha-growth` é o handoff: **é essa a economia que o canal precisa respeitar.**

---

## 7. Sensibilidade — as duas variáveis que mais movem o resultado

Testei o efeito de piorar cada entrada em 30% sobre a **margem de contribuição no dia 0** (base:
R$ 19,92).

| Variável piorada em 30% | Nova margem | Δ | Move? |
|---|---|---|---|
| Taxa da loja (15% → 19,5%) | R$ 18,58 | −R$ 1,34 (−6,7%) | pouco |
| **Custo do pulso de sprite (R$ 5,50 → R$ 7,15)** | **R$ 18,27** | **−R$ 1,65 (−8,3%)** | **é a nº 1** |
| Preço do Groq (P-07 +30%) | R$ 19,92 | −R$ 0,00 no dia 0 | irrelevante |
| Chamadas de chat/dia (10 → 13) | R$ 19,92 | −R$ 0,00 no dia 0 | irrelevante |

**As duas variáveis que realmente decidem não estão na planilha de custo — estão no funil:**

1. **Conversão demo→pago** (tese nº 1). É linear na receita e é a única entrada com efeito de
   ordem de grandeza. 3% → 2,1% (−30%) significa **precisar de 43% mais tráfego** para a mesma
   receita. Nada no custo unitário compensa isso. ⚠️ Hoje o denominador desta tese é zero (não
   há billing funcionando), então qualquer discussão de sensibilidade sobre ela é pré-billing.
2. **Custo do pulso de sprite (P-14)**, que é 100% `[suposição]` do próprio doc e é a linha que
   `docs/PLANO-PRODUTO.md:126` manda medir antes de confiar. Se o Higgsfield custar 3× o suposto,
   R$ 5,50 vira R$ 16,50 e a margem cai para **R$ 8,92** — o modelo continua positivo, mas o
   número de unlocks para renda relevante **dobra** (de 251 para 561/mês).

**Robustez do teste de P-07** (a suposição mais frágil, sem fonte nenhuma): mesmo multiplicando o
preço do Groq por **10×**, o cenário base vai de 332 meses para **33 meses** até prejuízo, e o
pessimista de 24 meses para **2,4 meses**. Ou seja: **a conclusão de §5 depende de P-07 estar certa
dentro de uma ordem de grandeza.** Se o Groq custar 10× o suposto E o usuário colar no teto, o
modelo inverte. Essa é a única combinação que quebra a conclusão, e ela é **verificável em uma
tarde** — basta olhar a fatura do Groq.

**Declaração obrigatória:** o cenário base **não** é o único que fecha. Todos os três cenários de §5
fecham com margem positiva no dia 0. O que **não** fecha em nenhum cenário é a aquisição paga, por
falta de CAC (§6) — **e, hoje, por falta de qualquer usuário pago para adquirir mais de.**

---

## 8. Consequência estrutural: pagamento único + custo recorrente, para um dev solo

**O modelo se sustenta na unidade. Ele não se sustenta no tempo — e a causa não é o custo de IA.**

O que `docs/PLANO-PRODUTO.md:117` já nomeia corretamente, e que este modelo confirma:
> *"receita = instalações × conversão. Não existe base instalada amortecendo um mês ruim de
> aquisição. Duzentas assinaturas ruins ainda pagam no mês 7; duzentas compras únicas ruins não
> pagam nada no mês 2."*

Três consequências que o modelo torna explícitas:

1. **A retenção não gera receita neste modelo — ela gera custo.** É o inverso de um SaaS. Um
   usuário pago que fica 3 anos não paga mais nada e consome mais Groq. O D30 ≥ 12% (tese nº 2)
   **não é uma tese de receita**; é uma tese de *boca a boca e de prova social*. Isso não a torna
   menos importante, mas significa que **medir D30 e chamar isso de "saúde do negócio" é confundir
   as coisas** — em pagamento único, D30 só vira dinheiro se converter em instalação nova.
2. **Toda fuga de entitlement é perda permanente.** `docs/PLANO-PRODUTO.md:220` já diz:
   *"Num modelo de compra única, vazamento de entitlement é perda direta e irrecuperável de
   receita."* Com SEC-3 aberto (`docs/STATUS.md:518-527`, autocorrigido: *"o ✅ acima é otimista"*)
   e `PLAY_REQUIRE_ACCOUNT_BINDING` desligado (`docs/BILLING-SETUP.md:336-356`), **um recibo pode
   virar N contas pagas**. Numa assinatura, isso custa um mês; aqui custa o LTV inteiro. O modelo
   escolhido **amplifica** a gravidade do bug de billing. Só se materializa quando o billing for
   configurado — hoje não está.
3. **O dev solo não tem folga de fluxo de caixa para errar aquisição.** Com fixos de **~R$ 200/mês
   confirmados** e margem de ~R$ 20, o mês em que a aquisição falha é um mês de receita perto de
   zero — não de receita reduzida.

### Qual das 3 teses quebra primeiro

**A tese nº 1 — conversão demo→pago ≥ 3%.** E ela quebra por uma razão que está documentada como
defeito de produto, não de mercado:

> *"o produto tem o diferencial construído e não o entrega"*
> `[fonte: docs/reviews/2026-08-03/soulmon-user-researcher.md:68-69]`

O usuário **demo** percorre 4 telas e **não recebe o pet único** — que é literalmente a coisa pela
qual se pede R$ 29,90 (contexto §3). **Está sendo pedido que a pessoa pague pelo diferencial antes
de experimentá-lo.** Num pagamento único, onde receita = instalações × conversão e não há mês 7
para se recuperar, a conversão é a variável de maior alavancagem e a mais claramente comprometida
por construção — e, hoje, adicionalmente, sua base é zero. `[hipótese]` — **experimento que a
falsearia:** instrumentar o funil demo→pago (evento por tela do onboarding + evento de abertura do
`UnlockNudge` + evento de compra confirmada pelo servidor) e observar 14 dias **assim que houver
usuário de terceiro**. Se a conversão vier ≥ 3% sem entregar o diferencial ao demo, a hipótese está
errada e o problema é outro.

**Ordem em que as teses quebram, do mais provável ao menos:** nº 1 (conversão) → nº 3 (custo de IA,
mas por má definição do denominador — §0, não por valor) → nº 2 (D30, que neste modelo nem é a
tese de receita que parece ser).

---

## 9. Veredito

**Isto se paga por unidade e não se paga por mês.** A margem de contribuição é sólida
(R$ 17,42–22,42, COGS de 12–31% sobre a receita líquida) e o custo recorrente de IA é
desprezível diante dela — o pagamento único **não** é envenenado pelo Groq. O que não fecha é a
camada de cima: **sem CAC conhecido e sem funil medido, não existe payback calculável, e num
modelo sem recorrência é o payback que decide se o negócio existe.**

**A premissa que mais move o resultado e merece validação primeiro:** a **conversão demo→pago**.
Não o custo. Não o preço. A conversão — que hoje é pedida a um usuário que, por desenho do
produto, ainda não viu aquilo que está sendo vendido, e que hoje não existe em nenhum número além
de zero.

**Correção obrigatória de escopo antes de qualquer marketing** (não é recomendação de preço, é
correção de fato): fechar o buraco de §0 — `generate-sprite` cobrando COGS sem checar
`accountTier` — porque enquanto ele existir, **nenhuma medição de "custo de IA por usuário pago"
significa coisa alguma**, já que o custo não está preso ao usuário pago.

---

## 10. A pergunta de negócio — ✅ RESPONDIDA PELO DONO (25/08/2026, `D-04`)

> ### 🔴 **"Você está construindo um negócio que precisa te pagar um salário, ou um produto que precisa existir e se bancar?"**

**Resposta do dono:** *"Primeiro se bancar. Depois de validado e testado, quer lucro."*

| Resposta do dono | Veredito do modelo | Prioridade que resulta |
|---|---|---|
| **"Precisa se bancar" primeiro** | O modelo **fecha com folga**: ~4,5–17 unlocks/mês (≈9/mês no custo fixo confirmado de R$ 200), e §5 mostra que o custo recorrente não morde | **Fechar os 🔴 de segurança/billing e lançar. A economia não é o gargalo hoje.** Descobrir canal e CAC vira prioridade só depois de validado, na fase de lucro |

Isso resolve a bifurcação que este documento apresentava em aberto na versão original — não
há mais tensão entre "precisa me pagar" e "precisa se bancar": a resposta é a segunda, e ela
é a leitura mais barata e mais rápida de executar das três apresentadas.

**Perguntas de apoio, mesma família** (formato `docs/DEPENDE-DE-VOCE.md`):

| | Pergunta | Por que trava | Estado |
|---|---|---|---|
| 🟠 | Qual o **orçamento mensal de aquisição**, se houver algum? | Sem ele, `CAC` e `payback` continuam não-calculáveis, mas isso só importa na fase de lucro (pós D-04) | Orçamento operacional geral confirmado (~R$ 200/mês); aquisição paga especificamente segue `[a definir]`, e de baixa prioridade dado D-04 |
| 🟠 | Qual foi a **fatura real do Groq e do Higgsfield** nos últimos meses? | É o único dado real disponível hoje sem escrever telemetria nova, e falseia P-07 e P-14 de uma vez — as duas suposições mais frágeis do modelo (§7) | Ainda aberta |
| 🟡 | O nicho de "~300k pessoas no Brasil" (`:117`) veio de alguma fonte, ou é chute? | Decide se §6 pode virar sizing de verdade ou continua sendo declaração de não-estimabilidade | Ainda aberta |

---

## Handoffs

- **→ `alpha-growth`**: a economia que o canal precisa respeitar é **LTV ≈ R$ 25,42, sem
  recorrência**. Teto prático de CAC: **~R$ 8–12** `[suposição de convenção 2–3×]`. Não existe
  mês 7 para recuperar aquisição cara. **Com D-04 respondida, esta frente é de fase de lucro,
  não da fase atual.**
- **→ humano/decisor**: §10 está respondida (D-04). A correção de fato de §0 (O-13 em
  `requisitos.md`) segue pendente de execução.
- **Gate → `alpha-skeptic`**: as três frases que mais merecem ataque são (a) P-07, sem fonte
  alguma, que sustenta a conclusão de §5; (b) a contagem de tokens do system prompt (P-06),
  estimada por leitura; (c) a atribuição da quebra à tese nº 1, que é `[hipótese]` apoiada em
  uma citação de review, não em dado.
