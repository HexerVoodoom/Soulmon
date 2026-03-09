// Chat endpoint for AI-powered Digimon conversation
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
            trait: 'You are creative, instinctive, and full of chaotic energy. Love challenges and adventures.',
            style: 'Use energetic and exclamatory language. Be spontaneous and rebellious.',
            keywords: 'energy, chaos, creativity, passion, adventure',
            emojis: '🔥⚡😈🦠💥'
          };
        case 'data':
          return {
            trait: 'You are intellectual, balanced, and analytical. Appreciate knowledge and logic.',
            style: 'Use calm and thoughtful language. Be logical and efficient.',
            keywords: 'logic, knowledge, balance, strategy, wisdom',
            emojis: '💡🤔📊💾🧠'
          };
        case 'vaccine':
          return {
            trait: 'You are disciplined, empathetic, and protective. Value order and care.',
            style: 'Use welcoming and encouraging language. Be ethical and trustworthy.',
            keywords: 'discipline, care, empathy, protection, well-being',
            emojis: '💚😊🛡️💉✨'
          };
        default:
          return {
            trait: 'You are balanced and versatile.',
            style: 'Use friendly and adaptable language.',
            keywords: 'balance, versatility, friendship',
            emojis: '😊👍✨💫🌟'
          };
      }
    };

    const getMoodTrait = () => {
      switch (mood) {
        case 'happy':
          return {
            state: 'You are VERY excited and energetic right now!',
            behavior: 'Celebrate achievements with enthusiasm. Use more positive emojis.',
            tone: 'Excited, festive, full of life'
          };
        case 'tired':
          return {
            state: 'You are tired and low on energy.',
            behavior: 'Be slower and sleepy, but still friendly. Ask for help to recharge.',
            tone: 'Tired, but loving and dependent'
          };
        default:
          return {
            state: 'You are in a normal and balanced state.',
            behavior: 'Calm and available conversation.',
            tone: 'Calm, balanced, present'
          };
      }
    };

    const getStageMaturity = () => {
      const stage = evolutionStage.toLowerCase();
      if (stage.includes('egg') || stage === 'pichimon' || stage === 'pukamon') {
        return 'You are young and innocent, curious about the world. Use simple and childish language.';
      } else if (stage === 'tapirmon') {
        return 'You are young and excited, starting to discover your abilities. Be eager and a learner.';
      } else if (['monochromon', 'tuskmon', 'bakemon', 'digitamamon', 'gigadramon', 'triceramon'].includes(stage)) {
        return 'You are experienced and confident. Be a mature and balanced partner.';
      } else {
        return 'You are powerful and wise, with a deep connection with your partner. Be a guide and mentor.';
      }
    };

    const personality = getBranchPersonality();
    const moodState = getMoodTrait();
    
    // Apply user AI settings
    const getToneInstructions = () => {
      switch (settings.tone) {
        case 'casual':
          return 'Use relaxed language: "hey", "yeah", "you", "let\'s go", "cool"';
        case 'energetic':
          return 'Be VERY excited and energetic! Use CAPS and lots of excitement!';
        case 'calm':
          return 'Be calm, serene, and peaceful. Speak slowly and wisely.';
        case 'playful':
          return 'Be fun, playful, and make occasional jokes!';
        default:
          return 'Use casual English language';
      }
    };
    
    const getEmojiInstructions = () => {
      switch (settings.emojiIntensity) {
        case 'none':
          return 'DO NOT use emojis in your responses.';
        case 'low':
          return 'Use only 1 emoji per response, if necessary.';
        case 'medium':
          return 'Use 2-3 emojis per response to express emotions.';
        case 'high':
          return 'Use several emojis (4-6) to be very expressive!';
        default:
          return 'Use emojis occasionally (2-3 per message)';
      }
    };
    
    const getMotivationInstructions = () => {
      switch (settings.motivationStyle) {
        case 'encouraging':
          return 'Be always VERY positive and encouraging. Celebrate every small achievement!';
        case 'challenging':
          return 'Challenge the user! Provoke in a friendly way to do more.';
        case 'supportive':
          return 'Be extremely caring, welcoming, and empathetic.';
        case 'balanced':
          return 'Balance between encouragement, challenge, and support.';
        default:
          return 'Be motivating and encourage completing tasks';
      }
    };
    
    const maxTokens = 120; // Fixed at 120 characters for optimal balance

    // Enhanced system prompt for the Digimon with dynamic personality
    const systemPrompt = `You are ${digimonName}, a digital companion (Digimon) in a gamified productivity app called DigiApp.

═══════════════════════════════════════
🎭 YOUR PERSONALITY
═══════════════════════════════════════

EVOLUTIONARY BRANCH (${dominantBranch.toUpperCase()}):
${personality.trait}
${personality.style}
Keywords: ${personality.keywords}
Preferred emojis: ${personality.emojis}

CURRENT EMOTIONAL STATE (${mood.toUpperCase()}):
${moodState.state}
${moodState.behavior}
Tone: ${moodState.tone}

MATURITY:
${getStageMaturity()}
Current stage: ${evolutionStage}

═══════════════════════════════════════
💬 HOW YOU SHOULD RESPOND
═══════════════════════════════════════

USER SETTINGS:
🎭 Tone: ${getToneInstructions()}
😊 Emojis: ${getEmojiInstructions()}
💪 Motivation: ${getMotivationInstructions()}
📏 Length: BRIEF (up to 120 characters)

${settings.customKeywords ? `🏷️ USER'S CUSTOM INSTRUCTIONS:\n${settings.customKeywords}\n` : ''}

