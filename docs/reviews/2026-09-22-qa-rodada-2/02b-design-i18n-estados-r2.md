# Design/DS/a11y/i18n/estados R2 (salvo pelo coordenador; tabela final)
| # | Achado | Sev | Conserto | Dono |
|---|---|---|---|---|
| F1 | Re-login com e-mail excluído (<30 d) = onboarding inteiro e wipe em loop, sem aviso de prazo | FATAL | 410 no `cloudLoad` do login barra ANTES do onboarding + prazo/alternativa | frontend+backend |
| T1 | Marcar feita sem desfazer nem confirmação; check 44 colado ao chevron 44 | alto | desmarcar no mesmo dia (reverter ganhos) ou toast "Desfazer" 5 s — REGRA: dono | frontend; dono |
| A3 | Banner de Termos preso atrás de "+N" | fixável | 1ª aparição em posição 1 | frontend; compliance |
| A4 | Sem link para Termos dentro do app | fixável | ActionRow em Ajuda com #en | frontend |
| E1 | Onboarding/tutorial/upgrade sem OfflineSeal; tutorial trata offline como "vazio" | fixável | montar selo acima dos return; distinguir error | frontend |
| E2 | Sprite próprio <img> sem onError → visor quebrado offline | fixável | onError → getSpriteForStage | frontend |
| A1 | Aviso conta excluída em role=status estático | fixável | heading/aria-live pós-mount | frontend |
| A2 | Idioma do aviso cai em EN se LANGUAGE não gravada | fixável | resolveLanguage() | frontend |
| A5 | Ajuda/Sobre: _blank sem aviso, sem #en | fixável | regra do banner no ActionRow | frontend |
| A6 | subject 'Soulmon — erro' PT-only | fixável | ternário; guard ganha subject/alt | frontend |
| A7 | mailto sem app de e-mail = no-op no APK | medir | fallback copiar e-mail | plataforma |
| A8 | Gate manda Firefox Android atualizar WebView | fixável | excluir /Firefox/i | frontend |
| A9 | Nome acessível do botão Decompor = 30 palavras | fixável | aria-describedby | frontend |
| A10 | Hint de IA some após 1ª busca | baixo | mostrar enquanto botão vivo | frontend |
| A11 | RitualCheck disabled + aria-disabled | baixo | só aria-disabled | frontend |
| A12 | Âncora do hábito em title hover-only | baixo | texto 12 muted | frontend |
| A13 | Desktop phrases "Tô de olho na sua produtividade"/"vi você digitando" (L11, afirma monitorar teclado) | fixável | trocar; narrativa.contract varrer desktop/ | narrativa |
| L1 | Flash EVOLUÇÃO! #2dd4bf ≈ 1,6:1 | baixo | --sm2-viewport-ink | frontend |
| L2 | Sombra copiada 3× fora de SM2_SHADOW_CARD | baixo | importar | frontend |
| R1 | figma/ImageWithFallback.tsx morto | ruído | apagar | frontend |
| R2 | desktop main.ts alt="pet" | ruído | alt="" | frontend |
i18n: 0 strings só-PT nos 20 arquivos seguintes; guard não cobre subject/alt/nós JSX. Tokens --sm2-* todos pareados claro/escuro. Estados: PostponeNudgeSheet e LibraryPage são referência (4 estados).
Sem dono: desfazer "feita" (regra), 30 d da lápide vs recriar (política), navegadores suportados nunca declarados.
