
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCharacter } from '@/context/CharacterContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send, Loader2, RefreshCw, Users, Cpu, Bot, BrainCircuit, Lock, Unlock, Paperclip, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import type { LoreEntry, Persona } from '@/context/CharacterContext';
import { summarizeChatSession, type SummarizeChatSessionOutput } from '@/ai/flows/summarize-chat-session';
import { TagInput } from './character/TagInput';
import { Label } from './ui/label';
import { useTranslation } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Input } from './ui/input';
import { callCustomApiAction } from '@/lib/actions/call-custom-api-action';
import { callGoogleAiAction } from '@/lib/actions/call-google-ai-action';

interface Message {
    id: string;
    role: 'user' | 'model';
    content: string;
    tokenCount?: number;
    fileName?: string;
}

export function ChatInterface() {
    const { 
        character, characterHistory, loadCharacter, personas, activePersonaId,
        togglePersonaConnection,
        apiProvider,
        googleApiKey, googleApiModel, hordeApiKey,
        customApiType, customApiUrl, customApiKey,
        isAiDisabled, addLoreEntry
    } = useCharacter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const { toast } = useToast();
    const { t } = useTranslation();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
    const [summaryResult, setSummaryResult] = useState<SummarizeChatSessionOutput | null>(null);
    const [editedSummary, setEditedSummary] = useState('');
    const [editedKeywords, setEditedKeywords] = useState<string[]>([]);
    const [isSummarizing, setIsSummarizing] = useState(false);

    const [attachedFile, setAttachedFile] = useState<File | null>(null);

    const [sessionPersona, setSessionPersona] = useState<Persona | undefined>(undefined);

    useEffect(() => {
        if (personas.length > 0) {
            const connectedPersona = personas.find(p => p.connections?.some(c => c.characterId === character.id));
            const activeGlobalPersona = personas.find(p => p.id === activePersonaId);
            
            const personaToUse = connectedPersona || activeGlobalPersona || personas[0];
            setSessionPersona(personaToUse);
        }
    }, [character.id, personas, activePersonaId]);


    const isValidAvatar = (avatar?: string) => {
        return avatar && (avatar.startsWith('http') || avatar.startsWith('data:image'));
    };

    const initializeChat = useCallback(() => {
        if (character.data.first_mes) {
            setMessages([
                {
                    id: uuidv4(),
                    role: 'model',
                    content: character.data.first_mes
                }
            ]);
        } else {
            setMessages([]);
        }
    }, [character.data.first_mes]);

    useEffect(() => {
        initializeChat();
    }, [character.id, initializeChat]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const handleRestartChat = () => {
        initializeChat();
        toast({ title: t('chatInterface.chatRestartedTitle'), description: t('chatInterface.chatRestartedDesc') });
    }

    const handleSelectAndLoad = (charId: string) => {
        loadCharacter(charId);
        setIsSelectorOpen(false);
        toast({ title: t('chatInterface.loadingChatWith')});
    }

    const handleEndSession = async () => {
        if (messages.length < 2) {
            toast({ title: t('chatInterface.notEnoughToSummarize'), variant: 'destructive' });
            return;
        }

        if (apiProvider !== 'google') {
            toast({ title: "Función no disponible", description: "La summarización de chat actualmente solo funciona con el proveedor de Google AI.", variant: "destructive" });
            return;
        }
        
        if (!googleApiKey) {
            toast({ title: "Clave de API de Google requerida", description: "Por favor, añade tu clave de API en los ajustes para usar esta función.", variant: "destructive" });
            return;
        }
        
        setIsSummarizing(true);
        setSummaryResult(null);
        setIsSummaryDialogOpen(true);

        try {
            const result = await summarizeChatSession({
                history: messages.map(({ id, ...rest }) => rest),
                characterName: character.data.name,
                userName: sessionPersona?.name || 'User',
            });
            setSummaryResult(result);
            setEditedSummary(result.summary);
            setEditedKeywords(result.keywords);
        } catch (error) {
            console.error("Error summarizing session:", error);
            toast({ title: t('chatInterface.summaryError'), variant: 'destructive' });
            setIsSummaryDialogOpen(false); // Close dialog on error
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleSaveSummary = () => {
        if (!editedSummary || editedKeywords.length === 0) {
            toast({ title: t('chatInterface.summaryEmptyError'), variant: 'destructive' });
            return;
        }
        const newLoreEntry: Omit<LoreEntry, 'uid'> = {
            key: editedKeywords,
            content: editedSummary,
            comment: `Memoria del chat del ${new Date().toLocaleDateString()}`,
            disable: false,
            keysecondary: [], constant: false, selective: true, order: 100, position: 0,
            displayIndex: character.lorebook.length, addMemo: true, group: '', groupOverride: false, groupWeight: 100,
            sticky: 0, cooldown: 0, delay: 0, probability: 100, depth: 4, useProbability: true,
            role: null, vectorized: false, excludeRecursion: false, preventRecursion: false,
            delayUntilRecursion: false, scanDepth: null, caseSensitive: null, matchWholeWords: null,
            useGroupScoring: null, automationId: ''
        };
        addLoreEntry(newLoreEntry);
        toast({ title: t('chatInterface.memorySaved'), description: t('chatInterface.memorySavedDesc') });
        setIsSummaryDialogOpen(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 1 * 1024 * 1024) { // 1MB limit for files
                toast({ title: "Archivo demasiado grande", description: "El límite para archivos adjuntos es 1MB.", variant: "destructive"});
                return;
            }
            setAttachedFile(file);
        }
    };

    const processStream = async (stream: ReadableStream, modelMessageId: string) => {
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            fullResponse += decoder.decode(value);
            setMessages(prev =>
                prev.map(m =>
                    m.id === modelMessageId ? { ...m, content: fullResponse } : m
                )
            );
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!inputValue.trim() && !attachedFile) || isLoading || isAiDisabled) return;

        if (apiProvider === 'google' && !googleApiKey) {
            toast({ title: "Clave de API de Google no encontrada", description: "Por favor, añade tu clave en los ajustes para chatear.", variant: "destructive" });
            return;
        }
        if (apiProvider === 'custom' && !customApiUrl) {
            toast({ title: "URL de API Personalizada no encontrada", description: "Por favor, añade la URL en los ajustes para chatear.", variant: "destructive" });
            return;
        }

        let fileContent: string | undefined;
        let fileName: string | undefined;

        if (attachedFile) {
            if (attachedFile.type.startsWith('text/') || attachedFile.name.endsWith('.md')) {
                fileContent = await attachedFile.text();
                fileName = attachedFile.name;
            } else {
                toast({ title: t('chatInterface.unsupportedFileType'), description: t('chatInterface.unsupportedFileTypeDesc'), variant: 'destructive' });
                setAttachedFile(null);
                return;
            }
        }

        const userMessage: Message = { id: uuidv4(), role: 'user', content: inputValue, fileName };
        const currentMessages = [...messages, userMessage];
        setMessages(currentMessages);
        
        const currentInputValue = inputValue;
        setInputValue('');
        setAttachedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setIsLoading(true);

        const modelMessageId = uuidv4();
        setMessages(prev => [...prev, { id: modelMessageId, role: 'model', content: '' }]);
        
        const chatPayload = {
            character,
            history: currentMessages.map(m => ({ role: m.role, content: m.content })),
            userMessage: currentInputValue,
            personaName: sessionPersona?.name || 'User',
            fileContent
        };
        
        try {
            if (apiProvider === 'horde') {
                toast({ title: "AI Horde no soporta streaming", description: "La respuesta aparecerá cuando esté completa.", duration: 4000 });
                const fullPrompt = constructFullPrompt(currentInputValue, sessionPersona?.name || 'User', fileContent);
                const response = await callHordeApiDirectly(fullPrompt);
                setMessages(prev => prev.map(m => m.id === modelMessageId ? { ...m, content: response.characterResponse } : m));
            } else {
                const stream = apiProvider === 'custom'
                    ? await callCustomApiAction({ type: customApiType, url: customApiUrl, apiKey: customApiKey, payload: chatPayload })
                    : await callGoogleAiAction({ apiKey: googleApiKey, model: googleApiModel, payload: chatPayload });
                
                await processStream(stream, modelMessageId);
            }
        } catch (error) {
            console.error("Error chatting with character:", error);
            const errorMessage = error instanceof Error ? error.message : t('chatInterface.chatErrorDesc');
            toast({ title: t('chatInterface.chatErrorTitle'), description: errorMessage, variant: "destructive" });
            setMessages(prev => prev.filter(msg => msg.id !== userMessage.id && msg.id !== modelMessageId));
        } finally {
            setIsLoading(false);
        }
    };
    
    const constructFullPrompt = (userMessage: string, personaName: string, fileContent?: string): string => {
        const c = character.data;
        const processedMesExample = (c.mes_example || '').replace(/{{char}}/g, c.name || 'Character').replace(/{{user}}/g, personaName || 'User');
        
        let systemPromptText = `You are an expert roleplayer. You will act as the character defined below. Never break character. Your responses must be consistent with the character's personality, background, and scenario. Enclose actions in asterisks, like *smiles* or *looks at you curiously*. Do not write narration for the user.
        The user's name is ${personaName || 'User'}. The character's name is ${c.name || 'Character'}.

        --- CHARACTER DEFINITION ---
        Name: ${c.name || 'N/A'}
        Description: ${c.description || 'N/A'}
        Personality: ${c.personality || 'N/A'}
        Scenario: ${c.scenario || 'N/A'}
        Base System Prompt: ${c.system_prompt || 'N/A'}`;

        if (fileContent) {
            systemPromptText += `\n\n--- ATTACHED FILE ---\nThe user has attached a file. You MUST read its content carefully and use it to inform your response.\nFile Content:\n${fileContent}\n--- END OF FILE ---`;
        }

        systemPromptText += `\n\n--- DIALOGUE EXAMPLES ---\n${processedMesExample || 'N/A'}`;

        const historyString = messages.map(msg => {
            const speaker = msg.role === 'user' ? (personaName || 'User') : (c.name || 'Character');
            return `${speaker}: ${msg.content}`;
        }).join('\n');

        return `${systemPromptText.trim()}\n\n***\n\n${historyString}\n${personaName || 'User'}: ${userMessage}\n${c.name || 'Character'}:`;
    };

    const callHordeApiDirectly = async (fullPrompt: string): Promise<{ characterResponse: string }> => {
        const payload = {
            prompt: fullPrompt,
            params: { max_context_length: 4096, max_length: 250, temperature: 0.85, top_p: 0.9, rep_pen: 1.1 },
            models: ["koboldcpp/MythoMax-L2-13B"],
        };

        const res = await fetch(`https://stablehorde.net/api/v2/generate/text/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': hordeApiKey || '0000000000', 'Client-Agent': 'CharGenius:1.0:https://github.com/dionisg/chargenius' },
            body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(`[AI Horde Error] ${errorData.message || res.statusText}`);
        }

        const data = await res.json();
        const characterResponse = data.generations?.[0]?.text?.trim();

        if (!characterResponse) throw new Error('Respuesta inválida desde AI Horde.');
        return { characterResponse };
    };
    
    const formatMessageContent = (content: string) => {
        const parts = content.split(/(\*.*?\*)/g);
        return parts.map((part, index) => {
            if (part.startsWith('*') && part.endsWith('*')) {
                return <em key={index}>{part.slice(1, -1)}</em>;
            }
            return part;
        });
    };
    
    const isPersonaLocked = sessionPersona?.connections?.some(c => c.characterId === character.id);
    const handleToggleLock = () => {
        if (!sessionPersona || !character.id) return;
        togglePersonaConnection(sessionPersona.id, character.id);
        toast({
            title: isPersonaLocked ? t('settings.persona.toast.unlocked') : t('settings.persona.toast.locked'),
            description: isPersonaLocked 
                ? t('settings.persona.toast.unlockedDesc', { persona: sessionPersona.name, character: character.data.name })
                : t('settings.persona.toast.lockedDesc', { persona: sessionPersona.name, character: character.data.name }),
        });
    };

    if (!character || !character.data.name) {
        return (
            <>
                <Card className="h-full flex flex-col items-center justify-center text-center glass-card">
                    <CardHeader>
                        <CardTitle className="font-space-grotesk text-2xl">{t('chatInterface.welcomeTitle')}</CardTitle>
                        <CardDescription>{t('chatInterface.welcomeDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => setIsSelectorOpen(true)}>
                            <Users className="mr-2 h-4 w-4" />
                            {t('chatInterface.selectCharacterButton')}
                        </Button>
                    </CardContent>
                </Card>
                <Dialog open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{t('chatInterface.selectCharacterTitle')}</DialogTitle>
                            <DialogDescription>{t('chatInterface.selectCharacterDescription')}</DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-y-auto space-y-2 p-1">
                            {[...characterHistory].reverse().map(char => (
                                <div key={char.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
                                    <div className="flex items-center gap-3">
                                        <Image src={isValidAvatar(char.avatar) ? char.avatar! : `https://placehold.co/40x40.png`} alt={char.data.name} width={40} height={40} className="rounded-full object-cover border" />
                                        <span className="font-medium">{char.data.name || 'Sin nombre'}</span>
                                    </div>
                                    <Button onClick={() => handleSelectAndLoad(char.id!)} size="sm">{t('chatInterface.chatWithButton')}</Button>
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
            </>
        )
    }

    return (
      <>
        <Card className="h-full flex flex-col glass-card">
            <CardHeader className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
                <div className="flex items-center gap-4">
                    <Image
                        src={isValidAvatar(character.avatar) ? character.avatar! : `https://placehold.co/48x48.png`}
                        alt={character.data.name}
                        width={48}
                        height={48}
                        className="rounded-full object-cover border"
                        data-ai-hint="character face"
                    />
                    <div>
                        <CardTitle className="font-space-grotesk text-xl sm:text-2xl">{character.data.name ? t('chatInterface.chattingWith', {name: character.data.name}) : t('chatInterface.chattingWithDefault')}</CardTitle>
                        <CardDescription>{t('chatInterface.chatDescription')}</CardDescription>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button onClick={handleToggleLock} variant="outline" size="icon" className={cn(isPersonaLocked && "border-primary text-primary")}>
                                {isPersonaLocked ? <Lock /> : <Unlock />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                           <p>{isPersonaLocked ? t('settings.persona.unlockFromChar', { persona: sessionPersona?.name, character: character.data.name }) : t('settings.persona.lockToChar', { persona: sessionPersona?.name, character: character.data.name })}</p>
                        </TooltipContent>
                    </Tooltip>
                    <Button onClick={() => setIsSelectorOpen(true)} variant="outline" size="sm">
                        <Users className="h-4 w-4 mr-2"/> {t('chatInterface.changeCharacterButton')}
                    </Button>
                     <Tooltip>
                        <TooltipTrigger asChild>
                             <div className="relative">
                                <Button onClick={handleEndSession} variant="outline" size="sm" disabled={messages.length < 3 || isAiDisabled || apiProvider !== 'google' || !googleApiKey}>
                                    <BrainCircuit className="h-4 w-4 mr-2"/> {t('chatInterface.summarizeSessionButton')}
                                </Button>
                             </div>
                        </TooltipTrigger>
                        {apiProvider !== 'google' && (
                            <TooltipContent>
                                <p>Esta función requiere el proveedor Google AI.</p>
                            </TooltipContent>
                        )}
                     </Tooltip>
                    <Button onClick={handleRestartChat} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2"/> {t('chatInterface.restartChatButton')}
                    </Button>
                </div>
            </CardHeader>
            <Separator />
            <CardContent className="flex-grow p-0 overflow-hidden">
                <div className="h-full overflow-y-auto p-6 space-y-6">
                    {messages.map((message) => (
                        <div key={message.id} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {message.role === 'model' && (
                                <Image
                                    src={isValidAvatar(character.avatar) ? character.avatar! : `https://placehold.co/40x40.png`}
                                    alt={character.data.name}
                                    width={40}
                                    height={40}
                                    className="rounded-full object-cover border"
                                    data-ai-hint="character face"
                                />
                            )}
                            <div className="max-w-xl">
                                <div className={`rounded-lg p-3 ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                    {message.fileName && (
                                        <div className="mb-2 p-2 border border-primary-foreground/20 rounded-md bg-black/10 flex items-center gap-2 text-sm">
                                            <Paperclip className="h-4 w-4" />
                                            <span>{message.fileName}</span>
                                        </div>
                                    )}
                                    <p className="text-sm whitespace-pre-wrap break-words">{message.id.endsWith('-streaming') && isLoading ? message.content + '...' : formatMessageContent(message.content)}</p>
                                </div>
                            </div>
                             {message.role === 'user' && (
                                sessionPersona?.avatar ? (
                                    <Image
                                        src={sessionPersona.avatar}
                                        alt={sessionPersona.name || "User"}
                                        width={40}
                                        height={40}
                                        className="rounded-full object-cover border"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center font-bold text-secondary-foreground shrink-0">
                                        {sessionPersona?.name ? sessionPersona.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                )
                            )}
                        </div>
                    ))}
                     {isLoading && messages[messages.length-1]?.role !== 'model' && (
                        <div className="flex items-start gap-3 justify-start">
                            <Image
                                src={isValidAvatar(character.avatar) ? character.avatar! : `https://placehold.co/40x40.png`}
                                alt={character.data.name}
                                width={40}
                                height={40}
                                className="rounded-full object-cover border"
                                data-ai-hint="character face"
                            />
                            <div className="max-w-md rounded-lg p-3 bg-muted flex items-center space-x-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </CardContent>
            <Separator />
            <div className="p-4 border-t bg-background">
                {isAiDisabled || (apiProvider === 'google' && !googleApiKey) || (apiProvider === 'custom' && !customApiUrl) ? (
                    <div className="text-center text-muted-foreground p-4 border-2 border-dashed rounded-lg">
                        <Bot className="mx-auto h-6 w-6 mb-2" />
                        <p className="font-semibold">{isAiDisabled ? t('shared.aiDisabledTitle') : 'Configuración de API requerida'}</p>
                        <p className="text-sm">{isAiDisabled ? t('shared.aiDisabledDesc') : 'Por favor, configura tu proveedor de IA en los ajustes para chatear.'}</p>
                    </div>
                ) : (
                    <>
                        {attachedFile && (
                            <div className="mb-2 p-2 border rounded-md flex items-center justify-between text-sm bg-muted/50">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Paperclip className="h-4 w-4 shrink-0" />
                                    <span className="font-medium truncate">{attachedFile.name}</span>
                                    <span className="text-muted-foreground shrink-0">({(attachedFile.size / 1024).toFixed(2)} KB)</span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => { setAttachedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="shrink-0">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                            <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} ref={fileInputRef} />
                            <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                                <Paperclip className="h-4 w-4" />
                                <span className="sr-only">{t('chatInterface.attachFile')}</span>
                            </Button>
                            <Textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder={t('chatInterface.sendMessagePlaceholder')}
                                className="min-h-[40px] max-h-[120px] flex-grow resize-none"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e as any);
                                    }
                                }}
                                disabled={isLoading}
                            />
                            <Button type="submit" disabled={isLoading || (!inputValue.trim() && !attachedFile)} size="icon">
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                <span className="sr-only">{t('chatInterface.sendMessage')}</span>
                            </Button>
                        </form>
                    </>
                )}
            </div>
        </Card>
        <Dialog open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('chatInterface.selectCharacterTitle')}</DialogTitle>
                    <DialogDescription>{t('chatInterface.selectCharacterDescription')}</DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto space-y-2 p-1">
                    {[...characterHistory].reverse().map(char => (
                        <div key={char.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
                            <div className="flex items-center gap-3">
                                <Image src={isValidAvatar(char.avatar) ? char.avatar! : `https://placehold.co/40x40.png`} alt={char.data.name} width={40} height={40} className="rounded-full object-cover border" />
                                <span className="font-medium">{char.data.name || 'Sin nombre'}</span>
                            </div>
                            <Button onClick={() => handleSelectAndLoad(char.id!)} size="sm">{t('chatInterface.chatWithButton')}</Button>
                        </div>
                    ))}
                    {characterHistory.length === 0 && <p className="text-center text-muted-foreground p-4">{t('chatInterface.noCharactersInGallery')}</p>}
                </div>
            </DialogContent>
        </Dialog>

        <Dialog open={isSummaryDialogOpen} onOpenChange={setIsSummaryDialogOpen}>
            <DialogContent className="glass-card sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{t('chatInterface.summaryDialogTitle')}</DialogTitle>
                    <DialogDescription>
                        {t('chatInterface.summaryDialogDesc')}
                    </DialogDescription>
                </DialogHeader>
                {isSummarizing ? (
                    <div className="flex items-center justify-center min-h-[200px]">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p className="ml-4">{t('chatInterface.generatingSummary')}</p>
                    </div>
                ) : summaryResult ? (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1">
                        <div className="space-y-2">
                            <Label htmlFor="summary-content">{t('chatInterface.memoryContentLabel')}</Label>
                            <Textarea
                                id="summary-content"
                                value={editedSummary}
                                onChange={(e) => setEditedSummary(e.target.value)}
                                className="min-h-[150px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="summary-keywords">{t('chatInterface.keywordsLabel')}</Label>
                            <TagInput
                                id="summary-keywords"
                                value={editedKeywords}
                                onChange={setEditedKeywords}
                                placeholder={t('chatInterface.keywordsPlaceholder')}
                            />
                        </div>
                    </div>
                ) : null}
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsSummaryDialogOpen(false)}>{t('chatInterface.discard')}</Button>
                    <Button onClick={handleSaveSummary} disabled={isSummarizing || !summaryResult}>{t('chatInterface.saveToLorebook')}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </>
    );
}
