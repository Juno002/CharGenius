
"use client";

import { useCharacter, type SavedScene } from "@/context/CharacterContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Trash2, Download } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Textarea } from "./ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import { useTranslation } from "@/context/LanguageContext";


export function SavedScenes() {
  const { savedScenes, deleteScene, personas, activePersonaId } = useCharacter();
  const { toast } = useToast();
  const { t } = useTranslation();

  const activePersonaName = personas.find(p => p.id === activePersonaId)?.name || 'User';

  const handleDelete = (sceneId: string) => {
    deleteScene(sceneId);
    toast({ title: t('gallery.deleteSuccess', { count: 1 }), description: `La escena ha sido eliminada de tu galería.` });
  };
  
  const isValidAvatar = (avatar?: string) => {
    return avatar && (avatar.startsWith('http') || avatar.startsWith('data:image'));
  };

  const handleExportTxt = (scene: SavedScene) => {
    const title = `Escena: ${scene.prompt}\n`;
    const characters = `Personajes: ${scene.characters.map((c: any) => c.name).join(', ')}\n\n`;
    const content = title + characters + scene.dialogue;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `escena-${scene.id.slice(0, 8)}.txt`);
    toast({ title: "Escena exportada como TXT." });
  };

  const handleExportMd = (scene: SavedScene) => {
    let markdown = `## Escena: ${scene.prompt}\n\n`;
    markdown += `> Formato Guionado para lectura teatral o grabación TTS.\n\n`;
    markdown += `**Personajes:** ${scene.characters.map((c: any) => c.name).join(', ')}\n\n`;
    markdown += `**Fecha:** ${new Date(scene.createdAt).toLocaleString()}\n\n`;
    markdown += "---\n\n";

    const sceneWithPersona = scene.dialogue.replace(/^(User:)/gm, `${activePersonaName}:`);
    const formattedScene = sceneWithPersona.replace(/^(.*:)/gm, '**$1**');

    markdown += formattedScene;

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    saveAs(blob, `escena-${scene.id.slice(0, 8)}.md`);
    toast({ title: "Escena exportada como Markdown." });
  };

  const handleExportScript = (scene: SavedScene) => {
    let script = `TÍTULO: ${scene.prompt}\n\n`;
    script += `PERSONAJES:\n`;
    scene.characters.forEach((c: any) => {
        script += `- ${c.name}\n`;
    });
    script += '\n---\n\n';

    const turns = scene.dialogue.replace(/^(User:)/gm, `${activePersonaName}:`).split('\n\n');

    turns.forEach(turn => {
        const parts = turn.split(/:(.*)/s); 
        if (parts.length < 2) {
            script += `${turn}\n\n`;
            return;
        }

        const speaker = parts[0].trim().toUpperCase();
        let content = parts[1].trim();
        
        script += `${speaker}\n`;

        const contentRegex = /(\*.*?\*)|([^*]+)/g;
        let match;
        while ((match = contentRegex.exec(content)) !== null) {
            if (match[1]) { 
                const action = match[1].slice(1, -1).trim();
                script += `(ACCIÓN: ${action})\n`;
            }
            if (match[2]) {
                const dialogue = match[2].trim();
                if (dialogue) {
                    script += `${dialogue}\n`;
                }
            }
        }
        script += '\n';
    });

    const blob = new Blob([script], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `libreto-${scene.id.slice(0, 8)}.txt`);
    toast({ title: "Escena exportada como Libreto." });
  };

  const handleExportPdf = (scene: SavedScene) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Escena: ${scene.prompt}`, 14, 22);

    doc.setFontSize(12);
    doc.text(`Personajes: ${scene.characters.map((c: any) => c.name).join(', ')}`, 14, 30);
    
    doc.setFont("courier");
    const splitText = doc.splitTextToSize(scene.dialogue, 180);
    doc.setFontSize(10);
    doc.text(splitText, 14, 45);

    doc.save(`escena-${scene.id.slice(0, 8)}.pdf`);
    toast({ title: "Escena exportada como PDF." });
  };


  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-space-grotesk text-2xl">Escenas Guardadas</CardTitle>
          <CardDescription>Aquí se guardan todas tus escenas generadas. Revive, comparte o exporta tus momentos favoritos.</CardDescription>
        </CardHeader>
      </Card>
      
      {savedScenes.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Tu galería de escenas está vacía.</p>
          <p className="text-sm text-muted-foreground">Usa el Generador de Escenas para crear y guardar una.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...savedScenes].reverse().map((scene) => (
            <Card key={scene.id} className="flex flex-col glass-card">
              <CardHeader>
                <CardTitle className="font-space-grotesk text-lg">"{scene.prompt}"</CardTitle>
                <div className="flex items-center gap-2 pt-2">
                    <span className="text-sm text-muted-foreground">Personajes:</span>
                    {scene.characters.map(char => (
                        <div key={char.id} className="flex items-center gap-1">
                            <Image
                              src={isValidAvatar(char.avatar) ? char.avatar! : `https://placehold.co/24x24.png`}
                              alt={char.name}
                              width={24}
                              height={24}
                              className="rounded-full object-cover border"
                            />
                            <span className="text-sm font-medium">{char.name}</span>
                        </div>
                    ))}
                </div>
                 <CardDescription className="text-xs pt-1">
                    Creado: {new Date(scene.createdAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <Textarea 
                    readOnly
                    value={scene.dialogue}
                    className="min-h-[200px] font-mono text-xs whitespace-pre-wrap bg-muted/50"
                />
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" />Eliminar</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminará permanentemente esta escena.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(scene.id)}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Exportar</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExportTxt(scene)}>Como .txt</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportMd(scene)}>Como Markdown (.md)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportScript(scene)}>Como Libreto (.txt)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportPdf(scene)}>Como PDF</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
