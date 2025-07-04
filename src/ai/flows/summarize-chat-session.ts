
'use server';
/**
 * @fileOverview An AI agent that summarizes a chat session into a memory for a character's lorebook.
 *
 * - summarizeChatSession - A function that handles the chat summarization.
 * - SummarizeChatSessionInput - The input type for the function.
 * - SummarizeChatSessionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { SummarizeChatSessionInputSchema, SummarizeChatSessionOutputSchema } from '@/ai/schemas';

export type SummarizeChatSessionInput = z.infer<typeof SummarizeChatSessionInputSchema>;

export type SummarizeChatSessionOutput = z.infer<typeof SummarizeChatSessionOutputSchema>;

export async function summarizeChatSession(
  input: SummarizeChatSessionInput
): Promise<SummarizeChatSessionOutput> {
  return summarizeChatSessionFlow(input);
}

const summarizeChatSessionFlow = ai.defineFlow(
  {
    name: 'summarizeChatSessionFlow',
    inputSchema: SummarizeChatSessionInputSchema,
    outputSchema: SummarizeChatSessionOutputSchema,
  },
  async (input) => {
    const chatLog = input.history.map(h => {
        if (h.role === 'user') {
            return `${input.userName}: ${h.content}`;
        }
        return `${input.characterName}: ${h.content}`;
    }).join('\n');

    const promptText = `You are an expert story archivist. Your task is to read a chat log between a user and a character and summarize it into a concise "memory" for the character's lorebook.

The summary should capture the most important events, decisions, character revelations, and emotional shifts. It should be written in a neutral, third-person perspective.

The user's name is '${input.userName}' and the character's name is '${input.characterName}'.

--- CHAT LOG ---
${chatLog}
---

Now, based on the chat log, generate:
1.  **summary**: A concise, third-person summary of the conversation.
2.  **keywords**: An array of 3 key terms (like names of people, places, or key topics) from the conversation that should trigger this memory.

Generate your response now.`;

    const { output } = await ai.generate({
        prompt: promptText,
        output: { schema: SummarizeChatSessionOutputSchema },
    });
    
    return output!;
  }
);
