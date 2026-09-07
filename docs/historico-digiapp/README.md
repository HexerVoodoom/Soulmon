# 🎮 DigiApp - Gamified Productivity Companion

Um aplicativo gamificado de produtividade e motivação com estética pixel-art retrô onde os usuários completam tarefas da vida real para evoluir e cuidar de um companheiro digital que cresce através de estágios evolutivos (similar a Digimon/Tamagotchi).

---

## 🚀 Quick Start

### Desenvolvimento
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

---

## 🎯 Conceito Principal

### Sistema de Progressão
- **Required**: Número mínimo de atividades que devem ser completadas por dia
- **Cap**: Número máximo de atividades que podem ser cadastradas (aumenta com evolução, nunca diminui)
- **Dia Perfeito**: Completar `required` atividades/tasks = +1 progresso de evolução
- **HP**: Não completar nenhuma atividade = -1 HP
- **Degeneração**: HP = 0 → volta para forma anterior com metade dos dias já preenchidos

### Branches de Evolução
- 🦠 **Virus (Verde)**: #22A900 - Foco em Health, Wellness, Fitness
- 💾 **Data (Azul)**: #009ED8 - Foco em Study, Work, Creativity
- 💉 **Vaccine (Amarelo)**: #E69600 - Foco em Social, Fun, Self-care

---

## 📊 Tabela de Progressão

| Forma | Required | Cap | HP | Dias para Evoluir |
|-------|----------|-----|----|--------------------|
| DigiEgg | 1 | 2 | 1 | 1 dia perfeito |
| Pichimon (Baby I) | 2 | 3 | 4 | 2 dias perfeitos |
| Pukamon (Baby II) | 3 | 5 | 6 | 3 dias perfeitos |
| Tapirmon (Rookie) | 4 | 6 | 6 | 4 dias perfeitos |
| Champion | 5 | 7 | 8 | 5 dias perfeitos |
| Ultimate | 6 | 8 | 10 | 6 dias perfeitos |
| Mega | 7 | 9 | 12 | 7 dias perfeitos |
| Ultra | 8 | 10 | 14 | 8 dias perfeitos |

---

## 🗂️ Estrutura do Projeto

```
/
├── App.tsx                 # Componente principal e lógica de state
├── components/
│   ├── CompanionHUD.tsx    # HUD do Digimon (HP, energia, sprite)
│   ├── EnergyBar.tsx       # Barra vertical de energia
│   ├── ProgressInfo.tsx    # Info de progresso diário e evolução
│   ├── CreateModal.tsx     # Modal para criar atividades/tasks
│   ├── ChatBox.tsx         # Chat com IA
│   └── ...
├── types/
│   ├── progression.ts      # Definições de required/cap/HP
│   └── attributes.ts       # Categorias e atributos
├── utils/
│   └── supabase/
│       └── info.tsx        # Config Supabase (PROTEGIDO)
├── supabase/
│   └── functions/
│       └── server/
│           ├── index.tsx   # Servidor Hono
│           └── kv_store.tsx # KV store (PROTEGIDO)
└── styles/
    └── globals.css         # Estilos globais + Tailwind v4
```

---

## 🎨 Design System

### Temas
- **Default**: Design moderno e clean
- **Win98**: Estilo Windows 98 retrô
- **Glitch**: Estética cyberpunk/glitch

### Cores Principais
```css
--virus: #22A900;
--data: #009ED8;
--vaccine: #E69600;
--energy-active: #08e610;
--energy-inactive: #364153;
--box-bg: #6A7282;
--box-border: #1F2A39;
```

### Componentes
- **Box Principal**: `rounded-[10px]`, border `1.1px solid #1F2A39`
- **Barra de Energia**: 26px width, segmentos 11.998px com gap 6px
- **Corações**: 22px × 23px, posição top-left

---

## 🔑 Variáveis de Ambiente

As seguintes secrets já foram configuradas:
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `SUPABASE_DB_URL`
- ✅ `GROQ_API_KEY`

---

## 📱 Features

### Core
- ✅ Sistema de evolução baseado em dias perfeitos
- ✅ Barra de energia com required fixo por nível
- ✅ Sistema de HP com degeneração
- ✅ Cap de atividades que cresce com evolução

### Atividades
- ✅ **Tasks**: Execução única (checkbox simples)
- ✅ **Activities**: Recorrentes (seleção de dias da semana)
- ✅ Steps opcionais para ambos
- ✅ Timer/alarme configurável
- ✅ Ícones automáticos por categoria

### Chat & IA
- ✅ Chat com Digimon usando Groq API
- ✅ IA cria atividades automaticamente
- ✅ Mensagens contextuais baseadas em humor/evolução

### Onboarding
- ✅ Tela de boas-vindas personalizada
- ✅ Input de nome do usuário
- ✅ Criação da primeira atividade guiada
- ✅ Sem atividades padrão pré-criadas

### Outros
- ✅ Persistência local (LocalStorage)
- ✅ Sistema de care events (poop, food)
- ✅ Stats e histórico
- ✅ Seleção de skins
- ✅ Mobile-first responsive

---

## 🧪 Testing Checklist

### Fluxo Principal
- [ ] Onboarding completo (nome → primeira atividade)
- [ ] Criar atividade até atingir cap
- [ ] Completar required atividades = dia perfeito
- [ ] Evolução após dias perfeitos suficientes
- [ ] Perda de HP por não completar atividades
- [ ] Degeneração quando HP = 0

### Daily Reset
- [ ] Reset à meia-noite
- [ ] Checkboxes resetados
- [ ] Progresso calculado corretamente
- [ ] HP atualizado baseado em performance

### UI/UX
- [ ] Barra de energia mostra required segmentos
- [ ] Corações no canto superior esquerdo
- [ ] Temas (Default/Win98/Glitch) funcionando
- [ ] Chat com IA respondendo
- [ ] Responsivo em mobile

---

## 📚 Documentação Adicional

- **BACKLOG.md**: Documentação completa de implementação e pontos técnicos
- **types/progression.ts**: Definições de progressão por forma
- **components/**: Cada componente com sua própria lógica documentada

---

## 🐛 Troubleshooting

### LocalStorage não persiste
- Verificar se `digiapp_state_v3` existe no localStorage
- Limpar e recarregar: `localStorage.clear()`

### Barra de energia não aparece
- Verificar se `totalSteps` e `completedSteps` estão sendo passados corretamente
- Confirmar que `FORM_REQUIREMENTS` tem o evolutionStage

### Evolução não acontece
- Verificar se `perfectDays >= required`
- Confirmar que daily reset está executando
- Checar se `lastResetDate` está atualizando

### Cap não está limitando
- Verificar `maxActivityCap` no gameState
- Confirmar que CreateModal recebe `activitiesCap` correto
- Checar se cap aumenta ao evoluir

---

## 🤝 Contribuindo

Este projeto está em desenvolvimento ativo. Para contribuir:
1. Nunca modificar arquivos protegidos
2. Seguir o design system estabelecido
3. Manter mobile-first approach
4. Testar em todos os 3 temas

---

## 📄 Licença

Projeto proprietário - DigiApp Team

---

## 🎯 Status

**Versão Atual**: 1.0.0  
**State Schema**: v3  
**Última Atualização**: Sistema de required/cap implementado  
**Status**: ✅ Pronto para build e produção

---

**Desenvolvido com** ❤️ **e** ☕
