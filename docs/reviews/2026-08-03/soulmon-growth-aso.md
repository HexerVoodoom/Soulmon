# soulmon-growth-aso — Revisão Soulmon
**Data:** 2026-08-03 · **Escopo:** Growth, ASO, posicionamento, nome/marca, canais de aquisição, viralidade embutida e comunidade
**Evidência analisada:** `docs/squad/00-BRIEFING.md`, `docs/squad/01-RUBRICA.md`, `docs/reviews/2026-08-03/00-CONSOLIDADO.md`, `public/manifest.json`, `index.html`, `capacitor.config.json`, `src/utils/community.ts`, varredura de `src/**` por mecanismos de compartilhamento · **17 fontes externas** (§10)

**STATUS: relatório concluído.**

---

## 1. Veredito em uma frase

**"Soulmon" é o nome de um Digimon canônico da Bandai — está na enciclopédia oficial em
`digimon.net` com selo ©BANDAI ©Toei — o que transforma o nome do produto de "risco de
confusão" em "uso literal de um personagem de terceiro", e por isso a decisão nº 1 de
growth não é a listagem de loja, é trocar o nome antes de gastar um centavo construindo
marca sobre ele.**

---

## 2. Notas da rubrica

| Dimensão | Nota | Justificativa em uma linha |
|---|---|---|
| D1 — Clareza de proposta | **2** | O manifesto se descreve como três coisas ao mesmo tempo ("productivity", "lifestyle", "games" em `public/manifest.json:24`) e a promessa "criatura que é você" não aparece em nenhum texto voltado ao público. |
| D10 — Diferenciação competitiva | **4** | O Oráculo (linha evolutiva única gerada por jogador) é um diferencial que nenhum concorrente da categoria tem — mas hoje é indefensável comercialmente porque o conteúdo gerado é derivado, e o nome é de terceiro. |
| D11 — Monetizabilidade (contribuição) | **2** | O canal de aquisição barato existe e não está construído; sem tráfego orgânico próprio, qualquer LTV precisa ser pago, e o produto não tem retenção medida para justificar CAC. |

Nota sobre D1: a nota **2** não é sobre a qualidade da ideia, é sobre a peça de copy. Não
existe hoje uma frase de posicionamento em lugar nenhum do repositório. O texto mais
próximo é a `description` do manifesto — *"Complete real-life tasks to evolve and care for
your digital companion in this retro pixel-art productivity app"* (`public/manifest.json:4`)
— que descreve a mecânica e omite a promessa. É um app de tarefas com pet. Não é o Soulmon.

---

## 3. Pontos fortes

1. **[FATO] O ativo viral existe e é raro.** Uma criatura visualmente única por usuário,
   gerada a partir de um ritual pessoal, que muda de forma conforme o comportamento real —
   isso é conteúdo compartilhável de graça, todo mês, por cada usuário. Nem Finch (pássaro
   customizável mas de biblioteca fixa) nem Habitica (avatar de peças) têm isso.
   **Competitivamente:** é o único ativo do produto que reduz CAC estruturalmente.
2. **[FATO] Já existe canal duplo montado.** PWA no Cloudflare Pages + APK via Capacitor +
   Service Worker + `InstallPrompt.tsx`. Isso permite lançar sem loja, testar copy e medir
   antes de queimar a única primeira impressão que a Play dá.
3. **[FATO] Infra de retenção séria** (push VAPID, cron por horário, alarme nativo, widget)
   — relevante para growth porque retenção é o insumo do ASO: a Play usa engajamento e
   desinstalação como sinal de ranking.
4. **Paridade, não força:** i18n pt-BR/en-US pronto (`src/translations/pt.ts`, `en.ts`).
   Permite lançar em dois mercados sem custo extra de localização de listagem. É paridade
   porque qualquer concorrente sério também tem.

---

## 4. Pontos fracos

- **[Gravidade: Bloqueante] O nome do produto é um personagem da Bandai.**
  - *Evidência:* "Soulmon" é um Digimon nível Champion, tipo Ghost, atributo Virus, com
    verbete na **enciclopédia oficial da Bandai** (`digimon.net/reference_en/detail.php?directory_name=soulmon`,
    acesso 2026-08-03), com os avisos ©BANDAI / ©Akiyoshi Hongo, Toei Animation / ©Bandai
    Namco Entertainment Inc. na própria página. Aparece também em Digimon Data Squad e no
    reboot de Digimon Adventure.
  - *Consequência:* três danos independentes, e o menor deles já basta.
    **(a) Legal:** somado ao que o consolidado já achou — prompt que nomeia Digimon
    (`src/utils/oracle.ts:2230`), 43 criaturas canônicas em `src/types/evolution-lines.ts`,
    ~50 nomes em `LEGACY_FORM_TIERS` — o nome deixa de parecer coincidência e passa a
    compor um padrão de cópia. Em disputa, padrão é o que decide intenção. **(b) ASO:** a
    SERP de "Soulmon" é 100% Digimon (wikimon, dmo.fandom, digimon.net, grindosaur). O
    produto nasce competindo por seu próprio nome contra a Bandai e perde. Toda busca de
    marca — o tráfego mais barato e de maior conversão que existe — vai para fan wikis.
    **(c) Público errado:** quem busca "Soulmon" hoje quer um Digimon fantasma, não um app
    de tarefas. Instala, não é o que queria, desinstala em 24h. Desinstalação rápida é
    exatamente o sinal que afunda ranking na Play.
  - *Agravante de contexto:* a Bandai Namco **renova ativamente** as marcas Digimon nos EUA
    (Anime News Network, 2013-05-08), **opera hoje seus próprios apps nas duas lojas**
    (`DIGIMON UP`, App Store e Google Play, acesso 2026-08-03) e **já removeu app de fã da
    Play** (caso "Digimon Unlimited"). Ou seja: o titular está presente exatamente na
    vitrine em que o Soulmon quer entrar, com incentivo comercial direto para monitorá-la.
- **[Gravidade: Bloqueante] `capacitor.config.json` publicaria o app com identidade errada e em formato rejeitável.**
  - *Evidência:* `appId: "com.digipartner.digiapp"`, `appName: "DigiApp"`,
    `server.url: "https://digiapp-a5e.pages.dev"`.
  - *Consequência:* (a) o `applicationId` é **imutável depois do primeiro publish** — subir
    assim significa carregar "digiapp" para sempre na URL da Play e no Android; (b) um
    Capacitor apontando `server.url` para um site remoto é um wrapper de webview, o padrão
    clássico reprovado pela política de **Funcionalidade Mínima** da Play; (c) o nome
    "DigiApp" é, ele próprio, mais um sinal de derivação de Digimon para um revisor humano.
- **[Gravidade: Grave] Zero mecanismos de compartilhamento no produto.**
  - *Evidência:* varredura por `navigator.share`, `toBlob`, `html2canvas`, `shareCard`,
    `inviteCode`, `referral` em `src/**` retorna **zero** ocorrências relevantes.
  - *Consequência:* o único ativo de aquisição gratuita do produto — a criatura — não tem
    nenhuma saída. Todo growth vira pago, e o produto não tem retenção medida para bancar
    CAC. É a lacuna de maior razão impacto/esforço do relatório inteiro.
- **[Gravidade: Grave] Nenhuma frase de posicionamento existe; a única que existe compete na prateleira mais cara.**
  - *Evidência:* `public/manifest.json:3-4` — "Soulmon - Gamified Productivity",
    "retro pixel-art productivity app"; `categories: ["productivity","lifestyle","games"]`.
  - *Consequência:* "gamified productivity" coloca o produto de frente com Habitica e Finch
    sem nenhum ativo de ASO, em um termo cuja dificuldade é alta ("habit tracker": iOS
    popularidade 58 / dificuldade 67; Android 51 / 61 — asomobile, jul/2026). Escolher três
    categorias no manifesto é não escolher nenhuma.
- **[Gravidade: Grave] `soulmon.com` está registrado por terceiro.**
  - *Evidência:* a requisição a `https://soulmon.com` falha com certificado de
    `*.gabia.com` (registrar sul-coreano) — domínio registrado e parqueado, não livre.
    `soulmon.com.br` está livre (registro.br, status 0, 2026-08-03). `soulmon.app` não
    resolve DNS (indício de livre, não prova).
  - *Consequência:* mesmo que se decidisse manter o nome, o `.com` — que é o que as pessoas
    digitam — exigiria compra de terceiro ou aceitação permanente de um domínio de segunda
    escolha. Some-se à SERP tomada pela Bandai e o nome não tem nenhum caminho de marca.
