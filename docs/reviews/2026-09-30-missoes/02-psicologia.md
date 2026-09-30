# Parecer: psicologia comportamental, Missões de Expedição

Revisor: `soulmon-behavioral-psychologist` (tem poder de veto)
Data: 30/09/2026
Escopo: `docs/PROPOSTA-MISSOES-EXPLORACAO.md` (regras M1..M12, §3 "como aparece", §4 exemplos, §5 descartes), lido contra risco de cobrança, ausência, FOMO, perfeccionismo, TDAH, ansiedade, depressão e compulsão. Também avalio se "levantar a barra" tem base na literatura. Base lida: `docs/reviews/2026-09-30-exploracao/02-psicologia.md` (formato e condições R-1..R-21 da Exploração, que continuam valendo), `docs/plano-melhorias/ledger/vetos.md` (21 proibições e as seis perguntas), `docs/NARRATIVA-E-UNIVERSO.md` (L1..L12), `docs/PLANO-CATALOGO-ATIVIDADES.md` §4 e §6 (subir de nível; linha vermelha do catálogo), `src/utils/adventure.ts` (quatro regras da Aventura), `src/utils/weeklyMissions.ts` (pool determinístico, sem contagem de tarefas).

> **Declaração de limite.** Este parecer não faz diagnóstico e o Soulmon não é tratamento. O que aparece como "efeito esperado" é previsão de design, não medição. Ninguém usou o app em produção e não há telemetria. Quase toda a literatura citada vem de adultos saudáveis, de ambientes de trabalho, de laboratório ou de casais. Nenhuma fonte testou "desafio de vida real que abre região de mapa num v-pet". Onde a evidência é de outro contexto, eu digo. Não decido regra: recomendo, e o dono decide.

Legenda: **VETO** bloqueia a exposição ao jogador até ser corrigido. **AJUSTE OBRIGATÓRIO** entra antes de qualquer implementação. **SUGESTÃO** é opcional. Fontes: **✔** = conferida por busca web nesta sessão; **(≈)** = de memória, sem conferência.

---

## 0. Síntese

**Veredito geral: APROVADO COM RESSALVA.** A proposta já nasce com as defesas certas (opt-in, sem prazo, sem push, sem contagem, recompensa só no mapa, versão pequena, filtro do catálogo), e a maioria das regras M passa como está. Os riscos que sobram não estão nas regras escritas. Estão em quatro lacunas que a proposta não fecha:

1. **Não há cadência.** Auto-declaração (M3) sem nenhum teto de ritmo transforma o mapa num *clicker*: dá para tocar "Fiz" dez vezes seguidas e abrir o mapa inteiro numa noite. Aí o mapa perde o valor para quem joga honesto e vira farra compulsiva para quem não joga (R-1).
2. **Não está escrito que o Passeio continua sem Expedição.** Se o pet só "sai" quando a pessoa cumpre um desafio, a ausência de desafio vira pet parado em casa. Isso é punição por omissão, e cai exatamente em quem está num período ruim (R-2, **VETO preventivo**).
3. **"Levantar a barra" por distância no mapa tem base fraca como *dificuldade* e base boa como *novidade*.** A literatura sustenta "fazer algo novo e pequeno" (self-expansion, ativação comportamental) muito melhor do que "desafios cada vez maiores" (a literatura de stretch goals é, sobretudo, de riscos) (§1, R-3).
4. **O conteúdo dos desafios tem riscos que o filtro do catálogo (M9) não cobre:** exposição social, segurança física, acessibilidade e "retomar contato" com a pessoa errada (R-5).

Nenhuma das 21 proibições é cruzada pela forma escrita. #19 (querer a notificação), #16 (contagem) e #15 (FOMO que tira) ficam a um passo de serem cruzadas na implementação, e as condições abaixo existem para esse passo.

---

## 1. "Levantar a barra" tem base?

**Resposta curta: parcialmente, e não no sentido em que a frase costuma ser lida.** A evidência sustenta *ir além do cotidiano* (novidade, amplitude, um ato fora da rotina). Ela **não** sustenta *metas progressivamente mais difíceis* para um público não selecionado num app de bem-estar. A proposta está quase certa porque M8 ("a versão pequena conta igual") já neutraliza boa parte da escalada. Proponho levar isso até o fim: **a barra sobe em amplitude, não em tamanho.**

