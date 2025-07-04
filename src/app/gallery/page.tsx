
"use client";

import { useState } from "react";
import { useCharacter, type Character } from "@/context/CharacterContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trash2, Plus, Users, Check, X } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { InteractiveCharacterCard } from "@/components/InteractiveCharacterCard";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/context/LanguageContext";

/**
 * --- GALLERY STYLE REPLICATION HINT ---
 * This is the individual card component displayed in the main gallery grid.
 * Key features for replication:
 * - Framer Motion: `motion.div` is used for layout animations (cards re-flowing) and enter/exit animations (fade-in/scale-up).
 * - Aspect Ratio & Image: The image container has a fixed aspect ratio (`aspect-[3/4]`) to keep cards uniform. The `Image` itself uses `object-cover` to fill this space.
 * - Gradient Overlay: A dark gradient (`bg-gradient-to-t`) is applied over the image to ensure the character name text is always readable.
 * - Conditional Styling: The border color changes based on rarity. In selection mode, a primary color border is used.
 * - Selection Indicator: A checkmark appears when the card is selected in selection mode, animated with `AnimatePresence`.
 */
const GalleryCharacterCard = ({
  char,
  isSelected,
  onSelectToggle,
  onCardClick,
  isSelectionMode,
}: {
  char: Character;
  isSelected: boolean;
  onSelectToggle: (id: string) => void;
  onCardClick: (char: Character) => void;
  isSelectionMode: boolean;
}) => {
  const { t } = useTranslation();
  const { getRarityInfo } = useCharacter();

  const isValidAvatar = (avatar?: string) => {
    return avatar && (avatar.startsWith('http') || avatar.startsWith('data:image'));
  };

  const handleClick = () => {
    if (isSelectionMode) {
      onSelectToggle(char.id!);
    } else {
      onCardClick(char);
    }
  };

  const rarity = getRarityInfo(char.completionScore || 0);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        onClick={handleClick}
        className={cn(
          "group relative overflow-hidden cursor-pointer transition-all duration-300 glass-card hover:scale-105 border-2",
          isSelected ? "border-primary scale-105" : rarity.colorClass
        )}
      >
        <div className="relative aspect-[3/4] w-full">
          <Image
            src={isValidAvatar(char.avatar) ? char.avatar! : `https://placehold.co/300x400.png`}
            alt={char.data.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            data-ai-hint="character portrait"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <h3 className="absolute bottom-2 left-3 text-lg font-bold text-white font-space-grotesk">{char.data.name || t('gallery.noName')}</h3>
        </div>
        <AnimatePresence>
          {isSelectionMode && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-2 right-2 h-6 w-6 rounded-full bg-background/80 border-2 border-primary flex items-center justify-center"
            >
              {isSelected && <Check className="h-4 w-4 text-primary" />}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};


export default function GalleryPage() {
  const { characterHistory, resetCurrentCharacter, deleteMultipleCharacters } = useCharacter();
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // State for the large preview dialog
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  // State to toggle selection mode for batch actions
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const handleCreateNew = () => {
    resetCurrentCharacter();
    router.push('/edit');
  };
  
  const handleSelectToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCardClick = (char: Character) => {
    setSelectedCharacter(char);
  };
  
  const handleDeleteSelected = () => {
    deleteMultipleCharacters(selectedIds);
    toast({ title: t('gallery.deleteSuccess', { count: selectedIds.length }), description: t('gallery.deleteSuccessDesc') });
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  if (characterHistory.length === 0) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center p-8 border-2 border-dashed rounded-lg max-w-md mx-auto">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-xl font-semibold">{t('gallery.emptyTitle')}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    {t('gallery.emptyDescription')}
                </p>
                <Button onClick={handleCreateNew} className="mt-6">
                    <Plus className="mr-2 h-4 w-4" />
                    {t('gallery.createCharacterButton')}
                </Button>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="font-space-grotesk text-2xl">{t('gallery.title')}</CardTitle>
            <CardDescription>{t('gallery.description')}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsSelectionMode(!isSelectionMode)}>
              {isSelectionMode ? <X className="mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
              {isSelectionMode ? t('gallery.cancel') : t('gallery.select')}
            </Button>
            {/* -- STYLE HINT: The delete button appears conditionally with an animation when items are selected. -- */}
            <AnimatePresence>
              {isSelectionMode && selectedIds.length > 0 && (
                <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }}>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                {t('gallery.delete', { count: selectedIds.length })}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>{t('gallery.confirmDeleteTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('gallery.confirmDeleteDesc', { count: selectedIds.length })}
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>{t('gallery.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteSelected}>{t('gallery.confirmDeleteButton')}</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardHeader>
      </Card>
      
      {/* -- STYLE HINT: This is the responsive grid for the character cards. Tailwind CSS classes control the number of columns at different screen sizes. -- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {[...characterHistory].reverse().map((char) => (
          <GalleryCharacterCard
            key={char.id}
            char={char}
            isSelected={selectedIds.includes(char.id!)}
            onSelectToggle={handleSelectToggle}
            onCardClick={handleCardClick}
            isSelectionMode={isSelectionMode}
          />
        ))}
      </div>
      
      {/* -- STYLE HINT: This Dialog displays the full InteractiveCharacterCard for a close-up preview. -- */}
      <Dialog open={!!selectedCharacter} onOpenChange={(isOpen) => !isOpen && setSelectedCharacter(null)}>
        <DialogContent className="w-full max-w-[360px] p-0 border-0 bg-transparent shadow-none">
            <DialogHeader className="sr-only">
              <DialogTitle>{t('gallery.previewTitle')}</DialogTitle>
            </DialogHeader>
            {selectedCharacter && <div className="w-full aspect-[9/16]"><InteractiveCharacterCard char={selectedCharacter} /></div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
