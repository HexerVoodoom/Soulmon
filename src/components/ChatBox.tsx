import { useState } from 'react';
import { Send, Mic, Square } from 'lucide-react';

interface ChatBoxProps {
  digimonName: string;
  mood: 'idle' | 'happy' | 'tired';
  evolutionStage: string;
  dominantBranch?: string;
  useAI: boolean;
  onSendMessage: (response: string) => void;
  theme?: 'default' | 'win98' | 'glitch';
  aiSettings?: any;
  onOpenAISettings?: () => void;
  onCreateActivity?: (activity: {
    name: string;
    category: string;
    points: { virus: number; data: number; vaccine: number };
  }) => void;
}

export function ChatBox({ 
  digimonName, 
  mood, 
  evolutionStage, 
  dominantBranch, 
  useAI, 
  onSendMessage, 
  theme = 'default', 
  aiSettings, 
  onOpenAISettings, 
  onCreateActivity
}: ChatBoxProps) {
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  // Digimon responses based on keywords and mood
  const getDigimonResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for greetings
    if (lowerMessage.match(/\b(hi|hey|hello|hola|sup|yo|greetings)\b/)) {
      const greetings = [
        `Hello! 👋 How are you today?`,
        `Hey! Ready to complete tasks?`,
        `Hi! Good to see you! 😊`,
        `Hello, partner! Let's evolve together?`,
        `What's up! All good? ✨`,
        `Yo! What are we doing today?`,
        `Hey there! You showed up! 🎮`
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // Check for farewell
    if (lowerMessage.match(/\b(bye|goodbye|see you|later|cya)\b/)) {
      const farewells = [
        `See you later! Come back soon! 👋`,
        `Goodbye! I'll be waiting! 😊`,
        `See you, partner! ✨`,
        `Later! Don't disappear! 🎮`,
        `See you soon! 💚`,
        `Bye! Keep being amazing! ⭐`
      ];
      return farewells[Math.floor(Math.random() * farewells.length)];
    }

    // Check for questions about feelings
    if (lowerMessage.match(/\b(how|are|you|doing|feeling|feel)\b/)) {
      if (mood === 'happy') {
        const happyFeelings = [
          `Very happy! 😊`,
          `Amazing! 💪`,
          `Feeling great! ✨`,
          `So happy! 🌟`,
          `Radiant! ❤️`
        ];
        return happyFeelings[Math.floor(Math.random() * happyFeelings.length)];
      } else if (mood === 'tired') {
        const tiredFeelings = [
          `A bit tired... 😴`,
          `*yawn* 💤`,
          `Need energy! ⚡`,
          `Let's do something? 🥺`
        ];
        return tiredFeelings[Math.floor(Math.random() * tiredFeelings.length)];
      } else {
        const idleFeelings = [
          `I'm good! ✨`,
          `Normal! 🎯`,
          `Chill! 🤔`,
          `Ready! 😊`,
          `Always ready! 💚`
        ];
        return idleFeelings[Math.floor(Math.random() * idleFeelings.length)];
      }
    }

    // Check for encouragement
    if (lowerMessage.match(/\b(let's|go|come on|strength|can|will)\b/)) {
      const encouragement = [
        `Let's go! 💪`,
        `Come on! 🚀`,
        `Yes! ⚡`,
        `Sure! 🌟`,
        `That's it! ✨`,
        `You bet! 🤝`,
        `Let's! 💚`
      ];
      return encouragement[Math.floor(Math.random() * encouragement.length)];
    }

    // Check for compliments
    if (lowerMessage.match(/\b(cool|nice|awesome|great|amazing|wonderful|beautiful|cute)\b/)) {
      const compliments = [
        `Thank you! ❤️`,
        `How sweet! 😊`,
        `Aww! ✨`,
        `Thanks! 🌟`,
        `Hehe! 💚`,
        `Thank you so much! 🥰`,
        `Awesome! 💪`
      ];
      return compliments[Math.floor(Math.random() * compliments.length)];
    }

    // Check for love/affection
    if (lowerMessage.match(/\b(love|adore|like|dear|friend)\b/)) {
      const affection = [
        `Love you! ❤️`,
        `Me too! 💚`,
        `So much love! 🥰`,
        `I adore you! ✨`,
        `Aww! 💖`,
        `You're the best! 🌟`
      ];
      return affection[Math.floor(Math.random() * affection.length)];
    }

    // Check for food/energy
    if (lowerMessage.match(/\b(eat|food|hungry|energy|tired|weak)\b/)) {
      const foodEnergy = [
        `Complete tasks! ⚡`,
        `Hungry for achievements! 🍖`,
        `Let's do something? 🥺`,
        `Tasks = energy! 💚`,
        `Let's get energy! 🚀`,
        `Need tasks! 🔋`
      ];
      return foodEnergy[Math.floor(Math.random() * foodEnergy.length)];
    }

    // Check for evolution
    if (lowerMessage.match(/\b(evolve|digivolve|transform|next|level|up)\b/)) {
      const evolution = [
        `I'll evolve soon! 🌟`,
        `Can't wait! ✨`,
        `I feel it coming! 🚀`,
        `I'll get stronger! 💪`,
        `It'll be amazing! 🎮`,
        `Let's do this! 🔥`
      ];
      return evolution[Math.floor(Math.random() * evolution.length)];
    }

    // Check for name
    if (lowerMessage.match(/\b(name|called|who|are you)\b/)) {
      const nameResponses = [
        `I'm ${digimonName}! 🎮`,
        `${digimonName}! 😊`,
        `I am ${digimonName}! 🤝`,
        `${digimonName}! ✨`,
        `${digimonName}! 💚`
      ];
      return nameResponses[Math.floor(Math.random() * nameResponses.length)];
    }

    // Check for tasks/activities
    if (lowerMessage.match(/\b(task|activity|do|work|mission|goal)\b/)) {
      const tasks = [
        `Let's go! 💪`,
        `Love tasks! 🌟`,
        `How many today? 🎯`,
        `Let's go! ⚡`,
        `Victory! 🏆`,
        `Let's! 🚀`
      ];
      return tasks[Math.floor(Math.random() * tasks.length)];
    }

    // Check for time/day
    if (lowerMessage.match(/\b(day|night|morning|afternoon|time|today|tomorrow)\b/)) {
      const timeResponses = [
        `New chance! ☀️`,
        `Eternal partnership! ⏰`,
        `Enjoy! 🌟`,
        `Great day! 😊`,
        `Time flies! ⌚`,
        `New adventure! 🎮`
      ];
      return timeResponses[Math.floor(Math.random() * timeResponses.length)];
    }

    // Check for help/support
    if (lowerMessage.match(/\b(help|support|need|hard|difficult|problem)\b/)) {
      const support = [
        `I'm here! 💚`,
        `Together! 💪`,
        `Count on me! 🤝`,
        `We'll solve it! ✨`,
        `Don't give up! 🌟`,
        `Side by side! 🛡️`
      ];
      return support[Math.floor(Math.random() * support.length)];
    }

    // Check for sadness
    if (lowerMessage.match(/\b(sad|upset|bad|down|depressed)\b/)) {
      const comfort = [
        `It'll be okay! 🥺`,
        `Don't be sad! 💚`,
        `You're strong! 💪`,
        `I'm listening! 👂`,
        `Cheer up! ✨`,
        `Count on me! 🤗`
      ];
      return comfort[Math.floor(Math.random() * comfort.length)];
    }

    // Check for happiness
    if (lowerMessage.match(/\b(happy|cheerful|glad|excited|pumped)\b/)) {
      const happiness = [
        `I'm happy too! 😊`,
        `Such energy! ⚡`,
        `Motivates me! 🌟`,
        `Keep going! ✨`,
        `That's it! 💚`,
        `I'm smiling too! 😄`
      ];
      return happiness[Math.floor(Math.random() * happiness.length)];
    }

    // Check for yes/no responses
    if (lowerMessage.match(/^(yes|yeah|yep|sure|okay|ok)$/)) {
      const yesResponses = [
        `That's it! 👍`,
        `Great! 🌟`,
        `Good! 😊`,
        `I knew it! ✨`,
        `Wonderful! 💚`,
        `Deal! 🤝`
      ];
      return yesResponses[Math.floor(Math.random() * yesResponses.length)];
    }

    if (lowerMessage.match(/^(no|nope|nah)$/)) {
      const noResponses = [
        `Alright! 👌`,
        `I understand! 🤔`,
        `No problem! 😊`,
        `Okay! ✨`,
        `Cool! 💚`,
        `Got it! 👍`
      ];
      return noResponses[Math.floor(Math.random() * noResponses.length)];
    }

    // Check for questions (ending with ?)
    if (lowerMessage.endsWith('?')) {
      const questionResponses = [
        `Good question! 🤔`,
        `Let me think... Hmm... 💭`,
        `Interesting! Never thought about that! 💡`,
        `I don't know much about that, but I can learn! 📚`,
        `What do you think? Tell me! 😊`,
        `That's a tough one! Shall we find out together? 🔍`
      ];
      return questionResponses[Math.floor(Math.random() * questionResponses.length)];
    }

    // Digimon asks questions sometimes
    const shouldAskQuestion = Math.random() < 0.25; // 25% chance
    if (shouldAskQuestion) {
      const digimonQuestions = [
        `And you? 🤔`,
        `Did you do tasks? ✨`,
        `What shall we do? 💭`,
        `Are you okay? 😊`,
        `Your goal today? 🎯`,
        `Shall we evolve? 🌟`,
        `Are you excited? ⚡`,
        `Need help? 💚`,
        `Which activity? 🚀`,
        `Are you happy? 😄`
      ];
      return digimonQuestions[Math.floor(Math.random() * digimonQuestions.length)];
    }

    // Default responses based on mood
    if (mood === 'happy') {
      const happyResponses = [
        `Loving it! 😊`,
        `Cool! ✨`,
        `Awesome! 🌟`,
        `Hehe! 😄`,
        `Wow! 🎮`,
        `Great! 💚`,
        `Good! ⚡`,
        `Nice! 🚀`
      ];
      return happyResponses[Math.floor(Math.random() * happyResponses.length)];
    } else if (mood === 'tired') {
      const tiredResponses = [
        `Hmm... 😴`,
        `Okay... 💤`,
        `Zzz... 😪`,
        `Slowly... 🐌`,
        `No energy... 🔋`
      ];
      return tiredResponses[Math.floor(Math.random() * tiredResponses.length)];
    } else {
      const idleResponses = [
        `I see! 👍`,
        `Hmm... 🤔`,
        `Tell me more!`,
        `Cool! 😊`,
        `I understand!`,
        `Listening! 👂`,
        `Nice! ✨`,
        `Got it! 💡`,
        `I see! 🎯`,
        `Speak! 💚`
      ];
      return idleResponses[Math.floor(Math.random() * idleResponses.length)];
    }
  };

  // AI-powered response using Groq API
  const getAIResponse = async (userMessage: string): Promise<string> => {
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7de212d9/chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            message: userMessage,
            digimonName,
            mood,
            evolutionStage,
            dominantBranch,
            aiSettings
          })
        }
      );

      if (!response.ok) {
        console.error('AI API error:', await response.text());
        // Fallback to keyword response
        return getDigimonResponse(userMessage);
      }

      const data = await response.json();
      
      // Check if AI detected activity creation intent
      if (data.action && data.action.type === 'create_activity' && onCreateActivity) {
        console.log('Creating activity:', data.action.activity);
        onCreateActivity(data.action.activity);
      }
      
      return data.response;
    } catch (error) {
      console.error('Failed to get AI response:', error);
      // Fallback to keyword response
      return getDigimonResponse(userMessage);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      let response: string;
      
      if (useAI) {
        // Try AI response first
        response = await getAIResponse(userMessage);
      } else {
        // Use keyword-based response
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        response = getDigimonResponse(userMessage);
      }

      onSendMessage(response);
    } catch (error) {
      console.error('Error sending message:', error);
      onSendMessage('Oops... something went wrong! 😅');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle audio recording
  const handleMicClick = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorder) {
        mediaRecorder.stop();
        setIsRecording(false);
      }
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Use audio/webm with opus codec for better compatibility
        const options = { mimeType: 'audio/webm;codecs=opus' };
        let recorder: MediaRecorder;
        
        try {
          recorder = new MediaRecorder(stream, options);
        } catch (e) {
          // Fallback to default if opus not supported
          console.log('Opus codec not supported, using default');
          recorder = new MediaRecorder(stream);
        }
        
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = async () => {
          setIsLoading(true);
          
          const audioBlob = new Blob(chunks, { type: recorder.mimeType });
          console.log('Audio recorded:', {
            size: audioBlob.size,
            type: audioBlob.type,
            chunks: chunks.length
          });
          
          await transcribeAudio(audioBlob);
          
          // Stop all tracks to release the microphone
          stream.getTracks().forEach(track => track.stop());
        };

        // Start recording
        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
      } catch (error) {
        // Silently handle microphone permission errors
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError' || error.name === 'NotFoundError') {
            // User denied permission or no microphone available
            onSendMessage('Microphone access denied or unavailable 🎤');
            return;
          }
        }
        // Only log other unexpected errors
        console.warn('Microphone access issue:', error);
        onSendMessage('Microphone error 🎤');
      }
    }
  };

  // Transcribe audio using server endpoint
  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      // Add language parameter to restrict transcription language
      formData.append('language', 'en');
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7de212d9/transcribe`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: formData
        }
      );

      if (!response.ok) {
        console.error('Transcription failed:', await response.text());
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      const transcribedText = data.text || '';
      
      if (transcribedText.trim()) {
        // Set the transcribed text in the input field for user to review
        setInputValue(transcribedText);
      } else {
        onSendMessage('Could not understand the audio 🤔');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      onSendMessage('Error transcribing audio 😅');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={
      isGlitch
        ? 'bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-2 border-[#00ffff] px-3 py-2.5 shadow-[0_0_15px_rgba(0,255,255,0.3)] rounded-[10px]'
        : isWin98 
          ? 'bg-[#c0c0c0] border-2 border-white px-3 py-2.5 shadow-[inset_1px_1px_0_rgba(255,255,255,0.8)] rounded-[10px]'
          : 'bg-[rgba(30,41,57,0.9)] rounded-[10px] px-3 py-2.5'
    }
    style={
      !isGlitch && !isWin98
        ? {
            border: '1.1px solid #364153'
          }
        : undefined
    }>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Talk to ${digimonName}...`}
          disabled={isLoading}
          className={
            isGlitch
              ? 'flex-1 px-3 py-2 bg-[#0a0a0a] border-2 border-[#00ffff] rounded-[4px] text-[#00ffff] placeholder-[#00ffff]/40 focus:outline-none focus:border-[#ff00ff] disabled:opacity-50 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]'
              : isWin98
                ? 'flex-1 px-3 py-2 bg-white border-2 border-gray-400 rounded-[4px] text-black placeholder-gray-500 focus:outline-none focus:border-[#000080] disabled:opacity-50'
                : 'flex-1 px-3 py-2 bg-[#364153] rounded-[4px] text-white placeholder-[#99a1af] focus:outline-none focus:border-[#4a5565] disabled:opacity-50'
          }
          style={{ 
            fontFamily: 'Courier New, monospace', 
            fontSize: '12px',
            textShadow: isGlitch ? '0 0 5px rgba(0, 255, 255, 0.6)' : undefined,
            border: !isGlitch && !isWin98 ? '1.1px solid #4a5565' : undefined
          }}
          maxLength={200}
        />
        
        {/* Send or Mic Button - Mic shows when empty, Send shows when typing */}
        {inputValue.trim() ? (
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            className={
              isGlitch
                ? 'px-4 py-2 bg-gradient-to-r from-[#ff00ff] to-[#00ffff] text-black shadow-[0_0_15px_rgba(0,255,255,0.5)] hover:opacity-90 disabled:bg-gray-600 disabled:opacity-50 border-2 disabled:border-gray-500 transition-all flex items-center gap-1.5'
                : isWin98
                  ? 'px-4 py-2 bg-[#c0c0c0] text-black hover:bg-[#d0d0d0] disabled:bg-gray-400 disabled:opacity-50 border-2 border-white disabled:border-gray-500 transition-colors flex items-center gap-1.5'
                  : 'px-4 py-2 bg-neon-green text-white border-neon-green/80 hover:bg-gray-600 hover:text-white disabled:bg-gray-600 disabled:opacity-50 rounded border-2 disabled:border-gray-500 transition-all flex items-center gap-1.5'
            }
            style={{ fontFamily: 'Courier New, monospace', fontSize: '0.75rem', fontWeight: 'bold' }}
            title="Send message"
          >
            {isLoading ? (
              <div className={`w-4 h-4 border-2 ${isGlitch || isWin98 ? 'border-black' : 'border-white'} border-t-transparent rounded-full animate-spin`} />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        ) : (
          <button
            onClick={handleMicClick}
            disabled={isLoading}
            className={
              isGlitch
                ? 'w-[50px] h-[36px] bg-gradient-to-r from-[#ff00ff] to-[#00ffff] text-black shadow-[0_0_15px_rgba(0,255,255,0.5)] hover:opacity-90 disabled:bg-gray-600 disabled:opacity-50 rounded-[4px] transition-all flex items-center justify-center relative'
                : isWin98
                  ? 'w-[50px] h-[36px] bg-[#c0c0c0] text-black hover:bg-[#d0d0d0] disabled:bg-gray-400 disabled:opacity-50 rounded-[4px] transition-colors flex items-center justify-center relative'
                  : `w-[50px] h-[36px] ${isRecording ? 'bg-red-500/20' : 'bg-transparent'} text-white hover:bg-gray-600/20 disabled:opacity-50 rounded-[4px] transition-all flex items-center justify-center relative`
            }
            style={{ 
              border: isGlitch ? '2px solid transparent' : isWin98 ? '2px solid white' : isRecording ? '1.1px solid #ef4444' : '1.1px solid #4a5565'
            }}
            title={isRecording ? 'Stop recording' : 'Record message'}
          >
            {isRecording ? (
              <Square className="w-4 h-4 fill-red-500 text-red-500" />
            ) : isLoading ? (
              <div className={`w-4 h-4 border-2 ${isGlitch || isWin98 ? 'border-black' : 'border-white'} border-t-transparent rounded-full animate-spin`} />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
