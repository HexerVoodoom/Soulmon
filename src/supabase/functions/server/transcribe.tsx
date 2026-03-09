import { Context } from "npm:hono";

export async function handleTranscribeRequest(c: Context) {
  try {
    const formData = await c.req.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string; // Get language from form data

    if (!audioFile) {
      console.error('Transcription error: No audio file provided');
      return c.json({ error: 'No audio file provided' }, 400);
    }

    console.log('Audio file received:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
      language: language || 'auto-detect'
    });

    // Get Groq API key from environment
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      console.error('Transcription error: GROQ_API_KEY not configured');
      return c.json({ error: 'AI service not configured' }, 500);
    }

    // Convert File to Blob and prepare for upload
    const audioArrayBuffer = await audioFile.arrayBuffer();
    const audioBlob = new Blob([audioArrayBuffer], { type: audioFile.type });

    // Create form data for Groq API
    const groqFormData = new FormData();
    groqFormData.append('file', audioBlob, audioFile.name);
    groqFormData.append('model', 'whisper-large-v3');
    groqFormData.append('response_format', 'json');
    
    // Add language parameter if provided (pt or en)
    if (language && (language === 'pt' || language === 'en')) {
      groqFormData.append('language', language);
      console.log('Restricting transcription to language:', language);
    } else {
      console.log('Using auto-detect for language');
    }

    console.log('Sending to Groq API with model: whisper-large-v3');

    // Call Groq Whisper API
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: groqFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error during transcription:', errorText);
      return c.json({ 
        error: 'Transcription failed', 
        details: errorText 
      }, response.status);
    }

    const result = await response.json();
    
    console.log('Transcription successful:', result.text);
    
    return c.json({ text: result.text });

  } catch (error) {
    console.error('Transcription error:', error);
    return c.json({ 
      error: 'Internal server error during transcription',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
}