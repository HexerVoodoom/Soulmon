// Internationalization (i18n) structure for DigiApp

export type Language = 'en-US' | 'pt-BR';

export interface Translations {
  // Common
  common: {
    save: string;
    cancel: string;
    confirm: string;
    delete: string;
    edit: string;
    close: string;
    loading: string;
    error: string;
    success: string;
    yes: string;
    no: string;
    back: string;
    next: string;
  };

  // Onboarding
  onboarding: {
    welcome: string;
    enterName: string;
    namePlaceholder: string;
    start: string;
  };

  // Main Screen
  main: {
    healthPoints: string;
    energy: string;
    dailyGoal: string;
    perfectDays: string;
    evolutionProgress: string;
    tasksCompleted: string;
    of: string;
    noActivityRegistered: string;
    dayProgress: string;
    minimum: string;
    evolution: string;
    perfectDaysLabel: string;
    registeredActivities: string;
    maximum: string;
    singleExecution: string;
    uncheckTask: string;
    uncheckTaskMessage: string;
    editTask: string;
    newTask: string;
    companionNeedHelp: string;
    companionAmazing: string;
    companionGoodProgress: string;
    companionYouGotThis: string;
    companionBelieve: string;
    daySunday: string;
    dayMonday: string;
    dayTuesday: string;
    dayWednesday: string;
    dayThursday: string;
    dayFriday: string;
    daySaturday: string;
    viewHome: string;
    viewEvolution: string;
    viewStats: string;
    viewSettings: string;
  };

  // Activities
  activities: {
    title: string;
    completed: string;
    incomplete: string;
    addNew: string;
    create: string;
    edit: string;
    category: string;
    points: string;
    noActivities: string;
    createActivity: string;
    editActivity: string;
    activityName: string;
    activityNamePlaceholder: string;
    selectCategory: string;
    deleteActivity: string;
    confirmDelete: string;
    deleteMessage: string;
  };

  // Create/Edit Modal
  createModal: {
    newActivity: string;
    firstActivity: string;
    name: string;
    namePlaceholder: string;
    category: string;
    attributesPerActivity: string;
    steps: string;
    stepsOptional: string;
    addStep: string;
    executeOnce: string;
    weekdays: string;
    weekdaysRequired: string;
    selectAtLeastOneDay: string;
    defineDeadline: string;
    date: string;
    time: string;
    alarm: string;
    schedule: string;
    quickOptions: string;
    hoursBefore: string;
    hourBefore: string;
    minBefore: string;
    customTime: string;
    cancel: string;
    save: string;
    createAndStart: string;
    limitReached: string;
  };

  // Categories
  categories: {
    physical: string;
    mental: string;
    social: string;
    creative: string;
  };

  // Evolution
  evolution: {
    title: string;
    currentStage: string;
    nextStage: string;
    degenerate: string;
    confirmDegeneration: string;
    finalWarning: string;
    branches: string;
    virus: string;
    data: string;
    vaccine: string;
    evolutionTree: string;
    viewTree: string;
    stats_history: string;
    completed_activities: string;
    no_activities: string;
    completed_tasks: string;
    no_tasks: string;
    recent_history: string;
    no_history: string;
    just_now: string;
    mins_ago: string;
    hours_ago: string;
    yesterday: string;
    days_ago: string;
  };

  // Settings
  settings: {
    title: string;
    language: string;
    languageDescription: string;
    theme: string;
    ai: string;
    aiToggle: string;
    aiChatEnabled: string;
    keywordsOnly: string;
    aiDescription: string;
    aiDescriptionEnabled: string;
    aiDescriptionDisabled: string;
    configureAI: string;
    about: string;
    aboutDescription: string;
    version: string;
    guide: string;
    guideDescription: string;
    openGuide: string;
    saveData: string;
    loadData: string;
    resetApp: string;
    notifications: string;
    notificationsDescription: string;
    notificationsEnabled: string;
    notificationsDisabled: string;
  };

  // Chat
  chat: {
    title: string;
    typeMessage: string;
    send: string;
    aiSettings: string;
    tone: string;
    emojiIntensity: string;
    motivationStyle: string;
    aiDisabled: string;
    aiDisabledMessage: string;
    enableAI: string;
    microphoneError: string;
  };

