
"use client";

import React, { useState } from 'react';
import { useCharacter } from '@/context/CharacterContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Microscope, Loader2, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { detectRedundancy, type DetectRedundancyOutput } from '@/ai/flows/detect-redundancy';
import Link from 'next/link';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { AnimatePresence, motion } from 'framer-motion';

export function RedundancyAnalyzer() {
    const { character, apiProvider, isAiDisabled } = useCharacter();
    const [result, setResult] = useState<DetectRedundancyOutput | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleAnalyze = async () => {
        const { description, personality, scenario, first_mes } = character.data;
        if (!description && !personality && !scenario && !first_mes) {
            toast({ title: 'No hay suficiente contenido para analizar.', variant: 'destructive' });
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
        setResult(null);

        try {
            const analysisResult = await detectRedundancy({ description, personality, scenario, first_mes });
            setResult(analysisResult);
            toast({ title: 'Análisis completado', description: 'Se han encontrado las siguientes sugerencias.' });
        } catch (error) {
            console.error("Error analyzing redundancy:", error);
            toast({ title: 'Error al analizar', variant: 'destructive' });
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
                        <Microscope className="h-6 w-6 text-primary" />
                        <div>
                            <CardTitle className="font-space-grotesk text-2xl">Reductor de Redundancia</CardTitle>
                            <CardDescription>
                                Analiza la ficha de <span className="font-bold text-accent">{character.data.name}</span> en busca de información repetida para hacerla más concisa.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Button onClick={handleAnalyze} disabled={isLoading || isAiDisabled} className="w-full">
                        {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
                        Analizar Ficha de Personaje
                    </Button>
                </CardContent>
            </Card>

            <AnimatePresence>
                {isLoading && (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Card className="glass-card text-center p-8">
                            <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                            <p className="mt-4 text-muted-foreground">La IA está examinando cada palabra...</p>
                        </Card>
                     </motion.div>
                )}

                {result && (
                     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <Card className="glass-card">
                             <CardHeader>
                                <CardTitle>Resultados del Análisis</CardTitle>
                                <CardDescription>Estas son las redundancias y sugerencias encontradas.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                               {result.findings.length > 0 ? (
                                    <ul className="space-y-4">
                                        {result.findings.map((finding, index) => (
                                            <li key={index} className="p-4 border rounded-lg bg-muted/50">
                                                <p className="font-semibold text-foreground">
                                                    Información repetida: <span className="italic font-normal">"{finding.redundantInfo}"</span>
                                                </p>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    Encontrado en: {finding.locations.map(loc => <Badge key={loc} variant="secondary" className="mr-1">{loc}</Badge>)}
                                                </div>
                                                <Separator className="my-2" />
                                                <p className="text-sm">
                                                    <span className="font-semibold text-primary">Sugerencia:</span> {finding.suggestion}
                                                </p>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center py-8">
                                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                                        <p className="font-semibold mt-4">¡Ficha optimizada!</p>
                                        <p className="text-muted-foreground">No se han encontrado redundancias significativas.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                     </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
