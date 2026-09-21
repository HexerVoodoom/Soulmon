# Contrato — SQUAD-SOM (Soulmon)

Fonte única da verdade de como os agentes da squad de som, o orquestrador e o método se
encaixam. **Instância da SQUAD-Alpha**, com contexto Soulmon embutido — não é whitelabel.

- **Molde:** `C:\Users\spera\.claude\skills\squad-alpha\CONTRACT.md` (§1 formato de agente,
  §5 estado e artefatos, §6 checkpoint).
- **Método:** `METODO.md` **nesta pasta** — só os **deltas** de áudio sobre o método da Alpha.
- **Prefixo dos agentes novos:** `som-` → `D:\Soulmon\repo\.claude\agents\som-*.md`.
- **Workdir de runs:** `squad-alpha-runs/` (o run `som-01` já existe).
- **Bloco de contexto:** `squad-alpha-runs/som-01/contexto.md` — **obrigatório no briefing de
  todo agente, sem exceção**.

---

## 1. Formato de arquivo de agente

Idêntico ao `CONTRACT.md` §1 da Alpha, com uma diferença: a **regra whitelabel não se aplica**
ao prefixo `som-`. Estes agentes são instância e **citam** Soulmon, D11, `sounds.ts` e o
ledger de vetos por nome — é isso que os torna úteis aqui e intransportáveis para outro
contexto.

- Frontmatter DEVE ter `name`, `description` (1 parágrafo, incluindo os **NÃO faz** e para
  quem encaminha), `model` explícito e `tools` declarado.
- Corpo DEVE ter os H2 nesta ordem exata:
  `## Mandato` · `## Entradas` · `## Framework Operacional` · `## Barra de Qualidade` ·
  `## Anti-Padrões` · `## Handoffs` · `## Voz`.

---

## 2. Roster canônico da instância

### Agentes novos (3) — `som-*`

| id | model | disciplina | lidera nas fases | pergunta que possui |
|---|---|---|---|---|
| `som-diretor-sonoro` | opus | Direção sonora: DS sonoro, teste da identidade, **regra de disparo** do sistema adaptativo | 0 · 1 · 2 · **aprovação obrigatória do lote no gate da 3** | "que som este produto faz — e o que merece silêncio?" |
| `som-produtor-assets` | sonnet | Procedência e conformidade de todo asset | 1 · 2 · 3 · **5** | "o arquivo existe, mede contra a spec e tem procedência?" |
| `som-engenheiro-audio` | opus | Camada de reprodução **e mixagem**; dono único de **loudness** e de **codec** | 1 · 2 · 3 · **5** | "quando o app pode fazer barulho, e o que se ouve quando tudo toca junto?" |

### Agentes do repositório reusados (7) — `.claude/agents/`, sem clone

| agente | o que ele possui **neste run**, e o que ele **não** possui |
|---|---|
| `soulmon-guarda-vinculo` | **Dono de D11 como regra** e de presença/push/widget. **Veto bloqueante nas Fases 0 e 2 — não liderança**: guarda custodial que lidera autoria passa a julgar a própria fronteira. **Não possui critério auditivo** — não lhe peça "isso soa como companheiro?"; peça "isto viola D11 ou a regra de push?". Em dúvida sobre se um som é *presença* ou *sistema*, **prevalece ele**. |
| `soulmon-ip-brand-guardian` | §6 é literalmente o mandato dele — já audita `src/utils/sounds.ts`, prompts como obra derivada e os termos comerciais do gerador. Ocupa o lugar de `alpha-compliance`. **Melhor reuso do lote.** |
| `soulmon-guarda-medicao` | Telemetria e privacidade. Lidera a Fase 4 — que **pode não abrir** (lacuna 10, métrica de áudio não instrumentada, ainda aberta). A squad **propõe** o evento de som; ele decide se pode existir. |
| `soulmon-guarda-linha-vermelha` | Veto formal **onde o som toca regra, D11, push ou dado**. Por texto próprio, *"copy, animação e refactor não passam por você"* — **não conte com ele para vetar um SFX por fadiga ou estética**. |
| `soulmon-behavioral-psychologist` | "Companheiro ou chefe?"; som não solicitado como punição. Revisor obrigatório do **corte** de eventos da Fase 0. Ocupa `alpha-comportamento`. |
| `soulmon-visual-designer` · `soulmon-design-lead` | Coerência do eixo sonoro com o DS visual **canônico**. |
| `alpha-architect` (global) | ADR, se a stack de áudio mudar (§10). Também revisa o **script de medição** contra BS.1770 antes do primeiro lote. |
| `staff-frontend` | UI de controle de som e superfície React/TS. O grafo é do `som-engenheiro-audio`. Briefing carrega os footguns do `CLAUDE.md`. |
| `alpha-qa` (global) | Suíte e os três portões (`tsc` · `vitest` · `build`). |
| `alpha-security` (global) | Parecer curto na Fase 0: o escopo de dados mudou? (§10 tira microfone.) |
| `alpha-skeptic` (global) | **Só** para a premissa arriscada da Fase 1 (pre-mortem **de produto** — não serve como crítica de asset ou de lote). Foi quem atacou de fato no som-01 (`discovery/ataque-gate*.md`). |
| `alpha-estrategista-negocio` (global) | **Custo** (conta do gerador, custo por usuário). **Não** orçamento de bytes — esse é do `alpha-perf-a11y`, dono único. |