| Base | O que diz | Aplicação ao Soulmon | Fonte |
|---|---|---|---|
| **Goal-setting** (Locke & Latham 2002, *American Psychologist* 57(9), "A 35-year odyssey") | Metas específicas e difíceis superam o "faça o seu melhor", **desde que** haja compromisso, capacidade e ausência de metas em conflito. A relação dificuldade→desempenho é linear só dentro dessas condições. | Sustenta *especificidade* (um ato concreto, "cozinhar uma receita que nunca fez", já é específico). **Não** sustenta dificuldade para quem está sem capacidade naquele período, que é justamente quem mais importa aqui. A pesquisa é de desempenho em tarefa, em trabalho e laboratório, e não de bem-estar. | ✔ |
| **Stretch goals** (Sitkin et al. 2011, *AMR* 36(3), "The paradox of stretch goals") | Metas "aparentemente impossíveis" são **mais sedutoras justamente para quem menos pode arcar com o risco delas**. Quem ganha com elas é quem tem folga (recursos e desempenho recente bom). | O análogo individual é direto: a região distante com o desafio grande atrai mais quem está querendo "virar a mesa" num período ruim, e é essa pessoa que mais se machuca com a falha. Isto é argumento **contra** a escalada obrigatória e **a favor** de M8. | ✔ (o análogo individual é inferência minha) |
| **Goals gone wild** (Ordóñez, Schweitzer, Galinsky & Bazerman 2009, *Academy of Management Perspectives* 23(1)) | Efeitos colaterais sistemáticos das metas: foco estreito, risco distorcido, **queda de motivação intrínseca**, aprendizado inibido. A meta é "medicamento de receita, com dose e supervisão". | Duas pontes: (i) desafio em que "maior abre mais" empurra para risco físico ou social (R-5); (ii) meta com recompensa corrói o motivo próprio (ver SDT abaixo). | ✔ |
| **Implementation intentions** (Gollwitzer & Sheeran 2006, *Adv. Exp. Soc. Psychol.* 38; 94 testes, d = 0,65) | Planos "se-então" (quando, onde, como) aumentam de forma robusta a chance de **começar**. | É a peça que falta à proposta: a Expedição ajuda a pessoa a escolher, mas não a começar. Um campo **opcional** "quando/onde" tem boa base. Ressalva: não pode virar prazo nem estado de "atrasado" (R-7). | ✔ |
| **Contraste mental + intenções (MCII/WOOP)** (Wang, Wang & Gai 2021, *Frontiers in Psychology*; 21 estudos, g = 0,336) | Efeito pequeno a médio. É mais forte com interação humana (0,465) do que com documento (0,277). | Efeito de app (documento) é o menor. Não vale adicionar a etapa de "obstáculo" obrigatória: o custo de atrito é certo e o ganho é pequeno. Fica como opcional, no máximo. | ✔ |
| **Self-expansion / novidade** (Aron et al. 2000, *JPSP* 78(2)) | Atividades **novas e estimulantes** feitas junto aumentaram a satisfação no relacionamento em relação a atividades só agradáveis (intervenção de 10 semanas e experimentos de laboratório). | É a melhor base para a ideia: o que conta é o **novo**, não o **difícil**. Ressalva forte: é pesquisa de **casais**, e a transferência para o indivíduo sozinho é extrapolação. Na tese, "o pet vai aonde você foi" é uma expansão compartilhada com a criatura, o que é o mais perto que dá. | ✔ (a transferência é minha) |
| **Ativação comportamental** (Cuijpers et al. 2007: 16 estudos, g ≈ 0,87 contra controle; Ekers et al. 2014, *PLoS ONE*: 26 ECRs, SMD −0,74) | Programar atividades de prazer e de domínio melhora a depressão, com efeito comparável ao da terapia cognitiva. | Sustenta que atos pequenos, concretos e escolhidos fazem bem, **e é o argumento mais forte para M8**. Não autoriza o app a se apresentar como BA: BA é tratamento, feito com terapeuta, com monitoramento de humor. O Soulmon não é isso (L8, L9, linha vermelha do catálogo). | ✔ |
| **SDT / overjustification** (Deci, Koestner & Ryan 1999, *Psychological Bulletin* 125; 128 experimentos) | Recompensas **tangíveis e esperadas**, contingentes à conclusão (−0,36) ou ao desempenho (−0,28), reduzem a motivação intrínseca de livre escolha. | Ver §2: a recompensa da proposta é **esperada e contingente à conclusão**. Só não é tangível. | ✔ |
| **Lepper, Greene & Nisbett 1973** (*JPSP* 28(1)) | Crianças que já gostavam de desenhar e foram **prometidas** um certificado simbólico ("Good Player Award") desenharam menos depois. Sem promessa, não caiu. | Achado central para esta proposta: **o prêmio era simbólico, não dinheiro, e ainda assim corroeu**. "Só lore e postal" não é imune por ser simbólico. O que protege é o prêmio não ser apresentado como *pagamento pelo ato*. | ✔ |
| **Desengajamento de metas** (Wrosch, Scheier, Miller, Schulz & Carver 2003, *PSPB*) | Saber abandonar meta inalcançável **e** se reengajar em outra se associa a mais bem-estar. | É a base de M2 ("deixar pra lá" sem custo) e de "trocar": largar e pegar outra é adaptativo, não fracasso. A copy tem de tratar assim. | ✔ |
| **Aversão à espera no TDAH** (linha de Sonuga-Barke; meta-análise de Marx et al. 2021, *J. Atten. Disord.*) | Preferência por recompensa imediata e afeto negativo na espera. | Recompensa na mesma noite (o pet vai à região) é bom para TDAH. Recompensa adiada ou condicionada a sequência é ruim. | ✔ |
| Teoria da avaliação cognitiva: recompensa **inesperada** não corrói, e feedback informacional pode aumentar a motivação intrínseca | parte do mesmo corpo de Deci & Ryan | Base do desenho de R-4 | (≈) |
| Recompensas em tarefas **inicialmente desinteressantes** não corroem da mesma forma | idem | Atenua o risco para desafios que a pessoa ainda não fazia | (≈) |
| Aumento do perfeccionismo em coortes jovens (Curran & Hill 2019, *Psychological Bulletin*) | — | Contexto para o risco de perfeccionismo (§3) | (≈) |

