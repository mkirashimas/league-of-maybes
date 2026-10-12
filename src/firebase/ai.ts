import { getAI, getGenerativeModel, GoogleAIBackend, type ObjectSchema } from 'firebase/ai';
import { app } from './config';

/**
 * The Gemini model used by the app (Firebase AI Logic, Gemini Developer API).
 * Latest Flash model per https://firebase.google.com/docs/ai-logic/models (checked 2026-10-12).
 */
export const GEMINI_MODEL = 'gemini-3.8-flash';

const ai = getAI(app, { backend: new GoogleAIBackend() });

/**
 * Sends a prompt and returns the model's JSON answer, constrained to `schema`.
 * Requests go through Firebase AI Logic and carry an App Check token.
 */
export const generateJson = async <T>(prompt: string, schema: ObjectSchema): Promise<T> => {
  const model = getGenerativeModel(ai, {
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: 'application/json', responseSchema: schema },
  });
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text()) as T;
};

export { Schema } from 'firebase/ai';
