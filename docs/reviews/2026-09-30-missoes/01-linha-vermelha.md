# Parecer — guarda da linha vermelha — Missões de Expedição (desafios da vida real via Exploração)

Revisor: `soulmon-guarda-linha-vermelha`
Data: 30/09/2026
Escopo: `docs/PROPOSTA-MISSOES-EXPLORACAO.md` (regras M1..M12, §3–§5), lida contra as 21 proibições de `docs/plano-melhorias/ledger/vetos.md` (13 por teste: #1–#12 e #15; 8 por tese: #13, #14, #16–#21), as seis perguntas do guarda, `REGISTRO-DE-DECISOES.md` §5.6 (Camada 3 congelada, 21/09; "Aventura da noite: narrativa, sem recompensa material", 08/09; "Aventura: dia mexe na chance, nunca no acesso"; "Diário NÃO mostra o que falta"; "Jogos do Ateliê NÃO rendem Vínculo nem missões", 30/09), as respostas do dono à Exploração (`PERGUNTAS-DO-DONO.md`, EXP-1..EXP-7) e o parecer de 30/09 sobre a Exploração (`docs/reviews/2026-09-30-exploracao/01-linha-vermelha.md`, condições R-1..R-26). Conferido no código: `src/utils/missions.ts`, `src/utils/weeklyMissions.ts`, `src/utils/adventure.ts` (+ `adventure.test.ts`), `src/utils/catalogLevel.ts`, `docs/PLANO-CATALOGO-ATIVIDADES.md` §4 e §6. Não avalio arte, som, balanço numérico nem copy fina.

**Declaração de limite.** Este parecer não faz diagnóstico nem julga estado clínico de ninguém; o Soulmon não é tratamento. Ninguém usou o app em produção, não há telemetria: tudo o que digo sobre "o que faz a pessoa querer abrir" ou "clicar Fiz sem fazer" é previsão, não medição. Onde a linha vermelha depende de comportamento futuro, escrevo a condição como teste verificável. Nada aqui é ordem de implementar: a proposta está sob o congelamento da Camada 3 e precisa de exceção própria (MIS-1), que não é decisão deste guarda.

Legenda: **VETADO** (cruza ou está a um passo de cruzar proibição; vem com alternativa) · **APROVADO COM RESSALVA** (cada `R-n` vira critério de aceite) · **APROVADO**. As condições continuam a numeração do parecer de Exploração de 30/09 (**R-27..R-48**) para não colidirem no ledger.

---

## Achado que governa o parecer

**1. A proposta já fez a tradução certa do pedido — e a leitura literal do pedido é vetada.** O dono escreveu *"desafios que ele **precisa** cumprir na vida real **para progredir**"*. Lido ao pé da letra, isso é o desenho exato do cobrador: progresso do núcleo (evolução, HP, dia completo) condicionado a uma exigência externa ao app. A proposta responde "progredir = **só no mapa da Exploração**", "opt-in", "sem prazo", "auto-declaração". **Este guarda endossa essa tradução e veta preventivamente a leitura literal**: nenhuma Expedição pode, agora ou numa versão futura, ser requisito de evolução, HP, `perfectDays`, energia, dia completo, Torneio, missão semanal ou conquista (R-27). É a mesma linha de §5.6 ("brincar nunca é condição"), levada de "brincar" para "desafio".

**2. O risco central não é punição: é a pergunta 1 (Errant Signal).** Uma recompensa **tangível, esperada e condicional** a um ato que a pessoa faria por si (cozinhar algo novo, escrever para um amigo, caminhar por outra rua) é o arranjo que a literatura associa à queda da motivação intrínseca — o ato vira "meio para abrir a região". A proposta tira a recompensa material (M4), mas mantém o **condicional esperado**: "cumpra X para abrir a região". A forma de passar na pergunta 1 é tornar a abertura do mapa **consequência narrada**, não **preço anunciado**: a oferta fala do ato, nunca do prêmio; a região não é pré-visualizada; o pet "foi aonde você foi" (R-31). Isso não zera o risco, mas o reduz ao nível do marco de hábito (reconhecimento do ato, L12), que o produto já aceita.

**3. Colisão com a regra 4 da Aventura.** `adventure.ts` diz: *"O dia mexe na chance, nunca no acesso. Não existe achado que só quem teve um dia bom possa ver"*, e `adventure.test.ts` prova que *"todo achado do catálogo é alcançável por quem teve um dia ruim"*. Região que só abre com Expedição cria, pela primeira vez, **conteúdo do Passeio reservado a quem fez algo na vida real**. Aceito isso **só** para o que é **registro do próprio ato** (o postal da região, o capítulo de lore dela — como a data de um marco), nunca para o catálogo comum da Aventura, que tem de continuar inteiro alcançável por quem nunca aceitou uma Expedição (R-33). Sem isso, quem não quer desafio vê o Passeio que o dono escolheu **estagnar** — cobrança por omissão.

**4. "Expedição" já tem significado na bíblia, e é o oposto.** `NARRATIVA-E-UNIVERSO.md` L5: *"Perda só sobre coisa recuperável e apostada de propósito (**a expedição**, a moeda)"*. A bíblia reserva "expedição" para algo que **pode ser perdido**. Batizar assim um desafio da vida real que **nunca** pode ser perdido contamina as duas coisas (R-46, MIS-2). E "Missões" já é nome de dois sistemas no código (`missions.ts`, `weeklyMissions.ts`).

**5. Ordem de dependência.** A decisão de 30/09 diz "a Exploração fica só com a Masmorra"; o dono depois escolheu o Passeio fundido à Aventura (EXP-1/EXP-6), ainda **não implementado**. A Expedição mora na folha do Passeio. Ela não pode nascer antes dele, nem criar um segundo relógio de "voltou?" (EXP-6, R-10 do parecer anterior).

---

## Veredito por regra

| Regra | Veredito | Condições | Uma frase de motivo |
|---|---|---|---|
| **M1** Opt-in, 3 desafios determinísticos por região | `APROVADO COM RESSALVA` | R-28, R-31 | Determinismo por região é o certo (mesmo motivo de `weeklyMissionsFor`: lista que muda ensina a reabrir). Ressalva: "nenhum" é resposta de primeira classe, e a oferta fala do ato, não do prêmio. |
| **M2** Uma ativa, sem prazo, sem expirar | `APROVADO COM RESSALVA` | R-29, R-30 | Sem prazo resolve #15; sobra o risco de a linha "Sua expedição" virar **pendência permanente** (a pilha de culpa que a assombrada existe para desarmar). |
| **M3** Auto-declaração | `APROVADO COM RESSALVA` | R-32, R-39 | Confiança sem sensor é a tese. Ressalva de **perdão que esvazia**: "Fiz" em sequência abriria o mapa inteiro num minuto; o efeito vem na Aventura da noite, 1 por dia. |
| **M4** Recompensa só no mapa | `APROVADO COM RESSALVA` | R-33, R-34, R-35 | Respeita §5.6 e 08/09. Ressalvas: nada de Vínculo/XP, Emblemas, cenário na loja, conquista; e o catálogo comum da Aventura continua inteiro sem Expedição. |
| **M5** Nenhum desafio é quantidade | `APROVADO` | R-36 | É a #16 aplicada certa. Acrescento o espelho: nenhum lugar conta **Expedições feitas**. |
| **M6** Nunca é condição; fora de `dailyGoalFor` | `APROVADO COM RESSALVA` | R-27, R-37 | Recomendo transformar o "por padrão" em **nunca** (MIS-3): na meta, a Expedição passa a mexer em HP. |
| **M7** Nenhum push, badge, widget; pet não lembra | `APROVADO` | R-38 | É a #19 escrita certa; vira teste espelho de `guild.semPush.contract.test.js`. |
| **M8** Toda região tem versão pequena que conta igual | `APROVADO COM RESSALVA` · **um exemplo VETADO** | R-40, R-41 | "Conta igual" é certo e vira teste. **Vetado** o exemplo "Hábito — Só olhar o que o próximo nível pede": é um ato **dentro do app**, não na vida real, e cai no "qualquer toque conta" que o parecer C-C1 marcou como perdão que esvazia. |
| **M9** Filtro de conteúdo do catálogo | `APROVADO COM RESSALVA` | R-42 | O filtro está certo; faltam: exposição social disfarçada, risco físico de "lugar novo", alternativa sem mobilidade, e revisão obrigatória pela psicologia. |
| **M10** Mapa sem percentual nem "faltam N"; névoa | `APROVADO COM RESSALVA` | R-43 | Névoa sobre **todas** as regiões futuras seria a silhueta do não coletado, que a decisão de 08/09 veta no Diário. Só as abertas + a próxima; nenhum total, nenhum fim visível. |
| **M11** Nasce muda; EN primeiro; L1..L12 | `APROVADO COM RESSALVA` | R-44, R-46 | R-NOVA e EN-primeiro estão certos; a copy também não pode usar imperativo de cobrança ("complete", "cumpra") nem o vocabulário de L5. |
| **M12** Não duplica subir de nível nem assombrada | `APROVADO COM RESSALVA` | R-45 | "Prova" do próximo nível não pode alimentar `catalogLevel`, nem aparecer para item `optInOnly`, nem coexistir com uma oferta de descer pendente. |
| **Leitura literal do pedido** ("precisa cumprir para progredir" no núcleo) | **`VETADO` (preventivo)** | R-27 | Progresso do núcleo condicionado a exigência externa é o cobrador. Alternativa: a da própria proposta (progresso só no mapa, opt-in). |
| **A proposta inteira** | **`APROVADO COM RESSALVA`** | R-27..R-48; bloqueantes: **R-27, R-31, R-33, R-37, R-38, R-40, R-47** | Na forma escrita, não cruza nenhuma das 21. Fica a um passo de #19/#16 (pendência que cobra, contagem de expedições) e da regra 4 da Aventura (conteúdo reservado); as condições fecham esses passos. |

---

## As condições (R-27..R-48)

### Núcleo intocado

- **R-27 (bloqueante; §5.6, pergunta 2, veto preventivo da leitura literal).** Nenhum sistema do núcleo lê o estado da Expedição: `computeDailyReset`, `dailyGoalFor`/`registeredForDay`/`heartGoalFor`, energia, `perfectDays`/`totalPerfectDays`/`missionPerfectDays`, `MANUAL_EVOLUTION`/`handleEvolve`, `habitRhythm` (constância, escudos), `catalogLevel`, Torneio, `weeklyMissions` (`contarMissao`), `missions.ts`, `achievements.ts`, Vínculo (`totalXP`/`bondLevelFor`). **Aceite:** teste de contrato `expedicao.foraDoNucleo.contract.test.ts` que varre esses módulos (e o `App.tsx` nos handlers de virada/evolução) e reprova qualquer referência ao símbolo/campo da Expedição; e caso de unidade "virada do dia com e sem Expedição ativa/concluída ⇒ estado resultante idêntico" (mesmo formato do teste de humor que já existe).
- **R-37 (bloqueante; MIS-3).** A Expedição **nunca** entra na meta do dia, **nem como bônus que só conta quando feita**. Motivo: entrar em `dailyGoalFor` faz a Expedição mexer em HP (`heartGoalFor = ceil(meta × 0,6)`), e aí um desafio opt-in e sem prazo vira cobrança de coração — a M2 desfeita por outro caminho. Contar só do lado "feito" é pior no outro sentido: um botão auto-declarado passaria a **proteger coração** (perdão novo, #17 sem D4) e a tornar o ato um meio para HP (pergunta 1). A Expedição também **não** entra no `feito/meta` de `adventureRarity` (`ADVENTURE_ODDS`): o desafio não compra chance de raro.

### Oferta, pendência e auto-declaração

- **R-28 (M1).** "Nenhum" é escolha de primeira classe: fechar a região sem escolher não gera estado, fala, marca nem nova oferta automática. Os 3 desafios são determinísticos por região (seed = id da região, como `weeklyMissionsFor`); reabrir a folha não re-sorteia.
- **R-29 (#16, #19; M2).** A Expedição ativa **não envelhece**: sem "há N dias", sem esmaecer, sem partícula, sem o pet olhar (o gesto da assombrada é de tarefa, não de convite). Não entra em `triageQueue`, em `isHaunted`, nas "pendências de ontem" do check-in (`checkInPlan`), no `weeklyReport`, no `lastDayReport` nem na fila de avisos da Home. **Aceite:** esses símbolos não referenciam a Expedição (mesma varredura de R-27).
- **R-30 (#15; M2).** "Trocar/Deixar pra lá" é um toque, sem confirmação de culpa ("tem certeza?"), sem copy de perda, sem cooldown para aceitar outra. O desafio largado volta ao pool **da mesma região**, sem marca de "já desistiu".
- **R-31 (bloqueante; pergunta 1, Errant Signal).** A oferta **nunca anuncia o prêmio**: proibido "cumpra para abrir", "complete to unlock", pré-visualizar a região, mostrar o postal futuro ou qualquer "o que você ganha". A oferta fala só do ato; a abertura da região é **narrada depois**, pelo pet, como consequência ("fui até lá, onde você foi"). **Aceite:** varredura de copy da folha por `unlock|desbloque|abrir .* região|ganh|reward|recompens` sobre as strings da Expedição.
- **R-32 (M3; "perdoa demais").** Marcar **Fiz** não abre nada na hora: o efeito acontece **na Aventura daquela noite** (o relógio único do EXP-6), e no máximo **uma região por dia do jogador** (`playerDayKey`). Assim "Fiz, Fiz, Fiz" não atravessa o mapa num minuto, a auto-declaração continua sem prova, e não existe um segundo "voltou?" com outro horário. **Aceite:** teste "três Fiz no mesmo dia ⇒ uma região".
- **R-39 (#18, D8).** A v1 **não tem campo de texto livre** (nem desafio escrito pela pessoa, nem "conte o que você fez"). Se um dia tiver: fica só no save, nunca vai a `/api/chat`, a telemetria, a `publicProfile` nem ao widget antes de a D8 estar respondida, e entra no `Delete my answers`/exclusão de dados. Nenhum evento de telemetria leva a **área** do desafio (social, mente, corpo): a área já é dado sobre a vida da pessoa. Se houver telemetria, só um enum sem área (`accepted`/`done`/`dropped`), com linha em `privacidade.html` PT/EN.

### Recompensa e conteúdo

- **R-33 (bloqueante; regra 4 da Aventura, pergunta 2).** O catálogo comum da Aventura (`ADVENTURE_CATALOG`) continua **inteiro alcançável** por quem nunca aceitou uma Expedição, e o Passeio sem Expedição não estagna. O conteúdo exclusivo da região se limita ao **registro do próprio ato**: o postal da região e o capítulo de lore dela. **Aceite:** o teste existente "todo achado do catálogo é alcançável por quem teve um dia ruim" ganha o irmão "… por quem não tem nenhuma região aberta".
- **R-34 (08/09, §5.6, "Ateliê não rende missões").** Nada material: sem Bits, Créditos, Emblemas, item, atributo, XP de Vínculo, `perfectDays`, decoração nem cenário na loja (o padrão `bg-mission-*` de `missions.ts` é exatamente o que **não** se replica). O postal entra no `AdventureDiary` como entrada normal (`AdventureEntry {id, day}`), sem campo de recompensa — o teste "nenhum achado carrega recompensa material" cobre os postais novos.
- **R-35 (footgun 9, EXP-6).** Um catálogo, um diário, um relógio: postais e lore das regiões vivem no mesmo módulo/catálogo da Aventura (ou num dono único importado por ela), nunca num segundo sorteio. Campo novo no save é chave nova (#20); nada existente é renomeado.
- **R-36 (#16, #14, #21).** Nenhum lugar conta Expedições ou regiões: sem "N expedições feitas", sem "N regiões", sem conquista por quantidade, sem linha no `weeklyReport`, nada em `publicProfile`, perfil do amigo ou widget. `hideMetrics` vale inteiro.

### Canais

- **R-38 (bloqueante; #19, M7).** Nenhum push web/FCM, badge, item de widget, overlay do desktop nem fala espontânea do pet sobre a Expedição. **Aceite:** `expedicao.semPush.contract.test.*`, espelho de `functions/api/guild.semPush.contract.test.js`, varrendo `workers/push-scheduler.js`, `functions/api/_pushCopy.js`, `SoulmonWidgetPlugin.kt`, `desktop/renderer/src/**` e o banco de falas idle do `CompanionHUD`. O pet só fala da Expedição **dentro da folha** e **na narração da noite** em que ela acontece.

### Tamanho do desafio

- **R-40 (bloqueante; M8, "perdoa demais").** A versão pequena é **um ato na vida real**, nunca uma ação no app (ver, ler uma tela do Soulmon, tocar num botão). O exemplo "Só olhar o que o próximo nível pede" sai; troca sugerida: *"Fazer 2 minutos da versão do próximo nível"*.
- **R-41 (M8, pergunta 5).** Versão plena e pequena têm **resultado byte a byte igual** (mesma região, mesmo postal, mesma fala). **Aceite:** teste de unidade. A tela nunca rotula a escolha ("versão fácil", estrelas de dificuldade, "você escolheu a pequena"); "levantar a barra" mora no que é **oferecido**, nunca no que é **exigido**.

### Conteúdo

- **R-42 (M9; psicologia).** Além do filtro escrito: (a) desafio social é **convite a um contato**, nunca exposição graduada (falar em público, "enfrentar" algo) — isso é exposição terapêutica sem profissional; (b) "lugar novo" nunca à noite, nunca exige deslocamento pago nem sugere isolamento; (c) toda região de "Corpo" tem versão sem mobilidade; (d) nada de álcool, sexo, dieta, jejum, peso, sono por duração, gasto, risco; (e) nenhum desafio pede para **mostrar/compartilhar** pelo app (#21); "mostrar para alguém" é offline; (f) o pool passa pelo `soulmon-behavioral-psychologist` antes do merge, como o catálogo de atividades passou.

### Mapa e copy

- **R-43 (M10; decisão "Diário NÃO mostra o que falta", #14).** O mapa mostra só as regiões abertas e **a próxima**; nunca a névoa de todas as futuras, nunca o total, nunca "próxima de N", nunca fim visível. Se o mapa for finito, a última região aberta continua oferecendo desafios (ou o mapa gera a seguinte): nada de beco com "você completou tudo" que vira placar. **Aceite:** nenhum componente do mapa lê `.length` do catálogo de regiões.
- **R-44 (M11; L1..L12, #15).** EN primeiro, PT-BR junto (mesmo commit). Sem imperativo de cobrança ("Complete", "Cumpra", "Don't give up"), sem prazo, sem saudade-cobrança do pet (L6, L11): o pet conta o que **viu** lá, nunca "você finalmente foi". Copy dentro dos caminhos varridos por `src/copy.semFomo.contract.test.ts` e `src/narrativa.contract.test.ts`.
- **R-45 (M12).** A "prova do próximo nível" (a) não grava em `activityLog`/`habitRhythms`, não soma em `LEVEL_MIN_DAYS` nem na constância de `suggestLevelChange`; (b) nunca é oferecida para item `optInOnly` (o próprio `catalogLevel.ts` proíbe subir esses itens — "mais frequência não é progresso"); (c) não é oferecida enquanto há uma oferta de descer (`catalogLevelDownCopy`) pendente para o mesmo item — convidar a subir quem acabou de ser convidado a aliviar é contradição que lê como cobrança.
- **R-46 (L5; MIS-2).** O nome não pode ser "Expedição" sem a bíblia mudar junto: L5 usa "a expedição" como a coisa que **pode** ser perdida. Ou a bíblia troca o exemplo de L5, ou o recurso ganha outro nome. Também não pode ser "Missão" (já são dois sistemas). Nome é decisão do dono + `squad-narrativa`; este guarda só exige que o nome escolhido não carregue perda nem obrigação.

### Processo

- **R-47 (bloqueante; Camada 3, EXP-1, EXP-2).** Só entra depois do Passeio fundido à Aventura existir, e só com exceção própria ao congelamento (MIS-1). Herda **inteiras** as condições R-1..R-11 do parecer do Passeio e a condição do EXP-2: nenhuma ação de cuidado (comer, banho, sono, carinho) fica indisponível enquanto o pet "passeia" por causa de uma Expedição, com teste provando.
- **R-48 (ledger).** Qualquer mudança futura que dê recompensa material à Expedição, a ponha na meta, lhe dê prazo, push ou contagem, volta a este guarda antes de virar tarefa.

---

## As seis perguntas, sobre a proposta inteira

1. **Querer fazer a tarefa ou querer a notificação?** Sem push (R-38), não é notificação. Mas o risco equivalente existe: querer **a região** em vez de **o ato**. R-31 (oferta sem prêmio anunciado) e R-32 (efeito à noite, 1/dia) são a resposta. É o ponto mais frágil do desenho, e não é resolvido de todo por nenhuma condição; só dado real diria.
2. **Tira algo?** Não, desde que R-30 (largar não custa) e R-33 (o Passeio não estagna para quem não aceita desafio) valham.
3. **Mais um perdão?** Não. "Deixar pra lá" não perdoa punição nenhuma, porque não há punição. **A contagem de D4 continua em oito** — e R-37 existe justamente para impedir que a Expedição vire o nono (Fiz protegendo coração).
4. **Número que desce?** Nenhum proposto. R-36 e R-43 impedem os que surgiriam (contagem de expedições, fração do mapa).
5. **Homem atrás da cortina?** Mostrado por dentro, "o pet vai ao lugar aonde você disse que foi, e isso vira um postal" não constrange. "Cumpra X para liberar conteúdo" constrangeria — por isso R-31.
6. **Cabe na tese?** Cabe em "evolui COM o usuário e o encoraja": o convite é encorajamento, e o pet ir aonde a pessoa foi é o "COM" literal. Não cabe se for lido como "precisa cumprir para progredir" (R-27).

---

## Onde este parecer diz "isto perdoa demais"

- **M3 + ausência de ritmo:** auto-declaração sem nenhum atrito abriria o mapa inteiro em sequência, e o mapa perderia o sentido de registro de uma vida. **R-32** (efeito na noite, 1 região por dia) é a linha, e não é punição: é o ritmo do relógio que o produto já tem.
- **M8, exemplo do "Hábito":** "só olhar" contando igual é o "qualquer toque conta" (C-C1). **R-40**.
- **M6 com "por padrão":** a Expedição somando ao "feito" da meta seria um perdão de coração acionado por um botão sem prova. **R-37**.

Onde **não** perdoa demais e está certo: versão pequena contando igual (M8, com R-40/R-41). É a tese: quem escolhe o tamanho é a pessoa, e a barra sobe no convite, não na exigência.

---

## Perguntas ao dono (numeração final fica com quem consolida `PERGUNTAS-DO-DONO.md`)

| Id sugerido | Pergunta | Recomendação deste guarda | Gatilho de revisão |
|---|---|---|---|
| **MIS-1** | Abrir exceção ao congelamento da Camada 3 para as Expedições (a EXP-1 foi estreita: só o Passeio fundido)? | Não é linha vermelha nem decisão minha. Se abrir: **depois** do Passeio implementado (R-47), e na forma com R-27..R-48. | 10 usuários × 14 dias (o gatilho do congelamento). |
| **MIS-2** | Qual o nome? "Missões" já são dois sistemas; "Expedição" é, na bíblia (L5), a coisa que pode ser perdida. | Outro nome, sem conotação de obrigação nem de perda (decisão com a `squad-narrativa`); ou mudar L5 no mesmo commit (R-46). | — |
| **MIS-3** | A Expedição pode virar tarefa/entrar na meta do dia? | **Nunca**, nem como bônus que só conta quando feita (R-37): na meta ela mexe em HP; do lado "feito" ela vira um perdão de coração sem prova (nono perdão sem D4). | Só se a D4 for reaberta e o dono decidir, sabendo o custo, que um desafio auto-declarado protege coração. |
| **MIS-4** | A pessoa pode escrever o próprio desafio ou uma nota sobre o que fez (texto livre)? | **Não na v1** (R-39). Se um dia sim: local, fora de IA/telemetria/perfil até a D8. | Resposta da D8. |
| **MIS-5** | Recompensa além do mapa (Bits, Emblemas, Vínculo, decoração, conquista)? | **Não** (R-34). Seria a alternativa que perdeu em 08/09 (Aventura) e contra o espírito de 30/09 (Ateliê não rende missões/Vínculo); e agravaria o risco de a pessoa fazer o ato pelo prêmio (pergunta 1). | Aposta 9 do registro (abertura do relatório da noite estável em 90 dias); só com fato novo. |
| **MIS-6** | O pedido diz "**precisa** cumprir para progredir". Confirma que "progredir" é só o mapa da Exploração, e nunca evolução/HP/dia completo? | **Confirmar só o mapa** (R-27). A leitura literal é vetada. | Qualquer proposta que ligue Expedição ao núcleo volta a este guarda. |
| **MIS-7** | O mapa é finito? O que acontece na última região? | Sem fim visível e sem "completou tudo" (R-43); regiões novas nascem de arte de reino (EXP-7). | Quando houver arte de reino. |
| **MIS-8** | Quem cura o pool de desafios? | `squad-narrativa` escreve, `soulmon-behavioral-psychologist` veta (R-42), este guarda relê a lista final. | Qualquer desafio novo fora das áreas aprovadas. |

---

## Tabela-resumo

| Item | Veredito | Condição bloqueante |
|---|---|---|
| Leitura literal ("precisa cumprir para progredir" no núcleo) | **VETADO** (preventivo) | R-27 |
| M1 | APROVADO COM RESSALVA | R-28, R-31 |
| M2 | APROVADO COM RESSALVA | R-29, R-30 |
| M3 | APROVADO COM RESSALVA | R-32, R-39 |
| M4 | APROVADO COM RESSALVA | R-33, R-34, R-35 |
| M5 | APROVADO | R-36 |
| M6 | APROVADO COM RESSALVA | R-27, R-37 |
| M7 | APROVADO | R-38 |
| M8 | APROVADO COM RESSALVA (exemplo "só olhar" VETADO) | R-40, R-41 |
| M9 | APROVADO COM RESSALVA | R-42 |
| M10 | APROVADO COM RESSALVA | R-43 |
| M11 | APROVADO COM RESSALVA | R-44, R-46 |
| M12 | APROVADO COM RESSALVA | R-45 |
| **Proposta inteira** | **APROVADO COM RESSALVA** | R-27, R-31, R-33, R-37, R-38, R-40, R-47 |

---

## O que NÃO consegui verificar

- Não li `AdventureDiary.tsx` nem `achievements.ts` nesta rodada; a lista de módulos em R-27 vem do `CLAUDE.md` e do código lido. O `achievements.ts` ainda tinha `tasks-100` lendo contagem no worktree da Exploração (parecer anterior); não é do escopo, mas nenhuma conquista nova pode ler Expedição.
- Não abri `CompanionHUD.tsx` para confirmar onde mora o banco de falas idle; R-38 cita o componente, e o teste tem de apontar para o arquivo real.
- `guild.semPush.contract.test.js` existe (`functions/api/`), mas não li o corpo; o teste espelho segue o formato dele (≈).
- A proposta não diz o que acontece com uma Expedição ativa quando a pessoa renasce (`rebirth`) ou quando a nuvem é adotada (`cloudSave`). O esperado é que sobreviva sem mudança (é registro da pessoa, não do pet), mas isso precisa ser escrito e testado.
- Sem uso real: "clicar Fiz sem fazer", "querer a região em vez do ato" e "a pendência pesa" são previsões.

---

## Registro para o ledger (copiar em `docs/plano-melhorias/ledger/vetos.md`, seção "Registro de vetos e pareceres")

| Data | Proposta | Parecer | Proibição | O que fazer |
|---|---|---|---|---|
| 30/09/2026 | **Missões de Expedição** (`PROPOSTA-MISSOES-EXPLORACAO.md`: desafios da vida real, opt-in, auto-declarados, que abrem regiões do mapa do Passeio; M1..M12) | `APROVADO COM RESSALVA` · leitura literal "precisa cumprir para progredir" no núcleo `VETADO` preventivo · exemplo M8 "só olhar o próximo nível" `VETADO` | #19, #16, #14, #15, #17 (via meta), #18 (texto livre), #21; §5.6 (brincar nunca é condição; Aventura sem recompensa; dia mexe na chance, nunca no acesso; Diário não mostra o que falta); 30/09 (Ateliê não rende missões) | R-27..R-48. Bloqueantes: R-27 núcleo não lê a Expedição (teste de contrato) · R-31 oferta nunca anuncia o prêmio · R-33 catálogo comum da Aventura inteiro sem Expedição · R-37 nunca na meta do dia, nem como bônus · R-38 `expedicao.semPush.contract.test.*` · R-40 versão pequena é ato na vida real · R-47 só depois do Passeio e com exceção própria à Camada 3. Nome: "Expedição" colide com L5 (R-46) |
