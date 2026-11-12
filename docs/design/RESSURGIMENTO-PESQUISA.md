# Caminho Ressurgimento: pesquisa de base (12/11/2026)

Escopo: cuidados básicos para quem está "saindo de um momento difícil". Linguagem não diagnóstica, sem culpa, sem promessa. O Soulmon não é dispositivo médico e não trata nada.
Vetos herdados (PLANO-CATALOGO-ATIVIDADES.md:139; REGISTRO-DE-DECISOES.md §16 decisão 4 e §16.1; review `docs/reviews/2026-09-28-catalogo-psicologia.md` V1-V3, A1-A6): sem dieta, jejum, caloria, peso, detox; sem meta de sono por duração; nada que pareça tratamento; itens de TCC (`mente-registro-pensamentos`, `mente-exposicao-leve`) ficam FORA do Ressurgimento (V1: nunca no starter set); em crise, o app só aponta CVV 188, nunca uma atividade.

Honestidade sobre a base: a evidência forte é para ativação comportamental (BA) como pacote e para atividade física. Para a maioria dos itens de autocuidado básico (unha, lixo, cama) NÃO há estudo direto: o racional é "atividade de rotina/domínio" dentro da BA. Está marcado como evidência indireta. Revisão final por psicólogo é obrigatória (seção 4).

Legenda de nível: A = meta-análise/RCT direto; B = estudo de coorte/RCT indireto ou extrapolação de população clínica para uso geral; C = racional teórico/prática clínica sem teste direto.

## 0. Fontes-âncora (verificadas nesta sessão salvo nota)

- Cuijpers P, van Straten A, Warmerdam L (2007). Behavioral activation treatments of depression: a meta-analysis. Clin Psychol Rev 27(3):318-326. doi:10.1016/j.cpr.2006.11.001 (não reverificado nesta sessão).
- Ekers D et al. (2014). Behavioural activation for depression; an update of meta-analysis of effectiveness and sub group analysis. PLoS One 9(6):e100100. doi:10.1371/journal.pone.0100100 (não reverificado).
- Richards DA et al. (2016). COBRA trial. Lancet 388:871-880. doi:10.1016/S0140-6736(16)31140-0: BA aplicada por profissionais de saúde sem formação em psicoterapia, não inferior a TCC (não reverificado).
- Martell CR, Dimidjian S, Herman-Dunn R (2010). Behavioral Activation for Depression: A Clinician's Guide. Guilford. Base do "agendar atividade, graduar tarefas, começar pequeno, agir antes da vontade" (livro, sem DOI).
- Dimidjian S et al. (2006). J Consult Clin Psychol 74(4):658-670. doi:10.1037/0022-006X.74.4.658 (não reverificado).
- Mazzucchelli T, Kane R, Rees C (2010). Behavioral activation interventions for well-being: a meta-analysis. J Posit Psychol 5(2):105-121. doi:10.1080/17439760903569154. 20 RCTs, g=0,52 em bem-estar, também em população não clínica. Justifica o uso fora de contexto clínico e a passagem ao caminho Satisfação.
- Pearce M et al. (2022). Association between physical activity and risk of depression: systematic review and meta-analysis. JAMA Psychiatry 79(6):550-559. doi:10.1001/jamapsychiatry.2022.0609. Curva dose-resposta: maior ganho nos volumes baixos (metade da recomendação já se associa a ~18% menos risco). Observacional.
- Coventry PA et al. (2021). Nature-based outdoor activities for mental and physical health. SSM Popul Health 16:100934. doi:10.1016/j.ssmph.2021.100934. 50 estudos; melhora de humor deprimido/ansiedade/afeto; 20-90 min; grupo tende a render mais.
- Burns AC et al. (2021). J Affect Disord, doi:10.1016/j.jad.2021.08.056 (UK Biobank, >400 mil): mais tempo ao ar livre de dia associado a menos sintomas depressivos e melhor sono. Observacional.
- Holt-Lunstad J, Smith TB, Layton JB (2010). Social relationships and mortality risk. PLoS Med 7(7):e1000316. doi:10.1371/journal.pmed.1000316 (não reverificado).
- Gollwitzer PM, Sheeran P (2006). Implementation intentions. Adv Exp Soc Psychol 38:69-119. doi:10.1016/S0065-2601(06)38002-1 (não reverificado).
- Lally P et al. (2010). How are habits formed. Eur J Soc Psychol 40:998-1009. doi:10.1002/ejsp.674: errar um dia não prejudica a formação do hábito (não reverificado).
- Weick KE (1984). Small wins. Am Psychol 39(1):40-49. doi:10.1037/0003-066X.39.1.40.
- Irish LA et al. (2015). The role of sleep hygiene in promoting public health. Sleep Med Rev 22:23-36. doi:10.1016/j.smrv.2014.10.001: higiene do sono isolada tem evidência fraca; por isso só "ritual de preparar o quarto", sem meta de horas (não reverificado).
- Saxbe DE, Repetti R (2010). No place like home: home tours correlate with daily patterns of mood and cortisol. Pers Soc Psychol Bull 36(1):71-81. doi:10.1177/0146167209352864 (ambiente "bagunçado" e humor em mulheres; correlacional; não reverificado).
- Armstrong LE et al. (2012). Mild dehydration affects mood in healthy young women. J Nutr 142(2):382-388. doi:10.3945/jn.111.155663 (n pequeno; não reverificado).
- Órgãos: CVV (cvv.org.br, 188, 24 h, gratuito, sigilo); SAMU 192; Ministério da Saúde, Guia de Atividade Física para a População Brasileira (2021) (caminhada leve, qualquer duração conta); OMS, Guidelines on physical activity and sedentary behaviour (2020): "qualquer atividade é melhor que nenhuma" (não reverificado o texto exato).
- Segurança de linguagem: OMS (2023), "Preventing suicide: a resource for media professionals"; Niederkrotenthaler T et al. (2010) Br J Psychiatry 197:234, efeito Werther/Papageno, doi:10.1192/bjp.bp.109.074633 (não reverificado). Plano de segurança: Stanley B, Brown GK (2012) Cogn Behav Pract 19:256-264, doi:10.1016/j.cbpra.2011.01.001.

