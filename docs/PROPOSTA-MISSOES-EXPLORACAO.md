# Travessias (Crossings) — desafios da vida real acessados pela Exploração

> **Etiqueta: plano** (proposta, 30/09/2026). **Nada implementado.** Não decide regra: a precedência continua
> código > teste > `CLAUDE.md` > manual > plano. Pedido do dono (30/09/2026): *"evolua as explorações para
> incluírem MISSÕES — desafios extras, acessíveis via exploração, para estimular o usuário a ir além do
> cotidiano, 'levantando a barra', propondo desafios que ele precisa cumprir na vida real para progredir"*.
>
> Parte de [`BENCHMARK-EXPLORACAO.md`](BENCHMARK-EXPLORACAO.md) e das respostas do dono em
> [`PERGUNTAS-DO-DONO.md`](PERGUNTAS-DO-DONO.md) (Exploração: só o **Passeio, fundido à Aventura da noite**, pet
> "passeando" diegético). Pareceres em [`reviews/2026-09-30-missoes/`](reviews/2026-09-30-missoes/). Perguntas
> abertas **MIS-1..MIS-n** em `PERGUNTAS-DO-DONO.md`.
>
> **✅ Decidido pelo dono (modal de 30/09/2026):** exceção à Camada 3 com as condições dos pareceres · nome
> **Travessias / Crossings** (não "Missões", que é da loja, nem "Expedição", que na bíblia é a fenda, L5) · barra
> por **amplitude**, nunca por dificuldade crescente · postal e lore **exclusivos por região** (exceção registrada
> à regra 4 da Aventura). Pendentes com padrão: MIS-5..MIS-12. Onde este texto ainda diz "Expedição", leia
> "Travessia" — é a versão submetida aos pareceres.
>
> **⚠️ Camada 3.** A exceção que o dono abriu (EXP-1) é **estreita**: o Passeio fundido à Aventura. Missões são
> mecânica nova acima do núcleo e precisam de exceção própria (pergunta MIS-1).

---

## 0. O que já existe e sobrepõe (o "já existe?")

| Peça | Onde | O que faz | Por que importa |
|---|---|---|---|
| Missões permanentes | `src/utils/missions.ts` | 6 objetivos de jogo (evoluir, kills, Dino, dias completos) → liberam cenários `bg-mission-*` na loja | O nome "Missões" **já é da loja**. Missão de vida real precisa de nome próprio no jogo (sugestão: **Expedições** / *Expeditions*) |
| Missões semanais | `src/utils/weeklyMissions.ts` | 3 por semana, determinísticas por `weekKey`, pool de CUIDADO e PRESENÇA, pagam Emblemas | Precedente da cadência e da proibição escrita "nenhuma premia contagem de tarefas" |
| Subir de nível do catálogo | `utils/catalogLevel.ts`, `PLANO-CATALOGO-ATIVIDADES.md` §4 | Sugere nível+1 de um hábito quando a constância é alta; só se aceitar; desce sem punição | **Já é o "levantar a barra" do hábito recorrente.** Expedição não pode ser um segundo caminho para o mesmo: ela é o ato **único**, fora da rotina |
| Aventura da noite | `src/utils/adventure.ts` | O pet sai e volta com um achado narrado; não paga nada; nenhum dia volta vazio | É onde o Passeio mora (decisão do dono, EXP-6). A Expedição dá ao Passeio **para onde ir** |
| Tarefa assombrada | `taskTriage.ts` › `isHaunted` | Tarefa parada ganha bônus de alívio ao concluir | "Faça o que você vinha adiando" já é mecânica; não duplicar como missão |

## 1. A ideia, em uma frase

**O Passeio tem um mapa; cada região nova do mapa se abre quando a pessoa cumpre, na vida real, um desafio
que ela mesma escolheu entre os que a região propõe.** O pet vai aonde a pessoa foi.

- *Desafio* = um ato **único e qualitativo** fora do cotidiano (fazer algo pela primeira vez, ir a um lugar
  novo, retomar um contato, experimentar uma vez o próximo nível de um hábito), nunca uma quantidade.
- *Progredir* = **no mapa da Exploração** (região nova para o Passeio, capítulo de lore, postal da região).
  Nunca HP, energia, atributo, `perfectDays`, evolução, Bits ou Créditos.
- *Levantar a barra* = **amplitude** (decisão do dono): cada região traz desafios de outras áreas da vida, nunca
  maiores que os da anterior; ordem livre entre regiões, névoas iguais. Toda região tem uma opção solitária, em
  casa, sem gasto, de até 10 minutos, e as versões pequena e plena rendem **exatamente** o mesmo.

## 2. Regras propostas (cada uma com a linha que protege)

