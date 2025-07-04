
'use server';

import type { ChatWithCharacterInput } from '@/ai/flows/chat-with-character';

interface CustomApiActionInput {
    type: 'openai' | 'kobold';
    url: string;
    apiKey?: string;
    payload: ChatWithCharacterInput;
}

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

function constructFullPromptForKobold(payload: ChatWithCharacterInput): string {
    const { character, history, personaName } = payload;
    const c = character.data;
    const persona = personaName || 'User';

    const systemPrompt = `You are an expert roleplayer. You will act as the character defined below.
Never break character. Your responses must be consistent with the character's personality, background, and scenario.
Enclose actions in asterisks, like *smiles* or *looks at you curiously*. Do not write narration for the user.
The user's name is ${persona}. The character's name is ${c.name || 'Character'}.

--- CHARACTER DEFINITION ---
Name: ${c.name || 'N/A'}
Description: ${c.description || 'N/A'}
Personality: ${c.personality || 'N/A'}
Scenario: ${c.scenario || 'N/A'}
Base System Prompt: ${c.system_prompt || 'N/A'}`;

    const dialogueExamples = (c.mes_example || '')
        .replace(/{{char}}/g, c.name || 'Character')
        .replace(/{{user}}/g, persona);
    
    const historyString = history.map(msg => {
        const speaker = msg.role === 'user' ? persona : c.name;
        return `${speaker}: ${msg.content}`;
    }).join('\n');

    // FIX: The history already contains the last user message, so we just need to prompt for the character's response.
    return `${systemPrompt}\n\n--- DIALOGUE EXAMPLES ---\n${dialogueExamples}\n\n--- CHAT HISTORY ---\n${historyString}\n${c.name}:`;
}

async function callOpenAI(url: string, apiKey: string, payload: ChatWithCharacterInput): Promise<ReadableStream<Uint8Array>> {
    const { character, history, personaName } = payload;
    
    const systemPrompt = `You are an expert roleplayer. You will act as the character defined below. Never break character. Your responses must be consistent with the character's personality, background, and scenario. The user's name is ${personaName || 'User'}. The character's name is ${character.data.name || 'Character'}.
        
    --- CHARACTER DEFINITION ---
    Name: ${character.data.name || 'N/A'}
    Description: ${character.data.description || 'N/A'}
    Personality: ${character.data.personality || 'N/A'}
    Scenario: ${character.data.scenario || 'N/A'}
    --- DIALOGUE EXAMPLES ---
    ${(character.data.mes_example || '').replace(/{{char}}/g, character.data.name).replace(/{{user}}/g, personaName || 'User')}
    `;
    
    // FIX: The 'history' payload already contains the last user message.
    const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...history.map(msg => ({ role: (msg.role === 'model' ? 'assistant' : 'user') as 'user' | 'assistant', content: msg.content }))
    ];

    if (messages.length === 1 || (messages.length > 1 && messages[messages.length - 1].role !== 'user')) {
        throw new Error("Conversation history must end with a user message.");
    }

    const body = { model: 'gpt-3.5-turbo', messages, max_tokens: 1000, temperature: 0.7, stream: true };

    const response = await fetch(url || 'https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error from OpenAI-compatible API: ${errorData.error?.message || response.statusText}`);
    }

    const stream = new ReadableStream({
        async start(controller) {
            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
                for (const line of lines) {
                    const data = line.substring(6);
                    if (data.trim() === '[DONE]') continue;
                    try {
                        const json = JSON.parse(data);
                        const text = json.choices[0]?.delta?.content || '';
                        if (text) controller.enqueue(new TextEncoder().encode(text));
                    } catch (e) { /* Ignore parsing errors */ }
                }
            }
            controller.close();
        },
    });

    return stream;
}

async function callKobold(url: string, payload: ChatWithCharacterInput): Promise<ReadableStream<Uint8Array>> {
    let finalApiUrl = url;
    if (!url.includes('/api/v1/generate') && !url.includes('/generate')) {
        finalApiUrl = url.endsWith('/') ? url + 'api/v1/generate' : url + '/api/v1/generate';
    }

    const body = {
        prompt: constructFullPromptForKobold(payload),
        max_length: 1000,
        temperature: 0.7,
        top_p: 0.9,
        rep_pen: 1.1,
        stop_sequence: ["Human:", "User:", "\n\n---"],
        stream: true
    };

    const response = await fetch(finalApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error from KoboldAI API: ${response.status}. Details: ${errorText}`);
    }

    const stream = new ReadableStream({
        async start(controller) {
            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.startsWith('data: '));
                for (const line of lines) {
                    try {
                        const json = JSON.parse(line.substring(5));
                        const text = json.token || '';
                        if (text) controller.enqueue(new TextEncoder().encode(text));
                    } catch (e) { /* Ignore parsing errors */ }
                }
            }
            controller.close();
        },
    });

    return stream;
}


export async function callCustomApiAction(
    actionInput: CustomApiActionInput
): Promise<ReadableStream<Uint8Array>> {
    const { type, url, apiKey, payload } = actionInput;

    if (type === 'openai') {
        if (!apiKey) throw new Error('API Key for OpenAI-compatible endpoint is required.');
        return callOpenAI(url, apiKey, payload);
    } 
    
    if (type === 'kobold') {
        return callKobold(url, payload);
    }

    throw new Error(`Unsupported API type: ${type}`);
}
