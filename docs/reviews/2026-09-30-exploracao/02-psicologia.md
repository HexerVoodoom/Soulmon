# Parecer — psicologia comportamental — Exploração (Passeio, Diário de Campo, Escavação)

Revisor: `soulmon-behavioral-psychologist` (tem poder de veto)
Data: 30/09/2026
Escopo: as três ideias finalistas do briefing (Passeio, Diário de Campo, Escavação), lidas contra o risco de cobrança, de ausência, de FOMO e para públicos vulneráveis (TDAH, ansiedade, depressão, perfeccionismo, transtorno de compulsão por jogo). Base lida: `docs/plano-melhorias/ledger/vetos.md` e `docs/manual/01-VISAO.md` §7 (as 21 proibições), `docs/NARRATIVA-E-UNIVERSO.md` (L1..L12, §5.10, §8, §13), `docs/REGISTRO-DE-DECISOES.md` (linhas de Aventura, "Recompensa variável com TETO", "Camada 3 CONGELADA", guarda-corpos), `src/utils/adventure.ts`, `src/components/AdventureDiary.tsx`, `src/utils/welcomeBack.ts`, `src/utils/rituals.ts` (`weeklyReport`), `docs/manual/02-REGRAS-DE-NEGOCIO.md` §58 (notificações), `functions/api/guild.semPush.contract.test.js`, `docs/reviews/guilda/02-psicologia.md` e `docs/reviews/2026-09-28-catalogo-psicologia.md` (formato).

> **Declaração de limite.** Este parecer não faz diagnóstico e o Soulmon não é tratamento. O que aparece como "efeito esperado" é previsão de design, não medição. Ninguém usou o app em produção e não há telemetria: onde a evidência vem de adultos saudáveis ou de jogos que não são o Soulmon, eu digo. Não decido regra; recomendo, e o dono decide.

Legenda: **VETO** bloqueia a exposição ao jogador até ser corrigido. **AJUSTE OBRIGATÓRIO** entra antes de qualquer implementação. **SUGESTÃO** é opcional. Prefixo das condições: **R-** (risco/psicologia).

## Correção de premissa do briefing

O briefing diz que "hoje o único push permitido é o de deitar". O manual (`02-REGRAS-DE-NEGOCIO.md` §58) lista quatro famílias de aviso: lembretes do dia (`PUSH_HOURS_BRT`), aviso da noite condicional, lembrete de deitar e cocô. O que vale para este parecer é o que o §58 e o `copy.semFomo.contract.test.ts` já dizem: **nenhum desses avisos anuncia chegada de conteúdo ou recompensa**. Todos falam do cuidado ou do plano da própria pessoa. Um push "seu pet voltou" seria o primeiro da classe "conteúdo chegou", e é essa classe que a proibição #19 mira.

## Achado transversal: já existe um loop "o pet saiu e voltou com um achado"

A Aventura da noite (`adventureOfDay`, `AdventureDiary`, decisão do dono de 08/09/2026) já é o "pet saiu e traz achado narrado". Passeio + Diário de Campo criam um **segundo** loop de retorno concorrente, com relógio próprio (N horas) ao lado do relógio do dia. Para o meu papel isso importa por um motivo específico: dois "voltou?" com horários diferentes duplicam o gatilho de verificação (ver R-P4). A recomendação psicológica é **um catálogo, um diário e uma cadência**, com o Passeio como a face diegética da Aventura existente e não como sistema paralelo. A decisão de produto (o que sobra de novo) é do PM; aqui eu só fixo que **não pode haver dois relógios de retorno**.

O registro pede a pergunta "o que mudou desde que X perdeu?". Resposta desta lente: **nada foi medido** (a própria linha "Aventura sem recompensa material" do registro diz que nenhuma fonte mediu "narrativa não satura" em 90 dias, Aposta 9). O que existe é a literatura de esquema de reforço e o benchmark de que o Finch faz aventura com timer. Isso não derruba a decisão de 08/09; também não a sustenta com dado novo.

---

## 1. Passeio (expedição do pet, relógio real, app fechado)

**APROVADO COM RESSALVA** — só na forma emendada abaixo. Três elementos do desenho proposto no briefing recebem **VETO** (acúmulo contável de achados, push de retorno, Bits sem reabrir a decisão de 08/09).