**Conclusão do §1.** A frase do dono ("estimular a ir além do cotidiano") tem base. A tradução "regiões mais distantes propõem desafios maiores" é a parte fraca. A proposta de desenho:
- **a distância no mapa muda o *tipo* de novidade (outro território da vida), não o *tamanho* exigido;**
- toda região oferece o leque inteiro, do pequeno ao pleno;
- quem "levanta a barra" é a pessoa, escolhendo o pleno quando pode.

Isso preserva o convite ao "mais" (Locke: meta escolhida e aceita) sem instalar a escalada que Sitkin mostra ser mais sedutora para quem menos pode.

---

## 2. Overjustification: o risco real e como desarmá-lo

A proposta paga **um prêmio esperado** (a região) **contingente à conclusão** de um ato (o "Fiz"). Pelo Deci 1999 e pelo Lepper 1973, é a configuração que corrói, mesmo com prêmio simbólico. Três fatores atenuam o risco aqui:
1. os desafios são, por desenho, coisas que a pessoa **ainda não fazia**, e a corrosão é mais forte sobre o que já era interessante (≈);
2. o ato é **escolhido** entre três ou nenhum, e a autonomia é o antídoto central da SDT;
3. o prêmio é **informacional** se for apresentado como consequência narrativa ("ele foi ver também") e não como pagamento ("você ganhou uma região").

O risco concentrado está em dois pontos:
- **Área Social.** "Escrever para alguém" com prêmio transforma um gesto relacional em meio para abrir mapa. É o caso clássico de instrumentalizar algo que tinha valor próprio. Não é para retirar o desafio. É para que **a copy e o prêmio não o tratem como transação** (R-4).
- **Área Hábito.** "Faça uma vez o próximo nível" é um hábito que a pessoa **já faz** por valor próprio, o que corresponde exatamente ao grupo experimental do Lepper. Aqui o prêmio esperado tem mais chance de corroer. Recomendo manter (M12 já impede que ele troque o nível), mas **sem destaque especial** e sem ser a única opção da região.

A reflexão escrita opcional (§5.1) é a principal alavanca de internalização: ela desloca o valor do "abri a região" para o "eu fiz isso e foi assim".

---

## 3. Riscos por público

