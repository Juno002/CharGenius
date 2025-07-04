
"use client";

import React, { useState, useEffect } from 'react';
import { useCharacter } from '@/context/CharacterContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Loader2, Sparkles, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { summarizeText } from '@/ai/flows/summarize-text';
import { detectRedundancy, type DetectRedundancyOutput, type DetectRedundancyInput } from '@/ai/flows/detect-redundancy';
import { countTokens } from '@/lib/tokenizer';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';

const optimizableFields = [
    { key: 'description', label: 'Descripción' },
    { key: 'personality', label: 'Personalidad' },
    { key: 'scenario', label: 'Escenario' },
    { key: 'first_mes', label: 'Primer Mensaje' },
    { key: 'mes_example', label: 'Ejemplos de Diálogo' },
    { key: 'system_prompt', label: 'Instrucciones del Sistema' },
    { key: 'post_history_instructions', label: 'Instrucciones Post-Historial' },
    { key: 'extensions.world', label: 'Información del Mundo' },
];

export function TokenOptimizer() {
    const { character, updateCharacter, apiProvider, isAiDisabled } = useCharacter();
    const { toast } = useToast();

    // State for Summarize/Optimize tab
    const [selectedField, setSelectedField] = useState('description');
    const [originalText, setOriginalText] = useState('');
    const [optimizedText, setOptimizedText] = useState('');
    const [originalTokens, setOriginalTokens] = useState(0);
    const [optimizedTokens, setOptimizedTokens] = useState(0);
    const [isOptimizing, setIsOptimizing] = useState(false);
    
    // State for Redundancy tab
    const [redundancyResult, setRedundancyResult] = useState<DetectRedundancyOutput | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Effect for Summarize tab - update text when field changes
    useEffect(() => {
        const getNestedValue = (obj: any, path: string) => path.split('.').reduce((o, k) => (o && o[k] != null) ? o[k] : '', obj);
        const text = getNestedValue(character, `data.${selectedField}`) || '';
        setOriginalText(text);
        setOptimizedText('');
    }, [selectedField, character]);

    // Effect for Summarize tab - count tokens for original text
    useEffect(() => {
        let isMounted = true;
        countTokens(originalText).then(count => {
            if(isMounted) setOriginalTokens(count);
        });
        return () => { isMounted = false; };
    }, [originalText]);

    // Effect for Summarize tab - count tokens for optimized text
    useEffect(() => {
        let isMounted = true;
        countTokens(optimizedText).then(count => {
            if(isMounted) setOptimizedTokens(count);
        });
        return () => { isMounted = false; };
    }, [optimizedText]);


    const handleOptimize = async () => {
        if (!originalText) {
            toast({ title: 'No hay texto que optimizar en este campo.', variant: 'destructive' });
            return;
        }
        if (isAiDisabled) {
            toast({ title: "Funciones de IA desactivadas.", variant: "destructive" });
            return;
        }
        if (apiProvider !== 'integrated') {
            toast({ title: "Usando IA Integrada", description: "Esta herramienta usará la IA integrada." });
        }
        
        setIsOptimizing(true);
        setOptimizedText('');

        try {
            const result = await summarizeText({
                textToSummarize: originalText,
                fieldName: optimizableFields.find(f => f.key === selectedField)?.label,
            });
            setOptimizedText(result.summarizedText);
            toast({ title: '¡Optimización completada!', description: 'Revisa el texto resumido a continuación.' });
        } catch (error) {
            console.error("Error optimizing text:", error);
            toast({ title: 'Error al optimizar', variant: 'destructive' });
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleApply = () => {
        if (!optimizedText) return;
        
        updateCharacter(prev => {
            const newChar = JSON.parse(JSON.stringify(prev));
            let current = newChar.data;
            const keys = selectedField.split('.');
            keys.slice(0, -1).forEach(key => {
                current[key] = current[key] || {};
                current = current[key];
            });
            current[keys[keys.length - 1]] = optimizedText;
            return newChar;
        });

        toast({ title: 'Cambios aplicados', description: `El campo '${optimizableFields.find(f => f.key === selectedField)?.label}' ha sido actualizado.` });
    };
    
    const handleAnalyzeRedundancy = async () => {
        const { description, personality, scenario, first_mes } = character.data;
        const payload: DetectRedundancyInput = {
            description: description || '',
            personality: personality || '',
            scenario: scenario || '',
            first_mes: first_mes || '',
        };

        if (!Object.values(payload).some(v => v)) {
            toast({ title: 'No hay suficiente contenido para analizar.', variant: 'destructive' });
            return;
        }
        if (isAiDisabled) {
            toast({ title: "Funciones de IA desactivadas.", variant: "destructive" });
            return;
        }
        if (apiProvider !== 'integrated') {
            toast({ title: "Usando IA Integrada", description: "Esta herramienta usará la IA integrada." });
        }
        
        setIsAnalyzing(true);
        setRedundancyResult(null);

        try {
            const analysisResult = await detectRedundancy(payload);
            setRedundancyResult(analysisResult);
            toast({ title: 'Análisis completado' });
        } catch (error) {
            console.error("Error analyzing redundancy:", error);
            toast({ title: 'Error al analizar', variant: 'destructive' });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleApplySuggestion = (finding: (typeof redundancyResult.findings)[0]) => {
        finding.updates.forEach((update) => {
             updateCharacter(prev => {
                const newChar = JSON.parse(JSON.stringify(prev));
                let current = newChar.data;
                const keys = update.fieldName.split('.');
                keys.slice(0, -1).forEach(key => {
                    current[key] = current[key] || {};
                    current = current[key];
                });
                current[keys[keys.length - 1]] = update.updatedContent;
                return newChar;
            });
        });

        toast({
            title: "Sugerencia Aplicada!",
            description: "Los campos del personaje han sido actualizados."
        });

        // Remove the applied finding from the results to prevent re-applying
        setRedundancyResult(prev => {
            if (!prev) return null;
            return {
                ...prev,
                findings: prev.findings.filter(f => f !== finding),
            };
        });
    };

    const getOriginalFieldValue = (fieldName: string): string => {
        const getNestedValue = (obj: any, path: string) => path.split('.').reduce((o, k) => (o && o[k] != null) ? o[k] : '', obj);
        return getNestedValue(character, `data.${fieldName}`) || '';
    };

    if (!character || !character.data.name) {
        return (
            <Card className="glass-card"><CardContent className="pt-6 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No hay un personaje activo</h3>
                <p className="mt-2 text-sm text-muted-foreground">Por favor, carga un personaje desde la galería.</p>
                <Button asChild className="mt-4"><Link href="/gallery">Ir a la Galería</Link></Button>
            </CardContent></Card>
        );
    }

    const reduction = originalTokens > 0 ? ((originalTokens - optimizedTokens) / originalTokens) * 100 : 0;

    return (
        <div className="space-y-6">
            <Card className="glass-card">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Zap className="h-6 w-6 text-primary" />
                        <div>
                            <CardTitle className="font-space-grotesk text-2xl">Optimizador de Contenido</CardTitle>
                            <CardDescription>
                                Un conjunto de herramientas para analizar, resumir y mejorar la ficha de <span className="font-bold text-accent">{character.data.name}</span>.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <Tabs defaultValue="summarize" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="summarize">Resumir y Optimizar</TabsTrigger>
                    <TabsTrigger value="redundancy">Detectar Redundancia</TabsTrigger>
                </TabsList>
                <TabsContent value="summarize" className="mt-6 space-y-6">
                    <Card className="glass-card bg-transparent border-0 shadow-none">
                         <CardHeader className="px-1">
                             <CardTitle className="text-xl">Resumir Campo</CardTitle>
                             <CardDescription>Selecciona un campo y la IA lo resumirá para reducir tokens sin perder la esencia.</CardDescription>
                         </CardHeader>
                         <CardContent className="space-y-4 px-1">
                             <div className="space-y-2">
                                 <Label htmlFor="field-select">Campo a optimizar</Label>
                                 <Select value={selectedField} onValueChange={setSelectedField}>
                                     <SelectTrigger id="field-select"><SelectValue placeholder="Seleccionar campo..." /></SelectTrigger>
                                     <SelectContent>
                                         {optimizableFields.map(field => <SelectItem key={field.key} value={field.key}>{field.label}</SelectItem>)}
                                     </SelectContent>
                                 </Select>
                             </div>
                             <Button onClick={handleOptimize} disabled={isOptimizing || !originalText || isAiDisabled} className="w-full">
                                 {isOptimizing ? <Loader2 className="animate-spin" /> : <Sparkles />} Optimizar Texto
                             </Button>
                         </CardContent>
                    </Card>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="glass-card">
                            <CardHeader><CardTitle className="flex justify-between items-center">
                                <span>Original</span><span className="text-sm font-mono bg-muted px-2 py-1 rounded-md">{originalTokens} tokens</span>
                            </CardTitle></CardHeader>
                            <CardContent><Textarea readOnly value={originalText} className="min-h-[250px] bg-muted/50" /></CardContent>
                        </Card>
                         <Card className="glass-card">
                            <CardHeader><CardTitle className="flex justify-between items-center">
                                <span>Optimizado</span>
                                {optimizedText && (<div className="flex items-center gap-2">
                                     {reduction > 0 && <span className="text-sm font-semibold text-green-500">-{reduction.toFixed(0)}%</span>}
                                    <span className="text-sm font-mono bg-muted px-2 py-1 rounded-md">{optimizedTokens} tokens</span>
                                </div>)}
                            </CardTitle></CardHeader>
                            <CardContent><Textarea readOnly value={isOptimizing ? "La IA está trabajando..." : optimizedText} placeholder="El resultado aparecerá aquí..." className="min-h-[250px] bg-muted/50" /></CardContent>
                        </Card>
                    </div>
                    <AnimatePresence>
                        {optimizedText && !isOptimizing && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Card className="glass-card"><CardFooter className="pt-6 flex justify-end">
                                <Button onClick={handleApply}>Aplicar Cambios</Button>
                            </CardFooter></Card>
                        </motion.div>)}
                    </AnimatePresence>
                </TabsContent>
                <TabsContent value="redundancy" className="mt-6 space-y-6">
                    <Card className="glass-card bg-transparent border-0 shadow-none">
                        <CardHeader className="px-1">
                            <CardTitle className="text-xl">Detector de Redundancia</CardTitle>
                            <CardDescription>Analiza la ficha en busca de información repetida para que puedas consolidarla.</CardDescription>
                        </CardHeader>
                        <CardContent className="px-1">
                            <Button onClick={handleAnalyzeRedundancy} disabled={isAnalyzing || isAiDisabled} className="w-full">
                                {isAnalyzing ? <Loader2 className="animate-spin" /> : <Sparkles />} Analizar Ficha
                            </Button>
                        </CardContent>
                    </Card>
                    <AnimatePresence>
                        {isAnalyzing && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                            <Card className="glass-card text-center p-8"><Loader2 className="h-8 w-8 mx-auto animate-spin text-primary" />
                                <p className="mt-4 text-muted-foreground">La IA está examinando cada palabra...</p>
                            </Card>
                        </motion.div>)}
                        {redundancyResult && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <Card className="glass-card">
                                <CardHeader><CardTitle>Resultados del Análisis</CardTitle><CardDescription>Sugerencias para mejorar la concisión de tu personaje.</CardDescription></CardHeader>
                                <CardContent className="space-y-4">
                                {redundancyResult.findings.length > 0 ? (
                                    <ul className="space-y-4">
                                    {redundancyResult.findings.map((finding, index) => (
                                        <li key={index} className="p-4 border rounded-lg bg-muted/50 space-y-4">
                                            <div>
                                                <p className="font-semibold text-foreground">
                                                    Redundancia Detectada: <span className="italic font-normal">"{finding.redundantInfo}"</span>
                                                </p>
                                                <p className="text-sm mt-1">
                                                    <span className="font-semibold text-primary">Explicación:</span> {finding.explanation}
                                                </p>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                {finding.updates.map(update => (
                                                    <div key={update.fieldName} className="bg-background/30 p-3 rounded-md">
                                                        <Label>Cambio propuesto para <Badge variant="outline">{optimizableFields.find(f => f.key === update.fieldName)?.label || update.fieldName}</Badge></Label>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                                                            <div>
                                                                <Label className="text-xs text-muted-foreground">Original</Label>
                                                                <Textarea readOnly value={getOriginalFieldValue(update.fieldName)} className="bg-muted/50 h-32 text-xs" />
                                                            </div>
                                                            <div>
                                                                <Label className="text-xs text-green-400">Optimizado</Label>
                                                                <Textarea readOnly value={update.updatedContent} className="bg-green-900/10 border-green-500/50 h-32 text-xs" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex justify-end">
                                                <Button onClick={() => handleApplySuggestion(finding)}>Aplicar Sugerencia</Button>
                                            </div>
                                        </li>
                                    ))}
                                    </ul>
                                ) : (<div className="text-center py-8">
                                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" /><p className="font-semibold mt-4">¡Ficha optimizada!</p><p className="text-muted-foreground">No se han encontrado redundancias significativas.</p>
                                </div>)}
                                </CardContent>
                            </Card>
                        </motion.div>)}
                    </AnimatePresence>
                </TabsContent>
            </Tabs>
        </div>
    );
}
