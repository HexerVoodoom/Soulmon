# Gate — Fase 0 (Discovery) · run `soulmon-01`

> Autor: `alpha-skeptic`. Gravado pelo orquestrador (o agente rodou sem ferramenta de escrita).
> Data: 2026-08-25. Atacou os 9 artefatos da Fase 0 **já com a correção de contexto** de `DECISOES.md`.

## VEREDITO: **FAIL**

Dois fundamentos independentes:

**(a)** A exit bar da Fase 0 exige *métrica-norte definida*, e ela **não existe** — sem definição
de "usuário ativo", sem alvo v1. `D-15` adiou a definição para este checkpoint e nada veio.

**(b)** Os 9 artefatos seguem publicados **sob a premissa falsificada**, com títulos que afirmam o
falso: `classe-regulatoria` §4 diz "com jogadores reais"; `security` §0 diz "contra jogador real".

**FAIL barato: um repasse fecha.** Os outros 4 critérios da exit bar: premissa arriscada 🟢 ·
classe regulatória 🟢 · tese 🟡 · benchmark 🟡.

---

## Objeções FATAIS

### F1 — O item nº 1 da fila derrubaria os únicos 2 usuários reais do sistema

`mapa-e-prioridades.md` §3.3 recomenda como fatia 1: *"configurar `VITE_FIREBASE_*` no projeto
Pages **atual**, republicar, e então ligar `FIREBASE_PROJECT_ID`"*.

O projeto atual **é o do DigiApp**. A variável é de servidor. `/api/save` é o mesmo endpoint
naquele host.

**Cenário concreto de falha:** o APK do DigiApp da namorada do dono passa a receber **401 em todo
save**, silenciosamente. Zero usuários do Soulmon protegidos, **2 usuários reais derrubados por um
conserto de segurança** — e era o item nº 1 da fila.

*O que refutaria:* provar que o cliente do DigiApp não fala com aquele host, ou que já embarca
login. **Nenhum artefato tem esse dado.**

> ✅ **RESOLVIDO PELO DONO no mesmo checkpoint:** ele escolheu *"começar limpo — Pages próprio, KV
> novo, sem migração"*, e a regra vira **não tocar em `digiapp-a5e`**. A objeção fatal foi
> neutralizada pela decisão, não pelo artefato.

### F2 — O gatilho de reordenação nunca disparou

`mapa` §3 abre com *"o gatilho de reordenação DISPAROU"*. A cláusula (`PROGRAMA.md:21-23`) termina
em *"porque o app já tem jogadores reais"*. **O conjuntor é falso ⇒ o gatilho nunca disparou.**
`D-01` foi ratificada com uma justificativa que a mesma página de `DECISOES.md` falsifica.

### F3 — Causa raiz: dois comentários viraram um censo

`contexto.md` §1 chamou de *"evidência convergente"* a inferência de **população** a partir de
`CLAUDE.md:69-70` (comentário sobre `CACHE_VERSION`) e `:13-15` (compatibilidade de save).
O cabeçalho do `contexto.md` declara "nada foi inferido" e viola a própria regra três linhas
abaixo. **Os 9 artefatos herdaram.**

### F4 — Uma condição de parada atravessou o gate em silêncio

`mapa` §3 escreveu: *"se o repo for público, o programa **para**"*. `D-03` respondeu **público**.
Condição cumprida, cláusula ignorada sem menção. `D-11` (keystore nova antes do envio) remove o
dano material — o defeito é processual: um stop-condition passou batido.

---

## Recalibração — o que mais muda a priorização

**A fronteira A não esvazia. Ela troca de ocupante.**

Definida como "produção hoje com jogadores reais", ela perde o predicado para o Soulmon. Mas
Soulmon e DigiApp dividem URL, KV `DIGIAPP_SAVES` e Firebase: **os únicos titulares de dado de
terceiro do sistema são as 2 pessoas do DigiApp** — e **nenhum dos 9 artefatos as modelou**, nem a
tabela de escopo de dados do `security` §2, que auditou o namespace delas sem perguntar de quem
são as outras chaves.

Consequência: **a fusão conserto+separação inverte de sinal.** A ordem certa é criar o destino
próprio primeiro e ligar a autorização **lá**, onde não há ninguém.

**Compliance recalibrado:** E1 **cai** para dívida com prazo (`D-02`) · E2 **perde o agravante
"já vale hoje"** (ninguém pode comprar Crédito ⇒ não há reroll pago acontecendo) · E8 **cai** ·
E3/E4 **não caem** (são gates de loja) · **E5/E6 SOBEM**: `D-06` (18+) transforma
`privacidade.html:111-115` ("13") de lacuna em **contradição com decisão declarada**.

