
"use client";

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { useCharacter } from '@/context/CharacterContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, Download, Trash2, HelpCircle, PlusCircle, RotateCcw, Edit, Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TagInput } from './character/TagInput';
import { Switch } from './ui/switch';
import { saveAs } from 'file-saver';
import { parseCharacterFile, convertToSillyTavernCard } from '@/lib/importExport';
import { Slider } from './ui/slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Separator } from './ui/separator';
import { TokenCounter } from './TokenCounter';
import { TokenCountDisplay } from './character/TokenCountDisplay';
import { useTranslation } from '@/context/LanguageContext';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

const EditableStringList = ({
    value,
    onChange,
    label,
    placeholder
}: {
    value: string[];
    onChange: (newValue: string[]) => void;
    label: string;
    placeholder: string;
}) => {
    const { t } = useTranslation();
    const handleAdd = () => {
        onChange([...(value || []), '']);
    };

    const handleChange = (index: number, text: string) => {
        const newItems = [...(value || [])];
        newItems[index] = text;
        onChange(newItems);
    };

    const handleRemove = (index: number) => {
        const newItems = (value || []).filter((_, i) => i !== index);
        onChange(newItems);
    };

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <div className="space-y-2">
                {(value || []).map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <Input
                            value={item || ''}
                            onChange={(e) => handleChange(index, e.target.value)}
                            placeholder={`${placeholder} ${index + 1}`}
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleRemove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
            </div>
            <Button variant="outline" size="sm" onClick={handleAdd}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('characterForm.addGreetingButton')}
            </Button>
        </div>
    );
};


