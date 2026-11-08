# Plano do site do beta do Soulmon (v2, 05/11/2026)

> v2: revisado após alpha-skeptic, alpha-design-critic e alpha-security. As decisões da revisão estão no §15, que **vale sobre qualquer trecho anterior em conflito**.

Base factual: [FEATURE_TRUTH.md](FEATURE_TRUTH.md). Trabalho na branch `site-beta`, pasta `site-beta/`, isolada do app.

## 1. Objetivo e métrica

**Objetivo:** encher a 1ª leva (50 vagas, por ordem de inscrição) com gente que instala e joga.

**Métrica-norte:** testador ativo, não cadastro.
Funil: visita → início do formulário → cadastro → convite enviado → opt-in na Play → primeiro acesso → feedback.
O site mede até o cadastro. O resto o dono marca na exportação (colunas `convidado_em`, `instalou_em`).

## 2. Mensagem

Em 10 s o visitante sabe o que é, o que faz, o que evolui e por que é diferente.

- **H1:** "Criaturas que evoluem com suas tarefas." / "Creatures that evolve with your tasks." (decisão do dono)
- **Apoio:** "Um jogo de criaturas para Android. Conclua o que importa no seu dia, veja seu Soulmon ganhar novas formas e leve-o a combates, masmorras e guildas."
- **Frase de marca (seção do cristal, não hero):** "Sua evolução desperta a dele." / "Your growth awakens theirs."
- **CTA:** "Quero entrar no beta" / "Join the beta"
- **Microtexto:** "Grátis. Android. 1ª leva: 50 vagas, por ordem de inscrição. Depois, lista de espera."

Jogo primeiro, hábitos como motor. Gameplay antes de lore. Sem promessa de saúde.

## 3. Arquitetura de informação

Mesma ordem em PT (`/`) e EN (`/en/`). Fluxo: entender, desejar, confiar, inscrever.

| # | Seção | Conteúdo | CTA |
|---|---|---|---|
| 1 | Hero | Logo, idioma, H1, apoio, CTA e microtexto sem scroll em 360×640; arte do mundo ao fundo, corvo e criatura à frente | sim |
| 2 | Prévia de gameplay | Slot de vídeo vertical real + 3 prints reais | |
| 3 | O ciclo (parallax) | Tarefa → chama no cabo → cristal → evolução em 5 estágios | sim, ao fim |
| 4 | Seu Soulmon | 5 iniciais e vitrine por elemento, dentro do visor de cobre | |
| 5 | O mundo | 7 áreas em descida de ilhas, legendadas "arte do mundo" | |
| 6 | O que dá para fazer | Features reais: combate, Rift, minijogos, guilda, loja | |
| 7 | Como entrar | 3 passos honestos: inscrição → convite por e-mail → instalar pela Play | formulário |
| 8 | FAQ | Grátis? iPhone? Quando recebo? E se esgotar? Meus dados? | |
| 9 | CTA final + compartilhar | Formulário, Web Share com fallback de copiar link | sim |
| 10 | Rodapé | Privacidade, termos, contato, idioma | |

Botão fixo inferior no celular: aparece depois do hero, some quando um formulário está visível.

## 4. Direção de arte

**Conceito:** "o cabo que leva a chama". Uma linha de cobre com pulsos de circuito e brotos de folha desce a página inteira e liga as seções. Ela conduz uma chama turquesa até cada cristal. É o fio condutor visual e narrativo, e carrega a identidade em todas as dobras.

Sem template SaaS: sem cards de ícone em grade de 3, sem gradiente roxo, sem depoimento falso.

**Tokens do app:**
- Fundo `#08191A`, `#071413`; superfícies `#0F2A29`, `#163735`; texto `#E9F5F2`, `#9DBCB4`.
- Primária `#5FF3E0`, `#29C9B8`; cobre `#D9A05B`, `#EBBE84`, anel `#C68642`.
- Cinzel (títulos), Rubik (texto), Silkscreen só dentro do visor, self-host.

**Regra do pixel art:** criatura aparece dentro do visor de cobre ou em tamanho inteiro múltiplo, `image-rendering: pixelated`, sem interpolar.

