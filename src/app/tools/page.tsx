
"use client";

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { 
    Bot, Film, Users2, Cpu, TestTubeDiagonal, Puzzle, Zap, 
    BotMessageSquare, Sparkles, Files, GitCommit, HeartCrack, TrendingUp, Swords, Microscope,
    BookCheck, Speech, Wand, SlidersHorizontal, Settings2, ShieldCheck, Combine, MessageCircle, FilePlus, BrainCircuit, Landmark
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { FullGenerationDialog } from '@/components/FullGenerationDialog';
import React from 'react';
import { useTranslation } from '@/context/LanguageContext';

const ToolCard = ({ title, description, href, icon, enabled, onClick }: { title: string, description: string, href?: string, icon: React.ReactNode, enabled: boolean, onClick?: () => void }) => {
    const cardContent = (
         <Card className={`glass-card h-full transition-all ${enabled ? 'hover:border-primary hover:scale-[1.02]' : ''}`}>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="text-primary">{icon}</div>
                    <div>
                        <CardTitle className="text-lg">{title}</CardTitle>
                        <CardDescription className="mt-1">{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
        </Card>
    );

    if (!enabled) {
        return <div className="block opacity-50 cursor-not-allowed">{cardContent}</div>;
    }
    
    if (onClick) {
        return <button onClick={onClick} className="block w-full text-left">{cardContent}</button>
    }

    return (
        <Link href={href || '#'} className="block">
           {cardContent}
        </Link>
    );
};

const Section = ({ title, description, children }: { title: string, description?: string, children: React.ReactNode}) => (
    <div>
        <h2 className="text-2xl font-space-grotesk font-bold mb-2">{title}</h2>
        {description && <p className="text-muted-foreground mb-4">{description}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {children}
        </div>
    </div>
);

export default function ToolsPage() {
    const [isFullGenOpen, setIsFullGenOpen] = React.useState(false);
    const { t } = useTranslation();
    
    const creationTools = [
        { title: t('tools.toolGuidedGenTitle'), description: t('tools.toolGuidedGenDesc'), icon: <Wand className="h-8 w-8" />, href: '/wizard', enabled: true },
        { title: t('tools.toolFullGenTitle'), description: t('tools.toolFullGenDesc'), icon: <FilePlus className="h-8 w-8" />, onClick: () => setIsFullGenOpen(true), enabled: true },
    ];
    
    const interactionTools = [
        { title: t('tools.toolChatTitle'), description: t('tools.toolChatDesc'), href: '/chat', icon: <MessageCircle className="h-8 w-8" />, enabled: true },
        { title: t('tools.toolGroupChatTitle'), description: t('tools.toolGroupChatDesc'), href: '/scene-generator', icon: <Film className="h-8 w-8" />, enabled: true },
    ];

    const optimizationTools = [
        { title: t('tools.toolIntelligentEditTitle'), description: t('tools.toolIntelligentEditDesc'), href: '/intelligent-editor', icon: <Bot className="h-8 w-8" />, enabled: true },
        { title: t('tools.toolMergerTitle'), description: t('tools.toolMergerDesc'), icon: <Combine className="h-8 w-8" />, href: '/character-merger', enabled: true },
        { title: t('tools.toolRelationshipTitle'), description: t('tools.toolRelationshipDesc'), icon: <GitCommit className="h-8 w-8" />, href: '/relationship-generator', enabled: true },
    ];
    
    const analysisTools = [
        { title: t('tools.toolOptimizerTitle'), description: t('tools.toolOptimizerDesc'), icon: <Zap className="h-8 w-8" />, href: '/token-optimizer', enabled: true },
        { title: t('tools.toolDevelopmentStudioTitle'), description: t('tools.toolDevelopmentStudioDesc'), icon: <BrainCircuit className="h-8 w-8" />, href: '/character-development', enabled: true },
        { title: t('tools.toolSenateTitle'), description: t('tools.toolSenateDesc'), href: '/internal-senate', icon: <Landmark className="h-8 w-8" />, enabled: true },
    ];


    return (
        <>
        <div className="space-y-12">
            <Card className="glass-card text-center">
                <CardHeader>
                    <CardTitle className="font-space-grotesk text-4xl flex items-center justify-center gap-3"><Sparkles /> {t('tools.suiteTitle')}</CardTitle>
                    <CardDescription className="text-base sm:text-lg">
                        {t('tools.suiteDescription')}
                    </CardDescription>
                </CardHeader>
            </Card>

            <Section title={t('tools.sectionCreation')} description={t('tools.sectionCreationDesc')}>
                {creationTools.map(tool => <ToolCard key={tool.title} {...tool} />)}
            </Section>
            
            <Section title={t('tools.sectionInteraction')} description={t('tools.sectionInteractionDesc')}>
                {interactionTools.map(tool => <ToolCard key={tool.title} {...tool} />)}
            </Section>
            
            <Section title={t('tools.sectionOptimization')} description={t('tools.sectionOptimizationDesc')}>
                {optimizationTools.map(tool => <ToolCard key={tool.title} {...tool} />)}
            </Section>
            
            <Section title={t('tools.sectionAnalysis')} description={t('tools.sectionAnalysisDesc')}>
                {analysisTools.map(tool => <ToolCard key={tool.title} {...tool} />)}
            </Section>

        </div>
        <FullGenerationDialog open={isFullGenOpen} onOpenChange={setIsFullGenOpen} />
        </>
    );
}
