import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function translateText(text: string, sourceLang: string, targetLang: string) {
  if (!text.trim()) return { translation: "", pronunciation: "" };

  const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. 
Also provide a phonetic pronunciation guide for the translated text.
Format your response as a JSON object with two keys: "translation" and "pronunciation".
Only provide the JSON object as output, nothing else. Do not use markdown blocks.

Text: "${text}"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const textResponse = response.text || "";
    // Clean potential markdown wrapping
    const cleanJson = textResponse.replace(/```json|```/g, "").trim();
    
    try {
      return JSON.parse(cleanJson);
    } catch (e) {
      return { translation: textResponse, pronunciation: "" };
    }
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

export async function summarizeText(text: string) {
  if (!text.trim()) return "";

  const prompt = `Summarize the following text concisely. 
Provide only the summary as output, nothing else.

Text: "${text}"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    console.error("Summarization error:", error);
    throw error;
  }
}

export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'tr', name: 'Turkish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'th', name: 'Thai' },
  { code: 'id', name: 'Indonesian' },
  { code: 'sv', name: 'Swedish' },
  { code: 'el', name: 'Greek' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'cs', name: 'Czech' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'ro', name: 'Romanian' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'he', name: 'Hebrew' },
  { code: 'te', name: 'Telugu' },
];
