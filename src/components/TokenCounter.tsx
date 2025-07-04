
"use client";

import React, { useEffect, useState } from "react";
import { useCharacter } from "@/context/CharacterContext";
import { countTokens } from "@/lib/tokenizer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info, Cpu } from "lucide-react";
import { Progress } from "./ui/progress";
import { Separator } from "./ui/separator";
import type { TiktokenEncoding } from "@dqbd/tiktoken";
import { Label } from "./ui/label";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const tokenLabels: Record<string, string> = {
    name: 'Nombre',
    description: 'Descripción',
    personality: 'Personalidad',
    scenario: 'Escenario',
    first_mes: 'Primer Mensaje',
    mes_example: 'Ejemplos de Diálogo',
    system_prompt: 'System Prompt',
    post_history_instructions: 'Instrucciones Post-Historial',
    lorebook: 'Lorebook (Total Activo)',
};

const MAX_TOKENS_FOR_BAR = 4096;

export function TokenCounter() {
    const { character, selectedTokenizer } = useCharacter();
    const [mainDisplayTokens, setMainDisplayTokens] = useState(0);
    const [fullBreakdown, setFullBreakdown] = useState<Record<string, number>>({});
    
    useEffect(() => {
        let isMounted = true;

        const calculateAllTokens = async () => {
            if (!character.data) return;
            
            const c = character.data;
            const tempBreakdown: Record<string, number> = {};

            const fieldsToCount: (keyof typeof c | 'post_history_instructions')[] = [
                'name',
                'description',
                'personality',
                'scenario',
                'first_mes',
                'mes_example',
                'system_prompt',
                'post_history_instructions',
            ];

            for (const key of fieldsToCount) {
                const value = c[key as keyof typeof c];
                if (typeof value === 'string' && value) {
                    const count = await countTokens(value, selectedTokenizer as TiktokenEncoding);
                    if (isMounted) tempBreakdown[key] = count;
                }
            }
            
            const lorebookContent = (character.lorebook || [])
                .filter(entry => !entry.disable)
                .map(entry => entry.content)
                .join('\n');
            
            if (lorebookContent) {
                const loreCount = await countTokens(lorebookContent, selectedTokenizer as TiktokenEncoding);
                if (isMounted) tempBreakdown.lorebook = loreCount;
            }
            
            const totalCost = Object.values(tempBreakdown).reduce((sum, current) => sum + current, 0);

            if (isMounted) {
                setMainDisplayTokens(totalCost);
                setFullBreakdown(tempBreakdown);
            }
        };

        calculateAllTokens();

        return () => {
            isMounted = false;
        };
    }, [character, selectedTokenizer]);

    const sortedBreakdown = Object.entries(fullBreakdown)
        .filter(([, value]) => value > 0)
        .sort(([, a], [, b]) => b - a);

    const progressValue = Math.min((mainDisplayTokens / MAX_TOKENS_FOR_BAR) * 100, 100);

    const getBarColor = (tokens: number) => {
        if (tokens > 3000) return 'hsl(var(--destructive))';
        if (tokens > 2000) return 'hsl(var(--accent))';
        return 'hsl(142 90% 40%)';
    };
    
    const barColor = getBarColor(mainDisplayTokens);

    return (
        <div className="w-full space-y-2">
            <Popover>
                <PopoverTrigger asChild>
                    <div className="w-full space-y-2 cursor-pointer pt-2">
                        <div className="flex justify-between items-center text-sm">
                            <span>Coste Total de Contexto: <span className="font-bold ml-1">{mainDisplayTokens}</span></span>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <button type="button" className="flex items-center">
                                       <Info className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">
                                        Estimación usando el tokenizador <span className="font-semibold text-accent">{selectedTokenizer}</span>.
                                        <br />
                                        Haz clic para ver el desglose completo.
                                    </p>
                                </TooltipContent>
                             </Tooltip>
                        </div>
                        <Progress value={progressValue} style={{ '--progress-indicator-color': barColor } as React.CSSProperties} />
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-80 glass-card">
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none flex items-center gap-2"><Cpu /> Desglose de Tokens</h4>
                            <p className="text-sm text-muted-foreground">
                               Coste de cada campo individualmente.
                            </p>
                        </div>
                        {sortedBreakdown.length > 0 ? (
                            <div className="grid gap-2">
                                {sortedBreakdown.map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">{tokenLabels[key] || key}</span>
                                        <span className="font-medium text-sm">{value}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No hay contenido para contar tokens.</p>
                        )}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}
