# 03 — Gamificação, streaks e engajamento sem culpa

> Etapa STREAK/engajamento do guia. Base: `CLAUDE.md` do Soulmon (regras vigentes),
> `docs/PLANO-EVOLUCAO.md` (benchmark ago/2026 + essência declarada) e pesquisa
> externa (set/2026). Tese não negociável do produto: **o Soulmon não é cobrador**
> — não existe streak que zera (há teste travando isso em `habitRhythm.ts`), a
> primeira falha é invisível, e perda nunca toca identidade/progresso acumulado.

---

## 1. O estado da arte, em resumo utilizável

### 1.1 Frameworks

**Octalysis (Yu-kai Chou)** divide motivadores em White Hat (significado épico,
realização, empoderamento criativo — sustentáveis, geram bem-estar) e Black Hat
(escassez, imprevisibilidade, perda/evitação — potentes no curto prazo, geram
ansiedade e churn quando dominantes). O streak clássico é **puro Black Hat core
drive 8 (loss avoidance)**: retém enquanto dói, e a dor é exatamente o que faz
desinstalar quando quebra.

**SDT (Deci & Ryan)** — autonomia, competência, relacionamento. Recompensa
externa contingente demais **corrói** motivação intrínseca (overjustification).
O antídoto é recompensa *informacional* (celebra progresso) em vez de
*controladora* (condiciona comportamento).

**Hooked (Eyal)** — gatilho → ação → recompensa variável → investimento. O
Soulmon já tem o loop completo: push/widget → tarefa → drop/fala do pet/sonho →
decoração/vínculo/evolução. A recompensa variável saudável é a que varia em
**sabor** (qual sonho, qual fala, qual drop cosmético), não em **se existe**
recompensa pelo esforço central.

**Efeito de violação da abstinência** (Marlatt): quebrou um dia → "já era" →
abandono total. É o mecanismo pelo qual streak-que-zera mata retenção de cauda
longa, e é o que o "N das últimas 7" do Soulmon neutraliza por construção
(uma falha custa ~14%, não 100%).

### 1.2 Benchmarks

