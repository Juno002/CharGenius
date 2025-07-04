
"use client";
import React, { useState } from 'react';
import { useCharacter, type LoreEntry } from '@/context/CharacterContext';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, ChevronDown, HelpCircle, FileJson } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { TagInput } from './character/TagInput';
import { Slider } from './ui/slider';
import { saveAs } from 'file-saver';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useTranslation } from '@/context/LanguageContext';

const InfoTooltip = ({ text }: { text: string }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <button type="button" className="ml-1 align-middle">
                <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
            </button>
        </TooltipTrigger>
        <TooltipContent className="w-80 glass-card">
            <p className="text-sm">{text}</p>
        </TooltipContent>
    </Tooltip>
);

const LoreEntryForm = ({ 
    entry, 
    onUpdate,
    onDelete, 
}: { 
    entry: LoreEntry, 
    onUpdate: (uid: string, updates: Partial<LoreEntry>) => void,
    onDelete: (uid: string) => void,
}) => {
    const { t } = useTranslation();
    const handleFieldChange = (field: keyof LoreEntry, value: any) => {
        onUpdate(entry.uid, { [field]: value });
    };

    return (
        <div className="space-y-4 p-4">
            <div className="space-y-2">
                <Label htmlFor={`comment-${entry.uid}`}>{t('lorebookEditor.formComment')}</Label>
                <Input id={`comment-${entry.uid}`} placeholder={t('lorebookEditor.formCommentPlaceholder')} value={entry.comment} onChange={e => handleFieldChange('comment', e.target.value)} />
            </div>

            <div className="space-y-2">
                <Label htmlFor={`keys-${entry.uid}`}>{t('lorebookEditor.formKeys')}</Label>
                <TagInput id={`keys-${entry.uid}`} placeholder={t('lorebookEditor.formKeysPlaceholder')} value={entry.key} onChange={val => handleFieldChange('key', val)} />
            </div>

            <div className="space-y-2">
                <Label htmlFor={`content-${entry.uid}`}>{t('lorebookEditor.formContent')}</Label>
                <Textarea id={`content-${entry.uid}`} placeholder={t('lorebookEditor.formContentPlaceholder')} className="min-h-[150px]" value={entry.content} onChange={e => handleFieldChange('content', e.target.value)} />
            </div>
            
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                    <Switch id={`enabled-${entry.uid}`} checked={!entry.disable} onCheckedChange={val => handleFieldChange('disable', !val)} />
                    <Label htmlFor={`enabled-${entry.uid}`}>{t('lorebookEditor.formEnabled')}</Label>
                </div>
                 <div className="flex items-center space-x-2">
                    <Switch id={`constant-${entry.uid}`} checked={entry.constant} onCheckedChange={val => handleFieldChange('constant', val)} />
                    <Label htmlFor={`constant-${entry.uid}`}>{t('lorebookEditor.formConstant')}</Label>
                </div>
                 <div className="flex items-center space-x-2">
                    <Switch id={`selective-${entry.uid}`} checked={entry.selective} onCheckedChange={val => handleFieldChange('selective', val)} />
                    <Label htmlFor={`selective-${entry.uid}`}>{t('lorebookEditor.formSelective')}</Label>
                </div>
            </div>

            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="advanced-settings" className="border-none">
                    <AccordionTrigger className="text-sm p-0 hover:no-underline">
                        {t('lorebookEditor.formAdvanced')}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor={`secondary-keys-${entry.uid}`}>{t('lorebookEditor.formSecondaryKeys')}</Label>
                            <TagInput id={`secondary-keys-${entry.uid}`} placeholder={t('lorebookEditor.formSecondaryKeysPlaceholder')} value={entry.keysecondary} onChange={val => handleFieldChange('keysecondary', val)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor={`order-${entry.uid}`}>{t('lorebookEditor.formOrder')}</Label>
                                <Input id={`order-${entry.uid}`} type="number" value={entry.order} onChange={e => handleFieldChange('order', parseInt(e.target.value))} />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor={`depth-${entry.uid}`}>{t('lorebookEditor.formDepth')}</Label>
                                <Input id={`depth-${entry.uid}`} type="number" min="1" max="10" value={entry.depth} onChange={e => handleFieldChange('depth', parseInt(e.target.value))} />
                            </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`probability-${entry.uid}`}>{t('lorebookEditor.formProbability', { prob: entry.probability })}</Label>
                          <Slider id={`probability-${entry.uid}`} min={0} max={100} step={1} value={[entry.probability]} onValueChange={val => handleFieldChange('probability', val[0])} />
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
             <div className="flex justify-end pt-4">
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('lorebookEditor.formDeleteEntry')}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('lorebookEditor.formConfirmDeleteTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('lorebookEditor.formConfirmDeleteDesc')}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>{t('gallery.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(entry.uid)}>{t('gallery.confirmDeleteButton')}</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
};

