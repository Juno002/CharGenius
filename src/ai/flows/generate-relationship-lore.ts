'use server';
/**
 * @fileOverview An AI agent that generates lorebook entries defining a relationship between two characters.
 *
 * - generateRelationshipLore - A function that handles the lore generation.
 * - GenerateRelationshipLoreInput - The input type for the function.
 * - GenerateRelationshipLoreOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { GenerateRelationshipLoreInputSchema, GenerateRelationshipLoreOutputSchema } from '@/ai/schemas';

export type GenerateRelationshipLoreInput = z.infer<typeof GenerateRelationshipLoreInputSchema>;

export type GenerateRelationshipLoreOutput = z.infer<typeof GenerateRelationshipLoreOutputSchema>;

export async function generateRelationshipLore(
  input: GenerateRelationshipLoreInput
): Promise<GenerateRelationshipLoreOutput> {
  return generateRelationshipLoreFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRelationshipLorePrompt',
  input: { schema: GenerateRelationshipLoreInputSchema },
  output: { schema: GenerateRelationshipLoreOutputSchema },
  prompt: `You are a master storyteller specializing in character relationships. Your task is to write two distinct lorebook entries that define a relationship between two characters. Each entry must be written from the perspective of one character, describing their history, feelings, and thoughts about the other.

--- CHARACTERS & RELATIONSHIP ---
- Character A: {{{characterA.name}}} (Personality: {{{characterA.personality}}})
- Character B: {{{characterB.name}}} (Personality: {{{characterB.personality}}})
- Their Relationship: "{{{relationship}}}"

--- INSTRUCTIONS ---
1.  **Generate 'loreForCharacterA'**: Write a lorebook entry for Character A. This text should describe their relationship with Character B. It must be written from A's point of view or a narrative perspective that centers on A's knowledge and feelings.
2.  **Generate 'suggestedKeysForA'**: Create an array of keywords that should trigger this lore entry for Character A. This MUST include Character B's name ({{{characterB.name}}}).
3.  **Generate 'loreForCharacterB'**: Write a lorebook entry for Character B. This text should describe their relationship with Character A. It must be written from B's point of view or a narrative perspective that centers on B's knowledge and feelings.
4.  **Generate 'suggestedKeysForB'**: Create an array of keywords that should trigger this lore entry for Character B. This MUST include Character A's name ({{{characterA.name}}}).

The two lore entries should be complementary but reflect the unique perspective of each character.`,
});


const generateRelationshipLoreFlow = ai.defineFlow(
  {
    name: 'generateRelationshipLoreFlow',
    inputSchema: GenerateRelationshipLoreInputSchema,
    outputSchema: GenerateRelationshipLoreOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