**Sem engrenagem, sem steampunk.** Conferir cada asset: as artes de mapa têm detalhes a checar (no mapa-múndi há um objeto circular no Mercado). O que parecer engrenagem é cortado ou o asset é trocado.

## 5. Parallax

**Restrição:** não existem camadas com alfa; os mapas são chapados, mas com céu escuro que dissolve no fundo do site.

Solução sem gerar arte nova, cinco camadas:
1. Fundo: `#071413` com névoa turquesa em gradiente.
2. Longe: estrelas e brasas em SVG/CSS, velocidade 0,2.
3. Meio: arte da área, com `mask-image` dissolvendo as bordas, velocidade 0,5.
4. Perto: PNGs com alfa real (prédios `lote-*`, criaturas, corvo), velocidade 1,15.
5. Frente: cabo de cobre em SVG autoral, desenhado por `stroke-dashoffset` conforme o scroll.

**Cena 3, o ciclo:** seção fixada (`pin`), 5 estados: tarefa marcada → chama corre no cabo → cristal acende → `fogo-rookie` até `fogo-ultra` no visor → CTA.
**Cena 5, o mundo:** descida pelas ilhas aprovadas. Desktop: arte vertical em coluna deslocada, texto na outra.

**Assets:** mundo `00-mundo-aprovado`, `02-games-v3`, `03-exploration-v4`, `04-arena-v5`, `05-forge-v4`, `06-laboratory-v5`, `07-hall-v6`. Market ainda em avaliação: fica de fora até o dono aprovar.
**Falta** cristal com chama como peça isolada: desenhar em SVG, ou pedir ao dono uma geração.

**Reduced motion e celular fraco:**
- `reduce`: sem pin, sem parallax, sem autoplay; estados viram lista estática legível.
- Sem JS: página inteira legível; formulário funciona via POST comum.
- Celular fraco (`deviceMemory` ≤ 2 ou 2G/save-data): só camadas 1, 3 e 5, sem pin.
- Só `transform` e `opacity`.

## 6. Stack

- **Astro estático** com i18n nativo. HTML pronto, JS só onde precisa.
- **GSAP + ScrollTrigger** (grátis pela licença padrão), carregado depois do hero. **Sem Lenis:** scroll nativo é mais seguro no celular.
- **Imagens:** AVIF/WebP com `srcset`, nearest para sprites.
- **Hospedagem:** projeto separado no Cloudflare Pages (`soulmon.pages.dev/beta`), porque o worker do app tem CSP travada por hash e está em produção.
- **Repo público:** nada de segredo nem de dado no git. A pasta `site-beta/` tem `package.json` próprio e fica fora dos testes e do build do app.

**Orçamento:** LCP < 2,5 s em 4G lento emulado; JS inicial < 90 KB; peso até a 1ª dobra < 500 KB; CLS < 0,1; Lighthouse a11y ≥ 95. Sem autoplay com som. Vídeos lazy, com poster.

## 7. Cadastro

**Campos:** e-mail da conta Google, idioma (automático), aceite da privacidade e declaração de 18+ (a ficha do jogo diz 18+).
Um e-mail só: a Play exige conta Google, então o texto pede "o e-mail da sua conta Google". Outro domínio é aceito com aviso.

**`POST /api/inscrever` (Pages Function):**
1. Limite de tamanho, Content-Type, origem permitida.
2. Honeypot e Turnstile validado no servidor (`siteverify`); falhou, recusa.
3. Rate limit por hash de IP com sal, em D1.
4. Normaliza e valida e-mail. Pontos e `+` do Gmail colapsados só na chave de duplicata.
5. `INSERT` com `UNIQUE`; a posição vem de um `id` monotônico.
6. Resposta igual para novo e repetido, para não revelar quem está na lista. Na tela: "Inscrição registrada. Se já havia uma, ela continua valendo."
7. Notifica o revisor em `waitUntil`; falha de e-mail não derruba o cadastro e fica marcada para reenvio.

