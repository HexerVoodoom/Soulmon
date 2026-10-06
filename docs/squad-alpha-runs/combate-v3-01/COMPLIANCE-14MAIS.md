# COMPLIANCE-14MAIS — classificação 14+ e loja de Créditos (07/10/2026)

> **ANÁLISE INTERNA POR IA. NÃO É PARECER DE ADVOGADO.** Decisão final e risco jurídico são do dono.

## 0. Decisão registrada
Dono, 07/10/2026: adotar classificação indicativa **+14** em vez de "Livre + verificação de idade/supervisão parental", **se simplificar** a burocracia da loja de Créditos. Meta: Créditos sem fluxo de verificação de idade, produto declarado 14+.

## 1. Achado que muda a pergunta (ler primeiro)
O repo hoje **não** declara "Livre": declara **18+** em todo lugar (política §7, termos §3, Play ficha "Público-alvo 18+", caixa "Tenho 18 anos ou mais" no onboarding, bloqueio por data de nascimento <18). A decisão #15 e MIS-13 do dono (30/09) mantiveram 18+ de propósito. "Livre" era a classificação-alvo do run (contexto §2.11), não o estado do código. Logo, **14+ não simplifica o 18+ atual: ABRE o produto a menores de 18 (14-17)**, o que a decisão #15 recusava ("Menores = LGPD art. 14 + Play Families"). O pedido mistura dois eixos:
- **ClassInd** (faixa etária via IARC): 14+ muda a *etiqueta*.
- **ECA Digital / LGPD** (deveres do fornecedor): dependem de "acesso provável por menores", não da etiqueta.

## 2. Fontes e o que sustentam (lidas em 07/10/2026)
| Afirmação | Fonte | Nível |
|---|---|---|
| Guia ClassInd 2025: "14 anos: apps que permitem compras online ou conversas entre usuários sem checagem de idade". Portaria MJSP 1.048/2025 (15/10/2025) lista "compras on-line" (art. 52, IX) como elemento de classificação; faixas Livre/6/10/12/14/16/18; todo app em loja precisa de classificação via IARC | lexlegal.com.br; TJDFT (nov/2025); datalegis (texto da Portaria) | secundária. Guia no gov.br NÃO abriu ("Conteúdo Restrito") |
| Portaria: maior parte vigente em 17/11/2025; artigos de fiscalização em 17/03/2026 | TJDFT | secundária |
| ECA Digital (L15.211/2025) vigora desde 17/03/2026; vale para quem tem "acesso provável" de crianças/adolescentes (critério funcional); multa até 10% do faturamento/R$ 50 mi; Decreto 12.880/2026 (18/03/2026); ANPD: orientações ago/2026, fiscalização intensiva jan/2027 | diasteixeira.com.br; Madrona; legalcloud | secundária. Planalto: ECONNRESET de novo; Câmara devolveu PDF ilegível |
| Autodeclaração isolada vedada para conteúdo impróprio a menores; botão "tenho 18" insuficiente; vinculação a responsável até 16 anos (tempo, contatos, aprovação de compras) | mesmos secundários | secundária. Texto dos artigos não lido; alcance sobre app sem conteúdo impróprio é LACUNA |
| Art. 20 (caixa paga proibida a menores) | compliance-lootbox-v2 / benchmark-lootbox | secundária |
| Apple: 2.3.6 classificar honestamente; 3.1.1 odds antes da compra; 1.3/5.1.4 Kids (parental gate NÃO é consentimento de dados) | developer.apple.com/app-store/review/guidelines | **primária** |
| Google Play: Families só se o público-alvo declarado inclui crianças; 13-17 mantém proteções centrais de dados; moeda virtual distinta de dinheiro real | support.google.com/googleplay/android-developer/answer/9893335 | primária (resumo do fetch) |
| LGPD art. 14 | Planalto ECONNRESET | **NÃO LIDO** |

**Não consegui ler:** arts. 20, de aferição de idade e de supervisão da L15.211 (Planalto/Câmara/Senado); Guia Prático e Portaria no gov.br; LGPD art. 14; tela Apple Age Rating; política Families completa.

## 3. Veredito: PARCIAL
14+ simplifica a **classificação** e o preenchimento IARC/loja. **Não dispensa** os deveres de ECA Digital/LGPD, porque 14-17 ainda são adolescentes e o público "provável" passa a incluir menores. Sair de 18+ **aumenta** a burocracia (hoje o app declara não ser para menores).

### (a) O que 14+ simplifica
1. Some a contradição "Livre" x venda de Créditos (risco ALTO do compliance v2).
2. Fica fora de Kids/Families (Apple 1.3, Play Families só valem para público infantil); sem parental gate obrigatório.
3. Pelo Guia (secundário), compra online sem checar idade cabe em 14: para a ClassInd, dispensa verificação/autorização parental.
4. Evita verificação de idade dura (coleta de documento/biometria de todos, motivo do MIS-13).

