// Internationalization (i18n) structure for DigiApp
// English only

export type Language = 'en-US';

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
      notificationsDescription: 'Receive reminders for activities and a daily message from your Digimon at 12 PM',
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
};

// Hook to use translations
export function useTranslation(language: Language) {
  return translations[language];
}

// Helper to get language name
export function getLanguageName(language: Language): string {
  return 'English';
}

// Helper to get language flag emoji
export function getLanguageFlag(language: Language): string {
  return '🇺🇸';
}