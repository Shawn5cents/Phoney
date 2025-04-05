import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google AI client
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;
const googleAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

/**
 * Generate a response using Google's Gemini AI
 */
export async function generateGeminiResponse(prompt: string): Promise<string> {
  try {
    // Check if API key is available
    if (!GOOGLE_API_KEY) {
      throw new Error('Google API key is not configured');
    }
    
    console.log('Generating Gemini response for prompt...');
    
    // Create a model instance with specific configuration
    const model = googleAI.getGenerativeModel({
      model: 'gemini-1.5-pro-latest',
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 100 // Keep responses concise for phone calls
      }
    });

    // Generate a response using Gemini
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    // Sanitize and format the response for speech
    const sanitizedResponse = response
      .trim()
      .replace(/\n+/g, ' ') // Replace multiple newlines with a space
      .replace(/\s+/g, ' ') // Replace multiple spaces with a single space
      .replace(/[^\w\s.,?!'"]/g, '') // Remove special characters except basic punctuation
      .trim();
    
    console.log('Generated response:', sanitizedResponse);
    return sanitizedResponse;
  } catch (error) {
    console.error('Error generating AI response:', error);
    return "I'm sorry, I'm having trouble understanding right now. Could you please repeat that?";
  }
}
