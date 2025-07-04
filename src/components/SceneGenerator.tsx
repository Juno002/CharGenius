
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCharacter, type Character } from '@/context/CharacterContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { Loader2, Users, Wand2, Play, Pause, Redo, Save, Send, Bot, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateGroupResponse, type GenerateGroupResponseOutput } from '@/ai/flows/generate-group-response';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Separator } from './ui/separator';

const promptTemplates = [
    { title: "Encuentro en una taberna", prompt: "Los personajes se encuentran por primera vez en una taberna ruidosa y con poca luz. Uno de ellos tiene un objeto que el otro necesita." },
    { title: "Descubrimiento misterioso", prompt: "Mientras viajan juntos, los personajes descubren unas ruinas antiguas que no aparecen en ningún mapa. Deciden explorar." },
    { title: "Negociación tensa", prompt: "Los personajes, en bandos opuestos, se reúnen para negociar una tregua. La desconfianza es alta." },
];

const MAX_TURNS = 50; // Safety limit for auto-play

export function SceneGenerator() {
    const { characterHistory, googleApiKey, isAiDisabled, language, saveScene, personas, activePersonaId } = useCharacter();
    const [selectedCharacters, setSelectedCharacters] = useState<Character[]>([]);
    const [disabledMembers, setDisabledMembers] = useState<string[]>([]);
    const [scenePrompt, setScenePrompt] = useState('');
    const [tone, setTone] = useState('default');
    const [history, setHistory] = useState<{ role: 'user' | 'model', content: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSceneStarted, setIsSceneStarted] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [turnCount, setTurnCount] = useState(0);
    const [speed, setSpeed] = useState(3000); // ms delay
    const { toast } = useToast();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const activePersona = personas.find(p => p.id === activePersonaId);

    const isValidAvatar = (avatar?: string) => {
        return avatar && (avatar.startsWith('http') || avatar.startsWith('data:image'));
    };
    
    const handleCharacterSelect = (character: Character, isSelected: boolean | 'indeterminate') => {
        if (isSelected) {
            setSelectedCharacters(prev => [...prev, character]);
        } else {
            setSelectedCharacters(prev => prev.filter(c => c.id !== character.id));
        }
    };
    
    const runAiTurn = useCallback(async (isFirstTurn = false) => {
        if (isAiDisabled || !googleApiKey) {
            toast({ title: "API Key de Google requerida", description: "Por favor, añade tu clave de API en los ajustes para usar esta función.", variant: "destructive" });
            setIsPlaying(false);
            return;
        }
        
        const activeCharacters = selectedCharacters.filter(c => !disabledMembers.includes(c.data.name));
        if (activeCharacters.length < 1 && !isFirstTurn) {
             toast({ title: 'No hay personajes activos para continuar.', variant: 'destructive' });
             setIsPlaying(false);
             return;
        }

        setIsLoading(true);
        try {
            // This tool is complex and has not been migrated to direct API calls yet.
            // It will be disabled until it's refactored in a future phase.
            toast({
                title: "Función Desactivada Temporalmente",
                description: "El Generador de Escenas está siendo migrado al nuevo sistema de API.",
                variant: "destructive",
                duration: 6000
            });
            setIsLoading(false);
            setIsPlaying(false);
            return;

            /*
            const characterInfo = selectedCharacters.map(c => ({
                name: c.data.name,
                description: c.data.description,
                personality: c.data.personality,
                nsfw: c.data.extensions.nsfw,
            }));
            
            const lastMessage = isFirstTurn ? `User: ${scenePrompt}` : history[history.length - 1].content;

            const result = await generateGroupResponse({ 
                characters: characterInfo, 
                history: history,
                lastMessage: lastMessage,
                activationStrategy: 'natural',
                disabledMembers,
                language,
            });

            if (result.response) {
                setHistory(prev => [...prev, { role: 'model', content: result.response }]);
                if (!isFirstTurn) setTurnCount(prev => prev + 1);
            }
            */
        } catch (error) {
            console.error(error);
            toast({ title: 'Error al generar la escena.', variant: 'destructive', description: (error as Error).message });
            setIsPlaying(false);
        } finally {
            setIsLoading(false);
        }
    }, [isAiDisabled, googleApiKey, selectedCharacters, disabledMembers, scenePrompt, history, language, toast]);


    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);
    
    useEffect(() => {
        if (isPlaying && !isLoading && turnCount < MAX_TURNS) {
            const timer = setTimeout(() => {
                runAiTurn();
            }, speed);
            return () => clearTimeout(timer);
        } else if (turnCount >= MAX_TURNS) {
            setIsPlaying(false);
            toast({ title: "Límite de turnos alcanzado", description: `La escena se ha pausado automáticamente tras ${MAX_TURNS} turnos.`});
        }
    }, [isPlaying, isLoading, history, runAiTurn, speed, turnCount]);
    
    const handleStartScene = () => {
        if (selectedCharacters.length < 2) {
             toast({ title: 'Selecciona al menos dos personajes.', variant: 'destructive' });
             return;
        }
        if (!scenePrompt.trim()) {
            toast({ title: 'Por favor, escribe un prompt para la escena.', variant: 'destructive' });
            return;
        }
        setIsSceneStarted(true);
        setHistory([]);
        setTurnCount(0);
        runAiTurn(true);
    };

    const handleSendUserMessage = () => {
        if (!userInput.trim()) return;
        setHistory(prev => [...prev, { role: 'user', content: `User: ${userInput}` }]);
        setUserInput('');
        // Immediately trigger AI response after user message
        const timer = setTimeout(() => runAiTurn(), 500);
        return () => clearTimeout(timer);
    };

    const handleSaveScene = () => {
        if (history.length === 0) {
            toast({ title: 'No hay nada que guardar', variant: 'destructive' });
            return;
        }
        saveScene({
            prompt: scenePrompt,
            dialogue: history.map(h => h.content).join('\n\n'),
            characters: selectedCharacters.map(c => ({ id: c.id!, name: c.data.name, avatar: c.avatar || '' })),
            disabledMembers: disabledMembers,
            activationStrategy: 'natural', // Hardcoded for now
        });
        toast({ title: '¡Escena Guardada!', description: 'Puedes verla en la galería de escenas guardadas.' });
    };

    const handleReset = () => {
        setIsSceneStarted(false);
        setHistory([]);
        setTurnCount(0);
        setIsPlaying(false);
        setSelectedCharacters([]);
        setScenePrompt('');
    };

    return (
        <div className="space-y-6">
            <Card className="glass-card">
                 <CardHeader>
                    <div className="flex items-center gap-3">
                         <Users className="h-6 w-6 text-primary" />
                         <div>
                            <CardTitle className="font-space-grotesk text-2xl">Generador de Escenas</CardTitle>
                            <CardDescription>Crea diálogos dinámicos entre tus personajes. ¡Dale al play y mira cómo interactúan solos!</CardDescription>
                         </div>
                    </div>
                 </CardHeader>
            </Card>

            {!isSceneStarted ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1 glass-card">
                         <CardHeader><CardTitle className="text-xl">1. Selecciona Personajes</CardTitle></CardHeader>
                         <CardContent className="max-h-[50vh] overflow-y-auto space-y-3">
                            {characterHistory.length > 0 ? (
                                [...characterHistory].reverse().map(char => (
                                    <div key={char.id} className="flex items-center space-x-3 bg-muted/50 p-2 rounded-md">
                                        <Checkbox id={`char-${char.id}`} onCheckedChange={(checked) => handleCharacterSelect(char, checked)} className="h-5 w-5"/>
                                        <Image src={isValidAvatar(char.avatar) ? char.avatar! : `https://placehold.co/40x40.png`} alt={char.data.name} width={40} height={40} className="rounded-full object-cover border"/>
                                        <Label htmlFor={`char-${char.id}`} className="font-medium cursor-pointer flex-1">{char.data.name || 'Sin nombre'}</Label>
                                    </div>
                                ))
                            ) : <p className="text-sm text-muted-foreground text-center py-4">No hay personajes en tu historial.</p>}
                         </CardContent>
                    </Card>
                    <Card className="lg:col-span-2 glass-card">
                        <CardHeader><CardTitle className="text-xl">2. Describe la Escena Inicial</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label>Plantillas rápidas</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {promptTemplates.map(template => (
                                        <Button key={template.title} variant="outline" size="sm" onClick={() => setScenePrompt(template.prompt)}>{template.title}</Button>
                                    ))}
                                </div>
                            </div>
                            <Textarea placeholder="Ej: Los personajes se encuentran en una taberna y discuten sobre un mapa misterioso..." value={scenePrompt} onChange={(e) => setScenePrompt(e.target.value)} className="min-h-[150px]"/>
                            <Button onClick={handleStartScene} disabled={selectedCharacters.length < 2 || !scenePrompt} className="w-full">
                                <Wand2 className="mr-2 h-4 w-4"/> Empezar Escena
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="font-space-grotesk">"{scenePrompt}"</CardTitle>
                        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                             <div className="flex items-center gap-2">
                                <Button onClick={() => setIsPlaying(!isPlaying)} size="sm" disabled={isLoading}>
                                    {isPlaying ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
                                    {isPlaying ? 'Pausar' : 'Continuar'}
                                </Button>
                                <div className="flex items-center gap-2 w-48">
                                    <Label className="text-sm whitespace-nowrap">Velocidad</Label>
                                    <Slider min={500} max={10000} step={500} value={[speed]} onValueChange={(val) => setSpeed(val[0])} disabled={isPlaying}/>
                                </div>
                             </div>
                             <div className="flex items-center gap-2">
                                 <Button onClick={handleSaveScene} variant="outline" size="sm"><Save className="mr-2"/>Guardar</Button>
                                 <Button onClick={handleReset} variant="secondary" size="sm"><Redo className="mr-2"/>Nueva Escena</Button>
                             </div>
                        </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-4">
                        <div className="h-[50vh] overflow-y-auto space-y-4 pr-4">
                            {history.map((msg, index) => (
                                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                    {msg.role === 'model' && (
                                        <Image src={isValidAvatar(selectedCharacters.find(c => msg.content.startsWith(c.data.name))?.avatar) ? selectedCharacters.find(c => msg.content.startsWith(c.data.name))?.avatar! : `https://placehold.co/40x40.png`} alt="avatar" width={40} height={40} className="rounded-full object-cover border"/>
                                    )}
                                    <div className={`p-3 rounded-lg max-w-xl text-sm whitespace-pre-wrap ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                        <p dangerouslySetInnerHTML={{ __html: msg.content.replace(/(\*.*?\*)/g, '<em>$1</em>').replace(/\*/g, '') }} />
                                    </div>
                                    {msg.role === 'user' && (
                                        activePersona?.avatar ? 
                                        <Image src={activePersona.avatar} alt="user" width={40} height={40} className="rounded-full object-cover border"/>
                                        : <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0"><User/></div>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-center justify-center p-4">
                                    <Bot className="h-6 w-6 animate-pulse text-primary"/>
                                    <p className="ml-3 text-muted-foreground">La IA está pensando su próximo movimiento...</p>
                                </div>
                            )}
                             <div ref={messagesEndRef} />
                        </div>
                         <Separator className="my-4"/>
                         <div className="flex items-center gap-2">
                            <Textarea placeholder="Intervenir como 'User'..." value={userInput} onChange={e => setUserInput(e.target.value)} disabled={isPlaying || isLoading} className="h-10 resize-none"/>
                            <Button onClick={handleSendUserMessage} disabled={isPlaying || isLoading || !userInput}><Send/></Button>
                         </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
