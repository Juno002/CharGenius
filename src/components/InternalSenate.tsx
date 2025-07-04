
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { senateArchetypes, type SenateArchetype } from '@/lib/senate-archetypes';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Landmark, Wand2, Loader2, Save, Send, Redo } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useCharacter } from '@/context/CharacterContext';
import { useToast } from '@/hooks/use-toast';
import { generateSenateDialogue, type SenateMessage } from '@/ai/flows/generate-senate-dialogue';

const ArchetypeCard = ({ archetype, isSelected, onSelect }: { archetype: SenateArchetype, isSelected: boolean, onSelect: () => void }) => (
    <Card 
        onClick={onSelect}
        className={`cursor-pointer transition-all ${isSelected ? 'border-primary ring-2 ring-primary' : 'hover:border-primary/50'}`}
    >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{archetype.name}</CardTitle>
            <Checkbox checked={isSelected} tabIndex={-1} className="cursor-pointer" />
        </CardHeader>
        <CardContent>
            <p className="text-xs text-muted-foreground">{archetype.role}</p>
        </CardContent>
    </Card>
);

export function InternalSenate() {
    const { t } = useTranslation();
    const [selectedArchetypes, setSelectedArchetypes] = useState<SenateArchetype[]>([]);
    const [objective, setObjective] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSessionStarted, setIsSessionStarted] = useState(false);
    const [history, setHistory] = useState<SenateMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    
    const { isAiDisabled, apiProvider, googleApiKey, googleApiModel, language: generationLanguage, saveSenateSession } = useCharacter();
    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleToggleArchetype = (archetype: SenateArchetype) => {
        if (isSessionStarted) return;
        setSelectedArchetypes(prev => 
            prev.some(a => a.id === archetype.id)
                ? prev.filter(a => a.id !== archetype.id)
                : [...prev, archetype]
        );
    };

    const runAiTurn = async (currentInput: string, currentHistory: SenateMessage[]) => {
         if (isAiDisabled) {
            toast({ title: t('shared.aiDisabledTitle'), description: t('shared.aiDisabledDesc'), variant: 'destructive' });
            return null;
        }
        if (apiProvider !== 'google' || !googleApiKey) {
            toast({ title: 'API de Google Requerida', description: 'El Senado Interno requiere un modelo avanzado como Gemini para funcionar correctamente. Por favor, configura tu API Key de Google en los ajustes.', variant: 'destructive' });
            return null;
        }

        setIsLoading(true);

        try {
            const modelResponse = await generateSenateDialogue({
                archetypes: selectedArchetypes,
                history: currentHistory,
                userInput: currentInput,
                language: generationLanguage,
                apiKey: googleApiKey,
                apiModel: googleApiModel,
            });
            return modelResponse;
        } catch (error) {
            console.error("Error generating senate response:", error);
            toast({ title: t('senate.error'), description: (error as Error).message, variant: 'destructive' });
            return null;
        } finally {
            setIsLoading(false);
        }
    }

    const handleStartSession = async () => {
        if (selectedArchetypes.length < 2 || !objective) {
            toast({ title: t('senate.selectionNeeded'), variant: 'destructive' });
            return;
        }
        
        setHistory([]);
        const modelResponse = await runAiTurn(objective, []);
        
        if (modelResponse) {
            setHistory([modelResponse]);
            setIsSessionStarted(true);
            toast({ title: t('senate.convened') });
        }
    };

    const handleSendMessage = async () => {
        if (!userInput.trim() || isLoading) return;

        const currentInput = userInput;
        setUserInput('');
        
        const modelResponse = await runAiTurn(currentInput, history);
        
        if (modelResponse) {
            setHistory(prev => [...prev, modelResponse]);
        }
    };
    
    const handleSaveSession = () => {
        if (history.length === 0) {
            toast({ title: t('senate.saveError.noMessages'), variant: 'destructive' });
            return;
        }

        const dialogue = history.map(msg => `${msg.char}: ${msg.msg}`).join('\n\n');

        saveSenateSession({
            objective,
            dialogue,
            archetypes: selectedArchetypes.map(({ id, name }) => ({ id, name })),
        });
        toast({ title: t('senate.saveSuccess.title') });
    };

    const resetSession = () => {
        setIsSessionStarted(false);
        setHistory([]);
        setObjective('');
        setSelectedArchetypes([]);
    };


    return (
         <div className="space-y-6">
            <Card className="glass-card">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Landmark className="h-6 w-6 text-primary" />
                        <div>
                            <CardTitle className="font-space-grotesk text-2xl">
                                {t('tools.toolSenateTitle')}
                            </CardTitle>
                            <CardDescription>
                                {t('tools.toolSenateDesc')}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                {!isSessionStarted && <CardFooter><Button onClick={handleStartSession} disabled={isLoading || isSessionStarted || selectedArchetypes.length < 2 || !objective} className="w-full">
                    {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
                    {t('senate.conveneButton')}
                </Button></CardFooter>}
            </Card>
            
            <AnimatePresence>
            {!isSessionStarted ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                    <Card className="glass-card">
                        <CardHeader><CardTitle>1. {t('senate.selectParticipants')}</CardTitle><CardDescription>{t('senate.selectParticipantsDesc')}</CardDescription></CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {senateArchetypes.map(archetype => (
                                <ArchetypeCard 
                                    key={archetype.id} 
                                    archetype={archetype} 
                                    isSelected={selectedArchetypes.some(a => a.id === archetype.id)}
                                    onSelect={() => handleToggleArchetype(archetype)}
                                />
                            ))}
                        </CardContent>
                    </Card>
                    
                    <Card className="glass-card">
                        <CardHeader><CardTitle>2. {t('senate.defineTopic')}</CardTitle><CardDescription>{t('senate.defineTopicDesc')}</CardDescription></CardHeader>
                        <CardContent>
                            <Textarea placeholder={t('senate.topicPlaceholder')} value={objective} onChange={(e) => setObjective(e.target.value)} className="min-h-[120px]"/>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>{t('senate.sessionTitle')}</CardTitle>
                            <CardDescription>{t('senate.sessionDescription')} "{objective}"</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                            {history.map((msg, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0"><Landmark className="text-primary"/></div>
                                    <div className="flex-1 pt-1">
                                        <p className="font-bold text-foreground">
                                            {msg.char} <span className="text-xs font-normal text-muted-foreground ml-2 italic">({msg.emotion})</span>
                                        </p>
                                        <p className="text-foreground/90 mt-1 whitespace-pre-wrap break-words">{msg.msg}</p>
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-center justify-center p-4">
                                    <Loader2 className="animate-spin h-6 w-6 text-primary" />
                                    <p className="ml-3 text-muted-foreground">{t('senate.convening')}</p>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </CardContent>
                        <CardFooter className="pt-4 border-t flex-col sm:flex-row gap-2">
                             <div className="flex w-full items-center gap-2">
                                <Textarea 
                                    placeholder="Tu respuesta o siguiente pregunta..."
                                    value={userInput}
                                    onChange={e => setUserInput(e.target.value)}
                                    onKeyDown={e => {if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                                    disabled={isLoading}
                                    className="min-h-0 h-10 max-h-24 resize-none"
                                />
                                <Button onClick={handleSendMessage} disabled={isLoading || !userInput} size="icon"><Send /></Button>
                             </div>
                             <div className="flex w-full sm:w-auto items-center gap-2">
                                <Button onClick={handleSaveSession} disabled={history.length === 0} variant="outline" className="w-full sm:w-auto"><Save className="mr-2 h-4 w-4"/>{t('senate.saveSession')}</Button>
                                <Button onClick={resetSession} variant="secondary" className="w-full sm:w-auto"><Redo className="mr-2 h-4 w-4"/>{t('senate.newSession')}</Button>
                            </div>
                        </CardFooter>
                    </Card>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
}
