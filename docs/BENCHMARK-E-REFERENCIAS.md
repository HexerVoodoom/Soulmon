# Benchmark e referências — o hub

> **Etiqueta: vivo** (criado em 30/09/2026). Dono: **`benchmark-curador`** (via `/squad-benchmark`).
> É o ÍNDICE e o MÉTODO de toda pesquisa de mercado, de gênero e de evidência do Soulmon.
> **Não decide regra nenhuma** — a precedência continua código > teste > `CLAUDE.md` >
> manual > pesquisa. Quem decide é o dono, no `REGISTRO-DE-DECISOES.md`.

## 0. Por que este arquivo existe (a verificação de 30/09/2026)

Antes de escrever, conferiu-se o que o repositório já tinha:

- **Benchmarks existiam, e muitos** — combate, minijogos, guildas, o de agosto/2026 que deu
  origem ao `PLANO-EVOLUCAO.md`, a rodada de pesquisa de setembro em `docs/guia-experiencia/`,
  o dossiê Mobbin, os estudos dos guardas e a revisão de evidência do catálogo (§1).
- **O que NÃO existia:** (a) um lugar que os listasse juntos — cada um só era alcançável pelo
  `00-MAPA.md`, espalhado em quatro seções; (b) uma lista-mestra de referências dizendo qual
  doc cobre qual produto; (c) um registro de ACESSO (que ferramenta alcança qual fonte, e
  como verificar); (d) critérios comuns — cada doc inventou sua convenção de confiança
  (`✔`/`(≈)` num, "relato/comunidade"/"não verificado" noutro, A/B/C no catálogo); (e) um
  agente geral — o único era o `catalogo-benchmark`, restrito a catálogo de hábitos.

Este arquivo fecha (a)–(d); o `benchmark-pesquisador`, o `benchmark-curador` e a skill
`squad-benchmark` fecham (e) (§6).

---

## 1. O que já foi levantado — mapa dos benchmarks

