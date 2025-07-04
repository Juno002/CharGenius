import {z} from 'zod';

// =================================================================
// CORE CHARACTER SCHEMA
// This is the single source of truth for the character's data structure.
// =================================================================
export const CharacterDataSchema = z.object({
  name: z.string().describe('The name of the character.'),
  description: z.string().describe("A detailed physical and background description of the character."),
  personality: z.string().describe("The character's personality traits, motivations, and fears."),
  scenario: z.string().describe("The initial setting or scenario where the character is found."),
  first_mes: z.string().describe("The character's first message to the user, including actions in asterisks."),
  mes_example: z.string().describe("A string containing 2-3 dialogue examples, each starting with <START>\\n and using {{user}} and {{char}}."),
  creator_notes: z.string().optional().describe("Notes from the creator, not visible to the AI."),
  system_prompt: z.string().describe("A concise system prompt with core instructions for the AI on how to play this character. E.g., 'You are a grumpy dwarf who distrusts magic.' Can be empty."),
  post_history_instructions: z.string().optional().describe("Instructions applied after the chat history."),
  alternate_greetings: z.array(z.string()).describe("An array of 1-2 alternate greetings for the character."),
  tags: z.array(z.string()).describe("An array of 3-5 tags that describe the character."),
  creator: z.string().optional().describe("The creator's name. Can be left empty."),
  character_version: z.string().optional().describe("The version of the character, e.g., '1.0'."),
  
  extensions: z.object({
    world: z.string().describe("Key information about the world or lore relevant to this character. E.g., 'The city of Silvercrest is famous for its magical floating towers.' Can be empty."),
    fav: z.boolean().default(false),
    talkativeness: z.number().min(0).max(1).default(0.5),
    nsfw: z.boolean().default(false),
    depth_prompt: z.object({
        prompt: z.string().describe("Prompt for the depth feature."),
        depth: z.number().int().min(1).max(10).describe("Depth of the prompt, from 1 to 10."),
        role: z.string().describe("Role for the depth prompt, e.g., 'system' or 'user'."),
    }).optional().describe("Parameters for prompt depth."),
    group_only_greetings: z.array(z.string()).optional(),
  })
});

export const GeneratedLorebookEntrySchema = z.object({
  key: z.array(z.string()).describe("An array of 1-3 trigger keywords for this lore entry."),
  comment: z.string().describe("A brief summary or title for the lore entry."),
  content: z.string().describe("The detailed text content of the lore entry."),
});

// The output for full character generation can include the base data plus an optional lorebook.
export const FullCharacterOutputSchema = CharacterDataSchema.extend({
  lorebook: z.array(GeneratedLorebookEntrySchema).optional().describe("An array of lorebook entries, if requested."),
});

// =================================================================
// CHAT SCHEMAS
// =================================================================
export const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

// =================================================================
// AUTOFILL SCHEMAS
// =================================================================
export const AutofillCharacterFieldsInputSchema = z.object({
  name: z.string().describe("The character's name."),
  description: z.string().describe("A detailed description of the character's appearance and background."),
});

export const AutofillCharacterFieldsOutputSchema = z.object({
  personality: z.string().describe("The character's core personality traits, motivations, and fears."),
  scenario: z.string().describe("A brief but immersive initial scenario where the character is found."),
  first_mes: z.string().describe("The character's engaging first message to the user, including actions in asterisks."),
});


// =================================================================
// RELATIONSHIP SCHEMAS
// =================================================================
const CharacterInfoSchemaForRelationship = z.object({
    name: z.string(),
    personality: z.string(),
});

export const GenerateRelationshipLoreInputSchema = z.object({
  characterA: CharacterInfoSchemaForRelationship.describe("Information about the first character."),
  characterB: CharacterInfoSchemaForRelationship.describe("Information about the second character."),
  relationship: z.string().describe("A description of the relationship between the two characters (e.g., 'Childhood friends turned bitter rivals')."),
});

export const GenerateRelationshipLoreOutputSchema = z.object({
  loreForCharacterA: z.string().describe("The lorebook entry content for Character A, describing their relationship with Character B from their perspective."),
  suggestedKeysForA: z.array(z.string()).describe(`An array of suggested keywords to trigger this lore entry for Character A.`),
  loreForCharacterB: z.string().describe("The lorebook entry content for Character B, describing their relationship with Character A from their perspective."),
  suggestedKeysForB: z.array(z.string()).describe(`An array of suggested keywords to trigger this lore entry for Character B.`),
});

// =================================================================
// SUMMARY SCHEMAS
// =================================================================
export const SummarizeChatSessionInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe("The full conversation history to be summarized."),
  characterName: z.string().describe("The name of the character involved in the chat."),
  userName: z.string().describe("The name of the user involved in thechat."),
});

export const SummarizeChatSessionOutputSchema = z.object({
  summary: z.string().describe("A concise summary of the key events, decisions, and emotional shifts from the chat session, written in the third person. This will become the content of a lorebook entry."),
  keywords: z.array(z.string()).length(3).describe("An array of 3 relevant keywords that would trigger this memory in a future conversation. Should include names of people or places mentioned."),
});

// =================================================================
// SENATE SCHEMAS
// =================================================================
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
});

// Output is just one message
export const GenerateSenateDialogueOutputSchema = SenateMessageSchema;

// =================================================================
// GROUP CHAT SCHEMAS
// =================================================================
export const GroupChatCharacterInfoSchema = z.object({
  name: z.string(),
  description: z.string(),
  personality: z.string(),
  nsfw: z.boolean().optional(),
});

export const GenerateGroupResponseInputSchema = z.object({
  characters: z.array(GroupChatCharacterInfoSchema).describe("An array of character objects participating in the scene."),
  history: z.array(ChatMessageSchema).describe("The conversation history so far, where 'model' role represents responses from the characters and 'user' represents the user's messages."),
  lastMessage: z.string().optional().describe("The last message in the conversation, which could be from the user or another character."),
  activationStrategy: z.enum(['natural', 'round_robin', 'random']).default('natural').describe("The strategy to determine who speaks next."),
  disabledMembers: z.array(z.string()).optional().describe("An array of names of characters who are currently muted or inactive."),
  language: z.string().optional().describe("The language for the generated content, e.g., 'es' for Spanish."),
});

export const GenerateGroupResponseOutputSchema = z.object({
  response: z.string().describe("The generated response from one or more characters, formatted as 'CharacterName: Their message...'."),
});
