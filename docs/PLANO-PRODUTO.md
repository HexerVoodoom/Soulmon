# Plano de produto — core, objetivos, negócio e progressão

> Consolidado em 2026-08-19, depois de duas rodadas: (1) auditoria de UX, plano de negócio e desenho de progressão; (2) crítica adversarial que derrubou uma premissa central e reordenou tudo. Este documento é o que sobreviveu à segunda rodada.
>
> Complementa `PLANO-TAREFAS.md`, que é o motor já implementado. Aqui está o **porquê** e o **quando**.

---

## Parte 0 — A correção que reordenou o plano

A rodada 1 concluiu que o blocker nº1 era o onboarding: "15 telas até o usuário ver o pet, contra ~6 do Finch". A rodada 2 foi checar o código e achou o erro:

```
SoulmonOnboarding.tsx:289
if (step === STRUGGLE_STEP) { setStep(flow === 'demo' ? DEMO_PICK : 1); return; }
```

O caminho **grátis** é `intro → objetivo → luta → escolher 1 de 3 personagens → jogar`. **Quatro telas.** As 15 (ou 35) telas são o ritual do Oráculo, percorrido por quem **escolheu criar o próprio pet** — ou seja, quem já converteu ou está convertendo.

A auditoria comparou o funil pago do Soulmon com o funil grátis do Finch. O análogo correto do Finch são as nossas 4 telas de demo — e nessa comparação **já estamos à frente**. A recomendação que saiu dali ("dê um pet provisório em ≤6 telas e ofereça o Oráculo depois") descrevia, com outras palavras, **o que já está em produção**.

Lição registrada, porque vale para as próximas rodadas: **auditoria sem telemetria produz opinião com aparência de diagnóstico.** O erro não foi de raciocínio, foi de não ter um número.

### Correção da correção (ciclo de QA seguinte)

A Parte 0 acima estava **também errada**, e o erro era desta análise, não da auditoria original. Verificar `SoulmonOnboarding.tsx` isolado dá 4 telas — mas o `App.tsx` tem um **segundo gate obrigatório** depois dele:

```
App.tsx:2661  showIntro            → splash
App.tsx:2666  !hasCompletedOnboarding → SoulmonOnboarding (4 telas no demo)
App.tsx:2672  !hasCompletedTutorial   → GameTutorialFlow (6 páginas + criação obrigatória da 1ª atividade)
```

`GameTutorialFlow` tem 6 páginas de conceito (HP, comida/energia, dia perfeito, cocô/banho/sono, loja/minijogos) e um `TASK_STEP` sem opção de pular (`canFinish = effectiveCount > 0`). Somando o splash e o `WelcomePromptModal` que vem depois: **o dia 1 real são ~12 telas antes do usuário tocar em qualquer coisa** — não 4.

Ou seja: a comparação honesta com o Finch é 12 contra 6, e **o onboarding É um problema real**, ao contrário do que esta Parte 0 concluiu na primeira versão. O que continua valendo da correção original é que o ritual do Oráculo (as 15–35 telas) não é o culpado — ele é o caminho de quem já converteu. O culpado é o tutorial de 6 páginas que cobra conceito antes de qualquer contato, e cujo conteúdo já existe duplicado no `GuideModal`/`HelpModal`.

A lição, então, é mais forte do que a primeira versão sugeria: **"eu conferi no código" só vale se você conferiu o caminho inteiro.** Duas análises seguidas erraram a contagem por medir um arquivo em vez de medir a jornada.

### A contagem medida (percorrendo o app de verdade, com localStorage limpo)

Nem a correção acima acertou. Percorrendo o caminho grátis no navegador, tela a tela:

| # | Tela | Origem |
|---|---|---|
| 1 | Splash | `IntroScreen` |
| 2 | Intro (grátis × jogo completo) | `SoulmonOnboarding` |
| 3 | "O que você quer melhorar na sua vida?" | `GOAL_STEP` |
| 4 | "E o que mais atrapalha?" | `STRUGGLE_STEP` |
| 5 | Escolher 1 de 3 personagens | `DEMO_PICK` |
| 6 | **Apelido + e-mail** | `REGISTER` — nenhuma análise anterior contou esta |
| 7 | "Seu Soulmon nasceu!" | `GameTutorialFlow` |
| 8 | Criar a 1ª atividade | `TASK_STEP` |

**Oito telas**, mais o `WelcomePromptModal` depois. Antes deste ciclo eram **13** (o tutorial tinha 6 páginas de conceito em vez de 1). A comparação honesta com o Finch é 8 contra ~6 — perto, e não mais 13 contra 6.

