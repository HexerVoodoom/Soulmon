# 04 — Lições do monster taming para o Soulmon

> Termos renomeados em 29/09/2026: vírus→poder, dado→harmonia, vacina→benevolência.

Pesquisa: setembro/2026. Base: benchmark do gênero (Pokémon, Digimon V-Pet 97,
Monster Rancher, Temtem, Cassette Beasts, Palworld, Pokémon Sleep/GO, Vital
Bracelet) + leitura de `CLAUDE.md` e `docs/PLANO-EVOLUCAO.md`.

---

## 1. O que faz vínculo e retenção no gênero — mecanismo por mecanismo

### Digimon V-Pet 1997 — o parente direto, e a lição mais importante
O V-Pet não pergunta "você venceu?"; pergunta **"como você cuidou?"**. Care
mistakes (ignorar a chamada por 20 min), overfeed e treino não punem com game
over — **selecionam outro galho de evolução**. Zero erros → Agumon; vários →
Numemon, o pior Champion. E a joia de design: um Numemon cuidado perfeitamente
vira **Monzaemon**, o Ultimate mais fofo — uma **rota de redenção** embutida na
"forma-castigo", com janela de 48h. O bicho ruim não é um beco; é um retrato
com saída. Fontes: [Evolution Guide DM Ver.1](https://humulos.com/digimon/dm/),
[Ver.20th](https://wikimon.net/Digital_Monster_Ver.20th),
[Digivicemon guia](https://digivicemon.com/digimon-v-pet-guide-version-1/),
[Numemon](https://digimon.fandom.com/wiki/Numemon).
Detalhe estrutural: **care mistakes zeram na evolução** — cada estágio é uma
página nova, o passado não persegue. O Soulmon já absorveu a metade boa disso
(`carePattern.ts`: Constante/Explosivo/Equilibrado como seletor, nenhum melhor);
a metade que falta é a *narrativa de redenção* visível.

**Morte/degeneração**: o V-Pet original matava (~20 care mistakes acumulados).
Isso criava peso emocional real, mas em hardware de bolso de 1997, com
expectativa de ciclos curtos. Num app de produtividade a morte é inaceitável;
a degeneração do Soulmon (HP 0) já é a versão domesticada — e as travas da
Fase 1 (teto 1 coração/dia, perdão de ausência, alívio de segunda) são
exatamente o que separa "peso" de "crueldade".

### Pokémon — starter, dex e shiny
Três motores distintos:
1. **Starter**: escolha irrevogável no minuto 1 + assimetria de poder no início
   (o starter carrega o time) → o jogador projeta identidade nele. O Oráculo do
   Soulmon vai além: a criatura não é escolhida, é **derivada de quem você é** —
   fantasia mais forte que a do starter, se a leitura parecer verdadeira.
2. **Dex**: completude como meta infinita, sem competição. O Soulmon já tem os
   análogos certos: Sonhos (`DREAM_CATALOG`, o Sleep Style Dex), missões
   permanentes, vitrine de jornada (5.2).
3. **Shiny**: raridade puramente **cosmética e identitária** — variação de cor,
   zero poder. É o modelo de raridade compatível com a essência do Soulmon
   ("identidade, não poder", já é a tese do reroll). Fontes:
   [Shiny Pokémon — Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Shiny_Pok%C3%A9mon),
   [Wikipedia](https://en.wikipedia.org/wiki/Shiny_Pok%C3%A9mon).

### Monster Rancher — geração a partir de algo SEU
A mágica não era o algoritmo, era a **origem**: o monstro nascia do *seu* CD —
um objeto da sua vida, com memória afetiva ("o monstro do meu álbum favorito").
408 monstros possíveis no MR2, mas o que vendia era "esse veio de mim". Fontes:
[LegendCup](https://legendcup.com/faq-generate-monsters.php),
[TheGamer sobre a nostalgia do CD](https://www.thegamer.com/monster-rancher-cd-database-nostalgia-journey-musical-past/),
[Gamepur](https://www.gamepur.com/guides/how-monster-generating-works-in-monster-rancher-1-2-dx).
O Oráculo do Soulmon (psicometria + mapa astral real + numerologia → criatura)
é o **Monster Rancher da identidade**: substitui o CD pela própria pessoa. É o
diferencial mais defensável do produto — nenhum concorrente de produtividade
tem isso. A condição para funcionar: a **explicabilidade parcial** ("regras
explicadas, resultados surpreendentes", princípio 5 do plano) — o jogador
precisa sentir que a criatura *diz algo sobre ele*, ou vira um gacha caro.

### Temtem e Cassette Beasts — o que NÃO copiar e o que copiar
- Temtem: 100% dos Temtem capturáveis por todos → sem identidade de coleção;
  grind punitivo e MMO obrigatório mataram a retenção casual. Lição negativa:
  **paridade total apaga o "meu"**.
- Cassette Beasts: a criatura é uma *fita que você toca* — o monstro é uma
  transformação do avatar, não um escravo — e a **fusão** entre parceiros é o
  clímax mecânico e narrativo. Rima direto com o conceito de fusão/Ultra do
  Soulmon e com "a criatura É você".

### Palworld — o contraexemplo útil
Vínculo por **utilidade** (Pals trabalham na base), não por identidade. Retenção
alta mas afeto raso e descartável ("caixa de ferramentas com carinha"). O
Soulmon deve ficar no polo oposto: **um** pet, insubstituível. O único
transplante são as **animações de vida própria** — Pals dormindo, comendo,
tropeçando criam afeto barato; o palco do Soulmon (decoração, cenários) já é a
moldura certa para micro-comportamentos idle.

### Pokémon Sleep / GO — perdão e ritual
Já absorvidos pelo plano (Fase 1 e 4): "nunca perde, só deixa de ganhar",
reset semanal do Snorlax, Community Day em janela de DIAS, tiers em vez de
ranking cru. O que falta extrair do GO: o **Buddy** — vínculo por *ações
diárias variadas e baratas* (alimentar, brincar, foto, caminhar) que sobem um
nível de amizade com marcos visíveis (coração na tela, badge "Best Buddy"). O
`bond.ts`/`bondLevelFor(totalXP)` já existe; falta dar a ele **rostos e nomes
de marco**, não só um número e um gate de PvP.

### Vital Bracelet — o alerta
Estagnação no meio da escada + conteúdo gateado por hardware/DLC (Dim Cards) +
servidores mortos = produto morto. O plano já internalizou (3.4 achatar o topo,
princípio 4 "íntegro com backend morto", princípio 1 sobre monetização).

---

## 2. Avaliação da fantasia central do Soulmon

**Tese**: "avatar que evolui COM o usuário e o encoraja". Veredito por sistema:

- **Oráculo** — ✦ o coração do produto. É Monster Rancher elevado: a criatura
  nasce da alma lida (psicometria + astro + numerologia), e o pipeline garante
  que a leitura chega até a forma final (11 formas, essência, companheiro).
  Risco 1: o jogador **não vê o porquê** — se o reveal mostrar só nome+descrição
  sem nenhum eco de "isso veio da SUA resposta X", a fantasia degrada para
  sorteio. Risco 2: reroll pago por Créditos em cima de resultado aleatório
  (já mapeado como pendência jurídica no plano) também corrói a fantasia — se
  a criatura É sua alma, rerolar é dissonante; enquadrar como "nova leitura"
  em vez de "girar de novo" resolve os dois problemas.
- **Galhos (vírus/dado/vacina via categoria da tarefa)** — fiel ao melhor do
  V-Pet: o galho é *retrato do comportamento*, e o `BranchForecast` dá a
  antecipação (o motor emocional nº 1 do gênero: "o que ele vai virar?").
  O desempate por ritmo de cuidado (3.2) é a mecânica mais "Digimon de
  verdade" do app — mais que qualquer sprite jamais foi.
- **Ritmo de cuidado** — correto: três perfis, nenhum melhor, com humildade
  estatística (não desempata sem histórico). É care mistakes sem o julgamento.
- **Evolução manual + cadeado** — decisão acertada e rara no gênero (é o
  Everstone/B-para-cancelar transformado em cerimônia). Evolução como EVENTO
  escolhido > evolução como notificação.
- **Masmorra/Torneio** — funcionam como *palco de expressão* do pet, não como
  fonte de pressão: perder não toca no HP, tiers antes de ranking, janela de
  dias. Isso é o combate na dose certa para um v-pet — cuidado gera força,
  força se exibe, derrota não pune o cuidado.
- **Fragilidade real da fantasia**: quase todo o vínculo hoje é *mecânico*
  (barras, galhos). O que os grandes têm a mais é **memória e reação** — o
  bicho que se vira quando você chega, que lembra, que tem manias. O chat Groq
  e o `soulGoal` devolvido no relatório são sementes disso; é onde há mais a
  ganhar por real investido.

---

## 3. Recomendações concretas (17)

Ordenadas por (impacto no vínculo ÷ custo). Nenhuma quebra a essência nem os
princípios permanentes do plano.

1. **Rota de redenção nomeada na degeneração** (Numemon→Monzaemon). Quando o
   pet degenera por HP 0, mostrar na página de Evolução um caminho especial de
   volta ("cuide bem por N dias e ele floresce numa forma que só existe por
   esse caminho"). A degeneração vira capítulo, não punição. Encaixa em
   `types/progression.ts` + `computeDailyReset`.
2. **Marcos de Vínculo com nome e cerimônia**. `bondLevelFor(totalXP)` já
   existe; dar 4–5 marcos nomeados estilo Buddy do GO (Conhecido → Amigo →
   Melhor Amigo → Alma Gêmea), cada um com micro-cerimônia e um
   comportamento novo do pet (ex.: passa a correr até a borda quando o app
   abre). Custo baixo, é fiação sobre número existente.
3. **Ecos do Oráculo no cotidiano**. O pet cita, raramente, algo da leitura
   ("você me disse que queria X…" — `soulGoal` já volta no relatório; estender
   ao chat idle via prompt do `functions/api/chat.js`, que já recebe
   aiSettings). É o "criatura que sabe de onde veio" — o antídoto contra
   "resultado sorteado".
4. **Variação rara cosmética na geração** (o shiny do Soulmon): ~1 em N
   leituras do Oráculo produz uma paleta alternativa, declarada no reveal como
   "alma iridescente". Zero poder (regra já existente: stats por estágio, não
   por espécie). Identidade + boca-a-boca, sem gacha de vantagem.
5. **Álbum de formas vividas**. A vitrine de jornada (5.2) deve guardar o
   SPRITE de cada forma que o pet já foi, com datas — "quem ele já foi" é a
   dex pessoal de um jogo de pet único. Barato: os sprites já ficam no acervo
   (`spriteLibrary.ts`).
6. **Antecipação explícita do galho**: no `BranchForecast`, além da projeção,
   um teaser visual vago da próxima forma (silhueta/borrão do sprite gerado).
   "O que ele vai virar?" é o gancho de retenção nº 1 do gênero; silhueta
   custa um filtro CSS sobre sprite já gerado na evolução manual.
7. **Micro-comportamentos idle no palco** (lição Palworld/Tamagotchi): 3–5
   animações raras — cochilar, olhar a decoração equipada, reagir ao cenário.
   Reagir a itens que o jogador COMPROU fecha o loop decoração→afeto e dá
   sentido de longo prazo aos Bits.
8. **O pet reage à tarefa assombrada concluída** com fala específica ("essa
   estava te pesando, né?") — a mecânica 👻 já é a mais Soulmon do app; falta o
   pet *testemunhar* o alívio. É onde produtividade e vínculo se tocam.
9. **Memória curta no chat**: injetar no prompt do Groq um resumo de 3 linhas
   do estado (dias perfeitos recentes, welcomeBack, humor de ontem se houver).
   Pet que comenta "que bom te ver de volta depois de 3 dias" vale mais que
   qualquer sprite. Cuidado: humor continua NUNCA alimentando pontuação —
   alimentar FALA é outra coisa e é permitido pela regra atual.
10. **Traço de nascimento visível em comportamento**, não só em Estatísticas:
    o Guloso come com animação diferente, o Madrugador boceja de manhã. O
    traço (`petPassive`) é o que faz "o MEU bichinho"; hoje ele é uma linha de
    texto.
11. **Não achatar a raridade dos Sonhos**: manter legendary raro de verdade.
    A pesquisa de shiny é clara — raridade cosmética previsível-mas-rara é o
    equilíbrio ([Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Shiny_Pok%C3%A9mon)).
12. **Cerimônia de evolução como evento social opcional**: um card
    compartilhável (imagem gerada localmente: sprite antes/depois + dias de
    jornada). O gênero inteiro vive de "olha o que o meu virou". Sem rede
    obrigatória (princípio 4).
13. **Nunca permitir segundo pet simultâneo.** A tentação de "slots" virá
    (Palworld/coleção); ela destruiria a tese "avatar da pessoa". Se um dia
    houver coleção, que seja de FORMAS vividas (rec. 5) e sonhos, nunca de
    criaturas paralelas.
14. **Reroll → "Nova Leitura"**: reposicionar o reroll de Créditos como
    refazer o ritual do Oráculo (passa pelas perguntas de novo), não como
    botão de sorteio. Resolve fantasia + o risco ECA Digital apontado no
    plano (deixa de ser resultado aleatório comprado; é uma leitura
    determinística de novas respostas — o `Math.random()` de `oracle.ts`
    poderia virar seed derivada das respostas).
15. **Idade e aniversário do pet**: data de nascimento no reveal, e o pet
    comemora aniversários de mês/ano (fala + item cosmético único). Tamagotchi
    e Nintendogs provam que TEMPO COMPARTILHADO é a métrica sentimental que o
    jogador cita ("estou com ele há 8 meses"). Custo: um campo + checagem na
    virada (`playerDay`).
16. **Fusão como horizonte de endgame explícito** (Cassette Beasts/Omnimon-
    conceito-sem-o-nome): a página de Evolução deveria mostrar desde cedo que
    existe um estágio Ultra de fusão/transcendência, sem detalhar como. Meta
    de anos, não de semanas — resolve o "e depois do mega?" que matou o Vital
    Bracelet.
17. **Guardar a proporcionalidade da escada**: qualquer estágio novo deve pedir
    consistência-por-semanas, nunca mais-tarefas-por-dia (3.4 já decidiu isso;
    registrar como regra de rubrica para features futuras — é o erro que o
    gênero mais repete no endgame).

---

## Fontes

- [Evolution Guide — Digital Monster Ver.1 (Humulos)](https://humulos.com/digimon/dm/)
- [Evolution Guide — DM Ver.20th (Humulos)](https://humulos.com/digimon/dm20/)
- [Digital Monster Ver.20th — Wikimon](https://wikimon.net/Digital_Monster_Ver.20th)
- [Digimon V-Pet Guide Ver.1 — Digivicemon](https://digivicemon.com/digimon-v-pet-guide-version-1/)
- [Numemon — DigimonWiki](https://digimon.fandom.com/wiki/Numemon)
- [Digimon (1997) — TV Tropes](https://tvtropes.org/pmwiki/pmwiki.php/Toys/Digimon1997)
- [How Monster Rancher generates monsters — LegendCup](https://legendcup.com/faq-generate-monsters.php)
- [Monster Rancher CD database nostalgia — TheGamer](https://www.thegamer.com/monster-rancher-cd-database-nostalgia-journey-musical-past/)
- [How monster generating works in MR 1&2 DX — Gamepur](https://www.gamepur.com/guides/how-monster-generating-works-in-monster-rancher-1-2-dx)
- [MR 1&2 DX review — COGconnected](https://cogconnected.com/review/monster-rancher-1-2-dx-review/)
- [Shiny Pokémon — Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Shiny_Pok%C3%A9mon)
- [Shiny Pokémon — Wikipedia](https://en.wikipedia.org/wiki/Shiny_Pok%C3%A9mon)
- Benchmark interno: `docs/PLANO-EVOLUCAO.md` (Pokémon Sleep/GO, Vital Bracelet, Habitica, Finch — ago/2026)
