
"use client";

import React, { useState, useMemo } from 'react';
import { useCharacter, type Character } from '@/context/CharacterContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combine, Wand2, Loader2, User, Users, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mergeCharacters, type MergeCharactersOutput } from '@/ai/flows/merge-characters';
import { StaticCharacterCard } from './character/StaticCharacterCard';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';

const CharacterSelector = ({ characters, selectedId, onSelect, otherSelectedId, placeholder }: { characters: Character[], selectedId?: string, onSelect: (id: string) => void, otherSelectedId?: string, placeholder: string }) => (
    <Select value={selectedId} onValueChange={onSelect}>
        <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
            {characters.map(char => (
                <SelectItem key={char.id} value={char.id!} disabled={char.id === otherSelectedId}>
                    {char.data.name || 'Sin nombre'}
                </SelectItem>
            ))}
        </SelectContent>
    </Select>
);

export function CharacterMerger() {
    const { characterHistory, importCharacter, apiProvider, isAiDisabled, language } = useCharacter();
    const [charAId, setCharAId] = useState<string | undefined>();
    const [charBId, setCharBId] = useState<string | undefined>();
    const [instruction, setInstruction] = useState('');
    const [mergedResult, setMergedResult] = useState<MergeCharactersOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const charA = useMemo(() => characterHistory.find(c => c.id === charAId), [charAId, characterHistory]);
    const charB = useMemo(() => characterHistory.find(c => c.id === charBId), [charBId, characterHistory]);

    const handleGenerate = async () => {
        if (!charA || !charB) {
            toast({ title: 'Por favor, selecciona dos personajes.', variant: 'destructive' });
            return;
        }
        if (!instruction.trim()) {
            toast({ title: 'Por favor, describe cómo fusionarlos.', variant: 'destructive' });
            return;
        }

        if (isAiDisabled) {
            toast({ title: "Funciones de IA desactivadas.", description: "Activa la IA en los ajustes para usar esta función.", variant: "destructive" });
            return;
        }

        if (apiProvider !== 'integrated') {
            toast({
                title: "Usando IA Integrada",
                description: "Esta herramienta usará la IA integrada de la aplicación, no tu proveedor personalizado.",
            });
        }
        
        setIsLoading(true);
        setMergedResult(null);

        try {
            const result = await mergeCharacters({
                characterA: charA,
                characterB: charB,
                instruction,
                language,
            });
            setMergedResult(result);
            toast({ title: '¡Fusión completada!', description: 'Revisa el personaje resultante y guárdalo si te gusta.' });
        } catch (error) {
            console.error('Error merging characters:', error);
            toast({ title: 'Error al fusionar los personajes', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSave = () => {
        if (!mergedResult) {
            toast({ title: 'No hay nada que guardar.', variant: 'destructive' });
            return;
        }
        importCharacter(mergedResult as any); 
        toast({ title: '¡Personaje guardado y cargado!', description: 'El nuevo personaje está listo para editar o chatear.' });
        router.push('/edit');
    };

    const resultAsCharacter = useMemo((): Character | null => {
        if (!mergedResult) return null;
        return {
            id: 'preview',
            spec: 'chara_card_v2',
            spec_version: '2.0',
            data: {
                name: mergedResult.name,
                description: mergedResult.description,
                personality: mergedResult.personality,
                scenario: mergedResult.scenario,
                first_mes: mergedResult.first_mes,
                mes_example: mergedResult.mes_example,
                tags: mergedResult.tags,
                creator_notes: mergedResult.creator_notes || '',
                system_prompt: mergedResult.system_prompt,
                post_history_instructions: mergedResult.post_history_instructions || '',
                alternate_greetings: mergedResult.alternate_greetings || [],
                creator: '',
                character_version: '1.0',
                create_date: new Date().toISOString(),
                modification_date: new Date().toISOString(),
                extensions: {
                    world: mergedResult.extensions.world || '',
                    depth_prompt: mergedResult.extensions.depth_prompt || { depth: 4, prompt: '', role: 'system' },
                    fav: false,
                    talkativeness: 0.5,
                    nsfw: false,
                    group_only_greetings: [],
                },
            },
            lorebook: [],
            completionScore: 100
        };
    }, [mergedResult]);

    return (
        <div className="space-y-6">
            <Card className="glass-card">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Combine className="h-6 w-6 text-primary" />
                        <div>
                            <CardTitle className="font-space-grotesk text-2xl">Fusor de Personajes</CardTitle>
                            <CardDescription>
                                Combina dos de tus personajes existentes para crear uno totalmente nuevo.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="charA-select" className="flex items-center gap-2"><User /> Personaje A</Label>
                            <CharacterSelector 
                                characters={characterHistory} 
                                selectedId={charAId}
                                onSelect={setCharAId}
                                otherSelectedId={charBId}
                                placeholder="Seleccionar Personaje A"
                            />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="charB-select" className="flex items-center gap-2"><Users /> Personaje B</Label>
                            <CharacterSelector 
                                characters={characterHistory} 
                                selectedId={charBId}
                                onSelect={setCharBId}
                                otherSelectedId={charAId}
                                placeholder="Seleccionar Personaje B"
                            />
                        </div>
                    </div>

                    <AnimatePresence>
                    {(charA || charB) && (
                         <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.5, ease: 'easeInOut' }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden"
                         >
                            <StaticCharacterCard title="Personaje A" character={charA} />
                            <StaticCharacterCard title="Personaje B" character={charB} />
                        </motion.div>
                    )}
                    </AnimatePresence>
                   
                    <div className="space-y-2">
                        <Label htmlFor="relationship-prompt">Describe cómo fusionarlos</Label>
                        <Textarea 
                            id="relationship-prompt"
                            placeholder="Ej: Toma la apariencia del Personaje A y la personalidad cínica del Personaje B. Su nuevo objetivo es..."
                            className="min-h-[120px]"
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleGenerate} disabled={isLoading || !charAId || !charBId || !instruction} className="w-full">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                        Fusionar Personajes
                    </Button>
                </CardContent>
            </Card>

            <AnimatePresence>
            {isLoading && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Card className="glass-card text-center p-8">
                        <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                        <p className="mt-4 text-muted-foreground">La IA está fusionando las esencias de tus personajes...</p>
                    </Card>
                 </motion.div>
            )}

            {mergedResult && resultAsCharacter && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Personaje Fusionado</CardTitle>
                            <CardDescription>Revisa el nuevo personaje. Si te gusta, guárdalo para añadirlo a tu galería.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center p-4">
                           <div className="w-full max-w-sm">
                             <StaticCharacterCard title="Resultado de la Fusión" character={resultAsCharacter} />
                           </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 border-t pt-4 mt-2">
                            <Button variant="ghost" onClick={() => setMergedResult(null)}>Descartar</Button>
                            <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Guardar Personaje</Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
}
