# Prompts para o NotebookLM — extrair o que só existe em vídeo

A pesquisa escrita do `GUIA-EXPERIENCIA.md` bateu num teto: o sandbox não lê
transcrição de YouTube (bloqueio de IP). O NotebookLM lê. Este arquivo é a fila
de perguntas que fecha essa lacuna — **uma por vez**, cada uma dizendo ao modelo
QUAIS fontes usar.

## Antes de começar: o limite de fontes

O NotebookLM aceita **50 fontes por notebook** (plano grátis) e 300 no Pro. A
biblioteca tem **84 vídeos**. Não jogue os 84 num notebook só — além de estourar
o limite, diluir 84 fontes numa pergunta piora a resposta: o modelo cita o que é
genérico e perde o específico.

**Divida em 3 notebooks temáticos** (cada um bem abaixo do teto):

- **A · Hábito e retenção** (~20): Duolingo streaks, Tim Gabe, NN/g, YC,
  Fogg/Clear/Eyal, Product School.
- **B · Vínculo e v-pet** (~20): Tamagotchi effect, v-pets, monster taming,
  mascote Duolingo.
- **C · Ética e monetização** (~20): GDC, Extra Credits, Errant Signal, Hodent,
  Sub Club, paywalls.

## Regras que fazem a resposta prestar

1. **Uma pergunta por vez.** Espere a resposta antes da próxima — a seguinte é
   escrita à luz do que voltou.
2. **Sempre nomeie as fontes** ("use apenas os vídeos X, Y e Z"). Sem escopo, o
   NotebookLM responde pela média do notebook.
3. **Peça citação e timestamp.** Sem isso não dá para separar o que o vídeo diz
   do que o modelo completou.
4. **Peça o que CONTRARIA a tese**, não só o que confirma. A pergunta que só
   busca confirmação sempre encontra.
5. **Se a fonte não responde, o modelo deve dizer isso** — declare essa exigência
   no prompt, ou ele preenche a lacuna com plausibilidade.

---

## Notebook A — Hábito e retenção

### A1 · Streak do Duolingo (a pergunta mais valiosa da fila)

> Use APENAS o episódio "Behind the product: Duolingo streaks" (Lenny's Podcast,
> com Jackson Shuttleworth). Descreva em detalhe o que ele conta sobre o Streak
> Freeze: como era antes, o que mudou quando passou a vir equipado por padrão, e
> quais números ou resultados ele cita. Depois liste o que ele diz sobre streaks
> que QUEBRAM a motivação em vez de sustentá-la. Cite trechos literais com
> timestamp. Se ele não tocar em algum ponto, diga explicitamente "não abordado"
> em vez de completar.

### A2 · O que sobra quando o streak zera