**Motivo.** O timer que corre com o app fechado é legítimo e é o mesmo desenho do Finch (aventura de horas reais, o pássaro volta com uma história; fonte secundária, ver "não verifiquei"). Ele é bom para TDAH e depressão no ponto certo: não exige presença, não cobra e não pune esquecer. O risco não está no timer. Está em três acessórios: o que se **acumula**, o que **avisa** e o que **paga**. Timer com hora marcada é o padrão que Zagal, Björk & Lewis (FDG 2013, "Dark Patterns in the Design of Games", verificado por busca) chamam *playing by appointment*: o jogo leva a pessoa a voltar num momento específico por recompensa ou punição. Sem punição o padrão perde o dente, mas fica a recompensa com hora marcada, e é ela que cria o hábito de verificar (Oulasvirta et al., *Personal and Ubiquitous Computing* 16(1), 2012, verificado: "checking habits" nascem de recompensa informacional de acesso rápido e repetido).

### Os cenários pedidos

**(a1) O Passeio vira "razão a checar"?** Vira, se houver contagem regressiva, animação de "quase volta" ou push. Cenário: pessoa com ansiedade abre o app 6 vezes numa tarde para ver "se ele já voltou"; cada abertura sem conclusão de tarefa é o sinal exato que o registro manda vigiar ("aberturas/dia sem conclusão ↑", guarda-corpos do registro). Sem contagem visível, sem push e sem novidade além do cartão, o custo de verificar sobe e o hábito não se forma. O relógio existe, o rito de olhar para ele não.

**(a2) Quem sai 3 dias volta e encontra achados acumulados: saudade ou fatura?** **Fatura**, mesmo com boa intenção, por três motivos concretos:
- Três cartões com datas de três dias diferentes são, na prática, a contagem de ausência que L6 veta ("contagem de dias sumidos"). A criatura ainda não sabe medir tempo (§5.10: "há maré, não relógio"), então o produto inventaria uma memória que o mundo declarou que ela não tem.
- "Saudade" exige que a criatura tenha sentido por causa do que a pessoa fez ou deixou de fazer ao longo do tempo. Isso é L11, vetado nos dois sentidos. O cartão acumulado só lê como saudade se vier com "ele esperou", que L6 também veta. Sobra a leitura de pilha.
- Para TDAH e depressão, uma pilha de itens não abertos é o padrão de caixa de entrada: o custo de voltar sobe com o tamanho da pilha (mesma família do "painel de pendências" que o `AdventureDiary` cita de `PLANO-TAREFAS.md`, citação de segunda mão, ver "não verifiquei"). É o efeito "what-the-hell" já citado no registro (Polivy & Herman; Marlatt): quanto maior o que ficou para trás, maior a chance de não voltar.

**(a3) Achados acumulados criam uma contagem de "coisas que deixei de coletar"?** Sim, no instante em que o app mostra "3 achados esperando" (ou um badge). Sem número, o empilhamento ainda é legível pela lista de datas. A única forma sem contagem é **não acumular**: um Passeio por vez, e nenhuma fila. Quem some 3 dias encontra **um** cartão (o do último passeio) e o resto simplesmente não existiu, porque o passeio novo só começa depois que o anterior é aberto ou no começo do dia seguinte. Não há estoque, portanto não há perda.