> Governança 21/09/2026 (`docs/reviews/2026-09-21-qa-geral/13-governanca-agentes.md` §8): os genéricos do repo (`principal-architect`, `qa-sweeper`, `security-architect`) e os agentes do maestro (`soulmon-devils-advocate`, `soulmon-tech-feasibility`) foram cortados; os `alpha-*` globais acima ocupam os lugares.

**Regra de despacho do agente de auditoria** (`soulmon-ip-brand-guardian`): ele nasceu numa auditoria em
ondas e carrega no corpo `Onda N`, `docs/squad/00-BRIEFING.md`, `docs/squad/01-RUBRICA.md`,
rubrica `D10`–`D13` e entregável em `docs/reviews/<data>/`. **Nada disso existe em `som-01`.**
Todo briefing para ele neste run declara, textualmente:

> *"Ignore a numeração de onda, a rubrica e o caminho de entregável do seu arquivo. Sua
> entrada é `squad-alpha-runs/som-01/contexto.md` e sua saída é
> `squad-alpha-runs/som-01/<fase>/<seu-id>.md`."*

Sem essa linha, o artefato nasce no diretório errado e o agente tenta pontuar dimensão
inexistente.

### Não usados neste run (registrado para não haver dúvida)

`soulmon-product-designer`, `soulmon-monster-taming-designer`, `soulmon-guarda-constancia`,
`soulmon-guarda-nascimento`, `soulmon-guarda-permanencia`, `soulmon-guarda-sustento`,
`design-critic`, nem os globais `alpha-product-manager`, `alpha-growth`,
`alpha-estrategista-negocio` (fora do custo), `alpha-backend`.
(A squad do maestro — `soulmon-maestro`, `-product-manager`, `-user-researcher`, `-retention-analyst`,
`-growth-aso`, `-monetization-strategist`, `-mobile-game-designer`, `-gamification-expert`,
`-productivity-expert`, `-ai-companion-designer` — e os genéricos `business-strategist`,
`growth-engineer`, `investor-skeptic`, `product-manager`, `product-designer`, `staff-backend`
não existem mais no repo desde 21/09/2026.)

Motivo comum: §10 (marketing/ASO/voz fora de escopo), §8 (áudio é 100% cliente, sem backend),
§2 (o alvo é o eixo sonoro, não uma revisão de produto).

### Lane de marca — **NÃO ABRE**

§7 do contexto declara o design system visual **canônico**. A lane só abre quando o DS é
**inexistente**. O que falta é o eixo sonoro de um sistema que já existe — extensão, não marca
nova.

---

## 3. Dependências externas

Os agentes `alpha-*` abaixo **não são clonados** — clonar quase-cópias genéricas infla mais do
que resolve. Mas eles também **não são herança silenciosa**: `instanciar-squad.md` proíbe
instância que *"herda a Alpha por importação"*, porque a Alpha muda e a instância quebra sem
ficar vermelha. Por isso a dependência é **declarada aqui**, com a linha de mandato de que
dependemos e a data em que foi conferida. **Quando a Alpha mudar, a quebra tem de ser
ruidosa** — que é a única propriedade que a herança viva não tem.

