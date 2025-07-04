
"use client";

import type { Character } from '@/context/CharacterContext';
import { useCharacter } from '@/context/CharacterContext';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Download, Edit, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { exportCharacterAsPng, convertToSillyTavernCard } from '@/lib/importExport';
import { useTranslation } from '@/context/LanguageContext';


const DetailSection = ({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => (
    <Card className="glass-card overflow-hidden">
        <Accordion type="single" collapsible defaultValue={defaultOpen ? "item-1" : undefined}>
            <AccordionItem value="item-1" className="border-b-0">
                <AccordionTrigger className="px-6 hover:no-underline">
                    <h3 className="text-lg font-semibold font-space-grotesk">{title}</h3>
                </AccordionTrigger>
                <AccordionContent className="px-6">
                    <div className="space-y-4 text-sm text-foreground/90 whitespace-pre-wrap">
                        {children || <p className="text-muted-foreground italic">{useTranslation().t('characterDetail.noContent')}</p>}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </Card>
);

export default function CharacterDetailPage() {
    const params = useParams();
    const { characterHistory, loadCharacter } = useCharacter();
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useTranslation();

    // Find the character from history using the ID from the URL params.
    const character = characterHistory.find(c => c.id === params.id);

    if (!character) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold">{t('characterDetail.notFoundTitle')}</h2>
                <p className="text-muted-foreground">{t('characterDetail.notFoundDesc')}</p>
                <Button onClick={() => router.push('/gallery')} className="mt-4">{t('characterDetail.backToGallery')}</Button>
            </div>
        );
    }
    
    const isValidAvatar = (avatar?: string) => {
        return avatar && (avatar.startsWith('http') || avatar.startsWith('data:image'));
    };
    
    const handleEdit = () => {
        if (!character.id) return;
        loadCharacter(character.id);
        toast({ title: t('characterDetail.characterLoaded'), description: t('characterDetail.characterLoadedDesc') });
        router.push('/edit');
    };

    const handleExportJson = () => {
        const sillyTavernCard = convertToSillyTavernCard(character);
        const charBlob = new Blob([JSON.stringify(sillyTavernCard, null, 2)], { type: 'application/json;charset=utf-8' });
        saveAs(charBlob, `${character.data.name.replace(/ /g, '_') || 'character'}.json`);
        toast({ title: t('characterDetail.exportJsonSuccess') });
    };

    const handleExportPng = async () => {
        if (!character.avatar || !isValidAvatar(character.avatar)) {
            toast({ title: t('characterDetail.exportPngErrorAvatar'), variant: 'destructive' });
            return;
        }
        try {
            const response = await fetch(character.avatar);
            if (!response.ok) throw new Error(t('characterDetail.exportPngErrorLoad'));
            const imageBlob = await response.blob();

            const pngBlob = await exportCharacterAsPng(character, imageBlob);
            saveAs(pngBlob, `${character.data.name.replace(/ /g, '_') || 'character'}.card.png`);
            toast({ title: t('characterDetail.exportPngSuccess') });
        } catch (error) {
            console.error(error);
            toast({ title: t('characterDetail.exportPngError'), description: (error as Error).message, variant: 'destructive' });
        }
    };

    const handleExportPdf = () => {
        const doc = new jsPDF();
        const c = character.data;
        const charName = c.name || "Personaje sin nombre";

        doc.setFontSize(22);
        doc.text(charName, 14, 22);

        (doc as any).autoTable({
            startY: 35,
            head: [['Campo', 'Contenido']],
            body: [
                ['Descripción', c.description],
                ['Personalidad', c.personality],
                ['Escenario', c.scenario],
                ['Primer Mensaje', `"${c.first_mes}"`],
                ['Ejemplos de Diálogo', c.mes_example],
                ['System Prompt', c.system_prompt],
                ['World Info', c.extensions.world],
            ],
            theme: 'grid',
            headStyles: { fillColor: [30, 44, 61] }, // #1E2C3D
            styles: { cellPadding: 3, fontSize: 10, overflow: 'linebreak' },
        });

        doc.save(`${charName.replace(/ /g, '_')}.pdf`);
        toast({ title: t('characterDetail.exportPdfSuccess') });
    };


    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <Button variant="outline" onClick={() => router.push('/gallery')}>
                    <ArrowLeft className="mr-2" />
                    {t('characterDetail.backToGallery')}
                </Button>
                <div className="flex items-center gap-2">
                    <Button onClick={handleEdit}>
                        <Edit className="mr-2" />
                        {t('characterDetail.editCharacter')}
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                <Download className="mr-2" /> {t('characterDetail.export')}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleExportJson}>{t('characterDetail.exportAsJson')}</DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportPng}>{t('characterDetail.exportAsPng')}</DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportPdf}>{t('characterDetail.exportAsPdf')}</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Card className="glass-card">
                <CardHeader className="flex flex-col md:flex-row items-start gap-6">
                    <Image
                        src={isValidAvatar(character.avatar) ? character.avatar! : `https://placehold.co/150x150.png`}
                        alt={character.data.name}
                        width={150}
                        height={150}
                        className="rounded-lg object-cover border-2 border-border"
                        data-ai-hint="character face"
                    />
                    <div className="space-y-2 flex-1">
                        <CardTitle className="font-space-grotesk text-4xl">{character.data.name}</CardTitle>
                        <CardDescription>{t('characterDetail.creator', { name: character.data.creator || t('characterDetail.anonymous')})}</CardDescription>
                        <div className="flex flex-wrap gap-2 pt-2">
                            {character.data.tags?.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 gap-6">
                <DetailSection title={t('characterDetail.description')} defaultOpen>{character.data.description}</DetailSection>
                <DetailSection title={t('characterDetail.personality')} defaultOpen>{character.data.personality}</DetailSection>
                <DetailSection title={t('characterDetail.scenario')}>{character.data.scenario}</DetailSection>
                <DetailSection title={t('characterDetail.firstMessage')}><p className="italic">"{character.data.first_mes}"</p></DetailSection>
                
                <DetailSection title={t('characterDetail.altGreetings')}>
                    <ul className="list-disc list-inside space-y-2">
                        {character.data.alternate_greetings?.map((greet, i) => <li key={i} className="italic">"{greet}"</li>)}
                    </ul>
                </DetailSection>

                <DetailSection title={t('characterDetail.dialogueExamples')}>{character.data.mes_example}</DetailSection>
                
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="advanced-view" className="border-none">
                        <AccordionTrigger className="text-xl font-space-grotesk px-0 hover:no-underline">{t('characterDetail.advancedDetails')}</AccordionTrigger>
                        <AccordionContent className="space-y-6 px-0">
                            <DetailSection title={t('characterDetail.systemPrompt')}>{character.data.system_prompt}</DetailSection>
                            <DetailSection title={t('characterDetail.postHistory')}>{character.data.post_history_instructions}</DetailSection>
                            <DetailSection title={t('characterDetail.worldInfo')}>{character.data.extensions.world}</DetailSection>
                            <DetailSection title={t('characterDetail.creatorNotes')}>{character.data.creator_notes}</DetailSection>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <DetailSection title={t('characterDetail.lorebook')}>
                    {character.lorebook?.length > 0 ? (
                        <Accordion type="multiple" className="w-full space-y-2">
                            {character.lorebook.map(entry => (
                                <AccordionItem key={entry.uid} value={`lore-${entry.uid}`} className="bg-muted/50 rounded-lg px-4 border">
                                    <AccordionTrigger>
                                        <div className="flex flex-col items-start text-left">
                                            <span>{entry.comment || t('characterDetail.noEntryComment')}</span>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {entry.key.map(k => <Badge key={k} variant="outline" className="text-xs">{k}</Badge>)}
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>{entry.content}</AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : null}
                </DetailSection>
            </div>
        </div>
    );
}