### (b) O que NÃO simplifica (riscos remanescentes)
1. **ECA Digital independe da etiqueta.** Com 14-17 no público: melhor interesse, privacidade por padrão, sem perfilamento comercial de menores e, se o texto for como relatado, vinculação a responsável até 16 e aprovação de compras. 14-15 ficam dentro da supervisão. Lacuna crítica: texto do artigo.
2. **Art. 20:** caixa paga para menor continua proibida. O desenho (sem RNG pago, `bitsOrigin`) protege, mas "Créditos só não-combate" é regra de cliente, não verificável no servidor (SEGURANCA-AUDITORIA).
3. **LGPD art. 14 e dado sensível do produto:** nascimento (data/hora/local), respostas psicométricas, chat com IA. A política hoje diz "não coletamos de <18": fica falsa. Check-ups/Travessias foram pensados para adulto (Travessias já com piso 13+).
4. **Interação:** diretório público, PvP, guilda, presente de moeda, chat IA sem moderação humana. O Guia liga conversa entre usuários sem checagem à faixa 14; chat IA com adolescente é risco extra (há ponte de crise CVV 188).
5. **Quem paga:** lojas cobram o titular da conta; o gate real do menor é o controle parental do sistema (Play aprovação, Apple Ask to Buy). O app não controla. Risco de chargeback/reembolso.
6. **O código diz 18+:** mudar exige textos legais, nova versão de termos, formulários de loja e testes (11 testes clicam "I am 18 or older").

### (c) O que o produto precisa ter mesmo assim (se 14+)
- Termos com **idade mínima 14**; política com seção de adolescentes e contato do encarregado.
- Onboarding: gate de **data de nascimento neutra** (<14 bloqueado sem guardar o dado); `consent.ts` já existe.
- Compra só pela loja (Play Billing), "Créditos" separado de dinheiro real, aviso de autorização de quem paga.
- Sem RNG pago, sem anúncios, sem perfilamento (já). Teste que impeça Créditos→equipamento/combate.
- IARC/Play coerentes (público 13+/14+, sem <13), Apple Age Rating honesto.
- Limites e moderação no chat IA e telas sociais para 14-17.

### Menor fluxo se 14+ não dispensar
1. Etiqueta e público 14+.
2. Gate de nascimento neutro; <14 bloqueado.
3. Para 14-15 (se ECA exigir vínculo até 16): **bloquear compra de Créditos** (uso grátis liberado), ou confirmação de responsável por e-mail na 1ª compra (OTP/link, sem documento).
4. 16-17: aviso + controle parental da loja.
5. Validar com advogado antes de publicar.

## 4. Mudanças propostas por arquivo (NADA editado)
| Arquivo | Hoje | Proposta (14+) |
|---|---|---|
| `public/privacidade.html` §7 (l.~847; EN l.~392) | "maiores de 18; não coletamos de <18" | "maiores de 14; entre 14 e 17 tratamos dados no melhor interesse do adolescente (LGPD art. 14); compras exigem autorização de quem paga; não coletamos de <14". Linha de adolescentes na tabela de dados |
| `public/termos.html` §3 (l.~255; EN l.~71) e §4 | "18+; declara 18+; sem data <18" | "14+; entre 14 e 17 com ciência do responsável; compra é da conta da loja"; bloqueio <14; subir `TERMS_VERSION` |
| `src/components/SoulmonOnboarding.tsx` (l.~1786 + botão "Tenho 18 anos ou mais") | caixa 18+, "Volte quando fizer 18" | gate de nascimento <14; textos PT/EN novos |
| `src/utils/consent.ts` (l.79) e `consent.test.ts` (l.114,147) | ≥18 | `MIN_AGE=14`; 11 `*.render.test.tsx` a ajustar |
| `docs/PLAY-FICHA.md` l.36, l.301; `docs/PLAY-DATA-SAFETY.md` l.26 | 18+ | 14+ (sem <13); IARC |
| `docs/E0-CONSENTIMENTO.md` l.50 | 18+ pesquisa | **manter 18+** |
| `docs/PERGUNTAS-DO-DONO.md` #15, MIS-13 | 18+ ICP | registrar reversão datada |
| `docs/BILLING-SETUP.md`, `desktop/STEAM.md` l.213 | sem faixa | preencher 14+ |
| `CLAUDE.md`, `README.md` | sem idade | uma linha com a classificação |
| `contexto.md` §2.11/§2.13 (run-state) | "Livre"; compra atrás de verificação | atualizar após resposta |

## 5. Perguntas ao dono (modal)
**P1. O que 14+ significa para o ICP?**
- A) Manter 18+ e abandonar o 14+
- B) Abrir 14+ de verdade (adolescentes 14-17 no produto)
- C) Etiqueta 14+ mas bloquear <18 por dentro (incoerente)
- **Recomendo A.** 14+ não dispensa a burocracia do ECA/LGPD, a traz para dentro. Para reduzir burocracia, o 18+ atual com data de nascimento e controle da loja é o menor fluxo.

**P2. Se B: 14-15?**
- A) Confirmação de responsável por e-mail na 1ª compra
- B) Bloquear compra de Créditos para <16
- C) Só aviso (depende do texto do ECA, não lido)
- **Recomendo B:** custo mínimo, risco mínimo, perda de receita pequena.

**P3. Consultar advogado para ler o ECA Digital (aferição, supervisão, art. 20) antes de mexer nas páginas legais?**
- A) Sim, antes de publicar na loja
- B) Não, seguir com análise interna
- **Recomendo A.** Fontes primárias falharam em 05 e 07/10; tudo sobre ECA aqui é secundário.

## 6. Fontes
developer.apple.com/app-store/review/guidelines; support.google.com/googleplay/android-developer/answer/9893335; anvisalegis.datalegis.net (Portaria 1.048/2025); tjdft.jus.br (nov/2025); lexlegal.com.br; diasteixeira.com.br; madronaadvogados.com.br. Falhas: planalto.gov.br, camara.leg.br, gov.br/mj.
