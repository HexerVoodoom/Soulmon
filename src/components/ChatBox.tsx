import { useState } from 'react';
import { Send, Mic, Square } from 'lucide-react';
import { toast } from 'sonner';
import { type AISettings } from './AISettingsModal';
import { type Language } from '../utils/i18n';
import { detectMessageCategory } from '../utils/chatKeywords';

interface ChatBoxProps {
  digimonName: string;
  mood: 'idle' | 'happy' | 'tired';
  evolutionStage: string;
  dominantBranch?: string;
  useAI: boolean;
  onSendMessage: (response: string) => void;
  theme?: 'default' | 'win98' | 'glitch';
  aiSettings?: AISettings;
  onOpenAISettings?: () => void;
  language?: Language;
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
  onCreateActivity,
  language = 'en-US',
}: ChatBoxProps) {
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  // Anti-autofill trick
  const [isInputReadOnly, setIsInputReadOnly] = useState(true);
  const [randomName] = useState(`chat-${Math.random().toString(36).substring(7)}`);

  // Digimon responses based on keywords and mood
  const getDigimonResponse = (userMessage: string): string => {
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const category = detectMessageCategory(userMessage);

    switch (category) {
      case 'greeting':
        return pick([
          `Hello! How are you today?`,
          `Hey! Ready to complete tasks?`,
          `Hi! Good to see you!`,
          `Hello, partner! Let's evolve together?`,
          `What's up! All good?`,
          `Yo! What are we doing today?`,
          `Hey there! You showed up!`,
        ]);
      case 'farewell':
        return pick([
          `See you later! Come back soon!`,
          `Goodbye! I'll be waiting!`,
          `See you, partner!`,
          `Later! Don't disappear!`,
          `See you soon!`,
          `Bye! Keep being amazing!`,
        ]);
      case 'feeling':
        if (mood === 'happy')
          return pick([`Very happy!`, `Amazing!`, `Feeling great!`, `So happy!`, `Radiant!`]);
        if (mood === 'tired')
          return pick([`A bit tired...`, `*yawn*`, `Need energy!`, `Let's do something?`]);
        return pick([`I'm good!`, `Normal!`, `Chill!`, `Ready!`, `Always ready!`]);
      case 'encouragement':
        return pick([`Let's go!`, `Come on!`, `Yes!`, `Sure!`, `That's it!`, `You bet!`, `Let's!`]);
      case 'compliment':
        return pick([`Thank you!`, `How sweet!`, `Aww!`, `Thanks!`, `Hehe!`, `Thank you so much!`, `Awesome!`]);
      case 'affection':
        return pick([`Love you!`, `Me too!`, `So much love!`, `I adore you!`, `Aww!`, `You're the best!`]);
      case 'food':
        return pick([`Complete tasks!`, `Hungry for achievements!`, `Let's do something?`, `Tasks give energy!`, `Let's get energy!`, `Need tasks!`]);
      case 'evolution':
        return pick([`I'll evolve soon!`, `Can't wait!`, `I feel it coming!`, `I'll get stronger!`, `It'll be amazing!`, `Let's do this!`]);
      case 'name':
        return pick([`I'm ${digimonName}!`, `${digimonName}!`, `I am ${digimonName}!`, `${digimonName}, at your service!`]);
      case 'task':
        return pick([`Let's go!`, `Love tasks!`, `How many today?`, `Let's go!`, `Victory!`, `Let's!`]);
      case 'time':
        return pick([`New chance!`, `Eternal partnership!`, `Enjoy!`, `Great day!`, `Time flies!`, `New adventure!`]);
      case 'help':
        return pick([`I'm here!`, `Together!`, `Count on me!`, `We'll solve it!`, `Don't give up!`, `Side by side!`]);
      case 'sad':
        return pick([`It'll be okay!`, `Don't be sad!`, `You're strong!`, `I'm listening!`, `Cheer up!`, `Count on me!`]);
      case 'happy':
        return pick([`I'm happy too!`, `Such energy!`, `Motivates me!`, `Keep going!`, `That's it!`, `I'm smiling too!`]);
      case 'yes':
        return pick([`That's it!`, `Great!`, `Good!`, `I knew it!`, `Wonderful!`, `Deal!`]);
      case 'no':
        return pick([`Alright!`, `I understand!`, `No problem!`, `Okay!`, `Cool!`, `Got it!`]);
      case 'question':
        return pick([
          `Good question!`,
          `Let me think... Hmm...`,
          `Interesting! Never thought about that!`,
          `I don't know much about that, but I can learn!`,
          `What do you think? Tell me!`,
          `That's a tough one! Shall we find out together?`,
        ]);
      default: {
        if (Math.random() < 0.25) {
          return pick([
            `And you?`,
            `Did you do tasks?`,
            `What shall we do?`,
            `Are you okay?`,
            `Your goal today?`,
            `Shall we evolve?`,
            `Are you excited?`,
            `Need help?`,
            `Which activity?`,
            `Are you happy?`,
          ]);
        }
        if (mood === 'happy')
          return pick([`Loving it!`, `Cool!`, `Awesome!`, `Hehe!`, `Wow!`, `Great!`, `Good!`, `Nice!`]);
        if (mood === 'tired')
          return pick([`Hmm...`, `Okay...`, `Zzz...`, `Slowly...`, `No energy...`]);
        return pick([`I see!`, `Hmm...`, `Tell me more!`, `Cool!`, `I understand!`, `Listening!`, `Nice!`, `Got it!`, `Speak!`]);
      }
    }
  };

  // AI-powered response using Groq API
  const getAIResponse = async (userMessage: string): Promise<string> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          digimonName,
          mood,
          evolutionStage,
          dominantBranch,
          language,
          aiSettings,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        if (import.meta.env.DEV) console.error('AI API error:', await response.text());
        toast.warning('AI unavailable, using local responses');
        return getDigimonResponse(userMessage);
      }

      const data = await response.json();

      if (data.action && data.action.type === 'create_activity' && onCreateActivity) {
        if (import.meta.env.DEV) console.log('Creating activity:', data.action.activity);
        onCreateActivity(data.action.activity);
      }

      return data.response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.warning('AI response timed out, using local responses');
      } else {
        if (import.meta.env.DEV) console.error('Failed to get AI response:', error);
        toast.warning('AI unavailable, using local responses');
      }
      return getDigimonResponse(userMessage);
    } finally {
      clearTimeout(timeout);
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
      if (import.meta.env.DEV) console.error('Error sending message:', error);
      onSendMessage('Oops... something went wrong!');
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
          if (import.meta.env.DEV) console.log('Opus codec not supported, using default');
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
          if (import.meta.env.DEV) console.log('Audio recorded:', { size: audioBlob.size, type: audioBlob.type, chunks: chunks.length });
          
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
        if (import.meta.env.DEV) console.warn('Microphone access issue:', error);
        onSendMessage('Microphone error 🎤');
      }
    }
  };

  // Transcribe audio using server endpoint
  const transcribeAudio = async (audioBlob: Blob) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');

      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      // Convert locale code (e.g. 'pt-BR') to base language code ('pt') for Whisper
      formData.append('language', language.split('-')[0]);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-7de212d9/transcribe`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: formData,
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        if (import.meta.env.DEV) console.error('Transcription failed:', await response.text());
        toast.error('Audio transcription failed. Please try again.');
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      const transcribedText = data.text || '';

      if (transcribedText.trim()) {
        setInputValue(transcribedText);
      } else {
        onSendMessage('Could not understand the audio 🤔');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('Transcription timed out. Please try again.');
      } else {
        if (import.meta.env.DEV) console.error('Transcription error:', error);
      }
      onSendMessage('Error transcribing audio 😅');
    } finally {
      clearTimeout(timeout);
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
          onFocus={() => setIsInputReadOnly(false)}
          onBlur={() => setIsInputReadOnly(true)}
          readOnly={isInputReadOnly}
          placeholder=">_"
          disabled={isLoading}
          autoComplete="new-password"
          data-form-type="other"
          spellCheck="false"
          autoCapitalize="off"
          name={randomName}
          id={randomName}
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
