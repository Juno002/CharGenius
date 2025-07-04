
"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, ArrowRight, Wand2, Loader2, Sparkles } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';
import { useCharacter } from '@/context/CharacterContext';
import { useToast } from '@/hooks/use-toast';
import { generateGuidedCharacter } from '@/ai/flows/generate-guided-character';
import { generateCharacterImage } from '@/ai/flows/generate-character-image';
import { useTranslation } from '@/context/LanguageContext';


const steps = [
  { id: 1, name: 'Idea Central', description: 'La chispa de tu personaje' },
  { id: 2, name: 'Estilo y Tono', description: 'Define la personalidad' },
  { id: 3, name: 'Detalles Finales', description: 'Elige los campos a generar' },
  { id: 4, name: 'Generación', description: '¡Magia en progreso!' },
];

const fieldsToGenerateOptions = [
    { id: 'name', label: 'Nombre' },
    { id: 'description', label: 'Descripción' },
    { id: 'personality', label: 'Personalidad' },
    { id: 'scenario', label: 'Escenario' },
    { id: 'first_mes', label: 'Primer Mensaje' },
    { id: 'mes_example', label: 'Ejemplos de Diálogo' },
    { id: 'alternate_greetings', label: 'Saludos Alternativos' },
    { id: 'tags', label: 'Etiquetas' },
    { id: 'system_prompt', label: 'System Prompt' },
    { id: 'post_history_instructions', label: 'Instrucciones Post-Historial' },
    { id: 'creator_notes', label: 'Notas del Creador' },
    { id: 'lorebook_entry', label: 'Entrada de Lorebook' },
    { id: 'avatar', label: 'Avatar (Imagen IA)' },
];

