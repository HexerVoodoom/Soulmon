# Proposta de som: minijogos do Ateliê da Mente e do Refúgio (30/09/2026)

> **Etiqueta:** proposta. **Não decide nada** e não altera `src/`. As decisões canônicas de som
> são **S1..S16** em `docs/REGISTRO-DE-DECISOES.md` §6.1; o guia é `docs/SOM.md`.
> **Autor:** `som-diretor` (squad de som), a pedido do dono. **Revisores obrigatórios antes de
> qualquer implementação:** `soulmon-guarda-vinculo` (D11: é dele, prevalece ele),
> `soulmon-behavioral-psychologist` + `alpha-requisitos` (revisam os cortes), e
> `soulmon-ip-brand-guardian` (caso Eco, §3.1).
> **Base medida:** `main` em `b596b4e`. Os sete modos foram lidos no fonte; nenhum importa
> `utils/sounds` hoje (R-NOVA cumprida). Ninguém nunca usou o app: toda afirmação sobre o
> jogador é `[hipótese]`.

## 0. Veredito em uma linha

**Nenhum dos 26 eventos avaliados ganha som agora.** Um único evento sobrevive como *candidato*,
e só se o dono quiser abrir a categoria `arcade`: **"partida resolvida por gesto"** (Picross
resolvido, sessão da Revisão fechada) — um som genérico, sem amostra própria por jogo, e que
nunca depende de ter havido Bits. O Refúgio fica mudo por decisão, não por omissão.

## 1. As réguas aplicadas (arquivo + símbolo)

| Régua | Onde mora | O que ela faz aqui |
|---|---|---|
| **D11** — som só em resposta a gesto; a fronteira é o pacote inteiro | `src/utils/sounds.ts`, bloco `WP3.5 — O SOM DE PRESENÇA (decisão D11)`; `docs/SOM.md` §2 regra 1 | Mata todo evento disparado por **relógio**: o fim dos 60 s das Bolhas, o fim da sessão da Troca, as fases e o fim da Respiração, a demonstração do Eco. Também: o jogo tem de funcionar **100% mudo** — som nunca é o único canal |
| **R-CAT** — categoria vem do EVENTO | `docs/SOM.md` §2 regra 6; `CATEGORIA_DO_SOM` em `src/utils/loudness.ts` | Fim de minijogo é **Arcade** (o mesmo argumento da S12 para a Arena). Não é `conclusao` (é de tarefa), não é `sintonia` (é do Visor). Proíbe "pegar emprestado" um som só porque ele existe |
| **S12** — Arcade genérica, **sem amostra própria** | `REGISTRO-DE-DECISOES.md` §6.1, S12 | Se o Ateliê ganhar som, é **um** som Arcade para o prédio inteiro, nunca um por jogo |
| **R-EX** — um gesto, uma fonte; perdedora descartada | `JANELA_DE_COINCIDENCIA_MS` (120) e `CLASSE_R_EX` em `src/utils/audioBus.ts` | `arcade` é a classe 5, a mais baixa: perde para qualquer outro som. Evento de toque rápido (bolhas, células) teria som **intermitente** por descarte — lê como defeito `[hipótese]` |
| **R-NOVA** — superfície nova nasce muda | `docs/SOM.md` §2 regra 7; `src/utils/cortes.contract.test.ts` (A-3) | Cumprida. Este documento é o passo seguinte que ela exige: avaliar evento a evento e **recusar por escrito** (lição da objeção O-12: ausência não é decisão) |
| **Celebração que faz PARAR, não acelerar** | `REGISTRO-DE-DECISOES.md`, linha homônima na tabela da §5.7 | Nenhum som de cadência (acerto, estouro, eco que cresce). Celebração é para marco, e minijogo não é marco |
| **§3 critério A — exploitationware** | `REGISTRO-DE-DECISOES.md` §3, "A. O teste do exploitationware" | Som atrelado a **Bits** ensina a querer o Bit, não o jogo. E o funil `handleEarnGamePoints` corta no teto `MINIGAME_BITS_PER_DAY` (150, `src/utils/currencies.ts`): um som disparado por `bits > 0` no jogo tocaria mesmo quando o funil paga zero |
| **#16** — nunca recompensa por contagem de tarefas (e sua forma sonora: stinger que cresce com a contagem) | `docs/plano-melhorias/ledger/vetos.md` | Mata qualquer som que escale com o tamanho do eco, o placar de sonhos ou a linha completa do Picross |
| **#12** — nada responde à qualidade | `vetos.md` | Por analogia no Refúgio: nada ali mede, então nada ali soa como resultado |
| **Escada de loudness** | `ALVO_LUFS_M` em `src/utils/loudness.ts` (Arcade −25,0 LUFS-M) | Citada como fato. **Não é aberta aqui**; qualquer som novo segue o caminho do `docs/SOM.md` §4 (evento → categoria → alvo → calibração → gate, e o AC-4 reprova nomeando o som que faltar) |

