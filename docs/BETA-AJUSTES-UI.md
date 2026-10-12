# Ajustes de UI do beta — pedidos do dono (11/10/2026)

> **Origem:** ditado do dono (voz, com erros de reconhecimento: "Solmon" = Soulmon, "stroll" = Passeio,
> "Hall" = Hall/Guilda). **Branch:** `fix/beta-ajustes-ui` (base `release/beta-1`).
> **Evidência:** `product/beta-play-01/builder/ui/` (`antes-*` e `depois-*`, 390×844).
> Cada decisão abaixo é uma INTERPRETAÇÃO; o que ficou em dúvida está na última seção.

## 1. Home

| Pedido | O que foi feito | Dono |
|---|---|---|
| Mochila "aparecendo lá em cima" | A mochila do **Passeio** (arte ao pé do pet quando há destino) usava `bottom: PET_GROUND_KEEP + PET_LIFT + …`, mas `bottom` é relativo à caixa do sprite (cujo fundo já é o pé). Resultado: ~100 px acima do pet, boiando junto à janela. Agora `bottom = 0,3 × PET_RENDER` (nas costas). | `CompanionHUD.tsx` |
| Balão cortado ao dar banho | O balão do banho ficava a `50% − 78px`, ~35 px **acima** do topo visível do palco (250 px, `overflow: hidden`): só um pedaço aparecia. Passa a `50% − 46px` (o valor que já valia com o botão Evoluir), dentro do palco. | `CompanionHUD.tsx` |
| Hoje/Semanal em abas, Semanal cortada | **Abas removidas.** Lista única: em cima o que **vence hoje**; abaixo de uma linha separadora, **"Programadas"** (existe, mas não vence hoje, ex.: "a cada 30 dias" fora do dia). Quem decide "vence hoje" é `habitCountsOn` (dono único da pergunta, `utils/habitRhythm.ts`) — a mesma da meta/dia completo; antes a lista lia `weekDays`, que é `[0..6]` para os modos flexíveis, e por isso o mensal aparecia todo dia. Hábito feito hoje fica na lista de hoje mesmo que a regra o dispense. | `DailyRituals.tsx` |
| Semanal reduzido | Hábito "N× por semana" mostra só **"0 de 3 esta semana · +10 XP base"**. Saíram: "3× por semana", "3 etapas" (nos semanais), o chip "Semana: 0 de 3" duplicado e o "O check vale só para hoje". Hábito sem semanal mantém "frequência · XP". Programadas: dimmed, sem prévia de XP, sem cobrança. | `DailyRituals.tsx` |
| "Caminho até a próxima forma" | Sai da Home. Fica só no Perfil/Evolução (`EvolutionPath`). `EvolutionGaugeMini` segue no repo, sem uso na Home. | `App.tsx` |

## 2. Masmorra / Passeio

- **Masmorra:** a seção "Pode cair" saiu do corpo da folha e virou lista dentro do **(i)**
  ("Como funciona" + "Pode cair"). Mesmas constantes (`clearBonus`, `HEART_DROP_CHANCE`…). `play/PlaySheets.tsx`.
