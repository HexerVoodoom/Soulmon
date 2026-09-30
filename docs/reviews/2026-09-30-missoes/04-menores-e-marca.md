# Parecer — guardião de PI e marca — Travessias: público menor de idade, classificação e risco de marca

Revisor: `soulmon-ip-brand-guardian`
Data: 30/09/2026
Escopo: `docs/PROPOSTA-MISSOES-EXPLORACAO.md` (Travessias / *Crossings*: desafios da vida real, opt-in, auto-declarados, que abrem regiões do mapa do Passeio), lida contra o público-alvo declarado e a idade mínima (`docs/PLAY-FICHA.md` §0 e §4, `docs/PLAY-DATA-SAFETY.md` §0, `public/termos.html` §3, `public/privacidade.html` "minors"), o portão de idade no código (`src/utils/consent.ts` › `isAdult`/`isAgeBlocked`, `src/components/SoulmonOnboarding.tsx` › `precisaDeclararIdade`/`podeAutenticar`) e a pergunta **MIS-12** de `docs/PERGUNTAS-DO-DONO.md` ("Menores de idade: pedir parecer do `soulmon-ip-brand-guardian` antes de implementar"). Leio junto os três pareceres irmãos (`01-linha-vermelha.md` R-27..R-48, `02-psicologia.md` R-1..R-13, `03-monster-taming.md`) e **não repito** o que eles já exigem; cito quando uma condição minha endurece uma deles. Fica de fora: psicologia, balanço, copy fina, arte.

> **Declaração de limite.** Este parecer **não é jurídico** e não substitui advogado. Eu não emito opinião legal sobre ECA Digital, LGPD art. 14, COPPA ou a política de Famílias do Google Play: aponto o risco e escrevo a condição que o reduz. Ninguém usou o app em produção; não há telemetria de idade real de quem abre o Soulmon. Tudo o que digo sobre "quem vai ler isto" é previsão. Fontes: **✔** consultada nesta sessão · **(≈)** de memória, sem conferir, e por isso não sustenta decisão sozinha. Pontos acima do meu limiar estão listados no fim para revisão jurídica.

Legenda: **VETADO** · **APROVADO COM RESSALVA** (cada `R-n` vira critério de aceite verificável) · **APROVADO**. A numeração recomeça em R-1 neste parecer; no ledger, citar como **"04 R-n"** para não colidir com os outros três.

---

## 0. O que os documentos e o código dizem (conferido por leitura)

