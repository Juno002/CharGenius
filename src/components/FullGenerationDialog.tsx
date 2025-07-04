
"use client";

import { useState } from "react";
import { useCharacter } from "@/context/CharacterContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { AnimatePresence, motion } from "framer-motion";
import { FullCharacterOutputSchema } from "@/ai/schemas";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface FullGenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FullGenerationDialog({ open, onOpenChange }: FullGenerationDialogProps) {
    const { importCharacter, apiProvider, googleApiKey, googleApiModel, isAiDisabled, language } = useCharacter();
    const [fullCharacterPrompt, setFullCharacterPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [includeLorebook, setIncludeLorebook] = useState(false);
    const [lorebookEntries, setLorebookEntries] = useState(3);
    const { toast } = useToast();
    const router = useRouter();
    
    const handleGenerate = async () => {
        if (isAiDisabled) {
            toast({ title: "Funciones de IA desactivadas.", description: "Activa la IA en los ajustes para usar esta función.", variant: "destructive" });
            return;
        }
        if (apiProvider !== 'google') {
            toast({ title: "Herramienta no compatible", description: "La generación completa requiere un modelo capaz de generar JSON. Por favor, cambia al proveedor de Google AI en los ajustes.", variant: "destructive" });
            return;
        }
        if (!googleApiKey) {
            toast({ title: "Clave de API de Google no encontrada", description: "Por favor, añade tu clave en los ajustes para usar esta herramienta.", variant: "destructive" });
            return;
        }
        if (!fullCharacterPrompt) {
            toast({ title: "Por favor, introduce una idea para el personaje.", variant: "destructive" });
            return;
        }

        setIsGenerating(true);
        try {
            const lorebookInstruction = includeLorebook 
                ? `- **lorebook**: An array of ${lorebookEntries} lorebook entries. Each entry must be an object with "key" (an array of 1-3 trigger keywords), "comment" (a brief summary or title), and "content" (the detailed lore text). These entries should expand on the character's background, world, or key relationships.`
                : '';

            const systemPrompt = `You are a creative writer and expert in creating character cards for role-playing scenarios like SillyTavern. Your task is to generate a character card in JSON format based on a user's prompt.

      IMPORTANT: Generate all content in the language specified by this code: ${language}.

      Generate the character data based on the following idea:
      "${fullCharacterPrompt}"

      Please generate the following fields. The output must be a valid JSON object matching the requested schema.

      - **name**: A concise and evocative name for the character.
      - **description**: A detailed description of the character's appearance, clothing, age, race, and background.
      - **personality**: A deep dive into the character's personality, key traits, motivations, fears, and how they react.
      - **scenario**: A brief but immersive initial scenario where the character is located.
      - **first_mes**: The character's opening message to the user. It should establish the scene and include actions in asterisks (e.g., *smiles*). It must be engaging.
      - **mes_example**: CRITICAL: A string containing 2-3 dialogue examples. Each example must start with "<START>\\n". The dialogue should alternate between '{{user}}' and '{{char}}'. Actions must be enclosed in asterisks. Line breaks inside the string must be '\\n'.
        Example Format: "<START>\\n{{user}}: Hello, how are you?\\n{{char}}: *Looks at you with an enigmatic smile.* As well as one can be in this world, and you?\\n<START>\\n{{user}}: What brings you here?\\n{{char}}: *Shrugs, looking at the horizon.* Just wandering, looking for inspiration... or maybe some trouble. One never knows."
      - **creator_notes**: Any notes for the creator about the character. Not visible to the AI.
      - **system_prompt**: A concise system prompt that summarizes the core instructions for the AI on how to play this character.
      - **post_history_instructions**: Concise instructions for the AI to consider after the main chat history.
      - **alternate_greetings**: An array of 1-2 alternate greetings.
      - **tags**: An array of 3 to 5 relevant keywords that describe the character (e.g., ["fantasy", "elf", "magic"]).
      - **creator**: The creator's name (optional).
      - **character_version**: The version, e.g., "1.0".
      - **extensions.world**: A block of text with key information about the world, setting, or lore that is relevant to this character.
      - **extensions.fav**: Boolean, default to false.
      - **extensions.talkativeness**: Number between 0 and 1, default to 0.5.
      - **extensions.nsfw**: Boolean, default to false.
      - **extensions.depth_prompt**: An object with 'prompt', 'depth' (1-10) and 'role' ('system' or 'user'). Can be omitted.
      - **extensions.group_only_greetings**: Array of strings for group chats (optional).
      ${lorebookInstruction}
      `;
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${googleApiModel}:generateContent?key=${googleApiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
                    generationConfig: { responseMimeType: "application/json" }
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`[Google AI Error] ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            const result = JSON.parse(text);

            const validation = FullCharacterOutputSchema.safeParse(result);
            if (!validation.success) {
                console.error("Zod validation failed:", validation.error);
                throw new Error("La IA devolvió un objeto con formato incorrecto.");
            }
            
            importCharacter(validation.data);
            toast({ title: "Personaje generado con éxito.", description: "Redirigiendo al editor..." });
            setFullCharacterPrompt('');
            onOpenChange(false);
            router.push('/edit');

        } catch (error) {
            console.error(error);
            toast({ title: "Error al generar el personaje.", description: (error as Error).message, variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="glass-card">
                <DialogHeader>
                    <DialogTitle className="font-space-grotesk text-xl flex items-center gap-2">
                        <Sparkles /> Generación Completa de Personaje
                    </DialogTitle>
                    <DialogDescription>
                        Describe tu idea y la IA creará un personaje completo con descripción, personalidad, escenario y más.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <div>
                        <Label htmlFor="ai-full-gen-prompt-dialog">Tu idea para el personaje</Label>
                        <Textarea
                            id="ai-full-gen-prompt-dialog"
                            placeholder="Ej: Un detective cínico en un mundo cyberpunk que ha perdido su memoria..."
                            value={fullCharacterPrompt}
                            onChange={(e) => setFullCharacterPrompt(e.target.value)}
                            className="mt-2 min-h-[100px]"
                        />
                    </div>
                    
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="advanced-options" className="border-none">
                            <AccordionTrigger className="text-sm p-0 hover:no-underline -mb-2">
                                Opciones Avanzadas
                            </AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="include-lorebook"
                                        checked={includeLorebook}
                                        onCheckedChange={(checked) => setIncludeLorebook(Boolean(checked))}
                                    />
                                    <Label htmlFor="include-lorebook" className="cursor-pointer font-normal">
                                        Generar Lorebook
                                    </Label>
                                </div>

                                <AnimatePresence>
                                {includeLorebook && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="space-y-2 overflow-hidden pt-2"
                                    >
                                        <Label htmlFor="lorebook-entries">Número de entradas ({lorebookEntries})</Label>
                                        <Slider
                                            id="lorebook-entries"
                                            min={1}
                                            max={5}
                                            step={1}
                                            value={[lorebookEntries]}
                                            onValueChange={(value) => setLorebookEntries(value[0])}
                                        />
                                        <p className="text-xs text-muted-foreground">Un máximo de 5 para optimizar costes y rendimiento.</p>
                                    </motion.div>
                                )}
                                </AnimatePresence>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                    <DialogFooter>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="w-full">
                                    <Button onClick={handleGenerate} disabled={isGenerating || !fullCharacterPrompt || isAiDisabled || apiProvider !== 'google'} className="w-full">
                                        {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
                                        Generar Personaje
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            {apiProvider !== 'google' && (
                                <TooltipContent>
                                    <p>Esta función requiere el proveedor Google AI.</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
