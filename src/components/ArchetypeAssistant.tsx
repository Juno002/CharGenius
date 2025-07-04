
"use client";

import React, { useState } from 'react';
import { useCharacter } from '@/context/CharacterContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Cpu, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { detectArchetype, type DetectArchetypeOutput } from '@/ai/flows/detect-archetype';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';

export function ArchetypeAssistant() {
    const { character, googleApiKey, isAiDisabled } = useCharacter();
    const [result, setResult] = useState<DetectArchetypeOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { language } = useTranslation();

    const handleAnalyze = async () => {
        const { name, description, personality } = character.data;
        if (!description && !personality) {
            toast({ title: 'Por favor, introduce una descripción o personalidad primero.', variant: 'destructive' });
            return;
        }

        if (isAiDisabled || !googleApiKey) {
            toast({ title: "API Key de Google requerida", description: "Por favor, añade tu clave de API en los ajustes para usar esta función.", variant: "destructive" });
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            // This tool still uses a Genkit flow, which is not ideal under the new model.
            // For now, we will show a message and disable it. A future refactor would move this to a direct API call.
            toast({
                title: "Función Desactivada Temporalmente",
                description: "Esta herramienta está siendo migrada al nuevo sistema de API.",
                variant: "destructive",
                duration: 6000
            });
            // const analysisResult = await detectArchetype({ name, description, personality, language });
            // setResult(analysisResult);
            // toast({ title: 'Análisis de arquetipo completado.' });
        } catch (error) {
            console.error("Error detecting archetype:", error);
            toast({ title: 'Error al analizar el arquetipo.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!character || !character.data.name) {
        return (
            <Card className="glass-card">
                <CardContent className="pt-6 text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">No hay un personaje activo</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Por favor, carga un personaje desde la galería para analizarlo.
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
                        <Cpu className="h-6 w-6 text-primary" />
                        <div>
                            <CardTitle className="font-space-grotesk text-2xl">Asistente Arquetípico</CardTitle>
                            <CardDescription>
                                Detecta el arquetipo literario de <span className="font-bold text-accent">{character.data.name}</span> y obtén sugerencias para refinarlo.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleAnalyze} disabled={isLoading || isAiDisabled || !googleApiKey} className="w-full">
                        {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                        Analizar Arquetipo
                    </Button>
                </CardContent>
            </Card>

            <AnimatePresence>
                {isLoading && (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Card className="glass-card text-center p-8">
                            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                            <p className="mt-4 text-muted-foreground">La IA está consultando los grandes libros de la literatura...</p>
                        </Card>
                     </motion.div>
                )}

                {result && (
                     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="glass-card max-w-4xl mx-auto">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-space-grotesk">Arquetipo Detectado: <span className="text-primary">{result.detectedArchetype}</span></CardTitle>
                                <CardDescription>{result.analysis}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <h4 className="font-semibold text-lg mb-2">Sugerencias para Desarrollo</h4>
                                <ul className="space-y-3">
                                    {result.suggestions.map((suggestion, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <Sparkles className="h-5 w-5 text-accent shrink-0 mt-1" />
                                            <p className="text-sm">{suggestion}</p>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                     </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