export function GuidedGenerator() {
  const [currentStep, setCurrentStep] = useState(1);
  const [prompt, setPrompt] = useState('');
  const [archetype, setArchetype] = useState('custom');
  const [customArchetype, setCustomArchetype] = useState('');
  const [detailLevel, setDetailLevel] = useState('intermedio');
  const [fieldsToGenerate, setFieldsToGenerate] = useState<Record<string, boolean>>({});
  const [nsfw, setNsfw] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const router = useRouter();
  const { importCharacter, googleApiKey, isAiDisabled, language } = useCharacter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const personalityPresets = [
    { value: "custom", label: t('archetypes.custom') },
    { value: "heroe", label: t('archetypes.heroe') },
    { value: "antiheroe", label: t('archetypes.antiheroe') },
    { value: "villano_tragico", label: t('archetypes.villano_tragico') },
    { value: "mentor_sabio", label: t('archetypes.mentor_sabio') },
    { value: "rebelde", label: t('archetypes.rebelde') },
    { value: "explorador", label: t('archetypes.explorador') },
    { value: "bufon", label: t('archetypes.bufon') },
    { value: "amante", label: t('archetypes.amante') },
    { value: "inocente", label: t('archetypes.inocente') },
    { value: "tsundere", label: t('archetypes.tsundere') },
  ];

  useEffect(() => {
    const fieldMap = {
        basico: ['name', 'description', 'personality', 'first_mes', 'tags'],
        intermedio: ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example', 'tags', 'alternate_greetings', 'lorebook_entry'],
        avanzado: fieldsToGenerateOptions.map(f => f.id)
    };

    const targetFields = fieldMap[detailLevel as keyof typeof fieldMap] || [];

    const newFieldsConfig = fieldsToGenerateOptions.reduce((acc, field) => {
        acc[field.id] = targetFields.includes(field.id);
        return acc;
    }, {} as Record<string, boolean>);
    
    setFieldsToGenerate(newFieldsConfig);
  }, [detailLevel]);


  const handleFieldToggle = (fieldId: string) => {
    setFieldsToGenerate(prev => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  const handleAction = async () => {
    if ((isAiDisabled || !googleApiKey) && currentStep === 3) {
        toast({ title: "API Key de Google requerida", description: "Por favor, añade tu clave de API en los ajustes para usar esta función.", variant: "destructive" });
        return;
    }
    if (currentStep < 3) {
      setCurrentStep(step => step + 1);
      return;
    }
    
    if (currentStep === 3) {
        toast({
            title: "Función Desactivada Temporalmente",
            description: "El Generador Guiado está siendo migrado al nuevo sistema de API. Por favor, usa la 'Generación Completa' desde la suite de herramientas por ahora.",
            variant: "destructive",
            duration: 6000
        });
        return;

        // The following logic is disabled pending refactor to direct API calls.
        /*
        setIsGenerating(true);
        setCurrentStep(4);

        try {
            // Generate text fields first
            const result = await generateGuidedCharacter({
                prompt,
                archetype,
                customArchetype: archetype === 'custom' ? customArchetype : undefined,
                detailLevel,
                fieldsToGenerate,
                nsfw,
                language,
            });
            
            let finalCharacterData: any = { ...result };
            
            if (finalCharacterData.lorebook_entry) {
                const newLoreEntry = {
                    uid: Date.now(),
                    key: [finalCharacterData.name || 'lore'],
                    keysecondary: [],
                    comment: 'Lore generado automáticamente',
                    content: finalCharacterData.lorebook_entry,
                    constant: false,
                    selective: true,
                    order: 100,
                    position: 0,
                    disable: false,
                    displayIndex: 0,
                    addMemo: true,
                    group: '',
                    groupOverride: false,
                    groupWeight: 100,
                    sticky: 0,
                    cooldown: 0,
                    delay: 0,
                    probability: 100,
                    depth: 4,
                    useProbability: true,
                    role: null,
                    vectorized: false,
                    excludeRecursion: false,
                    preventRecursion: false,
                    delayUntilRecursion: false,
                    scanDepth: null,
                    caseSensitive: null,
                    matchWholeWords: null,
                    useGroupScoring: null,
                    automationId: ''
                };
                finalCharacterData.lorebook = [newLoreEntry];
                delete finalCharacterData.lorebook_entry;
            }

            if (fieldsToGenerate.avatar && result.description) {
                toast({ title: "Generando avatar...", description: "Este proceso puede tardar unos segundos." });
                try {
                    const imageResult = await generateCharacterImage({ description: `${result.name || ''}: ${result.description}` });
                    finalCharacterData.avatar = imageResult.imageDataUri;
                } catch (imageError) {
                    console.error("Avatar generation failed:", imageError);
                    toast({ title: "Error al generar el avatar", description: "Se continuará con el personaje sin avatar.", variant: "destructive" });
                }
            }
            
            importCharacter(finalCharacterData);
            toast({ title: "¡Personaje generado con éxito!", description: "Redirigiendo al editor de personajes..." });
            router.push('/edit');

        } catch (error) {
            console.error("Guided generation failed:", error);
            toast({ title: "Error en la generación", description: (error as Error).message, variant: "destructive" });
            setCurrentStep(3);
        } finally {
            setIsGenerating(false);
        }
        */
    }
  };


  const prevStep = () => {
    if (currentStep > 1 && !isGenerating) {
      setCurrentStep(step => step - 1);
    }
  };

  const Stepper = () => (
    <nav aria-label="Progress">
      <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {steps.map((step, index) => (
          <li key={step.name} className="md:flex-1">
            {currentStep > step.id ? (
              <div className="group flex w-full flex-col border-l-4 border-primary py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                <span className="text-sm font-medium text-primary transition-colors">{step.name}</span>
                <span className="text-sm font-medium text-muted-foreground">{step.description}</span>
              </div>
            ) : currentStep === step.id ? (
              <div
                className="flex w-full flex-col border-l-4 border-primary py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4"
                aria-current="step"
              >
                <span className="text-sm font-medium text-primary">{step.name}</span>
                <span className="text-sm font-medium text-muted-foreground">{step.description}</span>
              </div>
            ) : (
              <div className="group flex w-full flex-col border-l-4 border-border py-2 pl-4 transition-colors md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4">
                <span className="text-sm font-medium text-muted-foreground transition-colors">{step.name}</span>
                <span className="text-sm font-medium text-muted-foreground">{step.description}</span>
              </div>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );

  const isActionDisabled = () => {
    if (currentStep === 1 && !prompt) return true;
    if (currentStep === 2 && !archetype) return true;
    if (currentStep === 3 && Object.values(fieldsToGenerate).every(v => !v)) return true;
    if (currentStep >= 4) return true;
    return false;
  };

  return (
    <Card className="glass-card w-full max-w-4xl mx-auto">
      <CardHeader>
        <Stepper />
      </CardHeader>
      <CardContent className="min-h-[300px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 1 && (
              <div className="space-y-4">
                <CardTitle className="font-space-grotesk text-2xl">Paso 1: La Idea Central</CardTitle>
                <CardDescription>
                  Describe la idea o concepto principal de tu personaje en pocas palabras. Esta será la base para todo lo demás.
                </CardDescription>
                <div className="pt-4">
                  <Label htmlFor="idea-prompt" className="text-base">Tu idea para el personaje</Label>
                  <Textarea
                    id="idea-prompt"
                    placeholder="Ej: Un detective cínico en un mundo cyberpunk que ha perdido su memoria y es perseguido por su pasado..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="mt-2 min-h-[150px] text-base"
                  />
                </div>
              </div>
            )}
             {currentStep === 2 && (
              <div className="space-y-6">
                <CardTitle className="font-space-grotesk text-2xl">Paso 2: Estilo y Tono</CardTitle>
                <CardDescription>
                  Define la personalidad base y el nivel de detalle que esperas de la IA.
                </CardDescription>
                <div className="pt-4 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="archetype-select" className="text-base">Arquetipo / Estilo</Label>
                    <p className="text-sm text-muted-foreground">Elige una base para la personalidad. La IA usará esto como inspiración.</p>
                    <Select value={archetype} onValueChange={setArchetype}>
                      <SelectTrigger id="archetype-select" className="w-full md:w-1/2">
                        <SelectValue placeholder="Seleccionar arquetipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {personalityPresets.map(preset => (
                          <SelectItem key={preset.value} value={preset.value}>
                            {preset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <AnimatePresence>
                    {archetype === 'custom' && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2 overflow-hidden"
                        >
                            <Label htmlFor="custom-archetype">Describe tu arquetipo personalizado</Label>
                            <Textarea
                                id="custom-archetype"
                                value={customArchetype}
                                onChange={(e) => setCustomArchetype(e.target.value)}
                                placeholder="Ej: Un villano cómico que siempre fracasa en sus planes..."
                            />
                        </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-2">
                    <Label className="text-base">Nivel de Detalle</Label>
                    <p className="text-sm text-muted-foreground">¿Cuánta profundidad quieres en los campos generados?</p>
                    <RadioGroup
                      value={detailLevel}
                      onValueChange={setDetailLevel}
                      className="mt-2 space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="basico" id="r1" />
                        <Label htmlFor="r1" className="cursor-pointer">Básico (Conciso y al grano)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="intermedio" id="r2" />
                        <Label htmlFor="r2" className="cursor-pointer">Equilibrado (Detallado y versátil)</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="avanzado" id="r3" />
                        <Label htmlFor="r3" className="cursor-pointer">Avanzado (Extenso y profundo)</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              </div>
            )}
            {currentStep === 3 && (
                <div className="space-y-6">
                    <CardTitle className="font-space-grotesk text-2xl">Paso 3: Detalles Finales</CardTitle>
                    <CardDescription>
                        Selecciona qué campos específicos quieres que la IA genere y ajusta las opciones de contenido. Los campos se pre-seleccionan según el nivel de detalle.
                    </CardDescription>
                    <div className="pt-4 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-base">Campos a Incluir</Label>
                            <p className="text-sm text-muted-foreground">Marca los campos que quieres que la IA rellene.</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                                {fieldsToGenerateOptions.map((field) => (
                                    <div key={field.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`field-${field.id}`}
                                            checked={!!fieldsToGenerate[field.id]}
                                            onCheckedChange={() => handleFieldToggle(field.id)}
                                        />
                                        <Label htmlFor={`field-${field.id}`} className="cursor-pointer font-normal">{field.label}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Separator />
                         <div className="space-y-2">
                            <Label className="text-base">Contenido Sensible</Label>
                            <p className="text-sm text-muted-foreground">Configura el filtro de seguridad de la IA.</p>
                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox
                                    id="nsfw-toggle"
                                    checked={nsfw}
                                    onCheckedChange={(checked) => setNsfw(Boolean(checked))}
                                />
                                <Label htmlFor="nsfw-toggle" className="cursor-pointer font-normal">Permitir contenido NSFW (Not Safe For Work)</Label>
                            </div>
                        </div>
                    </div>
                </div>
            )}
             {currentStep === 4 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 min-h-[300px]">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                    <CardTitle className="font-space-grotesk text-2xl">Generando tu personaje...</CardTitle>
                    <CardDescription>
                        La IA está forjando una nueva creación basada en tus directrices.
                        <br />
                        Este proceso puede tardar unos segundos.
                    </CardDescription>
                    {fieldsToGenerate.avatar && (
                        <div className="flex items-center text-sm text-muted-foreground pt-4">
                            <Sparkles className="h-4 w-4 mr-2 text-accent animate-pulse" />
                            <span>Generación de avatar IA activada.</span>
                        </div>
                    )}
                </div>
            )}
          </motion.div>
        </AnimatePresence>
      </CardContent>
      <CardFooter className="flex justify-between border-t pt-6">
        <Button onClick={prevStep} variant="outline" disabled={currentStep === 1 || isGenerating}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
        </Button>
        <Button onClick={handleAction} disabled={isActionDisabled() || isGenerating || (currentStep === 3 && (isAiDisabled || !googleApiKey))}>
            {isGenerating ? <Loader2 className="animate-spin" /> : (currentStep === 3 ? 'Generar' : 'Siguiente')}
            {isGenerating ? null : (currentStep === 3 ? <Wand2 className="ml-2 h-4 w-4" /> : <ArrowRight className="ml-2 h-4 w-4" />)}
        </Button>
      </CardFooter>
    </Card>
  );
}
