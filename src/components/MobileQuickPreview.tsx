
"use client";

import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { CharacterPreview } from './CharacterPreview';
import { useState } from 'react';
import { motion, type PanInfo } from 'framer-motion';

export function MobileQuickPreview() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-40 lg:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button size="lg" className="rounded-full shadow-lg h-14 w-14 p-0 animate-glow" onClick={() => setIsOpen(true)}>
            <Eye className="h-6 w-6" />
            <span className="sr-only">Vista Previa</span>
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="bottom" 
          className="h-auto max-h-[90vh] flex flex-col p-0 rounded-t-lg"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {/* Draggable Handle */}
          <motion.div
            className="flex-shrink-0 p-4 cursor-grab active:cursor-grabbing"
            onPan={(event, info: PanInfo) => {
              // Dismiss if swiped down with enough velocity or distance
              if (info.offset.y > 100 || info.velocity.y > 500) {
                setIsOpen(false);
              }
            }}
          >
            <div className="mx-auto w-12 h-1.5 rounded-full bg-muted" />
          </motion.div>

          <SheetHeader className="sr-only">
            <SheetTitle>Vista Previa del Personaje</SheetTitle>
            <SheetDescription>
              Una vista previa en tiempo real de cómo se ve la tarjeta de tu personaje mientras lo editas.
            </SheetDescription>
          </SheetHeader>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 pt-0 sm:p-6 sm:pt-0">
              <CharacterPreview />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