**Tese nº 1 é vacuamente verdadeira.** Com numerador zero por construção e denominador zero de
fato, *"a conversão quebra primeiro"* ordena um conjunto vazio — ancorada num rascunho que o
`problem-framing` refutou no mesmo run. E `D-04` já respondeu: *o modelo fecha com folga, a
economia não é o gargalo*.

---

## Reordenação recomendada do programa

A lista priorizada **não é mais a certa**: seu critério de topo é *"dano a jogador real
acontecendo agora"* e **zero itens qualificam**.

| Run | Era | Passa a ser | Motivo |
|---|---|---|---|
| **01** | auditar | **mantém**, com repasse | corrigir contexto · definir "ativo" + alvo · podar as perguntas já respondidas · **falar com as 2 pessoas do DigiApp** |
| **02** | separar + segurança | **mantém posição, conteúdo invertido** | vira o run **mais barato**; a regra passa a ser **não tocar no DigiApp** |
| **03** | telemetria | **destravar cobrança e lançar pequeno** | é o único run que produz o fato que o produto nunca teve: **alguém que não é o dono decidindo se paga** |
| **04** | lançar | **telemetria** | sob "primeiro se bancar", bastam 4–17 unlocks/mês. Um produto que precisa da quarta venda não precisa de telemetria de coorte — precisa da venda |

Instrumentar hoje é **o termômetro de uma sala vazia**. `evidencia-comportamento` §5 mostra que a
fiação é "horas, não dias", cabendo como fatia. Para os primeiros 20 usuários, o instrumento é
`ent:*` + conversa.

*O que refutaria esta reordenação:* o dono declarar que não põe o app à frente de estranhos antes
da Fase 2. Aí lançar não sobe — mas telemetria continua sem população e deve ser adiada do mesmo
jeito.

---

## FIXÁVEIS

- **Um item com seis nomes**: O-1 / E1 / D1 / item 1 / Q1 / SEC-1. E `D-` significa
  *decisão*, *desejável*, *divergência* e *banco Cloudflare*, dependendo do artefato.
- **Três taxonomias de prioridade não mapeadas**: O-5/O-6 são 🔴-fronteira-A em `requisitos.md`,
  🟡 abaixo da linha de corte no `mapa`, e inexistentes no compliance.
- **`benchmark` §Gaps repete a premissa que `problem-framing` §41-46 refutou** — quem recebe arte
  genérica é o **pago**, não o demo.

## RUÍDO (descartado, com motivo)

P-07/P-06 do Groq (sensibilidade a 10× já rodada; move R$ 0,00 na margem do dia 0) · preços
0.3–0.4 do benchmark e o dado do Pokémon Sleep (rotulados `[indício]` pelo próprio autor, e preço
está fora de escopo por §10.7) · C8 (o próprio autor diz que o contra-argumento é mais provável) ·
ausência de STRIDE/CI/dashboard/screenshots (fase errada — isso é Builder/Sweeper, não Discovery).

---

## Ataque à orquestração

**Erro fatal de processo:** não despachar `alpha-curador-de-contexto` alegando que *"o dossiê já
existia"*. O dossiê **é exatamente o artefato que produziu a premissa falsa**. Existir dossiê é o
argumento **a favor** de despachar o curador, não contra.

**Erro fixável, e a maior alavanca por esforço do run:** não despachar pesquisa alegando *"falta de
painel"*. Havia **2 humanos alcançáveis** — um morando com o dono, usando o predecessor há meses.
Eles respondem **hoje, de graça**: H1, H2, C4, C1 e a pergunta de A.1 que três artefatos
empurraram para `soulmon-03`.

*Atenuante registrado:* o `contexto.md` declarou no topo que o dono não estava disponível. O
processo sinalizou a própria fragilidade e **ninguém tratou o sinal como bloqueio de gate**.

## Verificação executável

✅ A sonda HTTP do `security` (GET sem token → 200) é real e creditada.

❌ **Faltou o V1 do dreno de cocô** — especificado como *"executável hoje, ~20 min, não depende de
ninguém"*. É leitura de código, não mudança de produto, e teria convertido C1 de `[hipótese]` em
**fato** antes de `D-09` ser autorizada.

---

## A pergunta que o gate faria primeiro, com poder de matar o run

> **"Quando você dá push na `main` do Soulmon, o que exatamente aparece no celular da sua
> namorada?"**

Ela decide se a fronteira A tem zero pessoas ou duas, se o item nº 1 é o mais urgente ou o mais
perigoso, e se C1/C3 estão cobrando um coração de alguém **hoje**.