export function LorebookEditor() {
    const { character, addLoreEntry, updateLoreEntry, removeLoreEntry } = useCharacter();
    const { toast } = useToast();
    const { t } = useTranslation();

    const handleAddNewEntry = () => {
        const newEntry: Omit<LoreEntry, 'uid'> = {
            key: [], keysecondary: [], comment: 'Nueva Entrada', content: '', constant: false, selective: true,
            order: (character.lorebook?.length || 0) * 10, position: 0, disable: false, 
            displayIndex: (character.lorebook?.length || 0), addMemo: true, group: '',
            groupOverride: false, groupWeight: 100, sticky: 0, cooldown: 0, delay: 0,
            probability: 100, depth: 4, useProbability: true, role: null, vectorized: false,
            excludeRecursion: false, preventRecursion: false, delayUntilRecursion: false,
            scanDepth: null, caseSensitive: null, matchWholeWords: null,
            useGroupScoring: null, automationId: ''
        };
        addLoreEntry(newEntry);
        toast({ title: t('lorebookEditor.newEntryToast') });
    };

    const handleExport = () => {
        if (!character.lorebook || character.lorebook.length === 0) {
            toast({ title: t('lorebookEditor.exportEmptyToast'), variant: "destructive" });
            return;
        }
        
        const exportData = {
            entries: character.lorebook,
            name: `${character.data.name}_lorebook`
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json;charset=utf-8',
        });
        saveAs(blob, `${character.data.name}_lorebook.json`);
        toast({ title: t('lorebookEditor.exportSuccessToast') });
    };

    return (
        <div className="space-y-4">
            <Card className="glass-card">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <h3 className="font-space-grotesk text-xl">{t('lorebookEditor.title')}</h3>
                        <div className="flex gap-2">
                            <Button onClick={handleAddNewEntry} size="sm" variant="outline">
                                <PlusCircle className="mr-2 h-4 w-4" /> {t('lorebookEditor.addEntry')}
                            </Button>
                            <Button onClick={handleExport} size="sm">
                                <FileJson className="mr-2 h-4 w-4" /> {t('lorebookEditor.exportJson')}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {character.lorebook?.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">{t('lorebookEditor.empty')}</p>
                    <Button variant="link" onClick={handleAddNewEntry}>{t('lorebookEditor.emptyAction')}</Button>
                </div>
            ) : (
                <Accordion type="single" collapsible className="w-full space-y-2">
                    {character.lorebook.map(entry => (
                        <AccordionItem key={entry.uid} value={String(entry.uid)} className="border-none">
                            <Card className="glass-card">
                                <AccordionTrigger className="p-4 hover:no-underline">
                                    <div className="flex-1 text-left">
                                        <p className="font-semibold">{entry.comment || t('characterDetail.noEntryComment')}</p>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {entry.key.slice(0, 5).map(k => <span key={k} className="text-xs text-muted-foreground pr-2">{k}</span>)}
                                            {entry.key.length > 5 && <span className="text-xs text-muted-foreground">...</span>}
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <LoreEntryForm entry={entry} onUpdate={updateLoreEntry} onDelete={removeLoreEntry} />
                                </AccordionContent>
                            </Card>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </div>
    );
}
