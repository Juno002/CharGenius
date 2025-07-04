
"use client";

import { useState } from "react";
import { useCharacter, type Character } from "@/context/CharacterContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Plus, Home, Sparkles, Wand2, ArrowRight, ArrowLeftRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { InteractiveCharacterCard } from "@/components/InteractiveCharacterCard";
import { CharacterPreview } from "@/components/CharacterPreview";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/context/LanguageContext";
import { motion } from "framer-motion";

const ActionCard = ({ title, description, href, icon }: { title: string, description: string, href: string, icon: React.ReactNode }) => (
    <Link href={href}>
        <Card className="glass-card h-full transition-all hover:border-primary hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-start gap-4">
                <div className="text-primary bg-primary/10 p-3 rounded-lg mt-1">{icon}</div>
                <div>
                    <CardTitle className="text-xl leading-tight break-words">{title}</CardTitle>
                    <CardDescription className="mt-2">{description}</CardDescription>
                </div>
            </CardHeader>
        </Card>
    </Link>
);

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};


export default function HomePage() {
  const { characterHistory, resetCurrentCharacter, character } = useCharacter();
  const router = useRouter();
  const { t } = useTranslation();

  const recentCharacters = [...characterHistory].reverse().slice(0, 5);
  const characterForPreview = character.data.name ? character : recentCharacters[0];

  const handleCreateNew = () => {
    resetCurrentCharacter();
    router.push('/edit');
  };

  return (
    <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Card className="glass-card text-center">
                    <CardHeader>
                        <CardTitle className="font-space-grotesk text-3xl sm:text-4xl flex items-center justify-center gap-3"><Home /> {t('home.welcome')}</CardTitle>
                        <CardDescription className="text-base sm:text-lg">{t('home.description')}</CardDescription>
                    </CardHeader>
                </Card>
            </motion.div>
            
            <section>
                <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
                    <h2 className="text-2xl font-space-grotesk font-bold">{t('home.recentCharacters')}</h2>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/gallery">
                            {t('home.viewFullGallery')} <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
                {recentCharacters.length > 0 ? (
                    <motion.div 
                        className="flex overflow-x-auto snap-x snap-mandatory gap-6 py-4 -mx-4 px-4 scrollbar-hide"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.2 }}
                    >
                        {recentCharacters.map((char) => (
                            <motion.div 
                                key={char.id} 
                                className="w-[300px] sm:w-[320px] aspect-[9/16] snap-center flex-shrink-0"
                                variants={itemVariants}
                            >
                                <InteractiveCharacterCard char={char} />
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center p-8 border-2 border-dashed rounded-lg max-w-lg mx-auto">
                        <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-xl font-semibold">{t('home.emptyGalleryTitle')}</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {t('home.emptyGalleryDesc')}
                        </p>
                        <Button onClick={handleCreateNew} className="mt-6">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('home.createCharacter')}
                        </Button>
                    </div>
                )}
            </section>
            
            <Separator />

            <section>
                <h2 className="text-2xl font-space-grotesk font-bold mb-4">{t('home.quickActions')}</h2>
                <motion.div 
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                >
                    <motion.div variants={itemVariants}>
                      <ActionCard title={t('home.actionCreateTitle')} description={t('home.actionCreateDesc')} href="/edit" icon={<Wand2 />} />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <ActionCard title={t('home.actionSuiteTitle')} description={t('home.actionSuiteDesc')} href="/tools" icon={<Sparkles />} />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                      <ActionCard title={t('home.actionGalleryTitle')} description={t('home.actionGalleryDesc')} href="/gallery" icon={<Users />} />
                    </motion.div>
                     <motion.div variants={itemVariants}>
                      <ActionCard title={t('home.actionImportExportTitle')} description={t('home.actionImportExportDesc')} href="/edit" icon={<ArrowLeftRight />} />
                    </motion.div>
                </motion.div>
            </section>
          </div>
          <div className="hidden lg:block lg:col-span-2">
            <div className="sticky top-24">
               <CharacterPreview />
            </div>
          </div>
        </div>
    </div>
  );
}
