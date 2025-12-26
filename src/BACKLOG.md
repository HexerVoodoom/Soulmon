# 📋 DigiApp - Product Backlog & Change Log

> **Status**: App publicado no Google Play (Teste Interno)  
> **Última Atualização**: 26 de Dezembro de 2024  
> **Versão Atual**: 1.0.1

---

## 🎯 Sistema de Versionamento

### Estrutura: `MAJOR.MINOR.PATCH`

- **MAJOR**: Mudanças arquiteturais ou features que quebram compatibilidade
- **MINOR**: Novas features ou mudanças visuais significativas
- **PATCH**: Bugfixes e ajustes pequenos

---

## ✅ CHANGELOG - Versão 1.0.1 (Em Desenvolvimento)

### 🎨 UI/UX Changes

**DONE ✅**
- [x] Atualização completa do sistema de cores dos atributos
  - Virus: `#22A900` (verde)
  - Data: `#009ED8` (azul)
  - Vaccine: `#E69600` (amarelo/laranja)
  - Localizações atualizadas:
    - `/components/AttributeBadges.tsx` - badges de atributos na home
    - `/components/EvolutionPath.tsx` - CURRENT ATTRIBUTES e branch selector buttons
    - `/components/CreateModal.tsx` - barras de progresso de atributos
  - Cores consistentes em todos os componentes

**DONE ✅**
- [x] Padronização dos gradientes dos botões de ação
  - Gradiente: `from-[#3e4753] to-[#687991]` (cinza escuro → cinza azulado)
  - Aplicado em:
    - Botão "Nova Atividade" (`/components/AttributeBadges.tsx`)
    - Botão "Create Task/Activity" (`/components/CreateModal.tsx`)
    - Botão "Add Step" (`/components/CreateModal.tsx`)
  - Texto branco com efeito `hover:brightness-110`

**DONE ✅**
- [x] Mudança do botão de envio de texto no chat (preto → branco)
  - Localização: `/components/ChatBox.tsx` linha ~553
  - Tema Default: `text-white` ao invés de `text-black`
  - Mantém `text-black` em temas Glitch e Win98

**DONE ✅**
- [x] Remoção da página de "Configurações" como view separada
  - Ainda existe a view 'widgets' mas será repensada futuramente

**DONE ✅**
- [x] Remoção do botão Save/Load do Header
  - SaveLoadButton.tsx ainda existe mas não é mais usado
  - Antigravity irá implementar autosave/autoload

**DONE ✅**
- [x] Adição de botão "Configurações" (Settings) no Header
  - Ícone: `Settings` do lucide-react
  - Posição: Canto direito do menu (após BarChart3)
  - Componente: `/components/Header.tsx`

**DONE ✅**
- [x] Criação do SettingsModal
  - Novo componente: `/components/SettingsModal.tsx`
  - Contém:
    - Toggle "AI Chat / Keywords" (migrado do SaveLoadButton)
    - Botão "Configurar IA" que abre AISettingsModal
    - Info note explicativa
  - Suporta todos os 3 temas (Default, Win98, Glitch)

**DONE ✅**
- [x] Integração do Toggle AI Chat dentro do modal de Configurações
  - Toggle visual com animação
  - Indica se está usando IA (Groq) ou Keywords
  - Persiste no localStorage

### 🔧 Arquitetura

**DONE ✅**
- [x] Refatoração do sistema de configurações
  - Criado `SettingsModal` unificado
  - `AISettingsModal` agora é chamado de dentro do SettingsModal
  - Removido `SaveLoadButton` do fluxo principal (não deletado, pode ser útil para debug)

**DONE ✅**
- [x] Atualização do App.tsx
  - Substituído estado `saveLoadOpen` por `settingsOpen`
  - Removido estado `aiSettingsOpen` (gerenciado internamente pelo SettingsModal)
  - Import do SettingsModal ao invés de SaveLoadButton

---

## 📝 BACKLOG - Próximas Versões

### 🔄 Versão 1.0.2 - Antigravity Integration

**TODO 🔲**
- [ ] Integrar sistema de autosave do Antigravity
  - Remover localStorage manual
  - Usar APIs do Antigravity para persistência
  - Testar sincronização automática
  - Documentar endpoints e formato de dados

**TODO 🔲**
- [ ] Integrar sistema de autoload do Antigravity
  - Carregar estado inicial do servidor
  - Fallback para estado default se não houver dados
  - Loading state durante carregamento inicial

**TODO 🔲**
- [ ] Adicionar indicador de sincronização
  - Ícone de "sync" ou "cloud" no header
  - Estados: synced, syncing, error
  - Toast notifications para erros de sync

---

### 🎨 Versão 1.0.3 - Polish & UX Improvements

**TODO 🔲**
- [ ] Melhorar feedback visual do toggle AI Chat
  - Adicionar label "AI" e "Keywords" dentro do toggle
  - Animação de transição mais suave

**TODO 🔲**
- [ ] Reorganizar view "Configurações" (widgets)
  - Decisão: Manter ou remover?
  - Se manter: Adicionar opções de skin e outras configs
  - Se remover: Integrar skins no SettingsModal

**TODO 🔲**
- [ ] Adicionar tutorial/onboarding
  - First-time user experience
  - Explicar sistema de evolução
  - Mostrar como criar atividades via IA

