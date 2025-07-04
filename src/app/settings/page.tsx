
"use client";

import { KeyRound, Loader2, UserCircle2, BookUser, GitBranch, Edit, Beaker, Bot, Globe, Users, PlusCircle, Image as ImageIcon, Star, Lock, CheckCircle, Link as LinkIcon, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useCharacter } from "@/context/CharacterContext";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import Image from "next/image";
import { ThemeSelector } from "@/components/ui/ThemeSelector";
import { useTranslation } from "@/context/LanguageContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import type { Persona } from "@/context/CharacterContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const PersonaManager = () => {
    const { t } = useTranslation();
    const { 
        personas, activePersonaId, addPersona, updatePersona, deletePersona, setActivePersonaId,
        defaultPersonaId, setDefaultPersona 
    } = useCharacter();
    const { toast } = useToast();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPersona, setEditingPersona] = useState<Partial<Persona> | null>(null);
    
    const handleOpenDialog = (persona?: Persona) => {
        setEditingPersona(persona || { name: '', avatar: '' });
        setIsDialogOpen(true);
    };

    const handleSavePersona = () => {
        if (!editingPersona || !editingPersona.name) {
            toast({ title: t('settings.persona.toast.emptyName'), variant: 'destructive' });
            return;
        }

        if (editingPersona.id) {
            updatePersona(editingPersona as Persona);
            toast({ title: t('settings.persona.toast.updated') });
        } else {
            addPersona({ name: editingPersona.name, avatar: editingPersona.avatar || '' });
            toast({ title: t('settings.persona.toast.created') });
        }
        setIsDialogOpen(false);
        setEditingPersona(null);
    };
    
    const handleSetDefault = (e: React.MouseEvent, personaId: string) => {
        e.stopPropagation();
        setDefaultPersona(personaId);
        toast({ title: t('settings.persona.toast.defaultSet') });
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && editingPersona) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                if (result) {
                    setEditingPersona(p => ({ ...p, avatar: result }));
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {personas.map(persona => (
                    <Card
                        key={persona.id}
                        onClick={() => setActivePersonaId(persona.id)}
                        className={cn("cursor-pointer transition-all relative", 
                            activePersonaId === persona.id ? 'ring-2 ring-primary' : 'hover:border-primary/50',
                            defaultPersonaId === persona.id && 'border-yellow-400'
                        )}
                    >
                         {defaultPersonaId === persona.id && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="absolute top-2 right-2 bg-yellow-400 text-black rounded-full p-1">
                                        <Star className="h-3 w-3" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{t('settings.persona.defaultPersona')}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                        <CardContent className="p-4 flex items-center gap-4">
                            <Image
                                src={persona.avatar || `https://placehold.co/64x64.png`}
                                alt={persona.name}
                                width={64}
                                height={64}
                                className="rounded-full object-cover border"
                            />
                            <div className="flex-grow space-y-2">
                                <p className="font-semibold">{persona.name}</p>
                                <div className="flex flex-wrap gap-2">
                                    <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleOpenDialog(persona); }}>{t('settings.persona.edit')}</Button>
                                    <Button size="sm" variant="outline" onClick={(e) => handleSetDefault(e, persona.id)}>{t('settings.persona.setDefault')}</Button>
                                    <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); deletePersona(persona.id); }}>{t('settings.persona.delete')}</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                 <button
                    onClick={() => handleOpenDialog()}
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg hover:border-primary transition-colors text-muted-foreground hover:text-primary"
                >
                    <PlusCircle className="h-8 w-8" />
                    <span className="mt-2 text-sm font-medium">{t('settings.persona.add')}</span>
                </button>
            </div>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingPersona?.id ? t('settings.persona.editTitle') : t('settings.persona.createTitle')}</DialogTitle>
                        <DialogDescription>{t('settings.persona.dialogDescription')}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                         <div className="flex flex-col items-center gap-2">
                             <Image
                                src={editingPersona?.avatar || `https://placehold.co/96x96.png`}
                                alt="Persona Avatar"
                                width={96}
                                height={96}
                                className="rounded-full object-cover border-2"
                            />
                            <Label htmlFor="persona-avatar-upload" className="text-primary underline cursor-pointer">{t('settings.persona.uploadAvatar')}</Label>
                            <Input id="persona-avatar-upload" type="file" onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                         </div>
                        <div className="space-y-2">
                            <Label htmlFor="persona-name">{t('settings.persona.nameLabel')}</Label>
                            <Input
                                id="persona-name"
                                value={editingPersona?.name || ''}
                                onChange={(e) => setEditingPersona(p => ({ ...p, name: e.target.value }))}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>{t('gallery.cancel')}</Button>
                        <Button onClick={handleSavePersona}>{t('settings.persona.save')}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};


