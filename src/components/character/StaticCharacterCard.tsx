
import React from 'react';
import Image from 'next/image';
import type { Character } from '@/context/CharacterContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { User, Smile, Sparkles, Drama, MessageSquare } from 'lucide-react';

interface StaticCharacterCardProps {
  character?: Character | null;
  title: string;
}

const isValidAvatar = (avatar?: string) => {
    return avatar && (avatar.startsWith('http') || avatar.startsWith('data:image'));
};

export function StaticCharacterCard({ character, title }: StaticCharacterCardProps) {
  if (!character) {
    return (
      <Card className="h-full min-h-[400px] glass-card">
        <CardHeader>
          <CardTitle className="font-space-grotesk text-xl">{title}</CardTitle>
          <CardDescription>Esperando datos...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-full text-muted-foreground pt-16">
            No hay información para mostrar.
          </div>
        </CardContent>
      </Card>
    );
  }

  const name = character.data.name || 'Personaje sin Nombre';

  return (
    <Card className="h-full flex flex-col min-h-[400px] glass-card">
      <CardHeader>
        <CardTitle className="font-space-grotesk text-xl">{title}</CardTitle>
        <CardDescription>{name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 overflow-y-auto">
        <div className="flex items-center gap-4">
            <Image
                src={isValidAvatar(character.avatar) ? character.avatar! : `https://placehold.co/80x80.png`}
                alt={name}
                width={80}
                height={80}
                className="rounded-lg object-cover border"
                data-ai-hint="character face"
            />
            <div className="flex flex-wrap gap-2 self-start">
                {character.data.tags?.length > 0 ? character.data.tags.map(tag => (
                <Badge key={tag} variant="outline">{tag}</Badge>
                )) : <p className="text-sm text-muted-foreground">Sin etiquetas.</p>}
            </div>
        </div>

        <Separator />
        
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-2"><User /> Descripción</h3>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{character.data.description || "Sin descripción."}</p>
        </div>

        <Separator />

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-2"><Smile /> Personalidad</h3>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{character.data.personality || "Sin personalidad."}</p>
        </div>
        
        <Separator />
        
        <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-2"><Drama /> Escenario</h3>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{character.data.scenario || "Sin escenario."}</p>
        </div>

        <Separator />

        <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-1 flex items-center gap-2"><MessageSquare /> Primer Mensaje</h3>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap italic break-words">"{character.data.first_mes || "Sin primer mensaje."}"</p>
        </div>
      </CardContent>
    </Card>
  );
}
