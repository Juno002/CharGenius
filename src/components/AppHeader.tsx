
"use client";

import { useCharacter } from "@/context/CharacterContext";
import { Button } from "./ui/button";
import { RefreshCcw, Trash2 } from "lucide-react";
import { ProgressRing } from "./character/ProgressRing";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Skeleton } from "./ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import { useTranslation } from "@/context/LanguageContext";

export function AppHeader() {
  const { character, completionScore, getMissingFields, undoStack, undo, resetCurrentCharacter, isLoaded } = useCharacter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleUndo = () => {
    if (undoStack.length > 0) {
      undo();
      toast({ title: t('appHeader.undoSuccess') });
    } else {
      toast({ title: t('appHeader.undoFail'), variant: "destructive" });
    }
  };

  const HeaderSkeleton = () => (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-muted px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </header>
  );


  if (!isLoaded) {
    return <HeaderSkeleton />;
  }
  
  const missingFields = getMissingFields(character);

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-4">
        <Popover>
            <PopoverTrigger asChild>
                <div className="cursor-help">
                    <ProgressRing progress={completionScore} size={48} />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 glass-card">
                 {missingFields.length > 0 ? (
                    <div>
                        <p className="font-bold mb-1">{t('appHeader.progressRingTitle')}</p>
                        <p className="text-xs text-muted-foreground mb-2">{t('appHeader.progressRingDesc')}</p>
                        <Separator className="my-2" />
                        <p className="font-semibold mb-2 text-foreground">{t('appHeader.progressRingMissing')}</p>
                        <ul className="list-disc list-inside text-xs space-y-1 text-muted-foreground">
                            {missingFields.map(field => <li key={field}>{field}</li>)}
                        </ul>
                    </div>
                ) : (
                    <div>
                        <p className="font-bold mb-1">{t('appHeader.progressRingCompleteTitle')}</p>
                        <p className="text-xs text-muted-foreground">{t('appHeader.progressRingCompleteDesc')}</p>
                    </div>
                )}
            </PopoverContent>
        </Popover>
        <div>
          <h2 className="text-xl font-bold font-space-grotesk text-foreground">
            {character?.data?.name || t('appHeader.newCharacter')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {completionScore < 25 && t('appHeader.statusStarting')}
            {completionScore >= 25 && completionScore < 50 && t('appHeader.statusTakingShape')}
            {completionScore >= 50 && completionScore < 75 && t('appHeader.statusGoingGreat')}
            {completionScore >= 75 && completionScore < 100 && t('appHeader.statusAlmostPerfect')}
            {completionScore === 100 && t('appHeader.statusMasterpiece')}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={handleUndo} variant="outline" size="sm" disabled={undoStack.length === 0}>
              <RefreshCcw className="h-4 w-4" />
              <span className="max-sm:hidden ml-2">{t('appHeader.undo')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('appHeader.undoTooltip')}</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={resetCurrentCharacter} variant="outline" size="sm">
              <Trash2 className="h-4 w-4" />
              <span className="max-sm:hidden ml-2">{t('appHeader.clear')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('appHeader.clearTooltip')}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}
