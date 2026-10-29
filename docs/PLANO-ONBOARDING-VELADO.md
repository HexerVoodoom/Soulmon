# Plano — Onboarding do Velado, forma BB e CORE

> Etiqueta: **plano** (29/10/2026). Nada aqui está implementado. Este documento é o
> briefing da sessão que vai executar. Decisões do dono tomadas em 29/10/2026 (modais
> desta sessão) estão marcadas **[D]**; o que ainda depende dele está em §9.
> Vale a partir da **versão oficial**; até lá roda atrás de interruptor (§7).

## 1. Objetivo

Trazer a **evolução** para o primeiro dia (hoje ela demora semanas para aparecer) e
abrir o jogo com uma sequência narrativa curta que ensina o laço central:
**cumprir uma tarefa real dá força ao Soulmon**.

## 2. Decisões já tomadas [D]

| # | Tema | Decisão |
|---|---|---|
| D1 | Oráculo | Passa a ser um **Velado ancião** (arquétipo de mentor que apresenta a missão; inspiração livre, sem citar nome de franquia nos prompts nem copiar silhueta). O bichinho atual do oráculo vira **o Soulmon dele**. |
| D2 | Forma nova | **BB**, anterior a rookie. Simples: sem as regras das outras formas. |
| D3 | HP do BB | **6 corações**, e **não perde nada** (virada, fome, cocô). Fase-vitrine. |
| D4 | Evolução do BB | Evolui ao atingir **Vínculo nível 2** (`bondLevelFor`, XP de tarefa). |
| D5 | BB trancado em | **Torneio, Duelo PvP e Guilda (missão/guerra)**. Masmorra, Arena e Pesadelo ficam abertos. |
| D6 | Geração grátis | **1 por e-mail**, para sempre (apagar a conta e refazer não devolve). O sprite fica **associado ao e-mail**: quem recria a conta recebe o MESMO. |
| D7 | O que se gera | **BB na criação; rookie sob demanda**, só quando o BB está prestes a evoluir (paga a 2ª imagem só de quem voltou). |
| D8 | Free depois do BB | **Evolui até rookie e trava**; dali a evolução pede a compra. |
| D9 | Preço | Desbloqueio completo **US$ 1,99 / R$ 9,90** (hoje R$ 29,90 / US$ 6,99). |
| D10 | Iniciais prontos | **Continuam no modo DEMO** (e como reserva quando a geração falhar). |
| D11 | "Você fez de verdade?" | Pergunta **sem castigo**: "ainda não" → o ancião espera ("vamos juntos, faço companhia"); "sim" → avança. |
| D12 | Pular | **Pula a fala, não as etapas**. Puzzle, tarefa e duelo são obrigatórios; "Rever a história" nas Configurações. |
| D13 | Puzzle | **Match-3 com meta mínima** + `GameTutorialFlow` após erros repetidos. |
| D14 | CORE | **CORE é o mapa atual** da Home (Hall, Mercado, Oficina…): muda nome e apresentação. |
| D15 | Reset oficial | **Arquivar e recomeçar**: todo save do beta é copiado para arquivo; compras e Créditos reais são mantidos. |
| D16 | Duelo do onboarding | Dupla (jogador + ancião) contra o Desfeito e o Soulmon-pesadelo dele. **Quem toma dano é o ancião**, nunca o jogador. A luta corta em ~⅓ da vida do inimigo. |

## 3. O roteiro (sequência de interações, não vídeo)

| # | Cena | Interação | Reuso |
|---|---|---|---|
| 0 | Ritual do oráculo | perguntas atuais, conduzidas pelo ancião | `SoulmonOnboarding.tsx` |
| 1 | Nascimento | geração do BB (API) → ovo/reveal | `OnboardingOvo`, `generate-sprite.js` |
| 2 | "Acorde…" | tela preta, fala do ancião, **música de suspense**; clareia: o ancião com a mão estendida, num lugar da Malha | `musica.ts` (faixa nova) |
| 3 | Fuga | o Desfeito persegue no escuro; **glitch / pixels se desfazendo** na tela | overlay novo (base: `dungeon-vhs`) |
| 4 | A parede | Match-3 fácil; após N erros entra o passo a passo | `Match3Game`, `GameTutorialFlow` |
| 5 | A bifurcação | escolha de caminho (cosmética; pode virar sabor de lore) | — |
| 6 | O Desfeito alcança | ancião pede **uma tarefa real**; a lista de tarefas abre; "você fez de verdade?" (D11) | lista de atividades |
| 7 | Duelo em dupla | dano só no ancião; corta em ⅓ | `NightmareBattle` + modo 2v1 **novo** |
| 8 | Resgate | Velado da Mão lança a **lanterna-granada** (clarão turquesa); fogem | animação nova |
| 9 | CORE | apresentação da cidade → Home normal | mapa atual renomeado |

