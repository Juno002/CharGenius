
"use client";

import { useCharacter, type SavedSenateSession } from "@/context/CharacterContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Trash2, Download, Landmark } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { Textarea } from "./ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Badge } from "./ui/badge";

export function SavedSenateSessions() {
  const { savedSenateSessions, deleteSenateSession } = useCharacter();
  const { toast } = useToast();

  const handleDelete = (sessionId: string) => {
    deleteSenateSession(sessionId);
    toast({ title: "Sesión eliminada", description: `La sesión del senado ha sido eliminada de tu historial.` });
  };
  
  const handleExportTxt = (session: SavedSenateSession) => {
    const title = `Sesión del Senado: ${session.objective}\n`;
    const archetypes = `Arquetipos: ${session.archetypes.map((c: any) => c.name).join(', ')}\n\n`;
    const content = title + archetypes + session.dialogue;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `sesion-senado-${session.id.slice(0, 8)}.txt`);
    toast({ title: "Sesión exportada como TXT." });
  };

  const handleExportMd = (session: SavedSenateSession) => {
    let markdown = `## Sesión del Senado: ${session.objective}\n\n`;
    markdown += `**Arquetipos:** ${session.archetypes.map((c: any) => c.name).join(', ')}\n\n`;
    markdown += `**Fecha:** ${new Date(session.createdAt).toLocaleString()}\n\n`;
    markdown += "---\n\n";

    const formattedDialogue = session.dialogue.replace(/^(.*:)/gm, '**$1**');
    markdown += formattedDialogue;

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    saveAs(blob, `sesion-senado-${session.id.slice(0, 8)}.md`);
    toast({ title: "Sesión exportada como Markdown." });
  };

  const handleExportPdf = (session: SavedSenateSession) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Sesión del Senado`, 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Objetivo: ${session.objective}`, 14, 30);
    doc.text(`Arquetipos: ${session.archetypes.map((c: any) => c.name).join(', ')}`, 14, 38);
    
    (doc as any).autoTable({
        startY: 45,
        head: [['Diálogo de la Sesión']],
        body: session.dialogue.split('\n\n').map(line => [line]),
        theme: 'grid',
        headStyles: { fillColor: [30, 44, 61] },
        styles: { cellPadding: 3, fontSize: 9, overflow: 'linebreak' },
    });

    doc.save(`sesion-senado-${session.id.slice(0, 8)}.pdf`);
    toast({ title: "Sesión exportada como PDF." });
  };

  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-space-grotesk text-2xl">Sesiones del Senado Guardadas</CardTitle>
          <CardDescription>Aquí se guardan todas tus deliberaciones. Revive, comparte o exporta tus sesiones.</CardDescription>
        </CardHeader>
      </Card>
      
      {savedSenateSessions.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Tu galería de sesiones está vacía.</p>
          <p className="text-sm text-muted-foreground">Usa la herramienta del Senado para crear y guardar una sesión.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {[...savedSenateSessions].reverse().map((session) => (
            <Card key={session.id} className="flex flex-col glass-card">
              <CardHeader>
                <CardTitle className="font-space-grotesk text-lg">"{session.objective}"</CardTitle>
                <div className="flex items-center gap-2 pt-2">
                    <span className="text-sm text-muted-foreground">Arquetipos:</span>
                    {session.archetypes.map(arch => (
                        <Badge key={arch.id} variant="secondary">
                            <Landmark className="h-3 w-3 mr-1.5" />
                            {arch.name}
                        </Badge>
                    ))}
                </div>
                 <CardDescription className="text-xs pt-1">
                    Creado: {new Date(session.createdAt).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <Textarea 
                    readOnly
                    value={session.dialogue}
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
                        Esta acción no se puede deshacer. Se eliminará permanentemente esta sesión.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(session.id)}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" />Exportar</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExportTxt(session)}>Como .txt</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportMd(session)}>Como Markdown (.md)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportPdf(session)}>Como PDF</DropdownMenuItem>
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
