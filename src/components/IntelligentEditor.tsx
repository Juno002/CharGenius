
"use client";

import React, { useState } from 'react';
import { useCharacter, type Character } from '@/context/CharacterContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Bot, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getSafetySettingsForNsfw } from '@/ai/ai-safety';
import Link from 'next/link';
import { StaticCharacterCard } from './character/StaticCharacterCard';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

export function IntelligentEditor() {
    const { character, replaceCurrentCharacter, apiProvider, googleApiKey, googleApiModel, isAiDisabled } = useCharacter();
    const [userPrompt, setUserPrompt] = useState('');
    const [originalCharacterForDiff, setOriginalCharacterForDiff] = useState<Character | null>(null);
    const [editedCharacterForDiff, setEditedCharacterForDiff] = useState<Character | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const { toast } = useToast();

    const handleGetSuggestion = async () => {
        if (!userPrompt.trim()) {
            toast({ title: "Por favor, introduce las instrucciones para editar.", variant: "destructive" });
            return;
        }
        if (isAiDisabled) {
            toast({ title: "Funciones de IA desactivadas.", description: "Activa la IA en los ajustes para usar esta función.", variant: "destructive" });
            return;
        }
        if (apiProvider !== 'google') {
            toast({ title: "Herramienta no compatible", description: "La edición inteligente requiere un modelo capaz de generar JSON. Por favor, cambia al proveedor de Google AI en los ajustes.", variant: "destructive" });
            return;
        }
        if (!googleApiKey) {
            toast({ title: "Clave de API de Google no encontrada", description: "Por favor, añade tu clave en los ajustes para usar esta herramienta.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setOriginalCharacterForDiff(character);
        setEditedCharacterForDiff(null);
        
        const { avatar, lorebook, ...characterForAI } = character;

        const robustPrompt = `Tu tarea es actuar como un editor experto de datos de personajes en formato JSON. Recibirás un objeto JSON de un personaje y una instrucción en lenguaje natural.

Debes aplicar la instrucción de edición a los campos de texto relevantes del objeto. Tu objetivo es interpretar la intención del usuario y modificar el personaje de forma coherente.

### Reglas críticas:
1.  **Devuelve el objeto JSON COMPLETO Y SIN CAMBIOS, excepto por las modificaciones solicitadas.** La estructura del JSON, incluyendo los campos \`spec\`, \`spec_version\`, \`data\`, etc., debe permanecer intacta.
2.  **Edita únicamente los campos relevantes** para la instrucción. Si una instrucción es "hazlo más noble", debes modificar \`description\`, \`personality\`, etc., pero no el \`name\` a menos que se pida explícitamente.
3.  **Conserva las etiquetas (tags) existentes** y solo añade o elimina etiquetas si la instrucción lo pide directamente.
4.  **Tu respuesta DEBE ser únicamente el objeto JSON completo del personaje modificado.** No incluyas texto introductorio, resúmenes, notas ni marques el JSON con \`\`\`json. Solo el JSON.
5.  Si la instrucción no se puede aplicar o no tiene sentido, devuelve el JSON original sin ninguna modificación.

### JSON del personaje a editar:
${JSON.stringify(characterForAI, null, 2)}

### Instrucción de edición del usuario:
"${userPrompt}"
`;
        
        try {
            const safetySettings = getSafetySettingsForNsfw(character.data.extensions.nsfw);
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${googleApiModel}:generateContent?key=${googleApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: robustPrompt }] }],
                    safetySettings: safetySettings,
                    generationConfig: {
                        responseMimeType: "application/json",
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`[Error de Google AI] ${errorData.error?.message || response.statusText}`);
            }
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text || !text.trim().startsWith('{')) {
                throw new Error('Respuesta vacía o inválida de la IA. Revisa los filtros de seguridad de tu cuenta de Google AI.');
            }
            let resultJson = JSON.parse(text);

            if (!resultJson || typeof resultJson !== 'object' || !resultJson.data || typeof resultJson.data !== 'object' || Object.keys(resultJson).length === 0) {
                console.error("AI output is not a valid character object:", resultJson);
                throw new Error("La IA devolvió datos que no están en el formato de personaje esperado, o estaban vacíos.");
            }
            
            resultJson.avatar = character.avatar;

            setEditedCharacterForDiff(resultJson);
            toast({ title: "Sugerencia de edición recibida", description: "Revisa los cambios y aplícalos si estás de acuerdo." });

        } catch (error) {
            console.error(error);
            toast({ title: 'Error al contactar con la IA', description: (error as Error).message, variant: "destructive" });
            setOriginalCharacterForDiff(null);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleApplyChanges = () => {
        if (!editedCharacterForDiff) {
            toast({ title: 'No hay cambios para aplicar', variant: 'destructive' });
            return;
        }
        replaceCurrentCharacter(editedCharacterForDiff);
        toast({ title: '¡Éxito!', description: 'Los cambios han sido aplicados al personaje.' });
        handleDiscardChanges();
    };

    const handleDiscardChanges = () => {
        setOriginalCharacterForDiff(null);
        setEditedCharacterForDiff(null);
        setUserPrompt('');
    };

    if (!character || !character.data.name) {
        return (
            <Card className="glass-card">
                <CardContent className="pt-6 text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No hay un personaje activo</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Por favor, carga un personaje desde la galería para empezar a editarlo con IA.
                    </p>
                    <Button asChild className="mt-4">
                        <Link href="/gallery">Ir a la Galería</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="glass-card">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Bot className="h-6 w-6 text-primary" />
                        <div>
                            <CardTitle className="font-space-grotesk text-2xl">Edición Inteligente</CardTitle>
                            <CardDescription className="mt-1">
                                Modifica al personaje <span className="font-bold text-accent">{character.data.name}</span> con lenguaje natural.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="ai-intelligent-edit-prompt">Tus instrucciones de edición</Label>
                        <Textarea
                            id="ai-intelligent-edit-prompt"
                            placeholder="Ej: Hazlo más sarcástico y cambia su nombre a 'Loki'. Conviértelo en un elfo del bosque..."
                            value={userPrompt}
                            onChange={(e) => setUserPrompt(e.target.value)}
                            className="mt-2 min-h-[100px]"
                        />
                    </div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="w-full">
                                <Button onClick={handleGetSuggestion} disabled={isLoading || !userPrompt || isAiDisabled || apiProvider !== 'google' || !googleApiKey} className="w-full">
                                    {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                    Obtener Sugerencia de Edición
                                </Button>
                            </div>
                        </TooltipTrigger>
                        {apiProvider !== 'google' && (
                            <TooltipContent>
                                <p>Esta función requiere el proveedor Google AI.</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </CardContent>
            </Card>

            <AnimatePresence>
            {originalCharacterForDiff && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="glass-card">
                        <CardHeader>
                             <CardTitle>Revisa los Cambios</CardTitle>
                             <CardDescription>Compara las tarjetas del personaje. Aplica los cambios si estás de acuerdo.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <StaticCharacterCard 
                                title="Original"
                                character={originalCharacterForDiff}
                            />
                            { isLoading ? (
                                <div className="flex min-h-[400px] items-center justify-center p-8 border-2 border-dashed rounded-lg bg-muted/50">
                                    <div className="text-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                                        <p className="mt-4 text-muted-foreground">La IA está trabajando...</p>
                                    </div>
                                </div>
                            ) : (
                                <StaticCharacterCard 
                                    title="Modificado"
                                    character={editedCharacterForDiff}
                                />
                            )}
                        </CardContent>
                        <CardContent className="flex flex-col sm:flex-row justify-end gap-2 border-t pt-4 mt-6">
                            <Button variant="ghost" onClick={handleDiscardChanges}>Descartar</Button>
                            <Button onClick={handleApplyChanges} disabled={!editedCharacterForDiff}>Aplicar Cambios</Button>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
}
