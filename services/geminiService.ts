import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FormField, FieldType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateFormSchema = async (description: string): Promise<FormField[]> => {
  if (!process.env.API_KEY) {
    console.warn("No API Key provided");
    // Return a dummy schema if no key to prevent crash in demo
    return [
      { id: 'f1', type: FieldType.TEXT, label: 'Patient Name (Demo)', required: true },
      { id: 'f2', type: FieldType.TEXTAREA, label: 'Symptoms (Demo)', required: true }
    ];
  }

  const prompt = `Create a hospital form structure based on this description: "${description}". 
  Use Thai language for labels.
  Return a JSON array of fields. 
  Supported types: text, number, textarea, dropdown, checkbox, date, signature, file.
  For dropdown/checkbox, provide 'options'.
  Ensure IDs are unique strings.
  `;

  // Define Schema using the new Type enum from @google/genai
  const fieldSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      type: { type: Type.STRING, enum: Object.values(FieldType) },
      label: { type: Type.STRING },
      required: { type: Type.BOOLEAN },
      options: { type: Type.ARRAY, items: { type: Type.STRING } },
      placeholder: { type: Type.STRING }
    },
    required: ["id", "type", "label"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: fieldSchema
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text) as FormField[];

  } catch (error) {
    console.error("Gemini API Error:", error);
    return [];
  }
};