## 1. Comportamentos-base (22)

Fonte do `id`: "existe" = já está em `src/data/activityCatalog.ts` (reusar, talvez com texto/versão mínima específica do caminho); "novo" = criar.
Frequência inicial é sugestão, nunca meta rígida. Versão mínima = a que conta como vitória.

| # | Comportamento | Freq. inicial | Versão mínima (2 min) | Justificativa / fonte | Ev. | Id |
|---|---|---|---|---|---|---|
| 1 | Beber um copo d'água | diário | 1 gole ao acordar ou ao ver a garrafa | Hidratação e humor: Armstrong 2012 (pequeno). Âncora simples (Gollwitzer 2006). Sem meta de litros. | C/B | existe `corpo-beber-agua` |
| 2 | Comer algo em horário "mais ou menos" regular | diário | uma coisa que você gosta, sentado | Regularidade de rotina é alvo central da BA (Martell 2010). SEM dieta, quantidade, qualidade, calorias. Texto: "comer alguma coisa". | C | novo `ressurg-comer-algo` |
| 3 | Abrir a janela / luz do dia | diário | ficar 2 min perto da janela ou na porta | Luz diurna e humor/sono: Burns 2021 (observacional). | B | novo `ressurg-luz-do-dia` |
| 4 | Sair ao ar livre 5-15 min (sol, rua, parque) | 2×/sem, subir a diário | ficar na porta/varanda 2 min | Coventry 2021; Burns 2021; atividade pequena já conta, Pearce 2022. | B | novo `ressurg-ar-livre` (relaciona `corpo-caminhar`) |
| 5 | Caminhada leve de 15 min | 2×/sem | andar até o fim da rua e voltar | Pearce 2022; Ministério da Saúde 2021; Coventry 2021 (verde). Ritmo livre. | A/B | existe `corpo-caminhar` (versão ressurgimento) |
| 6 | Tomar banho / lavar rosto | 3×/sem, subir | lavar rosto e mãos | Rotina básica (ADL) que cai quando se está mal; BA "rotinas" (Martell 2010). Sem juízo: "se hoje foi só o rosto, valeu". | C | novo `ressurg-banho` |
| 7 | Escovar os dentes | diário | uma vez, 30 s | Mesmo racional (#6). | C | novo `ressurg-dentes` |
| 8 | Trocar de roupa / vestir algo limpo | diário | trocar só uma peça | Mesmo racional; separar "dia" de "noite". | C | novo `ressurg-trocar-roupa` |
| 9 | Cuidar da aparência (unha, cabelo, barba) | 1×/sem | pentear o cabelo | Autocuidado como atividade de domínio/prazer (BA). Foco em cuidado, nunca em estética/peso. | C | novo `ressurg-aparencia` |
| 10 | Arrumar a cama | diário | puxar o lençol | Domínio/pequena vitória (Weick 1984). Sem evidência direta de efeito. | C | novo `ressurg-cama` |
| 11 | Louça / copo na pia | diário | levar 1 copo à pia | Ambiente: Saxbe 2010 (correlacional). | C/B | existe `casa-arrumar-10min` (versão 2 min) |
| 12 | Tirar o lixo | 2×/sem | juntar 1 saquinho | Idem #11. | C/B | novo `ressurg-lixo` |
| 13 | Uma arrumada de 5-10 min | 1×/sem | guardar 3 objetos | Idem #11; progressão natural de #10-#12. | C/B | existe `casa-arrumar-10min` |
| 14 | Preparar o quarto para a noite | diário | apagar uma luz ou fechar a cortina | Higiene do sono fraca isolada (Irish 2015), por isso sem meta de horas, sem "durma 8 h". | C | existe `sono-preparar-quarto` |
| 15 | Mandar uma mensagem a alguém | 2×/sem | mandar um emoji ou "oi" | Vínculo social: Holt-Lunstad 2010; barreiras à busca de ajuda: Gulliver 2010 (doi:10.1186/1471-244X-10-113, não reverificado). | B | existe `relacoes-mensagem` |
| 16 | Ficar um tempo com alguém (presencial ou ligação) | 1×/sem | ouvir a voz de alguém 2 min | Idem; Coventry 2021 (atividade em grupo tende a render mais). | B | existe `relacoes-tempo-com-alguem` |
| 17 | Dizer a alguém de confiança como você está (rede de apoio) | 1×/sem, opcional | "hoje foi pesado" por mensagem | Apoio social; Stanley & Brown 2012 (contatos de apoio como parte do plano de segurança). Sempre opcional, nunca contado como falha se pulado. | B | novo `ressurg-rede-apoio` |
| 18 | Uma coisa que você gostava de fazer | 2×/sem | 2 min de música ou de uma série | BA: atividade prazerosa agendada (Cuijpers 2007; Ekers 2014; Richards 2016). | A | existe `mente-ativacao-comportamental` |
| 19 | Respirar devagar 2 min | diário, opcional | 3 respirações | Autorregulação leve. Evidência para ansiedade geral é modesta; não prometer efeito. Balban 2023 (já citado no catálogo), não reverificado. | B | existe `mente-respiracao` |
| 20 | Gentileza consigo (uma frase) | 2×/sem | "hoje eu fiz o que dava" | Autocompaixão: MacBeth & Gumley 2012, doi:10.1016/j.cpr.2012.06.003 (não reverificado). | B | existe `mente-autocompaixao` |
| 21 | Alongar 2 min / levantar do sofá | diário | levantar e esticar os braços | Atividade leve: Pearce 2022 (curva: ganho maior nos volumes baixos). | B | existe `corpo-alongar` |
| 22 | Olhar o dia seguinte: 1 coisa só | diário | escolher 1 coisa para amanhã | Implementation intentions (Gollwitzer 2006); agendamento é núcleo da BA. | B | existe `proposito-planejar-dia` (versão 1 coisa) |

Fora (de propósito): metas de horas de sono, água em litros, qualquer item de TCC (V1), exercício intenso/força como entrada, qualquer coisa com peso/dieta, "gratidão" como entrada (pode soar a cobrança de positividade; deixar para Satisfação).

## 2. Ordem de introdução e passagem de caminho

Princípio: graduação de dificuldade (Martell 2010), começar pelo que exige menos energia, 1 comportamento por área do dia, adicionar quando houver folga. Lally 2010: falhar um dia não derruba o hábito; vale como regra de copy.

- Semana 1-2 (3-4 itens, todos diários e de 2 min): #1 água, #2 comer algo, #3 luz do dia, #7 dentes. Ou #6 banho em vez de #7 se a pessoa preferir.
- Semana 3-4 (+2): #10 cama ou #11 louça; #15 mensagem 2×/sem.
- Semana 5-6 (+2): #4 ar livre 2×/sem; #8 trocar de roupa; #18 algo de que gostava.
- Depois, 1 novo item a cada ~2 semanas e só se a pessoa tocou "quero mais". Teto sugerido de 6-7 ativos ao mesmo tempo no Ressurgimento.
- Semanais: #9 aparência, #12 lixo, #13 arrumada, #16 tempo com alguém entram a partir da semana 4, nunca no primeiro conjunto.
- Redução: se 2 semanas seguidas com a maioria sem registro, o app oferece "diminuir para o mínimo" ou "pausar", sem tom de falha (ver §3 e §4).
- Rede de apoio (#15-#17): aparece desde a semana 1 como convite (cartão), não como tarefa obrigatória.

Critério para sugerir Satisfação/Ambição (sempre como oferta recusável, decisão da pessoa, nunca automática, coerente com §16 decisão 1 "progresso é da pessoa"):
- 4 semanas com ≥ 50% dos itens do conjunto atual feitos pelo menos em versão mínima, E
- a pessoa tocar em "quero mais" ou completar 2 semanas seguidas ≥ 70%, E
- nenhum sinal de crise no período.
Mensagem: "Quer ver outras coisas que combinam com você agora?" Pode voltar ao Ressurgimento a qualquer momento sem perder nada. Subir não apaga os itens do Ressurgimento.

## 3. Linguagem

DIZER:
- "Vamos devagar." "Só o pequeno já vale." "Pode ficar só no mínimo hoje."
- "Cuidar do básico faz diferença para muita gente, e não precisa ser perfeito."
- "Se hoje não deu, amanhã o item continua aqui."
- Ao completar: fato concreto e neutro ("Copo d'água feito.") em vez de elogio exagerado.
- Rede de apoio: "Se quiser, mande um oi para alguém de que você gosta." "Você não precisa explicar tudo."
- Sempre agência: "se fizer sentido para você".

NUNCA DIZER:
- Diagnóstico, rótulo ou termo clínico sobre a pessoa: "depressão", "depressivo", "burnout", "você parece/está deprimido", "isso é sinal de".
- Causalidade ou promessa: "vai melhorar", "isso trata/cura/ajuda a sair da depressão", "vai te fazer sentir melhor", "funciona", "comprovado".
- Culpa e cobrança: "você falhou", "perdeu a sequência", "você não fez nada", "de novo?", contagem de dias perdidos, streak quebrado com destaque, notificação insistente.
- Pressão de rede: "você precisa falar com alguém", "não fique sozinho", "seus amigos se importam" como obrigação; comparação com outros.
- Medicamento, dose, terapia como substituta; "pense positivo", "é só se esforçar".
- Peso, corpo, dieta, "emagrecer", "detox", horas de sono.
- Chamar o caminho de "para quem está mal". Usar "quero me reerguer" como nome que a pessoa escolheu; o app não classifica ninguém.

Rede de apoio sem pressionar: sempre convite, sempre pulável, sem pontos/penalidade por não fazer; sem pedir nomes nem acesso a contatos; oferecer o "mínimo" (emoji, "oi"); abordar de forma indireta na semana 3-4 com cartão único "Quer pensar em alguém para quem mandar um oi?", e silenciar o cartão se dispensado 2 vezes. Pode oferecer "um profissional" como opção neutra (UBS, CAPS, psicólogo), dita uma vez, no cartão de apoio.

Quando mostrar CVV 188 / SAMU 192 (o Caderno já tem o aviso com CVV 188; reusar `src/utils/supportLine.ts` e `chatSafety.ts`):
- Rodapé discreto e permanente no caminho Ressurgimento: "Se estiver difícil demais, o CVV atende 24 h, de graça, no 188."
- Resposta ativa (cartão acolhedor, não bloqueia o uso) quando: texto livre com sinais de ideação/autolesão (já tratados por `chatSafety.ts`); a pessoa toca em "estou mal / preciso de ajuda" se existir esse botão; qualquer registro que contenha esses sinais.
- Em risco iminente ou emergência: SAMU 192 junto com CVV 188; sem sugerir atividade do catálogo (§16 decisão 4).
- Nunca usar o 188 como resposta a "dia ruim comum" nem a cada recusa de item: evita alarme e banalização.
- Texto: acolher, validar, oferecer o número, sem diagnóstico, sem "calma", sem prometer.

## 4. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Pessoa em crise aguda ou ideação | Detecção textual existente + cartão 188/192; catálogo desligado nesse momento; rodapé 188 permanente; pet/gamificação sem tom festivo nessa tela. Não prometer que o app resolve. |
| Adesão baixa nas 2 primeiras semanas (energia baixa) | Conjunto inicial de 3-4 itens de 2 min; versão mínima conta como feita; notificação rara e gentil; modo "pausa" sem punição; nada de streak visível. Lally 2010: falha ocasional não derruba. |
| Sensação de fracasso (lista longa, comparação) | Teto de itens ativos; sem % de cumprimento destacado; sem perda de progresso do pet; mensagens de reentrada neutras ("Que bom te ver"); sem perda de vida ou penalidade por ausência. Conferir com o motor de tarefas que nenhum custo (coração) caia nesses itens (V2). |
| Item parecer terapia/tratamento | Sem "trata", "cura", "terapia". Aviso "não substitui ajuda profissional" visível no caminho. Gatilho de revisão do §16 (usuários dizendo que entenderam como terapia). |
| Rede de apoio vira pressão ou expõe a pessoa | Sempre opcional; sem integração com contatos; mínimo de 2 min; silenciar após 2 dispensas. |
| Rotular a pessoa pelo caminho escolhido | Nome do caminho é escolha dela; nenhum conteúdo diz "você está mal"; troca livre de caminho. |
| Comportamento de alimentação virar dieta/controle | Só "comer algo", sem registro de comida, quantidade ou horário rígido; revisar com psicólogo, pois pode haver população com transtorno alimentar. |
| Dormir (higiene do sono) virar cobrança | Só "preparar o quarto"; sem horas. |
| Contraindicação de ar livre/atividade | Texto "no seu ritmo, se estiver bem para sair"; sem meta de distância/passos; aviso para quem tem dor/doença: procurar profissional. |
| Menor de idade | App 18+: manter o filtro de idade antes do caminho. |

Revisão por psicólogo ANTES de soltar (obrigatório, via `soulmon-behavioral-psychologist` e, ideal, 1 psicólogo/psiquiatra humano externo, ver alpha-saude-clinica regra de validação):
1. Todos os textos de copy (§3), incluindo cartão de rede de apoio e mensagem de reentrada.
2. O conjunto inicial e a ordem (§2), especialmente comer, banho, "o que fazer se a pessoa não consegue nem o mínimo".
3. O critério de saída para Satisfação/Ambição.
4. Gatilhos e texto do 188/192, o que o app faz após detecção de risco e o que NÃO faz.
5. Se #17 (falar com alguém como você está) é adequado dentro do app ou deve ficar só como convite externo.
6. Efeito de qualquer métrica visível (XP, nível, sequência) neste caminho: recomendação é esconder streak.
7. Pontos de regulação (alpha-compliance): descrição de loja, ausência de alegações de saúde, política de privacidade para dados sensíveis (LGPD art. 5º II e 11, dados de saúde são sensíveis; o caminho escolhido já pode revelar estado de saúde: tratar como dado sensível, minimizar, não enviar a analytics de terceiros).

Pendências de checagem de fonte: itens marcados "não reverificado" foram citados de memória com DOI conhecido; confirmar antes de publicar em `CATALOGO-EVIDENCIAS.md`.
