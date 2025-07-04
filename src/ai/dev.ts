import { config } from 'dotenv';
config();

// This file is used to register Genkit flows for local development and debugging.
// Note: Many flows have been migrated to direct API calls in the client.
// Only flows that are still actively used by components should be imported here.

import '@/ai/flows/chat-with-character.ts';
import '@/ai/flows/merge-characters.ts';
import '@/ai/flows/summarize-chat-session.ts';
import '@/ai/flows/generate-senate-dialogue.ts';
import '@/ai/flows/generate-relationship-lore.ts';
import '@/ai/flows/summarize-text.ts';