**(a4) Existe teto de acúmulo e ele é lido como perda?** Um teto ("guarda até 3, o resto se perde") é **FOMO que tira** (proibição #15, `copy.semFomo.contract.test.ts`). Pior: a regra escrita no Guia é um relógio de validade visível, e a pessoa ansiosa vai calcular quando estoura. Não existe teto "seguro" para uma fila que descarta. Logo: **sem fila, sem teto, sem descarte**.

**(a5) Push "seu pet voltou".** **VETO** (proibição #19: a resposta à pergunta "por que abri o app?" seria "por causa da notificação", não "para cuidar"). Vale também para a versão local por `AlarmManager`/`syncActivityAlarms`: ainda é notificação. Precedente no repositório: `guild.semPush.contract.test.js` faz exatamente isso para a Guilda; a Exploração precisa do mesmo contrato.

### Condições do Passeio

- **R-1 (bloqueante, VETO ao acúmulo contável).** Não existe fila nem estoque de passeios. No máximo **um** passeio em curso e **um** cartão aguardando ser aberto. Nenhuma superfície mostra "N achados", badge numérico, ou lista de cartões não vistos. Aceite: teste de contrato que o estado persistido do Passeio não tem campo de contagem de cartões pendentes maior que 1 e que nenhum componente renderiza número derivado dele. Toca: L6, L11, proibições #15, #16; `PLANO-TAREFAS.md` (painel de pendências).
- **R-2 (bloqueante, VETO ao push).** Nenhum push, local ou remoto, sobre Passeio, Escavação ou Diário. Aceite: contrato análogo a `guild.semPush.contract.test.js`, varrendo `workers/push-scheduler.js`, `workers/fcm.js`, `workers/webpush.js`, `functions/api/_pushCopy.js`, `functions/api/_pushTargets.js`, `functions/api/_pushIdentity.js`, `functions/api/subscribe.js`, `src/utils/notifications.ts`, `src/components/NotificationManager.tsx` por `passeio|escavaç|diário de campo|expedi|walk|dig`. Toca: proibição #19.
- **R-3 (AJUSTE OBRIGATÓRIO, conflito com decisão registrada).** O Passeio não paga Bits. O registro de 08/09/2026 (linha "Aventura da noite: narrativa, sem recompensa material") fecha exatamente este caso: recompensa material torna a tela algo que a pessoa PRECISA abrir. Um Passeio que paga Bits com hora marcada é a mecânica "coletar renda" dos jogos ociosos (o mesmo padrão *playing by appointment*). Se o dono quiser reabrir, precisa registrar a resposta a "o que mudou desde que X perdeu" e, desta lente, **nada mudou**. Aceite: o estado do cartão não tem campo de recompensa (mesmo teste que trava `ADVENTURE_CATALOG` sem campo de recompensa).
- **R-4 (AJUSTE OBRIGATÓRIO, um relógio só).** O Passeio não convive com um segundo relógio de retorno (o da Aventura da noite). Ou o Passeio é a face diegética da Aventura (mesma cadência, mesmo catálogo), ou é o único dos dois. Dois "voltou?" com horários diferentes multiplicam o gatilho de verificação (Oulasvirta 2012). Aceite: uma única fonte de "achado do dia" no save.
- **R-5 (AJUSTE OBRIGATÓRIO, sem contagem regressiva).** Nenhuma superfície mostra "faltam Xh", barra de progresso do passeio, nem animação de "quase voltando". No máximo uma frase qualitativa e fixa ("passeando" / "voltou"). Se o dono quiser um horário, ele aparece **uma vez** na partida, absoluto, e nunca decresce. O timer de N horas tem uma duração única para todos e sem gradiente "passeio mais longo rende mais" (esperar mais = custo afundado). Toca: proibição #19; lembrete de deitar já veta "são 22h30" pelo mesmo motivo (§58: "um relógio cobrando").
- **R-6 (AJUSTE OBRIGATÓRIO, o Passeio não lê tarefa nem estado do dia).** Duração, bioma e raridade do cartão vêm só de relógio e seed, nunca de `feito/meta`, HP, energia ou constância. A Aventura atual varia a CHANCE de raro por `ADVENTURE_ODDS` conforme o dia cumprido; o Passeio não herda isso. Um cartão que muda com o desempenho é elogio por resultado (L12, L2); um cartão que não muda é presente. Aceite: `adventure`-like para o Passeio não importa `feito`/`meta`.
- **R-7 (AJUSTE OBRIGATÓRIO, o pet não some do palco).** Ver resposta à pergunta 2. O pet permanece presente e cuidável (comer, banho, sono) durante o passeio. Palco vazio por horas + dreno de cocô (`poopDrainCharge`) ativo = a pessoa perde a ferramenta de cuidado enquanto o dano corre, que é punição estrutural. E palco vazio sem explicação lê como abandono para quem está deprimido (previsão de design, sem estudo específico que eu tenha verificado). Aceite: teste que o Passeio em curso não altera `disponibilidade` de nenhuma ação de cuidado nem pausa/estende nenhum timer de HP.
- **R-8 (AJUSTE OBRIGATÓRIO, copy sob L6/L11).** Nenhuma frase do cartão ou da folha menciona duração de ausência, espera, saudade ou "voltou porque você abriu": vetado "esperou", "sentiu sua falta", "demorei", "há N horas". O cartão é a criatura contando o que viu, no passado, como `ADVENTURE_CATALOG` já faz. Aceite: a régua de `welcomeBack.test`/`copy.semFomo.contract.test.ts` estendida ao texto do Passeio.
- **R-9 (SUGESTÃO, guarda-corpo pós-lançamento).** Se um dia entrar em produção, medir "aberturas/dia sem conclusão", `push_optout` e abertura do relatório noturno (guarda-corpos do registro) antes de qualquer melhora do Passeio. Se as aberturas sem conclusão subirem, o Passeio está criando checking e sai, independentemente de o farol (retenção) subir.

**Vulneráveis.** TDAH: ganha, porque o desenho tolera esquecer (nada se perde), desde que R-1 valha; a cegueira de tempo torna o timer inerte, não punitivo. Ansiedade: risco alto **se** R-2 e R-5 forem violados, baixo se cumpridos. Depressão: a chegada de um cartão sem relação com o desempenho é neutra ou boa; a pilha (R-1) ou o palco vazio (R-7) invertem isso. Perfeccionismo: sem lacuna e sem contagem, não há o que completar (R-1, e ver Diário). Compulsão por jogo: ver Escavação; o Passeio sozinho é esquema de intervalo fixo sem ação do jogador, que é o de menor poder de manutenção entre os esquemas clássicos (≈, Ferster & Skinner 1957, de memória).

---

## 2. Diário de Campo (álbum de achados: bioma, data, frase)

**APROVADO COM RESSALVA** — desde que use as regras do `AdventureDiary` e **não** a silhueta do Bestiário.

**Motivo.** Um diário com data e frase, sem número nem lacuna, é história, não lista de pendências: é exatamente o desenho que o `AdventureDiary` justifica ("o que ela viu, ela viu; o que não viu ainda não existe para ela"). O briefing propõe reaproveitar do Bestiário "silhueta, contagem" e isso **reintroduz a lacuna**. A silhueta do Bestiário é legítima lá porque a coleção é o jogo (existe e você ainda não viu; `BestiaryCard`, 36 silhuetas). Num álbum que se enche pelo relógio e não pelo esforço, a silhueta vira meta de completar sem ação possível para completar, e é a pessoa com traços obsessivos ou perfeccionismo quem paga (o "efeito de progresso dotado" e o de completude de coleções são de Nunes & Drèze 2006 e da tradição de Zeigarnik, ambos (≈) de memória; o efeito Zeigarnik tem replicação irregular, então trato como risco plausível e não como fato).

### As perguntas

**A coleção sem lacuna visível basta?** Basta, e é o único desenho que o registro aceita. Mas "sem lacuna" tem detalhes que reintroduzem lacuna sem querer: agrupar por bioma com N slots (uma seção "Necrópole" com 1 cartão e espaço para 2 é lacuna por outro nome), calendário ou grade de dias (dia sem cartão vira buraco), cabeçalho "semana sem achados". O bioma entra como **linha do cartão**, não como seção.

**Mostrar raridade?** Não, e vale também no **momento da revelação** (nenhum "achado raro!" nem efeito mais longo para raro). O `AdventureDiary` decidiu certo: rotular a noite de ontem "comum" diz que ela valeu pouco. Além disso, sinalização de raridade no momento da revelação é o gatilho clássico de reforço variável; o arco de suspense escalonado por raridade imita a lógica de máquina (≈, Dixon et al. 2010, "losses disguised as wins", de memória). Cartão raro é só uma cena diferente.

**Entrar no `weeklyReport`?** Não. O `weeklyReport` (em `rituals.ts`) hoje descreve constância, melhor hábito, categoria dominante, esforço e sonhos. Uma linha "N achados" transforma descrição em desempenho: um número que pode ser baixo numa semana ruim, sobre uma coisa que a pessoa não controla, e que reintroduz a contagem de ausência (semana de 0 achados = semana fora). E como `weeklyReportHasSubstance` já usa `dreams > 0` para o relatório existir, meter achados ali faria o relatório aparecer por presença no app e não por tarefas ou cuidado. Se o dono quiser algo, **uma** frase de cartão citada, sem número (SUGESTÃO, ver pergunta 4).

### Condições do Diário de Campo

- **R-10 (bloqueante).** Sem silhueta, sem slot vazio, sem "N de M", sem percentual, sem barra e sem contagem de cartões, nem por bioma. O vazio é uma promessa ("ainda não há nada aqui"), como o `AdventureDiary` já faz. Aceite: teste de renderização análogo a `BestiaryCard.render.test.tsx` provando 0 elementos `[data-silhouette]` e nenhum texto com dígito além da data. Toca: proibição #14 (percentual), #16; L4.
- **R-11 (AJUSTE OBRIGATÓRIO).** Sem rótulo, cor ou tratamento visual de raridade no diário e na revelação. Aceite: o componente não lê `rarity`.
- **R-12 (AJUSTE OBRIGATÓRIO, um diário só).** Diário de Campo e `AdventureDiary` são a mesma tela ou a mesma lista com as mesmas regras (ver Achado transversal, R-4). Aceite: um único array no save e um componente.
- **R-13 (AJUSTE OBRIGATÓRIO, datas sem buraco legível).** A data é a do achado (`dayKeyLabel`), do mais recente para o mais antigo. Nenhuma grade de calendário, mapa de calor ou agrupamento por semana/mês que evidencie dias sem cartão. Toca: L6.
- **R-14 (AJUSTE OBRIGATÓRIO).** Fora do `weeklyReport` e de qualquer resumo com número. Aceite: `weeklyReport` não ganha campo de achados.

**Vulneráveis.** Perfeccionismo/obsessivo: a silhueta é o risco principal (R-10). Depressão: o diário é lido para reencontrar, e a data dá história; os buracos entre datas são inevitáveis, por isso R-13. Ansiedade: baixo. TDAH: baixo, e novo cartão sem custo de perder.

---

## 3. Escavação (minijogo de 1 toque, 30–60 s, sem falha, sempre com resultado)

**APROVADO COM RESSALVA** — na forma "lore apenas, uma por dia, resultado determinístico". **VETO** à forma "sorteio novo a cada escavação, repetível à vontade, pagando Bits ou decoração rara".

**Motivo.** "Sem falha" é excelente para TDAH, ansiedade e depressão: nenhuma sessão termina em "perdi". O problema é o segundo atributo: **sempre com resultado + sorteado + repetível sem custo** é o desenho de um esquema de razão variável. Sem custo por puxada e sem limite de puxadas, cada escavação é um puxão de alavanca; o esquema de razão variável é o de maior taxa e maior resistência à extinção na literatura clássica (≈, Ferster & Skinner 1957; de memória). O elo com o comportamento de jogo problemático em mecânicas de recompensa aleatória repetível está na literatura de *loot boxes* (≈, Zendle & Cairns 2018/2019, *PLoS ONE*, correlação, não causa; de memória, marcar como não verificado). O registro já tem a resposta de desenho: "Aventura determinística por dia" (só é saudável se o ATO for previsível e o RESULTADO surpreendente; re-sortear ao reabrir é caça-níquel) e "Recompensa variável com TETO, nunca à venda" (varia em sabor, não em se existe).

### O que separa "sabor variável" de caça-níquel

Cinco critérios, todos verificáveis no desenho:
1. **O ato não custa nada e o resultado não depende de quanto se repete.** Aqui é ok (não há custo, e sem custo é justamente por isso que a repetição precisa de teto).
2. **Sem re-sorteio.** O achado de uma escavação é função de `seed` (dia + índice da escavação), nunca de `Math.random` no clique. Reabrir ou recomeçar a mesma escavação devolve o mesmo.
3. **Teto de puxadas.** O registro chama isto de TETO. O precedente no repositório é o Glitchtama 1/dia (Masmorra). Não invento número: a recomendação é **uma por dia** como valor de partida, e o número final é do dono.
4. **Sem sinais de máquina.** Nada de suspense escalonado por raridade, quase-acerto ("quase achou raro"), som ou animação de "pagamento" maior para raro, contador de sequência de escavações.
5. **Sem "pular espera".** Nenhum atalho pago ou por Bits para escavar de novo.

### Bits sem teto vira farm? O que muda se pagar só lore?

Bits: o teto **existe** (`MINIGAME_BITS_PER_DAY = 150`, funil `handleEarnGamePoints`), então o farm em sentido econômico está contido, **se** a Escavação passar por ele. Não verifiquei se o funil cobre um minijogo que "sempre resulta" (ver "não verifiquei"). O risco psicológico, porém, não é o farm: é a combinação "sempre paga + repetível + variável". Só lore muda isso porque: (i) elimina o incentivo material de repetir, (ii) o lore é finito e o esgotamento é limpo (o sorteio repete cena, como `rollAdventure` já faz, em vez de tela vazia), (iii) é coerente com o registro "Aventura: só narrativa, sem recompensa material". Pagar Bits reabre a decisão de 08/09 sem dado novo (ver Achado transversal). Decoração rara é cosmético (permitido pelos filtros), mas é um raro sorteado e repetível: a forma mais próxima de *loot box gratuita* do briefing. Fora do v1.

### Conflito com a decisão registrada "Aventura: só narrativa"

A Escavação só-lore **não conflita**. A Escavação com Bits/decoração **conflita** e a pergunta "o que mudou desde que X perdeu?" fica sem resposta desta lente. Não é meu papel decidir; o dono decide, mas deve registrar a resposta.

### Condições da Escavação

- **R-15 (bloqueante, VETO ao sorteio livre).** O resultado de uma escavação é determinístico por `seed` (dia + índice); há teto diário de escavações (uma por dia como partida). Aceite: teste que a função de resultado é pura e que a mesma seed devolve o mesmo fragmento, e que uma segunda chamada acima do teto devolve o mesmo resultado sem novo sorteio. Toca: `REGISTRO-DE-DECISOES.md` linhas "Aventura determinística por dia" e "Recompensa variável com TETO"; proibição #16.
- **R-16 (AJUSTE OBRIGATÓRIO).** Sem Bits e sem decoração no v1; só fragmentos de lore. Aceite: o tipo do resultado não tem campo de recompensa (mesmo teste do catálogo da Aventura). Se o dono decidir o contrário, tem que passar por `MINIGAME_BITS_PER_DAY` e ser registrado com resposta a "o que mudou".
- **R-17 (AJUSTE OBRIGATÓRIO, sem falha real).** "Sem falha" precisa ser literal: nenhum estado de erro, tempo esgotado, "você não achou nada" ou tela de resultado vazia. Toda escavação termina com um cartão. Aceite: teste de que todas as saídas do `GameKit` na Escavação levam a resultado não vazio.
- **R-18 (AJUSTE OBRIGATÓRIO, sem sinais de máquina).** Sem suspense escalonado por raridade, sem quase-acerto e sem streak de escavações, sem mostrar "raro". Aceite: revisão de design do canvas contra os cinco critérios acima.
- **R-19 (AJUSTE OBRIGATÓRIO, lore sem lacuna de era).** As seis eras da §8 são uma lista finita e conhecida (A Sobra, O Solo, O Assentamento, A Vigília, A Abertura, Agora). Se os fragmentos são exibidos por era com marcação de quais já vieram, é uma coleção de 6 com lacuna visível. Os fragmentos entram no mesmo diário sem agrupar por era e sem indicador de completude. Toca: R-10; L4.
- **R-20 (SUGESTÃO).** "1 toque" repetido por 30–60 s é mecânica de *clicker*; oferecer pausar/sair sem penalidade e sem perder o resultado, para não ser hostil a quem perde a atenção no meio (TDAH).
- **R-21 (AJUSTE OBRIGATÓRIO, brincar nunca é condição).** A Escavação não é condição de dia completo, HP, evolução nem `perfectDays` (`REGISTRO-DE-DECISOES.md` §5.6). Aceite: `computeDailyReset` não lê estado da Escavação.

**Vulneráveis.** Transtorno de compulsão por jogo: o risco central é o esquema de razão variável repetível (R-15, R-18). TDAH: bom (curto, sem falha), desde que R-20. Ansiedade: bom sem contador nem tempo cobrando. Depressão: sem falha é a melhor propriedade da ideia. Perfeccionismo: R-19. Menores: a Escavação não vende nada, o que é o piso; o teto diário é também proteção (ECA Digital, Lei 15.211/2025, citada no registro; não a li).

---

## Respostas recomendadas às perguntas 1–5 (as que tocam este papel)

1. **Exceção ao congelamento da Camada 3.** Desta lente, não há razão psicológica para bloquear **a versão emendada** (sem fila, sem push, sem Bits, sem silhueta), porque ela não adiciona pressão. A decisão de abrir a exceção é do dono e do custo de oportunidade (fora do meu escopo). Se abrir, que seja **só a versão emendada**, e não o desenho original do briefing. *Gatilho de revisão:* 10 usuários × 14 dias de dado (o gatilho do próprio congelamento); antes disso qualquer efeito é hipótese.
2. **O pet sai da Home?** **Não.** Pet presente e cuidável; o passeio se sinaliza fora do palco (na folha do Passeio ou por um pequeno marcador diegético), sem palco vazio (R-7). *Gatilho:* se houver dado de que o palco vazio não gera abertura sem conclusão nem opt-out, reavaliar; hoje é risco sem medição.
3. **Achados rendem decoração rara, ou só lore e Bits?** **Só lore** (R-3, R-16). *Gatilho:* a Aposta 9 do registro (abertura do relatório noturno estável em 90 dias). Se a abertura cair depois de o catálogo ser visto, a primeira resposta é **conteúdo novo** (mais cenas), não recompensa material, e não se reabre a decisão de 08/09 por causa de saturação sem medir antes os guarda-corpos.
4. **Diário de Campo no `weeklyReport`?** **Fora** (R-14). Se o dono quiser algo, uma frase de cartão citada sem número. *Gatilho:* só se o `weeklyReport` ganhar antes um critério de "descrição pura" verificável em teste; hoje o `dreams` já é uma contagem no relatório e não deve servir de precedente para outra.
5. **A Escavação paga Bits (com teto) ou só lore?** **Só lore no v1** (R-16). Se pagar, passa por `MINIGAME_BITS_PER_DAY` e registra a resposta a "o que mudou desde que X perdeu". *Gatilho:* mesmo da 3.

## Resumo

| ideia | veredito | condição bloqueante |
|---|---|---|
| Passeio | **APROVADO COM RESSALVA** (VETO a fila/acúmulo contável, a push de retorno e a Bits sem reabrir a decisão de 08/09) | R-1 (sem fila, contagem ou badge de achados acumulados) e R-2 (sem push de nenhum tipo, com contrato de teste análogo a `guild.semPush.contract.test.js`) |
| Diário de Campo | **APROVADO COM RESSALVA** | R-10 (sem silhueta, slot vazio, contagem ou percentual; regras do `AdventureDiary`, não as do Bestiário) |
| Escavação | **APROVADO COM RESSALVA** (VETO a sorteio livre repetível e a pagar Bits/decoração) | R-15 (resultado determinístico por `seed`, teto diário, sem re-sorteio) |

## O que NÃO consegui verificar

- **Fontes verificadas por busca:** Zagal, Björk & Lewis, FDG 2013 (*playing by appointment* como um dos padrões); Oulasvirta et al., *Personal and Ubiquitous Computing* 16(1), 2012 (checking habits). A aventura de 8 horas do Finch vem de resumos de busca (Retention.blog e agregadores), não de fonte primária do app; tratar como indício.
- **Marcadas (≈), de memória, não verificadas:** Ferster & Skinner 1957 (esquemas de reforço); Zendle & Cairns (*loot boxes* e comportamento de jogo problemático); Dixon et al. 2010 (*losses disguised as wins*); Nunes & Drèze 2006 (progresso dotado); a tradição Zeigarnik (com replicação irregular). Nenhuma delas é evidência sobre público com TDAH, ansiedade ou depressão em app de hábitos.
- Não li a `docs/PLANO-TAREFAS.md` diretamente (a busca de "pendências" ali não devolveu linha); a regra "painel de pendências é o Habitica" está citada aqui a partir do comentário do `AdventureDiary.tsx`.
- Não verifiquei se o funil `handleEarnGamePoints` e `minigameBitsToday` cobrem um minijogo sem falha, nem se o Passeio (que roda com o app fechado) poderia sequer passar por ele. Não li o `GameKit` nem `SPIRIT_BG_SCENES`.
- Não medi o dreno do cocô nem a lista de ações de cuidado durante um Passeio (a R-7 é raciocínio de design, sem teste executado).
- Não há telemetria: qualquer previsão de "aberturas sem conclusão", opt-out ou abandono é hipótese. Não fiz diagnóstico nem avaliei ninguém.