| id | arquivo | a linha de mandato de que dependemos | conferida em | o que quebra se sumir/mudar |
|---|---|---|---|---|
| `alpha-orquestrador` | `~/.claude/agents/alpha-orquestrador.md` | conduz as 6 fases, despacha com bloco de contexto, gateia, **não avança sem aval humano** | 08/09/2026 | o run perde o condutor e os checkpoints; a squad não tem orquestrador próprio |
| `alpha-skeptic` | `~/.claude/agents/alpha-skeptic.md` | ataca todo artefato antes de todo gate; objeção classificada fatal/fixável/ruído | 08/09/2026 | os gates de fase viram autoavaliação |
| `alpha-governanca` | `~/.claude/agents/alpha-governanca.md` | saúde do roster, sobreposição, ROI de mudança arquitetural | 08/09/2026 | ninguém reavalia o corte do `som-critico-de-escuta` (lacuna 8) nem vigia a taxa de aprovação do gate humano |
| `alpha-benchmark` | `~/.claude/agents/alpha-benchmark.md` | benchmark **com fonte citada e data**; não afirma dado de mercado sem fonte | 08/09/2026 | a identidade sonora nasce sem confronto com o gênero |
| `alpha-requisitos` | `~/.claude/agents/alpha-requisitos.md` | classifica obrigatório / desejável / opcional com critério de aceite testável | 08/09/2026 | a trilha vira requisito do perfil que não a quer (§3) |
| `alpha-redator-ux` | `~/.claude/agents/alpha-redator-ux.md` | microcopy na voz e no letramento declarados no contexto | 08/09/2026 | o rótulo de controle de som nasce sem PT-BR + EN (§5) |
| `alpha-perf-a11y` | `~/.claude/agents/alpha-perf-a11y.md` | mede na condição real declarada; **não estima número que não mediu** | 08/09/2026 | **fica sem dono o orçamento de bytes** — e ele é o dono único (§5, `dist/` commitado) |

**Regra:** antes de abrir uma fase, o orquestrador confere que os 7 arquivos existem. Ausente
= **parada**, não improviso. Um agente `alpha-*` cujo mandato mudou e não bate mais com a
linha acima é **lacuna a levar ao checkpoint**, não algo a contornar em silêncio.

`alpha-mentor-metodo` **saiu do roster**: lidera zero fases, "sob demanda" não é gatilho, e o
método deste run vive local em `METODO.md`. `alpha-delivery-ops`, `alpha-curador-de-contexto`
e `alpha-briefer` também não entram — não há rastreador (§8), o contexto já está resolvido, e
a instanciação é este documento.

---

## 4. As regras que a squad herda e não reabre

