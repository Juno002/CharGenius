
"use client";

import { CharacterForm } from "@/components/CharacterForm";
import { CharacterPreview } from "@/components/CharacterPreview";
import { LorebookEditor } from "@/components/LorebookEditor";
import { MobileQuickPreview } from "@/components/MobileQuickPreview";
import { Separator } from "@/components/ui/separator";

export default function EditPage() {
  return (
    <>
      {/* Desktop View */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CharacterForm />
          <Separator />
          <LorebookEditor />
        </div>
        <div className="lg:col-span-1 lg:sticky lg:top-24 h-fit">
          <CharacterPreview />
        </div>
      </div>

      {/* Mobile View */}
      <div className="space-y-6 lg:hidden">
        <CharacterForm />
        <Separator />
        <LorebookEditor />
        <MobileQuickPreview />
      </div>
    </>
  );
}
