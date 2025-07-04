
"use client";

import { useState } from "react";
import { useCharacter, type Character } from "@/context/CharacterContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Edit, Eye, FlipVertical } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * --- GALLERY STYLE REPLICATION HINT ---
 * This component is the core of the interactive, flippable character card.
 *
 * Key features for replication:
 * - Framer Motion: A `motion.div` wraps the front and back of the card. The `animate` prop controls the `rotateY`
 *   property based on the `isFlipped` state, creating the 3D flip effect. The parent container needs a `perspective`
 *   style for the 3D effect to be visible.
 * - 3D Transform Style: The wrapper div uses `transform-style-preserve-3d`. The front and back divs use
 *   `backface-hidden` to hide the side that is not facing the camera. The back is pre-rotated by 180 degrees.
 * - Event Handling: An `onClick` handler on the main `motion.div` toggles the `isFlipped` state.
 *   Event propagation is stopped on the buttons on the back of the card to prevent the card from flipping back
 *   when a button is clicked.
 */
export const InteractiveCharacterCard = ({ char, containerClassName }: { char: Character, containerClassName?: string }) => {
    const { loadCharacter, deleteCharacter } = useCharacter();
    const { toast } = useToast();
    const router = useRouter();
    const [isFlipped, setIsFlipped] = useState(false);

    const isValidAvatar = (avatar?: string) => {
        return avatar && (avatar.startsWith('http') || avatar.startsWith('data:image'));
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevents the card from flipping when the button is clicked.
        loadCharacter(char.id!);
        toast({ title: "Personaje cargado", description: "El personaje ha sido cargado en el editor." });
        router.push('/edit');
    };
    
    const handleView = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/character/${char.id}`);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        deleteCharacter(char.id!);
        toast({ title: "Personaje eliminado", description: `"${char.data.name || 'Personaje sin nombre'}" ha sido eliminado de tu historial.` });
    };

    /**
     * --- GALLERY STYLE REPLICATION HINT: Card Front ---
     * This JSX defines the visual appearance of the card's front face.
     * - Image with Gradient: A full-bleed image with a dark gradient overlay at the bottom for text readability.
     * - Text Styling: The character name uses a bold, large, white font (`font-space-grotesk`) for impact.
     * - Flip Icon: An icon is positioned at the top right to visually suggest interactivity.
     */
    const cardContentFront = (
        <div className="absolute w-full h-full backface-hidden">
            <Card className="glass-card h-full overflow-hidden flex flex-col">
                <div className="relative aspect-[3/4] w-full">
                    <Image
                      src={isValidAvatar(char.avatar) ? char.avatar! : `https://placehold.co/300x400.png`}
                      alt={char.data.name}
                      fill
                      className="object-cover"
                      data-ai-hint="character portrait"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                    <div className="absolute bottom-0 p-4 text-white">
                        <h3 className="text-xl sm:text-2xl font-bold font-space-grotesk">{char.data.name || 'Sin nombre'}</h3>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/30 rounded-full p-1.5 backdrop-blur-sm">
                        <FlipVertical className="h-4 w-4 text-white/70"/>
                    </div>
                </div>
                <div className="p-4 bg-card/60 flex-grow flex flex-col justify-between">
                    <p className="text-sm text-muted-foreground line-clamp-3 break-words">
                        {char.data.personality || char.data.description || "Un personaje misterioso te espera."}
                    </p>
                    <p className="text-xs text-muted-foreground text-right mt-2">Haz clic para ver más</p>
                </div>
            </Card>
        </div>
    );
    
    /**
     * --- GALLERY STYLE REPLICATION HINT: Card Back ---
     * This JSX defines the back face of the card.
     * - Layout: Uses standard Card components from ShadCN for a structured layout.
     * - Content: Displays more detailed information like description and tags.
     * - Actions: A `CardFooter` contains the main action buttons (Delete, View, Edit).
     */
    const cardContentBack = (
         <div className="absolute w-full h-full backface-hidden" style={{ transform: 'rotateY(180deg)' }}>
            <Card className="glass-card h-full overflow-hidden flex flex-col">
                <CardHeader>
                    <CardTitle className="font-space-grotesk text-xl">{char.data.name || 'Sin nombre'}</CardTitle>
                    <CardDescription>Actualizado: {new Date(char.data.modification_date).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4 overflow-y-auto">
                    <div>
                        <h4 className="font-semibold text-sm mb-1">Descripción</h4>
                        <p className="text-xs text-muted-foreground line-clamp-6 break-words">{char.data.description || "Sin descripción."}</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-sm mb-1">Etiquetas</h4>
                        <div className="flex flex-wrap gap-1">
                            {char.data.tags?.map((tag: string, index: number) => <Badge key={`${tag}-${index}`} variant="secondary">{tag}</Badge>)}
                            {(!char.data.tags || char.data.tags?.length === 0) && <p className="text-xs text-muted-foreground">Sin etiquetas.</p>}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <AlertDialog onOpenChange={(open) => { if (open) setIsFlipped(true) }}>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon" onClick={(e) => e.stopPropagation()}><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente a "{char.data.name || 'este personaje'}" de tu historial.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <Button onClick={handleView} size="sm" variant="outline"><Eye className="mr-2 h-4 w-4" /> Ver</Button>
                    <Button onClick={handleEdit} size="sm"><Edit className="mr-2 h-4 w-4" /> Editar</Button>
                </CardFooter>
            </Card>
         </div>
    );

    return (
        <div className={cn("w-full h-full perspective-1000", containerClassName)}>
             <motion.div
                className="relative w-full h-full transform-style-preserve-3d"
                onClick={() => setIsFlipped(!isFlipped)}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.5 }}
             >
                {cardContentFront}
                {cardContentBack}
            </motion.div>
        </div>
    );
};