| Público | Risco concreto nesta proposta | Mitigação |
|---|---|---|
| **TDAH** | (a) Esquecer a Expedição ativa por semanas é neutro por desenho (M2), **desde que** nada mostre "há N dias". (b) A novidade motiva, mas tende a gerar *binge*: abrir 6 regiões numa noite de hiperfoco e depois nunca mais. (c) Dificuldade de **iniciar** (o cerne da procrastinação): a proposta registra que a pessoa terminou, mas não a ajuda a começar. | R-1 (cadência), R-7 (intenção de implementação opcional), R-9 (linha ativa sem idade). A versão pequena é a melhor ferramenta de iniciação que a proposta já tem. |
| **Ansiedade** | (a) Desafios de **avaliação social** ("mostrar para alguém", "escrever para alguém") são exposição. Sem profissional, isso é exatamente o que M9 veta, e a proposta não percebeu que os exemplos cruzam a linha. (b) Uma Expedição ativa aceita vira um compromisso aberto que pesa (efeito de meta não concluída, (≈)). | R-5 (todo trio tem opção solitária; nada de exposição social como opção única), R-6 (deixar pra lá sem confirmação culpada). |
| **Depressão** | (a) Num período ruim, o mapa parado é um espelho do "não consigo". (b) Se o Passeio só sai com Expedição, o pet fica em casa, e isso lê como abandono ou castigo. (c) A região distante com desafio grande atrai quem quer "virar a mesa" (Sitkin), e a falha pesa mais. | R-2 (VETO preventivo: Passeio independente), R-3 (amplitude, não tamanho), M8 (versão pequena conta igual, byte a byte), §5.4. |
| **Perfeccionismo / traços obsessivos** | (a) O mapa é uma coleção finita. Se o desenho mostra o total (regiões em névoa, mas contáveis), é a silhueta do Bestiário com outro nome (R-10 da Exploração). (b) O perfeccionista tende a **recusar a versão pequena** como "não vale", ou a sentir que abriu a região "de mentira". (c) Rótulos "plena/pequena" hierarquizam. | R-8 (mapa só até a fronteira, sem total), R-4 (prêmio idêntico), copy sem hierarquia (M8 ajustado). |
| **Compulsão / uso problemático** | Auto-declaração sem teto + prêmio sempre garantido + novidade a cada toque formam um laço rápido de "toca, abre, toca, abre". Não há razão variável (o prêmio é certo), o que é bom, mas há **taxa ilimitada**. | R-1. O teto é de ritmo, **não** um prazo: nada expira. |
| **Menores** | "Ir a um lugar onde nunca foi", "trilha" e "falar com alguém" têm implicação de segurança para crianças. | R-5 (filtro de segurança). Levar ao `soulmon-ip-brand-guardian` e à decisão sobre faixa etária (ECA Digital, citado no registro; não li). |

---

## 4. Veredito por regra