**Dados (D1 `soulmon-beta`):** e-mail, chave de duplicata, idioma, UTM, versão da política, data do aceite, leva, `convidado_em`, `instalou_em`. Cadastros apagados automaticamente após 12 meses. Sem IP puro, sem user-agent.

**Vagas:**
- O status público `GET /api/vagas` devolve só `restantes`, com cache de 60 s.
- Ao chegar a 0, o site muda sozinho para "Lista de espera para a próxima leva".
- Se a contagem falhar, some o número e continua o CTA: nunca mostrar número falso.
- Número da leva em variável de ambiente.

**Exportação:** `npm run exportar` via `wrangler d1` na máquina do dono, gera CSV fora do repo, com proteção contra injeção de fórmula. **Sem endpoint público de admin.**

**Remoção:** pedido por e-mail de contato no v1; `npm run remover <email>`. Política diz prazo.

**E-mail, a restrição real:**
- Sem domínio próprio, o Resend não envia a terceiros [a validar na implementação] e o Cloudflare Email Sending exige plano pago.
- **v1:** notificação ao revisor pelo Resend, com conta criada em `soulmon.revisor@gmail.com`. Confirmação ao inscrito **na tela**. Sem double opt-in.
- **Consequência:** dá para inscrever e-mail alheio. Mitigação: nada é enviado ao inscrito até o convite manual, e quem recebe o convite pode pedir remoção. O dono revisa a lista antes de convidar.
- **Se o dono comprar domínio:** confirmação por e-mail e double opt-in entram sem mudar a tabela.

**Segredos:** `TURNSTILE_SECRET`, `RESEND_API_KEY`, `HASH_SALT` como secrets. No frontend, só a chave pública do Turnstile.
**Headers:** CSP própria com `challenges.cloudflare.com`, HSTS, `frame-ancestors 'none'`, `Referrer-Policy`.

## 8. Privacidade

Página própria PT/EN (`/privacidade`) para o cadastro: quais dados, finalidade (convite do beta), base (consentimento), retenção, operadores (Cloudflare, Resend), direitos, contato. A do app não cobre este tratamento. Revisão jurídica fica com o dono.

## 9. Analytics

Cloudflare Web Analytics (sem cookie) + eventos próprios sem identificador, em tabela D1 agregada por dia: `cta_click`, `form_start`, `form_success`, `form_error`, `share`, `video_play`, `lang_switch`, com seção de origem e UTM. Sem cookie, sem banner.

## 10. Benchmark: o que aproveitamos

Consultado em 05/11/2026; detalhe em `BENCHMARK.md`.
- **Cassette Beasts** (cassettebeasts.com): CTA só no menu, o que é fraco para captar. Fazemos o oposto.
- **Coromon** (coromon.com): CTA abaixo do texto e newsletter repetida com promessa de pouco e-mail. Copiar a repetição e a promessa.
- **Finch** (finchcare.com): hero mínimo. A prova social dele não existe aqui, e não fingimos.
- **Monster Sanctuary:** GIFs de gameplay em vez de vídeo. Ideia de reserva até os vídeos chegarem.
- **Diferencial observado [suposição, n=4]:** nenhum mostra o ciclo tarefa real → criatura. É a nossa cena central.
- **Play, oficial:** teste fechado exige conta Google e opt-in; conta pessoal nova exige 12 testadores por 14 dias contínuos.

**Lacunas declaradas:** sites premiados (Awwwards/FWA) e Palworld, Temtem, Habitica não abriram. A evidência de conversão é fraca (form de um campo: blog citando Unbounce, sem confirmação). As decisões de conversão aqui são julgamento, não dado.

## 11. Slots trocáveis

`site-beta/src/content/midia.json` lista vídeos e prints por idioma com origem em `E:/Soulmon-marketing/`. Até chegarem: seção mostra a arte com "Vídeo de gameplay em breve", nunca mockup. Toda mídia marcada `gameplay: true` precisa de captura real.

## 12. Roteiro

