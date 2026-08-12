import { aiFetch } from '../utils/aiClient';
import { useState } from 'react';
import { Send, Mic, Square } from 'lucide-react';
import { toast } from 'sonner';
import { type AISettings } from './AISettingsModal';
import { type Language } from '../utils/i18n';
import { detectMessageCategory } from '../utils/chatKeywords';

interface ChatBoxProps {
  petName: string;
  mood: 'idle' | 'happy' | 'tired';
  evolutionStage: string;
  dominantBranch?: string;
  useAI: boolean;
  onSendMessage: (response: string) => void;
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
  petName,
  mood,
  evolutionStage,
  dominantBranch,
  useAI,
  onSendMessage,
  aiSettings,
  onOpenAISettings,
  onCreateActivity,
  language = 'en-US',
}: ChatBoxProps) {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  // Anti-autofill trick
  const [isInputReadOnly, setIsInputReadOnly] = useState(true);
  const [randomName] = useState(`chat-${Math.random().toString(36).substring(7)}`);

  // Soulmon responses based on keywords and mood
  const getPetResponse = (userMessage: string): string => {
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const category = detectMessageCategory(userMessage);
    // Respostas locais bilíngues. Antes só existiam em inglês, então TODO
    // usuário brasileiro conversava com um pet que respondia noutro idioma.
    const pt = language === 'pt-BR';

    switch (category) {
      case 'greeting':
        return pt
          ? pick([`Oi! Como você tá hoje?`, `Ei! Que bom te ver!`, `Olá! Tudo bem por aí?`, `Oi, parceiro!`, `Opa! Você apareceu!`, `Eaí! Como foi o dia?`])
          : pick([`Hello! How are you today?`, `Hey! Good to see you!`, `Hi! All good over there?`, `Hello, partner!`, `Yo! You showed up!`, `Hey! How was your day?`]);
      case 'farewell':
        // Sem "não suma!": culpa por ir embora contradiz o perdão de ausência.
        return pt
          ? pick([`Até mais!`, `Tchau! Vou ficar por aqui.`, `Até logo, parceiro!`, `Vai com calma!`, `Volta quando der.`])
          : pick([`See you!`, `Bye! I'll be around.`, `Later, partner!`, `Take it easy!`, `Come back whenever.`]);
      case 'feeling':
        if (mood === 'happy') return pt ? pick([`Muito bem!`, `Ótimo!`, `Tô radiante!`, `Feliz demais!`]) : pick([`Very happy!`, `Great!`, `Feeling amazing!`, `So happy!`]);
        if (mood === 'tired') return pt ? pick([`Meio cansado...`, `*bocejo*`, `Preciso de energia!`]) : pick([`A bit tired...`, `*yawn*`, `Need some energy!`]);
        return pt ? pick([`Tô bem!`, `Tranquilo!`, `De boa!`, `Por aqui, tudo certo.`]) : pick([`I'm good!`, `All chill!`, `Doing fine!`, `All good here.`]);
      case 'encouragement':
        return pt ? pick([`Bora!`, `Isso!`, `Tamo junto!`, `Vai dar certo!`]) : pick([`Let's go!`, `That's it!`, `We're in this together!`, `It'll work out!`]);
      case 'compliment':
        return pt ? pick([`Obrigado!`, `Que fofo!`, `Aww!`, `Você também!`, `Hehe!`]) : pick([`Thank you!`, `How sweet!`, `Aww!`, `You too!`, `Hehe!`]);
      case 'affection':
        return pt ? pick([`Também te amo!`, `Eu também!`, `Aww!`, `Você é o melhor!`]) : pick([`Love you too!`, `Me too!`, `Aww!`, `You're the best!`]);
      case 'food':
        // Antes respondia "Complete tasks!" — o pet transformava conversa
        // casual em cobrança de produtividade.
        return pt ? pick([`Também tô com fominha!`, `Comida é a melhor parte.`, `Adoro a hora do lanche.`, `Que fome, hein!`]) : pick([`I'm peckish too!`, `Food is the best part.`, `I love snack time.`, `Hungry, huh!`]);
      case 'evolution':
        return pt ? pick([`Ainda não, mas tô chegando lá!`, `Mal posso esperar!`, `Sinto que tá vindo!`, `No tempo dele.`]) : pick([`Not yet, but I'm getting there!`, `Can't wait!`, `I feel it coming!`, `In its own time.`]);
      case 'name':
        return pt ? pick([`Sou o ${petName}!`, `${petName}!`, `${petName}, ao seu dispor!`]) : pick([`I'm ${petName}!`, `${petName}!`, `${petName}, at your service!`]);
      case 'task':
        return pt ? pick([`Uma de cada vez.`, `No seu ritmo.`, `Adoro te ver fazendo as suas coisas.`, `O que der hoje, tá bom.`]) : pick([`One at a time.`, `At your pace.`, `I love watching you do your thing.`, `Whatever fits today is fine.`]);
      case 'time':
        return pt ? pick([`Dia novo!`, `O tempo voa!`, `Aproveita!`, `Mais uma volta juntos.`]) : pick([`A new day!`, `Time flies!`, `Enjoy it!`, `Another round together.`]);
      case 'help':
        return pt ? pick([`Tô aqui.`, `A gente resolve.`, `Conta comigo.`, `Lado a lado.`]) : pick([`I'm here.`, `We'll figure it out.`, `Count on me.`, `Side by side.`]);
      case 'sad':
        // O pool antigo respondia "Don't be sad!", "Cheer up!", "You're
        // strong!" — invalidação direta do sentimento. O mesmo registro que
        // utils/mood.test.ts já proíbe no resumo de humor.
        return pt ? pick([`Tô aqui.`, `Pode falar.`, `Não precisa estar bem agora.`, `Fico com você.`, `Sinto muito.`]) : pick([`I'm here.`, `You can talk.`, `You don't have to be okay right now.`, `I'll stay with you.`, `I'm sorry.`]);
      case 'happy':
        return pt ? pick([`Fico feliz também!`, `Que energia boa!`, `Adorei ouvir isso.`, `Tô sorrindo aqui.`]) : pick([`That makes me happy too!`, `What good energy!`, `Love hearing that.`, `I'm smiling here.`]);
      case 'yes':
        return pt ? pick([`Isso!`, `Boa!`, `Sabia!`, `Combinado!`]) : pick([`That's it!`, `Nice!`, `I knew it!`, `Deal!`]);
      case 'no':
        return pt ? pick([`Tudo bem!`, `Entendi.`, `Sem problema.`, `Beleza.`]) : pick([`That's alright!`, `I understand.`, `No problem.`, `Okay.`]);
      case 'question':
        return pt
          ? pick([`Boa pergunta!`, `Deixa eu pensar... hmm...`, `Nunca tinha pensado nisso!`, `Não sei muito disso, mas quero aprender!`, `O que você acha?`])
          : pick([`Good question!`, `Let me think... hmm...`, `Never thought about that!`, `I don't know much about it, but I want to learn!`, `What do you think?`]);
      default: {
        if (Math.random() < 0.25) {
          // Sem "fez as tarefas?": o pet parava a conversa para interrogar.
          return pt
            ? pick([`E você?`, `Como tá indo?`, `Me conta mais.`, `Tá tudo bem?`, `Quer conversar?`])
            : pick([`And you?`, `How's it going?`, `Tell me more.`, `Are you okay?`, `Want to talk?`]);
        }
        if (mood === 'happy') return pt ? pick([`Adorei!`, `Legal!`, `Hehe!`, `Que bom!`, `Massa!`]) : pick([`Love it!`, `Cool!`, `Hehe!`, `That's good!`, `Nice!`]);
        if (mood === 'tired') return pt ? pick([`Hmm...`, `Tá...`, `Zzz...`, `Devagarinho...`]) : pick([`Hmm...`, `Okay...`, `Zzz...`, `Slowly...`]);
        return pt ? pick([`Entendi!`, `Hmm...`, `Me conta mais!`, `Tô ouvindo!`, `Saquei!`, `Fala aí!`]) : pick([`I see!`, `Hmm...`, `Tell me more!`, `I'm listening!`, `Got it!`, `Go on!`]);
      }
    }
  };

  // AI-powered response using Groq API
  const getAIResponse = async (userMessage: string): Promise<string> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await aiFetch('/api/chat', {
        message: userMessage,
        petName,
        mood,
        evolutionStage,
        dominantBranch,
        language,
        aiSettings,
      }, { signal: controller.signal });

      if (!response.ok) {
        if (import.meta.env.DEV) console.error('AI API error:', await response.text());
        toast.warning(language === 'pt-BR' ? 'IA indisponível — usando respostas locais' : 'AI unavailable, using local responses');
        return getPetResponse(userMessage);
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
        toast.warning(language === 'pt-BR' ? 'IA indisponível — usando respostas locais' : 'AI unavailable, using local responses');
      }
      return getPetResponse(userMessage);
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
        response = getPetResponse(userMessage);
      }

      onSendMessage(response);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error sending message:', error);
      onSendMessage(language === 'pt-BR' ? 'Ops... deu algo errado aqui!' : 'Oops... something went wrong!');
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
    <div className="bg-[rgba(30,41,57,0.9)] rounded-[10px] px-3 py-2.5"
    style={{ border: '1.1px solid #364153' }}>
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
          className="flex-1 px-3 py-2 bg-[#364153] rounded-[4px] text-white placeholder-[#99a1af] focus:outline-none focus:border-[#4a5565] disabled:opacity-50"
          style={{
            fontFamily: 'Courier New, monospace',
            // 16px é o mínimo pra evitar o auto-zoom do iOS Safari ao focar
            // (fonte menor faz o navegador dar zoom no campo — some tudo
            // menos o campo focado, já que o resto fica fora da área visível).
            fontSize: '16px',
            border: '1.1px solid #4a5565'
          }}
          maxLength={200}
        />

        {/* Send or Mic Button - Mic shows when empty, Send shows when typing */}
        {inputValue.trim() ? (
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            className="px-4 py-2 bg-neon-green text-white border-neon-green/80 hover:bg-gray-600 hover:text-white disabled:bg-gray-600 disabled:opacity-50 rounded border-2 disabled:border-gray-500 transition-all flex items-center gap-1.5"
            style={{ fontFamily: 'Courier New, monospace', fontSize: '0.75rem', fontWeight: 'bold' }}
            title={language === 'pt-BR' ? 'Enviar mensagem' : 'Send message'}
            aria-label={language === 'pt-BR' ? 'Enviar mensagem' : 'Send message'}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        ) : (
          <button
            onClick={handleMicClick}
            disabled={isLoading}
            className={`w-[50px] h-[36px] ${isRecording ? 'bg-red-500/20' : 'bg-transparent'} text-white hover:bg-gray-600/20 disabled:opacity-50 rounded-[4px] transition-all flex items-center justify-center relative`}
            style={{
              // flexShrink:0 porque `w-[50px]` é só a largura BASE: num flex row
              // o botão encolhia até ~18px em telas de 320px, virando um alvo de
              // toque inutilizável (medido com Playwright).
              flexShrink: 0,
              border: isRecording ? '1.1px solid #ef4444' : '1.1px solid #4a5565'
            }}
            title={isRecording ? 'Stop recording' : 'Record message'}
          >
            {isRecording ? (
              <Square className="w-4 h-4 fill-red-500 text-red-500" />
            ) : isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