- **Passeio — card da missão em uso**: duas etapas inequívocas. (1) **Destino** ("Destino de hoje à noite" + a imagem
  da região — é aqui que mora a imagem). (2) **O que você faz** ("Faça isto hoje, para o Soulmon fazer o passeio à
  noite" + título + texto + versão pequena) — **sem nenhum ícone** (saíram o glifo da área e o "?" de andamento).
  `play/PasseioSheet.tsx`.

## 3. Mapa (posições = dono único `utils/areaSheetCopy.ts` `HALL_LOTS` e `utils/playAreaLots.ts`)

Os "prédios" do ditado são **lotes das áreas** (Hall, Exploração, Jogos), não as 6 construções do Mapa raiz.

- **Hall:** Guilda **maior** (44→58%) e **centralizada** (50%); Feira passa para o **fundo**, entre Biblioteca e Círculo
  (50%/22%) e vem **primeiro na lista** de propósito (a ordem do array é a ordem de pintura — quem vem antes fica atrás);
  Biblioteca e Círculo descem (40→47%).
- **Exploração:** o Caderno ("Jornal") sobe para **entre a Masmorra e a Oficina do Foco** (30%/54%): coluna da esquerda com
  3 prédios; o canto de baixo à direita (onde ele estava) fica **LIVRE, reservado** a um prédio futuro. Arte do Caderno:
  volta ao **tinteiro com a pena** (`lote-exploracao-caderno.png`, já em disco; o chalé campina "não dizia caderno") e,
  como essa arte é teal sobre teal (o que o dono já tinha reclamado), ganha um **halo claro** (`LOT_HALO` em `nav/AreaScene.tsx`,
  só filtro CSS) — sem arte nova; `LOT_ART_BOUNDS` atualizado.
- **Jogos:** Salão **mais ao centro** (31→44%); Ateliê da Mente **desce** para a clareira de baixo, abaixo da escada e
  um pouco à direita (64%/55%); o Refúgio desceu 2% (82→84%) só para o par Ateliê × Refúgio não se tocar em telas de 360×740.
- **Guardas verdes:** `areaLotGeometry.contract` (nenhum par de alvos de toque se encosta, 5 viewports; proporção
  24–70%; caixa opaca = PNG), e os testes de ordem dos lotes do Hall foram atualizados (Feira primeiro).

## 4. Missões diárias

- O **"!" sai da frente de "Hoje"** (título da seção). Fica só na linha da missão. (`data-quest-mark` da seção continua
  no DOM — é contrato de estado.) `nav/MissionsSheet.tsx`.
- **"Faça um passeio" vira link**: leva ao **prédio do Passeio** (fecha o menu, `exploracao` com a folha do lote
  aberta — o mesmo mecanismo do "Ir lá" da Mochila). `nav/StrollQuestLine.tsx` + `App.tsx` (`irAoPasseio`).
- **"Aspas / o que tem na exclamação":** o ícone "!" da Home tinha `title="Missões diárias, Missão disponível"` — o
  balãozinho nativo do navegador, com texto "estranho" colado no ícone. Removido o `title`; o nome falado fica só no
  `aria-label`. `nav/MissionsLink.tsx`.

## 5. Modais: clicar fora fecha

**Um dono só: `ModalSheet` (`form/FormKit.tsx`)** — prop `dismissOnBackdrop` (padrão `true`; padrão `false` quando
`closeSide="end"`, porque ali o fechar ENCERRA uma atividade em andamento). O toque tem de **começar e terminar no
véu** (arrastar uma seleção de texto de dentro para fora não fecha).

**Bloqueiam DE PROPÓSITO (continuam como estavam):**

| Folha | Por quê |
|---|---|
| `ConfirmDialog destructive` | confirmação destrutiva (não-destrutivo fecha = cancela) |
| `RebirthModal` | confirmação destrutiva (renascer) |
| `CreateModal`, `EditModal`, `TaskEditModal` | formulário com texto digitado — toque fora perderia o que a pessoa escreveu |
| `UnlockAccountModal` | formulário de conta |
| `closeSide="end"` (minijogos) | o fechar encerra a atividade |
| `RitualDialog` (check-in, sonho, relatório, cerimônias), `LevelUpOverlay`, `EvolutionCeremony`, `MilestoneCeremony`, confirmações de sair do jogo (`GameKit`/`BattleStage`), `SoulmonOnboarding`, `GameTutorialFlow` | rituais/cerimônias e fluxos obrigatórios: pedem o gesto explícito |

Já fechavam pelo véu (não mudaram): `AreaSheet` (lotes), `Mochila`, lightbox do `ShopItemSheet`, `ForgeCard`, `TalentTree`.

## 6. Dúvidas que sobraram (para o dono)

1. **"Aspas na exclamação"**: interpretado como o `title`/tooltip do ícone "!". Se era outra coisa (ex.: texto da linha do
   Caderno, "Faça um registro no journaling"), diga qual.
2. **Jornal**: troquei a arte do lote (tinteiro com a pena). Se "ícone" era o do menu de Missões (📓), é outro ajuste.
3. **Formulários** (criar/editar hábito e tarefa): ficam sem fechar no toque fora, para não perder texto. Quer fechar também?
4. **"Três de cada lado"** na Exploração: com 4 lotes ficou 3 à esquerda (Masmorra, Caderno, Oficina) e 1 à direita
   (Passeio) + o canto de baixo livre.
5. A linha **"Faça um registro no journaling"** (Caderno) não navega ao prédio (só o Passeio foi pedido).