| Etapa | Dono | Saída |
|---|---|---|
| A. Andaime Astro, tokens, i18n, conteúdo | Sonnet | PT/EN navegáveis |
| B. Hero, cabo e parallax | Opus (cenas), Sonnet | Cenas 1, 3, 5 |
| C. Vitrine, features, FAQ, rodapé, slots | Sonnet | Página completa |
| D. Backend, D1, Turnstile, Resend, scripts | Sonnet + `alpha-backend` | Cadastro local de ponta a ponta (`wrangler pages dev` com chaves de teste) |
| E. Copy PT/EN | `alpha-redator-ux`, régua da bíblia | Textos |
| F. QA | `alpha-qa`, `alpha-perf-a11y`, `alpha-fiscal-entrega` | Evidência |
| G. Preview e instruções | Claude | Preview + `DEPLOY.md`; produção só com aval |

## 13. Pendências do dono (via operacional)

0. **Bloqueiam publicar:** `BETA_CLOSED` ligado; conta Cloudflare separada (recomendado) e contas Resend/Turnstile; fontes de tráfego; quem envia convite e em que prazo; validade do convite (7 dias?).
1. Teste fechado aprovado? Define o texto de "como entrar".
2. Logo e corvo são definitivos? (doc de 04/10 diz sim, memória de 01/10 diz provisório)
3. Conta Resend e Turnstile: criar é ação do dono (grátis).
4. Os mapas ainda não instalados podem aparecer como "arte do mundo"?
5. Prazo de resposta ao inscrito, para o FAQ.

## 18. Feedback do dono sobre o preview (05/11/2026), vale sobre tudo

**Princípios:** usuário com pouco tempo. Título + no máximo uma frase curta por seção (exceto FAQ e privacidade). Mensagem que domina: **faz tarefa, seu Soulmon evolui.** Depois, a riqueza do universo. Asset pronto quando existir; o que faltar vem do ChatGPT (`ASSETS-CHATGPT.md`), trocável, sem CSS imitando asset.