*Nove agentes escreveram sobre um app que compartilha URL, KV e Firebase com outro app, e ninguém
perguntou o que o outro app está servindo.*

---

## RE-GRADE (2026-08-25)

### VEREDITO: **PASS com uma ressalva** (era FAIL)

| Critério da exit bar | Antes | Agora |
|---|---|---|
| Contexto sem premissa falsa | 🔴 | 🟢 `contexto.md` §1 tem a tabela "se afirmava / por que errado / o que é verdade"; bloco `⚠️ CORREÇÃO PÓS-GATE` presente nos 10 arquivos (verificados `contexto`, `mapa`, `benchmark`) |
| Métrica-norte definida | 🔴 | 🟡 definição computável e alvo rotulado `[alvo normativo, não medido]` — mas ver O-N1 |
| Premissa arriscada nomeada | 🟢 | 🟢 |
| Classe regulatória | 🟢 | 🟢 |
| Tese | 🟡 | 🟡 (inalterado, aceitável na fase) |
| Benchmark | 🟡 | 🟢 inversão demo/pago corrigida in loco e creditada à fonte certa |

**F1 fechada** — o dono respondeu a pergunta que mataria o run (deploy separado), e o item 1 da
fila foi reescrito para "destino próprio primeiro".
**F2 fechada** — `mapa` §3 admite o conjuntor falso e reordena por outro motivo, mais preciso.
**F3 fechada.**
**F4 mudou de forma** — o stop-condition **sumiu** do `PROGRAMA.md` v2 em vez de ser resolvido.
O defeito processual (cláusula de parada que ninguém checa) continua sem dono. **FIXÁVEL.**

### Objeções novas (uma por peça)

- **O-N1 · `metrica-norte.md` — FIXÁVEL, e é a ressalva do PASS.** §1 diz que "ativo" é
  computável de `completedTasks`/`activityLog`; §5 só prevê ler `ent:*`. Esses dois campos vivem
  **dentro do save do usuário no KV**, e ler save de terceiro é exatamente a `Q5` do `mapa`,
  ainda **aberta**. *Cenário:* `soulmon-04` abre para "medir a north star" e a primeira ação é
  abrir o save de estranhos sem base legal declarada. *Refuta:* declarar em §5 a base para ler o
  save, ou marcar a métrica como "computável só via telemetria consentida".
- **`verificacao-V1.md` — está bom, e é o melhor artefato do run.** Ressalva barata: o teste vive
  só no worktree, **não versionado**. Morreu a sessão, morreu a prova. FIXÁVEL (branch com o
  teste vermelho, sem merge).
- **`NOMENCLATURA.md` — reconcilia de verdade** (o item de seis nomes vira `SM-SEC-01`; §5
  explica por que Fronteira ≠ cor ≠ fila e dá regra de fechamento). Ressalva: nenhum artefato foi
  reindexado, então é **dicionário, não canon** — depende de todo agente futuro consultar.
  RUÍDO se o briefing obrigar; FIXÁVEL se não.
- **Decisões do dono — nada a objetar.** A reordenação e a reversão do P8 são coerentes com a
  evidência.

### Consequência de recusar a pesquisa com as 2 pessoas

Ficam **permanentemente** sem resposta: H1/H2 (o produto resolve o problema de alguém que não é o
autor), C4 (o cap de 1/dia do demo é o valor pretendido — decidido sem dado), C1 (alguém já perdeu
HP pelo dreno na prática) e A.1. A única pessoa do planeta com **meses de uso** do predecessor não
será ouvida.

**Isso dói no `soulmon-03`:** o dono chega à primeira população externa sem nunca ter ouvido um
não-dono, e cada número do lançamento pequeno terá n=20 sem nenhuma leitura anterior para
contrastar. Registrado como **escolha do dono**, não como lacuna do processo.

### Risco não nomeado no `PROGRAMA.md` v2

> **"Começar limpo, sem migração" + "não tocar em `digiapp-a5e`" + "os 2 usam o DigiApp até o
> Soulmon ficar pronto" = no dia da troca, as 2 pessoas reais perdem o save.**

Nenhum dos 5 runs tem esse evento. O v2 nem o nomeia — e ele colide de frente com o requisito
recém-declarado **fundamental** ("mesma conta, mesmo save, em qualquer plataforma"), que o produto
**quebraria na sua primeira migração real**.

*Refuta:* o dono declarar que aceita começar do zero no Soulmon.

### A pergunta, de novo, com cinco minutos e poder de matar

> **"No dia em que sua namorada trocar o DigiApp pelo Soulmon, o que acontece com os meses de
> save dela — e quem escreveu isso em algum lugar?"**
