
"use client";

import React, { useState, useMemo } from 'react';
import { useCharacter, type Character, type LoreEntry } from '@/context/CharacterContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GitCommit, Wand2, Loader2, User, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateRelationshipLore, type GenerateRelationshipLoreOutput } from '@/ai/flows/generate-relationship-lore';
import { Separator } from './ui/separator';
import { StaticCharacterCard } from './character/StaticCharacterCard';
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

export function RelationshipGenerator() {
    const { characterHistory, updateMultipleCharacters, apiProvider, isAiDisabled } = useCharacter();
    const [charAId, setCharAId] = useState<string | undefined>();
    const [charBId, setCharBId] = useState<string | undefined>();
    const [relationshipPrompt, setRelationshipPrompt] = useState('');
    const [generatedResult, setGeneratedResult] = useState<GenerateRelationshipLoreOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const charA = useMemo(() => characterHistory.find(c => c.id === charAId), [charAId, characterHistory]);
    const charB = useMemo(() => characterHistory.find(c => c.id === charBId), [charBId, characterHistory]);

    const handleGenerate = async () => {
        if (!charA || !charB) {
            toast({ title: 'Por favor, selecciona dos personajes.', variant: 'destructive' });
            return;
        }
        if (!relationshipPrompt.trim()) {
            toast({ title: 'Por favor, describe la relación.', variant: 'destructive' });
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
        setGeneratedResult(null);

        try {
            const result = await generateRelationshipLore({
                characterA: { name: charA.data.name, personality: charA.data.personality },
                characterB: { name: charB.data.name, personality: charB.data.personality },
                relationship: relationshipPrompt,
            });
            setGeneratedResult(result);
            toast({ title: '¡Relación generada!', description: 'Revisa las entradas de lore y aplícalas a los personajes.' });
        } catch (error) {
            console.error('Error generating relationship lore:', error);
            toast({ title: 'Error al generar la relación', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleApply = () => {
        if (!generatedResult || !charA || !charB) {
            toast({ title: 'No hay nada que aplicar.', variant: 'destructive' });
            return;
        }

        const newLoreEntryForA: LoreEntry = {
            uid: Date.now(),
            key: generatedResult.suggestedKeysForA,
            content: generatedResult.loreForCharacterA,
            comment: `Relación con ${charB.data.name}`,
            disable: false,
            // --- Default values ---
            keysecondary: [], constant: false, selective: true, order: 100, position: 0,
            displayIndex: 0, addMemo: true, group: '', groupOverride: false, groupWeight: 100,
            sticky: 0, cooldown: 0, delay: 0, probability: 100, depth: 4, useProbability: true,
            role: null, vectorized: false, excludeRecursion: false, preventRecursion: false,
            delayUntilRecursion: false, scanDepth: null, caseSensitive: null, matchWholeWords: null,
            useGroupScoring: null, automationId: ''
        };
        
        const newLoreEntryForB: LoreEntry = {
            ...newLoreEntryForA, // copy defaults
            uid: Date.now() + 1,
            key: generatedResult.suggestedKeysForB,
            content: generatedResult.loreForCharacterB,
            comment: `Relación con ${charA.data.name}`,
        };
        
        const updatedCharA = { ...charA, lorebook: [...charA.lorebook, newLoreEntryForA] };
        const updatedCharB = { ...charB, lorebook: [...charB.lorebook, newLoreEntryForB] };

        updateMultipleCharacters([updatedCharA, updatedCharB]);

        toast({ title: '¡Éxito!', description: `Se han añadido las entradas de lore a ${charA.data.name} y ${charB.data.name}.` });
        setGeneratedResult(null);
        setRelationshipPrompt('');
    };

    return (
        <div className="space-y-6">
            <Card className="glass-card">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <GitCommit className="h-6 w-6 text-primary" />
                        <div>
                            <CardTitle className="font-space-grotesk text-2xl">Generador de Relaciones</CardTitle>
                            <CardDescription>
                                Crea y añade lorebooks para definir la relación entre dos de tus personajes.
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
                        <Label htmlFor="relationship-prompt">Describe su relación</Label>
                        <Textarea 
                            id="relationship-prompt"
                            placeholder="Ej: Amigos de la infancia que se distanciaron. Ahora se reencuentran en bandos opuestos de una guerra, pero aún queda un rastro de su antiguo vínculo."
                            className="min-h-[120px]"
                            value={relationshipPrompt}
                            onChange={(e) => setRelationshipPrompt(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleGenerate} disabled={isLoading || !charAId || !charBId || !relationshipPrompt || isAiDisabled} className="w-full">
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                        Generar Lore de Relación
                    </Button>
                </CardContent>
            </Card>

            <AnimatePresence>
            {isLoading && (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <Card className="glass-card text-center p-8">
                        <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                        <p className="mt-4 text-muted-foreground">La IA está tejiendo los hilos del destino entre tus personajes...</p>
                    </Card>
                 </motion.div>
            )}

            {generatedResult && charA && charB && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                    <Card className="glass-card">
                        <CardHeader>
                            <CardTitle>Resultado Generado</CardTitle>
                            <CardDescription>Revisa las entradas de lorebook generadas. Si te gustan, aplícalas a tus personajes.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                           <Card>
                               <CardHeader>
                                    <CardTitle className="text-lg">Para {charA.data.name}</CardTitle>
                                    <CardDescription>sobre {charB.data.name}</CardDescription>
                               </CardHeader>
                               <CardContent className="space-y-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Palabras Clave Sugeridas</Label>
                                        <p className="text-sm p-2 bg-muted rounded-md font-mono">{generatedResult.suggestedKeysForA.join(', ')}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Contenido del Lorebook</Label>
                                        <Textarea readOnly value={generatedResult.loreForCharacterA} className="h-32 bg-muted/50" />
                                    </div>
                               </CardContent>
                           </Card>
                           <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Para {charB.data.name}</CardTitle>
                                    <CardDescription>sobre {charA.data.name}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Palabras Clave Sugeridas</Label>
                                        <p className="text-sm p-2 bg-muted rounded-md font-mono">{generatedResult.suggestedKeysForB.join(', ')}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Contenido del Lorebook</Label>
                                        <Textarea readOnly value={generatedResult.loreForCharacterB} className="h-32 bg-muted/50" />
                                    </div>
                                </CardContent>
                           </Card>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 border-t pt-4 mt-6">
                            <Button variant="ghost" onClick={() => setGeneratedResult(null)}>Descartar</Button>
                            <Button onClick={handleApply}>Aplicar a Personajes</Button>
                        </CardFooter>
                    </Card>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
}