| Produto | Mecânica | Lição |
|---|---|---|
| **Duolingo** | Streak diário + **Streak Freeze** (2 grátis, até 5 na Streak Society), **Perfect Streak** (halo dourado por semanas sem freeze), widget de home com a mascote reagindo à hora do dia | O streak dobra retenção diária ([Deconstructor of Fun](https://duolingo.deconstructoroffun.com/mechanics/streaks)), **mas só depois que o freeze veio equipado por padrão** — o Soulmon já copiou o certo (escudos automáticos). O Perfect Streak mostra que dá pra ter camada de prestígio **puramente visual, sem punição** ([breakdown](https://medium.com/@salamprem49/duolingo-streak-system-detailed-breakdown-design-flow-886f591c953f)). O widget é o maior achado de retenção deles: usuários com widget retêm melhor ([Fandom wiki](https://duolingo.fandom.com/wiki/Streak), [dev.to](https://dev.to/bhumica08/what-duolingo-taught-me-about-retention-and-how-id-build-it-into-my-own-apps-438j)) |
| **Snapchat** | Snapstreak recíproco | Caso-limite abusivo: ansiedade documentada em adolescentes, gente entregando senha pra amigo manter streak nas férias. **Não copiar nada social-recíproco com prazo** |
| **Habitica** | Dano de HP por falha, Pousada manual | O anti-modelo do PLANO-EVOLUCAO: proteção que exige ativar antes de falhar não protege ninguém |
| **Finch** | Zero punição; o pássaro "espera você voltar"; **widget mostra SEU pet com SUAS roupas/decoração** | O elogio mais repetido: "não me faz sentir culpado". O widget personalizado é motor de retenção declarado ([Deconstructor of Fun](https://www.deconstructoroffun.com/blog/x0hd2ssr80y5n7gv0w967pg7hwd7tl), [screensdesign](https://screensdesign.com/showcase/finch-self-care-pet)) |
| **Forest** | Árvore morre se sair do app (perda simbólica, opt-in por sessão) | Perda aceitável porque o usuário **escolhe apostar** a cada sessão — perda só sobre o que foi voluntariamente colocado em jogo |
| **Pokémon Sleep** | Nunca perde; segunda-feira reseta o Snorlax; Sleep Style Dex colecionável | US$234,9M em 3 anos com queda de só 3,2% no ano 3 (dado do PLANO-EVOLUCAO). O Soulmon já importou o alívio semanal e o Dex de Sonhos |

### 1.3 Regras destiladas (o que separa loss aversion boa da abusiva)

1. Perda só sobre **recurso recuperável e voluntariamente apostado** (run da
   masmorra, aposta do Forest) — nunca sobre identidade, coleção ou progresso.
2. Proteção contra falha **por padrão**, nunca opt-in (Streak Freeze equipado;
   escudos automáticos do Soulmon).
3. Contador que **acumula** retém; contador que **zera** produz o efeito de
   violação da abstinência.
4. Recompensa variável no **cosmético/narrativo**, determinística no **essencial**.
5. Prestígio visual (Perfect Streak) captura o orgulho do streak sem o custo
   psicológico — a punição por falhar é só voltar ao visual normal.

---

## 2. A arquitetura motivacional atual do Soulmon (auditoria)

### Pontos fortes (não mexer — muitos têm teste travando)

- **Constância "N das últimas 7"** (`habitRhythm.ts`) + denominador só de dias
  devidos + progresso dotado (hábito novo nasce em 100%). É estado da arte;
  poucos apps comerciais fazem isso.
- **Escudos automáticos** (`applyMissedDay`) — a lição do Streak Freeze,
  aplicada certa desde o dia 1.
- **Never miss twice** com intervenção em versão reduzida ("hoje, só 5 min?")
  — BJ Fogg (tiny habits) + Finch, e a redução **conta como feito**.
- **Marcos 7/21/66** (Lally et al. 2010, não o mito dos 21 dias) com tier
  visual e multiplicador **sempre ≥ 1**.
- **perfectDays só acumulam**; teto de 1 coração/dia; perdão de ausência ≥2
  dias; alívio de segunda; fresh start que perdoa sem apagar.
- **Tarefa assombrada**: transforma culpa (backlog vermelho) em loop com
  recompensa de alívio — a peça mais original do design.
- **Humor nunca vira score**; janela de descanso premia comportamento, não
  resultado (anti-ortossonia); Dex de Sonhos só cresce.
- **Faixas do Torneio antes do ranking absoluto** — comparação consigo mesmo.
- Octalysis: o app é fortemente **White Hat** (CD1 significado: oráculo/alma;
  CD2 realização: evolução, marcos; CD4 propriedade: pet gerado da SUA alma,
  decoração; CD7 imprevisibilidade benigna: sonhos, drops cosméticos). Black
  Hat existe mas domado (HP com teto + perdões; cocô com dreno limitado).

### Lacunas frente aos frameworks

1. **O acúmulo de constância é pouco VISÍVEL.** O "N das últimas 7" é melhor
   que streak, mas o streak vence em *legibilidade e orgulho*: um número que só
   cresce, mostrável. O Soulmon tem os dados (`totalDone`, marcos, tiers
   seed→tree) mas não tem um **número de identidade** equivalente ao "🔥 347".
2. **Widget aquém do potencial.** Duolingo e Finch provam que o widget é
   possivelmente O maior multiplicador de retenção — e o do Finch funciona
   porque mostra o pet *personalizado*. O widget Android do Soulmon existe
   (`WidgetRenderer.kt`), mas precisa carregar o máximo de identidade possível
   (sprite da criatura, decoração, marcos) dentro dos limites de RemoteViews.
3. **Celebração assimétrica.** Há cerimônia de evolução e celebração de marco
   (toca 1×, `milestoneReached`), mas os intervalos entre marcos são longos
   (7→21→66 dias): buraco de ~6 semanas entre sprout e tree sem nada para
   celebrar. Variable reward de celebração (falas raras, animações raras ao
   concluir) pode preencher sem inflacionar recompensa material.
4. **CD5 (influência social) quase ausente por design** — correto para evitar
   comparação tóxica, mas há formas white-hat não exploradas (compartilhar o
   card do pet/sonho raro, sem ranking).
5. **Prestígio sem punição inexplorado**: não há equivalente do Perfect Streak
   — um selo visual para períodos de constância alta que, ao acabar, apenas
   *some* (volta ao normal) em vez de punir.
6. **Investimento (Hooked, fase 4)**: o "porquê" (`soulGoal`) é coletado e
   devolvido, ótimo; mas o usuário investe pouco *conteúdo* de volta no pet
   além de decoração (ex.: nomear sonhos, diário curto que o pet relembra).

---

## 3. Como capturar o poder do streak SEM trair a tese

O streak funciona por quatro mecanismos, e três são separáveis da punição:

| Mecanismo do streak | Punitivo? | Equivalente Soulmon |
|---|---|---|
| Número único, legível, que cresce | Não | **Contador de "dias de cuidado" lifetime** (dias com ≥1 ação — nunca zera, por definição não pode zerar) |
| Identidade/orgulho ("sou uma pessoa de 300 dias") | Não | Tier do hábito (seed→tree) + selo de prestígio temporário estilo Perfect Streak |
| Presença diária no campo visual (widget, ícone) | Não | Widget com o pet real + estado do dia |
| Medo de perder o acumulado | **Sim** | NÃO importar. Substituir por "saudade" (o pet sente sua falta, nunca sofre dano por ela) |

Princípio-guia: **acumular no lugar de manter**. Todo contador exposto deve ser
monotônico (lifetime, "N de 7", tiers) — a falha muda a *taxa* de crescimento,
nunca o *sinal*.

---

## 4. Recomendações priorizadas

Formato: **P0** (maior alavanca de retenção, alinhado à tese) → **P3** (opcional).
Cada item cita a mecânica real do app.

### P0 — Visibilidade e presença

1. **Widget = janela do pet, não painel de dados.** Renderizar no
   `WidgetRenderer.kt` o sprite da criatura ATUAL (já trafega pelo
   `DigiWidgetPlugin`) com humor do dia (dormindo na janela de descanso,
   feliz após dia perfeito, "com saudade" após 2+ dias — carinha triste-fofa,
   nunca doente). É a mecânica nº 1 de retenção do Finch e do Duolingo.
2. **Contador lifetime de "dias juntos"** no perfil e no widget: dias corridos
   desde o nascimento do pet + "dias em que você apareceu" (`totalDone`
   agregado). Só cresce; dá o número de identidade do streak sem o zeramento.
3. **Anel de constância na home**: visual único (anel 0–7 preenchido pelo
   `constancy` da janela) em vez de número percentual. Uma falha = anel 6/7,
   visivelmente "quase cheio" — comunica o ~14% em vez do abismo.
4. **Widget de desktop já existe** (overlay Electron) — garantir que ele mostre
   o mesmo estado emocional do dia (já lê o save via `/api/save`).

### P1 — Prestígio sem punição (o "Perfect Streak" do Soulmon)

5. **Selo "Em ritmo"** (nome sugestão: *Aura*): quando `constancy ≥ 6/7` em
   todos os hábitos devidos, o pet ganha um brilho/partícula no palco e no
   widget. Ao cair, o brilho **apenas some** — sem toast, sem texto, sem perda
   de nada. É o halo dourado do Duolingo com custo de quebra zero.
6. **Marcos intermediários de celebração (não de recompensa)**: entre 21 e 66
   dias, falas especiais do pet a cada ~15 dias efetivos ("a gente já fez isso
   36 vezes!"). Usa `totalDone` — celebração via Groq/falas, sem mexer em
   `HABIT_MILESTONES` nem em `HABIT_TIER_BONUS` (que têm teste travando).
7. **Celebração com recompensa variável cosmética**: ao concluir tarefa, ~5%
   de chance de animação/fala rara (confete retrô, o pet dançando). Variable
   reward no sabor, nunca no valor (a comida/energia continua determinística).
8. **Selo de Foco do dia** (as 3 completas) merece celebração visível no palco
   naquele dia — hoje `focusComplete` existe mas o selo é discreto.

### P1 — Retorno (o momento mais crítico da retenção)

9. **Roteirizar a volta como o melhor momento do app.** O dado já existe
   (`welcomeBack`, `daysAway`): o pet corre até a tela, festa de reencontro,
   e o check-in de retorno oferece UMA ação mínima ("só 5 min?"). Finch: "your
   bird simply waits for you" é o elogio mais citado nas reviews.
10. **Push de saudade, não de cobrança**: um único push após ~3 dias, na voz do
    pet ("sonhei com você"), nunca "você está perdendo seu progresso". Nunca
    diário-insistente (o backlash do Duolingo passivo-agressivo é documentado).
11. **Fresh start ativo**: na segunda/dia 1 (`isFreshStartDay`), o pet OFERECE
    o recomeço a quem está com constância baixa ("bora recomeçar juntos?") —
    hoje o `freshStartOffer` existe; garantir que a UI o apresente como convite
    caloroso, não como botão administrativo.

### P2 — Aprofundar o loop Hooked (investimento)

12. **Devolver o `soulGoal` em mais pontos**: na cerimônia de evolução ("você
    disse que queria X — olha quem crescemos por causa disso"). A evolução é o
    pico emocional; ancorá-la no "porquê" é SDT puro (autonomia + significado).
13. **Diário de uma linha opcional no check-in** que o pet relembra dias depois
    ("semana passada você escreveu que…"). Investimento do usuário no pet =
    fase 4 do Hooked; o Finch faz com reflexões.
14. **Compartilhamento white-hat**: botão de exportar card do pet (sprite +
    dias juntos + sonho raro) como imagem. CD5 sem ranking, sem comparação —
    o usuário mostra o SEU bicho, não uma posição.
15. **Sonhos como recompensa variável de manhã**: o `rollDream` já prefere
    não-coletados; dar ao reveal do sonho um momento de UI próprio (virar
    carta) em vez de linha no relatório.

### P2 — Ajustes de leitura

16. **Nunca expor porcentagem de constância crua** — sempre "5 dos últimos 7"
    ou o anel (item 3). Percentual convida a leitura de nota escolar.
17. **Escudos visíveis como carinho, não como itens**: mostrar os até 3 escudos
    como "cobertinhas" que o pet guarda para os dias difíceis; quando um é
    consumido, o relatório diz "usei uma cobertinha por você" — reforça que a
    proteção é automática e afetiva.
18. **Relatório semanal com trajetória, não veredito** (já é a regra): incluir
    minigráfico dos últimos 28 dias de `effortDone` — tendência é a métrica
    anti-streak por excelência (Beeminder/quantified-self, sem a punição).

### P3 — Guardrails (o que NUNCA fazer, consolidado)

19. **Nunca**: streak que zera (teste travando), streak social recíproco
    (Snapchat), push de perda ("seu progresso vai sumir"), ranking absoluto
    antes de faixa, contador exposto que pode diminuir, proteção opt-in,
    recompensa por contagem de tarefas (regra vigente — a meta é ponderada por
    esforço justamente contra o exploit do Karma do Todoist).
20. **Se um dia houver monetização de proteção** (estilo freeze comprável):
    não. Vender proteção cria incentivo comercial para a punição existir — é o
    conflito de interesse estrutural do Duolingo que o Soulmon não tem e não
    deve adquirir. Créditos seguem comprando conveniência (cura, reroll),
    nunca alívio de punição.
21. **Toda mecânica nova passa pelo filtro do PLANO-EVOLUCAO**: "isso faz o
    bichinho parecer mais um companheiro, ou mais um chefe?" — e pelo teste:
    nenhuma função nova pode devolver número exposto que diminui.
22. **Medir antes de adicionar Black Hat**: se retenção D30 decepcionar, a
    tentação será "adicionar streak". A resposta correta é medir onde o funil
    quebra (onboarding? volta do dia 3? pós-evolução?) — os benchmarks
    (Pokémon Sleep, Finch) provam que retenção de longo prazo vem do White Hat.

---

## Fontes

- [Duolingo Streaks — Deconstructor of Fun](https://duolingo.deconstructoroffun.com/mechanics/streaks)
- [Duolingo Streak System Breakdown — Premjit Singha](https://medium.com/@salamprem49/duolingo-streak-system-detailed-breakdown-design-flow-886f591c953f)
- [Streak — Duolingo Wiki](https://duolingo.fandom.com/wiki/Streak)
- [What Duolingo Taught Me About Retention — dev.to](https://dev.to/bhumica08/what-duolingo-taught-me-about-retention-and-how-id-build-it-into-my-own-apps-438j)
- [How Duolingo Built and Iterated Streaks](https://elsewhere.news/en/linearcapital/duolingobolt)
- [Hot Streak Design Without Shame — UX Magazine](https://uxmag.medium.com/the-psychology-of-hot-streak-game-design-how-to-keep-players-coming-back-every-day-without-shame-3dde153f239c)
- [How Finch Uses Gamified Widgets to Drive Retention — Deconstructor of Fun](https://www.deconstructoroffun.com/blog/x0hd2ssr80y5n7gv0w967pg7hwd7tl)
- [Finch Showcase — screensdesign](https://screensdesign.com/showcase/finch-self-care-pet)
- [Finch Design Critique — IXD@Pratt](https://ixd.prattsi.org/2026/02/design-critique-finch-self-care-pet-ios-app/)
- [Keeping the Streak Alive: Motivation and Language Learning in Duolingo (tese, Oulu)](https://oulurepo.oulu.fi/bitstream/handle/10024/54117/nbnfioulu-202502121605.pdf?sequence=1&isAllowed=y)
- Internas: `/home/user/Soulmon/docs/PLANO-EVOLUCAO.md`, `/home/user/Soulmon/CLAUDE.md`
- Literatura: Deci & Ryan (SDT); Yu-kai Chou, *Actionable Gamification* (Octalysis); Nir Eyal, *Hooked*; Lally et al. 2010 (66 dias); Marlatt (abstinence violation effect); Nunes & Drèze (endowed progress); Dai, Milkman & Riis (fresh start effect); BJ Fogg, *Tiny Habits*.