Três contagens erradas seguidas (4, depois 12, depois 13) sobre o mesmo fluxo. O que finalmente acertou não foi ler melhor o código: foi **abrir o app com o localStorage limpo e clicar até chegar na home**. Para perguntas sobre jornada, a leitura estática é palpite; o navegador é a medida.

---

## Parte 1 — Core

> **O Soulmon é uma criatura única no mundo — gerada de quem você é — que só cresce quando você cuida da sua vida real, e que te encoraja. Ela nunca vira um cobrador, um medidor de culpa, nem um score.**

Três elementos, e nenhum é decorativo:

1. **Unicidade.** O pipeline oráculo → class-system → bestiário → sprite por IA entrega um pet que ninguém mais tem. É o ativo defensável e o motivo de compra. No Finch, todo mundo tem o mesmo passarinho.
2. **Acoplamento com esforço real.** A regra de ouro já vigente: todo parâmetro ou é alimentado por tarefa real cumprida, ou gasta recurso que veio de tarefa real.
3. **A cláusula negativa.** Endurecida nesta rodada com **"nem score"**: o jeito mais comum de virar cobrador não é punir, é *medir*. Score de sono, streak, ranking absoluto — todos já foram recusados por esse motivo.

**O que o Soulmon nunca deve virar**: app que tranca cuidado atrás de paywall recorrente; app de métricas de desempenho; gacha (o pet é identidade, não loot).

---

## Parte 2 — Objetivos

**North star: peso de esforço real concluído por usuário ativo por semana.** Mede exatamente o core — o app só vale se a vida real anda. Resistente a gaming por construção: a meta ponderada já matou o exploit das cinco tarefas triviais, e inflar o número exige concluir uma tarefa de esforço 3, cujo custo de fraude é… fazer a tarefa.

Métricas de suporte:

| Métrica | Alvo v1 | Por que |
|---|---|---|
| % da semana 2 com ≥1 conclusão real em ≥4 dos 7 dias | **≥4 de 7** | Mede se o hábito de *usar* virou hábito de *fazer*. Abrir o app não conta nada |
| Retenção D7 / D30 | 25% / 12% *(estimativa)* | Mediana do gênero é D30 ~5–8% |
| Conversão demo→pago em 14 dias | ≥3% *(estimativa)* | Mede se o pet único é desejado o bastante para pagar |
| Retorno após ausência ≥2 dias | — | A métrica-assinatura da tese anti-cobrança. Se o perdão funciona, quem some volta mais que no gênero |

### ✅ DECIDIDO em 26/08/2026 — as duas definições que faltavam

O north star acima sempre existiu; o que estava em branco eram os **dois números que o tornam
verificável**. O dono aprovou a proposta da squad, como está:

- **Usuário ativo** = concluiu **≥1 item real** (tarefa ou hábito) na semana. Deliberadamente
  NÃO é "abriu o app": a tese inteira do produto é que a vida real anda, e uma métrica que conta
  abertura mede o oposto do que se quer.
- **Alvo v1** = o usuário ativo médio atinge o **próprio `dailyGoalFor`** em **≥4 dos 7 dias**.
  É o próprio dele, não um número fixo — a meta já é ponderada por esforço, então comparar
  pessoas por contagem bruta seria premiar quem tem tarefas fáceis.

⚠️ **O que esta decisão NÃO resolve** continua valendo, e é o parágrafo abaixo: nada disso é
legível hoje. Definir a métrica não a instrumenta. A definição saiu do caminho crítico; a
instrumentação não.

**Nenhuma dessas é legível hoje.** É o achado mais duro da rodada 2: um north star que ninguém consegue medir é um slogan. Ver Parte 5.

---

## Parte 3 — Posicionamento e negócio

### O benchmark

O Finch passou de US$ 30M ARR **bootstrapped**, hoje ~US$ 4M/mês, com assinatura de US$ 9,99. Isso prova que "pet que te encoraja" é uma categoria de dezenas de milhões de dólares sem VC — exatamente o formato indie. Não precisamos de 1% dele; precisamos de 0,2%.

### O que não vale brigar

Volume de conteúdo terapêutico, polimento de arte em escala, comunidade (Tree Town) e uma máquina de assinatura otimizada há 4 anos. Um dev solo não compete em produção de conteúdo.

### Onde somos diferentes de verdade

