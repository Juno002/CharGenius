
'use server';
/**
 * @fileOverview An AI agent that merges two characters into a new one based on user instructions.
 *
 * - mergeCharacters - A function that handles the character merging.
 * - MergeCharactersInput - The input type for the function.
 * - MergeCharactersOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { FullCharacterOutputSchema } from '@/ai/schemas';

const CharacterMergeInputSchema = z.object({
  characterA: z.any().describe("The first character object."),
  characterB: z.any().describe("The second character object."),
  instruction: z.string().describe("The user's instruction on how to merge the two characters."),
  language: z.string().optional().describe("The language for the generated content, e.g., 'es' for Spanish."),
});
export type MergeCharactersInput = z.infer<typeof CharacterMergeInputSchema>;

// The output is a new, complete character. We can reuse the schema from generate-full-character.
export type MergeCharactersOutput = z.infer<typeof FullCharacterOutputSchema>;

export async function mergeCharacters(
  input: MergeCharactersInput
): Promise<MergeCharactersOutput> {
  return mergeCharactersFlow(input);
}

const prompt = ai.definePrompt({
  name: 'mergeCharactersPrompt',
  input: { schema: z.object({
    charAJson: z.string(),
    charBJson: z.string(),
    instruction: z.string(),
    language: z.string().optional(),
  })},
  output: { schema: FullCharacterOutputSchema }, // Reusing the schema
  prompt: `You are a creative writer specializing in character creation. Your task is to merge two existing characters into a completely new one based on user instructions.

You will receive two character JSON objects and an instruction. You must synthesize a new character that combines elements from both, following the user's guidance.

CRITICAL INSTRUCTIONS:
1. Generate all content in the language specified by this code: {{{language}}}.
2. Do NOT simply copy fields from the source characters. You must create NEW content inspired by them. For example, the 'mes_example' must be an entirely new, creative dialogue that reflects the merged personality, not a copy of an old one.

Generate a complete character card for this new creation, filling all the required fields as if you were creating it from scratch, using the source characters and the instruction as your primary inspiration.

--- USER INSTRUCTION ---
{{{instruction}}}

--- CHARACTER A (Source for inspiration) ---
{{{charAJson}}}

--- CHARACTER B (Source for inspiration) ---
{{{charBJson}}}

--- NEW CHARACTER CARD ---
Generate a NEW and COMPLETE character card. The output must be a valid JSON object matching the requested schema (name, description, personality, scenario, first_mes, mes_example, tags, system_prompt, extensions, etc.).
`,
});

const mergeCharactersFlow = ai.defineFlow(
  {
    name: 'mergeCharactersFlow',
    inputSchema: CharacterMergeInputSchema,
    outputSchema: FullCharacterOutputSchema,
  },
  async ({ characterA, characterB, instruction, language }) => {
    // Omit avatars to save tokens
    const { avatar: avatarA, ...charAData } = characterA;
    const { avatar: avatarB, ...charBData } = characterB;

    const { output } = await prompt({
        charAJson: JSON.stringify(charAData, null, 2),
        charBJson: JSON.stringify(charBData, null, 2),
        instruction,
        language: language || 'es',
    });
    return output!;
  }
);
