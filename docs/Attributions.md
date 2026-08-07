# Atribuições

## Código e componentes

This Figma Make file includes components from [shadcn/ui](https://ui.shadcn.com/) used under [MIT license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md).

This Figma Make file includes photos from [Unsplash](https://unsplash.com) used under [license](https://unsplash.com/license).

## ⚠️ Sprites e propriedade intelectual — PENDENTE DE VERIFICAÇÃO

**Este item precisa ser resolvido antes de publicar na Play Store.**

### Sprites

Os sprites em `src/assets/*_dmc.png` foram extraídos do repositório
[`furudbat/wayland-vpets`](https://github.com/furudbat/wayland-vpets)
(`assets/dmc/<Nome>.png`, frame 0 → 128×128).

Esses sprites são arte de **Digital Monster (Digimon)**, propriedade da
**Bandai Namco**. A licença do repositório de origem cobre o código daquele
projeto — **não transfere direitos sobre a arte da Bandai**.

### Nomes e marcas

O jogo usa nomes de criaturas que são marcas registradas da Bandai Namco, entre
outros: Agumon, Gabumon, Piyomon, Tentomon, Patamon, Palmon, Greymon, Garurumon,
Angemon, Devimon, Birdramon, Kabuterimon, Seadramon, Airdramon, Ogremon,
Kuwagamon, Numemon, Monzaemon, Etemon, Andromon, Megadramon, Vademon, Nanimon,
Flamedramon, Raidramon. O termo "digievolução" e o conceito de estágios
(rookie/champion/ultimate/mega) também vêm da franquia.

### Por que isso importa

O caso **Nintendo × Pocketpair (Palworld)** é instrutivo pelo contraste: a
Nintendo processou por **patente de mecânica** e vem perdendo — patentes
rejeitadas nos EUA e no Japão, danos pedidos irrisórios. Já o comunicado oficial
da The Pokémon Company falava de **IP** (nomes e designs). **Copyright e
trademark são território muito mais forte e mais barato de fazer valer do que
patente** — e é exatamente a categoria que se aplica aqui.

### O que precisa acontecer

- [ ] Verificar a licença real do `furudbat/wayland-vpets` e se ela permite
      redistribuição comercial da arte.
- [ ] Decidir entre: (a) obter licença da Bandai, (b) substituir sprites e nomes
      por arte e nomenclatura originais, ou (c) publicar assumindo o risco de
      forma consciente e documentada.
- [ ] Se a opção for (b), notar que o sistema já é agnóstico a nomes — o oráculo
      (`src/utils/oracle.ts`) gera criaturas com nomes únicos por jogador, e
      `src/types/progression.ts` lê o nível direto do prefixo do id, sem tabela
      por espécie. Os nomes fixos sobrevivem no roster da masmorra
      (`LEGACY_FORM_TIERS`) e nos itens de evolução da loja.

*Nada aqui é aconselhamento jurídico — é o registro de um item em aberto,
levantado no benchmark de agosto/2026 (`docs/PLANO-EVOLUCAO.md`).*