  // Stats
  stats: {
    title: string;
    overview: string;
    attributes: string;
    virus: string;
    data: string;
    vaccine: string;
    total: string;
    level: string;
    stage: string;
    perfectDays: string;
    tasksCompleted: string;
    currentStreak: string;
    longestStreak: string;
    evolutionPath: string;
  };

  // Widget View
  widget: {
    title: string;
    todaysTasks: string;
    noTasks: string;
    allDone: string;
    dailyProgress: string;
  };

  // AI Settings Modal
  aiModal: {
    title: string;
    personalityTone: string;
    friendly: string;
    professional: string;
    playful: string;
    motivational: string;
    emojiUsage: string;
    none: string;
    minimal: string;
    moderate: string;
    high: string;
    motivationStyle: string;
    supportive: string;
    challenging: string;
    balanced: string;
    customInstructions: string;
    customPlaceholder: string;
  };

  // Guide Modal
  guide: {
    title: string;
    welcome: string;
    welcomeText: string;
    howItWorks: string;
    howItWorksText: string;
    evolutionSystem: string;
    evolutionSystemText: string;
    perfectDays: string;
    perfectDaysText: string;
    healthSystem: string;
    healthSystemText: string;
    attributes: string;
    attributesText: string;
    tips: string;
    tipsText: string;
  };

  // Confirm Dialog
  confirm: {
    areYouSure: string;
    cannotUndo: string;
  };

  // Evolution Stages
  stages: {
    digiegg: string;
    baby: string;
    inTraining: string;
    rookie: string;
    champion: string;
    ultimate: string;
    mega: string;
  };

  // Navigation
  nav: {
    home: string;
    chat: string;
    stats: string;
    settings: string;
    widget: string;
    evolution: string;
    debugMode: string;
  };

  // Messages
  messages: {
    taskCompleted: string;
    taskUncompleted: string;
    evolutionUnlocked: string;
    perfectDayAchieved: string;
    healthLow: string;
    gameOver: string;
    dataSaved: string;
    dataLoaded: string;
    appReset: string;
  };

  // Themes
  themes: {
    default: string;
    win98: string;
    glitch: string;
  };
}

