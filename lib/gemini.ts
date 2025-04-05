import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Configure safety settings for the model
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

// Helper function to generate responses using Gemini with streaming
export async function generateGeminiResponse(prompt: string): Promise<string> {
  try {
    // Use gemini-pro model with streaming for real-time voice responses
    const model = genAI.getGenerativeModel({
      model: 'gemini-pro',
      safetySettings,
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.9,
        topP: 0.8,
        topK: 40,
      },
    });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    throw error;
  }
}

// Stream responses for real-time voice generation
export async function* streamGeminiResponse(prompt: string) {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-pro',
      safetySettings,
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.9,
        topP: 0.8,
        topK: 40,
      },
    });

    const result = await model.generateContentStream({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    for await (const chunk of result.stream) {
      yield chunk.text();
    }
  } catch (error) {
    console.error('Error streaming Gemini response:', error);
    throw error;
  }
}
