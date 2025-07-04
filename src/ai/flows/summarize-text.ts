'use server';
/**
 * @fileOverview An AI agent that summarizes text to reduce token count while preserving meaning.
 *
 * - summarizeText - A function that handles the text summarization.
 * - SummarizeTextInput - The input type for the function.
 * - SummarizeTextOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeTextInputSchema = z.object({
  textToSummarize: z.string().describe("The text content to be summarized."),
  fieldName: z.string().optional().describe("The name of the field being summarized, e.g., 'Description', 'Personality'. This provides context."),
});
export type SummarizeTextInput = z.infer<typeof SummarizeTextInputSchema>;

const SummarizeTextOutputSchema = z.object({
  summarizedText: z.string().describe("The concise, summarized version of the input text."),
});
export type SummarizeTextOutput = z.infer<typeof SummarizeTextOutputSchema>;

export async function summarizeText(
  input: SummarizeTextInput
): Promise<SummarizeTextOutput> {
  return summarizeTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTextPrompt',
  input: {schema: SummarizeTextInputSchema},
  output: {schema: SummarizeTextOutputSchema},
  prompt: `You are an expert editor for role-playing character sheets. Your task is to summarize the provided text to reduce its length and token count, while preserving the core meaning, style, and critical details.

  The user wants to make their character sheet more concise.
  {{#if fieldName}}
  This text is for the '{{fieldName}}' section of the character sheet. Keep this context in mind.
  {{/if}}
  
  Summarize the following text:
  ---
  {{{textToSummarize}}}
  ---
  `,
});

const summarizeTextFlow = ai.defineFlow(
  {
    name: 'summarizeTextFlow',
    inputSchema: SummarizeTextInputSchema,
    outputSchema: SummarizeTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
