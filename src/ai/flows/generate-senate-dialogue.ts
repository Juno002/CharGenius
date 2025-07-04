
'use server';
/**
 * @fileOverview An AI agent that generates a dialogue scene for the Internal Senate.
 * This version uses direct API calls instead of Genkit flows.
 */

import { z } from 'zod';
import type { SenateArchetype } from '@/lib/senate-archetypes';

// Schemas to validate input and output
export const SenateMessageSchema = z.object({
  char: z.string().describe("The name of the archetype speaking."),
  msg: z.string().describe("The dialogue content of the message."),
  emotion: z.string().describe("The dominant emotion or tone of the message (e.g., 'firmness', 'sarcasm', 'hope')."),
});

export const GenerateSenateDialogueInputSchema = z.object({
  archetypes: z.array(z.any()).describe("An array of the selected archetype objects participating in the dialogue."),
  history: z.array(SenateMessageSchema).describe("The conversation history so far."),
  userInput: z.string().describe("The user's latest message or the initial objective."),
  language: z.string().optional().describe("The language for the generated content, e.g., 'es' for Spanish."),
  apiKey: z.string().describe("The Google AI API key."),
  apiModel: z.string().describe("The Google AI model to use."),
});

export type SenateMessage = z.infer<typeof SenateMessageSchema>;
export type GenerateSenateDialogueInput = z.infer<typeof GenerateSenateDialogueInputSchema>;
export type GenerateSenateDialogueOutput = z.infer<typeof SenateMessageSchema>;


export async function generateSenateDialogue(
  input: GenerateSenateDialogueInput
): Promise<GenerateSenateDialogueOutput> {
  const { archetypes, history, userInput, language, apiKey, apiModel } = input;

  const archetypeDetails = archetypes.map((a: SenateArchetype) => 
      `- ${a.name}: ${a.role} Su tono es ${a.tone}.`
  ).join('\n');
  
  const historyLog = history.map(h => `${h.char}: ${h.msg}`).join('\n\n');

  const prompt = `Tu tarea es actuar como moderador de un "Senado Interno", una conversación entre arquetipos de la psique. Tu objetivo es generar la **próxima intervención** de uno de los arquetipos, basándote en el historial del debate y la última entrada del usuario.

Genera todo el contenido en el idioma especificado por este código: ${language || 'es'}.

--- ARQUETIPOS DISPONIBLES EN ESTA SESIÓN ---
${archetypeDetails}
---

--- HISTORIAL DE LA CONVERSACIÓN ---
${historyLog || "La sesión acaba de comenzar. Este es el objetivo."}
---

--- ÚLTIMA INTERVENCIÓN / OBJETIVO DEL USUARIO ---
Usuario: "${userInput}"
---

CONDICIONES:
- Decide qué arquetipo debería hablar a continuación para que la conversación sea productiva, desafiante o esclarecedora.
- El arquetipo que hable debe responder directamente a la intervención del usuario o a la intervención anterior de otro arquetipo, manteniendo la coherencia.
- **Genera UNA SOLA intervención.** No escribas por varios arquetipos.
- Tu respuesta DEBE ser un objeto JSON con las claves: "char" (el nombre del arquetipo que habla), "msg" (su diálogo) y "emotion" (la emoción dominante de su mensaje).
- No generes respuestas para el "Usuario".

Genera la siguiente intervención del Senado ahora.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
      })
  });

  if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`[Google AI Error] ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
      throw new Error('La IA no devolvió una respuesta válida. Revisa los filtros de seguridad de tu cuenta de Google AI.');
  }

  const result = JSON.parse(text);
  const validation = SenateMessageSchema.safeParse(result);
  
  if (!validation.success) {
      console.error("Zod validation failed for Senate Dialogue:", validation.error);
      throw new Error("La IA devolvió un objeto con un formato incorrecto para el diálogo del senado.");
  }

  return validation.data;
}
