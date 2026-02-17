import { GoogleGenAI, Modality } from '@google/genai';
import { VoiceName } from '../types';

let genAI: GoogleGenAI | null = null;

const getGenAI = () => {
  if (!genAI) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error('API Key is missing from environment variables.');
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
};

export const generateSpeech = async (
  text: string,
  voice: VoiceName
): Promise<string> => {
  const ai = getGenAI();

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-tts',
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error('No audio data received from Gemini API.');
    }

    return base64Audio;
  } catch (error) {
    console.error('Gemini TTS Error:', error);
    throw error;
  }
};