export function CharacterForm() {
  const { character, updateCharacter, importCharacter, resetCurrentCharacter, importLorebook, isAiDisabled, apiProvider, googleApiKey, googleApiModel } = useCharacter();
  const { toast } = useToast();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  const handleFieldChange = (fieldPath: string, value: any) => {
    updateCharacter( (prevChar) => {
        const newChar = JSON.parse(JSON.stringify(prevChar)); // Deep copy to avoid mutation issues
        let currentLevel: any = newChar.data;
        const keys = fieldPath.split('.');
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!currentLevel[keys[i]]) {
                currentLevel[keys[i]] = {}; // Create nested object if it doesn't exist
            }
            currentLevel = currentLevel[keys[i]];
        }
        
        currentLevel[keys[keys.length - 1]] = value;
        return newChar;
    });
  };
  
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (file.size > 4 * 1024 * 1024) { // 4MB limit
            toast({
                variant: 'destructive',
                title: t('characterForm.fileTooLargeTitle'),
                description: t('characterForm.fileTooLargeDesc'),
            });
            return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            if (result) {
                updateCharacter(c => ({...c, avatar: result}));
                toast({ title: t('characterForm.avatarUpdateSuccess') });
            }
        };
        reader.readAsDataURL(file);
    }
    if(e.target) e.target.value = '';
  };
  
  const handleGenerateAvatar = async () => {
    const { name, description } = character.data;
    if (apiProvider !== 'google') {
        toast({ title: "Función no disponible", description: "La generación de avatares actualmente solo funciona con el proveedor de Google AI.", variant: "destructive" });
        return;
    }
    if (!name && !description) {
      toast({
        title: t('characterForm.avatarGenInfo'),
        description: t('characterForm.avatarGenInfoDesc'),
        variant: 'destructive',
      });
      return;
    }

    if (isAiDisabled || !googleApiKey) {
      toast({ title: "API Key de Google requerida", description: "Por favor, añade tu clave de API en los ajustes para usar esta función.", variant: "destructive" });
      return;
    }
    
    setIsGeneratingAvatar(true);
    try {
        const prompt = `Generate a high quality, detailed portrait of a fantasy character. The image should be a close-up of the character's face, suitable for an avatar. No text, watermarks, or logos.
        Style: digital painting, fantasy art, character concept art.
        Character details: ${name}: ${description}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${googleApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": { "responseMimeType": "application/json" }
            })
        });

        if (!response.ok) throw new Error(`Google API Error: ${response.statusText}`);

        const data = await response.json();
        const base64Data = data.candidates?.[0]?.content?.parts?.[0]?.fileData?.fileUri;

        if (base64Data) {
            updateCharacter(c => ({ ...c, avatar: base64Data }));
            toast({ title: t('characterForm.avatarGenSuccess') });
        } else {
            throw new Error('La IA no devolvió una imagen válida.');
        }

    } catch (error) {
      console.error(error);
      toast({ title: t('characterForm.avatarGenError'), description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleExportJson = () => {
    const sillyTavernCard = convertToSillyTavernCard(character);
    const charBlob = new Blob([JSON.stringify(sillyTavernCard, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    saveAs(charBlob, `${character.data.name?.replace(/ /g, '_') || 'character'}.json`);
    toast({ title: t('characterForm.jsonExportSuccess') });
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        const result = await parseCharacterFile(file);
        
        if (result.type === 'character') {
            importCharacter(result.data);
        } else if (result.type === 'lorebook') {
            importLorebook(result.data);
            toast({ title: t('characterForm.lorebookImportSuccess'), description: t('characterForm.lorebookImportDesc', { count: Object.keys(result.data.entries).length }) });
        } else {
             toast({ title: t('characterForm.unsupportedFileTitle'), description: t('characterForm.unsupportedFileDesc'), variant: "destructive" });
        }
    } catch (error) {
        console.error(error);
        toast({ title: t('characterForm.importErrorTitle'), description: (error as Error).message, variant: 'destructive' });
    } finally {
        if(e.target) e.target.value = '';
    }
  };
  
  const isValidAvatar = (avatar?: string) => {
    return avatar && (avatar.startsWith('http') || avatar.startsWith('data:image'));
  };

  return (
    <>
      <Card className="glass-card mb-6">
        <CardHeader>
            <CardTitle className="font-space-grotesk text-2xl">{t('characterForm.title')}</CardTitle>
            <CardDescription>{t('characterForm.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleImport} variant="outline" className="w-full flex-1">
                  <Upload className="mr-2 h-4 w-4" /> {t('characterForm.importButton')}
                </Button>
                <input type="file" ref={fileInputRef} onChange={handleFileImport} accept="application/json,image/png" className="hidden" />

                <Button onClick={handleExportJson} className="w-full flex-1">
                  <Download className="mr-2 h-4 w-4" /> {t('characterForm.exportButton')}
                </Button>
                
                <Button onClick={resetCurrentCharacter} variant="destructive" className="w-full flex-1">
                  <RotateCcw className="mr-2 h-4 w-4" /> {t('characterForm.resetButton')}
                </Button>
            </div>
            <Separator />
            <TokenCounter />
        </CardContent>
      </Card>
      
      <Accordion type="multiple" defaultValue={['general']} className="w-full space-y-4">
        <AccordionItem value="general" className="border-none">
            <Card className="glass-card">
              <AccordionTrigger className="p-6 text-xl font-space-grotesk hover:no-underline">
                {t('characterForm.generalData')}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-0 space-y-6">
                <div className="flex flex-col sm:flex-row gap-6 items-start pt-4">
                    <div className="shrink-0 space-y-2 w-full max-w-[150px] mx-auto sm:mx-0">
                        <Label>{t('characterForm.avatarLabel')}</Label>
                        <div 
                          onClick={() => avatarInputRef.current?.click()}
                          className="relative group aspect-square w-full rounded-lg overflow-hidden cursor-pointer border-2 border-dashed border-border hover:border-primary transition-all"
                        >
                            <Image
                                src={isValidAvatar(character.avatar) ? character.avatar! : `https://placehold.co/150x150.png`}
                                alt={character.data.name || 'Avatar'}
                                fill
                                className="object-cover bg-muted"
                                data-ai-hint="character face"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Edit className="h-8 w-8 text-white" />
                            </div>
                        </div>
                        <input type="file" ref={avatarInputRef} onChange={handleAvatarUpload} accept="image/png, image/jpeg, image/webp" className="hidden" />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="w-full">
                                    <Button 
                                        onClick={handleGenerateAvatar} 
                                        disabled={isGeneratingAvatar || isAiDisabled || apiProvider !== 'google' || !googleApiKey} 
                                        variant="outline" 
                                        size="sm" 
                                        className="w-full"
                                    >
                                        {isGeneratingAvatar ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                        {t('characterForm.generateAvatarButton')}
                                    </Button>
                                </div>
                            </TooltipTrigger>
                            {apiProvider !== 'google' && (
                                <TooltipContent>
                                    <p>Esta función requiere el proveedor Google AI.</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </div>

                    <div className="flex-grow space-y-4 w-full">
                        <div className="space-y-2">
                            <Label htmlFor="char-name">{t('characterForm.nameLabel')}</Label>
                            <Input id="char-name" placeholder={t('characterForm.namePlaceholder')} value={character.data.name || ''} onChange={e => handleFieldChange('name', e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="char-creator">{t('characterForm.creatorLabel')}</Label>
                            <Input id="char-creator" placeholder={t('characterForm.creatorPlaceholder')} value={character.data.creator || ''} onChange={e => handleFieldChange('creator', e.target.value)} />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="char-tags">{t('characterForm.tagsLabel')}</Label>
                  <TagInput id="char-tags" value={character.data.tags || []} onChange={(tags) => handleFieldChange('tags', tags)} placeholder={t('characterForm.tagsPlaceholder')} />
                </div>
                
                <div className="flex items-start space-x-4 pt-2">
                    <Switch id="char-fav" checked={character.data.extensions.fav} onCheckedChange={val => handleFieldChange('extensions.fav', val)} />
                    <div className="grid gap-0.5">
                      <Label htmlFor="char-fav" className="cursor-pointer">{t('characterForm.favoriteLabel')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('characterForm.favoriteDescription')}
                      </p>
                    </div>
                </div>

                <div className="flex items-start space-x-4 pt-2">
                    <Switch id="char-nsfw" checked={character.data.extensions.nsfw} onCheckedChange={val => handleFieldChange('extensions.nsfw', val)} />
                    <div className="grid gap-0.5">
                      <Label htmlFor="char-nsfw" className="cursor-pointer">{t('characterForm.nsfwLabel')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('characterForm.nsfwDescription')}
                      </p>
                    </div>
                </div>
                
                <div className="space-y-2 pt-2">
                  <Label htmlFor="char-talkativeness">{t('characterForm.talkativenessLabel', { level: Number(character.data.extensions.talkativeness || 0.5).toFixed(2) })}</Label>
                  <Slider
                    id="char-talkativeness"
                    min={0} max={1} step={0.01}
                    value={[Number(character.data.extensions.talkativeness) || 0.5]}
                    onValueChange={val => handleFieldChange('extensions.talkativeness', val[0])}
                  />
                </div>
              </AccordionContent>
            </Card>
        </AccordionItem>
        
        <AccordionItem value="context" className="border-none">
          <Card className="glass-card">
              <AccordionTrigger className="p-6 text-xl font-space-grotesk hover:no-underline">
                {t('characterForm.personalityAndContext')}
              </AccordionTrigger>
              <AccordionContent className="px-6 space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="char-desc">{t('characterForm.descriptionLabel')}</Label>
                        <TokenCountDisplay text={character.data.description} />
                    </div>
                    <Textarea id="char-desc" placeholder={t('characterForm.descriptionPlaceholder')} className="min-h-[9rem] sm:min-h-24 text-base" value={character.data.description || ''} onChange={e => handleFieldChange('description', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="char-personality">{t('characterForm.personalityLabel')}</Label>
                        <TokenCountDisplay text={character.data.personality} />
                    </div>
                    <Textarea id="char-personality" placeholder={t('characterForm.personalityPlaceholder')} className="min-h-[9rem] sm:min-h-24 text-base" value={character.data.personality || ''} onChange={e => handleFieldChange('personality', e.target.value)} />
                </div>
                <div className="space-y-2">
                     <div className="flex justify-between items-center">
                        <Label htmlFor="char-scenario">{t('characterForm.scenarioLabel')}</Label>
                        <TokenCountDisplay text={character.data.scenario} />
                    </div>
                    <Textarea id="char-scenario" placeholder={t('characterForm.scenarioPlaceholder')} className="min-h-[9rem] sm:min-h-24 text-base" value={character.data.scenario || ''} onChange={e => handleFieldChange('scenario', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="char-first-mes">{t('characterForm.firstMessageLabel')}</Label>
                        <TokenCountDisplay text={character.data.first_mes} />
                    </div>
                    <Textarea id="char-first-mes" placeholder={t('characterForm.firstMessagePlaceholder')} className="min-h-[9rem] sm:min-h-24 text-base" value={character.data.first_mes || ''} onChange={e => handleFieldChange('first_mes', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="char-creator-notes">{t('characterForm.creatorNotesLabel')}</Label>
                        <TokenCountDisplay text={character.data.creator_notes} />
                    </div>
                    <Textarea id="char-creator-notes" placeholder={t('characterForm.creatorNotesPlaceholder')} className="min-h-[9rem] sm:min-h-24 text-base" value={character.data.creator_notes || ''} onChange={e => handleFieldChange('creator_notes', e.target.value)} />
                </div>
                 <div className="space-y-2">
                    <Label>{t('characterForm.creationDateLabel')}</Label>
                    <p className="text-sm text-muted-foreground">{new Date(character.data.create_date).toLocaleString()}</p>
                </div>
              </AccordionContent>
          </Card>
        </AccordionItem>

        <AccordionItem value="interactions" className="border-none">
          <Card className="glass-card">
              <AccordionTrigger className="p-6 text-xl font-space-grotesk hover:no-underline">
                {t('characterForm.interactions')}
              </AccordionTrigger>
              <AccordionContent className="px-6 space-y-4">
                 <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="char-mes-example">{t('characterForm.messageExamplesLabel')}</Label>
                        <TokenCountDisplay text={character.data.mes_example} />
                    </div>
                    <Textarea id="char-mes-example" placeholder="<START>
{{user}}: Hola
{{char}}: Adiós" className="min-h-[9rem] sm:min-h-32 font-mono text-base" value={character.data.mes_example || ''} onChange={e => handleFieldChange('mes_example', e.target.value)} />
                </div>
                <EditableStringList
                    label={t('characterForm.altGreetingsLabel')}
                    placeholder={t('characterForm.altGreetingsPlaceholder')}
                    value={character.data.alternate_greetings || []}
                    onChange={val => handleFieldChange('alternate_greetings', val)}
                />
                 <EditableStringList
                    label={t('characterForm.groupGreetingsLabel')}
                    placeholder={t('characterForm.groupGreetingsPlaceholder')}
                    value={character.data.extensions.group_only_greetings || []}
                    onChange={val => handleFieldChange('extensions.group_only_greetings', val)}
                />
              </AccordionContent>
          </Card>
        </AccordionItem>

         <AccordionItem value="advanced" className="border-none">
          <Card className="glass-card">
              <AccordionTrigger className="p-6 text-xl font-space-grotesk hover:no-underline">
                {t('characterForm.advanced')}
              </AccordionTrigger>
              <AccordionContent className="px-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="char-system-prompt">{t('characterForm.systemPromptLabel')}</Label>
                        <TokenCountDisplay text={character.data.system_prompt} />
                    </div>
                    <Textarea id="char-system-prompt" placeholder={t('characterForm.systemPromptPlaceholder')} className="min-h-[9rem] sm:min-h-32 text-base" value={character.data.system_prompt || ''} onChange={e => handleFieldChange('system_prompt', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="char-post-history">{t('characterForm.postHistoryLabel')}</Label>
                        <TokenCountDisplay text={character.data.post_history_instructions} />
                    </div>
                    <Textarea id="char-post-history" placeholder={t('characterForm.postHistoryPlaceholder')} className="min-h-[9rem] sm:min-h-32 text-base" value={character.data.post_history_instructions || ''} onChange={e => handleFieldChange('post_history_instructions', e.target.value)} />
                  </div>
                  <div className="flex gap-4">
                    <div className="space-y-2 flex-1">
                        <Label htmlFor="depth-prompt-depth">{t('characterForm.depthLabel')}</Label>
                        <Input id="depth-prompt-depth" type="number" min="1" max="10" value={character.data.extensions.depth_prompt?.depth || 4} onChange={e => handleFieldChange('extensions.depth_prompt.depth', parseInt(e.target.value))} />
                    </div>
                    <div className="space-y-2 flex-1">
                        <Label htmlFor="depth-prompt-role">{t('characterForm.roleLabel')}</Label>
                        <Input id="depth-prompt-role" value={character.data.extensions.depth_prompt?.role || 'system'} onChange={e => handleFieldChange('extensions.depth_prompt.role', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="depth-prompt-prompt">{t('characterForm.depthPromptLabel')}</Label>
                        <TokenCountDisplay text={character.data.extensions.depth_prompt?.prompt} />
                      </div>
                      <Textarea id="depth-prompt-prompt" placeholder={t('characterForm.depthPromptPlaceholder')} className="min-h-[9rem] sm:min-h-24 text-base" value={character.data.extensions.depth_prompt?.prompt || ''} onChange={e => handleFieldChange('extensions.depth_prompt.prompt', e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="extensions-world">{t('characterForm.worldInfoLabel')}</Label>
                        <TokenCountDisplay text={character.data.extensions.world} />
                    </div>
                    <Textarea id="extensions-world" placeholder={t('characterForm.worldInfoPlaceholder')} className="min-h-[9rem] sm:min-h-32 text-base" value={character.data.extensions.world || ''} onChange={e => handleFieldChange('extensions.world', e.target.value)} />
                  </div>
              </AccordionContent>
          </Card>
        </AccordionItem>
      </Accordion>
    </>
  );
}
