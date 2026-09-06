# Renascimento (Rebirth)

> Primeira versão implementada em 06/09/2026. As quatro decisões de forma
> foram do dono, respondidas antes de qualquer linha de código; estão marcadas
> abaixo como **D-R1..D-R4** porque é a partir delas que tudo o mais decorre.

## A ideia

Chegar ao **Ultra** é o fim da escada. O Renascimento é o que existe depois:
a criatura volta a ser um ovo e **o jogador escolhe quem ela renasce**.

A recompensa não é poder — é **autoria**. Em todo o resto do produto a
criatura é o resultado de quem a pessoa É (o Oráculo lê e responde). Aqui, uma
vez só, ela é o resultado do que a pessoa **quer**. É a única tela do app em
que isso acontece, e é de propósito: o controle é o prêmio por ter subido a
escada inteira.

## As quatro decisões

| # | Pergunta | Resposta | O que ela impede |
|---|---|---|---|
| **D-R1** | Volta pra onde? | **Rookie, com cerimônia de ovo** | Reabrir o estágio `egg`, que foi apagado da escada com motivo. O ovo é a TELA, não um estágio jogável — nada em `types/progression.ts` mudou. |
| **D-R2** | O que se perde? | **O estágio e os três atributos. E só.** | Que o Rebirth virasse castigo. A regra geral do produto (perda só sobre item recuperável, nunca sobre identidade ou coleção) continua valendo — o Rebirth é uma TROCA declarada, não uma exceção a ela. |
| **D-R3** | Quem pode? | **Só `accountTier: 'paid'`** | Que a criatura autoral — a única coisa que os Créditos liberam — saísse de graça por outra porta. |
| **D-R4** | Quantas vezes? | **Uma vez só, definitiva** | Que virasse prestígio de idle game. É um momento, não um motor. |

### A consequência aceita de D-R2

`perfectDays` **não** zera. Quem renasce reescala a árvore rápido, e isso é
intencional: o preço do Renascimento é **abrir mão da forma que você tinha**,
não passar meses de castigo para recuperá-la. Um Rebirth que custasse a
progressão inteira seria o botão que ninguém aperta — e um botão que ninguém
aperta é conteúdo que não existe.

## As três escolhas

| Campo | Tipo | De onde saem as opções |
|---|---|---|
| **Criatura** | campo ABERTO (60 chars) | do jogador |
| **Escola** | dropdown, 6 opções | `classSystem.data.json` → `escolas` (snapshot real do Class-System) |
| **Elemento** | dropdown, 2 grupos | 17 bases (`CLASS_ELEMENT_ORDER`) + os pares de 2º nível (`DERIVED_ELEMENT_PAIRS`) |

**Por que o elemento para no 2º nível:** o class-system tem aridade 3 e 4, e o
motor de ficha do Soulmon só replica 1 e 2 (`ficha/types.ts`). Oferecer uma
tripla seria prometer no menu o que a cozinha não faz.

## Como as escolhas viram consequência

Não adianta a tela existir se a escolha não chega ao jogo. São **três** fios,
e cada um tem teste:

1. **Orçamento** — `RebirthBoost.multiplier` (= `REBIRTH_BUDGET_MULTIPLIER`,
   **1.5**) multiplica o orçamento em `budgetForStage` e o de elementos. Como
   o orçamento já é `ROOKIE_BUDGET × STAGE_MULTIPLIER`, a multiplicação vale
   em **todos** os estágios por composição — que é exatamente a promessa
   ("mais pontos no primeiro nível e, por consequência, nos próximos").
   *1.5 e não 2*: dobrar, num sistema com `CUSTO_PONTO_PAR`, destrava geração
   adiantada e faz o rookie renascido ler como um mega — apagando a escada que
   o jogador vai subir de novo.
2. **Escola** — piso garantido: a escola escolhida termina com a MAIOR
   pontuação da ficha. Sem o piso, escolher `evocacao` não faria nada (ela tem
   valor fixo e não entra na distribuição), e escolher sem ver diferença é o
   pior resultado possível de uma tela de escolha.
3. **Elemento** — entra como **viés** na participação, nunca como pontos
   avulsos: a alocação continua sendo a mesma função com as mesmas garantias
   de soma. Um PAR vira viés nos **dois componentes**, porque é assim que a
   cascata (`cascataDosPares`) destrava o par de verdade — escrever o par
   direto na ficha seria o par sem o caminho até ele.

E o **prompt**: as três escolhas entram nas **11 formas**, nas duas variantes
(com e sem referências de gênero). O texto livre do jogador vai **entre
aspas** — delimitar é o que impede "descreva sua criatura" de virar "ignore as
instruções acima" —, e passa antes por `sanitizeCriatura`, que colapsa espaço
e mata quebra de linha e cerca de código. A cláusula
`Do not copy any existing franchise character` continua nas duas variantes.

## Onde cada coisa mora

| Peça | Arquivo |
|---|---|
| Regra, elegibilidade, catálogos, `applyRebirth` | `src/utils/rebirth.ts` (PURO) |
| Efeito na ficha | `src/utils/soulProfile/ficha/buildSheet.ts` (`RebirthBoost`) |
| Efeito no prompt | `src/utils/oracle.ts` (`OracleInput.rebirth` → `rebirthClause`) |
| A cerimônia | `src/components/RebirthModal.tsx` |
| Fiação e geração | `src/App.tsx` (`handleRebirth`) |
| Registro no save | `GameState.rebirth` (`RebirthRecord`) |
| Contrato | `src/utils/rebirth.test.ts` |

## O que NÃO fazer

- **Não zere nada além de estágio e atributos.** Há teste listando campo por
  campo; se ele cair, alguém transformou uma troca em castigo.
- **Não reintroduza o estágio `egg`** achando que o Rebirth precisa dele. Não
  precisa — a cerimônia é a tela.
- **Não tire a idempotência de `applyRebirth`.** Um updater do React roda duas
  vezes (footgun 6), e a segunda passada não pode zerar de novo atributos que
  o jogador já reconquistou.
- **Não gere depois de gravar.** `handleRebirth` gera a criatura ANTES de
  tocar no save: um perfil corrompido faz a geração lançar, e consumir a
  chance única sem entregar criatura seria a pior falha possível deste app.
- **Não amplie o campo aberto** sem repensar a higienização: ele entra em
  prompt de gerador de imagem, e texto longo não é criatividade, é espaço para
  instrução.

## Aberto (próxima rodada)

- **A arte do ovo.** Hoje a cerimônia é texto e escolha; falta o casulo/ovo
  como cena, que é o que dá peso ao momento.
- **Telemetria.** Nenhum evento é emitido no Rebirth. Como ele é o degrau
  final, é justamente o que se quer medir (quantos chegam, quantos apertam).
- **O que o pet fala ao renascer.** O canal de fala existe (`triggerMessage`)
  e o Rebirth não o usa.
