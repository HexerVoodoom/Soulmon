# Parecer — guarda da linha vermelha — Exploração (Passeio, Diário de Campo, Escavação)

Revisor: `soulmon-guarda-linha-vermelha`
Data: 30/09/2026
Escopo: as três ideias finalistas do briefing de exploração, lidas contra as 21 proibições de `docs/plano-melhorias/ledger/vetos.md` (13 por teste: #1–#12 e #15; 8 por tese: #13, #14, #16–#21), as seis perguntas do guarda, os testes de contrato que já travam regras (`src/copy.semFomo.contract.test.ts`, `src/plugins/widgetSemCobranca.contract.test.ts`, `src/utils/spriteTrigger.semPrazo.contract.test.ts`, `src/components/filaDeAvisos.contract.test.ts`, guarda da Guilda `guild.semPush.contract.test.js`) e a decisão registrada "Aventura da noite: narrativa, sem recompensa material" (`REGISTRO-DE-DECISOES.md` §5.6). Não avalio arte, som, balanço numérico nem copy fina (outros papéis).

**Declaração de limite.** Este parecer não faz diagnóstico nem julga estado clínico de ninguém; o Soulmon não é tratamento. O efeito esperado de qualquer mecânica aqui é previsão, não medição: ninguém usou o app em produção, não há telemetria, e "o que faz a pessoa querer abrir" é hipótese. Onde a linha vermelha depende de comportamento futuro, escrevo a condição como teste verificável, não como profecia. Nada aqui é ordem de implementar (Camada 3 congelada, `REGISTRO-DE-DECISOES.md` §5.6, 21/09/2026).

Legenda: **VETADO** (cruza ou está a um passo de cruzar proibição na forma proposta; vem com alternativa) · **APROVADO COM RESSALVA** (cada `R-n` vira critério de aceite) · **APROVADO**. `R-n` é condição bloqueante e verificável.

---

## Achado que governa os três pareceres

A Aventura da noite (`src/utils/adventure.ts`, `AdventureDiary`) **já é o Passeio e já é o Diário de Campo**: o pet "saiu de dia, volta à noite com um achado narrado", determinístico por `dayKey`, sem campo de recompensa (o teste trava o catálogo), e o diário "não mostra o que falta, não mostra raridade, não conta nada". A decisão do dono de 08/09/2026 registra a alternativa que perdeu: **"Bits/item pelo achado — o relatório viraria tela que a pessoa PRECISA abrir"**.

A pergunta do registro é "o que mudou desde que X perdeu?". Resposta honesta: **nada de mecânica mudou**. Mudou só a superfície (agora seria uma folha da Exploração, com relógio real de N horas, em vez de o relatório da noite) e a data. Uma recompensa material atrelada a "o pet volta com um achado" é literalmente a alternativa que perdeu; trocar o nome para "Passeio" não a reabilita. O 30/09 não é fato novo, é embalagem nova. Sem um fato novo, este guarda não sobrepõe uma decisão explícita do dono por conta própria — mas o dono pode reabri-la sabendo o custo (então registro parecer e decisão, e sigo).

---

## 1. Passeio (expedição do pet)

**VETADO** na forma proposta (Bits + achados acumulados por ausência + relógio real de N horas sem regra de aviso). Existe alternativa que entrega o mesmo valor (ver abaixo).

**Motivo.** A forma proposta toca quatro proibições ao mesmo tempo. **#19**: "volta em N horas de relógio real, mesmo com o app fechado" é o desenho clássico de push ("seu pet voltou!"); o único push permitido hoje é o de deitar (C-V6), mais a copy dia-a-dia em `functions/api/_pushCopy.js`, e a pergunta 1 aqui responde "querer a notificação". **#16 (adjacente)**: "achados acumulados por ausência" e "N achados" viram contador de ausência com recompensa, e Bits por "voltar" pagam presença-que-é-ausência (o achado acumula porque a pessoa NÃO estava). **#15**: se houver teto de achados guardados, o excedente que some é FOMO que tira; se não houver, a pendência cresce e vira o painel de pendências do Habitica. **Decisão registrada**: Bits/item pelo achado já perdeu. E há o lado que perdoa demais (item 7 abaixo): pagar quem some mais do que quem aparece inverte o incentivo e esvazia a mecânica das tarefas.

Passa na pergunta 5? Não: mostrar por dentro "seu pet sai, e cada hora fora rende Bits" é revelar que o app paga para você não usá-lo.

**Alternativa que entrega o mesmo valor sem cruzar:** o Passeio como **encenação diegética da Aventura que já existe** — o pet "sai" e "volta" com o mesmo postal narrado da Aventura, **sem Bits, sem item, sem contagem, um postal por dia, sem push, sem contagem regressiva**. O ganho de "tem uma vida acontecendo mesmo com o app fechado" vem da narrativa (Finch: "narrativa não satura"), não do pagamento. Se o dono quiser Bits no Passeio, isso é reabrir a decisão de 08/09 (ver R-4).

### Condições para reapresentar o Passeio (o que o transforma em APROVADO COM RESSALVA)

- **R-1 (#19, push). Nenhuma notificação de retorno.** O Passeio não gera push web, FCM, badge no ícone, item no widget nem overlay. O único push do app continua sendo o de deitar (C-V6) mais a copy de `_pushCopy.js`. Aceite: teste espelho de `guild.semPush.contract.test.js` (`passeio.semPush.contract.test.*`) varrendo `workers/push-scheduler.js`, `functions/api/_pushCopy.js`, `functions/api/subscribe.*` e `SoulmonWidgetPlugin.kt` por qualquer referência a Passeio. Só o achado na próxima abertura, num único lugar fixo.
- **R-2 (pergunta 4, R-I do WP4.29). Nenhum número que desce.** Sem contagem regressiva, sem hora impressa de retorno ("volta às 18h"), sem barra que enche em tempo real, nem no título da aba. A superfície diz em palavra grossa ("está por aí" / "voltou"). `hideMetrics` vale inteiro. Aceite: varredura de fonte como a de `spriteTrigger.semPrazo.contract.test.ts` (única comparação de data permitida: `agora − since >= DURACAO_PASSEIO`).
- **R-3 (#13, R-J do WP4.29). Duração uniforme e nunca comprável.** A duração N é uma constante única para todo jogador; **veto preventivo** a qualquer "acelerar passeio", "voltar já", redução por Bits/Créditos/vínculo/traço/assinatura, e a qualquer alongamento por causa do que a pessoa fez ou deixou de fazer. Aceite: teste "nenhum caminho de código multiplica, divide ou condiciona a constante" e "voltar cedo não rende diferença: mesma entrada, `since` de N horas e de N dias ⇒ mesmo achado" (R-K do WP4.29).
- **R-4 (decisão 08/09). O achado não paga nada material.** Sem Bits, item, atributo, XP nem decoração pelo achado do Passeio. `AdventureFind` continua sem campo de recompensa e o teste que o trava continua verde. Se o dono decidir reabrir isso, o parecer diz o que muda: o relatório e o Passeio passam a ser tela que a pessoa PRECISA abrir para não perder Bits, e o custo (farm por ausência, item 7) fica registrado com a decisão.
- **R-5 (#16, L6). Sem acúmulo por ausência, sem contagem.** Quem some por dias volta a **um** postal (o do dia, ou uma frase de retorno idêntica para dois e para quarenta dias — o critério (e) que já vale para P2 em `NARRATIVA-E-UNIVERSO.md` §14), nunca "N achados", "3 postais esperando" ou lista de pendências. Sem teto que descarte (#15): o que não foi visto não se perde, mas também não empilha como dívida a abrir. Aceite: nenhum símbolo do Passeio expõe contagem de achados não vistos; nenhuma frase diferente para quem sumiu (senão a presença da frase é contador de ausência por outro meio).
- **R-6 (#10). Não citar `ABSENCE_FORGIVENESS_DAYS` como fundamento.** O Passeio não é "o espírito do perdão por ausência ≥ 2 dias": esse perdão é da regra de HP (travada por teste, `ABSENCE_FORGIVENESS_DAYS = 2`), e o Passeio não perdoa nada. Acoplar os dois faz mudar um quando o outro muda. O Passeio não lê nem escreve a constante; a copy nunca chama o Passeio de "perdão".
- **R-7 (L6, L11, R2/R3 do parecer da bíblia). A frase do pet não atribui saudade nem mérito.** "Ele sentiu sua falta / esperou você" é vetado (L6, L11). O pet pode contar o que viu; nunca o que a pessoa fez ou deixou de fazer.
- **R-8 (§5.6, brincar não obriga). Passeio nunca é condição de dia completo, HP, evolução, constância nem missão.** Aceite: nenhum desses lê o estado do Passeio.
- **R-9 (#1). Nenhuma sequência.** Sem "passeios seguidos", sem marca de dias consecutivos, sem "não quebre a série".
- **R-10 (footgun 9, achado do código). Não criar segundo mecanismo paralelo à Aventura.** O Passeio reusa `adventure.ts` (catálogo, `ADVENTURE_ODDS`, seed por `dayKey`) ou substitui a apresentação; não abre um catálogo e um sorteio novos. A seed é determinística: reabrir não re-sorteia (senão é caça-níquel e a pessoa aprende a reabrir).
- **R-11 (#15). Nenhuma frase de prazo na copy.** PT + EN no mesmo commit; a varredura de `src/copy.semFomo.contract.test.ts` já cobre `src/components/**` e `src/utils/**`, e a copy nova não pode contornar por arquivo fora da varredura.

### Onde este parecer diz "isto perdoa demais"

O Passeio **como proposto** perdoa demais no sentido que a tese não pretende: pagar (Bits) mais a quem está ausente do que a quem está presente esvazia o motivo de abrir o app para fazer a tarefa. Um perdão que vira renda é a mecânica perdendo significado. A linha: **ausência é acolhida (L6), nunca remunerada.**

---

## 2. Diário de Campo (álbum dos achados)

**APROVADO COM RESSALVA.**

**Motivo.** Um álbum de achados com bioma, data e frase é a superfície de coleção que a Aventura já tem (`AdventureDiary`) e que o Bestiário e o Dex de Sonhos também têm; álbum sem pagamento nem prazo não cruza nenhuma proibição. Passa nas seis perguntas se, e só se, seguir a regra do `AdventureDiary` — e o briefing propõe o contrário na parte que mais importa: "reaproveita o padrão de coleção do Bestiário (silhueta, contagem)". **Silhueta do não coletado é exatamente o que o Diário da Aventura foi desenhado para NÃO ter** ("Painel de pendências é o Habitica"; decisão registrada 08/09, `REGISTRO-DE-DECISOES.md` §5.6 "Diário NÃO mostra o que falta nem raridade"). Aprovado como **extensão do `AdventureDiary`** (mesmos achados, agrupados por bioma), não como segunda coleção.

- **R-12 (decisão 08/09, #14). Sem silhueta do que falta, sem "faltam N", sem "N de 13", sem percentual, sem raridade.** O Bestiário mostra silhueta porque criatura é catálogo de descoberta; o Diário mostra só o que a pessoa já tem, em ordem de data ou por bioma, sem casa vazia. Só contagem do que existe (se houver), nunca fração do catálogo. Aceite: teste espelho do que já trava o `AdventureDiary` (nenhum símbolo com `falta`/`total`/`%` sobre o catálogo).
- **R-13 (footgun 9). Uma coleção só.** O Diário de Campo é uma vista do mesmo save da Aventura (mesmo id de achado), não um segundo campo no save. Se o Passeio existir, os postais dele entram no mesmo catálogo. Dois registros do mesmo fato dão dois números diferentes na mesma tela.
- **R-14 (#16, resposta à pergunta 4 do dono). O Diário de Campo NÃO entra no `weeklyReport`.** Contar achados por semana no relatório semanal é recompensa por contagem sob outro nome e é número que oscila (semana boa/semana ruim: pergunta 4). O `weeklyReport` descreve constância por hábito e `dreams`; incluir "N achados" cria uma linha nova em que a semana fraca aparece como menos.
- **R-15 (#21, #14). Nada do Diário vai a `publicProfile`, widget nem tela de amigo.** Coleção de outro jogador é métrica de desempenho de outro jogador (#21); `hideMetrics` esconde qualquer número.
- **R-16 (L6/L11/L12). Frase por achado nomeia o ato ou o lugar, nunca a pessoa nem a causa.** Data como data ("14 set"), nunca "há N dias" nem "você ficou N dias sem visitar".
- **R-17 (regra de arte da área). Sem caveira.** A cena `Necrópole de Ossos` de `SPIRIT_BG_SCENES` não entra como bioma do Diário; o achado que dependesse dela fica fora ou muda de cena.
- **R-18 (#20). Só acrescentar ao save.** Se o Diário de Campo pedir campo novo, é chave nova; nunca renomear/remover as existentes da Aventura.

### Onde diz "perdoa demais"

Não perdoa demais: é passivo e não mexe em regra.

---

## 3. Escavação (minijogo de 1 toque, 30–60 s)

**APROVADO COM RESSALVA.**

**Motivo.** Minijogo sem falha, sem custo de coração, sobre o `GameKit` e sob o teto `MINIGAME_BITS_PER_DAY = 150` está dentro do modelo que o Salão de Jogos e a Masmorra já seguem. Não é recompensa por contagem de **tarefas** (#16 fala de tarefa, não de jogada) e não é condição de nada (§5.6). O que a torna arriscada é a combinação "sempre com resultado" + "fragmentos de lore" + "decoração rara": um loop de 30–60 s sem falha e com drop raro é caça-níquel se o raro for sorteado por jogada (Hooked: a variável saudável varia em sabor, não em se existe recompensa; a decisão registrada "Recompensa variável com TETO, nunca à venda"). Também há tentação de #19 em "sua escavação terminou" como push, e de FOMO ("último fragmento da era").

- **R-19 (§5.6, `REGISTRO-DE-DECISOES.md`). Brincar nunca é condição** de dia completo, HP, evolução, constância, missão nem `perfectDays`. Nenhum desses lê `playLog`/estado da Escavação (Critério B: no instante em que um olhar, a oferta vira obrigação).
- **R-20 (#19, #15). Sem push, sem badge, sem widget, sem "sua escavação está pronta".** A Escavação é um jogo que a pessoa abre porque quer, não porque foi chamada. Aceite: teste espelho de `guild.semPush.contract.test.js` também cobre a Escavação.
- **R-21 (#16, #14, decisão da coleção). Lore em ORDEM FIXA e sem fração.** Os fragmentos das eras (`NARRATIVA-E-UNIVERSO.md` §8) são entregues em sequência determinística (o próximo é sempre o próximo), sem sorteio que repita, sem "3 de 6 eras", sem "faltam N", sem percentual, sem silhueta do fragmento futuro. Se o próximo já foi visto, a Escavação devolve sabor (uma frase), nunca nada em branco (todo resultado é acolhido). Aceite: teste "sem `.length` de catálogo de lore exposto em componente".
- **R-22 (pergunta 5, recompensa variável com teto). Decoração rara só se for determinística e limitada por dia.** Se o dono quiser decoração rara, o modelo é o da Glitchtama (`GLITCHTAMA_PER_DAY = 1`): no máximo um item por dia, semente `dayKey`, nunca sorteio por jogada, valor cosmético puro, nunca à venda. Se essa amarração não couber, a decoração não entra e o lote fica em lore + Bits (Q3/Q5 abaixo). Aceite: teste "duas jogadas no mesmo dia não podem render dois raros".
- **R-23 (funil de Bits). Se paga Bits, paga pelo funil existente.** `handleEarnGamePoints` (App.tsx) e `MINIGAME_BITS_PER_DAY = 150`; sem caminho paralelo, sem bônus por "sequência de escavações", sem Bits por fragmento.
- **R-24 (#1, #13). Sem sequência e sem venda.** Sem "dias seguidos escavando"; nenhum item/moeda compra jogada extra, dica ou "escavar de novo já" (proteção contra o cansaço do teto = #13 com outro nome).
- **R-25 (#15). Copy sem prazo nem escassez.** "Última chance", "antes que suma", "só hoje" em fragmento ou decoração: cobertas por `src/copy.semFomo.contract.test.ts` (varre `src/components/**` e `src/utils/**`); a copy nova entra por caminho varrido.
- **R-26 (L1..L12, R-NOVA). Nasce mudo (R-NOVA, `docs/SOM.md`)** e a frase do fragmento fala do mundo, não da pessoa (L12: nomeia o ato, nunca o mérito).

### Onde diz "perdoa demais"

Um minijogo em que **nunca** se perde nada e cada jogada rende algo pode esvaziar o jogo: se todo resultado é igual, o toque não tem sentido. A tese proíbe cobrança, não proíbe sabor. A saída é variar **o que** vem (qual fragmento, qual frase), nunca **se** vem (R-21). Isso já é o que o Bestiário e os Sonhos fazem.

---

## Respostas recomendadas às perguntas ao dono que tocam este papel

Todas são recomendação de guarda, não decisão; decisão é do dono e, se cruzar linha sabendo o custo, eu registro e sigo.

**Pergunta 1 — abrir exceção ao congelamento da Camada 3?** Não é linha vermelha e não é minha decisão. Registro só: se abrir, que seja para o **Diário de Campo e a Escavação** (a parte sem risco de #19 e sem reabrir a Aventura), com o Passeio só na forma diegética. Gatilho de revisão: qualquer proposta de Passeio com Bits ou com push volta a este guarda antes de virar tarefa.

**Pergunta 2 — o pet pode sair da Home?** Recomendo **não**: o pet fica presente, e o Passeio é só encenação (uma linha, um postal). "Carinho é a única cura de HP" (ledger, R2 do parecer da bíblia) — um palco vazio durante N horas tira a superfície da única cura e, se a pessoa abrir o app com HP baixo e o pet "passeando", o app estaria retendo o socorro: pergunta 2 (tira algo? recuperável?) falha na forma mais cara. Se o dono quiser palco vazio, condição: `petting`/carinho e cura continuam disponíveis com o pet "fora" (o palco muda, a regra não). Gatilho: qualquer estado em que a interação de cuidado fique indisponível por causa do Passeio.

**Pergunta 3 — os achados podem render decoração rara, ou só lore e Bits?** O achado do **Passeio** rende **só lore** (R-4). A decoração rara pertence à **Escavação**, e só na forma determinística de R-22 (1/dia, seed `dayKey`); se não couber, fora. Bits pelo achado do Passeio = reabrir a decisão de 08/09. Gatilho: ao aparecer o primeiro dado de uso real (10 usuários × 14 dias), medir se a abertura do relatório da noite cai depois que o catálogo de 24 cenas é visto — a aposta 9 do registro; só então há fato novo para reabrir.

**Pergunta 4 — o Diário de Campo entra no `weeklyReport`?** **Fica fora** (R-14). Gatilho: só entra se virar frase descritiva sem número e o dono confirmar; contagem semanal de achados não entra nunca (#16).

**Pergunta 5 — a Escavação paga Bits (com teto) ou só lore?** Recomendo **lore + Bits pelo funil existente com teto** (R-23), se o balanço de minijogos comportar; **só lore** é a alternativa segura e não perde a tese. Bits sem passar pelo funil é vetado. Gatilho: se `MINIGAME_BITS_PER_DAY` for atingido só pela Escavação sem outro jogo, o balanço (outro papel) revê o valor por jogada.

---

## Tabela-resumo

| ideia | veredito | condição bloqueante |
|---|---|---|
| Passeio | **VETADO** (na forma proposta) | Bits pelo achado reabre a decisão 08/09 (R-4); e sem R-1 (nenhum push de retorno, #19), R-3 (duração uniforme e não comprável, #13) e R-5 (nenhum acúmulo/contagem de ausência, #16/L6) a forma cruza #19, #16 e #15 |
| Diário de Campo | **APROVADO COM RESSALVA** | R-12: sem silhueta do que falta, sem fração, sem raridade (decisão 08/09 + #14); e R-14: fora do `weeklyReport` (#16) |
| Escavação | **APROVADO COM RESSALVA** | R-22: decoração rara só determinística e limitada a 1/dia (recompensa variável com teto); R-21: lore em ordem fixa sem fração; R-19/R-20: brincar nunca é condição e nenhum push |

---

## O que NÃO consegui verificar

- Não li `AdventureDiary.tsx` nem o teste que trava o catálogo da Aventura sem campo de recompensa; a descrição vem do cabeçalho de `adventure.ts` e do registro (§5.6). Se o teste for mais ou menos rígido do que descrevo, R-4 e R-12 ajustam.
- Não li `functions/api/_pushCopy.js` inteiro nem `workers/push-scheduler.js`; a lista de pushes vigentes (hora dia-a-dia, lembrete de deitar, C-N9) vem do manual `08-INTEGRACOES-E-DEPLOY.md` e do ledger. (≈) O guard `guild.semPush.contract.test.js` existe, mas não abri o arquivo: o formato do teste-espelho é (≈) o dele.
- Não li `weeklyReport` (`src/utils/rituals.ts`) nem `PlaySheets.tsx`/`GameKit`; a alegação de que o relatório semanal só descreve constância e `dreams` vem do briefing.
- Não abri `NARRATIVA-E-UNIVERSO.md` §8 nem §14 P2 por inteiro; (≈) o critério (e) da frase de retorno idêntica vem do ledger.
- `MINIGAME_BITS_PER_DAY = 150` e `GLITCHTAMA_PER_DAY = 1` foram citados do briefing e do registro; não conferi o valor no código.
- `tasks-100` em `src/utils/achievements.ts` ainda lê `completedTasks.length` neste worktree (o ledger registra a saída de 21/09); não é do escopo desta exploração, mas nenhuma conquista nova pode ler `.length` de tarefas.
- Não há uso real em produção: tudo acima sobre "farm" e "querer a notificação" é previsão.

---

## Registro para o ledger (copiar em `docs/plano-melhorias/ledger/vetos.md`, seção "Registro de vetos e pareceres")

| Data | Proposta | Parecer | Proibição | O que fazer |
|---|---|---|---|---|
| 30/09/2026 | **Exploração — Passeio** (pet sai por N horas de relógio real, volta com achado + Bits, achados acumulados por ausência, biomas = 13 cenas de `SPIRIT_BG_SCENES`) | `VETADO` na forma proposta | #19, #16 (adjacente), #15 (se houver teto que descarta), #13 preventiva (espera comprável), decisão registrada "Aventura: só narrativa" (08/09) | Alternativa: Passeio só como encenação da Aventura existente (sem Bits, sem push, sem contagem, um postal por dia, duração uniforme, sem contagem regressiva). Aceite: R-1..R-11 (não gerar push nem badge; achado sem campo de recompensa; nenhum acúmulo/contagem por ausência; não citar `ABSENCE_FORGIVENESS_DAYS`; reusar `adventure.ts`; teste `passeio.semPush.contract.test.*`). Bits pelo achado só se o dono reabrir a decisão de 08/09 sabendo o custo |
| 30/09/2026 | **Exploração — Diário de Campo** (álbum de achados por bioma, data e frase) | `APROVADO COM RESSALVA` | #14, #16 (adjacente), #21, decisão "Diário NÃO mostra o que falta nem raridade" | R-12..R-18: sem silhueta do não coletado, sem "faltam N"/fração/percentual/raridade; vista do mesmo save da Aventura (não segunda coleção); fora do `weeklyReport`; nada em `publicProfile`/widget; sem caveira; só acrescentar ao save (#20) |
| 30/09/2026 | **Exploração — Escavação** (minijogo de 1 toque de 30–60 s, sem falha; lore das eras e decoração rara) | `APROVADO COM RESSALVA` | #16 (adjacente), #19, #15, #13 (venda de jogada extra), §5.6 "brincar nunca é condição" | R-19..R-26: lore em ordem fixa, sem fração; decoração rara só determinística (1/dia, seed `dayKey`) ou fora; Bits só pelo funil `handleEarnGamePoints` com teto 150; nenhum push/badge/widget; não é condição de dia completo/HP/evolução/missão; sem venda de jogada extra |
