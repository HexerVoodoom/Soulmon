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

export function ChatBox({ digimonName, mood, evolutionStage, dominantBranch, useAI, onSendMessage, theme = 'default', aiSettings, onOpenAISettings, onCreateActivity }: ChatBoxProps) {
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  // Digimon responses based on keywords and mood
  const getDigimonResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for greetings
    if (lowerMessage.match(/\b(oi|olá|hey|hello|hi|e aí|eai|salve)\b/)) {
      const greetings = [
        `Olá! 👋 Como você está hoje?`,
        `Hey! Pronto para completar tarefas?`,
        `Oi! Que bom te ver! 😊`,
        `Olá, parceiro! Vamos evoluir juntos?`,
        `E aí! Tudo tranquilo? ✨`,
        `Salve! O que vamos fazer hoje?`,
        `Opa! Apareceu! 🎮`
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
    }

    // Check for farewell
    if (lowerMessage.match(/\b(tchau|bye|até|falou|flw|adeus)\b/)) {
      const farewells = [
        `Até logo! Volte logo! 👋`,
        `Tchau! Vou te esperar! 😊`,
        `Até mais, parceiro! ✨`,
        `Falou! Não suma! 🎮`,
        `Te vejo em breve! 💚`,
        `Até! Continue sendo incrível! ⭐`
      ];
      return farewells[Math.floor(Math.random() * farewells.length)];
    }

    // Check for questions about feelings
    if (lowerMessage.match(/\b(como|tá|está|você|vc|sentindo|sente)\b/)) {
      if (mood === 'happy') {
        const happyFeelings = [
          `Estou muito feliz! 😊 Adoro quando completamos tarefas juntos!`,
          `Me sinto incrível! Cada atividade me deixa mais forte! 💪`,
          `Muito bem! Você tem me ajudado muito! ✨`,
          `Feliz demais! Continue assim! 🌟`,
          `Radiante! Nossa parceria é perfeita! ❤️`
        ];
        return happyFeelings[Math.floor(Math.random() * happyFeelings.length)];
      } else if (mood === 'tired') {
        const tiredFeelings = [
          `Um pouco cansado... 😴 Preciso de mais energia.`,
          `Meio devagar hoje... Complete tarefas para me animar!`,
          `Sonolento... *bocejo* 💤`,
          `Estou fraco... Me ajude com atividades? 🥺`,
          `Preciso descansar... Ou de mais energia! ⚡`
        ];
        return tiredFeelings[Math.floor(Math.random() * tiredFeelings.length)];
      } else {
        const idleFeelings = [
          `Estou bem! Pronto para novas aventuras! ✨`,
          `Normal! Esperando novas missões! 🎯`,
          `Tranquilo! O que vamos fazer? 🤔`,
          `Bem! Só esperando você me dar algo pra fazer! 😊`,
          `Ótimo! Sempre pronto! 💚`
        ];
        return idleFeelings[Math.floor(Math.random() * idleFeelings.length)];
      }
    }

    // Check for encouragement
    if (lowerMessage.match(/\b(vamos|bora|força|ânimo|consegue|vai|pode)\b/)) {
      const encouragement = [
        `Sim! Juntos somos mais fortes! 💪`,
        `Vamos nessa! Não há nada que não possamos fazer! 🚀`,
        `Bora! Estou animado! ⚡`,
        `Claro! Conte comigo! 🌟`,
        `Isso aí! Com você eu vou longe! ✨`,
        `Pode crer! Parceria forte! 🤝`,
        `Vamo que vamo! 💚`
      ];
      return encouragement[Math.floor(Math.random() * encouragement.length)];
    }

    // Check for compliments
    if (lowerMessage.match(/\b(legal|bonito|incrível|massa|top|maneiro|dahora|foda|show|lindo|fofo)\b/)) {
      const compliments = [
        `Obrigado! Você também é incrível! ❤️`,
        `Que fofo! Você é demais! 😊`,
        `Awn! Isso me deixa feliz! ✨`,
        `Valeu! Você é o melhor! 🌟`,
        `Hehe, obrigado! Você me motiva! 💚`,
        `Que gentil! Adoro você! 🥰`,
        `Brigadão! Juntos somos imbatíveis! 💪`
      ];
      return compliments[Math.floor(Math.random() * compliments.length)];
    }

    // Check for love/affection
    if (lowerMessage.match(/\b(amo|adoro|gosto|te amo|amor|querido|amigo)\b/)) {
      const affection = [
        `Também te amo! ❤️ Você é meu melhor amigo!`,
        `Eu também! Nossa amizade é especial! 💚`,
        `Que amor! Vamos sempre juntos! 🥰`,
        `Adoro você também, parceiro! ✨`,
        `Meu coração digital está quentinho! 💖`,
        `Você é o melhor treinador que eu poderia ter! 🌟`
      ];
      return affection[Math.floor(Math.random() * affection.length)];
    }

    // Check for food/energy
    if (lowerMessage.match(/\b(comer|comida|fome|energia|cansado|fraco)\b/)) {
      const foodEnergy = [
        `Complete mais tarefas para me dar energia! ⚡`,
        `Tenho fome de conquistas! Vamos completar atividades! 🍖`,
        `Preciso de energia... Me ajude com as tarefas? 🥺`,
        `Cada atividade é como um alimento pra mim! 💚`,
        `Vamos ganhar energia juntos! Complete mais missões! 🚀`,
        `Minha bateria precisa de recargas... Tarefas são meu combustível! 🔋`
      ];
      return foodEnergy[Math.floor(Math.random() * foodEnergy.length)];
    }

    // Check for evolution
    if (lowerMessage.match(/\b(evolu|digivolv|transform|próximo|level|subir)\b/)) {
      const evolution = [
        `Continue trabalhando e logo vou evoluir! 🌟`,
        `Mal posso esperar! Cada tarefa me deixa mais perto! ✨`,
        `Sinto a evolução chegando! Vamos continuar! 🚀`,
        `Quando eu evoluir vou ficar ainda mais forte! 💪`,
        `Você vai ver minha próxima forma! Será incrível! 🎮`,
        `A evolução é o resultado do nosso esforço! 🔥`
      ];
      return evolution[Math.floor(Math.random() * evolution.length)];
    }

    // Check for name
    if (lowerMessage.match(/\b(nome|chama|quem|você é|vc é)\b/)) {
      const nameResponses = [
        `Eu sou ${digimonName}! Seu companheiro digital! 🎮`,
        `Me chamo ${digimonName}! Prazer! 😊`,
        `${digimonName} é meu nome! E você? 🤝`,
        `Sou ${digimonName}, seu parceiro! ✨`,
        `${digimonName} para te servir! 💚`
      ];
      return nameResponses[Math.floor(Math.random() * nameResponses.length)];
    }

    // Check for tasks/activities
    if (lowerMessage.match(/\b(tarefa|atividade|fazer|trabalh|missão|objetivo)\b/)) {
      const tasks = [
        `Vamos completar mais atividades! Cada uma me deixa mais forte! 💪`,
        `Adoro fazer tarefas! É assim que crescemos! 🌟`,
        `Quantas missões vamos completar hoje? 🎯`,
        `Tarefas são nossa especialidade! Bora! ⚡`,
        `Cada atividade é uma vitória nossa! 🏆`,
        `Vamos mostrar do que somos capazes! 🚀`
      ];
      return tasks[Math.floor(Math.random() * tasks.length)];
    }

    // Check for time/day
    if (lowerMessage.match(/\b(dia|noite|manhã|tarde|hora|tempo|hoje|amanhã)\b/)) {
      const timeResponses = [
        `Todo dia é uma nova chance de evoluir! ☀️`,
        `O tempo passa, mas nossa parceria é eterna! ⏰`,
        `Aproveite cada momento! 🌟`,
        `Hoje vai ser um ótimo dia! 😊`,
        `O tempo voa quando estamos juntos! ⌚`,
        `Cada dia é uma aventura nova! 🎮`
      ];
      return timeResponses[Math.floor(Math.random() * timeResponses.length)];
    }

    // Check for help/support
    if (lowerMessage.match(/\b(ajuda|ajudar|socorro|preciso|difícil|problema)\b/)) {
      const support = [
        `Estou aqui para te ajudar! 💚`,
        `Juntos vamos superar qualquer coisa! 💪`,
        `Conte comigo, parceiro! 🤝`,
        `Vamos resolver isso juntos! ✨`,
        `Não desista! Eu acredito em você! 🌟`,
        `Problemas? A gente enfrenta lado a lado! 🛡️`
      ];
      return support[Math.floor(Math.random() * support.length)];
    }

    // Check for sadness
    if (lowerMessage.match(/\b(triste|chateado|mal|down|pra baixo|deprimido)\b/)) {
      const comfort = [
        `Ei, vai ficar tudo bem! Estou aqui! 🥺`,
        `Não fique triste! Vamos dar a volta por cima! 💚`,
        `Dias ruins passam! Você é forte! 💪`,
        `Quer conversar? Estou ouvindo! 👂`,
        `Anime-se! Completa uma tarefa, vai te fazer bem! ✨`,
        `Você não está sozinho! Conte comigo! 🤗`
      ];
      return comfort[Math.floor(Math.random() * comfort.length)];
    }

    // Check for happiness
    if (lowerMessage.match(/\b(feliz|alegre|contente|animado|empolgado)\b/)) {
      const happiness = [
        `Fico feliz quando você está feliz! 😊`,
        `Que energia boa! Vamos aproveitar! ⚡`,
        `Sua alegria me motiva! 🌟`,
        `Adorei! Continue assim! ✨`,
        `Energia positiva! Isso aí! 💚`,
        `Quando você sorri, eu também sorrio! 😄`
      ];
      return happiness[Math.floor(Math.random() * happiness.length)];
    }

    // Check for yes/no responses
    if (lowerMessage.match(/^(sim|yes|s|uhum|ahan|claro|obvio)$/)) {
      const yesResponses = [
        `Isso aí! 👍`,
        `Ótimo! 🌟`,
        `Que bom! 😊`,
        `Sabia! ✨`,
        `Maravilha! 💚`,
        `Combinado! 🤝`
      ];
      return yesResponses[Math.floor(Math.random() * yesResponses.length)];
    }

    if (lowerMessage.match(/^(não|nao|no|n|nope|nem)$/)) {
      const noResponses = [
        `Tudo bem! 👌`,
        `Entendo! 🤔`,
        `Sem problemas! 😊`,
        `Ok! ✨`,
        `Tranquilo! 💚`,
        `Beleza! 👍`
      ];
      return noResponses[Math.floor(Math.random() * noResponses.length)];
    }

    // Check for questions (ending with ?)
    if (lowerMessage.endsWith('?')) {
      const questionResponses = [
        `Boa pergunta! 🤔`,
        `Deixa eu pensar... Hmm... 💭`,
        `Interessante! Nunca tinha pensado nisso! 💡`,
        `Não sei muito sobre isso, mas posso aprender! 📚`,
        `O que você acha? Me conta! 😊`,
        `Essa é difícil! Vamos descobrir juntos? 🔍`
      ];
      return questionResponses[Math.floor(Math.random() * questionResponses.length)];
    }

    // Digimon asks questions sometimes
    const shouldAskQuestion = Math.random() < 0.3; // 30% chance
    if (shouldAskQuestion) {
      const digimonQuestions = [
        `Interessante! E você, como está? 🤔`,
        `Legal! Completou alguma tarefa hoje? ✨`,
        `Hmm! O que vamos fazer agora? 💭`,
        `Entendo! Está se sentindo bem? 😊`,
        `Bacana! Qual é sua meta de hoje? 🎯`,
        `Show! Quando vamos evoluir juntos? 🌟`,
        `Massa! Tá animado pra quê hoje? ⚡`,
        `Opa! Precisa de ajuda com algo? 💚`,
        `Saquei! Qual atividade vamos fazer? 🚀`,
        `Beleza! Tá feliz hoje? 😄`
      ];
      return digimonQuestions[Math.floor(Math.random() * digimonQuestions.length)];
    }

    // Default responses based on mood
    if (mood === 'happy') {
      const happyResponses = [
        `Estou adorando nossa conversa! 😊`,
        `Isso é muito interessante! ✨`,
        `Você é o melhor parceiro! 🌟`,
        `Hehe, legal! 😄`,
        `Nossa! Que legal! 🎮`,
        `Adoro quando você fala comigo! 💚`,
        `Muito bom! Continue! ⚡`,
        `Que demais! 🚀`
      ];
      return happyResponses[Math.floor(Math.random() * happyResponses.length)];
    } else if (mood === 'tired') {
      const tiredResponses = [
        `Hmm... *bocejo* 😴`,
        `Tá... 💤`,
        `Preciso descansar um pouco...`,
        `Zzz... o que? 😪`,
        `Meio devagar hoje... 🐌`,
        `Sem energia... 🔋`,
        `Cansadinho... 😌`
      ];
      return tiredResponses[Math.floor(Math.random() * tiredResponses.length)];
    } else {
      const idleResponses = [
        `Entendo! 👍`,
        `Interessante... 🤔`,
        `Conte me mais!`,
        `Legal! 😊`,
        `Hmm, compreendo.`,
        `Estou ouvindo! 👂`,
        `Bacana! ✨`,
        `Saquei! 💡`,
        `Entendi! 🎯`,
        `Pode falar! 💚`
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

  // Audio transcription using Groq Whisper API
  const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
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
        const errorText = await response.text();
        console.error('Transcription API error:', errorText);
        throw new Error('Falha na transcrição');
      }

      const data = await response.json();
      return data.text;
    } catch (error) {
      console.error('Failed to transcribe audio:', error);
      throw error;
    }
  };

  // Start audio recording
  const startRecording = async () => {
    try {
      // Check if browser supports audio recording
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Seu navegador não suporta gravação de áudio. Por favor, use um navegador moderno como Chrome, Firefox ou Edge.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        setIsLoading(true);
        try {
          const transcription = await transcribeAudio(audioBlob);
          setInputValue(transcription);
        } catch (error) {
          console.error('Transcription failed:', error);
          onSendMessage('Desculpe, não consegui entender o áudio. 😅');
        } finally {
          setIsLoading(false);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
      
      // Provide more specific error messages
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          alert('⚠️ Permissão de Microfone Negada\n\nPara usar áudio:\n\n1. Clique no ícone de cadeado/configurações na barra de endereço\n2. Permita o acesso ao microfone\n3. Recarregue a página\n4. Tente novamente');
        } else if (error.name === 'NotFoundError') {
          alert('Nenhum microfone foi encontrado. Por favor, conecte um microfone e tente novamente.');
        } else if (error.name === 'NotReadableError') {
          alert('O microfone está sendo usado por outro aplicativo. Feche outros apps que usam o microfone e tente novamente.');
        } else {
          alert(`Erro ao acessar o microfone: ${error.message}`);
        }
      } else {
        alert('Não foi possível acessar o microfone. Verifique as permissões do navegador.');
      }
    }
  };

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
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
      onSendMessage('Ops... algo deu errado! 😅');
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

  return (
    <div className={
      isGlitch
        ? 'bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-2 border-[#00ffff] px-3 py-2.5 shadow-[0_0_15px_rgba(0,255,255,0.3)]'
        : isWin98 
          ? 'bg-[#c0c0c0] border-2 border-white px-3 py-2.5 shadow-[inset_1px_1px_0_rgba(255,255,255,0.8)]'
          : 'bg-gray-800/90 rounded-lg border-2 border-gray-700 px-3 py-2.5'
    }>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isRecording ? 'Gravando...' : `Fale com ${digimonName}...`}
          disabled={isLoading || isRecording}
          className={
            isGlitch
              ? 'flex-1 px-3 py-2 bg-[#0a0a0a] border-2 border-[#00ffff] text-[#00ffff] placeholder-[#00ffff]/40 focus:outline-none focus:border-[#ff00ff] disabled:opacity-50 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)]'
              : isWin98
                ? 'flex-1 px-3 py-2 bg-white border-2 border-gray-400 text-black placeholder-gray-500 focus:outline-none focus:border-[#000080] disabled:opacity-50'
                : 'flex-1 px-3 py-2 bg-gray-700 border-2 border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-mint disabled:opacity-50'
          }
          style={{ 
            fontFamily: 'Courier New, monospace', 
            fontSize: '0.75rem',
            textShadow: isGlitch ? '0 0 5px rgba(0, 255, 255, 0.6)' : undefined
          }}
          maxLength={200}
        />
        
        {/* Mic/Send Button - changes based on input */}
        <button
          onClick={inputValue.trim() ? handleSendMessage : (isRecording ? stopRecording : startRecording)}
          disabled={isLoading || (inputValue.trim() ? false : isRecording ? false : false)}
          className={
            isGlitch
              ? `px-4 py-2 ${isRecording ? 'bg-gradient-to-r from-[#ff0000] to-[#ff00ff] animate-pulse text-black' : inputValue.trim() ? 'bg-gradient-to-r from-[#ff00ff] to-[#00ffff] text-black shadow-[0_0_15px_rgba(0,255,255,0.5)]' : 'bg-gray-800/50 text-[#00ffff] border-[#00ffff]/50 shadow-[0_0_10px_rgba(0,255,255,0.2)]'} hover:opacity-90 disabled:bg-gray-600 disabled:opacity-50 border-2 disabled:border-gray-500 transition-all flex items-center gap-1.5`
              : isWin98
                ? `px-4 py-2 ${isRecording ? 'bg-red-500 animate-pulse text-white' : inputValue.trim() ? 'bg-[#c0c0c0] text-black' : 'bg-gray-400 text-gray-700'} hover:bg-[#d0d0d0] disabled:bg-gray-400 disabled:opacity-50 border-2 border-white disabled:border-gray-500 transition-colors flex items-center gap-1.5`
                : `px-4 py-2 ${isRecording ? 'bg-red-500 animate-pulse text-white border-red-400' : inputValue.trim() ? 'bg-neon-green text-white border-neon-green/80' : 'bg-gray-700/80 text-gray-300 border-gray-600'} hover:bg-gray-600 hover:text-white disabled:bg-gray-600 disabled:opacity-50 rounded border-2 disabled:border-gray-500 transition-all flex items-center gap-1.5`
          }
          style={{ fontFamily: 'Courier New, monospace', fontSize: '0.75rem', fontWeight: 'bold' }}
          title={inputValue.trim() ? 'Enviar mensagem' : (isRecording ? 'Parar gravação' : 'Gravar áudio')}
        >
          {isLoading ? (
            <div className={`w-4 h-4 border-2 ${isGlitch || isWin98 ? 'border-black' : 'border-white'} border-t-transparent rounded-full animate-spin`} />
          ) : isRecording ? (
            <Square className="w-4 h-4" />
          ) : inputValue.trim() ? (
            <Send className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}