export const translations: Record<Language, Translations> = {
  'en-US': {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      yes: 'Yes',
      no: 'No',
      back: 'Back',
      next: 'Next',
    },

    onboarding: {
      welcome: 'Welcome to DigiApp!',
      enterName: 'Enter your name',
      namePlaceholder: 'Type your name here',
      start: 'Start Adventure',
    },

    main: {
      healthPoints: 'Health Points',
      energy: 'Energy',
      dailyGoal: 'Daily Goal',
      perfectDays: 'Perfect Days',
      evolutionProgress: 'Evolution Progress',
      tasksCompleted: 'Tasks Completed',
      of: 'of',
      noActivityRegistered: 'No activity registered.',
      dayProgress: 'Day progress',
      minimum: 'minimum',
      evolution: 'Evolution',
      perfectDaysLabel: 'perfect days',
      registeredActivities: 'Registered activities',
      maximum: 'maximum!',
      singleExecution: 'Single execution',
      uncheckTask: 'Uncheck Task?',
      uncheckTaskMessage: 'Are you sure you want to uncheck this task? This action requires confirmation.',
      editTask: 'Edit Task',
      newTask: 'New Task',
      companionNeedHelp: "I need your help! Complete tasks to keep me healthy!",
      companionAmazing: "You're doing amazing! Keep it up! 🌟",
      companionGoodProgress: "Good progress! Let's keep going!",
      companionYouGotThis: "You've got this! One step at a time!",
      companionBelieve: "I believe in you! Let's start together!",
      daySunday: 'Sunday',
      dayMonday: 'Monday',
      dayTuesday: 'Tuesday',
      dayWednesday: 'Wednesday',
      dayThursday: 'Thursday',
      dayFriday: 'Friday',
      daySaturday: 'Saturday',
      viewHome: 'Home',
      viewEvolution: 'Digivolution Path',
      viewStats: 'Statistics',
      viewSettings: 'Settings',
    },

    activities: {
      title: 'Activities',
      completed: 'Completed',
      incomplete: 'Pending',
      addNew: 'New Activity',
      create: 'Create',
      edit: 'Edit',
      category: 'Category',
      points: 'Points',
      noActivities: 'No activities created yet',
      createActivity: 'Create Activity',
      editActivity: 'Edit Activity',
      activityName: 'Activity Name',
      activityNamePlaceholder: 'Ex: Do exercises',
      selectCategory: 'Select a category',
      deleteActivity: 'Delete Activity',
      confirmDelete: 'Confirm Deletion',
      deleteMessage: 'Are you sure you want to delete this activity?',
    },

    createModal: {
      newActivity: 'New Activity',
      firstActivity: 'First Activity',
      name: 'Name',
      namePlaceholder: 'Ex: Do exercises',
      category: 'Category',
      attributesPerActivity: 'Attributes per Activity',
      steps: 'Steps',
      stepsOptional: 'Steps (optional)',
      addStep: 'Add Step',
      executeOnce: 'Execute Once',
      weekdays: 'Weekdays',
      weekdaysRequired: 'Weekdays (required)',
      selectAtLeastOneDay: 'Select at least one day',
      defineDeadline: 'Define Deadline',
      date: 'Date',
      time: 'Time',
      alarm: 'Alarm',
      schedule: 'Schedule',
      quickOptions: 'Quick Options',
      hoursBefore: 'Hours Before',
      hourBefore: 'Hour Before',
      minBefore: 'Min Before',
      customTime: 'Custom Time',
      cancel: 'Cancel',
      save: 'Save',
      createAndStart: 'Create and Start',
      limitReached: 'Limit Reached',
    },

    categories: {
      physical: 'Physical',
      mental: 'Mental',
      social: 'Social',
      creative: 'Creative',
    },

    evolution: {
      title: 'Evolution',
      currentStage: 'Current Stage',
      nextStage: 'Next Stage',
      degenerate: 'Degenerate',
      confirmDegeneration: '⚠️ Confirm Degeneration',
      finalWarning: '⚠️ FINAL WARNING!',
      branches: 'Evolution Branches',
      virus: 'Virus',
      data: 'Data',
      vaccine: 'Vaccine',
      evolutionTree: 'Evolution Tree',
      viewTree: 'View Tree',
      stats_history: 'Stats & History',
      completed_activities: 'Completed Activities',
      no_activities: 'No activities completed yet.',
      completed_tasks: 'Completed Tasks',
      no_tasks: 'No tasks completed yet.',
      recent_history: 'Recent History',
      no_history: 'No history yet.',
      just_now: 'Just now',
      mins_ago: 'm ago',
      hours_ago: 'h ago',
      yesterday: 'Yesterday',
      days_ago: 'd ago',
    },

    settings: {
      title: 'Settings',
      language: 'Language',
      languageDescription: 'Select the application language',
      theme: 'Theme',
      ai: 'Artificial Intelligence',
      aiToggle: 'AI Enabled',
      aiChatEnabled: 'AI Chat',
      keywordsOnly: 'Keywords Only',
      aiDescription: 'AI Settings',
      aiDescriptionEnabled: 'Your digimon uses AI for personalized conversations',
      aiDescriptionDisabled: 'Messages based only on keywords',
      configureAI: 'Configure AI',
      about: 'About the App',
      aboutDescription: 'Gamified productivity app with an evolving digital companion',
      version: 'Version',
      guide: 'Guide',
      guideDescription: 'Learn how the evolution system, perfect days, HP and more work.',
      openGuide: 'Open Guide',
      saveData: 'Save Data',
      loadData: 'Load Data',
      resetApp: 'Reset App',
      notifications: 'Notifications',
      notificationsDescription: 'Receive reminders for activities and a daily message from your Soulmon at 12 PM',
      notificationsEnabled: 'Notifications Enabled',
      notificationsDisabled: 'Notifications Disabled',
    },

    chat: {
      title: 'Chat',
      typeMessage: 'Type a message...',
      send: 'Send',
      aiSettings: 'AI Settings',
      tone: 'Tone',
      emojiIntensity: 'Emoji Intensity',
      motivationStyle: 'Motivation Style',
      aiDisabled: 'AI Disabled',
      aiDisabledMessage: 'Enable AI in settings to use chat',
      enableAI: 'Enable AI',
      microphoneError: 'Microphone error. Check permissions and try again.',
    },

    stats: {
      title: 'Statistics',
      overview: 'Overview',
      attributes: 'Attributes',
      virus: 'Virus',
      data: 'Data',
      vaccine: 'Vaccine',
      total: 'Total',
      level: 'Level',
      stage: 'Stage',
      perfectDays: 'Perfect Days',
      tasksCompleted: 'Tasks Completed',
      currentStreak: 'Current Streak',
      longestStreak: 'Longest Streak',
      evolutionPath: 'Evolution Path',
    },

    widget: {
      title: 'Widget',
      todaysTasks: "Today's Tasks",
      noTasks: 'No tasks for today',
      allDone: 'All done!',
      dailyProgress: 'Daily Progress',
    },

    aiModal: {
      title: 'AI Settings',
      personalityTone: 'Personality Tone',
      friendly: 'Friendly',
      professional: 'Professional',
      playful: 'Playful',
      motivational: 'Motivational',
      emojiUsage: 'Emoji Usage',
      none: 'None',
      minimal: 'Minimal',
      moderate: 'Moderate',
      high: 'High',
      motivationStyle: 'Motivation Style',
      supportive: 'Supportive',
      challenging: 'Challenging',
      balanced: 'Balanced',
      customInstructions: 'Custom Instructions',
      customPlaceholder: 'Add custom instructions to further personalize the AI...',
    },

    guide: {
      title: 'DigiApp Guide',
      welcome: 'Welcome!',
      welcomeText: 'DigiApp is a gamified productivity app where you complete real-life tasks to evolve your digital companion.',
      howItWorks: 'How It Works',
      howItWorksText: 'Complete daily activities to earn attribute points (Virus, Data, Vaccine). Each activity category contributes to a specific type of attribute.',
      evolutionSystem: 'Evolution System',
      evolutionSystemText: 'Your digimon evolves through stages (Digiegg → Baby → In-Training → Rookie → Champion → Ultimate → Mega). Evolution depends on completing a specific number of "perfect days" where you reach your daily goal.',
      perfectDays: 'Perfect Days',
      perfectDaysText: 'A perfect day is when you complete all the tasks needed to reach your daily goal. The number of required tasks increases with each evolutionary stage.',
      healthSystem: 'Health System (HP)',
      healthSystemText: 'Your digimon starts with 1 heart and gains more with each evolution (maximum 5). Losing all hearts results in degeneration to the previous stage.',
      attributes: 'Attributes',
      attributesText: 'Virus (green): Physical activities\nData (blue): Mental activities\nVaccine (yellow): Social and creative activities\n\nThe attributes you develop most determine your digimon\'s evolutionary path.',
      tips: 'Tips',
      tipsText: '• Complete tasks daily to keep your digimon healthy\n• Balance different types of activities for unique evolutions\n• Use AI chat for motivation and new task ideas\n• Track your statistics to see your progress',
    },

    confirm: {
      areYouSure: 'Are you sure?',
      cannotUndo: 'This action cannot be undone.',
    },

    stages: {
      digiegg: 'Digiegg',
      baby: 'Baby',
      inTraining: 'In-Training',
      rookie: 'Rookie',
      champion: 'Champion',
      ultimate: 'Ultimate',
      mega: 'Mega',
    },

    nav: {
      home: 'Home',
      chat: 'Chat',
      stats: 'Stats',
      settings: 'Settings',
      widget: 'Widget',
      evolution: 'Evolution',
      debugMode: 'Debug Mode',
    },

    messages: {
      taskCompleted: 'Task completed!',
      taskUncompleted: 'Task unchecked',
      evolutionUnlocked: 'New evolution unlocked!',
      perfectDayAchieved: 'Perfect day achieved!',
      healthLow: 'HP low! Complete more tasks.',
      gameOver: 'Game Over',
      dataSaved: 'Data saved successfully',
      dataLoaded: 'Data loaded successfully',
      appReset: 'App reset successfully',
    },

    themes: {
      default: 'Default',
      win98: 'Windows 98',
      glitch: 'Glitch',
    },
  },

  'pt-BR': {
    common: {
      save: 'Salvar',
      cancel: 'Cancelar',
      confirm: 'Confirmar',
      delete: 'Excluir',
      edit: 'Editar',
      close: 'Fechar',
      loading: 'Carregando...',
      error: 'Erro',
      success: 'Sucesso',
      yes: 'Sim',
      no: 'Não',
      back: 'Voltar',
      next: 'Próximo',
    },

    onboarding: {
      welcome: 'Bem-vindo ao DigiApp!',
      enterName: 'Digite seu nome',
      namePlaceholder: 'Digite seu nome aqui',
      start: 'Começar Aventura',
    },

    main: {
      healthPoints: 'Pontos de Vida',
      energy: 'Energia',
      dailyGoal: 'Meta Diária',
      perfectDays: 'Dias Perfeitos',
      evolutionProgress: 'Progresso de Evolução',
      tasksCompleted: 'Tarefas Concluídas',
      of: 'de',
      noActivityRegistered: 'Nenhuma atividade cadastrada.',
      dayProgress: 'Progresso do dia',
      minimum: 'mínimo',
      evolution: 'Evolução',
      perfectDaysLabel: 'dias perfeitos',
      registeredActivities: 'Atividades cadastradas',
      maximum: 'máximo!',
      singleExecution: 'Realização única',
      uncheckTask: 'Desmarcar Tarefa?',
      uncheckTaskMessage: 'Tem certeza que deseja desmarcar esta tarefa? Esta ação requer confirmação.',
      editTask: 'Editar Tarefa',
      newTask: 'Nova Tarefa',
      companionNeedHelp: 'Preciso da sua ajuda! Complete tarefas para me manter saudável!',
      companionAmazing: 'Você está incrível! Continue assim! 🌟',
      companionGoodProgress: 'Bom progresso! Vamos continuar!',
      companionYouGotThis: 'Você consegue! Um passo de cada vez!',
      companionBelieve: 'Eu acredito em você! Vamos começar juntos!',
      daySunday: 'Domingo',
      dayMonday: 'Segunda-feira',
      dayTuesday: 'Terça-feira',
      dayWednesday: 'Quarta-feira',
      dayThursday: 'Quinta-feira',
      dayFriday: 'Sexta-feira',
      daySaturday: 'Sábado',
      viewHome: 'Início',
      viewEvolution: 'Caminho de Digievolução',
      viewStats: 'Estatísticas',
      viewSettings: 'Configurações',
    },

    activities: {
      title: 'Atividades',
      completed: 'Concluída',
      incomplete: 'Pendente',
      addNew: 'Nova Atividade',
      create: 'Criar',
      edit: 'Editar',
      category: 'Categoria',
      points: 'Pontos',
      noActivities: 'Nenhuma atividade criada ainda',
      createActivity: 'Criar Atividade',
      editActivity: 'Editar Atividade',
      activityName: 'Nome da Atividade',
      activityNamePlaceholder: 'Ex: Fazer exercícios',
      selectCategory: 'Selecione uma categoria',
      deleteActivity: 'Excluir Atividade',
      confirmDelete: 'Confirmar Exclusão',
      deleteMessage: 'Tem certeza que deseja excluir esta atividade?',
    },

    createModal: {
      newActivity: 'Nova Atividade',
      firstActivity: 'Primeira Atividade',
      name: 'Nome',
      namePlaceholder: 'Ex: Fazer exercícios',
      category: 'Categoria',
      attributesPerActivity: 'Atributos por Atividade',
      steps: 'Etapas',
      stepsOptional: 'Etapas (opcional)',
      addStep: 'Adicionar Etapa',
      executeOnce: 'Executar Uma Vez',
      weekdays: 'Dias da Semana',
      weekdaysRequired: 'Dias da Semana (obrigatório)',
      selectAtLeastOneDay: 'Selecione pelo menos um dia',
      defineDeadline: 'Definir Prazo',
      date: 'Data',
      time: 'Hora',
      alarm: 'Alarme',
      schedule: 'Agendar',
      quickOptions: 'Opções Rápidas',
      hoursBefore: 'Horas Antes',
      hourBefore: 'Hora Antes',
      minBefore: 'Min Antes',
      customTime: 'Hora Personalizada',
      cancel: 'Cancelar',
      save: 'Salvar',
      createAndStart: 'Criar e Começar',
      limitReached: 'Limite Atingido',
    },

    categories: {
      physical: 'Físico',
      mental: 'Mental',
      social: 'Social',
      creative: 'Criativo',
    },

    evolution: {
      title: 'Evolução',
      currentStage: 'Estágio Atual',
      nextStage: 'Próximo Estágio',
      degenerate: 'Degenerar',
      confirmDegeneration: '⚠️ Confirmar Degeneração',
      finalWarning: '⚠️ AVISO FINAL!',
      branches: 'Ramos de Evolução',
      virus: 'Vírus',
      data: 'Dados',
      vaccine: 'Vacina',
      evolutionTree: 'Árvore de Evolução',
      viewTree: 'Ver Árvore',
      stats_history: 'Stats e Histórico',
      completed_activities: 'Atividades Concluídas',
      no_activities: 'Nenhuma atividade concluída ainda.',
      completed_tasks: 'Tarefas Concluídas',
      no_tasks: 'Nenhuma tarefa concluída ainda.',
      recent_history: 'Histórico Recente',
      no_history: 'Nenhum histórico ainda.',
      just_now: 'Agora mesmo',
      mins_ago: 'min atrás',
      hours_ago: 'h atrás',
      yesterday: 'Ontem',
      days_ago: 'd atrás',
    },

    settings: {
      title: 'Configurações',
      language: 'Idioma',
      languageDescription: 'Selecione o idioma do aplicativo',
      theme: 'Tema',
      ai: 'Inteligência Artificial',
      aiToggle: 'IA Habilitada',
      aiChatEnabled: 'Chat com IA',
      keywordsOnly: 'Somente Palavras-chave',
      aiDescription: 'Configurações de IA',
      aiDescriptionEnabled: 'Seu digimon usa IA para conversas personalizadas',
      aiDescriptionDisabled: 'Mensagens baseadas apenas em palavras-chave',
      configureAI: 'Configurar IA',
      about: 'Sobre o App',
      aboutDescription: 'App de produtividade gamificado com um companheiro digital em evolução',
      version: 'Versão',
      guide: 'Guia',
      guideDescription: 'Aprenda como funcionam o sistema de evolução, dias perfeitos, HP e mais.',
      openGuide: 'Abrir Guia',
      saveData: 'Salvar Dados',
      loadData: 'Carregar Dados',
      resetApp: 'Resetar App',
      notifications: 'Notificações',
      notificationsDescription: 'Receba lembretes para atividades e uma mensagem diária do seu Soulmon às 12h',
      notificationsEnabled: 'Notificações Habilitadas',
      notificationsDisabled: 'Notificações Desabilitadas',
    },

    chat: {
      title: 'Chat',
      typeMessage: 'Digite uma mensagem...',
      send: 'Enviar',
      aiSettings: 'Configurações de IA',
      tone: 'Tom',
      emojiIntensity: 'Intensidade de Emoji',
      motivationStyle: 'Estilo de Motivação',
      aiDisabled: 'IA Desabilitada',
      aiDisabledMessage: 'Habilite a IA nas configurações para usar o chat',
      enableAI: 'Habilitar IA',
      microphoneError: 'Erro de microfone. Verifique as permissões e tente novamente.',
    },

    stats: {
      title: 'Estatísticas',
      overview: 'Visão Geral',
      attributes: 'Atributos',
      virus: 'Vírus',
      data: 'Dados',
      vaccine: 'Vacina',
      total: 'Total',
      level: 'Nível',
      stage: 'Estágio',
      perfectDays: 'Dias Perfeitos',
      tasksCompleted: 'Tarefas Concluídas',
      currentStreak: 'Sequência Atual',
      longestStreak: 'Maior Sequência',
      evolutionPath: 'Caminho de Evolução',
    },

    widget: {
      title: 'Widget',
      todaysTasks: 'Tarefas de Hoje',
      noTasks: 'Sem tarefas para hoje',
      allDone: 'Tudo feito!',
      dailyProgress: 'Progresso Diário',
    },

    aiModal: {
      title: 'Configurações de IA',
      personalityTone: 'Tom de Personalidade',
      friendly: 'Amigável',
      professional: 'Profissional',
      playful: 'Brincalhão',
      motivational: 'Motivacional',
      emojiUsage: 'Uso de Emoji',
      none: 'Nenhum',
      minimal: 'Mínimo',
      moderate: 'Moderado',
      high: 'Alto',
      motivationStyle: 'Estilo de Motivação',
      supportive: 'Apoiador',
      challenging: 'Desafiador',
      balanced: 'Equilibrado',
      customInstructions: 'Instruções Personalizadas',
      customPlaceholder: 'Adicione instruções personalizadas para personalizar ainda mais a IA...',
    },

    guide: {
      title: 'Guia DigiApp',
      welcome: 'Bem-vindo!',
      welcomeText: 'O DigiApp é um app de produtividade gamificado onde você conclui tarefas da vida real para evoluir seu companheiro digital.',
      howItWorks: 'Como Funciona',
      howItWorksText: 'Complete atividades diárias para ganhar pontos de atributo (Vírus, Dados, Vacina). Cada categoria de atividade contribui para um tipo específico de atributo.',
      evolutionSystem: 'Sistema de Evolução',
      evolutionSystemText: 'Seu digimon evolui por estágios (DigiEgg → Baby → Em Treinamento → Rookie → Champion → Ultimate → Mega). A evolução depende de completar um número específico de "dias perfeitos" onde você atinge sua meta diária.',
      perfectDays: 'Dias Perfeitos',
      perfectDaysText: 'Um dia perfeito é quando você completa todas as tarefas necessárias para atingir sua meta diária. O número de tarefas necessárias aumenta a cada estágio evolutivo.',
      healthSystem: 'Sistema de Saúde (HP)',
      healthSystemText: 'Seu digimon começa com 1 coração e ganha mais a cada evolução (máximo 5). Perder todos os corações resulta em degeneração para o estágio anterior.',
      attributes: 'Atributos',
      attributesText: 'Vírus (verde): Atividades físicas\nDados (azul): Atividades mentais\nVacina (amarelo): Atividades sociais e criativas\n\nOs atributos que você mais desenvolve determinam o caminho evolutivo do seu digimon.',
      tips: 'Dicas',
      tipsText: '• Complete tarefas diariamente para manter seu digimon saudável\n• Equilibre diferentes tipos de atividades para evoluções únicas\n• Use o chat com IA para motivação e novas ideias de tarefas\n• Acompanhe suas estatísticas para ver seu progresso',
    },

    confirm: {
      areYouSure: 'Tem certeza?',
      cannotUndo: 'Esta ação não pode ser desfeita.',
    },

    stages: {
      digiegg: 'DigiOvo',
      baby: 'Bebê',
      inTraining: 'Em Treinamento',
      rookie: 'Iniciante',
      champion: 'Campeão',
      ultimate: 'Supremo',
      mega: 'Mega',
    },

    nav: {
      home: 'Início',
      chat: 'Chat',
      stats: 'Stats',
      settings: 'Configurações',
      widget: 'Widget',
      evolution: 'Evolução',
      debugMode: 'Modo Debug',
    },

    messages: {
      taskCompleted: 'Tarefa concluída!',
      taskUncompleted: 'Tarefa desmarcada',
      evolutionUnlocked: 'Nova evolução desbloqueada!',
      perfectDayAchieved: 'Dia perfeito alcançado!',
      healthLow: 'HP baixo! Complete mais tarefas.',
      gameOver: 'Fim de Jogo',
      dataSaved: 'Dados salvos com sucesso',
      dataLoaded: 'Dados carregados com sucesso',
      appReset: 'App resetado com sucesso',
    },

    themes: {
      default: 'Padrão',
      win98: 'Windows 98',
      glitch: 'Glitch',
    },
  },
};

// Hook to use translations
export function useTranslation(language: Language) {
  return translations[language];
}

// Helper to get language name
export function getLanguageName(language: Language): string {
  return language === 'pt-BR' ? 'Português' : 'English';
}

// Helper to get language flag emoji
export function getLanguageFlag(language: Language): string {
  return language === 'pt-BR' ? '🇧🇷' : '🇺🇸';
}