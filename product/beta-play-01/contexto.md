# Bloco de contexto — Soulmon beta fechado na Google Play (run `beta-play-01`)

| Meta | Valor |
|---|---|
| Resolvido em | 2026-10-11 |
| Fontes usadas | respostas do dono (modal 11/10) · `CLAUDE.md` · `docs/PLAY-LANCAMENTO.md` · `docs/BILLING-SETUP.md` · `docs/ASSINATURA-SPEC.md` · `docs/DEPENDE-DE-VOCE.md` · `docs/STATUS.md` |
| Lacunas abertas | lista de testadores (e-mails) · data-alvo de início · preço dos SKUs |

## §1 Organização
Dev solo (dono = Mateus, `HexerVoodoom` no GitHub), produto próprio, estágio **early — ninguém nunca usou em produção**.

## §2 Alvo do run
Deixar o Soulmon pronto para **teste FECHADO na Google Play com 12–15 testadores por 14 dias seguidos** (requisito de conta pessoal nova para liberar produção), com monetização funcionando em licença de teste.

## §3 Usuário(s)
Testadores convidados (amigos/conhecidos do dono), Android variado, PT-BR majoritário. App de produtividade gamificado (v-pet) — uso diário curto.

## §4 Métrica-norte + entrada
Beta: (a) 12+ testadores ativos (opt-in + instalado) os 14 dias inteiros — critério da Play; (b) zero crash/ANR bloqueante; (c) zero perda de save; (d) compra de teste conclui ponta a ponta.

## §5 Restrições duras
- Stack: React 18 + TS + Vite 6, Capacitor 8.4 (APK carrega `server.url` = Worker `soulmon.mateus-sprnd.workers.dev`), Cloudflare Worker + KV + D1, Firebase `soulmon-app`.
- **GitHub Actions bloqueado por cobrança desde 16/09** → build/AAB tem que ser local (`HANDOFF-LOCAL-SEM-ACTIONS.md`).
- Espaço em disco: tudo em `E:/` ou `D:/`, nunca `C:/`.
- Corte do beta: **esperar as features em andamento fecharem** (guilda, masmorra, pesadelo) antes de cortar branch de release.
- Repo tem outras sessões trabalhando na `main` — trabalhar em worktree/branch, nunca reescrever histórico alheio.

## §6 Restrição regulatória / política
Políticas Google Play documentadas no repo: `docs/PLAY-DATA-SAFETY.md`, `docs/PLAY-FICHA.md`, `docs/BILLING-SETUP.md` §5. LGPD citada em `docs/E0-CONSENTIMENTO.md`. Requisito de teste fechado 12/14 para conta pessoal (informado ao dono). Qualquer outra norma → pergunta ao dono.

## §7 Marca e voz
Canônica. PT-BR e EN sempre. Voz: avatar que encoraja, nunca cobra (`docs/NARRATIVA-E-UNIVERSO.md`, `docs/PLANO-EVOLUCAO.md`).

## §8 Rastreador
Nenhum declarado — `docs/STATUS.md` e `docs/DEPENDE-DE-VOCE.md` são o registro vivo.

## §9 Donos
Tudo: o dono (Mateus). Jurídico: o dono.

## §10 Decisões do dono para este run
- Monetização: **vitalício + produtos atuais ativos** no beta (testers em licença de teste, sem cobrança real).
- **Implementar a assinatura cosmética trimestral** exatamente na régua da D10 (`docs/ASSINATURA-SPEC.md`): só `bg`/`furniture`, sem trial, sem Créditos, sem benefício de cuidado, entregue não é retirado.
- Keystore de upload + Play App Signing.
- Planos de contingência obrigatórios.
- Dono quer **não ser gargalo**: squad faz tudo que não exigir segredo/conta/aparelho; dúvidas via modal.

## §11 Escopo adicionado pelo dono (11/10, após Fase 0)
Chat com o Soulmon por IA: (1) criar tasks e hábitos conversando (ação proposta → confirmação do usuário → aplica pelas regras da UI); (2) responder dúvidas sobre o jogo com base curada do manual; (3) feedback encorajador sobre o comportamento. Provedor assumido: Groq (já integrado) + fallback Gemini. Tela de erro de rede customizada com identidade do app (dono).