**TODO 🔲**
- [ ] Melhorar responsividade mobile
  - Testar em diferentes tamanhos de tela
  - Ajustar padding/margins
  - Verificar scroll behavior

---

### 🚀 Versão 1.1.0 - New Features

**TODO 🔲**
- [ ] Sistema de notificações
  - Lembrete para completar tarefas
  - Alertas de cuidado (HP baixo, poop, fome)
  - Notificação de evolução disponível

**TODO 🔲**
- [ ] Histórico de evolução visual
  - Timeline das evoluções
  - Galeria de formas desbloqueadas
  - Stats de cada forma

**TODO 🔲**
- [ ] Sistema de conquistas/achievements
  - Badges por marcos alcançados
  - Recompensas especiais
  - Integração com gamificação

**TODO 🔲**
- [ ] Modo offline melhorado
  - Sync queue para ações offline
  - Indicador claro de modo offline
  - Conflito resolution ao reconectar

---

### 🐛 Versão 1.0.4 - Bugfixes (Conforme Reportados)

**TODO 🔲**
- [ ] Lista de bugs a serem investigados:
  - (Adicionar conforme usuários reportarem)

---

## 🎯 FEATURES FUTURAS (Backlog Longo Prazo)

### 💾 Data & Sync
- [ ] Backup em nuvem (Supabase Storage)
- [ ] Exportar/Importar dados em JSON
- [ ] Histórico de versões do save
- [ ] Sync cross-device (multi-device support)

### 🎮 Gameplay
- [ ] Minigames para ganhar XP extra
- [ ] Sistema de itens (comida, remédios, acessórios)
- [ ] Batalhas entre Digimons (PvP ou PvE)
- [ ] Eventos temporários/sazonais
- [ ] Sistema de amizades (conectar com outros usuários)

### 🎨 Customização
- [ ] Mais skins/temas (Gameboy, Terminal, Neon, etc.)
- [ ] Customização de cores por usuário
- [ ] Wallpapers/backgrounds personalizados
- [ ] Animações de evolução customizadas

### 🤖 IA & Smart Features
- [ ] Sugestões inteligentes de atividades
- [ ] Análise de padrões de produtividade
- [ ] Coaching personalizado baseado em histórico
- [ ] Voice commands (além de transcrição)
- [ ] Chat por voz (TTS para respostas do Digimon)

### 📊 Analytics & Insights
- [ ] Dashboard de produtividade
- [ ] Gráficos de progresso por período
- [ ] Comparação com semanas/meses anteriores
- [ ] Insights de IA sobre performance
- [ ] Export de relatórios (PDF, CSV)

---

## 📋 TEMPLATES PARA NOVAS ISSUES

### Bug Report Template
```markdown
**Versão**: 
**Device**: 
**OS**: 

**Descrição do Bug**:


**Passos para Reproduzir**:
1. 
2. 
3. 

**Comportamento Esperado**:


**Comportamento Atual**:


**Screenshots**: (se aplicável)


**Logs de Console**: (se disponível)

```

### Feature Request Template
```markdown
**Feature Nome**: 

**Descrição**:


**Problema que Resolve**:


**Solução Proposta**:


**Alternativas Consideradas**:


**Prioridade**: 🔴 Alta | 🟡 Média | 🟢 Baixa

**Estimativa de Esforço**: S | M | L | XL

**Dependências**:


**Mockups/Design**: (se aplicável)

```

---

## 🔄 PROCESSO DE ATUALIZAÇÃO COM ANTIGRAVITY

### Fluxo de Deploy

1. **Desenvolvimento Local**
   - Fazer alterações no código
   - Testar localmente
   - Atualizar este BACKLOG.md

2. **Commit & Push**
   - Git commit com mensagem descritiva
   - Git push para repositório

3. **Build APK**
   - Antigravity detecta mudanças
   - Gera novo APK automaticamente
   - Incrementa version code

4. **Deploy no Google Play**
   - Upload manual do APK para Play Console
   - Ou: Configurar Antigravity para deploy automático
   - Atualizar release notes

5. **Monitoramento**
   - Verificar crash reports
   - Coletar feedback dos testadores
   - Atualizar backlog com bugs/features

### Checklist Pré-Deploy

- [ ] Código testado localmente
- [ ] Backlog atualizado
- [ ] Version number incrementado no manifest
- [ ] Release notes escritas
- [ ] Assets (ícones, etc.) atualizados se necessário
- [ ] Changelog atualizado neste arquivo

---

## 📞 SUPORTE & CONTATO

**Developer**: [Seu Nome/Email]  
**Play Store**: [Link quando publicado]  
**Feedback**: [Canal de feedback]

---

## 📊 MÉTRICAS & KPIS

### Versão 1.0.0 (Baseline)

**Métricas de Uso**:
- DAU (Daily Active Users): TBD
- Retention D1/D7/D30: TBD
- Avg. Session Duration: TBD
- Avg. Activities Completed/Day: TBD

**Métricas Técnicas**:
- Crash-free Rate: 100% (target)
- API Response Time (chat): <2s (target)
- App Size: ~[X]MB
- Load Time: <3s (target)

**Métricas de Engagement**:
- % Users using AI Chat: TBD
- % Users reaching Evolution Stage 3+: TBD
- Avg. Messages per Session: TBD

*(Atualizar após primeira semana de beta)*

---

**Última atualização deste arquivo**: 26/12/2024  
**Próxima revisão planejada**: Após implementação da v1.0.2