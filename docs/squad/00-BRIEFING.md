# Briefing do Squad de Revisão — Soulmon

> **Leia este arquivo ANTES de qualquer análise.** Ele é a fonte única de contexto
> compartilhado do squad. Não re-derive o que já está aqui.
> Última atualização: 2026-08-02.
>
> ⚰️ **21/09/2026 — a squad de revisão (`soulmon-maestro` + especialistas) foi aposentada**
> (governança, `02-SQUAD.md` › lápide). Este briefing e a `01-RUBRICA.md` ficam como o
> **contexto de entrada** para quem instanciar uma nova rodada pela skill global
> `squad-alpha` (`alpha-briefer` lê os dois e monta o bloco de contexto). Fatos de produto
> aqui têm data de 08/2026 — o manual (`docs/manual/00-MAPA.md`) e o `STATUS.md` vencem.

---

## 1. A tese do produto (o que o Soulmon É — e o que ele NÃO é)

**Soulmon é um app de gestão de tarefas cuja mecânica de motivação é a criação e o
crescimento de uma criatura que representa a alma do usuário.**

A criatura não é um enfeite nem um sistema de pontos disfarçado. Ela é um **espelho**:
nasce de um ritual de origem (o Oráculo), cresce, evolui, regride e muda de rumo
conforme o comportamento real da pessoa no mundo físico. A promessa emocional é a do
Digimon — "existe uma criatura que é minha, que é *de mim*, e ela só existe de verdade
se eu existir de verdade".

### Hierarquia de valor (NÃO inverter)

| Camada | Papel | Exemplos no produto hoje |
|---|---|---|
| **1. Núcleo** | Gestão de tarefas + motivação para executá-las | tarefas/atividades, energia, dia perfeito, HP, evolução/degeneração, notificações |
| **2. Vínculo** | O laço alma↔criatura que dá sentido ao núcleo | Oráculo de origem, sprites gerados, chat/personalidade, carinho, cuidado, linha evolutiva pessoal |
| **3. Riqueza** | Profundidade e engajamento que sustentam o hábito | masmorra, minijogos (Dino, PPT), torneio PvP, loja, missões, biblioteca, cenários |

**Regra de arbitragem do squad:** toda recomendação que fortalece a camada 3 às custas
da 1 ou 2 é recusada por padrão. Toda recomendação da camada 3 precisa declarar
explicitamente como ela *devolve* valor para as camadas 1 e 2.

### Anti-objetivos declarados
- Não virar "mais um app de to-do com badges".
- Não virar um jogo que a pessoa joga *em vez de* fazer as tarefas.
- Não usar culpa/perda como principal motor (o custo de falhar existe, mas não pode
  produzir abandono — ver agente de psicologia).
- Não depender de propriedade intelectual de terceiros para existir.

---

## 2. Estado atual do produto (fatos verificados no repo em 2026-08-02)

**Repositório:** `github.com/HexerVoodoom/Soulmon` (local: `D:\Soulmon\repo`, branch `main`)

### Stack
React 18 + TypeScript + Vite 6 · Tailwind v4 (CSS pré-compilado, sem plugin) ·
shadcn/ui (Radix) · Capacitor 8.4 (APK Android) · PWA com Service Worker ·
Cloudflare Pages + Pages Functions + Workers (cron) + KV · Supabase (cloud save) ·
Groq (LLM do chat, `llama-3.1-8b-instant`) · Higgsfield (geração de sprites) ·
Web Push VAPID + FCM nativo · i18n pt-BR/en-US · Vitest (~6 arquivos de teste).
~196 arquivos `.ts/.tsx`, `App.tsx` com ~1500 linhas.

### Loop principal implementado
1. Usuário cadastra tarefas/atividades.
2. Concluir tarefa → enche **barra de energia** (nº de barras = requisito do estágio).
3. **Dia perfeito** = cumprir o requisito + energia cheia → +1 ponto de evolução.
4. Na virada do dia: não cumprir → perde **corações (HP)** proporcional ao não feito.
5. HP 0 → **degeneração** (a criatura regride de forma).
6. Cuidado paralelo: alimentar (atributos poder/harmonia/benevolência → galho evolutivo),
   fazer carinho (cura HP, máx 1 coração/dia), limpar cocô, banho, dormir.
7. Evolução ramificada por atributo + itens de evolução + trava de evolução manual.

### Camada de riqueza implementada
Masmorra (run de 5 andares, escada de 6 inimigos, dificuldade semanal, drops raros,
custo de 1 coração ao perder) · Dino runner · Pedra-papel-tesoura · Torneio PvP ·
Loja com moeda **Bits** (chips de atributo, coraçõezinhos, itens de evolução, 11 cenários) ·
6 missões permanentes que desbloqueiam cenários exclusivos · Biblioteca · Oráculo de
origem no onboarding (inclui campo "criatura favorita") · Pixelizer.

### Infra de retenção implementada
Push agendado (10h / 16h / 21h / 22h BRT) via Worker cron, condicionado ao progresso ·
Alarmes nativos Android (`AlarmManager`) · Widget Android · Relatório diário ·
Cloud save por hash de e-mail.

