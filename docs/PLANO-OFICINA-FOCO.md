# Plano: Oficina do Foco e Caderno (Exploração) — 04/10/2026

> **Etiqueta: plano de design.** Pedido do dono (04/10/2026): um prédio de TÉCNICAS de gestão de tempo e
> produtividade (Pomodoro e outras) e uma missão de journaling, "talvez tudo na Exploração"; interface limpa,
> texto explicativo atrás do `InfoTip`. Implementado na branch `feat/r6-oficina`. Decisões do dono pendentes
> no fim. Nenhum valor de economia muda (sem Bits, XP, Emblema, Vínculo, `perfectDays`).

## 1. Os lotes (a) — DOIS prédios, na clareira de baixo da Exploração

O fundo `bg-exploracao` tem três clareiras: tablado de cima (Masmorra), tablado do meio (Passeio) e a
**grande clareira de baixo**, vazia (y ≈ 72–96%). Ela comporta dois prédios lado a lado.

| Lote | Nome PT / EN | NPC (busto reaproveitado) | Função |
|---|---|---|---|
| `oficina` | **Oficina do Foco** / Focus Workshop | **Tique, a relojoeira** / Tique, the clockmaker (busto `ferreira`, hoje sem chamada) | Cards das técnicas + timer de foco real |
| `caderno` | **Caderno** / Journal | **Sépia, a copista** / Sépia, the scribe (busto `lua`, hoje sem chamada) | Missão de journaling, escrita só no aparelho |

- **Por que "Caderno" e não "Diário":** já existem o "Diário de Aventuras" (`AdventureDiary`, o álbum do pet) e o
  Quill, escriba do Observatório. Um segundo "Diário" no mapa é o jogador tocando no errado (mesmo argumento do
  "Duelo" × "Pedra, papel e tesoura", `playAreaLots.ts`). EN "Journal" não colide.
- **Nomes:** `grep` em `src/` e `docs/` — sem colisão (Tique, Sépia); família Grom/Zeph/Pipo/Lamela (1–2 sílabas,
  nome de coisa do ofício: tique-taque, tinta sépia). Lume foi descartado (perto demais de Lumi, do Hall).
- **Arte provisória:** prédio da Oficina = o Observatório (`lote-laboratorio-stats`, torre); do Caderno = a
  Biblioteca (`lote-hall-biblioteca`). Bustos: os dois bustos de `EXTRA_NPC_ART` ainda sem uso. Lista de prompts no
  relatório.

## 2. O catálogo de técnicas (b)

Regra de copy (Ateliê da Mente, `BENCHMARK-MINIJOGOS.md` §1.2): a folha **descreve** a técnica e diz a evidência
com honestidade; **nunca promete efeito**. A evidência é rotulada no `InfoTip`: *forte*, *moderada* ou *fraca*.

| # | Técnica | Por que funciona (1 linha) | Fonte | Evidência |
|---|---|---|---|---|
| 1 | **Pomodoro** 25/5, pausa longa após 4 | Pausas fixas repõem a energia sem depender de a pessoa decidir quando parar | Cirillo, *The Pomodoro Technique* (2006); Biwer, Wiradhany & oude Egbrink (2023), *Br. J. Educ. Psychol.* — pausas sistemáticas saíram melhores que pausas livres num dia de estudo; Albulescu et al. (2022), *PLOS ONE* 17(8):e0272460 — micro-pausas: vigor d≈0,36, fadiga d≈0,35, desempenho n.s. | **Moderada-fraca** (a técnica em si tem poucos ensaios; o efeito das pausas é pequeno) |
| 2 | **Blocos de foco** 50/10 (e 90/20, ritmo ultradiano) | Um bloco mais longo serve a tarefa que pede imersão; a pausa fixa continua | Ericsson, Krampe & Tesch-Römer (1993), *Psychol. Rev.* 100(3) (sessões de prática deliberada curtas, com descanso); Kleitman (BRAC) | **Fraca** (o 90/20 é extrapolação; o ciclo de 90 min não foi confirmado como regra em vigília) |
| 3 | **Se-então** (intenções de implementação) | Ligar um gatilho a uma ação ("se for 9h, então abro o texto") tira a decisão do momento | Gollwitzer & Sheeran (2006), *Adv. Exp. Soc. Psychol.* 38 — 94 estudos, d≈0,65 (inflada por estudos pequenos) | **Forte** |
| 4 | **Esvaziar a cabeça** (brain dump) | Anotar o pendente e um primeiro passo reduz os pensamentos intrusivos sobre ele | Masicampo & Baumeister (2011), *J. Pers. Soc. Psychol.* 101(4); Scullin et al. (2018), *J. Exp. Psychol. Gen.* | **Moderada** |
| 5 | **Regra dos 2 minutos** | O que cabe em 2 min se faz na hora; o custo de anotar e voltar é maior que o de fazer | Allen, *Getting Things Done* (2001) | **Fraca** (sem ensaio próprio) |
| 6 | **Matriz de Eisenhower** | Separar o urgente do importante evita gastar o dia no que só grita | Covey (1989), *7 Habits* (atribuída a Eisenhower, 1954) | **Fraca** (sem ensaio próprio) |
| 7 | **O sapo primeiro** | Uma tarefa difícil logo cedo, antes de o dia encher | Tracy, *Eat That Frog!* (2001); a citação a Mark Twain é apócrifa | **Fraca** (autoajuda, sem ensaio) |