> Com base nos vídeos do Tim Gabe ("I Studied 500+ Gamified Apps" e "Why
> Leaderboards Kill App Retention") e no episódio de streaks do Duolingo:
> segundo essas fontes, quais mecânicas de gamificação sustentam retenção SEM
> depender de perda ou punição? Organize em tabela: mecânica · fonte · evidência
> citada · se é afirmação com dado ou opinião do autor.

### A3 · Onboarding: o paradoxo

> Use "How To Solve The App Onboarding Paradox" (Tim Gabe), "Onboarding: Skip it
> When Possible" e "3 Ways to Onboard New Users" (NN/g), e "Mastering onboarding"
> (Lenny's/Airtable). Onde essas fontes DISCORDAM entre si sobre quanto
> onboarding fazer antes de entregar valor? Apresente o desacordo, não a média.

### A4 · O momento do valor

> Nas mesmas fontes de A3 mais "How To Keep Your Users" (Y Combinator): como
> definem o "aha moment" e como recomendam MEDI-LO? Quero o método, não a
> definição.

### A5 · Behavior design aplicado

> Use os vídeos de BJ Fogg (B=MAP e Tiny Habits), James Clear (Identity-based
> Habits) e os dois de Nir Eyal (Hooked e Indistractable). Nir Eyal escreveu os
> dois livros: o que exatamente ele diz em "Indistractable" que contradiz ou
> limita o que defende em "Hooked"? Cite os dois lados com timestamp.

---

## Notebook B — Vínculo e v-pet

### B1 · Por que as pessoas ABANDONARAM o Tamagotchi

> Use "What happened to Hand-Held Digital Pets?" (Maia Faith) e "Tamagotchi
> Nostalgia: Why I Actually Hated Virtual Pets!" (Pew Moments). Liste, na ordem
> em que aparecem, cada motivo concreto de frustração ou abandono citado. Para
> cada um: é experiência pessoal do autor ou padrão que ele atribui a outros?

### B2 · O mecanismo do apego

> Use "Why Do Virtual Pets Give Us Real Feelings?" (PBS Game/Show) e "What's it
> like to be a robot?" (TED, Leila Takayama). Que mecanismos psicológicos são
> nomeados para explicar o apego a uma criatura virtual? Para cada um, diga se a
> fonte cita estudo/pesquisa ou se é argumento do apresentador.

### B3 · A morte e a punição

> Nas fontes sobre Tamagotchi e v-pets do notebook: o que dizem sobre a MORTE do
> bichinho e sobre punição por negligência? Separe o que é apontado como
> essencial ao apego do que é apontado como o que fez as pessoas desistirem.

### B4 · Criatura como identidade

> Use os vídeos de creature collector (Gym Leader Ed, frogMak, Rigamarolled,
> DavSketch) e "Creating Our Duolingo Characters". O que fazem uma criatura
> virtual ser sentida como "minha" e não como um avatar genérico? Liste as
> técnicas concretas citadas.

### B5 · Animar para criar vínculo

> Use "How we animate the Duolingo world" e "Design at Duolingo". Quais decisões
> técnicas e de design de ANIMAÇÃO eles ligam explicitamente a resposta emocional
> do usuário? Quero o mecanismo, não a lista de ferramentas.

---

## Notebook C — Ética e monetização

### C1 · Aversão à perda, com honestidade

> Use "Board Game Design and the Psychology of Loss Aversion" (GDC). Resuma o
> mecanismo e, principalmente: onde a palestra diz que usar aversão à perda é
> LEGÍTIMO e onde diz que vira abuso? Quero a fronteira que ele traça, com
> exemplos dele.

### C2 · Autonomia do jogador

> Use "The Freedom Fallacy: Understanding Player Autonomy" (GDC). Qual é a tese
> central e quais exemplos ele dá de sistemas que PARECEM dar liberdade mas não
> dão? Cite com timestamp.

### C3 · O catálogo de dark patterns

> Use "Dark Patterns: How Good UX Can Be Bad UX" (GDC), "Don't be a Victim of
> Dark Patterns!" e "How Video Games Use Supermarket Psychology" (Extra Credits).
> Monte a lista consolidada de padrões nomeados, com a definição de cada um e a
> fonte. Marque os que aparecem em mais de uma fonte.

### C4 · De-gamification

> Use "De-Gamification - Flexibility to Play Your Way" e "Gamification Sucks..."
> (Extra Credits) e "Errant Signal - Gamification". Qual é a crítica mais forte
> que essas fontes fazem a aplicar pontos e recompensas a atividades da vida
> real? Construa o caso CONTRA a gamificação da produtividade — não o equilibrado,
> o mais forte que as fontes sustentam.

### C5 · A fronteira da monetização

> Use "Monetization Design: The Dark Side of Gacha" e "Business of Fair Play"
> (GDC), mais os três episódios do Sub Club (RevenueCat). Que critérios são
> propostos para separar monetização justa de exploratória? Liste como checklist
> aplicável.

### C6 · Métrica que engana

> Use "Data-Driven or Data-Blinded?" (GDC) e "A Practical Guide for Doing Ethical
> Player Testing". Quais armadilhas específicas de métrica e de teste com
> usuários são descritas? Para cada uma, o antídoto que a fonte propõe.

---

## Depois

Traga cada resposta de volta para a sessão. As que trouxerem material novo
entram no `GUIA-EXPERIENCIA.md` **com a fonte marcada como "via transcrição"** —
para ficar distinguível do que veio de fonte escrita, que é a distinção que a
primeira rodada de pesquisa não conseguiu fazer.