## 2. A tabela — evento por evento

Legenda da coluna "Disparo": **G** = no handler de um gesto · **R** = por relógio
(`setTimeout`/`setInterval`) · **G→R** = o gesto inicia, o relógio dispara.

| Jogo | Evento candidato | Disparo | Merece som? | Categoria / som existente | Por quê |
|---|---|---|---|---|---|
| **Eco** | Pedra acesa na demonstração ("o pet canta") | G→R (`playback`, `setTimeout` por pedra) | **NÃO** | — | Ver §3. Relógio dispara (D11 no limite, e a fronteira é do guarda); som por pedra vira canal de informação que o jogador mudo não tem; risco de PI (tons do Simon) |
| Eco | Toque do jogador numa pedra | G (`tap`) | **NÃO** | — | Evento mais repetido do jogo (a sequência cresce sem teto). A confirmação de gesto já existe: `navigator.vibrate(15)` + eco visual de 180 ms. O código usa de propósito "a mesma tinta para certo e para fora da ordem" — um som por pedra teria de fazer o mesmo, e aí é ruído |
| Eco | Eco completo (sequência cresce 1) | G (`tap`, ramo "completou") | **NÃO** | — | Cadência, não conclusão (§5.7). Escalaria com a contagem — forma sonora da #16 |
| Eco | Fim da rodada ("Maior eco", Bits) | G (`tap` que sai da ordem → `finish`) | **NÃO** | — | O gesto que termina a rodada é o toque **fora da ordem**. Qualquer som ali é ouvido como "errou" `[hipótese]` — o oposto da copy "Seu pet comemora o eco" e da regra da casa "nada de errou" |
| **Bolhas (foco)** | Estouro de sonho claro | G (`pop`) | **NÃO** | — | Dezenas por rodada de 60 s; toques a < 120 ms caem na R-EX e o som some em parte deles (Arcade perde tudo); háptico já confirma |
| Bolhas (foco) | Estouro de fiapo escuro | G (`pop`) | **NÃO** | — | Som distinto = "errou" sonoro. O desenho escolheu "sem texto, só não pontua"; o som tem de obedecer à mesma regra |
| Bolhas (foco) | Fiapo/sonho escapando por cima | R (tick) | **NÃO** | — | Relógio (D11). E seria som de perda |
| Bolhas (foco) | Fim dos 60 s com Bits | R (`setInterval` → `finish`) | **NÃO** | — | D11 literal: quem termina é o relógio |
| **Bolhas (calma)** — Refúgio | Estouro | G (`pop`) | **NÃO** | — | Refúgio é quieto (§4). Um som aqui é justamente o som não solicitado no momento de maior vulnerabilidade `[hipótese]` |
| Bolhas (calma) | Bolha nascendo | R | **NÃO** | — | D11 |
| **Troca** | Acerto | G (`sort`) | **NÃO** | — | Alta repetição; cadência |
| Troca | Erro (carta escorrega e volta) | G (`sort`) | **NÃO** | — | O jogo foi desenhado para não dizer "errou"; o som diria |
| Troca | **Troca de regra** (pista pulsa) | G (`sort`, `res.switched`) | **NÃO** | — | É o **desafio central** do jogo (perceber a mudança). Um som ali entregaria a resposta a quem tem som ligado e deixaria o jogo mais difícil para quem joga mudo — dois jogos diferentes sob o mesmo placar `[hipótese]`. O pulso + troca de texto da pista é o canal, e basta |
| Troca | Fim da sessão com Bits | R (`setInterval` → `finish`) ou G (última carta) | **NÃO** | — | Dispara pelos dois caminhos; o do relógio é vetado pela D11, e um som que às vezes toca e às vezes não, pelo mesmo evento, é pior que nenhum |
| **Picross** | Pintar / marcar X | G (`setCell`) | **NÃO** | — | Repetição altíssima (até 100 casas no 10×10) |
| Picross | Linha/coluna fechada | G (derivado de `lineDone`) | **NÃO** | — | Vaza solução (confirma a linha) e escala com contagem (#16) |
| Picross | **Desenho revelado** (grade resolvida) | G (último `commit` com `matchesClues`) | **CANDIDATO — padrão: mudo** | Nenhum som existente serve. Seria o **1º membro da `arcade`** (−25,0) | Único evento do Ateliê que é gesto, 1× por partida, sem relógio, sem contagem, e cujo significado é "pare e olhe o desenho" (§5.7: faz parar). Se o dono abrir a Arcade, é aqui. **Não** `playTaskComplete` (é de tarefa: C-1, S12). **Não** `playVisorTune` (é da sintonia do Visor; R-CAT) |
| Picross | Bônus do desenho do dia | G (mesmo `commit`) | **NÃO** (como variação) | — | Se houver o som do desenho revelado, ele é **idêntico** com ou sem bônus. Som maior quando paga mais é o §3 critério A |
| **Revisão** | Virar cartão | G | **NÃO** | — | Repetição; é leitura, não conquista |
| Revisão | "Lembrei" / "Ainda não" | G (`answer`) | **NÃO** | — | O código dá **a mesma tinta** aos dois de propósito. Som só no "Lembrei" quebra essa igualdade; som nos dois é ruído |
| Revisão | Sessão concluída (Bits) | G (último `answer` → `completeSession`) | **CANDIDATO — padrão: mudo** | O mesmo Arcade genérico do Picross, **sem variação** | Gesto, 1× por sessão, fila de Leitner que termina. Mesma ressalva: toca igual com 0 ou N Bits |
| **Respiração** — Refúgio | Fase (inspire / segure / expire) | R (`setInterval`) | **NÃO** | — | D11 literal (relógio) e Refúgio quieto. Ver §4 para a pergunta legítima que sobra (guia sonoro opt-in) |
| Respiração | Botão de segurar | G (`onPointerDown`) | **NÃO** | — | É apoio tátil; som contínuo durante o segurar seria trilha, não SFX |
| Respiração | Fim da sessão | R (`setInterval` → `done`) | **NÃO** | — | D11; e o Refúgio "não mede nada" — um som de fim soaria como conclusão/resultado |
| Todos | Entrar no jogo / abrir o prédio | G | **NÃO** | — | Navegação não tem som no produto (o `playMenuOpen` foi apagado na Fase 0, C-9) |
| Todos | Pagamento de Bits (`onEarnPoints`) | — | **NÃO** | — | O som nunca é da moeda (§3 critério A); e o funil pode pagar 0 no teto diário |

Contagem: **26 eventos; 24 recusados; 2 candidatos** (os dois viram **um** som só).

## 3. O caso do Eco (por que o Simon do Soulmon fica mudo)

O Simon de 1978 é, por tradição, um jogo **sonoro**: cada cor tem um tom, e muita gente joga de
ouvido. O Eco foi desenhado ao contrário, e a proposta é **manter**:

1. **Ele já funciona 100% mudo, e isso é a regra, não a limitação.** Cada pedra tem **forma +
   nome + cor** (`STONES` em `EcoGame.tsx`), o pet pula quando canta, a pedra aparece grande no
   visor. A D11 (`docs/SOM.md` §2 regra 1) exige que som nunca seja o único canal; o Eco vai
   além e não tem canal sonoro nenhum, então é jogado igual no ônibus e em casa `[hipótese]`.
2. **A demonstração é disparada pelo relógio.** `playback` agenda um `setTimeout` por pedra;
   numa sequência de 8 são 8 disparos em segundos, **nenhum deles no handler de um gesto**. O
   gesto (Começar, ou o toque que fecha o eco) só *inicia* a cadeia. Se isso é "em resposta a
   gesto" ou "som agendado pelo app" é **fronteira da D11 — e a fronteira não é minha**: vai
   para o `soulmon-guarda-vinculo`, e prevalece ele.
3. **Tom por pedra cria dois jogos.** Com som, quem ouve memoriza a melodia (canal extra); quem
   joga mudo memoriza só a imagem. O mesmo placar ("Maior eco") passaria a medir coisas
   diferentes `[hipótese]`. Sem som, todo mundo joga o mesmo jogo.
4. **Repetição.** Uma rodada longa soma demonstração + repetição + demonstração maior: dezenas
   de notas em poucos minutos, na classe Arcade (orçamento infinito, `ORCAMENTO_POR_SESSAO` em
   `audioBus.ts`) — o perfil exato que a S7 declara irrespondível ("irrita na 20ª repetição?").
5. **Risco de PI (S4).** Quatro tons fixos associados a quatro alvos é a assinatura do Simon
   (Hasbro). Qualquer conjunto de tons proposto teria de passar pelo
   `soulmon-ip-brand-guardian` antes de existir `[hipótese sobre o status legal; não verificado]`.
6. **O fim da rodada é o toque errado** (ver tabela). Não há um gesto "bom" no fim do Eco onde
   pendurar um som.

**Uma pendência de texto, não de som:** a copy diz *"na ordem em que o pet cantar"* /
*"Your pet sings the stones"*. Com o som ligado, "cantar" pode ser lido como promessa de áudio
`[hipótese]`. Não proponho mudar — é metáfora do universo —, mas registro como pergunta ao
`alpha-redator-ux` (§6, item 5).

## 4. O Refúgio é silêncio protegido

A decisão de 30/09/2026 (`REGISTRO-DE-DECISOES.md`, linha "Três prédios em Jogos…") diz que o
Refúgio **não paga, não pontua e não mede nada**. A leitura sonora coerente é: **não soa**.
Nenhum SFX de Respiração nem de Bolhas calmas, em evento nenhum. É o mesmo estatuto da virada do
dia (C-8: classe 0, silêncio protegido).

Proponho tornar isso **trava**, não costume: uma linha nova na tabela `CORTES` de
`src/utils/cortes.contract.test.ts` — por exemplo **C-10**, *"o Refúgio nunca soa"*, alvos
`components/refugio/RespiracaoGame.tsx` e o modo `calma` de `components/mente/BolhasGame.tsx`,
proibidos = `Object.keys(CATEGORIA_DO_SOM)`. ⚠️ O modo calma mora no mesmo arquivo do foco; se o
Ateliê um dia ganhar som nas Bolhas, a trava precisa de âncora por escopo (o precedente é o
`escopo()` do C-3/C-4/C-5), ou o Bolhas-calma vira componente próprio. A implementação é do
`som-engenheiro-audio`; a revisão do corte é de `soulmon-behavioral-psychologist` +
`alpha-requisitos`.

**A pergunta legítima que sobra (não resolvo):** respiração guiada por som (um tom que sobe na
inspiração e desce na expiração) é padrão de mercado e seria útil a quem prefere **fechar os
olhos** `[hipótese]`. Não é SFX: é som **contínuo e agendado**, então cai na D11 por extensão,
como a trilha. O único desenho compatível seria o da **S2** — desligado por padrão, ligado por
gesto explícito dentro do próprio Refúgio, com chave separada do `SOUND_MUTED` e da trilha,
parando em `document.hidden`/sono (E0). Isso é decisão do dono, com o guarda-vínculo bloqueante.

**E a trilha já ligada?** Se o jogador ligou a trilha (S2) e entra no Refúgio, hoje ela
continua tocando — nada no Refúgio a toca ou a para. Se o Refúgio deve silenciar/ducar a trilha
é regra de disparo de estado, ou seja, peça do contrato E0–E6, que está **congelado (S13)**.
Não descongelo por conta própria: vai como pergunta (§6, item 3).

## 5. Se o dono quiser algum som no Ateliê — o único desenho admissível

1. **Um** som: `arcade`, evento **"partida resolvida por gesto"**. Membros iniciais: Picross
   resolvido e Revisão concluída. **Não** entram Eco, Bolhas nem Troca (fim por erro ou por
   relógio, §2).
2. **Genérico e sem amostra própria por jogo** (S12). Procedural (S10 vigente), curto, sem
   motivo — o motivo é proibido em evento que se repete e fica reservado ao que a hierarquia já
   dá a ele.
3. **Idêntico com 0, N Bits ou bônus do dia.** A condição de disparo é a resolução, nunca
   `bits > 0`.
4. **Nível pela escada, não por mim**: Arcade −25,0 LUFS-M (`ALVO_LUFS_M`). Calibração, linha em
   `CATEGORIA_DO_SOM`/`OFFSET_POR_SOM_DB` e gate são do `som-engenheiro-audio`; a tabela
   `DECLARADOS` do A-3 (`cortes.contract.test.ts`) ganha os dois chamadores.
5. **R-EX:** Arcade é a classe mais baixa; se coincidir com qualquer outro som em 120 ms, é
   descartado. Aceitável: o evento não carrega informação que a tela não carregue.
6. **Gate de escuta S8** do dono antes de entrar.

Pergunta de fechamento: **isso soa como companheiro ou como chefe?** Um som só quando o desenho
aparece, igual para todo mundo, que não sabe quanto você ganhou — companheiro. Um som por
bolha, por pedra, por acerto — chefe de linha de produção. Ninguém no roster ouve; o julgamento
auditivo é do dono.

## 6. Depende do dono (perguntas, não respostas)

1. **Abrir a categoria `arcade`?** Hoje ela tem zero membros. Padrão proposto: **não** — o
   Ateliê fica mudo como está. Se sim, só o som do §5, com os dois membros listados.
2. **Fronteira da D11 no Eco** (demonstração disparada por relógio depois de um gesto) — vai ao
   `soulmon-guarda-vinculo`. A proposta não depende da resposta (o Eco fica mudo de qualquer
   jeito), mas a resposta vale para qualquer jogo futuro com "o pet mostra, você repete".
3. **O Refúgio silencia a trilha ligada?** Peça do contrato E0–E6, congelado pela S13.
4. **Guia sonoro opt-in na Respiração** (§4) — só no desenho da S2, com chave própria. Padrão
   proposto: não agora.
5. **Copy do Eco** ("o pet canta") — pergunta ao `alpha-redator-ux`, não pedido de mudança.
6. **Achado lateral, fora do escopo pedido — não reabro, só registro:** `DinoGame.tsx` e
   `RPSGame.tsx` tocam `playTaskComplete` (categoria **`conclusao`**) no ganho da partida. Pela
   R-CAT e pelo mesmo argumento que a S12 usou para a Arena, fim de minijogo é **Arcade**, e
   "gastar a celebração do produto" em partida é o dano que a S12 registra. Os dois estão
   declarados no A-3 (`DECLARADOS` em `cortes.contract.test.ts`), então não é regressão: é uma
   decisão anterior à R-CAT que ninguém reavaliou. Se o dono abrir a Arcade (item 1), a pergunta
   natural é se Dino/PPT migram para ela; se não abrir, se o ganho de Dino/PPT deve ficar mudo.
   Revisores do corte: `soulmon-behavioral-psychologist` + `alpha-requisitos`. Também: o fim do
   Dino é disparado pela colisão dentro do `requestAnimationFrame`, não por um handler de gesto
   — mesma fronteira da D11 do item 2.
7. **Trava C-10 do Refúgio** (§4) — aprovar a linha nova na régua dos cortes.

## 7. Escuta (autocrítica separável) — uma linha por asset proposto

| Asset | Por que ele NÃO deveria existir |
|---|---|
| `arcade` genérico "partida resolvida por gesto" (Picross resolvido, Revisão concluída) | (a) Abre uma categoria vazia para dois eventos de baixo tráfego — o sistema cresce por incentivo de entregar sistema; (b) o Picross já tem a própria recompensa, que é **ver o desenho**, e um som compete com a imagem que devia fazer parar; (c) a Revisão é estudo do próprio jogador, e som de "fim de jogo" pode reenquadrar estudo como fase a vencer `[hipótese]`; (d) cria pressão de simetria: "por que o Eco não tem?", e o Eco não pode ter (§3); (e) S7: aprovado por N=1, a 20ª repetição é irrespondível. **Recomendação: não produzir enquanto o item 1 do §6 não for respondido.** |
