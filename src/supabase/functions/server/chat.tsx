// Chat endpoint using Groq API (free LLM service)
import { Context } from "npm:hono";

export async function handleChatRequest(c: Context) {
  try {
    const body = await c.req.json();
    const { 
      message, 
      digimonName, 
      mood, 
      evolutionStage, 
      dominantBranch,
      aiSettings 
    } = body;
    
    // Default AI settings if not provided
    const settings = aiSettings || {
      tone: 'casual',
      emojiIntensity: 'medium',
      motivationStyle: 'balanced',
      customKeywords: '',
      temperature: 0.85
    };

    if (!message) {
      return c.json({ error: "Message is required" }, 400);
    }

    // Get Groq API key from environment
    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    if (!groqApiKey) {
      console.error("GROQ_API_KEY not found in environment");
      return c.json({ error: "API key not configured" }, 500);
    }

    // Build Digimon personality context based on branch, mood, and stage
    const getBranchPersonality = () => {
      switch (dominantBranch) {
        case 'virus':
          return {
            trait: 'Você é criativo, instintivo e cheio de energia caótica. Adora desafios e aventuras.',
            style: 'Use linguagem energética e exclamativa. Seja espontâneo e rebelde.',
            keywords: 'energia, caos, criatividade, paixão, aventura',
            emojis: '🔥⚡😈🦠💥'
          };
        case 'data':
          return {
            trait: 'Você é intelectual, equilibrado e analítico. Aprecia conhecimento e lógica.',
            style: 'Use linguagem calma e ponderada. Seja lógico e eficiente.',
            keywords: 'lógica, conhecimento, equilíbrio, estratégia, sabedoria',
            emojis: '💡🤔📊💾🧠'
          };
        case 'vaccine':
          return {
            trait: 'Você é disciplinado, empático e protetor. Valoriza ordem e cuidado.',
            style: 'Use linguagem acolhedora e encorajadora. Seja ético e confiável.',
            keywords: 'disciplina, cuidado, empatia, proteção, bem-estar',
            emojis: '💚😊🛡️💉✨'
          };
        default:
          return {
            trait: 'Você é equilibrado e versátil.',
            style: 'Use linguagem amigável e adaptável.',
            keywords: 'equilíbrio, versatilidade, amizade',
            emojis: '😊👍✨💫🌟'
          };
      }
    };

    const getMoodTrait = () => {
      switch (mood) {
        case 'happy':
          return {
            state: 'Você está MUITO animado e energético agora!',
            behavior: 'Celebre conquistas com entusiasmo. Use mais emojis positivos.',
            tone: 'Empolgado, festivo, cheio de vida'
          };
        case 'tired':
          return {
            state: 'Você está cansado e com pouca energia.',
            behavior: 'Seja mais lento e sonolento, mas ainda amigável. Peça ajuda para recarregar.',
            tone: 'Cansado, mas carinhoso e dependente'
          };
        default:
          return {
            state: 'Você está em um estado normal e equilibrado.',
            behavior: 'Conversação calma e disponível.',
            tone: 'Calmo, equilibrado, presente'
          };
      }
    };

    const getStageMaturity = () => {
      const stage = evolutionStage.toLowerCase();
      if (stage.includes('egg') || stage === 'pichimon' || stage === 'pukamon') {
        return 'Você é jovem e inocente, curioso sobre o mundo. Use linguagem simples e infantil.';
      } else if (stage === 'tapirmon') {
        return 'Você é jovem e empolgado, começando a descobrir suas habilidades. Seja ansioso e aprendiz.';
      } else if (['monochromon', 'tuskmon', 'bakemon', 'digitamamon', 'gigadramon', 'triceramon'].includes(stage)) {
        return 'Você é experiente e confiante. Seja um parceiro maduro e equilibrado.';
      } else {
        return 'Você é poderoso e sábio, com conexão profunda com seu parceiro. Seja um guia e mentor.';
      }
    };

    const personality = getBranchPersonality();
    const moodState = getMoodTrait();
    
    // Apply user AI settings
    const getToneInstructions = () => {
      switch (settings.tone) {
        case 'casual':
          return 'Use linguagem descontraída: "oi", "tá", "vc", "bora", "massa"';
        case 'energetic':
          return 'Seja MUITO animado e energético! Use CAPS e muita empolgação!';
        case 'calm':
          return 'Seja calmo, sereno e tranquilo. Fale devagar e com sabedoria.';
        case 'playful':
          return 'Seja divertido, brincalhão e faça piadas ocasionais!';
        default:
          return 'Use linguagem casual brasileira';
      }
    };
    
    const getEmojiInstructions = () => {
      switch (settings.emojiIntensity) {
        case 'none':
          return 'NÃO use emojis em suas respostas.';
        case 'low':
          return 'Use apenas 1 emoji por resposta, se necessário.';
        case 'medium':
          return 'Use 2-3 emojis por resposta para expressar emoções.';
        case 'high':
          return 'Use vários emojis (4-6) para ser bem expressivo!';
        default:
          return 'Use emojis ocasionalmente (2-3 por mensagem)';
      }
    };
    
    const getMotivationInstructions = () => {
      switch (settings.motivationStyle) {
        case 'encouraging':
          return 'Seja sempre MUITO positivo e encorajador. Celebre cada pequena conquista!';
        case 'challenging':
          return 'Desafie o usuário! Provoque de forma amigável para fazer mais.';
        case 'supportive':
          return 'Seja extremamente carinhoso, acolhedor e empático.';
        case 'balanced':
          return 'Balance entre encorajamento, desafio e apoio.';
        default:
          return 'Seja motivador e incentive completar tarefas';
      }
    };
    
    const maxTokens = 120; // Fixed at 120 characters for optimal balance

    // Enhanced system prompt for the Digimon with dynamic personality
    const systemPrompt = `Você é ${digimonName}, um companheiro digital (Digimon) em um aplicativo gamificado de produtividade chamado DigiApp.

═══════════════════════════════════════
🎭 SUA PERSONALIDADE
═══════════════════════════════════════

RAMO EVOLUTIVO (${dominantBranch.toUpperCase()}):
${personality.trait}
${personality.style}
Palavras-chave: ${personality.keywords}
Emojis preferidos: ${personality.emojis}

ESTADO EMOCIONAL ATUAL (${mood.toUpperCase()}):
${moodState.state}
${moodState.behavior}
Tom: ${moodState.tone}

MATURIDADE:
${getStageMaturity()}
Estágio atual: ${evolutionStage}

═══════════════════════════════════════
💬 COMO VOCÊ DEVE RESPONDER
═══════════════════════════════════════

CONFIGURAÇÕES DO USUÁRIO:
🎭 Tom: ${getToneInstructions()}
😊 Emojis: ${getEmojiInstructions()}
💪 Motivação: ${getMotivationInstructions()}
📏 Tamanho: BREVE (até 120 caracteres)

${settings.customKeywords ? `🏷️ INSTRUÇÕES PERSONALIZADAS DO USUÁRIO:\n${settings.customKeywords}\n` : ''}

REGRAS ESSENCIAIS:
✅ Use português brasileiro (casual/informal baseado no tom escolhido)
✅ Seja BREVE: máximo 2-3 frases curtas
✅ Siga as preferências de emoji do usuário
✅ Siga o estilo de motivação escolhido
✅ Reflita sua personalidade do ramo ${dominantBranch}
✅ Reflita seu humor ${mood}
✅ ${settings.customKeywords ? 'SIGA AS INSTRUÇÕES PERSONALIZADAS ACIMA' : 'Celebre conquistas'}

❌ NÃO ignore as configurações do usuário
❌ NÃO faça respostas longas
❌ NÃO seja genérico ou robótico
❌ NÃO ignore seu contexto emocional
❌ NÃO fale sobre assuntos fora do app

═══════════════════════════════════════
🎯 SEU PAPEL NO DIGIAPP
═══════════════════════════════════════

- Você cresce e evolui quando seu parceiro completa atividades
- Você tem HP (corações de vida) e energia baseados em produtividade
- Seu objetivo é motivar e crescer junto com seu parceiro humano
- Você é um PARCEIRO, não um assistente formal
- Você tem emoções reais que mudam com base nas ações do usuário

═══════════════════════════════════════

Agora responda como ${digimonName} responderia à mensagem do usuário, sendo fiel à sua personalidade ${dominantBranch} e ao seu humor ${mood}.`;


    // Call Groq API
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // Fast and free model
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: settings.temperature, // User-configured creativity
        max_tokens: maxTokens, // User-configured response length
        top_p: 0.9, // Diversity in word choice
        frequency_penalty: 0.3, // Reduce repetition
        presence_penalty: 0.2 // Encourage topic diversity
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", errorText);
      return c.json({ error: "Failed to get AI response" }, 500);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || "Hmm... 🤔";

    // Check if user wants to create an activity
    const activityDetection = await detectActivityCreation(message, groqApiKey);
    
    if (activityDetection.shouldCreate) {
      return c.json({ 
        response: aiResponse,
        action: {
          type: 'create_activity',
          activity: activityDetection.activity
        }
      });
    }

    return c.json({ response: aiResponse });

  } catch (error) {
    console.error("Chat endpoint error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
}

// Detect if user wants to create an activity and extract details
async function detectActivityCreation(message: string, apiKey: string) {
  const lowerMessage = message.toLowerCase();
  
  // Quick regex check for common activity creation phrases
  const creationPatterns = [
    /\b(cria|criar|adiciona|adicionar|add|nova|novo|quero fazer|me ajuda.*adicionar|coloca)\b.*\b(atividade|tarefa|missão|objetivo|meta|task)/i,
    /\b(atividade|tarefa|missão|objetivo).*\b(de|para|sobre)\b/i,
    /\b(fazer|completar|realizar).*\b(hoje|amanhã|agora)\b/i
  ];
  
  const hasCreationIntent = creationPatterns.some(pattern => pattern.test(message));
  
  if (!hasCreationIntent) {
    return { shouldCreate: false };
  }

  // Use AI to extract activity details
  const extractionPrompt = `Analise esta mensagem e extraia os detalhes da atividade que o usuário quer criar.

Mensagem: "${message}"

Você deve responder APENAS com um JSON no seguinte formato (sem markdown, sem explicações):
{
  "shouldCreate": true ou false,
  "name": "nome da atividade",
  "category": "Physical" ou "Mental" ou "Social" ou "Creative",
  "virus": número de pontos (0-30),
  "data": número de pontos (0-30),
  "vaccine": número de pontos (0-30)
}

REGRAS PARA CATEGORIZAÇÃO:
- Physical: exercícios, esportes, caminhada, yoga, corrida (Virus dominante: 25-30, Data: 5-10, Vaccine: 10-15)
- Mental: estudar, ler, trabalho, meditação, aprender (Data dominante: 25-30, Virus: 5-10, Vaccine: 10-15)
- Social: conversar, sair, ligar para alguém, ajudar (Vaccine dominante: 25-30, Virus: 10-15, Data: 5-10)
- Creative: desenhar, escrever, música, arte, criar (Virus dominante: 25-30, Data: 15-20, Vaccine: 5-10)

EXEMPLOS:
"cria uma atividade de estudar matemática" → {"shouldCreate": true, "name": "Estudar Matemática", "category": "Mental", "virus": 5, "data": 30, "vaccine": 10}
"adiciona correr 30 minutos" → {"shouldCreate": true, "name": "Correr 30min", "category": "Physical", "virus": 30, "data": 5, "vaccine": 10}
"quero fazer uma tarefa de meditar" → {"shouldCreate": true, "name": "Meditar", "category": "Mental", "virus": 5, "data": 25, "vaccine": 15}
"coloca ligar para minha mãe" → {"shouldCreate": true, "name": "Ligar para Mãe", "category": "Social", "virus": 10, "data": 5, "vaccine": 30}

Se a mensagem NÃO for sobre criar uma atividade, retorne: {"shouldCreate": false}`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "user",
            content: extractionPrompt
          }
        ],
        temperature: 0.3, // Low temperature for more consistent JSON
        max_tokens: 200
      })
    });

    if (!response.ok) {
      console.error("Activity detection failed");
      return { shouldCreate: false };
    }

    const data = await response.json();
    const rawContent = data.choices[0]?.message?.content || "{}";
    
    // Clean up response - remove markdown code blocks if present
    const cleanContent = rawContent
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const parsed = JSON.parse(cleanContent);
    
    if (!parsed.shouldCreate) {
      return { shouldCreate: false };
    }

    return {
      shouldCreate: true,
      activity: {
        name: parsed.name,
        category: parsed.category,
        points: {
          virus: parsed.virus,
          data: parsed.data,
          vaccine: parsed.vaccine
        }
      }
    };

  } catch (error) {
    console.error("Activity detection error:", error);
    return { shouldCreate: false };
  }
}