- **Pet único por pessoa**, gerado de perfil psicométrico real. Difícil de copiar.
- **Evolução ramificada pelo tipo de esforço.** O pet do Finch cresce por qualquer coisa; o Soulmon cresce *na direção* do que você fez.
- **PT-BR nativo e preço local.** Finch a US$ 9,99/mês ≈ R$ 55/mês é proibitivo no Brasil, e não há competidor brasileiro relevante no nicho.
- **Público que o Finch não serve**: quem cresceu com Digimon/Tamagotchi e acha o Finch fofo demais. A masmorra, o torneio e a estética pixel são para essa pessoa.

> *"O Finch te dá um passarinho igual ao de todo mundo por R$ 55/mês. O Soulmon te dá uma criatura que só existe porque você existe, por um preço único."*

### Modelo — decisão revista

A rodada 1 recomendou manter compra única (R$ 29,90 / US$ 6,99 + créditos), argumentando que assinatura contradiz a tese anti-cobrança. **A rodada 2 derrubou esse argumento, e com razão:**

A tese proíbe **o pet** cobrar do usuário — culpa, score, HP como chantagem. Um paywall opcional de cosméticos não é o pet cobrando; é a loja funcionando. Usar a linha vermelha ética para justificar a decisão comercialmente mais frágil é racionalização.

O problema real da compra única é estrutural: **receita = instalações × conversão.** Não existe base instalada amortecendo um mês ruim de aquisição. Duzentas assinaturas ruins ainda pagam no mês 7; duzentas compras únicas ruins não pagam nada no mês 2. E num nicho de talvez ~300k pessoas no Brasil, compra única impõe um teto absoluto de faturamento vitalício.

**Decisão: compra única como ENTRADA + camada recorrente opcional e não-bloqueante.**

- **Desbloqueio: R$ 29,90 / US$ 6,99** (manter). Ancoragem para marketing: um mês de Finch paga o Soulmon inteiro.
- **Créditos**: manter a escada atual.
- **Estação cosmética: ~R$ 9,90/trimestre**, 100% opcional, só cosmético, nunca bloqueia mecânica nem cuidado. É a Parte 4 deste documento — a progressão e a receita recorrente são a mesma feature.
- Não mexer no preço antes de ter funil medido: subir para R$ 49,90 sem dado só troca 3% de conversão por 1,8%.

### Economia unitária *(estimativas — medir antes de confiar)*

- Custo de IA por usuário pago: **R$ 3–8** (11 formas via Higgsfield). COGS de 10–27% sobre R$ 29,90 — saudável, e travado atrás de `accountTier:'paid'`, então só quem paga gera.
- Receita líquida: ~R$ 25,40 na Play Store (15% de taxa), ~R$ 27 no funil web direto. ~~**Priorizar o funil web.**~~ ⚰️ 21/09/2026 (QA Rodada 1, `01-dossie-estado.md` §2.2): riscado porque a web **não cobra** — a frase era meta de margem e lia como estado atual; a nota abaixo é o que vale.

