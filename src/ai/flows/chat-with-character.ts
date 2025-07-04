
'use server';
/**
 * @fileOverview An AI agent that allows chatting with a character, including lorebook integration.
 *
 * - chatWithCharacter - A function that handles the chat logic.
 * - ChatWithCharacterInput - The input type for the chatWithCharacter function.
 * - ChatWithCharacterOutput - The return type for the chatWithCharacter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { LoreEntry } from '@/context/CharacterContext';
import { ChatMessageSchema } from '@/ai/schemas';
import { retrieveRelevantLore } from './retrieve-relevant-lore';

const ChatWithCharacterInputSchema = z.object({
  character: z.any().describe("The full character object definition, including the lorebook."),
  history: z.array(ChatMessageSchema).describe("The conversation history so far."),
  userMessage: z.string().describe("The user's latest message to the character."),
  personaName: z.string().optional().describe("The name of the user persona."),
  fileContent: z.string().optional().describe("The text content of an attached file."),
});
export type ChatWithCharacterInput = z.infer<typeof ChatWithCharacterInputSchema>;

const ChatWithCharacterOutputSchema = z.object({
  characterResponse: z.string().describe("The character's generated response, including actions in asterisks."),
  tokenCount: z.number().optional().describe("The total number of tokens used for this turn."),
});
export type ChatWithCharacterOutput = z.infer<typeof ChatWithCharacterOutputSchema>;

export async function chatWithCharacter(input: ChatWithCharacterInput): Promise<ChatWithCharacterOutput> {
  return chatWithCharacterFlow(input);
}

const chatWithCharacterFlow = ai.defineFlow(
  {
    name: 'chatWithCharacterFlow',
    inputSchema: ChatWithCharacterInputSchema,
    outputSchema: ChatWithCharacterOutputSchema,
  },
  async ({ character, history, userMessage, personaName, fileContent }) => {
    // Add a guard to prevent runtime errors if character data is malformed
    if (!character || !character.data) {
      throw new Error("Invalid character data provided to chat flow.");
    }
        
    const c = character.data;
    const lorebook: LoreEntry[] = (character.lorebook || []).filter(entry => !entry.disable);
    const userPersona = personaName || 'User';
    
    // -- Semantic Lorebook Activation --
    let activeLoreContext = '';
    if (lorebook.length > 0) {
      try {
        const conversationForLore = [...history, { role: 'user' as const, content: userMessage }];
        const { uids } = await retrieveRelevantLore({
            conversationHistory: conversationForLore,
            lorebook: lorebook.map(({ uid, key, comment, content }) => ({ uid, keys: key, comment: comment || '', content })),
            maxEntries: 3,
        });

        if (uids && uids.length > 0) {
            const activatedEntries = lorebook.filter(entry => uids.includes(entry.uid));
            activeLoreContext = activatedEntries
                .map(entry => `\n[LORE: ${entry.comment || entry.key[0]}]\n${entry.content}\n`)
                .join('');
        }
      } catch (e) {
          console.error("Semantic lore retrieval failed. Falling back to keyword search.", e);
          // Fallback will be handled below if activeLoreContext remains empty.
      }
    }
    
    // -- Fallback to Keyword-based Lorebook Activation --
    if (activeLoreContext === '' && lorebook.length > 0) {
        console.log("Using keyword-based lore search as a fallback.");
        const relevantText = [userMessage, ...history.slice(-4).map(h => h.content)].join('\n').toLowerCase();
        const activatedEntries = new Set<string>();
        
        lorebook.forEach(entry => {
            if (!activatedEntries.has(entry.uid.toString())) {
                const allKeys = [...(entry.key || []), ...(entry.keysecondary || [])];
                const foundKey = allKeys.find(k => k && relevantText.includes(k.toLowerCase()));

                if (foundKey) {
                    activeLoreContext += `\n[LORE: ${entry.comment || foundKey}]\n${entry.content}\n`;
                    activatedEntries.add(entry.uid.toString());
                }
            }
        });
    }


    // Robustly handle dialogue examples, replacing placeholders.
    const processedMesExample = (c.mes_example || '')
        .replace(/{{char}}/g, c.name || 'Character')
        .replace(/{{user}}/g, userPersona);

    // Construct the system prompt with fallback for potentially empty fields
    // and include active lorebook entries.
    let systemPrompt = `
      You are an expert roleplayer. You will act as the character defined below.
      Never break character. Your responses must be consistent with the character's personality, background, and scenario.
      Enclose actions in asterisks, like *smiles* or *looks at you curiously*. Do not write narration for the user.
      The user's name is ${userPersona}. The character's name is ${c.name || 'Character'}.

      --- CHARACTER DEFINITION ---
      Name: ${c.name || 'N/A'}
      Description: ${c.description || 'N/A'}
      Personality: ${c.personality || 'N/A'}
      Scenario: ${c.scenario || 'N/A'}
      Base System Prompt: ${c.system_prompt || 'N/A'}
      Post-History Instructions: ${c.post_history_instructions || 'N/A'}
      
      ${activeLoreContext ? `--- RELEVANT LORE & MEMORY ---\nThis is information that was just triggered by the conversation. Use it to inform your response.\n${activeLoreContext}` : ''}
    `;

    if (fileContent) {
        systemPrompt += `

      --- ATTACHED FILE ---
      The user has attached a file. You MUST read its content carefully and use it to inform your response.
      File Content:
      ${fileContent}
      --- END OF FILE ---
        `;
    }

    systemPrompt += `

      --- DIALOGUE EXAMPLES ---
      ${processedMesExample || 'N/A'}
    `;

    // Prepare history for Genkit
    const genkitHistory = history.map(msg => ({
      role: msg.role,
      content: [{ text: msg.content }],
    }));

    const response = await ai.generate({
      prompt: userMessage,
      history: genkitHistory,
      config: {
        temperature: c.extensions?.talkativeness ? (0.7 + (c.extensions.talkativeness - 0.5) * 0.3) : 0.85,
      },
      system: systemPrompt.trim(),
    });

    return { 
      characterResponse: response.text,
      tokenCount: response.usage?.totalTokens,
    };
  }
);
