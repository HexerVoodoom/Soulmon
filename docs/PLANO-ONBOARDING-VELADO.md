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
| D9 | Preço | Desbloqueio completo **US$ 3,99 / R$ 19,90** (hoje R$ 29,90 / US$ 6,99). ⚰️ Era US$ 1,99; revisto no mesmo dia pela conta do §6.1. |
| D17 | Custo do pagante | **Formas sob demanda**: só o galho que o jogador alcança é gerado (pior caso cai de 15 para ~8 imagens). |
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

### 6.1 Reanálise do preço (29/10/2026)

O dono pediu para refazer a conta: custo de TODOS os sprites (com 3 rerolls do rookie),
margem e o subsídio de quem gera até o rookie e para.

**Premissas** (trocar quando houver dado real):

| Item | Valor | Fonte |
|---|---|---|
| Custo por imagem | **US$ 0,024** (Higgsfield 2.0 Alpha, low, 1k) | medido, `INVENTARIO-ASSETS.md` (NPCs do Torneio) |
| Margem de segurança (falha, refação por recusa, fallback) | ×1,3 | estimativa |
| Taxa da Play | 15% (programa para pequenos devs) | Play Console |
| Impostos/IOF no BR (sobre o líquido) | ~10% | estimativa — confirmar com contador |
| Chat de IA por pagante, vida útil | ~US$ 0,10 | review de monetização 03/08/2026 (Groq barato) |

**Custo por perfil:**

| Perfil | Imagens | Custo (×1,3) |
|---|---|---|
| Grátis que para no BB | 1 | US$ 0,031 |
| Grátis que chega ao rookie | 2 | US$ 0,062 |
| **Grátis médio** (50% chegam ao rookie) | 1,5 | **US$ 0,047** |
| **Pagante** — BB + rookie + 3 rerolls + 10 formas restantes (pior caso: árvore inteira) | 15 | US$ 0,47 + chat 0,10 = **US$ 0,57** |

**Custo total por pagante** = custo dele + subsídio dos grátis (grátis por pagante =
(1 − conversão) / conversão):

| Conversão grátis→pago | Grátis por pagante | Subsídio | **Custo por pagante** |
|---|---|---|---|
| 2% | 49 | US$ 2,30 | **US$ 2,87** |
| 3% | 32 | US$ 1,52 | **US$ 2,09** |
| 5% | 19 | US$ 0,89 | **US$ 1,46** |
| 8% | 11,5 | US$ 0,54 | **US$ 1,11** |

**Receita líquida por preço** (após 15% da Play e ~10% de imposto ≈ 76,5% do bruto):

| Preço | Líquido | Margem a 3% de conversão | Margem a 5% |
|---|---|---|---|
| US$ 1,99 / R$ 9,90 | US$ 1,52 | **−37%** (prejuízo) | **+4%** |
| US$ 2,99 / R$ 14,90 | US$ 2,29 | +9% | +36% |
| US$ 3,99 / R$ 19,90 | US$ 3,05 | +31% | +52% |
| US$ 4,99 / R$ 24,90 | US$ 3,82 | +45% | +62% |
| US$ 6,99 / R$ 29,90 (hoje) | US$ 5,35 | +61% | +73% |

**Leitura:**
- A US$ 1,99 o produto **só fecha a conta se ≥ 5% dos grátis comprarem**, e com margem
  quase zero. A 3% (comum em app freemium), cada venda dá prejuízo.
- O subsídio do grátis é o que mais pesa (mais que os 15 sprites do pagante). As
  alavancas que mais mexem: **conversão** e **custo do grátis**.
- Alavancas para baixar o custo do grátis: gerar o BB num modelo mais barato; só gerar
  o rookie de quem voltou no dia 2 (já é D7); limitar a geração grátis por aparelho além
  do e-mail (contas descartáveis).
- Alavanca para o pagante: gerar as formas **sob demanda** (só o galho que ele de fato
  alcança), o que corta o pior caso de 15 para ~8 imagens.
- Os Créditos (reroll extra, troca por Bits) são receita **adicional** e não entram
  nesta conta.

**Faixa recomendada para decisão:** US$ 3,99 / R$ 19,90 (margem saudável já a 3%),
ou US$ 2,99 / R$ 14,90 com geração sob demanda + meta de conversão ≥ 5% medida na 1ª
semana. **Decidido (29/10/2026): US$ 3,99 / R$ 19,90 + formas sob demanda (D9, D17).**

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