> **Nota de 21/09/2026 (decisão do dono, pergunta #17 do QA geral):** a web
> **hoje NÃO cobra**. A única compra que existe é pela Play (`functions/api/billing.js`
> valida o comprovante do Google); no navegador, PWA e desktop o app mostra o preço
> de referência e o desbloqueio só acontece com a conta que comprou no Android.
> A cobrança web (Pix/cartão) **entra depois do primeiro usuário real e antes de
> qualquer gasto com marketing** — "priorizar o funil web" acima é a meta de
> margem, não o estado atual. Se a decisão virar "nunca", apagar a frase de
> priorização em vez de deixar as duas coexistirem.
- Fixos: ~R$ 100–300/mês.
- Cobrir custos: ~10–15 unlocks/mês. Renda relevante (R$ 5k/mês): ~200 unlocks/mês.

**Ação de margem identificada na rodada 2:** gerar sprite **sob demanda por estágio**, não as 11 no reveal. Corta COGS, reduz exposição a reembolso da Play Store em 48h (usuário pede reembolso depois de já ter consumido 11 gerações) e conserta de quebra o spoiler de mostrar todas as formas de uma vez.

---

## Parte 4 — Progressão: Nível de Vínculo

O app tem 8 trilhas de progressão que não conversam: evolução do pet, marcos de hábito, Sonhos, missões, faixas do torneio, dificuldade da masmorra, loja/decoração, troféus de season. Falta um chão comum.

**Desenho: nível de CONTA sobre o campo `totalXP`, que já existe e está subutilizado** (hoje só soma +10 por ponto de atributo ao alimentar).

**A regra de desenho que torna isso seguro: a trilha não pode pedir nenhuma ação nova.** Ela só relê, num número único, o esforço que as trilhas já registram. É essa regra que separa o Vínculo do Habitica — no estudo de campo sobre efeitos contraproducentes da gamificação, *todos* os participantes relataram algum efeito negativo, com destaque para serem punidos pelo app justamente em dias produtivos.

**Fantasia:** "Vínculo" mede a relação dono↔pet, não o desempenho do dono. É o que torna aceitável um número que nunca desce.

**Fontes de XP** (releitura de eventos existentes): conclusão × peso de esforço, com multiplicador do tier do hábito; dia perfeito; noite dentro da janela; sonho novo e pesadelo vencido; andar e run de masmorra; partida de torneio (derrota **também** rende — falha não pune); marcos 7/21/66; fila de triagem concluída; check-in. Teto diário suave nas fontes repetíveis, que apenas para de somar, como o limite de comida — nunca um contador que desce.

**Recompensas: 100% cosméticas** — cenários, decoração, sonhos raros e **títulos** exibidos sob o nome do pet. Nunca Bits/Emblemas/Créditos em quantidade relevante (mistura moedas), nunca HP, energia, perfectDays ou vantagem de combate.

### A correção de calibragem da rodada 2

A curva proposta (`200×n×(n+1)/2`, nível 10 em ~2 meses) foi calibrada para o meio-jogo de um usuário que ainda não existe: **com D30 de 12%, 88% das pessoas nunca chegam perto do nível 10.**

**Os únicos níveis que importam economicamente são 1 a 4, na primeira semana.** A primeira recompensa cosmética visível precisa cair no **dia 1**, e a segunda no **dia 3**. Assim o Vínculo deixa de ser meta-progressão e vira mecanismo de retenção D7 — que é o pré-requisito do D30.

### Estações — o calendário sem o battle pass

A pesquisa é unânime sobre a fadiga de battle pass ("second job feeling"), e a indústria já corrigiu: **Halo Infinite tornou os passes permanentes**, Deep Rock Galactic migra o não-obtido para os sistemas normais, Helldivers 2 mantém warbonds antigos compráveis. **O valor está no calendário (motivo novo para voltar), não na expiração (medo de perder).** Ficamos com o primeiro.

Cada estação (~13 semanas): 1 cenário sazonal, 3–4 Sonhos sazonais, 1 skin de inimigo temática, 1 medalha de estação com **três caminhos alternativos** e janela de 13 semanas. **Nada sai do catálogo ao fim da estação** — o item sazonal só fica mais provável/destacado na época. FOMO vira "mais fácil agora", nunca "só agora".

Custo de produção: um fim de semana a cada três meses, porque o pipeline de sprites por IA é o trunfo do dev solo.

### A simplificação (não só somar camadas)

**Absorver as 6 Missões em "Medalhas" com tiers bronze/prata/ouro** sobre os contadores lifetime que já existem. Uma trilha a menos de conceito, e a que sobra passa a alimentar a unificadora em vez de competir com ela.

E a regra que a auditoria de UX impõe sobre este plano: **o Vínculo só entra na home se duas outras leituras saírem no mesmo PR.** O app já mostra HP em frações, energia, 3 atributos, 3 moedas, constância, escudos, adiamentos, marcos, dias perfeitos, dex de sonhos e faixas de torneio. Somar sem subtrair é como se chega no Habitica.

---

## Parte 5 — A prioridade dos próximos 30 dias

**Instrumentar o funil e testar distribuição. Só isso.**

O veredito da rodada 2 é que os três planos disputavam prioridade com argumentos qualitativos porque **não existe um dado no repositório capaz de arbitrar entre eles** — e a Parte 0 é a prova viva do custo disso: uma auditoria inteira apontou para o funil errado.

A objeção mais grave do conjunto, acima até da telemetria: **não existe hipótese de distribuição.** A projeção de 200 unlocks/mês exige ~6.500 instalações demo/mês (~220/dia), todo dia, sem verba de marketing, num app novo. Um app novo sem ASO madura tipicamente faz 5–30/dia orgânicos nos primeiros seis meses. A projeção pede 10× o cenário otimista como caso base.

O steelman existe e é forte: **o reveal do Oráculo é conteúdo nativamente viral** — criatura única gerada da alma da pessoa é formato nativo de TikTok/Reels, e o ativo já está pronto. Mas é uma hipótese, e nenhum plano continha um teste dela.

### As 30 ações do mês

1. **Semana 1 — telemetria mínima.** Cinco eventos (`install`, `demo_pick`, `first_task_done`, `unlock_view`, `purchase`) gravados na KV que já existe, via o `/api/save` que já existe. Sem SDK de terceiros, sem custo, sem PII — coerente com a postura de privacidade. Dias de trabalho, não semanas.
2. **Semanas 1–4 — teste de distribuição.** ~10 vídeos de reveal do Oráculo, medindo visualização → instalação. É o único conteúdo do app que é nativamente compartilhável.
3. **Único trabalho de produto autorizado no período** (horas, não semanas):
   - **Focus-trap e Escape nos modais custom** (`MorningCheckIn`, `TriagePile` são `div fixed` com `role="dialog"` mas o Tab vaza para a home). É bug de acessibilidade e risco de política de loja.
   - **Geração de sprite sob demanda por estágio**, em vez das 11 no reveal. Corta COGS, reduz exposição a reembolso e conserta o spoiler.

**Por que essa e não outra:** o risco hoje não é escolher o plano errado. É **construir bem três coisas para um funil vazio.** Instrumentação é a única ação com valor positivo em todos os cenários — se o onboarding for mesmo o gargalo, o dado prova e o Plano de UX vira prioridade legítima; se o gargalo for aquisição, isso aparece em 30 dias em vez de aparecer depois de seis semanas reconstruindo um onboarding que já estava certo.

---

## Parte 6 — Backlog de UX (o que sobreviveu)

Ordenado por relação impacto/custo, para depois da instrumentação. Os itens 1 e 2 estão autorizados já (Parte 5).

1. **Focus-trap + Escape nos modais custom.** (P) Acessibilidade e política de loja.
2. **Geração de sprite sob demanda.** (M) Margem + spoiler.
3. **Slot do dia único.** (M) Numa segunda que também seja dia de relatório e de pilha, o usuário vê 4 cards de meta-gestão antes da primeira tarefa. Prioridade fixa (HP > triagem > semanal > recomeço), renderizar só o primeiro, resto em "+2 avisos".
4. **Quick-add como caminho primário da criação.** (P) O campo já existe, mas convive com o formulário completo aberto. Reduz atrito da ação que gera o north star.
5. **Alimentar em 1 toque.** (P) Hoje são 2–3 toques via `ItemsWindow`; é a ação de cuidado mais frequente do gênero.
6. **Esconder atributos vírus/dado/vacina na criação** até `unlockedEvolutions.length > 1`. (P) Quem nunca viu uma evolução não sabe o que significam.
7. **Tokens de cor hardcoded** (`#22A900`, `#d9a441` em `TriagePile`) e convivência de `sm-card` com `sm-px-card`. (P) Mesma classe do footgun 10.
8. **Piso tipográfico da pixel font.** (P) Rótulos a 8–11px em Silkscreen; texto funcional deveria ficar ≥12px, com contraste verificado por pixel.
9. **Haptics + `prefers-reduced-motion`** na celebração de conclusão. (M)
10. **Bottom sheets** no lugar de modais centrados. (M) Thumb zone.

**Rejeitado, e por quê:** *feature gating* escondendo check-in/triagem/semanal nos dias 1–7. Esconder a triagem é esconder justamente a ferramenta que resolve a pilha de culpa de quem chega quebrado — e chegar quebrado é o estado em que a maioria instala um app desses.

---

## Parte 7 — Riscos

1. **Distribuição não testada.** O maior. Mitigação = Parte 5.
2. **Custo de IA / abuso de reroll.** Bem mitigado por desenho (créditos server-side, reroll a 50). Ação: medir o custo real por geração antes de qualquer marketing e travar alerta de gasto no Higgsfield.
3. **Bus factor = 1.** Repo mitiga bem (docs vivos, funções puras, testes travando teses). Pendente: keystores fora do histórico git, segredos num cofre.
4. **Regulatório BR** (ECA Digital, Lei 15.211/2025). O reroll pago com resultado aleatório precisa de texto explícito de equivalência mecânica e classificação etária correta. Barato, fazer antes da loja.
5. **SEC-3 (recibo → N contas) segue aberto de verdade.** Num modelo de compra única, vazamento de entitlement é perda direta e irrecuperável de receita. Resolver **antes** de qualquer marketing pago.
6. **Churn estrutural do gênero** (a novidade do pet esgota). A crítica ao Finch é exatamente essa: recompensas ficam repetitivas e sobra o vínculo emocional sustentando sozinho. Nossa profundidade (galhos, masmorra, torneio, estações) é a mitigação; a métrica de retorno pós-ausência é o detector precoce.

---

## Apêndice — as três teses que decidem o negócio

O produto vive ou morre por três números, e nenhum é legível hoje:

1. **Conversão demo→pago ≥ 3%**
2. **D30 ≥ 12%**
3. **Custo de IA por usuário pago ≤ R$ 8**
