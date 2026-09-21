# Contrato — SQUAD-DESIGN (Soulmon)

- **Método:** `METODO.md` nesta pasta (W1–W10, duas fases).
- **Prefixo dos agentes novos:** `design-` → `.claude/agents/design-*.md`.
- **Artefatos:** `docs/design/` (inventário, princípios, decisões, `wireframes/*.dc.html`) +
  `docs/HANDOFF-WIREFRAMES.md` (o handoff para a sessão que desenha).
- **Formato de agente:** o mesmo do `squad-docs/CONTRACT.md` §1 (frontmatter + H2 fixos).

## Roster

### Agentes próprios (1)

| id | model | possui | pergunta que possui |
|---|---|---|---|
| *(procedimento — ex-`design-curador-padroes`, 21/09/2026)* | — | `docs/design/PRINCIPIOS-DE-WIREFRAME.md` (já entregue; quem altera cita procedência — `METODO.md`) | "o que o mercado já provou, e onde está escrito?" |
| `design-wireframer` | opus | os canvases `docs/design/wireframes/*.dc.html` — um por fluxo, cinza, todo estado. **Mantido só enquanto houver fluxo `a desenhar` no inventário** (Fase 1 fechada com 13 canvases); depois vira doc de método (S3) | "o que está nesta tela, em que ordem, e por quê?" |

### Agentes do repositório reusados (5)

| agente | o que possui nesta squad |
|---|---|
| `soulmon-design-lead` | **decide** — o que entra, volta ou sai; escreve `docs/design/DECISOES-WIREFRAME.md`; dono do checkpoint com o dono do produto |
| *(procedimento — ex-`soulmon-screen-cartographer`, 21/09/2026)* | o inventário (`docs/design/INVENTARIO-WIREFRAMES.md`), derivado do `03-FLUXO-DE-TELAS.md` e confirmado no app rodando — `METODO.md` › "Inventário de superfícies", executado pelo orquestrador |
| `soulmon-product-designer` | arquitetura de informação e fluxos: parecer sobre cada canvas antes da crítica (hierarquia, time-to-value, uma pergunta por tela) |
| `design-critic` | **crítica bloqueante** antes do checkpoint: W1–W10 item a item, acessibilidade, o que o autor não viu |
| `soulmon-guarda-linha-vermelha` | parecer APROVADO/COM RESSALVA/VETADO sobre cada família de tela (W6) |
| `soulmon-visual-designer` | **Fase 2 só**: aplica a identidade sobre os wireframes aprovados |

## Regras de despacho

- Nada se desenha fora do inventário. Nada entra sem crítica. Nada vira identidade antes
  do checkpoint da Fase 1.
- Um canvas por fluxo (Home · Atividades · Onboarding · Rituais · Evolução · Jogos · Loja ·
  Estatísticas · Conta · Fora do app). Dois agentes nunca no mesmo canvas.
- O dono do produto é quem fecha o checkpoint — a squad apresenta canvas + decisões, não
  pede escolha entre opções soltas.

## Estado e artefatos

| artefato | dono | estado |
|---|---|---|
| `docs/design/INVENTARIO-WIREFRAMES.md` | orquestrador (procedimento do `METODO.md`) | tabela com `a desenhar / desenhado / criticado / aprovado / fora` por tela |
| `docs/design/PRINCIPIOS-DE-WIREFRAME.md` | orquestrador (quem altera cita procedência) | vivo |
| `docs/design/wireframes/<fluxo>.dc.html` | wireframer | canvas |
| `docs/design/DECISOES-WIREFRAME.md` | design-lead | decisões |
| `docs/HANDOFF-WIREFRAMES.md` | orquestrador | o que a próxima sessão lê primeiro |