| # | Regra proposta | Protege |
|---|---|---|
| M1 | **Opt-in, sempre.** A região oferece 3 desafios (determinísticos por região, não re-sorteáveis ao reabrir); a pessoa escolhe um ou nenhum. Nada é atribuído | essência "nunca cobrador"; aventura determinística |
| M2 | **Uma Expedição ativa por vez, sem prazo, sem contagem regressiva, sem expirar.** Trocar ou "deixar pra lá" não custa nada e o desafio volta ao pool | #15 (FOMO que tira); #1 (nada zera) |
| M3 | **Auto-declaração.** "Fiz" basta. Sem prova, sem foto, sem sensor | sem sensor; confiança |
| M4 | **Recompensa só no mapa:** região nova + lore + postal. Nada de HP/energia/atributo/`perfectDays`/evolução/Bits/Créditos | §5.6; decisão de 08/09 (Aventura sem recompensa material) |
| M5 | **Nenhum desafio é quantidade de tarefas** ("faça 10 tarefas", "5 dias seguidos"). Um ato, uma vez | #16; #1 |
| M6 | **Nunca é condição** de dia completo, HP, evolução, missão semanal ou Torneio. Não entra em `dailyGoalFor` por padrão (ver MIS-3) | §5.6 "brincar nunca é condição" |
| M7 | **Nenhum push, badge ou widget** sobre Expedição pendente; o pet não lembra, não pergunta "e aí, fez?" | #19; L6 |
| M8 | **Toda região tem uma versão pequena** do desafio ("só 5 minutos", "só olhar como é") que conta igual | never miss twice / versão reduzida; TDAH e depressão |
| M9 | **Filtro de conteúdo do catálogo**: nada de dieta, jejum, peso, calorias, sono por duração, gasto de dinheiro, risco físico, exposição terapêutica sem profissional, nada que pareça tratamento | `PLANO-CATALOGO-ATIVIDADES.md` linha vermelha |
| M10 | **O mapa não mostra lacuna em percentual nem "faltam N"**; regiões não abertas aparecem como névoa, sem número | #14; padrão do `AdventureDiary` |
| M11 | **Nasce muda** (R-NOVA) e com copy EN primeiro + PT-BR, sob L1..L12; o texto convida, nunca manda | `SOM.md`; `NARRATIVA-E-UNIVERSO.md` |
| M12 | **Não duplica** o subir de nível do catálogo nem a assombrada: "experimente uma vez o próximo nível" é permitido como *prova*, sem trocar o nível do hábito | footgun 9 (regra copiada) |

## 3. Como aparece (esboço, sem wireframe)

- Na folha do Passeio (Exploração): o **mapa em névoa** com as regiões já abertas e a próxima. Tocar na
  próxima mostra os 3 desafios dela + a versão pequena.
- Expedição ativa: uma linha discreta na folha ("Sua expedição: *cozinhar algo que você nunca fez*") com
  **Fiz** e **Trocar/Deixar pra lá**. Não aparece na Home, no widget nem no push.
- Ao marcar **Fiz**: o pet sai em Passeio para a região nova (o "passeando" diegético que o dono escolheu) e o
  achado dessa noite vem da região. Postal da região entra no `AdventureDiary`.

## 4. Exemplos de desafio por área (rascunho; a copy final é da `squad-narrativa`)

| Área | Desafio (versão plena) | Versão pequena |
|---|---|---|
| Corpo | Caminhar por uma rua ou trilha onde você nunca passou | Dar uma volta no quarteirão pelo outro lado |
| Casa | Cozinhar uma receita que você nunca fez | Provar um ingrediente novo |
| Social | Escrever para alguém de quem você sente falta | Reagir a uma mensagem antiga dessa pessoa |
| Aprender | Assistir a uma aula ou palestra sobre algo fora da sua área | Ler um artigo sobre isso |
| Criar | Fazer algo com as mãos e mostrar para alguém | Rabiscar por 5 minutos |
| Mente | Passar 20 minutos sem tela num lugar de que você gosta | 5 minutos |
| Hábito | Fazer uma vez a versão do próximo nível de um hábito seu | Fazer 2 minutos da versão do próximo nível |

## 5. O que foi descartado já nesta proposta

| Descartado | Por quê |
|---|---|
| Missão com prazo ("até domingo") | #15 |
| Missão sequencial obrigatória que trava as seguintes se falhar | cobrança; perda sobre progresso |
| Prova por foto/GPS/passos | sem sensor; privacidade (#18) |
| Recompensa em Bits, atributo, `perfectDays` ou evolução | §5.6; decisão de 08/09 |
| Desafio atribuído pelo sistema com base no humor ou no HP | humor nunca vira insumo (#2); leitura de estado vira veredito |
| Ranking ou mural de expedições de outros jogadores | #21 |

## 6. Condições que os pareceres somaram (bloqueantes, resumo)

- **1 região aberta por dia do jogador**; o "Fiz" não abre nada na hora, o efeito vem na Aventura daquela noite, e
  um "Fiz" a mais fica guardado sem expirar (linha vermelha R-32, psicologia R-1).
- **O Passeio sai todo dia** para as regiões já abertas, com ou sem Travessia (psicologia R-2, veto preventivo).
- **Nenhum sistema do núcleo lê a Travessia** (meta, HP, `perfectDays`, evolução, Vínculo, missões, conquistas);
  teste de contrato com a virada do dia idêntica com ou sem ela (R-27, R-37).
- **A oferta fala do ato, nunca anuncia o prêmio** (R-31); lista do que não paga nomeia Emblemas, XP de Vínculo,
  comida, energia, atributos.
- **Sem push, widget, overlay, relatório nem contexto do chat de IA** falando de Travessia pendente;
  `travessia.semPush.contract.test.*` espelho do da Guilda (R-38).
- **"Trocar" escolhe entre os mesmos 3**, nunca re-sorteia; nenhuma sequência de Travessias; a ativa não envelhece.
- **Mapa sem total e sem estado "completo"**; nenhuma criatura, Bestiário ou `BondEvent` novo nas regiões.
- **Pré-requisito:** o Passeio fundido à Aventura existir antes (R-47).
- Arte: seis dos oito reinos já têm cenário na loja (`bg-desert`, `bg-forest`, `bg-ocean`, `bg-snow`, `bg-swamp`,
  `bg-cloudsea`); cavernas pode usar a Gruta Azul; campina precisa de arte (parecer de gênero; resolve EXP-7).

Detalhe e numeração completa em [`reviews/2026-09-30-missoes/`](reviews/2026-09-30-missoes/).

## 7. Decisões que dependem do dono

Detalhe em [`PERGUNTAS-DO-DONO.md`](PERGUNTAS-DO-DONO.md), seção "Missões de Expedição" (preenchida depois dos
pareceres).