- **Hero:** logo completo, bem maior, no canto; criatura menor; mapa melhor e sem corte, mantendo a composição. Botão e barra lateral em asset.
- **Ciclo:** scroll aprovado. Cena centralizada, tarefas ao lado no estilo de lista do jogo; título "Forma N de 5" arrumado; disco em asset; sprite menor. Sem menção a cabo em copy.
- **Seu Soulmon:** elemento muda corpo e combate; nasce do teste de personalidade; 20 base que se combinam em mais de 200; 5 estágios com 3 caminhos no meio. Árvore com sombras, um caminho definido, "?" nos outros.
- **Universo em abas:** Universo, Habitantes (NPCs), Jogos (atividades reais), Elementos (principais com nome e ícone grande, demais com "?"). Teclado. Pouco texto.
- **Vídeo:** com destaque, lazy, poster, sem som automático. Abertura rotulada como cinemática; só gameplay real como gameplay.
- **Parallax:** mais profundidade; cenários instalados trocando com o scroll; NPCs e criaturas em primeiro plano; fallbacks mantidos.
- **Como entrar:** passos em asset. Seção final: e-mail + botão "Entrar no beta" + uma linha legal. Pop-up: "Parabéns, você se inscreveu no beta! Seu e-mail foi cadastrado com sucesso. Você receberá o link para fazer o download nos próximos dias.", com versão de lista de espera.
- **Passagem:** squad inteira deixa achados e correções.
- **Pop-up de sucesso ("nos próximos dias"):** só com vagas abertas. Com `LEVA_ESTADO=espera`, site e pop-up mostram: "As vagas desta rodada foram preenchidas. Teremos uma nova rodada e seu e-mail já está na fila. Obrigado por se interessar no Soulmon!" / "This round is full. Another round is coming and your email is already in line. Thanks for your interest in Soulmon!"
- **Seguindo a recomendação, pendentes de confirmação do dono (reversíveis):** linha única de aceite; regra das 50 em Como entrar; logo completo por geração; árvore com sombras e "?"; linha **planta** no ciclo e no hero, em vez de fogo; texto só com corpo e combate, sem comida e banho.
- **Assets:** a operacional gera; destino `E:\Soulmon-marketing\site-assets\`.

## 17. Revisão do ChatGPT filtrada pela operacional (05/11/2026), vale sobre §15 e §16

- **Prova na Fatia 1:** loop real de 8 a 15 s ou sequência de capturas reais logo abaixo do hero ou no ciclo. A animação do cabo não substitui. Origem: sessão de vídeo ou captura própria. Sem captura real, a Fatia 1 não publica.
- **Sem contador dinâmico na v1.** Texto fixo com a regra; virada para lista de espera por variável `LEVA_ESTADO` (`abertas`|`espera`), acionada depois de revisar a lista. Isto substitui os três estados e o `restantes` do §15. A rota pública devolve só o estado.
- **Estados internos:** inscrito válido, convite enviado, aceito, lista de espera.
- **Regra (PT):** "A primeira leva terá 50 vagas, oferecidas aos primeiros 50 cadastros válidos, por ordem de inscrição. Os convites serão enviados em levas. Após o preenchimento das vagas, novas inscrições entrarão na lista de espera. A inscrição não libera acesso imediato ao jogo."
- **Regra (EN):** "The first wave has 50 spots, offered to the first 50 valid sign-ups in registration order. Invitations will be sent in batches. Once all spots are filled, new sign-ups will join the waitlist. Signing up does not grant immediate access to the game."
- **Instruções:** "Após receber o convite, você terá 7 dias para aceitá-lo." / "Once you receive your invitation, you'll have 7 days to accept it."
- **Campo:** "E-mail da conta Google usada na Play Store." / "Google Account email used for the Play Store." Sem exigir `@gmail.com`.
- **Sucesso:** cadastro recebido, acesso não é imediato, acompanhe este e-mail pelo convite, que vale 7 dias.
- **`utm_content`:** por ângulo, pode trocar a frase de apoio e o idioma padrão; o H1 fica. Só se for barato.
- **Mantidos:** 18+; 14 dias só em "Como entrar" e FAQ.

## 16. Respostas do dono (05/11/2026), valem sobre o §15

- **Teste fechado:** aprovado pelo Google e em andamento; exige 12 testadores por 14 dias. "Como entrar" e FAQ dizem que é preciso manter o opt-in por 14 dias. O funil rastreia `optin_em` e o relógio dos 12.
- **Conta Cloudflare:** a mesma do app, com projeto Pages e D1 próprios, `_routes.json` só em `/api/*`, rate limit e teto diário. Risco residual aceito: cotas compartilhadas da conta.
- **Tráfego:** Instagram pago e comunidades de jogos. UTM `source`: instagram, reddit, discord, facebook, whatsapp, outro.
- **Convite:** enviado à mão pelo dono, vale 7 dias; depois a vaga passa ao próximo.
- **Logo e corvo:** definitivos.
- **Mapas:** só os instalados no app (`soulmon/areas/`, `soulmon/mapa/`). Os recriados saem da lista do §5.
- **"Nada do demo":** sem mapa-múndi nem tartaruga. Leitura adotada, a confirmar: fora os 5 iniciais da DEMO (Crato, Brooka, Zefi, Oaken, Bolid). A vitrine usa só `soulmon/novos/`.
- **Cristal:** provisório marcado até a geração; prompt em `PROMPT-CRISTAL.md`.

- **`BETA_CLOSED`:** o dono decidiu ligar. Sequência antes de publicar o site: comparar `BETA_EMAILS` com os testadores atuais (só contagens e divergências) → avisar a operacional → aplicar → testar 403 com conta fora da lista.
- **Demo confirmado:** Crato, Brooka, Zefi, Oaken e Bolid fora do site.
- **Resend:** conta atual é `soulmon.revisor@gmail.com`. O valor do secret não pode ser lido do worker: o dono cola a mesma chave no projeto do site ou gera outra no painel da Resend.
- **Rate limit por IP:** subir de 10 para 30 por dia, porque tráfego móvel pago divide IP por operadora.

### Medições (leitura; nada alterado)

**`BETA_CLOSED`:** não aparece entre os secrets do worker `soulmon`, e o `wrangler.jsonc` não o define. Leitura: **desligado**, salvo variável só no painel. `BETA_EMAILS` existe. Pelo código, quem está fora da lista loga e joga, e só as rotas de IA recusam. **Portanto "50 vagas" limita a Play e a IA, mas não o jogo pela URL web.** O teste de 403 com conta real não foi feito.

**Capacidade para 50 (cálculo sobre os tetos do código, sem uso real medido):**
| Recurso | Teto | Com 50 | Veredito |
|---|---|---|---|
| Chat | 250/dia global; 15 por conta | 5 mensagens por pessoa/dia esgota | Apertado: aumentar exige recalcular cota grátis (Groq ~105 + Gemini ~250) |
| Geração de sprite | 40/dia, 800/mês global | Levas de mais de 40 novatos no mesmo dia excedem | Convidar em lotes de até 30 por dia |
| KV (gravações) | Workers Paid (assinado, segundo o dono): 1 milhão/mês incluído, depois US$ 5/milhão, sem bloqueio ([doc, 30/10/2026](https://developers.cloudflare.com/kv/platform/pricing/)) | ~660 gravações por pessoa/dia para chegar ao incluído | **Risco baixo.** Excedente vira custo, não falha. Limite real: 1 escrita/s por chave |
| Crédito Higgsfield | Doc antigo diz "travado por crédito" | Não verificado | Conferir |

## 15. Decisões da revisão adversarial

### Objeções fatais

| Objeção | Resolução |
|---|---|
| As 50 vagas só são reais se o acesso ao jogo for restrito | **Bloqueia publicação, não construção.** Antes de publicar: `BETA_CLOSED=true` em produção e 403 demonstrado para conta fora da lista. Depende do dono |
| Caminho inscrição → jogar omite passos | Runbook do convite, testado com uma conta nova antes de publicar: Google Group + faixa da Play + `BETA_EMAILS` + e-mail de convite |
| Spam esgota as vagas | Só o convite manual consome vaga (estados abaixo) |
| Cota grátis compartilhada com o app | Recomendação: conta Cloudflare separada, criada pelo dono. `_routes.json` só com `/api/*` e teto global de inscrições por dia |
| Remoção que não remove | `DELETE` real, pedido vindo do próprio endereço; política declara o backup de 7 dias do D1 |
| 1ª dobra não cabe em 360×640 | Hero = logo, idioma, H1, uma criatura, CTA, microtexto de 1 linha. Apoio desce; corvo sai do hero |
| Cristal é ativo central e não existe | Gerar antes da etapa B, 3 estados (apagado, acendendo, aceso). Cabo e cristal em grade de pixel coerente com os sprites |
| Engrenagem e steampunk nos assets | Inventário aprovado por asset antes do uso. `00-mundo` fora do hero (roda no mercado, disco raiado); tartaruga fora do destaque até o dono decidir |

### Vagas, os três estados públicos

- `inscritos < 50`: "Vagas abertas".
- `inscritos ≥ 50` e `convites < 50`: "Muita procura: novas inscrições podem ir para a lista de espera".
- `convites = 50`: "1ª leva completa: lista de espera".

O número mostrado é `50 − convites enviados`. Inscrição nunca garante vaga, e o texto diz isso. Assim, spam gera no máximo o aviso brando, nunca "esgotado".
A ordem de inscrição decide. Convite sem opt-in em 7 dias [a confirmar com o dono] libera a vaga para o próximo.

### Funil

- **Ativo:** fez opt-in e abriu o jogo em pelo menos 1 dia nos últimos 7.
- A exportação acompanha o relógio da Play: 12 testadores por 14 dias contínuos.
- **Convite é o trecho crítico:** `npm run proxima-leva` gera os próximos da fila, a linha para `BETA_EMAILS` e o texto do convite. O dono envia. O convite diz de onde veio e como sair.
- **Fontes de tráfego:** pendência do dono; o plano não assume nenhuma. A página sai com UTMs por canal.
- **Capacidade:** medir o teto de IA contra 50 usuários antes da 1ª leva. O código cita teto apertado para 20 contas.

### Escopo: entrega em fatias

- **Fatia 1, publicável sozinha:** hero, ciclo, seu Soulmon, como entrar, FAQ, cadastro, rodapé, PT/EN.
- **Fatia 2:** mundo, features detalhadas, vídeos.

Tudo do pedido entra; a ordem protege a captação.

### Design

- **Gesto próprio:** a cena do ciclo é participativa. O visitante marca uma tarefa e a chama corre até o cristal e a evolução; o scroll é o fallback.
- **Ordem nova:** Hero → Ciclo → Prévia → Seu Soulmon → Mundo → Features → Como entrar → FAQ → CTA final → Rodapé. Sem vídeo, a Prévia usa só prints reais, sem aviso de "em breve".
- **Mundo:** 3 ilhas no celular, com legenda da atividade real; as 7 no desktop. Não é pin; só deslocamento leve.
- **Camada perto:** partículas, corvo ou criatura, nunca prédio. Máscara ajustada mapa a mapa (Hall tem nuvens claras; cenas cheias têm borda dura).
- **Pixel art:** PNG ou WebP sem perda; `translate` arredondado; sem misturar densidades na mesma vitrine; testar DPR 2,625 e 2,75. Mapas reduzem com suavização, nunca `pixelated`.
- **Cabo:** animado por trecho, só na viewport; estático em celular fraco.
- **A11y:** scrim com 4,5:1 medido no pior ponto; `scroll-padding` para o botão fixo; ordem do DOM igual à da narrativa; nada de foco preso; erros em `aria-live`; alternativa se o Turnstile falhar (e-mail de contato).

### Segurança

- **Ordem no servidor:** corpo ≤ 2 KB → `Content-Type: application/json` → `Origin` exato → honeypot → `siteverify` (com `hostname` e `action`) → limite por `HMAC(ip, sal+dia)` → teto global, com 503 honesto.
- **Banco:** `AUTOINCREMENT`; `INSERT ... ON CONFLICT DO NOTHING`; sem posição ao cliente; chave de duplicata como `HMAC`; limite por IP apagado em 24 h.
- **Notificação:** Resend confirmado: sem domínio, só envia ao e-mail da própria conta. Texto puro, `onboarding@resend.dev`, sem o e-mail do inscrito no corpo, teto de 20 por dia. **Sem reenvio**: o `exportar` é a fonte da verdade.
- **Convite ao inscrito:** enviado pelo dono. O cadastro é só para o beta; sem novidades.
- **Analytics v1:** Web Analytics + `form_success` e `form_error` contados no servidor. **Sem tabela pública de eventos.** UTM por allowlist; fora dela, `outro`. CSP inclui o beacon.
- **CSV:** recusar na entrada `local-part` iniciada por `= + - @`, tab, CR; a exportação aborta se achar um campo assim. `.gitignore` com `*.csv` e `.dev.vars`.
- **Preview:** D1 próprio e chaves de teste, nunca o banco de produção.
- **Retenção proposta:** apagar ao fim do beta ou em 12 meses sem convite.
- **Padrão de verificação:** OWASP ASVS nível 1.

### Copy

- "Grátis" vira "Entrar no beta não custa nada". O FAQ explica que a loja existe e que compras no beta são de teste.
- "masmorras" vira "Endless Rift". Guerra 4x4 e Chefe dependem de gente suficiente: citar sem prometer para o primeiro dia.

### Ainda não verificado

Awwwards/FWA, regras de ficha da Play, retenção do Web Analytics, comportamento de Pages ao estourar cota (testar no preview), base legal (dono jurídico).

## 14. Riscos

| Risco | Resposta |
|---|---|
| Parece app de hábitos | H1 fala de criaturas; arte e combate dominam |
| Promete mais do que o beta entrega | FEATURE_TRUTH é porta de entrada de toda copy; fiscal confere |
| Spam consome as 50 vagas | Turnstile, rate limit, revisão manual; `restantes` conta só ativos |
| Muito cadastro, pouco ativo | Funil até feedback; lista de espera dá reposição |
| Pin quebra no celular | Testar Android real; fallback sem pin |
| Sem vídeo na data | Seção funciona só com prints reais |