| Tema | Documento | Data | Método / fonte | Confiança declarada | Virou decisão? |
|---|---|---|---|---|---|
| Produtividade gamificada + v-pets + franquias (Habitica, Catzy, Finch, Forest, Tamagotchi, V-Pet → Vital Bracelet, Pokémon Sleep/GO, Palworld) + psicologia do engajamento | [`PLANO-EVOLUCAO.md`](PLANO-EVOLUCAO.md) | ago/2026 | duas rodadas de pesquisa | mista | **sim** — Fases 1–5 e a essência declarada |
| Lições de canais de UI/UX (@Mobbingdesign, @TimGabe) | [`guia-experiencia/01-youtube-mobbin-timgabe.md`](guia-experiencia/01-youtube-mobbin-timgabe.md) | set/2026 | vídeo + transcrição | limites do método declarados | parcial |
| Biblioteca de vídeos | [`guia-experiencia/00-LINKS-VIDEOS.md`](guia-experiencia/00-LINKS-VIDEOS.md) | set/2026 | oEmbed do YouTube | **84 verificados um a um** | fonte |
| Tamagotchi effect / vínculo | [`guia-experiencia/02-tamagotchi-effect-psicologia.md`](guia-experiencia/02-tamagotchi-effect-psicologia.md) | set/2026 | literatura | com fontes | sim — várias linhas vermelhas |
| Gamificação e streaks | [`guia-experiencia/03-gamificacao-streaks.md`](guia-experiencia/03-gamificacao-streaks.md) | set/2026 | literatura + produtos | com fontes | sim — "streak que zera não entra" |
| Monster taming | [`guia-experiencia/04-monster-taming.md`](guia-experiencia/04-monster-taming.md) | set/2026 | catálogo de jogos | com fontes | parcial |
| Onboarding | [`guia-experiencia/05-onboarding.md`](guia-experiencia/05-onboarding.md) | set/2026 | produtos + Oráculo | com fontes | parcial (WP1.x) |
| Paywall e monetização | [`guia-experiencia/06-paywall-monetizacao.md`](guia-experiencia/06-paywall-monetizacao.md) | set/2026 | produtos | com fontes | parcial (WP5.x, D10) |
| Retenção | [`guia-experiencia/07-retencao-engajamento.md`](guia-experiencia/07-retencao-engajamento.md) | set/2026 | literatura | **sem telemetria → tudo hipótese** | não |
| Transcrições NotebookLM | [`guia-experiencia/08-transcricoes-notebooklm.md`](guia-experiencia/08-transcricoes-notebooklm.md) | set/2026 | NotebookLM | 16 transcrições | fonte |
| Padrões de UI (13 dossiês) | [`guia-experiencia/09-mobbin-dossie.md`](guia-experiencia/09-mobbin-dossie.md) | 02/09/2026 | Mobbin Pro (MCP), iOS | PADRÃO / ANTI-PADRÃO / LIMÍTROFE | sim — a fonte de UI mais citada pelos guardas |
| Mobbin por área dos guardas | [`plano-melhorias/mobbin/`](plano-melhorias/mobbin/) (6 arquivos) | set/2026 | Mobbin | idem | parcial |
| Estudos por área dos guardas | [`plano-melhorias/estudo/`](plano-melhorias/estudo/) (6 arquivos) | set/2026 | pesquisa × código | com fontes | sim — ledgers WP |
| Catálogo de hábitos (Fabulous, Finch, Habitica, Duolingo, Headspace, Tiimo, Streaks) | [`PLANO-CATALOGO-ATIVIDADES.md`](PLANO-CATALOGO-ATIVIDADES.md) | set/2026 | `catalogo-benchmark` | com fonte e data | sim — F1–F6 |
| Evidência científica do catálogo | [`CATALOGO-EVIDENCIAS.md`](CATALOGO-EVIDENCIAS.md) | set/2026 | busca verificada | **níveis A/B/C** | sim — item sem fonte não entra |
| Motor de tarefas (Todoist, Things 3, TickTick, Sunsama, Motion, Structured) | [`PLANO-TAREFAS.md`](PLANO-TAREFAS.md) | ago–set/2026 | produtos + literatura | com fontes | sim — Fases 1–3 |
| Guildas e grupos (Habitica party, Forest, Flora, Stack…) | [`reviews/guilda/01-benchmark.md`](reviews/guilda/01-benchmark.md) | 29/09/2026 | WebSearch | "relato/comunidade" · "não verificado" | sim — [`PLANO-GUILDA.md`](PLANO-GUILDA.md) |
| Combate (monster taming, v-pets, Monster Rancher, Medabots, SMT, FF mobile, indies) | [`BENCHMARK-COMBATE.md`](BENCHMARK-COMBATE.md) | 29/09/2026 (corpo) · conferido 30/09/2026 | corpo de memória; **conferido na web em 30/09/2026** (seção "Conferido em 30/09/2026") | mista: 7 ✔ · 92 ◐ · 19 (≈) · 13 ✖ | não |
| Minijogos + ciência cognitiva (Lumosity, Brain Age, Tetris, Wordle…) | [`BENCHMARK-MINIJOGOS.md`](BENCHMARK-MINIJOGOS.md) | 30/09/2026 | busca + catálogo | ✔ conferido · *(≈)* memória | não — Camada 3 congelada |
| Revisão de produto de agosto (pesquisa de usuário, monetização, ASO) | [`reviews/2026-08-03/`](reviews/2026-08-03/) | 03/08/2026 | squad de revisão | pareceres | parcial |
| Ficha da Play (posicionamento contra concorrentes) | [`PLAY-FICHA.md`](PLAY-FICHA.md) | set/2026 | ASO | — | vivo |
| Referência visual da área Jogos (benchmark interno de arte) | [`design/areas/00-BIBLIA-DAS-AREAS.md`](design/areas/00-BIBLIA-DAS-AREAS.md) §2.1 | set/2026 | arte própria | — | sim |

Briefings reutilizáveis para sessões com acesso externo:
[`plano-melhorias/BRIEF-MOBBIN.md`](plano-melhorias/BRIEF-MOBBIN.md),
[`guia-experiencia/00-BRIEFING-SESSAO-NOTEBOOKLM.md`](guia-experiencia/00-BRIEFING-SESSAO-NOTEBOOKLM.md) e
[`guia-experiencia/00-PROMPTS-NOTEBOOKLM.md`](guia-experiencia/00-PROMPTS-NOTEBOOKLM.md).

