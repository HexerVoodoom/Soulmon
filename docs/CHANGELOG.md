# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

---

## [1.0.0] - 2024-12-28

### 🎉 Sistema de Progressão por Required/Cap

#### Added
- **Sistema de Required Fixo**: Cada forma evolutiva agora tem um número fixo de atividades necessárias por dia
- **Sistema de Cap Crescente**: Limite de atividades cadastradas aumenta com evolução mas nunca diminui
- **Campo `maxActivityCap`**: Adicionado ao GameState para tracking de cap máximo desbloqueado
- **Barra de Energia Fixa**: Sempre mostra `required` segmentos, independente de atividades cadastradas
- **Documentação Completa**: BACKLOG.md e README.md criados

#### Changed
- **Lógica de Dia Perfeito**: Agora requer `dailyDone >= required` ao invés de 100% das atividades
- **Cálculo de Energia**: `totalSteps` agora usa `FORM_REQUIREMENTS[level].required`
- **ProgressInfo**: Mostra "X / Y (mínimo)" ao invés de "precisa 100%"
- **Árvore Evolutiva**: Simplificada para DigiEgg → Pichimon → Pukamon → Tapirmon → Champions → etc
- **HP por Forma**: Atualizado para usar `MAX_HP_BY_FORM` do progression.ts
- **Degeneração**: Agora dá metade dos dias necessários já preenchidos ao degenerar

#### Fixed
- **Posição dos Corações**: Movidos de canto superior direito para esquerdo
- **HP do DigiEgg**: Corrigido de 2 para 1 HP
- **Barra de Energia Visual**: Agora renderiza corretamente com gap de 6px e efeito glow
- **Dias da Semana**: Atividades criadas antes de Rookie agora têm todos os dias marcados por padrão
- **Perda de HP**: Agora perde corações inteiros ao invés de metade

#### Removed
- **Funções Deprecated**: `getBaseDaysForStage()` e `calculateDaysNeeded()` removidas

---

## [0.9.0] - 2024-12-27

### Interface do Digimon Refinada

#### Changed
- **Box Principal**: Cantos ajustados para `rounded-[10px]` com borda `1.1px solid #1F2A39`
- **Área do Partner**: Refinamentos de proporção e posicionamento
- **Largura da Barra de Energia**: Reduzida para 26px fixos
- **ChatBox**: Removido círculo decorativo do microfone

#### Fixed
- **Sistema de Corações**: Agora perde inteiros ao invés de metade
- **Barra de Energia**: Corrigido de `w-3` para `w-full` no componente EnergyBar

---

## [0.8.0] - 2024-12-26

### Sistema de Onboarding Completo

#### Added
- **Tela de Boas-vindas**: Background específico e input de nome
- **Modal Adaptado**: Primeira atividade criada através de modal personalizado
- **Textos Personalizados**: Mensagens de boas-vindas contextuais

#### Removed
- **Atividades Padrão**: Eliminadas todas as tarefas "nativas" pré-criadas

---

## [0.7.0] - 2024-12-25

### Sistema de Chat com IA

#### Added
- **Chat Integrado**: Comunicação com Digimon usando API Groq
- **Criação Automática de Atividades**: IA gera atividades via chat
- **Configurações de IA**: Modal para ajustar preferências da IA
- **Sistema de Skins**: Múltiplas aparências para o Digimon

---

## [0.6.0] - 2024-12-24

### Sistema de Atividades Reformulado

#### Added
- **Tasks vs Activities**: Checkbox único para tasks, seleção de dias para activities
- **Timer/Alarme**: Sistema sempre disponível para ambos os tipos
- **Ícones Automáticos**: Aplicados por categoria
- **Steps Opcionais**: Ambos os tipos podem ter etapas

#### Changed
- **Layout**: Migrado para full-screen
- **Grid de Dias**: Interface melhorada para seleção de dias da semana

---

## [0.5.0] - 2024-12-23

### Sistema de Evolução

#### Added
- **3 Branches**: Virus (Verde), Data (Azul), Vaccine (Amarelo)
- **Sistema de Atributos**: Categorias concedem pontos específicos
- **Evolução por Branch**: Caminho evolutivo determinado por pontos dominantes
- **Unlock System**: Rastreamento de formas desbloqueadas

---

## [0.4.0] - 2024-12-22

### Sistema de HP e Care

#### Added
- **Sistema de Corações**: HP visual com sprites pixel-art
- **Care Events**: Poop e food events aleatórios
- **Degeneração**: Perda de HP leva a formas anteriores
- **Restore HP**: HP restaurado ao evoluir

---

## [0.3.0] - 2024-12-21

### Sistema de Temas

#### Added
- **Tema Default**: Design moderno e clean
- **Tema Win98**: Estética Windows 98 retrô com efeitos CRT
- **Tema Glitch**: Visual cyberpunk com efeitos de distorção

---

## [0.2.0] - 2024-12-20

### Core Features

#### Added
- **CompanionHUD**: Área de exibição do Digimon
- **Animações**: Walking, squash/stretch, mood states
- **Daily Reset**: Sistema de reset à meia-noite
- **LocalStorage**: Persistência de dados
- **Sprites**: Múltiplas formas evolutivas

---

## [0.1.0] - 2024-12-19

### Initial Release

#### Added
- **Estrutura Base**: React + TypeScript + Tailwind
- **Supabase Integration**: Backend configurado
- **Activity System**: Criação e tracking de atividades
- **XP System**: Ganho de experiência básico

---

## Próximas Versões Planejadas

### [1.1.0] - Futuro
- [ ] Sons e efeitos sonoros
- [ ] Animações de evolução elaboradas
- [ ] Tutorial interativo
- [ ] Sistema de conquistas

### [1.2.0] - Futuro
- [ ] Exportar/importar dados
- [ ] Múltiplos slots de save
- [ ] Compartilhamento de progresso

### [2.0.0] - Futuro
- [ ] Multiplayer features
- [ ] Leaderboards
- [ ] Daily challenges
- [ ] Special events

---

## Formato do Changelog

Este changelog segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

### Tipos de Mudanças
- **Added** para novas funcionalidades
- **Changed** para mudanças em funcionalidades existentes
- **Deprecated** para funcionalidades que serão removidas
- **Removed** para funcionalidades removidas
- **Fixed** para correções de bugs
- **Security** para vulnerabilidades de segurança
