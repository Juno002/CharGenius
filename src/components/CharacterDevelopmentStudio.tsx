
"use client";

import React, { useState } from 'react';
import { useCharacter } from '@/context/CharacterContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Loader2, Sparkles, AlertTriangle, Cpu, BrainCircuit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateNarrativeArcs, type GenerateNarrativeArcsOutput } from '@/ai/flows/generate-narrative-arc';
import { detectArchetype, type DetectArchetypeOutput } from '@/ai/flows/detect-archetype';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';

export function CharacterDevelopmentStudio() {
    const { character, useGoogleApiKey, isAiDisabled, language } = useCharacter();
    const [analysisResult, setAnalysisResult] = useState<DetectArchetypeOutput | null>(null);
    const [arcsResult, setArcsResult] = useState<GenerateNarrativeArcsOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        const { name, description, personality } = character.data;
        if (!description || !personality) {
            toast({ title: 'Por favor, introduce una descripción y personalidad primero.', variant: 'destructive' });
            return;
        }

        if (isAiDisabled) {
            toast({ title: "Funciones de IA desactivadas.", description: "Activa la IA en los ajustes para usar esta función.", variant: "destructive" });
            return;
        }

        if (useGoogleApiKey) {
            toast({
                title: "Usando IA Integrada",
                description: "Esta función usará la IA integrada, no tu API key personalizada.",
            });
        }
        
        setIsLoading(true);
        setAnalysisResult(null);
        setArcsResult(null);

        try {
            // Step 1: Detect Archetype
            const detectedArchetype = await detectArchetype({ name, description, personality, language });
            setAnalysisResult(detectedArchetype);
            
            // Step 2: Generate Arcs based on the detected archetype
            const generatedArcs = await generateNarrativeArcs({ name, description, personality, archetype: detectedArchetype.detectedArchetype, language });
            setArcsResult(generatedArcs);
            
            toast({ title: 'Análisis y arcos narrativos generados.' });
        } catch (error) {
            console.error("Error generating narrative arcs:", error);
            toast({ title: 'Error al generar arcos narrativos.', variant: 'destructive' });
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
                        Por favor, carga un personaje desde la galería para empezar.
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
                        <BrainCircuit className="h-6 w-6 text-primary" />
                        <div>
                            <CardTitle className="font-space-grotesk text-2xl">Estudio de Desarrollo</CardTitle>
                            <CardDescription>
                                Analiza el arquetipo de <span className="font-bold text-accent">{character.data.name}</span> y genera posibles arcos narrativos para su historia.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleGenerate} disabled={isLoading || isAiDisabled} className="w-full">
                        {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                        Analizar y Desarrollar
                    </Button>
                </CardContent>
            </Card>

            <AnimatePresence>
                {isLoading && (
                     <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Card className="glass-card text-center p-8">
                            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                            <p className="mt-4 text-muted-foreground">La IA está detectando el arquetipo y trazando el futuro de tu personaje...</p>
                        </Card>
                     </motion.div>
                )}

                {analysisResult && (
                    <motion.div key="analysisResult" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <Card className="glass-card">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-space-grotesk"><Cpu className="h-5 w-5"/> Arquetipo Detectado: <span className="text-primary">{analysisResult.detectedArchetype}</span></CardTitle>
                                <CardDescription>{analysisResult.analysis}</CardDescription>
                            </CardHeader>
                        </Card>
                    </motion.div>
                )}

                {arcsResult && (
                     <motion.div key="arcsResult" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                        <Card className="glass-card">
                             <CardHeader>
                                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5"/> Arcos Narrativos Sugeridos</CardTitle>
                                <CardDescription>Aquí tienes algunas ideas para la evolución de la historia de tu personaje, inspiradas en su arquetipo.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                               {arcsResult.arcs.map((arc, index) => (
                                    <Card key={index} className="p-4 bg-muted/50">
                                        <CardTitle className="text-lg font-semibold text-primary">{arc.title}</CardTitle>
                                        <CardDescription className="mt-2 text-sm">{arc.description}</CardDescription>
                                    </Card>
                                ))}
                            </CardContent>
                        </Card>
                     </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
