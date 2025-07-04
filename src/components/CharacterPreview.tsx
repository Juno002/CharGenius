
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { useCharacter } from '@/context/CharacterContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { User, Smile, Sparkles, Code, Contact, Drama, MessageSquare, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/context/LanguageContext';

export function CharacterPreview() {
  const { character, completionScore, previewMode, setPreviewMode } = useCharacter();
  const [isFlipped, setIsFlipped] = useState(false);
  const { t } = useTranslation();

  const isValidAvatar = (avatar?: string) => {
    return avatar && (avatar.startsWith('http') || avatar.startsWith('data:image'));
  };

  const getRarity = (score: number) => {
    if (score === 100) return { name: t('characterPreview.legendary'), border: 'border-yellow-400' };
    if (score >= 75) return { name: t('characterPreview.epic'), border: 'border-purple-500' };
    if (score >= 50) return { name: t('characterPreview.rare'), border: 'border-blue-500' };
    if (score >= 25) return { name: t('characterPreview.uncommon'), border: 'border-green-500' };
    return { name: t('characterPreview.common'), border: 'border-border' };
  };

  const rarity = getRarity(completionScore);
  const name = character.data.name || t('characterPreview.noName');

  // Function to create a cleaner JSON for preview
  const getPreviewJson = () => {
    const { id, completionScore, ...restOfCharacter } = character;
    return JSON.stringify(restOfCharacter, null, 2);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <CardTitle className="font-space-grotesk text-2xl">{t('characterPreview.title')}</CardTitle>
        <div className="flex items-center space-x-1 bg-card/80 p-1 rounded-lg border border-white/10">
          <Button onClick={() => setPreviewMode('card')} variant={previewMode === 'card' ? 'secondary' : 'ghost'} size="sm" className="flex items-center gap-2">
            <Contact />
            {t('characterPreview.cardTab')}
          </Button>
          <Button onClick={() => setPreviewMode('json')} variant={previewMode === 'json' ? 'secondary' : 'ghost'} size="sm" className="flex items-center gap-2">
            <Code />
            {t('characterPreview.jsonTab')}
          </Button>
        </div>
      </div>

      {previewMode === 'card' ? (
        <div className="perspective-1000">
           <motion.div
              className="relative w-full h-[480px] transform-style-preserve-3d"
              onClick={() => setIsFlipped(!isFlipped)}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6 }}
              whileHover={{ scale: 1.02 }}
              style={{ cursor: 'pointer' }}
            >
              {/* Card Front */}
              <div className="absolute w-full h-full backface-hidden">
                <div className={cn("w-full h-full flex flex-col glass-card rounded-lg overflow-hidden border-2", rarity.border)}>
                  <CardHeader className="p-0 relative">
                    <div className="relative h-56 w-full">
                      <Image
                        src={isValidAvatar(character.avatar) ? character.avatar! : `https://placehold.co/600x400.png`}
                        alt={name}
                        fill
                        className="object-cover"
                        data-ai-hint="fantasy character portrait"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      <div className="absolute bottom-0 left-0 p-4 w-full">
                        <div className="flex justify-between items-end">
                          <h2 className="font-space-grotesk text-2xl sm:text-3xl font-bold text-white shadow-lg">{name}</h2>
                          <Badge variant="secondary" className="bg-black/50 text-white border-white/20">{rarity.name}</Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 bg-card/30 flex-grow overflow-y-auto">
                    <div>
                      <h3 className="font-space-grotesk text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><User /> {t('characterPreview.descriptionLabel')}</h3>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{character.data.description || t('characterPreview.noDescription')}</p>
                    </div>
                    <Separator />
                    <div>
                      <h3 className="font-space-grotesk text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><Smile /> {t('characterPreview.personalityLabel')}</h3>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{character.data.personality || t('characterPreview.noPersonality')}</p>
                    </div>
                    <Separator />
                    <div>
                      <h3 className="font-space-grotesk text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><Sparkles /> {t('characterPreview.tagsLabel')}</h3>
                      <div className="flex flex-wrap gap-2">
                        {character.data.tags.length > 0 ? character.data.tags.map((tag, index) => (
                          <Badge key={`${tag}-${index}`} variant="outline">{tag}</Badge>
                        )) : <p className="text-sm text-foreground/90">{t('characterPreview.noTags')}</p>}
                      </div>
                    </div>
                  </CardContent>
                </div>
              </div>

               {/* Card Back */}
              <div
                className="absolute w-full h-full backface-hidden" 
                style={{ transform: 'rotateY(180deg)' }}
              >
                <div className={cn("w-full h-full flex flex-col glass-card rounded-lg overflow-hidden border-2", rarity.border)}>
                   <CardHeader className="bg-background/80 backdrop-blur-sm">
                    <div className="flex justify-between items-center">
                        <CardTitle className="font-space-grotesk text-xl sm:text-2xl text-foreground shadow-lg">{name}</CardTitle>
                        <Badge variant="secondary">{t('characterPreview.moreDetails')}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4 bg-card/30 flex-grow overflow-y-auto">
                     <div>
                        <h3 className="font-space-grotesk text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><User /> {t('characterPreview.creatorLabel')}</h3>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{character.data.creator || t('characterPreview.anonymous')}</p>
                    </div>
                    <Separator />
                    <div>
                        <h3 className="font-space-grotesk text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><Drama /> {t('characterPreview.scenarioLabel')}</h3>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{character.data.scenario || t('characterPreview.noScenario')}</p>
                    </div>
                    <Separator />
                     <div>
                        <h3 className="font-space-grotesk text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><MessageSquare /> {t('characterPreview.firstMessageLabel')}</h3>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap italic break-words">"{character.data.first_mes || t('characterPreview.noFirstMessage')}"</p>
                    </div>
                    <Separator />
                     <div>
                        <h3 className="font-space-grotesk text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"><BookOpen /> {t('characterPreview.dialogueExamplesLabel')}</h3>
                        <p className="text-xs text-foreground/90 whitespace-pre-wrap font-mono bg-black/20 p-2 rounded-md break-words">{character.data.mes_example || t('characterPreview.noDialogueExamples')}</p>
                    </div>
                  </CardContent>
                </div>
              </div>
            </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
            <Card className="h-[480px] glass-card">
                <CardContent className="p-0 h-full">
                    <pre className="h-full w-full overflow-auto text-xs p-4 rounded-lg text-foreground/90 font-mono">
                        {getPreviewJson()}
                    </pre>
                </CardContent>
            </Card>
        </motion.div>
      )}
    </div>
  );
}
