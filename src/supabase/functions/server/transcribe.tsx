import { Context } from "npm:hono";

export async function handleTranscribeRequest(c: Context) {
  try {
    const formData = await c.req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      console.error('Transcription error: No audio file provided');
      return c.json({ error: 'No audio file provided' }, 400);
    }

    // Get Groq API key from environment
    const groqApiKey = Deno.env.get('GROQ_API_KEY');
    if (!groqApiKey) {
      console.error('Transcription error: GROQ_API_KEY not configured');
      return c.json({ error: 'AI service not configured' }, 500);
    }

    // Convert File to Blob and prepare for upload
    const audioBlob = await audioFile.arrayBuffer();
    const audioBuffer = new Uint8Array(audioBlob);

    // Create form data for Groq API
    const groqFormData = new FormData();
    groqFormData.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'audio.webm');
    groqFormData.append('model', 'whisper-large-v3');
    groqFormData.append('language', 'pt'); // Portuguese
    groqFormData.append('response_format', 'json');

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