---

## 2. Lista-mestra de referências — quem é citado, e onde

A pergunta que esta tabela responde: **"já estudamos o produto X? onde?"**. Antes de pesquisar
uma referência, procure-a aqui (e com `grep -rli "<nome>" docs`). Só entra nome que algum doc
do repo já estuda — referência nova entra quando um benchmark a cobrir (§5, passo B8).

### 2.1 Produtividade e hábitos gamificados
| Referência | Por que importa ao Soulmon | Onde está estudada |
|---|---|---|
| **Habitica** | o contraexemplo central: dano de HP, Pousada (proteção que exige lembrar), party punitivo, fim das guildas em 08/2023 | `PLANO-EVOLUCAO.md`, `reviews/guilda/01-benchmark.md`, `guia-experiencia/03` |
| **Finch** | o modelo mais próximo: pet que encoraja, "never miss twice", versão reduzida | `PLANO-EVOLUCAO.md`, `PLANO-TAREFAS.md`, `PLANO-CATALOGO-ATIVIDADES.md` |
| **Forest** / **Flora** | foco com árvore; "Plant Together" morre em bloco × Flora soma bônus | `PLANO-EVOLUCAO.md`, `reviews/guilda/01-benchmark.md` |
| **Catzy** | pet de produtividade | `PLANO-EVOLUCAO.md` |
| **Fabulous**, **Tiimo**, **Streaks**, **Headspace**, **Duolingo** | catálogo sugerido, onboarding por objetivo, celebração, streak | `PLANO-CATALOGO-ATIVIDADES.md`, `guia-experiencia/05`, `09-mobbin-dossie.md` |
| **Todoist** (Karma, `every!`), **Things 3** (Someday), **TickTick** (Won't Do), **Sunsama** (foco 3, shutdown), **Motion** (o que NÃO fazer), **Structured** | motor de tarefas | `PLANO-TAREFAS.md`, `REGISTRO-DE-DECISOES.md` |
| **Opal** | presença/tempo de tela | `plano-melhorias/mobbin/`, `design/PRINCIPIOS-DE-WIREFRAME.md` |

### 2.2 V-pet, monster taming e jogos
| Referência | Por que importa | Onde |
|---|---|---|
| **Tamagotchi** / **V-Pet Digimon (1997) → Vital Bracelet** | *care mistakes*, evolução pelo cuidado | `PLANO-EVOLUCAO.md`, `plano-melhorias/estudo/permanencia.md`, `BENCHMARK-COMBATE.md` |
| **Pokémon Sleep** | Sleep Style Dex (→ Sonhos), o exploit de forjar sono | `PLANO-TAREFAS.md`, `guia-experiencia/04` |
| **Pokémon GO**, **Palworld**, **Monster Rancher**, **Temtem**, **Cassette Beasts**, **Yu-Gi-Oh**, **Ragnarok**, **Shin Megami Tensei**, **Medabots** | coleção, vínculo, combate, fantasia central | `guia-experiencia/04`, `BENCHMARK-COMBATE.md`, `design/areas/prompts/` |
| **Aethermancer** | roguelite de monstros (éter por elemento como recurso) | `BENCHMARK-COMBATE.md` §3 (conferido) |
| **Sensor Tower** (Monster Strike) | fonte de medição de receita do Monster Strike | `BENCHMARK-COMBATE.md` §4 (conferido) |
| **Digimon Story Time Stranger — página oficial Bandai Namco** | personalidade e atributos de combate (fonte primária) | `BENCHMARK-COMBATE.md` §2.5 (conferido) |
| **Monster Hunter Stories 3** | terceiro da série (13/03/2026); triângulo e tells | `BENCHMARK-COMBATE.md` §2.12 (conferido) |
| **legendcup** (Monster Rancher 2) | pesquisa de mecânica do MR2 (Guts, alcance, vida útil) | `BENCHMARK-COMBATE.md` §2.6 (conferido) |
| **wikimon** (aparelhos Digimon) | Digital Monster, Pendulum, Digivice, D-Ark, Color | `BENCHMARK-COMBATE.md` §2.4 (conferido) |
| **Lumosity**, **Brain Age**, **Elevate**, **Tetris**, **Wordle** | o que um minijogo pode prometer (transferência próxima sim, distante não) | `BENCHMARK-MINIJOGOS.md` |
| **Replika** | companheiro de IA — o risco de dependência | `design/PRINCIPIOS-DE-WIREFRAME.md` |

### 2.3 Ciência e frameworks (entram como EVIDÊNCIA, não como produto)
| Referência | O que sustenta | Onde |
|---|---|---|
| Lally et al. 2010 (mediana 66 dias) | marcos 7/21/66 | `PLANO-TAREFAS.md`, `CATALOGO-EVIDENCIAS.md` |
| Dai, Milkman & Riis (fresh start) | Fresh start de segunda/dia 1 | `PLANO-TAREFAS.md`, `guia-experiencia/03` |
| Nunes & Drèze (progresso dotado) | hábito novo começa em 1, não em 0% | `PLANO-TAREFAS.md`, `plano-melhorias/estudo/constancia.md` |
| Masicampo & Baumeister | planejar alivia (triagem) | `PLANO-TAREFAS.md` |
| Fogg (B=MAP), Octalysis, SDT | modelo de motivação | `PLANO-EVOLUCAO.md`, `guia-experiencia/03`, `plano-melhorias/estudo/` |
| Irish 2015, Paluch 2022, OMS 2020 … | itens do catálogo | `CATALOGO-EVIDENCIAS.md` |

---

## 3. Acessos — que ferramenta alcança qual fonte

Nenhuma credencial é escrita aqui (só o NOME do acesso e onde ele mora).

| Fonte | Como se acessa | Quem tem | Como verificar | Limite conhecido |
|---|---|---|---|---|
| Web aberta (sites, wikis, blogs, lojas) | `WebSearch` + `WebFetch` | `benchmark-pesquisador`, `catalogo-benchmark`, `catalogo-evidencia` | abrir a página e citar URL + data de acesso | sessão na nuvem passa por proxy; página pode bloquear |
| **Mobbin Pro** (telas e fluxos reais) | MCP do Mobbin (`search_screens`, `search_flows`) — só em sessão do dono com o conector; **não está neste repositório** | sessão externa com o prompt de [`BRIEF-MOBBIN.md`](plano-melhorias/BRIEF-MOBBIN.md) | cada achado leva a URL do Mobbin | iOS como padrão; **sem screenshot** (PI) |
| **NotebookLM** (transcrever vídeo, cruzar fontes) | navegador logado na conta Google do dono | sessão externa com [`00-BRIEFING-SESSAO-NOTEBOOKLM.md`](guia-experiencia/00-BRIEFING-SESSAO-NOTEBOOKLM.md) | retorno em um `.md` | depende do dono estar logado |
| **YouTube** | link + `curl https://www.youtube.com/oembed?url=…&format=json` | qualquer agente com Bash/WebFetch | copiar o `author_name` que VOLTOU, não o esperado | ID nunca se adivinha (5 vídeos já foram atribuídos ao canal errado) |
| Literatura (papers, meta-análises, diretrizes) | `WebSearch`/`WebFetch` em PubMed, Google Scholar, sites de periódicos, OMS/APA | `catalogo-evidencia`, `benchmark-pesquisador` | DOI ou URL do periódico; ler ao menos o resumo | abstract ≠ paper lido — declarar |
| Loja (Play Store / App Store) | `WebFetch` da ficha pública | `benchmark-pesquisador` | URL + data (fichas mudam) | sem dado de download/receita |
| Issues públicas de GitHub (ex.: Habitica) | `WebFetch` | `benchmark-pesquisador` | número da issue | é relato de comunidade, não dado |
| Painéis de mercado (Sensor Tower, data.ai etc.) | **não disponível hoje** | — | — | pedido ao dono se um benchmark depender disso |
| Conhecimento de catálogo do modelo | nenhum acesso | todos | **não é fonte** — só entra marcado *(≈)* e com a lista do que conferir | foi o método do `BENCHMARK-COMBATE.md` |

---

## 4. Critérios

### 4.1 Níveis de confiança — UMA convenção para todo benchmark novo
Os docs antigos mantêm a convenção deles (registro não se reescreve); daqui em diante vale:

| Marca | Significa | Pode sustentar decisão? |
|---|---|---|
| **✔ verificado** | fonte primária aberta nesta rodada, com URL + data | sim |
| **◐ relato** | wiki de fã, issue, fórum, review, blog | só com outra fonte junto |
| **(≈) memória** | conhecimento de catálogo, não conferido | **não** — lista "a conferir" obrigatória |
| **✖ não verificado** | a busca não devolveu; nada foi preenchido de memória | não |

Para **evidência científica**, usar os níveis **A/B/C** de [`CATALOGO-EVIDENCIAS.md`](CATALOGO-EVIDENCIAS.md)
(A = meta-análise/RCT robusto · B = observacional forte, RCT único ou consenso clínico · C = plausível, evidência fraca).

### 4.2 Seleção de referências — o que entra no conjunto
1. **Eixo antes de lista.** Declarar primeiro o eixo que diferencia os produtos (ex.: "como cada um trata a falha", que organizou o benchmark de agosto). Referência entra por cobrir uma posição do eixo, não por ser famosa.
2. **Paridade × diferencial.** Separar o que é paridade de mercado (tem que ter) do que é diferencial (onde o Soulmon escolhe).
3. **Contraexemplo obrigatório.** Todo benchmark inclui ao menos um produto que faz o OPOSTO da tese (Habitica, Motion, Forest em bloco) e diz o dano medido ou relatado.
4. **Três categorias no mínimo:** concorrente direto (pet de produtividade), vizinho de gênero (v-pet/monster taming ou app de hábito) e evidência (literatura).
5. **Sucesso ou fracasso observável** — preferir referência com dado público (lançamento, mudança revertida, issue longeva, estudo) a referência só com "é popular".

### 4.3 Filtros que toda ideia atravessa antes de sair do benchmark
- **Linhas vermelhas** (ledger `docs/plano-melhorias/ledger/vetos.md`): streak que zera, perda de combate custando coração, recompensa por contagem de tarefas, dinheiro comprando cuidado, percentual cru no widget… Ideia que cruza uma linha vermelha é registrada como **"vetada pelo filtro"**, com a linha citada — não some em silêncio.
- **Essência declarada** (`PLANO-EVOLUCAO.md`): "isso faz o bichinho parecer companheiro ou chefe?"
- **PI**: descrever, nunca copiar. Sem screenshot/asset de terceiro no repo; nome de franquia só em doc de pesquisa, nunca no bundle (régua `sprites.dungeonRoster.test.ts`).
- **Camada congelada**: conteúdo acima do núcleo segue o `REGISTRO-DE-DECISOES.md` §5.6.
- **Registro de decisões**: se a ideia é a alternativa que já perdeu, a pergunta é "o que mudou desde então?".

### 4.4 Validade
- Data de acesso em toda referência. Referência de produto (ficha, preço, feature) **envelhece em 6 meses**; evidência científica, quando sair meta-análise nova.
- O `benchmark-curador` marca **⏳ revisar** no §1 quando um benchmark passa de 6 meses e é citado numa decisão aberta.

---

## 5. Estratégia — o método B1–B9

| Passo | O que se faz | Saída |
|---|---|---|
| **B1 Pergunta** | uma pergunta de decisão ("como a Masmorra deve tratar derrota?"), não um tema ("jogos") | 1 frase |
| **B2 Já existe?** | procurar no §1–§2 e com `grep`; ler o que existe e o `REGISTRO-DE-DECISOES.md` | "novo" / "atualizar X" / "já respondido" |
| **B3 Eixo** | os 3–6 eixos que diferenciam as referências | tabela de eixos |
| **B4 Seleção** | aplicar §4.2 | lista de referências com a categoria |
| **B5 Coleta** | por referência, as mesmas perguntas (uma ficha por referência, campos fixos) | fichas com URL + data |
| **B6 Verificação** | marcar ✔/◐/(≈)/✖ (§4.1); conferir o que for (≈) antes de fechar | nenhuma afirmação sem marca |
| **B7 Síntese** | convergência (3+ fazem igual), divergência (a escolha real), paridade × diferencial, contraexemplos | quadro-síntese |
| **B8 Filtro e opções** | cada ideia passa por §4.3; sai como OPÇÃO numerada com custo, risco e linha vermelha tocada | opções — **nunca recomendação disfarçada de regra** |
| **B9 Registro** | salvar como `docs/BENCHMARK-<TEMA>.md` (etiqueta **pesquisa**), linha no §1 deste hub, referências novas no §2, entrada no `docs/manual/00-MAPA.md` §6.2, bloco no `STATUS.md` | doc alcançável |

### 5.1 Esqueleto de um benchmark novo
```
# Benchmark de <tema> — <recorte>
> Etiqueta: pesquisa (dd/mm/aaaa). Não decide regra nenhuma. Pergunta: <B1>.
> Fontes e confiança: convenção de docs/BENCHMARK-E-REFERENCIAS.md §4.1.
> O que o Soulmon tem hoje (lido do código em dd/mm): <símbolos, não linhas>
## 1. Os eixos
## 2. Referências, uma a uma  (ficha: o que faz · eixo · sucesso/fracasso · fonte ✔/◐/(≈)/✖)
## 3. Convergência e divergência
## 4. Paridade × diferencial
## 5. Opções para o Soulmon  (filtradas por §4.3; vetadas listadas à parte)
## 6. A conferir  (tudo que ficou (≈) ou ✖)
## 7. Fontes  (URL + data de acesso)
```

---

## 6. Quem faz — squad-benchmark

Skill **`squad-benchmark`** (`/squad-benchmark [status | novo <pergunta> | atualizar <doc> | conferir <doc> | referencia <nome>]`).

| Papel | Agente | Faz | Não faz |
|---|---|---|---|
| Pesquisa (B3–B7) | **`benchmark-pesquisador`** | levanta, verifica e sintetiza qualquer benchmark de produto/gênero/UX | não decide, não implementa, não escreve no hub |
| Hub e método (B2, B9, validade) | **`benchmark-curador`** | dono deste arquivo: §1–§2, marcas ⏳, entrada no MAPA, conferência de links e da convenção §4.1 | não pesquisa conteúdo novo |
| Catálogo de hábitos | `catalogo-benchmark` (existente) | benchmark do recorte catálogo/onboarding de hábitos | — |
| Evidência científica | `catalogo-evidencia` (existente) | nível A/B/C de afirmação científica | — |
| Parecer de gênero | `soulmon-monster-taming-designer` | leitura de v-pet/monster taming | — |
| Parecer clínico (bloqueante quando a ideia toca vulneráveis) | `soulmon-behavioral-psychologist` | dano psicológico, dark pattern | — |
| PI (bloqueante) | `soulmon-ip-brand-guardian` | nome/estrutura de franquia virando produto | — |
| Veto final das opções | `soulmon-guarda-linha-vermelha` | APROVADO / COM RESSALVA / VETADO | — |

Ordem: **curador (B2) → pesquisador (B3–B8) → (psicologia ‖ PI ‖ gênero, quando tocam) → guarda-linha-vermelha → curador (B9)**.

---

## 7. Lacunas conhecidas (30/09/2026)

- **`BENCHMARK-COMBATE.md`: ~19 afirmações seguem (≈) de memória** (e 13 ✖, 10 delas contraditas pela fonte — o corpo não foi editado) — listadas na seção "Conferido em 30/09/2026" (marca (≈) e "Fora de escopo"). Só as ✔/◐ sustentam argumento; as (≈) precisam de nova conferência antes de virar decisão.
- **Sem dado de mercado** (downloads, receita, retenção de concorrentes): não há acesso a painel (§3).
- **Sem benchmark de widget/tela inicial e de push** além do dossiê 9 do Mobbin.
- **Sem benchmark de preço** atualizado dos concorrentes diretos (o de agosto é do `reviews/2026-08-03/`).
- **Desktop/overlay** (pets de área de trabalho, Steam): só o `PLANO-DESKTOP-STEAM.md`, sem levantamento de referência.

## 8. Manutenção

- Benchmark novo → o `benchmark-curador` acrescenta linha no §1, nomes no §2 e entrada no MAPA **no mesmo commit** (senão o guard `src/docsManual.contract.test.ts` fica vermelho).
- Doc de benchmark antigo **não se reescreve** (é registro): conferência vira seção "Conferido em dd/mm" no fim dele ou um doc irmão.
