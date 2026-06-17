# Plano de Melhorias — DigiApp
> Criado em: 2026-06-17  
> Branch: `claude/digiapp-code-improvements-q44ol2`  
> Para retomar: leia este arquivo e veja quais módulos estão marcados como ✅

---

## Como retomar a sessão
1. Leia este arquivo
2. Identifique o último módulo marcado ✅
3. Continue do próximo módulo pendente
4. Consulte o código nas pastas indicadas em cada módulo

---

## Módulos

### MOD-01 — Remover console.log de produção ✅
**Arquivos**: `src/App.tsx`, `src/components/ChatBox.tsx`  
**O que fazer**: Substituir todos `console.log/warn` por guards `import.meta.env.DEV`  
**Risco**: Baixo

---

### MOD-02 — Corrigir tipos `any` ✅
**Arquivos**: `src/components/ChatBox.tsx`, `src/components/AISettingsModal.tsx`  
**O que fazer**:
- Criar interface `AISettings` exportada em `AISettingsModal.tsx` (já existe, só usar)
- Substituir `aiSettings?: any` em `ChatBox.tsx` pelo tipo correto
**Risco**: Baixo

---

### MOD-03 — Corrigir não-determinismo na evolução ✅
**Arquivo**: `src/utils/dailyReset.ts`, `src/App.tsx`  
**O que fazer**:
- `getPreviousForm()`: em vez de `Math.random()`, usar o `branch` do estado para
  devolver a forma anterior que corresponde ao branch atual do usuário
- Na degeneração em `App.tsx` (linha ~594): mesma lógica, usar `prev.currentBranch`
**Risco**: Médio — afeta lógica de progressão

---

### MOD-04 — Tratamento robusto de erro no ChatBox ✅
**Arquivo**: `src/components/ChatBox.tsx`  
**O que fazer**:
- Na `getAIResponse()`: em vez de silenciosamente fallback, mostrar toast de aviso
  usando `sonner` (já instalado) quando a API falhar
- Na `transcribeAudio()`: mesma lógica de toast
- Adicionar debounce de 500ms no botão de envio para evitar spam
**Risco**: Baixo

---

### MOD-05 — Instalar Vitest e criar testes unitários ✅
**Arquivos novos**: `src/utils/dailyReset.test.ts`, `src/types/progression.test.ts`  
**O que fazer**:
- Adicionar `vitest` + `@vitest/ui` ao `devDependencies`
- Criar script `"test": "vitest run"` no `package.json`
- Escrever testes para:
  - `wasDayPerfect()` — casos: dia perfeito, dia incompleto, sem atividades
  - `countCompletedYesterday()` — casos: 0 completas, todas, parcial
  - `getNextEvolution()` — cada transição de estágio
  - `getPreviousForm()` — degeneração de cada estágio
  - `getStageLevel()` — mapeamento estágio → nível
**Risco**: Nenhum (só adiciona)

---

### MOD-06 — Extrair hooks customizados do App.tsx ✅
**Arquivos novos**:
- `src/hooks/useGameState.ts` — estado central + persistência localStorage
- `src/hooks/useDailyReset.ts` — lógica de reset diário + timer
- `src/hooks/useCareSystem.ts` — agendamento e verificação de care events
- `src/hooks/useProgressTracking.ts` — `calculateDailyTotal`, `calculateDailyDone`, `calculateProgress`, `calculateTodayAttributes`

**O que fazer**: Mover código atual do App.tsx para esses hooks, sem mudar o comportamento  
**Risco**: Alto — é a maior refatoração; testar manualmente após

---

### MOD-07 — Unificar CreateModal e TaskEditModal
**Arquivos**: `src/components/CreateModal.tsx`, `src/components/TaskEditModal.tsx`  
**O que fazer**:
- Extrair lógica de formulário comum para `src/hooks/useItemForm.ts`
- Ambos os modais usam o hook em vez de duplicar a lógica
**Risco**: Médio

---

### MOD-08 — Lazy loading dos modais grandes
**Arquivo**: `src/App.tsx`  
**O que fazer**:
- Usar `React.lazy()` + `Suspense` para:
  - `CreateModal` (660 linhas)
  - `ChatBox` (636 linhas) — só quando `useAI` ou chat aberto
  - `StatsPage`, `SettingsPage`, `EvolutionPath`
**Risco**: Baixo-médio

---

## Status resumido

| Módulo | Status | Prioridade |
|--------|--------|-----------|
| MOD-01 console.log | ✅ Concluído | P1 |
| MOD-02 tipos any | ✅ Concluído | P1 |
| MOD-03 não-determinismo | ✅ Concluído | P0 |
| MOD-04 error handling | ✅ Concluído | P0 |
| MOD-05 testes | ✅ Concluído | P0 |
| MOD-06 hooks | ✅ Concluído | P1 |
| MOD-07 modais | ⬜ Pendente | P2 |
| MOD-08 lazy loading | ⬜ Pendente | P2 |