export default function SettingsPage() {
    const { toast } = useToast();
    const { 
        apiProvider, setApiProvider,
        googleApiKey, setGoogleApiKey, googleApiModel, setGoogleApiModel, verifyGoogleApiKey,
        hordeApiKey, setHordeApiKey,
        customApiType, setCustomApiType, customApiUrl, setCustomApiUrl, customApiKey, setCustomApiKey,
        verifyCustomApi,
        selectedTokenizer, setSelectedTokenizer,
        isAiDisabled, setIsAiDisabled,
        language: generationLanguage, setLanguage: setGenerationLanguage,
        isCustomBgEnabled, setIsCustomBgEnabled, customBgUrl, setCustomBgUrl, customBgFitting, setCustomBgFitting
    } = useCharacter();
    
    const { t, language: uiLanguage, setLanguage: setUiLanguage } = useTranslation();

    const [verificationStatus, setVerificationStatus] = useState({
        google: 'idle', // idle, verifying, success, error
        custom: 'idle'
    });

    useEffect(() => {
        const verifyOnLoad = async () => {
            if (apiProvider === 'google' && googleApiKey) {
                setVerificationStatus(s => ({ ...s, google: 'verifying' }));
                const isValid = await verifyGoogleApiKey();
                setVerificationStatus(s => ({ ...s, google: isValid ? 'success' : 'error' }));
            }
            if (apiProvider === 'custom' && customApiUrl) {
                setVerificationStatus(s => ({ ...s, custom: 'verifying' }));
                const isValid = await verifyCustomApi(customApiType, customApiUrl, customApiKey);
                setVerificationStatus(s => ({ ...s, custom: isValid ? 'success' : 'error' }));
            }
        };
        verifyOnLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleVerifyGoogle = async () => {
        if (!googleApiKey) {
            toast({ title: t('settings.googleApi.toast.notFoundTitle'), description: t('settings.googleApi.toast.notFoundDescription'), variant: "destructive" });
            return;
        }
        setVerificationStatus(s => ({ ...s, google: 'verifying' }));
        try {
            const isValid = await verifyGoogleApiKey();
            setVerificationStatus(s => ({ ...s, google: isValid ? 'success' : 'error' }));
            if (isValid) {
                toast({ title: t('settings.googleApi.toast.successTitle'), description: t('settings.googleApi.toast.successDescription'), className: "bg-green-100 dark:bg-green-900 border-green-500 text-green-900 dark:text-green-100" });
            } else {
                 toast({ title: t('settings.googleApi.toast.failTitle'), description: t('settings.googleApi.toast.failDescription'), variant: "destructive" });
            }
        } catch (error) {
            setVerificationStatus(s => ({ ...s, google: 'error' }));
            toast({ title: t('settings.googleApi.toast.networkErrorTitle'), description: `${t('settings.googleApi.toast.networkErrorDescription')} ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
        }
    };
    
    const handleVerifyCustom = async () => {
        if (!customApiUrl) {
            toast({ title: "URL Requerida", description: "Por favor, introduce la URL de tu endpoint personalizado.", variant: "destructive" });
            return;
        }
        setVerificationStatus(s => ({ ...s, custom: 'verifying' }));
        try {
            const isValid = await verifyCustomApi(customApiType, customApiUrl, customApiKey);
            setVerificationStatus(s => ({ ...s, custom: isValid ? 'success' : 'error' }));
            if (isValid) {
                toast({ title: "¡Éxito!", description: "La conexión con tu API personalizada se ha establecido correctamente."});
            } else {
                 toast({ title: "Verificación fallida", description: "No se pudo conectar con el endpoint. Revisa la URL y la clave de API.", variant: "destructive" });
            }
        } catch (error) {
             setVerificationStatus(s => ({ ...s, custom: 'error' }));
             toast({ title: "Error de Red", description: `No se pudo conectar a la API personalizada. ${error instanceof Error ? error.message : ''}`, variant: "destructive" });
        }
    };
    
    const StatusDisplay = ({ status, provider }: { status: string, provider: 'google' | 'custom' }) => {
        if (status === 'idle') return <p className="text-xs text-muted-foreground mt-2">Haz clic en Verificar para probar la conexión.</p>;
        if (status === 'verifying') return <div className="flex items-center text-xs text-muted-foreground mt-2"><Loader2 className="h-4 w-4 mr-2 animate-spin" /><span>Verificando...</span></div>;
        if (status === 'success') return <div className="flex items-center text-xs text-green-500 mt-2"><CheckCircle className="h-4 w-4 mr-2" /><span>Conexión exitosa.</span></div>;
        if (status === 'error') return <div className="flex items-center text-xs text-destructive mt-2"><AlertTriangle className="h-4 w-4 mr-2" /><span>Error de conexión. Revisa la {provider === 'google' ? 'clave' : 'URL'}.</span></div>;
        return null;
    };


    return (
        <div className="space-y-6">
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="font-space-grotesk text-2xl">{t('settings.title')}</CardTitle>
                    <CardDescription>{t('settings.description')}</CardDescription>
                </CardHeader>
            </Card>

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="font-space-grotesk text-2xl flex items-center gap-2"><Bot /> {t('settings.aiControl.title')}</CardTitle>
                    <CardDescription>
                        {t('settings.aiControl.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center space-x-2 rounded-lg border p-4">
                        <Switch id="ai-enabled-switch" checked={!isAiDisabled} onCheckedChange={(checked) => setIsAiDisabled(!checked)} />
                        <Label htmlFor="ai-enabled-switch" className="flex-grow text-base">
                            {isAiDisabled ? t('settings.aiControl.disabled') : t('settings.aiControl.enabled')}
                        </Label>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="font-space-grotesk text-2xl flex items-center gap-2"><Users /> {t('settings.persona.title')}</CardTitle>
                    <CardDescription>
                        {t('settings.persona.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PersonaManager />
                </CardContent>
            </Card>

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="font-space-grotesk">{t('settings.visualTheme.title')}</CardTitle>
                    <CardDescription>{t('settings.visualTheme.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <ThemeSelector />
                </CardContent>
            </Card>

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="font-space-grotesk text-2xl flex items-center gap-2"><ImageIcon /> {t('settings.customBackground.title')}</CardTitle>
                    <CardDescription>{t('settings.customBackground.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2 rounded-lg border p-4">
                        <Switch id="custom-bg-switch" checked={isCustomBgEnabled} onCheckedChange={setIsCustomBgEnabled} />
                        <Label htmlFor="custom-bg-switch" className="flex-grow">{t('settings.customBackground.enableSwitch')}</Label>
                    </div>
                    <div className={cn("space-y-4", !isCustomBgEnabled && "opacity-50 pointer-events-none")}>
                        <div className="space-y-2">
                            <Label htmlFor="custom-bg-url">{t('settings.customBackground.urlLabel')}</Label>
                            <Input
                                id="custom-bg-url"
                                placeholder={t('settings.customBackground.urlPlaceholder')}
                                value={customBgUrl}
                                onChange={(e) => setCustomBgUrl(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="custom-bg-fitting">{t('settings.customBackground.fittingLabel')}</Label>
                             <Select value={customBgFitting} onValueChange={setCustomBgFitting as any}>
                                <SelectTrigger id="custom-bg-fitting">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cover">{t('settings.customBackground.cover')}</SelectItem>
                                    <SelectItem value="contain">{t('settings.customBackground.contain')}</SelectItem>
                                    <SelectItem value="stretch">{t('settings.customBackground.stretch')}</SelectItem>
                                    <SelectItem value="center">{t('settings.customBackground.center')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="font-space-grotesk text-2xl flex items-center gap-2"><Globe /> {t('settings.uiLanguage.title')}</CardTitle>
                    <CardDescription>
                       {t('settings.uiLanguage.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="ui-language-select">{t('settings.language')}</Label>
                        <Select value={uiLanguage} onValueChange={(value) => setUiLanguage(value as 'es' | 'en')}>
                            <SelectTrigger id="ui-language-select" className="w-full md:w-1/2">
                                <SelectValue placeholder={t('settings.selectLanguage')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="es">{t('settings.spanish')}</SelectItem>
                                <SelectItem value="en">{t('settings.english')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="font-space-grotesk text-2xl flex items-center gap-2"><Globe /> {t('settings.generationLanguage.title')}</CardTitle>
                    <CardDescription>
                        {t('settings.generationLanguage.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="language-select">{t('settings.language')}</Label>
                        <Select value={generationLanguage} onValueChange={setGenerationLanguage}>
                            <SelectTrigger id="language-select" className="w-full md:w-1/2">
                                <SelectValue placeholder={t('settings.selectLanguage')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="es">{t('settings.spanish')}</SelectItem>
                                <SelectItem value="en">{t('settings.english')}</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {t('settings.generationLanguage.tooltip')}
                        </p>
                    </div>
                </CardContent>
            </Card>


            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="font-space-grotesk text-2xl flex items-center gap-2"><Beaker /> {t('settings.tokenCalibration.title')}</CardTitle>
                    <CardDescription>
                        {t('settings.tokenCalibration.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label htmlFor="tokenizer-select">{t('settings.tokenCalibration.label')}</Label>
                        <Select value={selectedTokenizer} onValueChange={setSelectedTokenizer}>
                            <SelectTrigger id="tokenizer-select">
                                <SelectValue placeholder={t('settings.selectLanguage')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cl100k_base">OpenAI / Gemini (cl100k)</SelectItem>
                                <SelectItem value="p50k_base">Legacy OpenAI (p50k)</SelectItem>
                                <SelectItem value="gpt2">Llama / Kobold (gpt2)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {t('settings.tokenCalibration.tooltip')}
                        </p>
                    </div>
                </CardContent>
            </Card>
            
            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="font-space-grotesk text-2xl flex items-center gap-2"><KeyRound /> {t('settings.apiProvider.title')}</CardTitle>
                    <CardDescription>{t('settings.apiProvider.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2 mb-6">
                        <Label htmlFor="api-provider-select">{t('settings.apiProvider.selectLabel')}</Label>
                        <Select value={apiProvider} onValueChange={(value) => setApiProvider(value as any)}>
                            <SelectTrigger id="api-provider-select" className="w-full md:w-1/2">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="google">{t('settings.apiProvider.google')}</SelectItem>
                                <SelectItem value="horde">{t('settings.apiProvider.horde')}</SelectItem>
                                <SelectItem value="custom">Custom Endpoint (OpenAI/Kobold)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Accordion type="single" collapsible className="w-full" value={`${apiProvider}-settings`}>
                        <AccordionItem value="google-settings">
                            <AccordionTrigger>{t('settings.googleApi.accordionTrigger')}</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="google-api-key">{t('settings.googleApi.keyLabel')}</Label>
                                    <Input id="google-api-key" type="password" placeholder={t('settings.googleApi.keyPlaceholder')} value={googleApiKey} onChange={(e) => { setGoogleApiKey(e.target.value); setVerificationStatus(s => ({...s, google: 'idle'})); }}/>
                                    <StatusDisplay status={verificationStatus.google} provider="google" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="google-api-model">{t('settings.googleApi.modelLabel')}</Label>
                                    <Select value={googleApiModel} onValueChange={setGoogleApiModel}>
                                        <SelectTrigger id="google-api-model"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="gemini-1.5-pro-latest">gemini-1.5-pro-latest</SelectItem>
                                            <SelectItem value="gemini-pro">{t('settings.googleApi.modelRecommended')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">{t('settings.googleApi.modelTooltip')}</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                     <Button asChild variant="outline" className="w-full">
                                        <Link href="https://aistudio.google.com/app/apikey" target="_blank">
                                            <LinkIcon className="mr-2 h-4 w-4" />
                                            Obtener Clave
                                        </Link>
                                    </Button>
                                    <Button onClick={handleVerifyGoogle} disabled={verificationStatus.google === 'verifying'} className="w-full">
                                        {verificationStatus.google === 'verifying' ? <Loader2 className="animate-spin" /> : "Verificar"}
                                    </Button>
                                </div>
                                <div className="text-sm text-muted-foreground space-y-2 pt-2">
                                    <h4 className="font-semibold text-foreground">{t('settings.googleApi.important')}</h4>
                                    <p>{t('settings.googleApi.importantText1')}</p>
                                    <p>{t('settings.googleApi.importantText2')}</p>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="horde-settings">
                            <AccordionTrigger>{t('settings.horde.accordionTrigger')}</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                               <p className="text-sm text-muted-foreground">{t('settings.horde.description')}</p>
                                <div className="space-y-2">
                                    <Label htmlFor="horde-api-key">{t('settings.horde.apiKeyLabel')}</Label>
                                    <div className="flex gap-2">
                                        <Input id="horde-api-key" type="password" placeholder={t('settings.horde.apiKeyPlaceholder')} value={hordeApiKey} onChange={(e) => setHordeApiKey(e.target.value)} className="flex-grow"/>
                                        <Button onClick={() => window.open('https://stablehorde.net/register', '_blank')} variant="outline">
                                            {t('settings.horde.checkInfo')}
                                        </Button>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                        <AccordionItem value="custom-settings">
                            <AccordionTrigger>Configure Custom Endpoint</AccordionTrigger>
                            <AccordionContent className="space-y-4 pt-4">
                               <p className="text-sm text-muted-foreground">Conecta un modelo de IA local (KoboldAI, Ollama) o cualquier servicio compatible con la API de OpenAI.</p>
                                <div className="space-y-2">
                                    <Label htmlFor="custom-api-type">Tipo de API</Label>
                                    <Select value={customApiType} onValueChange={val => { setCustomApiType(val as any); setVerificationStatus(s => ({...s, custom: 'idle'})); }}>
                                        <SelectTrigger id="custom-api-type"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="openai">OpenAI-Compatible</SelectItem>
                                            <SelectItem value="kobold">KoboldAI / Local</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="custom-api-url">URL del Endpoint</Label>
                                    <Input id="custom-api-url" placeholder="http://127.0.0.1:5000/api/v1/generate" value={customApiUrl} onChange={(e) => { setCustomApiUrl(e.target.value); setVerificationStatus(s => ({...s, custom: 'idle'})); }} />
                                    <StatusDisplay status={verificationStatus.custom} provider="custom" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="custom-api-key">API Key (si es requerida)</Label>
                                    <Input id="custom-api-key" type="password" placeholder="sk-..." value={customApiKey} onChange={(e) => { setCustomApiKey(e.target.value); setVerificationStatus(s => ({...s, custom: 'idle'})); }} />
                                </div>
                                 <Button onClick={handleVerifyCustom} disabled={verificationStatus.custom === 'verifying'} className="w-full">
                                    {verificationStatus.custom === 'verifying' ? <Loader2 className="animate-spin" /> : "Verificar Conexión"}
                                 </Button>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>

            <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="font-space-grotesk text-2xl flex items-center gap-2">{t('settings.resources.title')}</CardTitle>
                    <CardDescription>
                        {t('settings.resources.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button asChild variant="outline" className="w-full justify-start text-left">
                        <Link href="/user-guide">
                            <BookUser className="mr-2 h-4 w-4" />
                            {t('settings.resources.userGuide')}
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start text-left">
                        <Link href="/roadmap">
                            <GitBranch className="mr-2 h-4 w-4" />
                            {t('settings.resources.roadmap')}
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
