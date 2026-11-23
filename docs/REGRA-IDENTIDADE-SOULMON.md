# Regra de identidade — quando USAR e quando NÃO usar — TEXTO CANÔNICO

> **Decisão do dono, 04/11/2026, revista em 09/11/2026.** A versão de 04/11 ("todo asset carrega a identidade")
> foi SUBSTITUÍDA: o dono viu os assets gerados em 09/11 com cano de cobre, planta e cristal em tudo e mandou:
> "tem regra clara pra quando não usar isso; inclusive muda a regra especificando quando usar".
> Este é o único texto canônico; CLAUDE.md, squads, agentes, fila de assets e manual só copiam o resumo e apontam para cá.

## Os motivos de identidade (o "bloco")

- **Base:** verde-azul turquesa ESCURO, no tom fechado da Home.
- **Cristais da alma** com chama/brilho dentro.
- **Canos e tubulações de cobre**, **circuitos digitais** (linhas de circuito), **ramos de folhinhas**.
- Tudo conectado por cabo, alimentado digitalmente, planta integrada à máquina.
- **Proibido em qualquer categoria:** engrenagem e clima steampunk (o cobre entra como identidade, não como máquina a vapor).

## Onde usar, onde não usar

| Categoria do asset | Veredito | Como |
|---|---|---|
| UI: molduras, botões, HUD, painéis, janelas | **USAR** | bloco completo, em pouca quantidade e sempre por cabo |
| Prédios, NPCs, mapas, hub (Vitra, Jornada, Passeio) | **USAR** | bloco completo; cada região é um ecossistema, o core fica |
| Site e marketing (loja, feature graphic, capas) | **USAR** | bloco completo |
| Cenário de combate (fundo da luta) | **ACENTO SUTIL** | 1 a 2 cristais turquesa discretos; nunca em toda cena; sem cano/folha/circuito empilhados |
| Itens, poções, chips, ícones de atributo (`icones-ui/stat-*`) | **ACENTO SUTIL** | no máximo UM motivo discreto (ex.: uma gema, um fio de cobre); nunca entupir. Referência do aceitável: os chips atuais e os `stat-ataque/defesa/velocidade` |
| Criaturas / sprites (rookie ao ápice, inclusive paralelas) | **NÃO USAR** | vale o elemento e a espécie; sem cano, circuito, folha ou cristal turquesa, salvo se o elemento/espécie pedir |
| FX de ataque e de status (queimadura, veneno, maldição, silêncio, regen…) | **NÃO USAR** | vale o elemento; fogo, morte, som, vileza, gravidade etc. não ganham folha/cristal/cano só por serem Soulmon |
| Ícones de elemento | **NÃO USAR** | vale o elemento |
| Qualquer asset cujo tema não comporte o bloco | **NÃO USAR** | o tema manda |

Regra de desempate: na dúvida entre usar e não usar, **não usar**. Se o próprio tema do asset pede um motivo
(ex.: uma criatura de planta, um FX de natureza, uma poção de cristal), ele entra porque o TEMA pede, não porque é Soulmon.
Exceção anterior mantida: criatura gerada pelo Oráculo (de jogador ou simulado) nunca é reprovada por identidade, nem pelo
roxo do prompt, nem pela dimensão de recorte (REGISTRO §234) — hoje já consistente com a categoria "criaturas: não usar".

## Blocos de prompt

**Categorias USAR (UI, prédio/NPC/mapa/hub, site):** incluir o bloco de identidade e anexar referência real (arte da Home).

```
Soulmon identity: deep dark teal base (the closed teal of the Home screen), soul crystals with a flame or glow inside,
a few copper pipes, thin digital circuit lines and small leaf sprigs, everything connected by cables, plant integrated
with machine, in small quantity. No gears, no steampunk.
```

**Categorias ACENTO SUTIL (cenário de combate, itens/poções/chips/ícones de atributo):** o bloco reduzido.

```
Identity accent, at most ONE discreet motif (for combat scenery: 1-2 small turquoise crystals, never in every scene;
for items/potions/chips/stat icons: one small crystal OR one thin copper wire). Do not pile up pipes, leaves and crystals.
No gears.
```

**Categorias NÃO USAR (criaturas, FX, ícones de elemento, tema que não comporta):** NUNCA o bloco; escrever explicitamente:

```
No copper pipes, no circuit lines, no leaves, no turquoise crystals unless the element itself calls for it.
The element and the species rule the look. No gears.
```

## Exemplos do que está ERRADO

- FX de `pira_eterna` com ramos de folha e cristal junto das chamas: fogo não pede planta nem cristal; o elemento manda.
- Rookies de criatura com canos de cobre no corpo: o rookie é a espécie e o elemento, não um prédio do hub.
- Fundo de combate com cristais turquesa em todo canto e cano por cima: o acento é 1 a 2 cristais, não a cena inteira.
- Poção ou chip entupido de cano + folha + cristal ao mesmo tempo: no máximo um motivo.
- "Arcano, natureza + magia" no prompt de um FX de som/morte/gravidade: puxa folha e cristal sem o tema pedir.

## Checklist antes de salvar/instalar

1. Qual a categoria do asset (tabela acima)? Escrever no pedido de geração.
2. O prompt traz o bloco certo (usar / acento / não usar)? Categoria "não usar" tem a linha negativa explícita?
3. Olhar o resultado: contar cano, circuito, folha e cristal turquesa. Em "não usar": zero (salvo tema). Em "acento": no máximo um motivo. Em "usar": presentes e em pouca quantidade.
4. Há engrenagem ou clima steampunk? Se sim, REJEITAR.
5. O elemento/espécie está legível e correto? É isso que manda nas categorias "não usar".
6. Reprovado em qualquer item volta ao gerador; não se instala "para depois refazer".