Ficaram de fora: time-boxing (junta-se ao nº 2), revisão semanal (Camada 3 congelada; já existe o `weeklyReport`).
As **fraca** continuam no catálogo, mas o `InfoTip` diz "evidência fraca" e a linha do card não afirma resultado.
Os números e o ano (1, 3, 4) foram conferidos por busca em 04/10/2026; Ericsson 1993 e Kleitman são de memória:
**marcados (≈)**, ficam como pergunta de checagem.

## 3. O Caderno (c) — missão de journaling

- **Formatos curtos** (escolha livre; o do dia é só uma sugestão determinística pelo dia, nunca obrigatória):
  **3 coisas boas** (3 linhas), **gratidão** (1), **o que aprendi hoje** (1), **escrita expressiva** (livre, ~3 min;
  Pennebaker & Beall, 1986, *J. Abnorm. Psychol.* 95(3) — evidência moderada, efeito pequeno). "3 coisas boas":
  Seligman et al. (2005), *Am. Psychol.* 60(5) — moderada.
- **Privacidade (revisto em 04/10/2026, decisão do dono):** o Caderno vai para o **save na nuvem do próprio
  titular** (`GameState.caderno`; era só `localStorage` na 1ª versão). É **dado sensível**: nunca entra em payload de
  IA/chat, telemetria, métricas, perfil público ou guilda (contrato `cadernoSensivel.contract.test.ts`); sai na
  exportação e some na exclusão da conta; apagável por entrada e por inteiro. `public/privacidade.html` §2 declara
  (PT/EN) e `PRIVACY_VERSION` sobe para `2026-10-04`. Tetos 120 × 2000, sanitizados no load e no `save.js`.
- **Psicologia (veto aplicado):** sem sequência, sem total, sem "faltam", sem lembrete, sem cobrança, sem diagnóstico,
  sem "análise" do texto. Salvar não rende nada além de a entrada ficar guardada. Se o texto casa com o léxico de
  sofrimento (`needsBridge`, o mesmo do chat, **calculado no aparelho**), aparece, sem bloquear nada, a linha de
  apoio (`supportLine`: CVV 188 / `findahelpline.com`) e a frase `crisisLineText`. Escrita expressiva pode
  remexer coisa difícil: o `InfoTip` diz "pare quando quiser; não substitui ajuda profissional".

## 4. Economia (d)

**Sem moedas, XP, selo ou "ato" de hábito.** A expansão de 09/10/2026 adiciona apenas itens de jogo: ao confirmar um foco concluído, 1 item é sorteado igualmente entre os quatro materiais do ambiente e uma quinta opção de comida aleatória (20% cada opção). O próximo item extra tem chance inicial de 5%, +5 pontos percentuais por ciclo foco+pausa concluído, teto de 25%; no máximo 1 extra por foco. Teto diário combinado: 8 itens. Materiais entram em `buildingQuests.materials`, comidas em `foodInventory`; o `focusLoot` no save guarda dia, quantidade e recibos de eventos, para impedir repetição do mesmo timer. O ledger tem forma e teto saneados pelo servidor, mas a concessão segue o modelo client-save; não é uma fonte anti-cheat autoritativa. Os registros "Foquei" continuam locais, sem placar ou total público.

## 5. O timer (Fase 1)

Modos 25/5 e 50/10, estado persistido (`soulmon-foco-timer`) com **`endAt` em timestamp** (nunca contador
cumulativo): o relógio da tela só relê `Date.now()`, então sobrevive a aba em segundo plano e a fechar a folha.
Para iniciar é preciso ter salvo uma sessão com um dos seis ambientes. Ao fim do foco: aviso na tela + notificação local
**só se a permissão já está concedida** (o app nunca a pede aqui) + vibração curta. Ao tocar "Foquei", grava uma
sessão local e credita o item garantido, com eventual extra, no save; ao concluir a pausa, o ciclo aumenta a chance
do próximo extra. Cancelar/dispensar não paga; itens alcançam o teto de oito por dia.

## 6. Decisões do dono (respondidas em 04/10/2026)

Nome "Caderno / Journal": ok. Sem recompensa nenhuma. **Caderno no save na nuvem** (acima). Vibração ao fim do foco
**ligada por padrão**, com interruptor em Configurações › Seus dados. Bustos provisórios Tique/Sépia ficam.

## 7. Acréscimos implementados em 09/10/2026

- O planejamento da sessão começa com uma checklist local, temporária e opcional para preparar o foco: organizar a estação, beber água, comer se estiver com fome, usar o banheiro e silenciar notificações. Não são tarefas canônicas nem geram progresso/recompensa.
- Depois de um timer de foco terminar, a tarefa canônica selecionada pode ser concluída por **“Concluí a tarefa”**, usando o handler compartilhado do jogo. Marcar “Foquei” continua sendo uma ação separada; só ela grava uma sessão de foco.
- O alerta de fim já tinha vibração curta por padrão e notificação se a permissão já existia. O app não toca um alarme automático: a regra D11/S4 do `docs/SOM.md` proíbe som fora de gesto, e a notificação/vibração/aviso visual já oferecem canais de aviso sem autoplay.

## 8. Expedição Pomodoro (09/10/2026)

O Soulmon acompanha o foco a um destes ambientes: Floresta, Costa, Caverna, Jardim, Oficina ou Observatório. Cada cenário tem quatro materiais possíveis, reaproveitados do catálogo de `buildingQuests`; o pool acrescenta uma quinta opção, comida, e sorteia uma comida das categorias normais quando ela sai. Cada opção do pool tem peso igual. Item garantido é pago ao confirmar "Foquei" após o timer; cada ciclo completo foco+pausa sobe a chance do único extra possível daquele foco, sem passar de 25%. O teto diário conta materiais e comidas juntos. O stock usa inventários já existentes; não se criam tipos de material, moeda nem energia.
