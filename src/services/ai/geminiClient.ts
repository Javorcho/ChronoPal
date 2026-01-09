import { GoogleGenerativeAI } from '@google/generative-ai';
import { env, isGeminiConfigured } from '@/config/env';

// Initialize Gemini AI
let genAI: GoogleGenerativeAI | null = null;
if (isGeminiConfigured) {
  genAI = new GoogleGenerativeAI(env.geminiApiKey);
}

/**
 * Call Gemini API to generate content from a prompt
 */
export const callGeminiAPI = async (prompt: string): Promise<string> => {
  if (!isGeminiConfigured || !genAI) {
    throw new Error('Gemini API key is not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY environment variable.');
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error('Gemini API error:', error);
    
    // Handle specific error types
    if (error.message?.includes('API key')) {
      throw new Error('Invalid API key. Please check your Gemini API key configuration.');
    } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      throw new Error('API rate limit exceeded. Please try again in a moment.');
    } else {
      throw new Error(`Failed to call Gemini API: ${error.message || 'Unknown error'}`);
    }
  }
};

/**
 * Check if Gemini API is configured
 */
export const isGeminiAPIConfigured = (): boolean => {
  return isGeminiConfigured && genAI !== null;
};
