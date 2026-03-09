# DigiApp - Backlog e Documentação de Build

## 📋 Status Atual da Implementação

### ✅ Completamente Implementado

#### 1. Sistema de Progressão por Required/Cap
- **Energia fixa por nível**: Cada forma tem um número fixo de atividades necessárias (required)
- **Barra de energia**: Sempre mostra `required` segmentos, independente de quantas atividades estão cadastradas
- **Cap de atividades**: Sistema que aumenta conforme evolui mas nunca diminui
- **Valores por forma**:
  - DigiEgg: required=1, cap=2
  - Baby I (Pichimon): required=2, cap=3
  - Baby II (Pukamon): required=3, cap=5
  - Rookie (Tapirmon): required=4, cap=6
  - Champion (Tuskmon/Monochromon/Bakemon): required=5, cap=7
  - Ultimate (Gigadramon/Triceramon/Digitamamon): required=6, cap=8
  - Mega (Gaioumon/UltimateBrachiomon/Titamon): required=7, cap=9
  - Ultra (Gaioumon-Itto): required=8, cap=10

#### 2. Sistema de HP e Degeneração
- **DigiEgg**: 1 HP (1 coração)
- **Baby I**: 4 HP (2 corações × 2)
- **Baby II**: 6 HP (3 corações × 2)
- **Rookie**: 6 HP (3 corações × 2)
- **Champion**: 8 HP (4 corações × 2)
- **Ultimate**: 10 HP (5 corações × 2)
- **Mega**: 12 HP (6 corações × 2)
- **Ultra**: 14 HP (7 corações × 2)
- **Perda de HP**: Perde 1 coração inteiro se não completar NENHUMA atividade no dia
- **Degeneração**: HP = 0 → volta para forma anterior com metade dos dias necessários já preenchidos

#### 3. Lógica de Dia Perfeito
- **Critério**: `dailyDone >= required` (não precisa 100% das atividades, só o mínimo)
- **Consequências**:
  - ✅ Dia perfeito: Ganha 1 ponto de progresso + XP + atributos
  - ❌ Nenhuma atividade: Perde 1 HP
  - ⚠️ Parcial: Não ganha progresso mas não perde HP