| # | Veredito | Condição / motivo |
|---|---|---|
| **M1** Opt-in, 3 determinísticos por região | **APROVADO COM AJUSTE OBRIGATÓRIO** | Determinismo certo (mesma razão do `weeklyMissionsFor` e da regra 3 do `adventure.ts`: lista que muda ensina a reabrir). **Ajuste:** "Trocar" escolhe **dentro dos mesmos 3**, e nunca sorteia um desafio novo. Se "trocar" puxar do pool, vira re-sorteio, isto é, caça-níquel de desafio fácil. E cada trio segue R-5 (uma opção solitária, em casa e sem custo). |
| **M2** Uma ativa, sem prazo, sem expirar, trocar grátis | **APROVADO** | Base: Wrosch 2003 ✔ (largar e se reengajar é adaptativo). Ver R-6 e R-9 para a copy. |
| **M3** Auto-declaração | **APROVADO COM AJUSTE OBRIGATÓRIO** | Confiar é o certo: prova por foto ou GPS é vigilância (#18) e trata a pessoa como suspeita. **Mas** auto-declaração sem ritmo é o *clicker* (R-1). Reflexão escrita: **opcional**, ver §5.1. |
| **M4** Recompensa só no mapa | **APROVADO COM AJUSTE OBRIGATÓRIO** | A lista do que **não** paga deve incluir explicitamente **Emblemas, XP de Vínculo, comida, energia e atributos**. O precedente `weeklyMissions.ts` paga Emblemas e XP de Vínculo, e um implementador vai copiar. E o prêmio precisa ser apresentado como consequência narrativa, não como pagamento (R-4). |
| **M5** Nenhum desafio é quantidade | **APROVADO** | Protege #16. Estender o teste que varre o pool semanal ao pool de Expedições (dígito + substantivo de tarefa). |
| **M6** Nunca condição; fora de `dailyGoalFor` | **APROVADO** | Ver §5.2: recomendação firme de ficar **fora** da meta do dia. |
| **M7** Sem push, badge, widget; o pet não pergunta | **APROVADO COM AJUSTE OBRIGATÓRIO** | Estender a **overlay desktop, relatório diário, `weeklyReport` e contexto do chat de IA** (`functions/api/chat.js`). Se o LLM receber "expedição ativa: X", ele vai perguntar "e aí, cozinhou?", e isso é a cobrança da L2 e da #19 pela porta dos fundos. Aceite: contrato análogo a `guild.semPush.contract.test.js` + o prompt do chat não recebe estado de Expedição. |
| **M8** Toda região tem versão pequena que conta igual | **APROVADO COM AJUSTE OBRIGATÓRIO** | É a regra mais importante da proposta (base: ativação comportamental ✔, Sitkin ✔). **Ajuste:** "conta igual" tem de ser **byte a byte**: mesma região, mesmo postal, mesmo lore, mesma cena do pet. Nenhum selo, cor ou estrela para o "pleno" (R-4). Copy sem hierarquia de "de verdade" e "de consolo". |
| **M9** Filtro do catálogo | **APROVADO COM AJUSTE OBRIGATÓRIO** | Insuficiente. O filtro do catálogo foi escrito para hábitos, não para atos únicos fora de casa. Acrescentar: segurança física, acessibilidade, avaliação social, álcool e noite, e "retomar contato" (R-5). |
| **M10** Sem percentual nem "faltam N"; névoa | **APROVADO COM AJUSTE OBRIGATÓRIO** | Névoa **sem número** ainda é contável se o mapa inteiro estiver desenhado. Mostrar só as abertas + a fronteira (R-8). |
| **M11** Nasce muda; EN primeiro; L1..L12 | **APROVADO COM AJUSTE OBRIGATÓRIO** | Acrescentar os vetos específicos de L11 e L12: o pet **pode** ir aonde a pessoa foi ("ele foi ver também"), e **não pode** sentir por causa disso ("ele ficou orgulhoso", "ele estava esperando você cumprir"). Nomear o ato, nunca a pessoa (L12): proibido "você foi corajoso". |
| **M12** Não duplica subir de nível nem assombrada | **APROVADO** | Ressalva do §2: o desafio "Hábito" é o de maior risco de overjustification. Nunca deve ser a opção destacada. |

---

## 5. As quatro perguntas específicas

### 5.1 Auto-declaração vs. reflexão escrita

**Recomendação: "Fiz" basta. Depois do "Fiz", um convite opcional de uma linha, pulável com o mesmo peso visual, e nunca obrigatório.**

- **Contra a reflexão obrigatória:** para TDAH e depressão, escrever é uma barreira de ativação a mais, bem na hora em que a pessoa acabou de fazer algo difícil. Uma "prova escrita" também converte o gesto em prestação de contas, e o tom deixa de ser "eu fiz" para virar "eu preciso justificar". Transformar a declaração em redação é o mesmo erro de desenho da prova por foto, só que mais gentil.
- **A favor de oferecer:** é a principal alavanca de internalização contra a overjustification (§2). Ela desloca o valor do mapa para a experiência ("o que você notou?") e dá ao diário uma linha que é **da pessoa**, não do jogo. A SDT chama isso de integração (≈).
- **Travas (R-10):** o texto nunca vai a IA ou telemetria (#18); não se pontua nem se analisa; não existe "reflexões escritas: N"; o convite não reaparece para quem pulou 2 vezes seguidas (não insistir); e a pergunta é aberta sobre o ato ("Como foi?"), nunca sobre a pessoa ("O que isso diz sobre você?", L1).

### 5.2 A missão entra na meta do dia?

**Não, em nenhuma das duas direções.** (Resposta recomendada para MIS-3.)
- **Somar ao "feito"** faz a Expedição proteger coração e contar para o dia completo. Aí ela vira ferramenta de economia ("faço a expedição pequena para não perder coração"), a auto-declaração vira a forma mais barata de burlar a meta, e a região deixa de ser o prêmio.
- **Somar à "meta"** transforma um convite opt-in num requisito do dia, e a Expedição vira mais uma coisa cobrada. Contradiz M1 e M6 e a §5.6 ("brincar nunca é condição").
- **O que resta para quem fez algo grande e "o dia não registrou":** o reconhecimento vem pela narrativa. O pet sai em Passeio para a região naquela noite, e a Aventura da noite conta a cena de lá. É o eco do ato que a L12 permite, sem que ele vire número.
- Se o dono quiser que a Expedição apareça no relatório do dia, que seja uma **frase**, sem dígito, e só no dia em que houve "Fiz". Nunca "0 expedições" nos outros dias.

### 5.3 Escala de dificuldade

**Amplitude em vez de altura** (§1):
- **cada região** oferece o leque completo: uma opção pequena (≤ 5–10 min, em casa, sem gasto), uma média e uma plena;
- **a distância** muda o *território* da novidade (lugares → sabores → pessoas → mãos → ideias), não o tamanho mínimo exigido;
- **nunca** uma região que só tem opções grandes. Se houver, M8 é violada por design;
- não existe "você está pronto para desafios maiores", nem ajuste automático da dificuldade pelo histórico. Ajustar pelo desempenho seria o sistema lendo estado e emitindo veredito, que a proposta já descartou em §5 ("desafio atribuído com base em humor/HP");
- se o dono quiser mesmo uma progressão vertical, que ela seja da **proposta máxima** (a opção plena de regiões distantes pode ser mais ambiciosa), mantendo **o piso igual em todas**. É a menor concessão compatível com Sitkin.

### 5.4 Quando a pessoa está num período ruim

O produto **não pode saber** que a pessoa está num período ruim, e não deve tentar: humor nunca vira insumo (#2), e inferir estado pelo uso é a leitura-veredito que o §5 da proposta já descartou. O desenho tem de ser bom **para quem está mal sem saber quem está mal**:
1. **O Passeio e a Aventura da noite continuam todos os dias nas regiões já abertas, com ou sem Expedição** (R-2). O mapa só deixa de crescer. Nada encolhe, nada para.
2. A Expedição ativa **fica ali, sem idade** (R-9): não há "há 23 dias" nem mudança de cor. Voltar a ela um mês depois é idêntico a voltar no dia seguinte.
3. **Não ter Expedição é um estado normal**, desenhado como tal: nada de "Escolha uma expedição!" nem espaço vazio pedindo preenchimento. A folha do Passeio é completa sem ela.
4. **Deixar pra lá** é um toque, sem "tem certeza?" e sem "você desistiu". Copy de devolução ("volta para a região, quando quiser"), com base em Wrosch ✔.
5. A **versão pequena** existe em toda região e é o caminho de retorno. Nenhuma copy a chama de "versão para dias ruins", porque isso seria diagnóstico (L9).
6. **Interruptor para esconder as Expedições** nas Configurações (SUGESTÃO, R-11). Opt-in por desafio não substitui poder desligar a camada inteira. Para quem está mal, até um convite visível pode pesar.
7. O pet **nunca** menciona a Expedição, inclusive no chat de IA (M7 ajustada).

---

## 6. Condições

- **R-1 (AJUSTE OBRIGATÓRIO, bloqueante: cadência).** No máximo **uma região aberta por dia do jogador** (`playerDayKey`). O "Fiz" pode ser tocado a qualquer hora e a região abre na Aventura daquela noite (o pet vai lá). Uma segunda Expedição declarada no mesmo dia fica **guardada** e abre na noite seguinte, sem expirar e sem fila visível com número. É teto de ritmo, não prazo: nada se perde (#15). Aceite: teste de que N declarações no mesmo `dayKey` abrem ≤ 1 região e que a declaração excedente nunca some. *Por quê:* auto-declaração + prêmio certo + taxa ilimitada = clicker e binge (TDAH, compulsão), e o mapa perde valor para todos.
- **R-2 (VETO preventivo: o Passeio não depende de Expedição).** O Passeio e a Aventura da noite rodam todos os dias nas regiões já abertas, independentemente de haver Expedição ativa ou cumprida. A Expedição **só acrescenta destino**, nunca é condição de o pet sair. Aceite: teste de que `adventureOfDay` (ou o sucessor) devolve achado com zero Expedições cumpridas e que o estado de Expedição não altera a existência do achado. *Toca:* regra 1 do `adventure.ts` ("nenhum dia volta de mãos vazias"), L3, R-6 da Exploração (o Passeio não lê desempenho). **Se a implementação fizer o pet ficar em casa por falta de Expedição, o veto vale.**
- **R-3 (AJUSTE OBRIGATÓRIO: amplitude, não altura).** Toda região contém uma opção ≤ 10 min, em casa e sem gasto. A distância muda o território, não o piso. Nenhum ajuste de dificuldade por histórico, HP, humor ou constância. Aceite: teste varrendo o catálogo de desafios, exigindo por região ≥ 1 item marcado `pequeno` + `emCasa` + `semCusto`.
- **R-4 (AJUSTE OBRIGATÓRIO: prêmio idêntico e não transacional).** Pequena, média e plena rendem **exatamente** o mesmo (mesma região, postal, lore, cena), sem selo, cor, estrela ou tratamento de "pleno". O tipo do desafio não tem campo que mude o prêmio. Copy como consequência ("ele foi ver também"), nunca pagamento ("você ganhou", "desbloqueou", "recompensa"). Aceite: o prêmio é função só da região; teste de que a variante escolhida não entra na função. *Base:* Lepper 1973 ✔, Deci 1999 ✔.
- **R-5 (AJUSTE OBRIGATÓRIO: filtro de conteúdo ampliado, além de M9).**
  - Toda região tem ≥ 1 opção **solitária** (sem outra pessoa envolvida).
  - Nenhum desafio exige: exposição social avaliativa como única opção (falar em público, com estranho); sair à noite; ir sozinho a trilha ou lugar isolado; álcool; gasto de dinheiro; esforço físico que exclua pessoa com deficiência sem alternativa equivalente na mesma região.
  - O desafio "retomar contato" é redigido como "alguém de quem você sente falta", nunca "alguém com quem você não fala há meses", porque essa pode ser uma pessoa de quem a pessoa se afastou por proteção (ex-parceiro abusivo, familiar). A versão pequena nunca envolve contato.
  - Revisão pelo `catalogo-evidencia` e por este papel antes de publicar o pool.
- **R-6 (AJUSTE OBRIGATÓRIO: sair sem culpa).** "Deixar pra lá" e "Trocar" são um toque, sem modal de confirmação e sem verbos de fracasso ("desistir", "abandonar", "falhou"). *Base:* Wrosch 2003 ✔.
- **R-7 (SUGESTÃO, com trava obrigatória se adotada: intenção de implementação).** Campo opcional "quando / onde vou fazer" ao aceitar a Expedição (Gollwitzer & Sheeran ✔). **Trava:** o plano nunca gera estado de atrasado, cor, push, fala do pet ou "era para ontem". Passada a data, ele simplesmente deixa de ser exibido. É a ajuda para **começar** que o mandato deste papel pede e que a proposta ainda não tem.
- **R-8 (AJUSTE OBRIGATÓRIO: mapa sem total).** Só são desenhadas as regiões abertas e a **fronteira** (a próxima). Nenhuma geometria que permita contar o que falta. Sem "N regiões visitadas", nem aqui nem no `weeklyReport`, perfil, widget ou `publicProfile` (#21). O mapa, idealmente, **não tem fim declarado** (ver pergunta ao dono). *Toca:* R-10 da Exploração, #14, perfeccionismo.
- **R-9 (AJUSTE OBRIGATÓRIO: a Expedição ativa não envelhece).** A linha da Expedição ativa não mostra data de aceite, "há N dias", nem muda aparência com o tempo. *Toca:* L6, e o precedente `isHaunted` **não** se aplica: Expedição nunca assombra.
- **R-10 (AJUSTE OBRIGATÓRIO se houver reflexão).** Reflexão só opcional, pergunta sobre o ato, texto fora de IA e telemetria (#18), sem contagem, e o convite para de aparecer após 2 recusas seguidas.
- **R-11 (SUGESTÃO: desligar a camada).** Interruptor nas Configurações que esconde as Expedições. O Passeio continua (R-2).
- **R-12 (AJUSTE OBRIGATÓRIO: nada de sequência).** Sem streak de Expedições, sem "3 expedições seguidas", sem bônus por ritmo de Expedições. *Toca:* #1 (adjacente), #16.
- **R-13 (SUGESTÃO: guarda-corpo pós-lançamento).** Se entrar em produção, medir antes de qualquer "melhoria": aberturas/dia sem conclusão, taxa de "deixar pra lá", proporção pequena/plena e declarações por dia. Se a proporção de "plena" cair ao longo das semanas enquanto as declarações sobem, o mapa está sendo farmado, não vivido. Se "deixar pra lá" dominar, os desafios estão pesados demais.

---

## 7. Perguntas ao dono (propostas para `PERGUNTAS-DO-DONO.md`, seção MIS)

1. **MIS-1, exceção à Camada 3.** Desta lente não há objeção psicológica à **versão emendada** (R-1..R-12). Abrir a exceção é decisão de custo de oportunidade, fora do meu escopo. *Gatilho de revisão:* o mesmo do congelamento (10 usuários × 14 dias).
2. **Teto de ritmo (R-1).** Uma região por dia do jogador é aceitável? *Recomendação:* sim. A alternativa (sem teto) reabre o clicker.
3. **Mapa finito ou aberto?** Um fim declarado vira meta de completude (perfeccionismo). *Recomendação:* aberto, ou, se finito, sem que o fim seja visível antes de alcançado.
4. **Reflexão escrita opcional depois do "Fiz"?** *Recomendação:* sim, opcional e sob R-10.
5. **Desafios sociais no pool.** Manter "escrever para alguém" e "mostrar para alguém"? *Recomendação:* manter, com R-5 (nunca opção única, versão pequena sem contato, copy "de quem você sente falta").
6. **Escala vertical ou por amplitude (§5.3)?** *Recomendação:* amplitude. Se vertical, só o teto da opção plena sobe e o piso fica igual.
7. **Interruptor para esconder a camada (R-11)?** *Recomendação:* sim.
8. **Idade mínima / menores.** Desafios fora de casa com público infantil precisam de parecer do `soulmon-ip-brand-guardian`.

---

## 8. As seis perguntas do ledger, sobre a proposta

1. *Querer fazer a tarefa ou a notificação?* A tarefa: não há notificação (M7), desde que o chat de IA também fique cego (M7 ajustada).
2. *Tira algo?* Não, **desde que R-2**. Sem ela, a ausência de Expedição tira o Passeio.
3. *Mais um perdão?* Não. A contagem de D4 continua em oito: a Expedição não perdoa punição nenhuma, porque não toca em HP.
4. *Número que desce?* Não, se R-8 e R-9 valerem.
5. *Homem atrás da cortina?* Passa: "o mapa cresce quando você faz algo novo, do tamanho que quiser, e nada se perde" é dizível em voz alta. Falha se a versão pequena render menos às escondidas (R-4).
6. *Cabe na tese?* Cabe, e é das mais literais: o pet vai aonde a pessoa foi, que é **evoluir com**.

## 9. Onde este parecer diz "isto perdoa demais"

Em um ponto. **R-1 não pode virar "sem teto porque é opt-in".** Auto-declaração sem ritmo esvazia o próprio mapa: se tudo abre em uma noite, a região deixa de significar "eu fui lá", e a pessoa que declarou honestamente fica com o mesmo mapa de quem tocou dez vezes. O teto de ritmo protege o **sentido** do ato, não a economia. Na outra direção, M8 ("pequena conta igual") **não** perdoa demais: é o piso que torna a mecânica segura para quem mais precisa dela, e a ambição continua existindo como escolha.

## 10. O que NÃO consegui verificar

- **Conferidas por busca (✔):** Locke & Latham 2002; Sitkin et al. 2011; Ordóñez et al. 2009; Gollwitzer & Sheeran 2006 (d = 0,65, 94 testes); Wang, Wang & Gai 2021 (MCII, g = 0,336); Aron et al. 2000; Cuijpers et al. 2007 e Ekers et al. 2014; Deci, Koestner & Ryan 1999 (128 experimentos; −0,36 conclusão, −0,28 desempenho); Lepper, Greene & Nisbett 1973 (certificado simbólico); Wrosch et al. 2003; linha de aversão à espera no TDAH (Sonuga-Barke; Marx et al. 2021). Conferi os achados principais pelos resumos, não li os textos completos.
- **De memória (≈):** a exceção da teoria da avaliação cognitiva para recompensa inesperada e feedback informacional; a atenuação da corrosão em tarefas inicialmente desinteressantes; Curran & Hill 2019 (perfeccionismo); o efeito de meta não concluída pesando (tradição Zeigarnik, com replicação irregular).
- **Extrapolações declaradas:** Sitkin e Ordóñez são de organizações, e aplicá-los ao indivíduo é inferência minha. Aron é de casais. A ativação comportamental é de tratamento clínico com terapeuta, e o Soulmon não é isso. Nenhuma fonte estuda públicos com TDAH, ansiedade ou depressão num app deste tipo.
- Não li o texto de `PERGUNTAS-DO-DONO.md` sobre EXP-1/EXP-6, nem `BENCHMARK-EXPLORACAO.md`. Não verifiquei como o Passeio fundido à Aventura está implementado (se já existe código) para confirmar R-2 no código.
- Não há telemetria. Todo "efeito esperado" é hipótese de design.