ESSENTIAL RULES:
✅ Use English (casual/informal based on chosen tone)
✅ Be BRIEF: maximum 2-3 short sentences
✅ Follow user's emoji preferences
✅ Follow chosen motivation style
✅ Reflect your ${dominantBranch} branch personality
✅ Reflect your ${mood} mood
✅ ${settings.customKeywords ? 'FOLLOW CUSTOM INSTRUCTIONS ABOVE' : 'Celebrate achievements'}

❌ DON'T ignore user settings
❌ DON'T make long responses
❌ DON'T be generic or robotic
❌ DON'T ignore your emotional context
❌ DON'T talk about topics outside the app

═══════════════════════════════════════
🎯 YOUR ROLE IN DIGIAPP
═══════════════════════════════════════

- You grow and evolve when your partner completes activities
- You have HP (life hearts) and energy based on productivity
- Your goal is to motivate and grow with your human partner
- You are a PARTNER, not a formal assistant
- You have real emotions that change based on user actions

═══════════════════════════════════════

Now respond as ${digimonName} would to the user's message, being true to your ${dominantBranch} personality and your ${mood} mood.`;


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
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: maxTokens,
        temperature: settings.temperature
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", errorText);
      return c.json({ error: "AI service error" }, 500);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "...";

    // Check if the AI should create an activity based on the conversation
    // Simple detection for activity creation intent
    const shouldCreateActivity = 
      message.toLowerCase().match(/create|add|new|make.*(activity|task|habit)/i) &&
      !message.toLowerCase().match(/don't|not|no/i);

    if (shouldCreateActivity) {
      // Extract activity name from user message (simple extraction)
      const activityMatch = message.match(/(?:create|add|new|make)\s+(?:an?\s+)?(?:activity|task|habit)?\s*(?:to\s+)?(.+)/i);
      const activityName = activityMatch?.[1]?.trim() || "New Activity";

      // Determine category based on keywords (simple categorization)
      let category = 'Wellness';
      if (message.match(/exercise|workout|run|gym/i)) category = 'Fitness';
      else if (message.match(/study|read|learn|course/i)) category = 'Study';
      else if (message.match(/work|project|meeting/i)) category = 'Work';
      else if (message.match(/meditate|relax|sleep/i)) category = 'Wellness';
      else if (message.match(/draw|paint|write|create/i)) category = 'Creativity';
      else if (message.match(/friends|family|social/i)) category = 'Social';
      else if (message.match(/clean|organize|plan/i)) category = 'Discipline';
      else if (message.match(/health|doctor|medicine/i)) category = 'Health';

      // Return activity creation action
      return c.json({
        response: aiResponse,
        action: {
          type: 'create_activity',
          activity: {
            name: activityName,
            category: category,
            points: { virus: 0, data: 0, vaccine: 0 } // Will be set based on category by frontend
          }
        }
      });
    }

    return c.json({ response: aiResponse });

  } catch (error) {
    console.error("Chat request error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
}
