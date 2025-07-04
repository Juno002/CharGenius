
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Users, Settings, Sparkles, Plus, Upload, FilePlus2, Edit, Film, MessageCircle, GalleryHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import React, { useState, useEffect, useRef } from 'react';
import { useCharacter } from '@/context/CharacterContext';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from './ui/dropdown-menu';
import { parseCharacterFile } from '@/lib/importExport';
import { FullGenerationDialog } from './FullGenerationDialog';
import { useTranslation } from '@/context/LanguageContext';

export function MobileBottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useTranslation();
    const { resetCurrentCharacter, importCharacter, importLorebook } = useCharacter();
    const [isMounted, setIsMounted] = useState(false);
    const [isGenerationDialogOpen, setIsGenerationDialogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const navItems = [
        { href: '/', label: t('mobileNav.home'), icon: Home, subpaths: ['/gallery', '/character'] },
        { href: '/edit', label: t('mobileNav.editor'), icon: Edit, subpaths: [] },
        { href: '/tools', label: t('mobileNav.suite'), icon: Sparkles, subpaths: ['/group-chat', '/scene-generator', '/intelligent-editor', '/relationship-generator', '/character-merger', '/wizard', '/chat'] },
        { href: '/settings', label: t('mobileNav.settings'), icon: Settings, subpaths: ['/roadmap', '/user-guide'] },
    ];

    useEffect(() => {
        setIsMounted(true);
    }, []);
    
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
            }
        } catch (error) {
            console.error(error);
            toast({ title: t('characterForm.importErrorTitle'), description: (error as Error).message, variant: 'destructive' });
        } finally {
            if(e.target) e.target.value = '';
        }
    };


    const handleNewFromScratch = () => {
        resetCurrentCharacter();
        toast({ title: t('mobileNav.blankSlate'), description: t('mobileNav.blankSlateDesc') });
        if (pathname !== '/edit') router.push('/edit');
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const CentralButton = () => (
        <DropdownMenu>
             <DropdownMenuTrigger asChild>
                <div
                    className="flex flex-col items-center justify-center gap-1 text-xs font-medium text-primary bg-primary/10 rounded-full h-14 w-14 border-2 border-primary/50"
                >
                    <Plus className="h-6 w-6" />
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top" className="mb-2 w-56">
                <DropdownMenuLabel>{t('mobileNav.create')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleNewFromScratch}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('mobileNav.createFromScratch')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsGenerationDialogOpen(true)}>
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    {t('mobileNav.createWithAI')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleImportClick}>
                     <Upload className="mr-2 h-4 w-4" />
                    {t('mobileNav.importFile')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{t('mobileNav.shortcuts')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/gallery">
                        <GalleryHorizontal className="mr-2 h-4 w-4" />
                        {t('mobileNav.goToGallery')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/scene-generator">
                        <Film className="mr-2 h-4 w-4" />
                        {t('mobileNav.createScene')}
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/chat">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        {t('mobileNav.individualChat')}
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    if (!isMounted) {
        return <div className="fixed bottom-0 left-0 right-0 z-20 h-16 md:hidden" />;
    }

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 z-20 border-t bg-background/95 backdrop-blur-sm md:hidden">
                <div className="grid h-16 grid-cols-5 items-center justify-around">
                    {navItems.slice(0, 2).map((item) => {
                         const isActive = item.href === '/'
                            ? (pathname === '/' || item.subpaths.some(p => pathname.startsWith(p)))
                            : (pathname.startsWith(item.href) || item.subpaths.some(p => pathname.startsWith(p)));
                         return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary",
                                    isActive && "text-primary"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </Link>
                         )
                    })}

                    <div className="flex justify-center items-center">
                        <CentralButton />
                    </div>

                    {navItems.slice(2, 4).map((item) => {
                         const isActive = item.href === '/'
                            ? (pathname === '/' || item.subpaths.some(p => pathname.startsWith(p)))
                            : (pathname.startsWith(item.href) || item.subpaths.some(p => pathname.startsWith(p)));
                         return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary",
                                    isActive && "text-primary"
                                )}
                            >
                                <item.icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </Link>
                         )
                    })}
                </div>
            </nav>
            <FullGenerationDialog open={isGenerationDialogOpen} onOpenChange={setIsGenerationDialogOpen} />
            <input type="file" ref={fileInputRef} onChange={handleFileImport} accept="application/json,image/png" className="hidden" />
        </>
    );
}