⚠️ A cena 6 exige que a pessoa já tenha **cadastrado** ao menos uma tarefa. O ritual
atual já pergunta objetivos; a sessão de execução precisa garantir que a criação de
1ª tarefa venha ANTES da cena 6 (ou dentro dela, com o ancião ajudando a escolher uma
pequena).

## 4. A forma BB — regra

- Estágio novo `bb` em `src/types/progression.ts`, **antes** de `rookie`. HP máx 6.
- **Sem**: requisito diário, gauge de evolução, perda de coração, dreno de cocô/fome,
  folga semanal. É o único estágio em que `computeDailyReset` não cobra nada.
- Evolução: `bondLevelFor(totalXP) >= 2` habilita a cerimônia (manual, como hoje).
- Trancado (D5) com recusa motivada, no padrão de `rebirthRefusal`.
- Servidor: espelho em `functions/api/_*.js` (Torneio/Duelo/Guilda recusam BB) com
  teste de paridade. Save: leitura tolerante + migração idempotente (regra 1 de
  Compatibilidade do `CLAUDE.md`). `saveCompat.contract.test.ts` precisa da linha nova.
- ⚠️ O `CLAUDE.md` diz que um estágio antes de rookie "não foi reintroduzido" e lista
  o custo (sprite, HP, requisito, masmorra). Esta decisão revoga isso só para `bb`;
  a sessão de execução registra no `REGISTRO-DE-DECISOES.md` e atualiza o `CLAUDE.md`.

## 5. Geração grátis por e-mail (D6/D7)

- Chave no servidor: `freeGen:<saveId>` (saveId já é SHA-256 do e-mail). Guarda a URL
  do BB e, depois, a do rookie. **Nunca é apagada** junto com a conta — é o que
  impede refazer a conta para gerar de novo e o que devolve o MESMO sprite.
  ⚠️ Privacidade: guardar o hash (não o e-mail) e declarar na política, porque
  sobrevive à exclusão de conta. Validar com `PRIVACY_VERSION` se for material.
- O rookie sob demanda dispara quando Vínculo ≥ 2 é atingido (ou ao abrir a cerimônia),
  com fallback para um inicial pronto se o provedor falhar.
- Custo: medir em `custo-geracao-sprite.md` (Higgsfield 2.0 Alpha) × projeção de contas.

## 6. Monetização (D8/D9)

- Free: BB → rookie de graça; a partir de rookie, `canEvolve` exige `accountTier:'paid'`
  e a cerimônia mostra o `UnlockNudge` (motivo novo `evolve-free`).
- Preço: trocar `FULL_UNLOCK_PRICE_LABEL(_USD)` + Play Console + `publishedPrice.test.ts`.
- Linha vermelha que continua: dinheiro nunca compra cuidado nem HP.

## 7. Como testar em paralelo

Interruptor `ONBOARDING_VELADO` (servidor decide, por lista de e-mails de teste),
desligado em produção. O beta segue igual. No lançamento oficial: liga + reset (D15).

## 8. Ordem de execução sugerida (uma sessão por bloco, cada um com PR)

1. **Roteiro e copy** (EN primeiro, PT depois) — `/squad-narrativa`.
2. **Forma BB** — regra, save, servidor, testes, guia (`GuideModal`/`HelpModal`).
3. **Geração por e-mail** — `freeGen`, rookie sob demanda, fallback, política.
4. **Player de sequência** + cenas 2/3/5/8/9 (glitch, música) — atrás do interruptor.
5. **Puzzle e tarefa** (cenas 4 e 6).
6. **Duelo 2v1 com dano só no ancião** (cena 7).
7. **Arte e som** — `/squad-arte` (ancião, Desfeito, Soulmon-pesadelo, Velado da Mão,
   lanterna-granada, prompt do BB fofinho e redondo) e `/squad-som` (faixa de suspense).
8. **Preço e trava de evolução do free**.
9. **Reset oficial** (arquivo dos saves, preservação de compras) — só no lançamento.

## 9. Ainda depende do dono

- Nome do ancião e do Velado da Mão (EN primeiro).
- Se a bifurcação (cena 5) muda algo (ex.: inclina o caminho Poder/Harmonia/Benevolência).
- Data do lançamento oficial (dispara §7 e D15) e aviso aos testadores.
- Aprovar o texto da política de privacidade sobre o hash que sobrevive à exclusão.

## 10. Brainstorm (ideias extra, não decididas)

- **Ancião como NPC fixo na CORE**: depois do onboarding, ele mora num prédio e entrega
  a 1ª missão semanal — reaproveita a arte e dá continuidade.
- **O Desfeito volta**: o mesmo Desfeito reaparece como chefe da Feira mais tarde
  (gancho narrativo sem custo de regra).
- **Pré-gerar o rookie em segundo plano** só quando Vínculo chegar a 1, para a
  cerimônia não esperar a API.
- **Cartão de compartilhar** a 1ª evolução (BB → rookie lado a lado) — canal de
  distribuição, que é o gargalo do projeto.
- **Telemetria do funil**: medir onde a pessoa para no onboarding (cena a cena) para
  decidir o que encurtar.