### O que NÃO existe hoje
- **Monetização de qualquer tipo.** Nenhum IAP, assinatura, anúncio ou paywall.
- **Telemetria/analytics.** Não há instrumentação de funil, retenção ou coorte.
- **Contas de verdade.** Identidade = SHA-256 do e-mail digitado; sem autenticação.
- **Social real.** O "PvP" e a comunidade não têm backend multiplayer verificado.
- **Publicação em loja.** Ainda não está na Play Store / App Store.

### Dívidas e riscos já visíveis (ponto de partida, não conclusão)
1. **Risco de PI (crítico).** O código ainda carrega nomes e sprites literais de
   Digimon (Agumon, Greymon, Numemon, Monzaemon, "Digimentais", sprites derivados do
   repo `furudbat/wayland-vpets`). A migração para criaturas originais começou
   (ex.: `Pyrakamon`, linhas Kaelen/Orrin/Thalindra) mas está incompleta. Isso é
   bloqueante para lançamento em loja e para qualquer monetização.
2. **Documentação desalinhada — RESOLVIDO em 07/09/2026.** Este item dizia que
   `docs/` ainda descrevia o produto como "DigiApp" e que o `00-START-HERE.md`
   se declarava "100% completo, 0 bugs", e concluía: "trate documentação antiga
   como histórico". **O aviso não funcionava**: ele morava aqui, e os onze
   documentos mentirosos moravam em `docs/` com títulos de autoridade
   (`00-START-HERE`, `README`, `DOCS-INDEX`) — este mesmo parágrafo mandava
   começar pelo pior deles. Todos foram para `docs/historico-digiapp/`, atrás de
   um `LEIA-ANTES.md` que tabela regra por regra o que cada um ensinava de
   errado. O `docs/00-START-HERE.md` de hoje é um índice real.
3. **Complexidade de sistemas alta para um produto sem validação de usuário.** Há mais
   sistemas de camada 3 do que evidência de que o loop da camada 1 retém.
4. `App.tsx` monolítico; cobertura de testes concentrada em reset diário/oráculo.

---

## 3. A pergunta que o squad existe para responder

> **O que falta para o Soulmon ser um produto de sucesso — isto é, um app que as
> pessoas abrem todo dia, que efetivamente as faz executar suas tarefas, que elas
> amam a ponto de não desinstalar, e que se sustenta financeiramente?**

Desdobrada em cinco perguntas que todo relatório deve ajudar a responder:

1. **Funciona?** O loop de motivação realmente muda comportamento, ou é novidade que
   dura 5 dias?
2. **É amado?** O vínculo alma↔criatura se sustenta, ou a criatura é decorativa?
3. **É diferente?** Contra Habitica, Finch, Forest, Duolingo, Pokémon Sleep — o que só
   o Soulmon faz?
4. **Sustenta-se?** Existe um modelo de receita compatível com a promessa emocional?
5. **Pode existir?** Riscos de PI, plataforma, privacidade e viabilidade técnica.

---

## 4. Regras de trabalho do squad (valem para TODOS os agentes)

### Método
1. **Leia o produto antes de opinar.** Use `Read`/`Grep`/`Glob` no repo. Cite arquivo e
   linha (`src/utils/dungeon.ts:42`) ao afirmar algo sobre o produto. Afirmação sobre o
   Soulmon sem evidência no código ou nos docs é proibida.
2. **Pesquise o mercado com fonte.** Use `WebSearch`/`WebFetch`. Toda comparação com um
   concorrente precisa de link e data. Não invente números de mercado, de receita ou de
   retenção — se não achou o dado, escreva "sem dado público confiável" e siga.
3. **Separe fato de opinião.** Marque `[FATO]` (verificável no repo ou em fonte citada)
   e `[HIPÓTESE]` (seu julgamento profissional). Nunca disfarce hipótese de fato.
4. **Seja específico e acionável.** "Melhorar o onboarding" não é recomendação.
   "Cortar o Oráculo de 7 para 3 perguntas e revelar o ovo antes de pedir o e-mail" é.
5. **Priorize com custo.** Toda recomendação recebe Impacto (1-5), Esforço (1-5) e
   Confiança (1-5). Sem isso, o Maestro descarta.
6. **Discorde.** Se sua análise contradiz outro agente ou a tese do produto, diga.
   Conflito explícito é mais útil ao Maestro do que consenso educado.
7. **Fique no seu escopo.** Você é especialista em uma coisa. Cobrir tudo superficial
   é pior que cobrir seu domínio a fundo. Aponte o que é de outro agente e siga.

### Restrições
- **Nenhum agente do squad modifica código-fonte.** Vocês produzem análise, não commits.
  A única escrita permitida é o seu relatório em `docs/reviews/<data>/`.
- Textos em **pt-BR**.
- Sem bajulação, sem "excelente projeto!", sem resumo executivo que não decide nada.
  Um relatório que não muda uma decisão é um relatório falho.

### Entregável
Cada agente escreve **um** arquivo:
`docs/reviews/<AAAA-MM-DD>/<nome-do-agente>.md`
seguindo o template obrigatório em [`01-RUBRICA.md`](01-RUBRICA.md).
</content>
</invoke>