- **[Gravidade: Moderado] A camada de comunidade é fachada de growth sem backend confiável.**
  - *Evidência:* `src/utils/community.ts` fala com `/api/community` (Cloudflare KV) e expõe
    perfil público, diretório de jogadores, amigos, presentes e ranking — tudo por `id`
    (SHA-256 de e-mail, sem autenticação, conforme consolidado §4 item 7).
  - *Consequência:* diretório público de jogadores + envio de presentes + ausência de
    autenticação = superfície de abuso e de moderação que o projeto não tem operação para
    sustentar, e um requisito de política de dados na Play (dados de usuário compartilhados
    com terceiros) que ainda não está resolvido.
- **[Gravidade: Moderado] Sem telemetria, nenhuma decisão de canal é verificável.**
  - *Evidência:* consolidado §2.3.
  - *Consequência:* não dá para medir CPI, taxa de instalação da store listing, ou qual
    criativo funciona. Growth sem instrumentação é gasto, não investimento.

---

## 5. Benchmark de mercado

| Produto | Como resolve descoberta/posicionamento | Soulmon hoje | Lacuna |
|---|---|---|---|
| **Finch: Self-Care Pet** — [Play](https://play.google.com/store/apps/details?id=com.finch.finch), [App Store](https://apps.apple.com/us/app/finch-self-care-pet/id1528595748) (acesso 2026-08-03) | Título de 21 chars com o benefício e o mecanismo: `Finch: Self-Care Pet`. Categoria **Health & Fitness** (não Produtividade, não Jogos). +10 mi de instalações na Play; 4,95 na App Store com 550 mil avaliações; #8 US Health & Fitness. Nos **anúncios** se posiciona como *jogo*, na **loja** como autocuidado. | Sem loja, sem título, sem categoria decidida (3 no manifesto) | Falta a decisão de prateleira e a separação entre a promessa do anúncio e a promessa da loja |
| **Habitica: Gamify Your Tasks** — [Play](https://play.google.com/store/apps/details?id=com.habitrpg.android.habitica) (acesso 2026-08-03) | Título de 27 chars com o verbo da categoria (`Gamify`) + a keyword (`Tasks`). Vive da comunidade (guildas, fórum) e do open source. | Comunidade sem backend confiável | Habitica prova que gamificação de tarefas *tem* público — e também que ele é limitado a quem já gosta de RPG |
| **Pokémon Sleep** (The Pokémon Company/SELECT BUTTON) | Não faz ASO: tem a marca. É o exemplo de por que a "prateleira de nostalgia" é irresistível e inacessível — o valor está na PI, não no mecanismo | Tenta o mesmo efeito emocional sem a PI | Nenhuma. É o benchmark do que **não** se pode copiar |
| **Forest: Focus for Productivity** | Uma mecânica, uma frase, uma métrica visual (a árvore). Título carrega `Focus` e `Productivity`. | Muitos sistemas, nenhuma frase | Forest é a prova de que uma metáfora única bate uma lista de recursos |
| **Pou** | Categoria Jogos/Casual puro; público infantil global; monetização por IAP | — | Mostra o custo do outro extremo: enorme e sem intenção de mudança de comportamento |
| **Duolingo** | Marca própria + mascote como motor viral em TikTok. O Duo é um ativo de conteúdo, não um enfeite | Tem mascote único por usuário e não publica nada | Duolingo prova que a criatura é o canal, se alguém a operar |

### Como o Finch cresceu — estudo a fundo (é o caso mais próximo)

Fontes: [blog.sparrowapps.io](https://blog.sparrowapps.io/p/finch-how-a-self-care-app-hit-30m-arr-without-vc-money) e
[MediaPost](https://www.mediapost.com/publications/article/415234/self-care-app-finch-promotes-whatever-it-takes-to.html) — acesso 2026-08-03.

**[FATO]** Lançou em 2021, bootstrapped, US$ 0 de capital de risco, fundado por dois
ex-Quora (Stephanie Yuan e Thomas Budi). Chegou a **~US$ 30-40 mi de ARR**, +US$ 1 mi/mês
só no Android, +10 milhões de instalações na Play, 4,95/5 com 550 mil avaliações (85%
cinco estrelas), #8 em Health & Fitness nos EUA. Público: **75% mulheres, 25-35 anos**;
62% EUA, depois Canadá, Austrália, Reino Unido, Alemanha.

**[FATO] Cinco decisões que explicam o crescimento — e o que cada uma significa para o Soulmon:**

1. **Motor principal é mídia paga com volume brutal de criativo, não orgânico mágico.**
   Meta: ~610 criativos ativos e ~2.100 no total; crescimento de 11× em criativos ativos
   entre jan/2025 e jan/2026. TikTok Ads pesado com os mesmos criativos UGC. Isso desmonta
   a fantasia de que "o app é fofo, vai viralizar sozinho". Finch *comprou* o crescimento
   com uma máquina de criativo. **Para o Soulmon:** isso é inalcançável hoje e só faz
   sentido depois de retenção provada (gatilho numérico em §6).
2. **Posicionamento duplo deliberado: anúncio vende jogo, loja vende autocuidado.**
   Nos anúncios se apresenta como *game*; na loja é `Self-Care Pet` em Health & Fitness.
   **Para o Soulmon:** é exatamente a resposta para a tensão "Produtividade vs Jogos" —
   você não escolhe uma vez, você escolhe uma para a loja (onde a intenção de busca é de
   solução) e outra para o criativo (onde a atenção é de entretenimento).
3. **Um único canal orgânico oficial, operado com disciplina.** Uma conta TikTok
   (`@finchcare`), vídeo topo com **63,4 milhões de views**. Não é rede de embaixadores —
   é parceria paga seletiva com criadores. **Para o Soulmon:** um canal, postagem diária,
   e o ativo (a criatura de cada usuário) como matéria-prima infinita.
4. **Paywall macio com free tier generoso**, US$ 9,99/mês ou US$ 39,99-79,99/ano,
   destravando customização e loja — nunca progresso. **Para o Soulmon:** valida a leitura
   de que o cosmético é o produto vendável e o progresso não pode ser.
5. **Retenção desenhada antes da aquisição:** metas diárias com streak, sistema de
   "aventura" de 8h como gatilho de reengajamento, moeda virtual, progressão do pássaro
   (ovo → adulto), camada social de indicação. **Para o Soulmon:** o produto tem a maior
   parte disso — exceto a camada de indicação, que é justamente a de growth.

**[HIPÓTESE] A lição desconfortável.** O Finch não venceu por ter o melhor pet. Venceu por
ser gentil (o oposto do modelo de punição do Soulmon — ver consolidado §5), por escolher
uma prateleira só na loja, e por operar criativo em escala industrial. Das três, o Soulmon
hoje não faz nenhuma.

### O que copiar, o que não copiar

**Copiar:** (1) o posicionamento duplo loja/anúncio; (2) o título curto de loja que carrega
benefício + mecanismo em menos de 25 caracteres; (3) a categoria única e coerente; (4) a
conta orgânica única operada diariamente com o ativo do próprio produto; (5) o paywall
cosmético com free tier generoso.

**Não copiar:** (1) o volume de criativo pago — Finch chegou lá *depois* de retenção e
receita; copiar a ponta final de uma máquina é queimar caixa; (2) a categoria Health &
Fitness — ver §6, o Soulmon tem um argumento melhor em outra prateleira; (3) a suavidade
total. O Soulmon tem uma aposta que o Finch não tem (consequência real, degeneração) e essa
aposta é o que o torna diferente do Finch em vez de um Finch pior. Ela precisa ser
recalibrada, não apagada — e, para growth, ela é justamente o gancho de vídeo.

**Deliberadamente não copiar de Pokémon Sleep:** qualquer referência a monster taming de
marca. O consolidado já marcou isso como bloqueante; do meu lado acrescento que usar
"Digimon", "Pokémon" ou "Tamagotchi" em título, descrição, screenshots ou palavras-chave é
o caminho mais rápido de remoção pela política de **Impersonation** da Play
([Play Console Help](https://support.google.com/googleplay/android-developer/answer/9888374), acesso 2026-08-03),
que já suspendeu apps por semelhança implícita mesmo sem citar a marca no título.

---

## 6. Oportunidades e recomendações

| # | Recomendação | Problema que resolve | Impacto | Esforço | Confiança | Horizonte |
|---|---|---|---|---|---|---|
| G1 | **Trocar o nome do produto.** "Soulmon" é personagem canônico da Bandai | Bloqueante legal + SERP tomada + público errado | 5 | 3 | 5 | Agora |
| G2 | **Corrigir `capacitor.config.json`**: novo `appId` reverso do domínio novo, `appName` novo, **remover `server.url`** e empacotar o bundle localmente | `appId` imutável pós-publish + reprovação por Funcionalidade Mínima | 5 | 1 | 5 | Agora |
| G3 | **Escolher UMA prateleira e reescrever o manifesto** (`categories` com um valor, `description` com a frase de posicionamento) | D1 = 2; produto irreconhecível em 10s | 5 | 1 | 4 | Agora |
| G4 | **Cartão de evolução compartilhável** (Web Share API + canvas 1080×1350) disparado no momento da evolução | Zero saída viral para o único ativo raro | 5 | 2 | 4 | Agora |
| G5 | **Abrir uma conta TikTok e postar diariamente** com os 5 formatos de §"Canais" | CAC estruturalmente pago sem orgânico | 4 | 3 | 3 | Agora |
| G6 | **Retrospectiva mensal "sua alma em 30 dias"** — vídeo/carrossel gerado no app | Conteúdo recorrente por usuário, sem custo marginal | 5 | 3 | 4 | Próximo |
| G7 | **Código de convite com recompensa cosmética bilateral** | Loop de indicação | 3 | 3 | 3 | Próximo |
| G8 | **Lançar primeiro em PWA + APK direto, com telemetria, e só ir à loja depois de D7 ≥ 25%** | Preservar a única primeira impressão da Play | 4 | 2 | 4 | Agora |
| G9 | **Post em `r/virtualpets` e Discords de v-pet no formato "mostrando o que eu fiz"**, respeitando regra de autopromoção de cada um | Primeiros 500 usuários a custo zero | 3 | 2 | 3 | Agora |
| G10 | **Não gastar em mídia paga** até o gatilho numérico de §"Mídia paga" | Queima de caixa antes de retenção | 4 | 1 | 5 | Agora |
| G11 | **Congelar o diretório público de jogadores** até haver autenticação e política de dados | Risco de abuso, moderação e Data Safety da Play | 3 | 1 | 4 | Agora |
| G12 | **Product Hunt / HN só depois** de nome novo, arte 100% original e retenção medida | Só se tem uma estreia | 2 | 1 | 4 | Próximo |

### Detalhe das três melhores

**G1 — Trocar o nome (e o custo honesto disso).**
Reconheço o custo e ele é real: renomear toca `manifest.json`, `index.html`,
`capacitor.config.json`, 40+ arquivos em `src/**` que citam "soulmon", os dois arquivos de
tradução, os assets, o repositório GitHub, e queima o vínculo afetivo do dono com um nome
que ele escolheu. **Mas o custo é assimétrico no tempo:** hoje custa uma tarde de
`find/replace` e zero de marca perdida, porque não há usuários, avaliações, backlinks nem
menções. Depois de 10 mil instalações, custa reiniciar o ASO do zero, perder as avaliações
acumuladas (a Play preserva as avaliações na troca de *nome*, mas não na troca de
*package*) e reeducar a base. **Este é literalmente o momento mais barato que existirá para
fazer isso.**
*Critérios para o nome novo:* (a) não termina em `-mon` — o sufixo é o que carrega o gênero
*e* o risco; (b) pronunciável em pt e en; (c) `.com` livre; (d) SERP limpa (menos de ~50 mil
resultados exatos e nenhum concorrente de app na primeira página); (e) livre em busca
preliminar no INPI (classes 9 e 41) e no USPTO (classes 9 e 41); (f) handle livre em TikTok,
Instagram e Reddit. *Direções que preservam a promessa sem o sufixo:* nomes que evocam alma
+ forma viva sem citar o gênero — p.ex. famílias como **Almari**, **Anima**, **Vitalis**,
**Espiro**, **Kindra**. Não estou recomendando um específico: recomendo gerar 20 candidatos
e passar todos pelos seis filtros acima antes de escolher — a checagem é o trabalho, não o
brainstorm.
*Critério de sucesso mensurável:* nome escolhido que passa nos 6 filtros, com `.com`
registrado e os 3 handles reservados, antes de qualquer publicação.

**G4 — Cartão de evolução compartilhável.**
No instante em que a criatura evolui, o app já tem tudo: o sprite anterior, o novo, o nome
do usuário, o número de dias perfeitos e o atributo dominante. Renderizar isso num canvas
1080×1350 com uma marca discreta e chamar `navigator.share({ files: [blob] })` (com fallback
de download no desktop) é trabalho de dias, não de sprints. O ponto crítico de desenho: o
cartão precisa mostrar **o antes e o depois lado a lado** e a frase de esforço real
("14 dias perfeitos"), porque é a transformação que é compartilhável, não a criatura parada.
*Critério de sucesso:* ≥ 15% das evoluções geram um compartilhamento; ≥ 0,3 instalação
atribuída por cartão compartilhado (medir com parâmetro de campanha no link do cartão).

**G3 — Uma prateleira, uma frase.**
Ver §"Posicionamento" e o Anexo. Substituir `categories: ["productivity","lifestyle","games"]`
por um único valor e a `description` pela frase de posicionamento aprovada. É a mudança de
menor esforço e maior efeito sobre D1 no produto inteiro.
*Critério de sucesso:* em teste de 5 segundos com 10 pessoas de fora, ≥ 7 conseguem dizer
para que serve o app e para quem é.

---

## POSICIONAMENTO — a decisão estratégica

### A recomendação: **"Pet virtual que só cresce se você crescer"** (prateleira de care)

Escolho a prateleira do meio e recuso as outras duas explicitamente.

**Por que não "App de tarefas com pet" (produtividade).**
Tamanho de público: grande. Dificuldade de aquisição: **proibitiva**. "habit tracker" tem
dificuldade 67 no iOS e 61 no Android (asomobile, jul/2026) e o topo é ocupado por apps
estabelecidos; um app sem nenhuma avaliação não entra em top-10 de termo assim em menos de
um ano. Pior: a intenção de quem busca "app de tarefas" é **funcional** — quer campo de
texto, recorrência, lembrete, integração com calendário. O Soulmon perde essa comparação de
frente para o Todoist e o Google Tasks, porque ele não é isso, e a promessa vira falsa. E
promessa falsa gera desinstalação em 24h — que é o sinal que mais afunda ranking.

**Por que não "Digimon da vida real" (nostalgia/monster taming).**
Maior potencial viral e **risco de PI direto**, agora agravado: o produto se chama como um
Digimon, gera arte por prompt que nomeia Digimon, e tem 90+ nomes canônicos no código.
Adotar essa prateleira publicamente é assinar a confissão. Além disso, o público de
nostalgia converte para *entretenimento*, não para mudança de hábito — retém enquanto é
novidade e sai quando o app pede esforço real. **O jeito certo de captar essa energia sem a
marca está em §"Canais".**

**Por que "Pet virtual que só cresce se você crescer".**
- **Tamanho de público:** o Finch prova o tamanho — +10 milhões de instalações na Play e
  ~US$ 30-40 mi de ARR num app de pet de autocuidado, sem PI, sem VC, em cinco anos
  (sparrowapps, acesso 2026-08-03). O público existe, é grande, é jovem, é
  majoritariamente feminino (75% mulheres 25-35 no Finch) e está comprovadamente disposto a
  pagar assinatura.
- **Dificuldade de aquisição:** média, e é a única das três em que o Soulmon tem vantagem
  competitiva real. As palavras da prateleira ("bichinho virtual", "virtual pet",
  "self care pet") têm concorrência muito menor que "habit tracker" e intenção
  emocional em vez de funcional — que é exatamente o que o produto entrega bem.
- **Credibilidade da promessa:** esta é a razão decisiva. O produto **realmente** faz o que
  essa frase diz. A criatura cresce por comportamento real, regride por abandono, e nasce de
  um ritual sobre quem você é. É a única das três frases que o código sustenta hoje sem
  mentir. E é a que faz o diferencial (o Oráculo) ser o argumento, e não um detalhe.
- **E ela contém o núcleo sem prometer produtividade:** "só cresce se você crescer" implica
  tarefas sem prometer ser um gerenciador de tarefas. Mantém a hierarquia do briefing
  (camada 1 é o núcleo) sem se vender pela camada 1.

**Frase de posicionamento (uma linha, para colar em todo lugar):**
> **pt-BR:** "Uma criatura que nasce de quem você é e só cresce quando você cresce de verdade."
> **en-US:** "A creature born from who you are — it only grows when you actually do."

**A ressalva do Finch (posicionamento duplo).** Loja = care. **Anúncio e TikTok = criatura
e transformação**, com energia de monster taming — sem citar marca nenhuma. É o que o Finch
faz (loja: self-care; anúncio: jogo) e é o que resolve a tensão sem escolher errado.

---

## CATEGORIA DE LOJA — recomendação e argumento

**Recomendo: Google Play → `Estilo de vida` (Lifestyle). App Store → `Estilo de Vida`.**
Segunda opção defensável: `Saúde e fitness`. **Recuso Produtividade e recuso Jogos.**

| Categoria | Argumento a favor | Argumento contra | Veredito |
|---|---|---|---|
| **Produtividade** | Onde está o núcleo real (tarefas) | Concorrência com Todoist/Notion/Google Tasks, cuja régua é integração e sincronia — o Soulmon perde de frente. Público de intenção funcional desinstala rápido um app que pede ritual de 7 perguntas antes de deixar criar uma tarefa | **Não** |
| **Jogos / Casual** | Onde a criatura brilha; menor atrito de expectativa | Régua de qualidade de jogo (o Soulmon perde para qualquer casual de estúdio); público de jogo não busca mudança de hábito; e **atrai auditoria mais dura de PI**, porque é a vitrine onde Bandai/Nintendo monitoram. Além disso, empurra para IARC mais restritivo e para a expectativa de IAP de progresso | **Não** |
| **Estilo de vida** | Mesma prateleira conceitual em que o Finch venceu (ele escolheu Health & Fitness, adjacente); intenção emocional; concorrência menos brutal; nenhuma promessa funcional a cumprir; permite a palavra "hábito" na descrição sem competir em "habit tracker" | Menos tráfego de busca de alta intenção que Produtividade | **Sim** |
| Saúde e fitness | É onde o Finch está de fato, com #8 nos EUA | Exige tom de bem-estar/saúde mental que o Soulmon **não** entrega hoje (o produto pune; ver consolidado §5). Prometer bem-estar e entregar perda de HP é a promessa falsa que eu proibi acima | Só depois de recalibrar a punição |

**Classificação etária pretendida:** **Livre / 3+ (PEGI 3, ESRB Everyone, IARC "Livre")**,
com a ressalva de que o questionário IARC precisa declarar **interação entre usuários** e
**compartilhamento de dados** — e hoje o diretório público de `community.ts` sem
autenticação torna essa declaração verdadeira e arriscada. **Implicação prática:** com
classificação Livre e interação de usuários declarada, o app entra no escopo da política de
Famílias da Play e das regras de dados de menores (e, no Brasil, do ECA e da LGPD art. 14).
Duas saídas: (a) congelar o diretório público até haver autenticação e moderação — é o que
recomendo (G11); ou (b) mirar **12+** e desativar a interação para menores. Recomendo (a) +
Livre/3+, porque é a que não fecha portas de descoberta.

---

## CANAIS DE AQUISIÇÃO — priorizados por custo

**Ordem de prioridade: 1) TikTok/Reels/Shorts orgânico · 2) Comunidades de nicho · 3) Criadores de nicho · 4) Product Hunt/HN · 5) Mídia paga (bloqueada por gatilho).**

### 1. TikTok / Reels / Shorts orgânico — o canal de maior alavanca

**Por que aqui:** custo marginal ~zero; é onde está o público 20-35 do Finch; e o produto
gera, sozinho, o insumo que a plataforma premia — transformação visual ao longo do tempo.
O vídeo topo do `@finchcare` fez **63,4 milhões de views** com um pássaro. O Soulmon tem uma
criatura **diferente para cada pessoa** — matéria-prima que o Finch não tem.

**Os 5 formatos concretos e testáveis:**

1. **"O que meu mês fez com ela" (antes/depois de 30 dias).** Split-screen: sprite do dia 1
   à esquerda, dia 30 à direita, com o contador de dias perfeitos subindo em overlay.
   Áudio: música de nostalgia lo-fi. *Hipótese testada:* transformação visual retém até o
   fim. *Métrica:* taxa de conclusão > 60%.
2. **"Ela nasceu das minhas respostas" (o Oráculo em 20s).** Gravação de tela do ritual de
   origem com as respostas reais visíveis, cortando para o momento do ovo eclodindo.
   *Hipótese:* personalização gera comentário "quero fazer o meu". *Métrica:* comentários
   por 1.000 views > 8.
3. **"Eu falhei três dias e olha o que aconteceu."** O formato mais arriscado e o de maior
   potencial: mostra a degeneração. É honesto, é o oposto do marketing de app de hábito, e
   é exatamente o que gera stitch e duet ("nunca deixe seu bichinho assim"). *Hipótese:* a
   consequência real é o gancho, não o defeito. *Métrica:* compartilhamentos por view.
4. **"POV: seu app de tarefas te olha com decepção."** Formato de humor/relato, som em alta
   do momento, sprite reagindo. Barato de produzir em volume (é o formato de repetição
   diária). *Hipótese:* volume vence; um em vinte estoura. *Métrica:* nº de vídeos com
   > 50 mil views por 30 postados.
5. **"Mostra a sua" — série de reação a criaturas de usuários.** Repost de cartões de
   evolução enviados pela comunidade, com comentário. *Hipótese:* transforma usuário em
   produtor de conteúdo e fecha o loop com G4. *Métrica:* nº de submissões espontâneas/semana.

**Operação mínima honesta:** 1 conta, 1 vídeo/dia útil, 20 min/dia de edição. Menos que
isso não gera sinal. Os formatos 1, 3 e 5 dependem de G4 (cartão compartilhável) para
escalar sem o dono gravar tudo à mão.

### 2. Comunidades de nicho — os primeiros 500 usuários

| Comunidade | Abordagem certa | O que **não** fazer |
|---|---|---|
| `r/virtualpets` | Post de *showcase* ("fiz um v-pet que evolui pelas minhas tarefas reais, com uma criatura diferente por pessoa"), com GIF, respondendo a todos os comentários. Comunidades de v-pet são pequenas e receptivas a criação original | Postar link como primeira linha; postar sem histórico de conta |
| `r/ADHD`, `r/getdisciplined` | **Só participar, nunca divulgar sem convite.** Estes subs têm regra dura contra autopromoção e o público é sensível a monetização de sofrimento. O caminho é responder dúvidas por semanas e mencionar o app só se perguntarem | Qualquer post que pareça marketing. É banimento e prejuízo reputacional |
| `r/digimon`, `r/tamagotchi` | **Não postar.** Risco de PI direto e de sinalizar derivação para exatamente quem reporta | Tudo |
| Discords de v-pet / Tamagotchi | Entrar como membro, canal `#self-promo` quando existir, sempre com arte original | Confundir canal de divulgação com canal geral |
| `r/gamedev`, `r/SideProject` | Devlog honesto ("como gero uma linha evolutiva única por jogador") — o processo é o conteúdo | Pedir instalações |

### 3. Nostalgia de v-pet **sem** usar as marcas

O público existe e é enorme; a marca é proibida. A ponte legítima é **o gênero e a época**,
não os títulos: "v-pet", "bichinho virtual de bolso", "pixel art de 1997", "criatura que
evolui e regride", "cuidar, alimentar, limpar". São descrições de mecânica e de estética —
não são marcas de ninguém. Isso capta a busca nostálgica pela porta de trás sem escrever
nenhuma palavra que a política de Impersonation da Play alcança. **Regra rígida para toda a
equipe:** nenhuma das palavras Digimon, Pokémon, Tamagotchi, Digivice, Neopets aparece em
título, descrição curta ou longa, screenshots, vídeo, nome de campanha ou legenda de post.
Nem como "inspirado em".

### 4. Criadores de nicho
Produtividade/TDAH (pt-BR), study-tok e "romanticize your life" (en-US), nostalgia gamer.
Formato de menor custo: **presentear acesso antecipado + um cosmético exclusivo**, sem
cachê, com 10-20 microcriadores (5-50 mil seguidores). Só depois de G4 existir — senão o
criador não tem o que mostrar.

### 5. Product Hunt / Reddit / HN
Só com nome novo, arte 100% original e um número de retenção para mostrar. **Você tem uma
estreia.** O ângulo notável não é "app de tarefas com pet" (entediante no PH), é
**"cada usuário recebe uma linha evolutiva gerada só para ele"** — isso é o que a audiência
de PH acha interessante.

### 6. Mídia paga — bloqueada, com gatilho numérico explícito

**Não gastar um centavo em anúncio até que, com telemetria instalada, o produto atinja
simultaneamente:**
- **D1 ≥ 40%**, **D7 ≥ 25%** e **D30 ≥ 12%** numa coorte de pelo menos 300 instalações
  orgânicas; **e**
- **≥ 35% dos instalados chegam à primeira evolução** (o que hoje, a 10 dias perfeitos, é
  matematicamente improvável — ver consolidado §2.2); **e**
- monetização ativa com **LTV 90 dias > 3× o CPI estimado**.

**Por quê:** anúncio compra instalação, não hábito. Com a curva atual (primeira evolução a
10 dias perfeitos) e a punição atual, cada real gasto compra um usuário que sai antes da
recompensa. Isso não é "growth lento", é converter caixa em churn — e ainda envenena o
ranking com desinstalações. O Finch só escalou criativo *depois* de US$ 1 mi/mês de receita.

### 7. PWA vs. loja — estratégia de canal duplo

**Recomendo lançar em PWA + APK direto primeiro** (G8), e ir à loja depois.
*Ganha:* iteração diária sem revisão; nenhuma primeira impressão queimada; sem taxa de 15-30%;
tempo para terminar a limpeza de PI e a troca de nome; e o `InstallPrompt.tsx` já existe.
*Perde:* descoberta orgânica (a loja é a busca), confiança (usuário brasileiro desconfia de
APK fora da loja — e com razão), push no iOS limitado, e nenhuma review social.
*Regra prática:* PWA é para **os primeiros 500-2.000 usuários vindos de comunidade e
TikTok**, onde o link já vem com contexto e confiança do criador. Loja é para tráfego frio.
Não se lança em loja para conseguir os primeiros usuários — lança-se em loja quando já se
sabe que o produto retém os que chegam.

---

## VIRALIDADE E COMPARTILHAMENTO EMBUTIDOS — priorizados por esforço × alcance

**[FATO] Estado atual: zero.** Nenhuma ocorrência de `navigator.share`, geração de imagem,
código de convite ou link de referência em `src/**`.

| # | Mecanismo | Esforço | Alcance | Razão | Quando |
|---|---|---|---|---|---|
| V1 | **Cartão de evolução compartilhável** (antes/depois + nº de dias perfeitos, canvas 1080×1350, Web Share API, marca discreta + URL curta) | Baixo | Alto | **melhor** | Agora |
| V2 | **Link/QR do perfil da criatura** — página pública read-only (`/c/<slug>`) com sprite, estágio, atributo e dias perfeitos, com Open Graph image | Baixo | Médio-alto | ótima | Agora |
| V3 | **Retrospectiva mensal "minha alma em 30 dias"** — carrossel/vídeo de 6 quadros gerado no dia 1 de cada mês, com push dedicado | Médio | Alto | ótima | Próximo |
| V4 | **Código de convite** com cosmético bilateral (quem convida e quem entra ganham um cenário) | Médio | Médio | boa | Próximo |
| V5 | **Cartão de degeneração / retorno** — "ela voltou" depois de uma ausência. Emocionalmente o mais forte do conjunto e o que casa com o fluxo de retorno pedido no consolidado §5.1 | Médio | Médio-alto | boa | Próximo |
| V6 | **Comparação com amigos** (streak lado a lado) | Alto (exige contas reais) | Médio | fraca agora | Depois |
| V7 | **Feed público de criaturas** | Alto (exige moderação contínua) | Médio | **pior** | Depois |

**Regra de desenho que vale para todos:** o compartilhável nunca é a criatura parada — é a
**diferença** (antes/depois, queda/recuperação, 30 dias). Sprite estático não conta
história; transformação conta. E toda imagem exportada precisa carregar o nome novo do
produto e uma URL curta legível, porque o cartão *é* o anúncio.

**Coordenação com `soulmon-product-designer`:** V1 e V5 exigem um momento de celebração/
reconhecimento desenhado no app, não um botão "compartilhar" escondido no menu. O gatilho é
o pico emocional, e ele dura segundos.

---

## COMUNIDADE — o mínimo viável

**O que existe:** `src/utils/community.ts` + `functions/api/community.js` com perfil
público, diretório de jogadores buscável, amigos, presentes de Bits, torneio PvP assíncrono
e ranking sazonal (`src/components/TournamentPage.tsx`).

**Avaliação honesta do custo de moderação:** um diretório público de jogadores com nomes
livres, sem autenticação, é uma superfície de: nomes ofensivos, personificação, spam de
presentes e raspagem. Isso é **operação contínua diária**, não recurso. Um projeto de uma
pessoa não sustenta isso e, se não sustentar, vira um passivo de política de loja.

**Recomendação — mínimo viável, nesta ordem:**
1. **Agora:** congelar o diretório público e o envio de presentes (G11). Manter torneio e
   ranking apenas com identificadores anônimos gerados pelo sistema (sem nome digitado).
2. **Agora:** **um servidor Discord**, com 3 canais (`#mostre-sua-criatura`, `#bugs`,
   `#sugestões`) e regras curtas. Custo real: ~30 min/dia. O canal `#mostre-sua-criatura`
   alimenta o formato de vídeo nº 5 — comunidade e conteúdo pela mesma operação.
3. **Próximo:** reabrir perfis públicos só depois de contas reais + moderação de nome
   (lista de bloqueio + denúncia) + política de dados publicada.

Não recomendo feed in-app agora. Feed é a forma mais cara de comunidade e a que mais gera
obrigação de moderação em app com classificação Livre.

---

## 7. O que falta para ser um produto de sucesso (do meu ângulo)

1. **Um nome que possa ser marca.** Hoje o produto se chama como um personagem da Bandai,
   com o `.com` tomado e a primeira página do Google inteiramente ocupada por fan wikis de
   Digimon. Nenhum trabalho de ASO, conteúdo ou mídia rende sobre essa base.
2. **Uma frase e uma prateleira.** Três categorias no manifesto e uma descrição de mecânica
   significam que ninguém entende o produto em 10 segundos — e ninguém compartilha o que
   não sabe descrever.
3. **Uma saída para o ativo viral.** A criatura única é o único motivo pelo qual este
   produto poderia crescer sem dinheiro, e ela não tem um único botão de compartilhar.
4. **Retenção antes de aquisição.** Com a primeira evolução a 10 dias perfeitos, qualquer
   investimento em aquisição hoje compra churn. A ordem correta é: PI → nome → curva →
   telemetria → viral embutido → loja → mídia paga. Nesta ordem, sem pular.
5. **Fora do escopo do squad e ninguém cobriu:** o **custo operacional da conta de TikTok**.
   Um vídeo/dia útil é o canal mais barato em dinheiro e o mais caro em tempo do dono. Se
   essa hora/dia não existir na agenda real, o plano de canais acima é ficção e a resposta
   honesta passa a ser mídia paga — que está bloqueada por falta de retenção. Isso é uma
   decisão de capacidade, não de estratégia, e precisa ser tomada explicitamente.

---

## 8. Discordâncias e riscos da minha própria análise

- **Discordo do consolidado na ordem de duas tarefas.** O consolidado corta "ASO e listagem
  de loja" da onda Agora por dependerem da limpeza de PI (§6). Concordo quanto à *listagem*,
  mas **a troca de nome e a correção do `capacitor.config.json` pertencem à onda Agora** e
  são pré-requisitos da própria limpeza de PI — não consequências dela. Renomear depois de
  substituir 90 criaturas é refazer trabalho.
- **Discordo parcialmente da tese do produto.** O briefing diz que a promessa emocional "é a
  do Digimon". Isso é verdade sobre a *emoção* e perigoso como *bússola de marca*: foi essa
  bússola que produziu o nome, o prompt de `oracle.ts:2230` e as 90 criaturas. Recomendo
  substituir a formulação interna por algo como "a promessa do v-pet de 1997" — mesma
  emoção, nenhuma marca, e não induz o próximo colaborador ao mesmo erro.
- **Onde minha análise é fraca:**
  - **Não consegui confirmar registro de marca "Soulmon" nem no INPI nem no USPTO.** As
    bases dos dois exigem consulta interativa e não são indexadas de forma pesquisável.
    Resultado: **sem dado público confiável** sobre existência de registro do termo. Isso
    **não muda o veredito** — a existência do personagem oficial da Bandai basta — mas
    significa que uma busca de anterioridade profissional (INPI classes 9 e 41 + USPTO
    classes 9 e 41) continua obrigatória, e deve ser feita para o **nome novo**, não para
    "Soulmon".
  - **Handles sociais não verificados.** TikTok e Instagram bloqueiam leitura automatizada;
    `@soulmon` no TikTok retornou página de carregamento. **Sem dado público confiável.**
    Irrelevante na prática, porque a recomendação é trocar o nome.
  - **Volumes de palavra-chave em pt-BR:** não encontrei fonte pública confiável com volume
    e dificuldade por termo no mercado brasileiro. Os números do Anexo A estão marcados
    `[HIPÓTESE]` e derivam de raciocínio sobre concorrência observada, não de ferramenta.
    Antes de finalizar a listagem, rodar uma semana de trial de AppTweak/Sensor Tower/
    ASOMobile e substituir. Os números en-US de "habit tracker" têm fonte (asomobile,
    jul/2026).
  - **`soulmon.app` "não resolve DNS" é indício, não prova de disponibilidade.** Um domínio
    registrado e sem zona DNS produz o mesmo resultado.
  - **[HIPÓTESE] em toda a §"Canais":** nenhuma das métricas-alvo que propus (taxa de
    conclusão > 60%, 15% de compartilhamento por evolução, D7 ≥ 25%) tem base em dados do
    produto, porque não há telemetria. São metas de trabalho para calibrar, não previsões.

---

## 9. Perguntas abertas para o dono do produto

1. **Você aceita trocar o nome?** Se a resposta for não, metade deste relatório e boa parte
   do consolidado ficam inexecutáveis, e eu preciso saber para reescrever a estratégia em
   torno de uma marca que não pode ser defendida nem encontrada.
2. **Você tem uma hora por dia útil, por seis meses, para operar uma conta de TikTok?**
   Sim → o plano de canais é viável a custo quase zero. Não → o único caminho é mídia paga,
   que está bloqueada por retenção, e o lançamento precisa ser adiado ou o escopo reduzido.
3. **Projeto pessoal ou negócio?** (o consolidado já pergunta; do meu ângulo muda tudo: um
   projeto pessoal não precisa de nome registrável, de loja, nem de listagem.)
4. **Mercado primário: Brasil ou EUA?** Determina em qual idioma se otimiza primeiro, qual
   comunidade se aborda e qual busca de marca se faz primeiro. O Finch é 62% EUA; o custo
   de conteúdo em pt-BR é muito menor para você. Não dá para fazer os dois bem no começo.
5. **Você está disposto a mostrar a degeneração no marketing?** É o formato de vídeo com
   maior potencial de alcance e o que contradiz o manual da categoria. Se a resposta for
   não, o formato 3 sai e o plano de conteúdo fica ~30% mais fraco.

---

## 10. Fontes

Todas acessadas em **2026-08-03**.

1. Enciclopédia oficial Digimon (Bandai) — verbete **Soulmon**: https://digimon.net/reference_en/detail.php?directory_name=soulmon
2. Wikimon — Soulmon: https://wikimon.net/Soulmon
3. Digimon Masters Online Wiki — Soulmon: https://dmo.fandom.com/wiki/Soulmon
4. "Finch: How a Self-Care App Hit $30M ARR Without VC Money" — Sparrow Apps: https://blog.sparrowapps.io/p/finch-how-a-self-care-app-hit-30m-arr-without-vc-money
5. MediaPost — "Self-Care App Finch Promotes 'Whatever It Takes to Get Through the Day'": https://www.mediapost.com/publications/article/415234/self-care-app-finch-promotes-whatever-it-takes-to.html
6. Google Play — Finch: Self-Care Pet: https://play.google.com/store/apps/details?id=com.finch.finch&hl=en_US
7. App Store — Finch: Self-Care Pet: https://apps.apple.com/us/app/finch-self-care-pet/id1528595748
8. Google Play — Habitica: Gamify Your Tasks: https://play.google.com/store/apps/details?id=com.habitrpg.android.habitica&hl=en_US
9. Play Console Help — política de **Impersonation**: https://support.google.com/googleplay/android-developer/answer/9888374
10. Play Console Help — **Intellectual Property**: https://support.google.com/googleplay/android-developer/answer/9888072
11. ASOMobile — "App Store Optimization in 2026" (dados de popularidade/dificuldade de "habit tracker", jul/2026): https://asomobile.net/en/blog/aso-in-2026-the-complete-guide-to-app-optimization/
12. Stormy AI — "How to Master App Store Keyword Volume 2026": https://stormy.ai/blog/how-to-master-app-store-keyword-volume-2026
13. Registro.br — consulta de disponibilidade de `soulmon.com.br` (retorno `{"status":0}` = disponível): https://registro.br/
14. Verificação direta de `https://soulmon.com` — responde com certificado `*.gabia.com` (registrador sul-coreano; domínio registrado por terceiro).
15. Anime News Network — "Namco Bandai Files to Renew U.S. Digimon Trademarks" (2013-05-08): https://www.animenewsnetwork.com/news/2013-05-08/namco-bandai-files-to-renew-u.s-digimon-trademarks
16. App Store — **DIGIMON UP** (app oficial da Bandai Namco, prova de presença ativa do titular nas lojas): https://apps.apple.com/us/app/digimon-up/id6756247787
17. Google Play — **DIGIMON UP**: https://play.google.com/store/apps/details?id=com.bandainamcoent.dgup_ww&hl=en

**Sem dado público confiável para:** registro da marca "Soulmon" no INPI e no USPTO
(bases não indexadas — exigem consulta interativa); disponibilidade dos handles `@soulmon`
no TikTok e Instagram; volume e dificuldade de palavras-chave no mercado pt-BR.

---
---

# ANEXO A — Listagem de loja pt-BR (pronta para colar)

> **AVISO DE BLOQUEIO.** Esta listagem usa o marcador `[NOME]` no lugar do nome do produto.
> **Não publique com "Soulmon"** — §4, primeiro item. Substitua `[NOME]` pelo nome novo
> aprovado nos 6 filtros de G1. Nenhuma palavra desta listagem cita marca de terceiro, e
> assim deve permanecer.

## A.1 Título — Google Play (máx. 30 caracteres)

**Recomendado:**
```
[NOME]: Bichinho de Hábitos
```
*(com um nome de 6 letras = 28 caracteres. Conte antes de colar.)*

Alternativas por ordem de preferência:
| Título | Chars (nome de 6) | Comentário |
|---|---|---|
| `[NOME]: Bichinho de Hábitos` | 28 | **Recomendado.** "bichinho" é a palavra da prateleira de care em pt-BR; "hábitos" carrega o núcleo sem prometer gerenciador de tarefas |
| `[NOME]: Bichinho Virtual` | 25 | Maior volume de busca, menor sinal de propósito |
| `[NOME]: Sua Alma Cresce` | 24 | Melhor marca, pior ASO — sem keyword |

**Nome na App Store (máx. 30) + Subtítulo (máx. 30):**
- Nome: `[NOME]: Bichinho de Hábitos`
- Subtítulo: `Ela cresce quando você cresce` (29 chars)

## A.2 Descrição curta — Google Play (máx. 80 caracteres)

```
Uma criatura que nasce de quem você é e só cresce quando você cresce.
```
*(69 caracteres)*

Alternativa com mais keyword:
```
Bichinho virtual que evolui com seus hábitos reais. Ou regride sem eles.
```
*(72 caracteres)*

## A.3 Descrição longa — Google Play (máx. 4.000 caracteres)

> As 3 primeiras linhas são as únicas visíveis antes do "ler mais". Elas carregam o gancho.

```
Ela não é um enfeite. Ela é você.

Responda ao Oráculo e uma criatura nasce — única, gerada a partir das suas
respostas. Ninguém no mundo tem a sua. E ela só cresce se você crescer de verdade.

Todo dia você diz o que vai fazer. Cada tarefa concluída vira energia. Um dia
completo com energia cheia é um dia perfeito — e é assim, e só assim, que ela
evolui. Se você some, ela perde força. Se você some por muito tempo, ela regride.

Não é um app que te dá parabéns por nada.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

★ O QUE ACONTECE QUANDO VOCÊ ABRE

• O Oráculo — um ritual de origem que gera SUA criatura. Não é escolher entre
  seis modelos: a linha evolutiva inteira é gerada para você.
• Tarefas de verdade — as suas, do seu dia, do mundo físico.
• Energia — cada tarefa concluída enche uma barra.
• Dia perfeito — cumprir o combinado com energia cheia.
• Evolução — a criatura muda de forma pelo que você fez, não pelo que pagou.
• Consequência — abandonar dói. Voltar é sempre possível.

★ CUIDAR, NÃO SÓ MARCAR CAIXINHA

• Alimente e o caminho evolutivo muda de galho.
• Faça carinho e ela recupera coração.
• Limpe, dê banho, faça dormir.
• Converse com ela — ela tem personalidade própria.

★ E QUANDO O DIA ACABA

• Masmorra de 5 andares com drops raros.
• Minijogos rápidos.
• Torneio contra outros jogadores.
• Loja de cenários e itens, com moeda que você ganha jogando.
• Missões que desbloqueiam lugares que ninguém mais tem.

★ FEITO PARA CABER NA VIDA REAL

• Lembretes que respeitam o seu progresso — não avisa se você já fez.
• Relatório do dia.
• Pixel art. Sem barulho, sem cor gritante, sem notificação chata.
• Português e inglês.
• Funciona offline. Seu progresso é seu.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

★ POR QUE ISSO FUNCIONA QUANDO OUTROS APPS FALHAM

Lista de tarefas não motiva ninguém. Ponto e badge param de importar na segunda
semana. O que não para de importar é alguém que depende de você.

Não é sobre produtividade. É sobre a diferença entre a pessoa que você diz que é
e a pessoa que você foi hoje — e ver essa diferença tomar forma.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sua criatura está esperando para nascer. Ela vai se parecer com você.
```

*(~1.750 caracteres — deixa espaço para adicionar prova social depois das primeiras
avaliações. **Adicionar quando existir:** "★ +X.000 dias perfeitos cumpridos pela
comunidade".)*

> **Verificação de verdade** (armadilha do meu papel): cada afirmação acima existe no
> produto hoje segundo o briefing §2 — Oráculo, energia, dia perfeito, evolução ramificada,
> degeneração, alimentar/carinho/limpar/banho/dormir, chat, masmorra de 5 andares, Dino/PPT,
> torneio, loja de Bits com 11 cenários, 6 missões, push condicionado ao progresso, relatório
> diário, i18n, PWA offline. **Não escrevi:** "melhora sua saúde mental", "cientificamente
> comprovado", "IA", nenhuma marca de terceiro, e nenhum recurso social que dependa do
> backend não verificado. **"Torneio contra outros jogadores" precisa sair da listagem se
> o PvP assíncrono não estiver funcional na versão publicada.**

## A.4 Palavras-chave pesquisadas — pt-BR

**Estratégia:** na Play não há campo de keywords — os termos entram no título, na descrição
curta e na longa por densidade natural. Na App Store, o campo de 100 caracteres.

| Termo | Volume est. | Dificuldade | Intenção | Onde usar |
|---|---|---|---|---|
| bichinho virtual | Médio-alto `[HIPÓTESE]` | Média | Emocional/nostalgia | Título alt., desc. curta, 1º parágrafo |
| lista de tarefas | Alto `[HIPÓTESE]` | **Alta** | Funcional | Só na descrição longa. **Não disputar** |
| app de hábitos | Médio `[HIPÓTESE]` | Alta | Funcional | Título, desc. longa |
| rotina diária | Médio `[HIPÓTESE]` | Média | Funcional | Desc. longa |
| pet virtual | Médio `[HIPÓTESE]` | Média-baixa | Emocional | Desc. curta e longa |
| criar hábitos | Médio `[HIPÓTESE]` | Média | Transformação | Desc. longa |
| produtividade gamificada | Baixo `[HIPÓTESE]` | Baixa | Nicho — alta conversão | Desc. longa |
| pixel art | Baixo | Baixa | Estética | Desc. longa |
| foco e disciplina | Médio `[HIPÓTESE]` | Média | Funcional | Desc. longa |
| bichinho que evolui | Muito baixo | **Muito baixa** | Cauda longa — melhor ROI inicial | Desc. curta alt., desc. longa |
| organizar o dia | Médio `[HIPÓTESE]` | Média | Funcional | Desc. longa |
| motivação para estudar | Médio `[HIPÓTESE]` | Média | Público study-tok | Desc. longa |

**Campo de 100 chars da App Store (pt-BR), pronto para colar:**
```
bichinho,pet,virtual,habitos,rotina,tarefas,foco,disciplina,evolucao,pixel,cuidar,criatura,estudo
```
*(98 caracteres. Sem espaços após vírgula — espaço desperdiça caractere. Sem acento em
"hábitos"/"evolução": a Apple normaliza, mas a versão sem acento cobre as duas grafias
digitadas pelo usuário. Não repetir palavras que já estão no nome/subtítulo.)*

**Termos proibidos, sem exceção:** digimon, pokemon, tamagotchi, digivice, neopets, pou,
finch, habitica, forest — nem como comparação, nem como "alternativa a". Isso é a política
de Impersonation da Play (fonte 9) e é o caminho mais rápido para remoção.

## A.5 Roteiro dos screenshots (8 telas) — pt-BR

> A primeira imagem carrega a maior parte da conversão e é a única que aparece na busca.
> **Formato:** retrato 1080×1920, legenda em faixa superior com fonte grande (a legenda é
> lida antes da tela), moldura de celular opcional, fundo escuro consistente com a marca.

| # | Tela | Legenda (curta e grande) | Por que está nesta posição |
|---|---|---|---|
| **1** | **Split antes/depois:** criatura bebê à esquerda, forma avançada à direita, seta entre elas, "37 dias perfeitos" embaixo | **"Ela cresceu porque você cresceu."** | A imagem mais compartilhável e a única que comunica a promessa inteira sem texto. Transformação > estado |
| 2 | Tela do Oráculo com uma pergunta real visível e a resposta sendo digitada | **"Ela nasce das suas respostas. É só sua."** | Diferencial que ninguém tem — precisa vir antes da mecânica |
| 3 | Tela principal com a criatura, barras de energia e a lista de tarefas do dia | **"Suas tarefas de verdade viram a energia dela."** | Mostra o núcleo — e cumpre a honestidade: é um app de tarefas |
| 4 | Momento do dia perfeito: energia cheia, animação de brilho | **"Dia perfeito = um passo na evolução."** | O loop, em uma imagem |
| 5 | Criatura com HP baixo, olhar preocupado | **"E se você some, ela sente."** | A consequência é o diferencial. Aparece na quinta, não na primeira |
| 6 | Árvore de evolução ramificada com galhos por atributo | **"Sua linha evolutiva não existe para mais ninguém."** | Profundidade e rejogabilidade |
| 7 | Grid dos cuidados: alimentar, carinho, banho, dormir | **"Cuidar dela é parte do dia."** | Vínculo — e o que a difere de um checklist |
| 8 | Masmorra ou cenário desbloqueado, arte cheia | **"E tem um mundo esperando quando o dia acaba."** | Riqueza, por último. Nunca primeiro |

**Regra:** nenhum screenshot mostra criatura com nome ou sprite derivado. Todos precisam
ser recapturados **depois** da substituição de arte (consolidado §6, item 2).

## A.6 Roteiro do vídeo de pré-visualização (25s) — pt-BR

> Vertical 1080×1920. **Sem som obrigatório** (a Play autoplay em mudo): tudo precisa
> funcionar com legenda. Os primeiros 3 segundos definem se o vídeo é assistido.

| Tempo | Imagem | Texto na tela |
|---|---|---|
| 0-3s | Criatura bebê pulsando no escuro, um ovo rachando | **"Ela nasce de quem você é."** |
| 3-7s | Corte rápido: 3 perguntas do Oráculo, respostas aparecendo, silhueta se formando | "Responda. Ela se forma." |
| 7-12s | Tela de tarefas: dedo marca 3 tarefas, barras de energia enchem, brilho de dia perfeito | "Suas tarefas. A energia dela." |
| 12-16s | **Evolução** — flash branco, forma nova maior | "Dia perfeito. Ela evolui." |
| 16-20s | Cinza, criatura encolhida, HP piscando; depois volta a cor | "Se você some, ela definha. Voltar sempre dá." |
| 20-25s | Grade com 6 criaturas visivelmente diferentes entre si | **"Nenhuma é igual à outra. A sua está esperando."** + logo |

**O que o vídeo NÃO faz:** não mostra a loja, não mostra os minijogos, não mostra o
torneio. Vender camada 3 num vídeo de 25s ensina o usuário que o produto é um jogo — e
esse é o anti-objetivo nº 2 do briefing.

## A.7 Ficha da loja — pt-BR

- **Categoria:** Estilo de vida · **Tag secundária:** —
- **Classificação etária:** Livre (IARC), com interação entre usuários **desativada** na v1
- **Ícone:** a criatura em pixel art sobre fundo escuro sólido (`#0a0a0a`, cor já usada em
  `manifest.json:23`), sem texto. Ícone com texto perde legibilidade a 48px e é o erro nº 1
  de app pequeno
- **Cor de destaque:** `#2bff95` (já é o `theme_color`)
- **E-mail de contato e política de privacidade:** obrigatórios e ainda inexistentes
  (consolidado §6, item 7)

---
---

# ANEXO B — Store listing en-US (ready to paste)

> **BLOCKING NOTICE.** Uses `[NAME]` as a placeholder. **Do not publish as "Soulmon"** —
> it is a Bandai Digimon character (§4). No third-party brand appears anywhere below, and
> it must stay that way.

## B.1 Title — Google Play (30 chars max)

**Recommended:**
```
[NAME]: Habit Pet
```
*(with a 6-letter name = 17 chars — leaves room for a longer name)*

| Title | Chars (6-letter name) | Comment |
|---|---|---|
| `[NAME]: Habit Pet` | 17 | **Recommended.** Short, memorable, both keywords, room to grow |
| `[NAME]: Habit Pet & Tasks` | 25 | Adds `tasks`, weakens the care framing |
| `[NAME]: Your Soul Pet` | 21 | Strongest brand, weakest ASO |

**App Store name (30) + subtitle (30):**
- Name: `[NAME]: Habit Pet`
- Subtitle: `It grows only when you do` (25 chars)

## B.2 Short description — Google Play (80 chars max)

```
A creature born from who you are. It only grows when you actually do.
```
*(69 chars)*

Higher-keyword alternative:
```
Virtual pet that evolves with your real habits. And withers without them.
```
*(73 chars)*

## B.3 Long description — Google Play (4,000 chars max)

> Only the first 3 lines show before "read more". They carry the hook.

```
It's not decoration. It's you.

Answer the Oracle and a creature is born — unique, generated from your own
answers. Nobody else in the world has yours. And it only grows if you grow.

Every day you say what you'll do. Each task you finish becomes its energy. A full
day with full energy is a perfect day — and that, and only that, is how it
evolves. Go quiet and it weakens. Go quiet too long and it regresses.

This is not an app that congratulates you for nothing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

★ WHAT HAPPENS WHEN YOU OPEN IT

• The Oracle — an origin ritual that generates YOUR creature. Not picking from
  six templates: the whole evolution line is generated for you.
• Real tasks — yours, from your day, in the physical world.
• Energy — every finished task fills a bar.
• Perfect day — meet what you committed to, with energy full.
• Evolution — it changes shape because of what you did, not what you paid.
• Consequence — walking away hurts. Coming back is always possible.

★ CARE, NOT JUST CHECKBOXES

• Feed it and the evolution branch changes.
• Pet it and it recovers a heart.
• Clean, bathe, put it to sleep.
• Talk to it — it has its own personality.

★ AND WHEN THE DAY IS DONE

• A 5-floor dungeon with rare drops.
• Quick minigames.
• Tournament against other players.
• A shop of scenes and items, with a currency you earn by playing.
• Quests that unlock places nobody else has.

★ BUILT TO FIT A REAL LIFE

• Reminders that respect your progress — it won't nag if you already did it.
• Daily report.
• Pixel art. No noise, no screaming colors, no annoying notifications.
• English and Portuguese.
• Works offline. Your progress is yours.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

★ WHY THIS WORKS WHEN OTHER APPS DON'T

To-do lists don't motivate anyone. Points and badges stop mattering in week two.
What doesn't stop mattering is someone who depends on you.

This isn't about productivity. It's about the gap between the person you say you
are and the person you were today — and watching that gap take shape.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your creature is waiting to be born. It's going to look like you.
```

*(~1,700 chars — leaves room for social proof once reviews exist.)*

Same truthfulness check as A.3 applies. **Remove the "Tournament" bullet if async PvP is
not functional in the shipped build.**

## B.4 Researched keywords — en-US

| Term | Volume | Difficulty | Intent | Where |
|---|---|---|---|---|
| habit tracker | **~2,000 searches/day** (fonte 12) | **iOS 67 / Android 61** (fonte 11) | Functional | Long description only. **Do not contest** |
| virtual pet | Medium `[HIPÓTESE]` | Medium-low | Emotional/nostalgia | Short desc., first paragraph |
| self care pet | Low-medium `[HIPÓTESE]` | Medium (Finch owns it) | Emotional | Long description |
| routine planner | **~450 searches/day** (fonte 11) | **Low** | Functional | Long description. **Best volume/difficulty ratio found with a source** |
| pet that grows | Very low | **Very low** | Long tail — best early ROI | Short desc. alt., long description |
| daily goals | Medium `[HIPÓTESE]` | Medium | Functional | Long description |
| gamified productivity | Low `[HIPÓTESE]` | Low | Niche — high conversion | Long description |
| pixel pet | Low `[HIPÓTESE]` | Low | Aesthetic + nostalgia | Long description |
| accountability app | Low-medium `[HIPÓTESE]` | Medium | Transformation | Long description |
| study motivation | Medium `[HIPÓTESE]` | Medium | study-tok audience | Long description |
| creature collector | Low `[HIPÓTESE]` | Low | Genre signal, brand-free | Long description |

**App Store 100-char keyword field (en-US), ready to paste:**
```
pet,virtual,habit,routine,tasks,focus,goals,evolve,pixel,creature,care,streak,discipline,study
```
*(94 chars. No spaces after commas. Don't repeat words already in name/subtitle.)*

**Banned terms, no exceptions:** digimon, pokemon, tamagotchi, digivice, neopets, pou,
finch, habitica, forest — not even as "alternative to". Play Impersonation policy (source 9).

## B.5 Screenshot script (8) — en-US

Same order and rationale as A.5. Captions:

| # | Caption |
|---|---|
| **1** | **"It grew because you did."** |
| 2 | **"Born from your answers. Only yours."** |
| 3 | **"Your real tasks become its energy."** |
| 4 | **"Perfect day = one step in its evolution."** |
| 5 | **"And when you disappear, it feels it."** |
| 6 | **"Your evolution line exists for nobody else."** |
| 7 | **"Caring for it is part of the day."** |
| 8 | **"And there's a world waiting when the day is done."** |

## B.6 Preview video script (25s) — en-US

| Time | Visual | On-screen text |
|---|---|---|
| 0-3s | Baby creature pulsing in the dark, an egg cracking | **"It's born from who you are."** |
| 3-7s | Quick cuts: 3 Oracle questions, answers appearing, silhouette forming | "Answer. It takes shape." |
| 7-12s | Task screen: finger checks 3 tasks, energy bars fill, perfect-day glow | "Your tasks. Its energy." |
| 12-16s | **Evolution** — white flash, new larger form | "Perfect day. It evolves." |
| 16-20s | Desaturated, creature curled up, HP flashing; then color returns | "Go quiet and it withers. Coming back always works." |
| 20-25s | Grid of 6 visibly different creatures | **"No two are alike. Yours is waiting."** + logo |

## B.7 Store metadata — en-US

- **Category:** Lifestyle
- **Content rating:** Everyone / PEGI 3, user interaction **disabled** in v1
- **Icon:** the creature in pixel art on solid `#0a0a0a`, no text
- **Accent:** `#2bff95`
- Contact e-mail and privacy policy: required, currently missing

---

## Checklist de pré-lançamento (do meu escopo, em ordem)

1. [ ] Nome novo aprovado nos 6 filtros de G1; `.com` registrado; handles reservados
2. [ ] Busca de anterioridade INPI (cl. 9 e 41) + USPTO (cl. 9 e 41) para o nome novo
3. [ ] `capacitor.config.json`: novo `appId`, novo `appName`, **`server.url` removido**
4. [ ] `manifest.json`: `categories` com **um** valor, `description` = frase de posicionamento
5. [ ] Substituição completa de nomes e sprites derivados (consolidado §6, item 2)
6. [ ] Screenshots recapturados **após** a substituição de arte
7. [ ] Telemetria instalada; coorte de 300 instalações orgânicas medida
8. [ ] V1 (cartão de evolução) no ar; medindo taxa de compartilhamento
9. [ ] Diretório público de jogadores congelado; interação entre usuários desativada
10. [ ] Política de privacidade + exclusão de dados publicadas
11. [ ] Só então: ficha da loja publicada
12. [ ] Só depois do gatilho numérico de §"Mídia paga": primeiro real em anúncio