#### 4. Interface e UX
- **CompanionHUD**:
  - Corações no canto superior esquerdo
  - Barra de energia vertical com segmentos fixos baseados em required
  - Efeito blur/glow nos segmentos preenchidos (#08e610)
  - Segmentos vazios em cinza (#364153)
- **ProgressInfo**:
  - Mostra "X / Y (mínimo)" ao invés de "precisa 100%"
  - Barra verde quando atinge required
- **CreateModal**:
  - Verifica cap antes de permitir nova atividade
  - Dias da semana pré-selecionados (todos marcados) antes de Rookie

#### 5. Árvore Evolutiva
```
DigiEgg (1 dia)
    ↓
Pichimon (2 dias)
    ↓
Pukamon (3 dias)
    ↓
Tapirmon (4 dias)
    ↓
Champion (5 dias) → Tuskmon (Virus) / Monochromon (Data) / Bakemon (Vaccine)
    ↓
Ultimate (6 dias) → Gigadramon (Virus) / Triceramon (Data) / Digitamamon (Vaccine)
    ↓
Mega (7 dias) → Gaioumon (Virus) / UltimateBrachiomon (Data) / Titamon (Vaccine)
    ↓
Ultra (8 dias) → Gaioumon-Itto (requer ter desbloqueado os 3 Megas)
```

#### 6. Sistema de Onboarding
- Tela inicial de boas-vindas com background específico
- Input de nome do usuário
- Textos de boas-vindas personalizados
- Modal adaptado para criar primeira atividade
- Sem atividades padrão "nativas"

#### 7. Sistema de Chat e IA
- Chat com o Digimon usando API Groq (gratuita)
- IA cria atividades automaticamente via chat
- Sistema de skins completo
- Temas: Default, Win98, Glitch

#### 8. Sistema de Atividades
- **Tasks**: Execução única com checkbox simples
- **Activities**: Recorrentes com seleção de dias da semana
- Timer/alarme sempre disponível
- Ícones automáticos por categoria
- Steps opcionais para ambos

#### 9. Persistência Local
- LocalStorage para sincronização simples
- Chave: `digiapp_state_v3`
- Campos novos adicionados: `maxActivityCap`

---

## 🔧 Arquivos Principais Modificados

### Core
- `/App.tsx` - Lógica principal, state management, daily reset
- `/types/progression.ts` - Definições de required/cap/HP por forma

### Components
- `/components/CompanionHUD.tsx` - HUD do Digimon, corações, barra de energia
- `/components/EnergyBar.tsx` - Barra vertical de energia com efeito glow
- `/components/ProgressInfo.tsx` - Exibição de progresso diário e evolução
- `/components/CreateModal.tsx` - Modal de criação com verificação de cap
- `/components/ChatBox.tsx` - Chat com IA integrado

### Utils
- `/utils/supabase/info.tsx` - Informações do Supabase (PROTEGIDO)
- `/supabase/functions/server/kv_store.tsx` - KV store (PROTEGIDO)

---

## 🎨 Design Specs

### Cores do Sistema
- **Virus (Verde)**: #22A900
- **Data (Azul)**: #009ED8
- **Vaccine (Amarelo/Laranja)**: #E69600
- **Energia ativa**: #08e610 (verde brilhante com blur)
- **Energia vazia**: #364153 (cinza escuro)
- **Background Box**: #6A7282
- **Border Box**: #1F2A39

### Medidas
- **Box principal**: `rounded-[10px]`, border `1.1px solid #1F2A39`
- **Área do partner**: 151px altura
- **Barra de energia**: 26px largura, segmentos de 11.998px com gap de 6px
- **Corações**: 22px altura × 23px largura

---

## ⚠️ Pontos de Atenção para Build

### 1. Arquivos Protegidos (NÃO MODIFICAR)
```
/supabase/functions/server/kv_store.tsx
/utils/supabase/info.tsx
/components/figma/ImageWithFallback.tsx
```

### 2. Variáveis de Ambiente Necessárias
Já fornecidas pelo usuário:
- ✅ SUPABASE_URL
- ✅ SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ SUPABASE_DB_URL
- ✅ GROQ_API_KEY

### 3. Assets Figma
- Usar esquema `figma:asset` para imagens raster (PNG, JPG)
- Usar paths relativos para SVGs em `/imports`
- Exemplo: `import img from "figma:asset/abc123.png"`
- **NUNCA** usar prefixos de path com figma:asset

### 4. Compatibilidade
- Mobile-first design
- Responsive layout
- Suporte a 3 temas (Default, Win98, Glitch)

---

## 🐛 Bugs Conhecidos Corrigidos

1. ✅ Corações movidos para canto superior esquerdo (era direito)
2. ✅ DigiEgg agora tem 1 HP ao invés de 2
3. ✅ Barra de energia agora renderiza corretamente com gap de 6px
4. ✅ Atividades criadas antes de Rookie agora têm todos os dias marcados
5. ✅ Sistema de HP agora perde corações inteiros ao invés de metade

---

## 📦 Dependências Principais

### Já Instaladas
- React
- Tailwind CSS v4.0
- Lucide React (ícones)
- Motion/React (animações)
- Recharts (gráficos)
- Sonner (toasts)
- Hono (servidor)
- Supabase (backend)

### Versões Específicas
- `react-hook-form@7.55.0`
- `sonner@2.0.3`

---

## 🚀 Próximos Passos Sugeridos (Backlog Futuro)

### Prioridade Alta
- [ ] Testes de build em produção
- [ ] Verificar performance com muitas atividades
- [ ] Testar fluxo completo de evolução DigiEgg → Ultra

### Prioridade Média
- [ ] Adicionar sons/efeitos sonoros
- [ ] Animações de evolução mais elaboradas
- [ ] Tutorial interativo pós-onboarding
- [ ] Sistema de conquistas/achievements

### Prioridade Baixa
- [ ] Exportar/importar dados
- [ ] Múltiplos slots de save
- [ ] Compartilhamento de progresso
- [ ] Leaderboards

---

## 📝 Notas Técnicas

### LocalStorage Schema
```typescript
{
  activities: Activity[],
  tasks: Task[],
  completedTasks: CompletedTask[],
  activityStats: ActivityStats,
  healthPoints: number,
  maxHealthPoints: number,
  perfectDays: number,
  totalXP: number,
  virusPoints: number,
  dataPoints: number,
  vaccinePoints: number,
  lastResetDate: string,
  evolutionStage: string,
  digivolutionSegments: number, // Deprecated mas mantido
  digivolutionSegmentsNeeded: number, // Deprecated mas mantido
  poopEventScheduled: number | null,
  foodEventsScheduled: number[],
  poopEventCompleted: boolean,
  foodEventsCompleted: number[],
  unlockedEvolutions: string[],
  degeneratedByHP: boolean,
  currentBranch: 'virus' | 'data' | 'vaccine',
  lastDayWasPerfect: boolean,
  maxActivityCap: number // NOVO!
}
```

### Daily Reset Logic
Executa à meia-noite:
1. Calcula `dailyDone` (atividades completadas ontem)
2. Verifica `dailyDone >= required` → dia perfeito
3. Se dia perfeito: +1 perfectDays, ganha XP/atributos
4. Se `dailyDone === 0`: -1 HP
5. Se `perfectDays >= required`: evolui
6. Se HP === 0: degenera com metade dos dias
7. Reset todos os checkboxes e status

### Evolution Trigger
```typescript
if (perfectDays >= FORM_REQUIREMENTS[currentLevel].required) {
  // Evolui para próxima forma
  // Reset perfectDays = 0
  // Atualiza maxActivityCap se novo cap > atual
}
```

### Degeneration Logic
```typescript
if (HP === 0) {
  // Volta para forma anterior
  // Restaura HP da nova forma
  // perfectDays = Math.floor(required / 2)
}
```

---

## ✅ Checklist Final de Build

### Pré-Build
- [x] Todos os componentes criados
- [x] Types e interfaces definidos
- [x] Sistema de progressão implementado
- [x] Lógica de daily reset completa
- [x] UI refinada conforme design Figma

### Build
- [ ] Verificar imports de assets Figma
- [ ] Confirmar variáveis de ambiente
- [ ] Testar onboarding flow
- [ ] Testar criação de atividades até cap
- [ ] Testar daily reset manual (mudar data do sistema)
- [ ] Testar degeneração por HP
- [ ] Testar evolução completa

### Pós-Build
- [ ] Smoke test em produção
- [ ] Verificar performance mobile
- [ ] Testar em diferentes browsers
- [ ] Confirmar persistência de dados

---

## 📞 Suporte

**Desenvolvedor**: DigiApp Team  
**Stack**: React + TypeScript + Tailwind v4 + Supabase  
**API Externa**: Groq (gratuita)  
**Tema**: Pixel-art retrô, estilo Digimon/Tamagotchi  

---

**Última atualização**: Implementação completa do sistema de required/cap por forma  
**Versão do State**: v3 (digiapp_state_v3)  
**Status**: ✅ Pronto para build