1. **Público declarado: só adultos.** `PLAY-FICHA.md` §0 e §4: "Público-alvo **18+** (não é app para crianças)", decisão #15. `PLAY-DATA-SAFETY.md` §0: "Maiores de 18". `termos.html` §3 (PT/EN): "maiores de 18 anos … o app não segue com uma data de menor de 18". `privacidade.html`: "não é direcionado a menores e não coletamos intencionalmente dados de quem tem menos de 18 anos".
2. **O portão é auto-declaração.** Desde 07/09/2026 a idade é uma **caixa** "Tenho 18 anos ou mais" (`SoulmonOnboarding.tsx` › `maiorIdadeChecked`); só o caminho pago reconfere pela data de nascimento do mapa astral (`isAgeBlocked`). Uma caixa não impede um menor de entrar: ela transfere a declaração, não verifica. **Consequência para este parecer:** o público *declarado* é 18+, mas o público *provável* inclui adolescentes, e o desenho de um recurso que manda a pessoa **agir fora do app** tem de ser seguro para quem mentiu na caixa.
3. **A classificação esperada é Livre.** `PLAY-FICHA.md` §4: "Resultado esperado: **Livre / PEGI 3–7**". Ou seja, na loja o Soulmon aparece como adequado a qualquer idade, enquanto a ficha de público-alvo diz 18+. As duas coisas não se contradizem (classificação mede conteúdo; público-alvo mede para quem o app é feito), mas o efeito prático é que **nada no rótulo da loja afasta um adolescente**.
4. **O gênero atrai menores.** V-pet pixel, criatura que evolui, linhagem Tamagotchi — o próprio `.claude/agents/soulmon-ip-brand-guardian.md` registra "o produto atrai menores". A política do Google Play pede que um app **fora** do público infantil não tenha **apelo não intencional** a crianças, e o Google confere o marketing para isso ✔ ([Play Console Help — Manage target audience and app content settings](https://support.google.com/googleplay/android-developer/answer/9867159?hl=en); [Android Developers Blog, 2019](https://android-developers.googleblog.com/2019/05/building-safer-google-play-for-kids.html)). Se o Google entender que o público inclui crianças, passam a valer os requisitos da **Families Policy** (conteúdo, dados, anúncios), com risco de remoção ✔ ([Play Console Help — Families Policies](https://support.google.com/googleplay/android-developer/answer/17122218)).
5. **ECA Digital.** O repositório já cita a Lei 15.211/2025 (`GUIA-EXPERIENCIA.md` itens 58 e 900, sobre o reroll). Pelo que lembro (≈), ela alcança produtos **de acesso provável** por crianças e adolescentes, não só os direcionados a eles — exatamente o caso do item 2. Não li o texto da lei nesta sessão: vai para revisão jurídica.
6. **A proposta já tem defesas que servem a menores**, e eu as endosso sem repetir: nenhum sensor, foto, GPS ou prova (M3, §5); sem texto livre na v1 (linha vermelha R-39, MIS-6); toda região tem opção solitária, em casa, sem gasto, ≤ 10 min (psicologia R-3/R-5); "lugar novo" nunca à noite (linha vermelha R-42b); sem álcool, sexo, gasto, risco (R-42d); nada de mostrar/compartilhar pelo app (R-42e). **O que falta** é: uma régua de idade explícita para o pool, a proibição de contato com desconhecido escrita como regra (hoje só está implícita em "alguém de quem você sente falta"), a proibição de ir sozinho a lugar novo (hoje só "nunca à noite" e "nunca isolado"), a trava de dados escrita do lado da loja/Data Safety, e o risco de marca de "desafio".

---

## 1. Achado que governa o parecer

**O risco das Travessias não está no conteúdo exibido, está no ato pedido.** Classificação indicativa (IARC) mede o que a tela **mostra**; as Travessias **pedem** que a pessoa faça algo no mundo físico. Nenhum questionário da loja pergunta "o app sugere que o usuário saia de casa para um lugar novo?", então a classificação Livre não muda — e é justamente por isso que o recurso não pode depender dela como proteção. A proteção tem de estar no **pool**, que é a única peça que o jogo controla.

**Régua escolhida: piso de 13 anos lido sem adulto por perto, dentro de um produto 18+.** Por que não 18+ (o público declarado)? Porque o portão é uma caixa (§0.2), a loja mostra Livre (§0.3) e o gênero atrai menores (§0.4): desenhar só para o adulto declarado é apostar a marca na honestidade de uma caixa. Por que não 16+? Porque um desafio que só é seguro a partir dos 16 (ir sozinho a um bairro desconhecido, falar com gente nova) é justamente o que produz a manchete; baixar o piso para 13 custa quase nada ao adulto (que sempre pode escolher a versão plena) e fecha o pior caso. Por que não "Livre" (qualquer idade)? Porque isso esvaziaria "Social" e "Corpo" de sentido para o público real, e abaixo de 13 o problema já não é o pool: é o app ter sido baixado por uma criança contra a declaração, o que nenhuma frase de desafio resolve.

**Risco de marca.** "Desafio" em app de consumo carrega, na imprensa e em pais, a associação com os *challenges* virais perigosos. Um único desafio mal escrito ("vá a um lugar onde você nunca esteve", "mande mensagem para alguém que você não conhece") vira, fora de contexto, a manchete "app de bichinho virtual manda usuários irem sozinhos a lugares desconhecidos" — e o bichinho pixel é exatamente o que faz a manchete parecer sobre crianças. Isto é mais caro que qualquer risco de PI deste recurso.

**PI.** O recurso é mecânica (regiões que abrem por ato real; precedentes de gênero em `03-monster-taming.md` §1 — Finch, SuperBetter, DW1, Pokémon GO Special Research). **Mecânica não é protegível; a expressão sim.** O nome *Travessias/Crossings* é genérico (não pesquisei registro de marca nesta sessão — ver §6). O risco de PI real está em outro lugar: desafios que **nomeiam** marcas, plataformas, eventos ou lugares de terceiros (R-6).

---

## 2. Veredito por item

| Item | Veredito | Condições | Uma frase de motivo |
|---|---|---|---|
| Travessias para o público **declarado** (18+) | `APROVADO COM RESSALVA` | R-1..R-11 | Para o adulto, o desenho da proposta + pareceres irmãos já é seguro; as ressalvas protegem o público provável e a marca. |
| Exemplo §4 **"Corpo — Caminhar por uma rua ou **trilha** onde você nunca passou"** | `VETADO` na redação atual | R-3 | "Trilha" nunca passou é lugar isolado, com risco físico e sem indicar companhia nem horário; reescrever (sugestão em R-3). |
| Exemplo §4 **"Social — Escrever para alguém de quem você sente falta"** | `APROVADO COM RESSALVA` | R-2 | Pessoa já conhecida, mensagem, sem encontro: seguro. Ressalva: nunca vira "conhecer alguém", "falar com alguém novo" ou "combinar de encontrar". |
| Exemplo §4 **"Criar — Fazer algo com as mãos e **mostrar para alguém**"** | `APROVADO COM RESSALVA` | R-2, R-5 | "Mostrar" só presencial/offline a quem a pessoa já conhece; nunca postar, filmar, publicar. |
| Exemplo §4 **"Aprender — assistir a uma aula ou palestra"** | `APROVADO COM RESSALVA` | R-6 | Sem nomear plataforma (TED, YouTube, Coursera…) nem evento; presencial só em lugar público, de dia. |
| Exemplo §4 **"Casa — Cozinhar uma receita que você nunca fez"** | `APROVADO COM RESSALVA` | R-8 | Adequado a 13+ desde que o pool não tenha técnica de risco (fritura por imersão, flambar) como núcleo. |
| Exemplos §4 **Mente** e **Hábito** | `APROVADO` | — | Em casa, sem terceiro, sem risco. (O "só olhar" do Hábito já foi vetado pela linha vermelha R-40.) |
| Coleta de dado pessoal pelas Travessias | `APROVADO` **só na forma da proposta** | R-4 | Save guarda só id de região, variante e dia; nada de local, foto, texto, pessoa, área. |
| Classificação indicativa (IARC) | `APROVADO COM RESSALVA` | R-7 | Não muda nenhuma resposta do questionário de `PLAY-FICHA.md` §4 — desde que continue sem UGC, sem interação entre jogadores e sem localização. |
| Play Families / apelo infantil | `APROVADO COM RESSALVA` | R-5, R-7, R-11 | As Travessias não aumentam o apelo infantil por si; o risco é o marketing delas. |
| Nome *Travessias / Crossings* | `APROVADO` (sem busca de marca) | §6 | Palavra comum, sem sufixo de franquia, sem conotação de desafio viral. Busca INPI/USPTO pendente. |
| **Proposta inteira** | **`APROVADO COM RESSALVA`** | R-1..R-11; **bloqueantes: R-1, R-2, R-3, R-4, R-5, R-11** | Não cruza linha de loja nem de idade na forma escrita; fica a um exemplo mal escrito de virar o pior risco de marca do produto. |

---

## 3. As condições (R-1..R-11) — o que o catálogo de desafios precisa cumprir

### Idade

- **R-1 (bloqueante; piso 13+).** Todo desafio do pool — versão plena **e** pequena, PT **e** EN — tem de ser adequado a **uma pessoa de 13 anos que o leia sozinha, sem adulto por perto**, apesar de o público declarado ser 18+. O teste de leitura é: *"se um adolescente de 13 anos fizesse exatamente o que está escrito, ao pé da letra, correria risco físico, social ou de contato indevido?"* — se sim, sai ou é reescrito. **Aceite:** (a) cada item do catálogo tem um campo `pisoIdade: 13` (tipo literal, não número livre), e um teste de contrato reprova item sem o campo ou com valor diferente; (b) a revisão final do pool (R-11) registra, item a item, que passou nessa pergunta. *Motivo:* portão por caixa (§0.2), loja Livre (§0.3), gênero com apelo infantil (§0.4).

### Contato e deslocamento

- **R-2 (bloqueante; nenhum contato com desconhecido).** Nenhum desafio pede, sugere ou permite interpretar como: falar com desconhecido, conhecer gente nova, entrar em grupo/comunidade/fórum/servidor, responder a alguém online que a pessoa não conhece pessoalmente, marcar encontro presencial com alguém (mesmo conhecido), mandar mensagem para "alguém novo". O desafio social é **sempre** dirigido a **alguém que a pessoa já conhece fora da internet**, por meio que ela já usa, e a versão pequena **não envolve contato** (endurece psicologia R-5). **Aceite:** teste que varre as strings do pool (PT/EN) e reprova `desconhecid|estranh|stranger|someone new|alguém novo|conhecer (gente|alguém|pessoas)|meet( up)?|encontr(ar|o) (com|alguém)|grupo|group|online friend|amigo virtual|servidor|server|fórum|forum|app de (namoro|relacionamento)|dating`.
- **R-3 (bloqueante; nenhum lugar novo sem companhia disponível e sem luz do dia).** Desafio de "lugar novo" só em **lugar público, perto de casa, de dia**, e a copy sempre **abre** a opção de ir com alguém ("sozinho ou com alguém"), nunca pede ir sozinho. Proibido: trilha, mata, praia/rio/lago/mar, altura (telhado, mirante sem estrutura), construção abandonada, lugar "escondido"/"secreto", transporte sozinho para outro bairro/cidade, qualquer coisa à noite ou "ao anoitecer". Toda região cujo desafio pleno saia de casa tem opção em casa (já exigido por psicologia R-3; aqui é pré-condição de idade). O exemplo §4 "Corpo" é reescrito, sugestão: *"Walk down a street near you that you've never taken, in daylight — alone or with someone."* / *"Andar por uma rua perto de você por onde nunca passou, de dia — sozinho ou com alguém."* **Aceite:** teste de varredura que reprova `trilha|trail|mata|woods|forest walk|rio|river|lago|lake|praia|beach|mar |sea|telhado|rooftop|abandonad|abandoned|escondid|hidden|secret|à noite|at night|anoitecer|dusk|sozinh[oa] (a|para|até)|go alone|by yourself to` nas strings do pool.

### Dados

- **R-4 (bloqueante; nenhum dado pessoal novo).** A Travessia grava no save **só**: id da região, id do desafio (enum), variante (pequena/plena), `playerDayKey` do "Fiz" e da abertura. **Nunca**: localização, endereço, nome do lugar, foto, áudio, texto livre (endossa linha vermelha R-39 e MIS-6), nome ou contato da pessoa para quem se escreveu, área do desafio em telemetria. Consequência verificável: **`PLAY-DATA-SAFETY.md` e `privacidade.html` não mudam** no PR que implementa as Travessias. Se algum dia mudarem (ex.: MIS-6 aprovada), o mesmo PR atualiza Data Safety §2 e a política PT/EN, e volta a este guardião. **Aceite:** (a) o tipo do campo no save (`src/types/travessias.ts` ou sucessor) só admite ids/enum/dayKey — teste de tipo que reprova campo `string` livre; (b) o diff do PR de implementação não toca `PLAY-DATA-SAFETY.md` nem `public/privacidade.html`, ou, se tocar, cita este parecer.

### Marca

- **R-5 (bloqueante; nada de "desafio" viral: sem compartilhar, filmar, postar).** Nenhum desafio pede ou sugere registrar/publicar o ato: proibido `post|postar|publicar|share|compartilh|film|filmar|grav(e|ar) (um vídeo|você)|record yourself|selfie|story|stories|tag|marque|hashtag|#`. O app não oferece botão de compartilhar Travessia, nem card para rede social (endossa linha vermelha R-42e, #21). Na interface e no marketing, o nome é **Travessia/Crossing**; a palavra **"desafio"/"challenge" não aparece como rótulo** da camada (pode aparecer em doc interno), e nenhuma peça de loja, ficha ou post diz "aceite o desafio"/"take the challenge". **Aceite:** varredura de copy do pool e dos componentes da folha do Passeio pelas palavras acima; e a ficha da loja (`PLAY-FICHA.md` §1–§3), se mencionar Travessias, usa a mesma régua.
- **R-6 (nenhuma marca, plataforma, evento ou lugar de terceiro).** Nenhum desafio nomeia empresa, marca, app, plataforma, rede social, franquia, evento ou lugar identificável (TED, YouTube, Duolingo, Instagram, TikTok, Spotify, Pokémon GO, nomes de redes de fast-food, de parques, de museus, de cidades). Motivos: (a) PI — uso de marca alheia em texto do produto, e sugestão de endosso; (b) global — o produto é EN-first e global (decisão de 30/09/2026), e lugar nomeado exclui quem mora longe; (c) idade — nomear plataforma com classificação própria (rede social 13+/16+) importa a regra dela para o Soulmon. **Aceite:** o teste de R-3 ganha uma lista de marcas de referência (`TED|YouTube|TikTok|Instagram|Facebook|WhatsApp|Discord|Duolingo|Spotify|Netflix|Pokémon|Pokemon|Digimon|Tamagotchi|Finch|Habitica`) e reprova ocorrência; revisão humana cobre o resto (R-11).

### Loja e classificação

- **R-7 (classificação inalterada, e o gatilho que a reabre).** As respostas de `PLAY-FICHA.md` §4 (IARC) **não mudam** com as Travessias: sem localização compartilhada, sem conteúdo gerado pelo usuário visível a outros, sem interação entre jogadores, sem álcool/drogas/sexo/jogo de azar. **Gatilho que obriga a refazer o questionário e voltar a este guardião:** qualquer versão futura em que uma Travessia (a) envolva outro jogador do Soulmon (grupo cooperativo, presente, diretório, Torneio), (b) peça ou guarde texto, foto ou local, ou (c) apareça em perfil público. **Aceite:** o PR de implementação não altera `PLAY-FICHA.md` §4; checklist de PR com a pergunta "isto muda alguma resposta do IARC?".
- **R-8 (conteúdo proibido absoluto, com o piso de 13).** Somando ao M9 e à linha vermelha R-42d: nada de álcool, tabaco, vape, drogas, remédio; namoro, flerte, "crush", conteúdo romântico ou sexual; dinheiro, compra, aposta, troca; dirigir ou pilotar qualquer veículo; exercício extremo, jejum, dieta, peso, desafio de resistência ("aguente X minutos"); fogo, fritura por imersão, flambar, lâmina como núcleo do desafio de cozinha; mexer em eletricidade, gás, ferramentas elétricas; animais desconhecidos; qualquer coisa "escondido dos pais"/"sem contar a ninguém" (este último é o sinal clássico de risco para menor e **nunca** aparece, nem como brincadeira). **Aceite:** entra na mesma varredura de R-2/R-3/R-6.
- **R-9 (uma linha de segurança, uma vez, e o termo).** A folha das Travessias mostra **uma vez** (na primeira abertura, e depois acessível no "?" da folha — não a cada desafio, para não virar sermão nem cobrança) uma linha do tipo *"Do only what's safe and comfortable for you. Every crossing has a version you can do at home."* / *"Faça só o que for seguro e confortável para você. Toda travessia tem uma versão para fazer em casa."* (copy final da `squad-narrativa`, sob L1..L12 e aceite da psicologia). E o `termos.html` §8 (PT/EN, mesmo PR) ganha uma frase: as atividades sugeridas fora do app são opcionais, escolhidas pela pessoa, e ela as faz por conta própria e só se forem seguras para ela. **Aceite:** teste de render que acha a linha na primeira abertura; diff do `termos.html` com a frase nos dois idiomas e a versão/data do termo atualizada.
- **R-10 (EN primeiro, cultura global).** O pool nasce em inglês natural (decisão de 30/09/2026) e o par PT-BR vem junto; nenhum desafio pressupõe contexto brasileiro (feriado, comida, instituição) nem norte-americano — o que é local vira genérico ("a dish you've never made", não o nome do prato). **Aceite:** revisão R-11 confere.

### Processo

- **R-11 (bloqueante; revisão final e gatilho de idade).** (a) A lista final do pool (PT/EN, pleno + pequeno) passa por **este guardião** depois da `squad-narrativa` e do veto da psicologia (MIS-8), e antes do merge; a revisão registra o piso 13 item a item (R-1). (b) **Gatilho:** se a decisão #15 mudar (o público-alvo passar a incluir menores de 18), se o Google Play pedir conformidade com a Families Policy, ou se o portão de idade continuar só na caixa e a telemetria (quando existir) sugerir uso por menores, **as Travessias que saem de casa (Corpo/lugar novo) e as Sociais ficam desligadas para esse público** até novo parecer — as demais áreas (Casa, Mente, Criar em casa, Aprender em casa, Hábito) continuam. O interruptor de camada inteira (MIS-11) já existe como caminho técnico. (c) Qualquer desafio **novo** fora da lista revisada volta a este guardião.

---

## 4. O que NÃO é problema (para não mutilar o recurso)

- **A mecânica** (região que abre por um ato real auto-declarado) não é protegível nem arriscada em si; é gênero (DW1, Finch, SuperBetter, Special Research). Nada a mudar.
- **Auto-declaração sem prova** é o que **protege** o menor: não há foto, GPS, nem registro de onde ele esteve. Qualquer proposta futura de "provar" a Travessia é, além de vigilância (#18), um risco de dado de menor. Manter.
- **"Escrever para alguém de quem você sente falta"** é adequado a 13+ e bom para a marca, na forma da proposta (R-2 só impede que escorregue).
- **O nome *Travessias / Crossings*** não carrega obrigação, perda (L5 fica livre), nem conotação de *challenge* viral. Bom.

---

## 5. Perguntas ao dono (propostas para `PERGUNTAS-DO-DONO.md`, seção Travessias)

| Id sugerido | Pergunta | Recomendação deste guardião | Gatilho de revisão |
|---|---|---|---|
| **MIS-12** (resposta) | Menores de idade: como as Travessias tratam o público menor? | **Piso 13+ no pool, dentro de um produto 18+** (R-1), com as travas de contato (R-2), deslocamento (R-3), dados (R-4) e marca (R-5). Não é necessário mudar o público-alvo nem a classificação. | Decisão #15 mudar; Play pedir Families; revisão jurídica discordar. |
| **MIS-13** | O portão de idade continua sendo só a caixa "Tenho 18 anos ou mais"? | Decisão do dono, não deste recurso. Registro: as Travessias são o primeiro recurso que manda a pessoa **agir fora do app**, o que aumenta o custo de um menor ter passado pela caixa. Não recomendo verificação dura (coleta dado de todos); recomendo manter R-1..R-11 como compensação. | Primeira telemetria de uso; parecer jurídico sobre ECA Digital. |
| **MIS-14** | Travessias aparecem na ficha da loja/screenshots? | **Não na v1.** Se aparecerem depois: sem a palavra "challenge", sem pessoa real na arte, sem cena de rua/lugar (R-5, apelo infantil §0.4). | Próxima revisão da ficha. |

---

## 6. O que NÃO consegui verificar (e o que vai para revisão jurídica)

- **Revisão jurídica recomendada** (acima do meu limiar): (1) se a Lei 15.211/2025 (ECA Digital) se aplica ao Soulmon como produto "de acesso provável" por adolescentes, e se uma caixa de auto-declaração basta como mecanismo de idade sob ela — **não li a lei nesta sessão** (≈); (2) a frase de R-9 no `termos.html` §8 (limitação de responsabilidade sobre atividade no mundo físico) — a redação final deve passar por advogado.
- **Busca de marca** para "Travessias"/"Crossings" (INPI classe 9/41, USPTO) **não feita** nesta sessão. "Crossing(s)" é palavra comum e há produtos com o termo no mercado de jogos (≈, p.ex. *Animal Crossing*, da Nintendo). Como nome de **recurso interno** dentro do app, sem ser marca do produto, o risco é baixo; **não** usar "Crossing" sozinho em marketing ou título de loja sem busca, e nunca com "Animal" ou arte que remeta àquela franquia.
- A política de Famílias do Google Play foi conferida por página de ajuda e resumo (✔ links em §0.4), não pela seção inteira da Developer Program Policy; a redação muda com frequência. O texto exato de "apelo não intencional" e o que o Google aceita como "age screen neutro" devem ser relidos no Play Console na hora de preencher.
- Não confirmei se `src/types/travessias.ts` (arquivo não rastreado no worktree `E:\soulmon-trav`) já define o formato do save; R-4 se aplica a ele ou ao sucessor.
- Não há telemetria de idade real; "público provável inclui adolescentes" é inferência do gênero e do portão, não medição.

Fontes consultadas nesta sessão: [Play Console Help — Manage target audience and app content settings](https://support.google.com/googleplay/android-developer/answer/9867159?hl=en) · [Play Console Help — Google Play Families Policies](https://support.google.com/googleplay/android-developer/answer/17122218) · [Android Developers Blog — Building a safer Google Play for kids (2019)](https://android-developers.googleblog.com/2019/05/building-safer-google-play-for-kids.html).

---

## Tabela-resumo

| Item | Veredito | Condição bloqueante |
|---|---|---|
| Travessias (público 18+ declarado) | APROVADO COM RESSALVA | R-1, R-2, R-3, R-4, R-5, R-11 |
| Exemplo "Corpo — rua ou **trilha** onde nunca passou" | **VETADO** na redação atual | R-3 (reescrever) |
| Exemplos Social / Criar / Aprender / Casa | APROVADO COM RESSALVA | R-2, R-5, R-6, R-8 |
| Exemplos Mente / Hábito | APROVADO | — |
| Dados pessoais | APROVADO só na forma da proposta | R-4 |
| Classificação IARC | APROVADO COM RESSALVA (inalterada) | R-7 |
| Play Families / apelo infantil | APROVADO COM RESSALVA | R-5, R-7, R-11 |
| Nome Travessias / Crossings | APROVADO (busca de marca pendente) | — |
| **Proposta inteira** | **APROVADO COM RESSALVA** | **R-1, R-2, R-3, R-4, R-5, R-11** |

## Registro para o ledger (copiar em `docs/plano-melhorias/ledger/vetos.md`)

| Data | Proposta | Parecer | Risco | O que fazer |
|---|---|---|---|---|
| 30/09/2026 | **Travessias / Crossings** (MIS-12: menores de idade, classificação, marca) | `APROVADO COM RESSALVA` · exemplo "rua ou trilha onde nunca passou" `VETADO` na redação | Portão 18+ por caixa + loja Livre + gênero com apelo infantil ⇒ público provável inclui adolescentes; recurso manda agir no mundo físico; associação com *challenges* virais | 04 R-1..R-11. Bloqueantes: R-1 piso 13+ no pool (campo `pisoIdade: 13` + revisão) · R-2 nenhum contato com desconhecido/encontro (varredura) · R-3 lugar novo só público, perto, de dia, "sozinho ou com alguém" (varredura) · R-4 save só ids/enum/dayKey; Data Safety e política intocadas · R-5 sem compartilhar/filmar/postar, "challenge" fora da UI e do marketing · R-11 revisão final do pool por este guardião + gatilho de idade |
