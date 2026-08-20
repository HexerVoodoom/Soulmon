import { aiFetch } from '../utils/aiClient';
import { useState } from 'react';
import { Icon } from './ui/Icon';
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
    /* MIGRADO para `--sm2-*` (`.sm2-chatbar` / `.sm2-chat-input` /
       `.sm2-chat-btn`, no fim do `index.css`).

       Estas três classes eram a última linguagem `sm-px-*` da Home: como a
       barra é `position: fixed`, a moldura de cobre chanfrada aparecia em
       100% da tela mais vista do app, ao lado de superfícies já migradas.
       Some junto o hack que redefinia `--sm-px-cyan` no elemento raiz — o
       ciano do kit tinha UM valor nos dois temas e dava ~1,4:1 no claro;
       agora o foco e o hover saem de `--sm2-primary-ink`/`--sm2-primary-soft`,
       que respondem ao tema e estão medidos na nota do `index.css`. */
    <div className="sm2-chatbar">
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
          /* Cor, borda, foco e o mínimo de 16px (anti auto-zoom do iOS
             Safari) vivem em `.sm2-chat-input` no index.css. A fonte do
             campo continua MONOESPAÇADA (`--sm2-font-mono`), não a bitmap: é
             onde se digita frase livre em português, com acento. */
          className="sm2-chat-input"
          maxLength={200}
        />

        {/* Enviar ou Gravar — o microfone aparece com o campo vazio, o enviar
            aparece quando há texto.

            Antes esta barra sozinha carregava TRÊS linguagens visuais mortas:
            dois PNGs raster (`icon-send`/`icon-mic`), o `Square` do
            lucide-react e o `.sm-px-chat-btn-send` com o ciano do kit
            (chapado nos dois temas, hardcode `#04211f` por cima). Como a
            barra é `position: fixed`, isso aparecia em 100% da Home. Agora é
            só `<Icon>` + tokens `--sm2-*`.

            Sem preenchimento no botão de enviar: ícone NUNCA dentro de box
            (regra do dono). O estado "ativo" é o próprio glifo em tom
            primário, não uma placa colorida atrás dele. */}
        {inputValue.trim() ? (
          <button
            onClick={handleSendMessage}
            disabled={isLoading}
            className="sm2-chat-btn"
            title={language === 'pt-BR' ? 'Enviar mensagem' : 'Send message'}
            aria-label={language === 'pt-BR' ? 'Enviar mensagem' : 'Send message'}
          >
            {isLoading ? (
              <Icon name="sync" size={32} tone="muted" className="animate-spin" />
            ) : (
              <Icon name="send" size={32} fill={1} tone="primary" />
            )}
          </button>
        ) : (
          <button
            onClick={handleMicClick}
            disabled={isLoading}
            /* `flex-shrink: 0` e o mínimo de 44px de altura vivem em
               `.sm2-chat-btn`: sem eles o botão encolhia até ~18px num
               flex row de 320px (medido com Playwright). */
            className="sm2-chat-btn"
            title={isRecording ? (language === 'pt-BR' ? 'Parar gravação' : 'Stop recording') : (language === 'pt-BR' ? 'Gravar mensagem' : 'Record message')}
            aria-label={isRecording ? (language === 'pt-BR' ? 'Parar gravação' : 'Stop recording') : (language === 'pt-BR' ? 'Gravar mensagem' : 'Record message')}
          >
            {isRecording ? (
              <Icon name="stop_circle" size={32} fill={1} tone="danger" />
            ) : isLoading ? (
              <Icon name="sync" size={32} tone="muted" className="animate-spin" />
            ) : (
              <Icon name="mic" size={32} tone="ink" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
