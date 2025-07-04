
'use server';

import type { ChatWithCharacterInput } from '@/ai/flows/chat-with-character';
import { getSafetySettingsForNsfw } from '@/ai/ai-safety';

interface GoogleAIActionInput {
    apiKey: string;
    model: string;
    payload: ChatWithCharacterInput;
}

interface GeminiContent {
    role: 'user' | 'model';
    parts: { text: string }[];
}

function constructSystemPrompt(payload: ChatWithCharacterInput): string {
    const { character, personaName, fileContent } = payload;
    const c = character.data;

    const persona = personaName || 'User';

    const processedMesExample = (c.mes_example || '')
        .replace(/{{char}}/g, c.name || 'Character')
        .replace(/{{user}}/g, persona);
    
    let systemPromptText = `You are an expert roleplayer. You will act as the character defined below.
Never break character. Your responses must be consistent with the character's personality, background, and scenario.
Enclose actions in asterisks, like *smiles* or *looks at you curiously*. Do not write narration for the user.
The user's name is ${persona}. The character's name is ${c.name || 'Character'}.

--- CHARACTER DEFINITION ---
Name: ${c.name || 'N/A'}
Description: ${c.description || 'N/A'}
Personality: ${c.personality || 'N/A'}
Scenario: ${c.scenario || 'N/A'}
Base System Prompt: ${c.system_prompt || 'N/A'}`;

    if (fileContent) {
        systemPromptText += `

--- ATTACHED FILE ---
The user has attached a file. You MUST read its content carefully and use it to inform your response.
File Content:
${fileContent}
--- END OF FILE ---
        `;
    }

    systemPromptText += `

--- DIALOGUE EXAMPLES ---
${processedMesExample || 'N/A'}
    `;

    return systemPromptText.trim();
}

export async function callGoogleAiAction(
    actionInput: GoogleAIActionInput
): Promise<ReadableStream<Uint8Array>> {
    const { apiKey, model, payload } = actionInput;
    const { history, character } = payload;

    const systemPrompt = constructSystemPrompt(payload);
    
    const contents: GeminiContent[] = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.content }]
    }));

    if (contents.length === 0 || contents[contents.length - 1].role !== 'user') {
        throw new Error("Conversation history must end with a user message.");
    }

    const safetySettings = getSafetySettingsForNsfw(character.data.extensions.nsfw);

    const requestBody = {
        contents,
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        safetySettings,
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`[Google AI Error] ${errorData.error?.message || response.statusText}`);
    }

    const stream = new ReadableStream({
        async start(controller) {
            if (!response.body) {
                controller.close();
                return;
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const jsonStr = line.substring(6);
                            const parsed = JSON.parse(jsonStr);
                            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                            if (text) {
                                controller.enqueue(new TextEncoder().encode(text));
                            }
                        } catch (e) {
                            // Ignore parsing errors of incomplete JSON
                        }
                    }
                }
            }
            controller.close();
        },
    });

    return stream;
}