**RS-3 · Som nunca é mecânica.** Nenhum som escala com contagem de tarefas (#16); nenhum som
responde à **qualidade** do sono (#12); nenhum som é vendido como proteção, redução de dano ou
silêncio (#13); nenhum som sazonal desaparece anunciando perda (#15).

**RS-4 · Nenhum texto do usuário entra em prompt de geração** (D8 / #18): nem `soulGoal`, nem
`soulStruggle`, nem texto de tarefa, nem `petName` digitado, nem humor, nem resposta do
psicométrico. Verificado por execução, no mesmo teste que checa a linha de
`docs/Attributions.md`.

**RS-5 · São 21 proibições, não 20** (`docs/plano-melhorias/ledger/vetos.md`, a #21 entrou em
02/09/2026). A pergunta do guarda da linha vermelha usa 21.

**Trilha contínua com autoplay: VETADA** (D11 por extensão — *"a fronteira da D11 é o pacote
inteiro"*, `src/utils/sounds.ts`). **A trilha EXISTE — decidida pelo dono em 08/09/2026,
registrada como S2 em `docs/REGISTRO-DE-DECISOES.md` §6.1**, que é a fonte canônica: ela
**nasce desligada** e só toca **após gesto explícito do usuário**; nunca em `document.hidden`.
Restrição operacional que a decisão impõe: **o estado da trilha persiste separado do `mute`
global**, porque hoje o som **nasce ligado** (`readFlag` devolve `false` quando a chave não
existe) — coerente para SFX por gesto e **incompatível** com trilha.

**O alvo de loudness é AES / EBU R 128: ≤ −16 LUFS integrado** (ITU-R BS.1770-4, K-weighting
com gating) **e true peak ≤ −1 dBTP** com oversampling ≥4× — decidido em 08/09/2026, S3 na
mesma §6.1, desempatando o conflito em favor da norma citada contra os −10/−12 dBFS de
`references/audio.md`, que misturava régua de pico com régua de loudness (as duas estão a
**3,017 dB medidos** uma da outra). O alvo se aplica **por categoria e por estado**, nunca à
sessão inteira, e `som-engenheiro-audio` é o **dono único** da política de loudness.

**A escada por categoria já foi aberta — corrigido por medição em 09/09/2026 (Fase 1 do
`som-01`).** Ela deixou de ser entregável pendente e mora hoje em `src/utils/loudness.ts`, com
resumo em `docs/SOM.md` §3. Alvos em LUFS-M medidos em P-B: Marco/Presença/**Degeneração**
−16,0 · **Sintonia**/Cuidado −19,0 · Conclusão/Transação −22,0 · Arcade −25,0 · Trilha −28,0
LUFS-S (e ≤ −16 LUFS integrado). Tolerância **±1,0 LU**, degrau **3,0 dB sem meio-degrau**. As
categorias **`degeneracao`** e **`sintonia`** **nasceram neste run**. O critério da escada é
**repetição, não importância**.

**RS-6 · R-EX — um gesto, uma fonte.** Dois `play*` a ≤ **120 ms** são o mesmo gesto: toca a de
classe mais alta; empate → a menos repetida; empate → a do gesto (não a da consequência);
empate → a primeira despachada. A perdedora é **descartada, nunca enfileirada**. Medido: o
limitador fez **0,00 dB** sobre uma soma de **+4,58 dB** — quem apaga colisão é a regra, não o
grafo. ⚠️ **Não implementada até 09/09/2026** (achado da Fase 3); dona da regra é o diretor
sonoro, dono da implementação é o engenheiro.

**RS-7 · R-CAT — categoria vem do EVENTO, nunca do nível medido do arquivo.** Uma categoria
pode ter um único membro se, e só se, (a) o perfil de repetição do membro não coincidir com o
de nenhuma outra e (b) ela tiver sido derivada do evento. Foi assim que o `playVisorTune` ficou
**dois degraus errado** em `arcade` sem nada ficar vermelho.

**RS-8 · R-NOVA — toda superfície nova do app nasce MUDA.** Um `play*` só entra numa superfície
nova depois de entrar na spotting list. `ArenaGame.tsx` nasceu 21 min antes do commit dos
cortes e reintroduziu dois sons cortados com **3.974 testes verdes**: o defeito não foi a tela,
foi a **ausência de régua**.

**O estado do código mudou — corrigido por medição em 09/09/2026.** `src/utils/sounds.ts`
exporta **8 símbolos `play*`, não 11**, e **o barramento existe** (`src/utils/audioBus.ts`,
PR #36). A frase *"cada `play()` abre um `AudioContext` e o fecha"* está **obsoleta**.

**Toda afirmação sobre o usuário do Soulmon vem marcada `[hipótese]`.** §1 do contexto:
ninguém nunca usou o app, e não há telemetria. Regra permanente do run, não pendência a fechar.

---

## 5. Estado e artefatos

Como no `CONTRACT.md` §5 da Alpha, com dois artefatos próprios:

- `squad-alpha-runs/som-01/<fase>/gate.md` — todo loop adversarial fecha com ele.
- `squad-alpha-runs/som-01/escuta/<fase>.md` — **uma linha por asset**, com as três perguntas
  fechadas do gate humano respondidas por escrito. Asset sem linha de escuta **não entra no
  app**.
- `squad-alpha-runs/som-01/discovery/spec-de-loudness.md` — dono único: `som-engenheiro-audio`.
  Promovida ao código em `src/utils/loudness.ts` na Fatia 2.
- `squad-alpha-runs/som-01/sweeper/audio-loudness.log` — saída real do medidor, colada.
- **Prova de vermelho** — toda assertiva nova do gate nasce com a saída vermelha **gravada em
  disco**. No `som-01` são três arquivos (`saida-gate-vermelho.txt`,
  `prova-vermelho-C-amostra-vazia.txt`, `provas-vermelho-pos-ataque.txt`). Assertiva sem prova
  de vermelho não conta como verificação.

⚠️ **`squad-alpha-runs/` está no `.gitignore`.** Tudo acima é **local e some do git**. O que
precisa sobreviver ao run vai para `docs/`, com ponteiro no `CLAUDE.md` — foi assim que nasceu
`docs/SOM.md`. Decida o destino **antes** de escrever, não depois.

---

## 6. Protocolo de checkpoint

Idêntico ao da Alpha (§6): artefatos · autoavaliação contra a barra · objeções sobreviventes ·
maior risco · pendências escaladas · escolha **continuar / ajustar / parar** (+ **voltar**).

Duas travas próprias:

1. **O gate humano de escuta não é delegável e não é opinião do agente.** Sem `escuta/<fase>.md`
   respondido, a fase não fecha — mas ela também **não trava indefinidamente**: passado o prazo
   combinado, fecha com escopo reduzido e os pendentes ficam registrados como **não aprovados**.
   ⚠️ **Nunca exercido no `som-01`** (09/09/2026): não houve **um único asset** para escutar,
   porque a geração por IA ficou bloqueada por crédito. O procedimento continua válido e
   **não testado** — a squad não pode alegar que o exercitou.
2. **Taxa de aprovação de 100% é sinal de gate não exercido**, não prova de lote bom. Vigiado
   por `alpha-governanca`. **No `som-01` não existe taxa nenhuma** — não a cite.
3. **Não despache dois consertos em paralelo quando um consome número do outro.** Aconteceu na
   Fase 0: a `spec-de-loudness.md` foi calculada sobre um baseline que a objeção **O-8**
   reprovou no mesmo dia. Erro de orquestração, não de agente. Sequencie, ou declare a
   dependência de número no briefing.
