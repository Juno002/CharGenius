
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, FlaskConical, Bot, Combine, Drama, ShieldCheck, Milestone, Building2, Download, Microscope, TrendingUp, BrainCircuit, Swords, Landmark, Globe, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';

const PhaseCard = ({ title, description, badgeText, badgeVariant = 'default', children, icon }: { title: string, description: string, badgeText: string, badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline', children: React.ReactNode, icon: React.ReactNode }) => (
    <Card className="glass-card">
        <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                   <div className="text-primary">{icon}</div>
                   <div>
                        <CardTitle className="font-space-grotesk text-xl">{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                   </div>
                </div>
                <Badge variant={badgeVariant}>{badgeText}</Badge>
            </div>
        </CardHeader>
        <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                {children}
            </ul>
        </CardContent>
    </Card>
);

export default function RoadmapPage() {
    const { toast } = useToast();

    const phases = [
      {
        id: "phase0",
        title: "📜 Fase 0: El Núcleo",
        description: "Las funcionalidades base sobre las que se construyó la aplicación.",
        badge: "Completado",
        items: [
            "Editor de Personajes y Lorebook", "Vista Previa y Contador de Tokens", "Galería de Personajes y Escenas",
            "Importación/Exportación (.json, .png, .pdf)", "Diseño Responsivo (Hypervisor UI)"
        ],
      },
      {
        id: "phase1",
        title: "📜 Fase 1: Asistentes de IA Iniciales",
        description: "Las primeras herramientas de IA que revolucionaron la creación de personajes.",
        badge: "Completado",
        items: [
            "Generadores de IA (descripción, avatar, voz, etc.)", "Autocompletado de Campos", "Edición Inteligente",
            "Soporte API Externa (Google y Custom)"
        ],
      },
       {
        id: "phase2",
        title: "📜 Fase 2: Generador Guiado",
        description: "Un asistente paso a paso para definir los parámetros de la generación de IA.",
        badge: "Completado",
        items: [
          "Asistente paso a paso para la creación de personajes.",
          "Selección de arquetipo, nivel de detalle y campos a generar.",
          "Flujo de IA dinámico que respeta los parámetros del usuario."
        ]
      },
      {
        id: "phase3",
        title: "📜 Fase 3: Simulación Narrativa Dinámica",
        description: "El salto de un editor a un entorno de narrativa interactiva. La IA actúa como 'Director de Escena', orquestando el diálogo entre múltiples personajes.",
        badge: "Completado",
        items: [
          "Interfaz unificada en el Generador de Escenas con prompt y tono.",
          "IA con lógica de 'Dungeon Master' para interacciones realistas entre personajes.",
          "Guardado y exportación de escenas (.txt, .md, .pdf).",
          "Creación de relaciones y memoria persistente a través del lorebook.",
        ]
      },
       {
        id: "phase4",
        title: "📜 Fase 4: Optimización y Análisis Avanzado",
        description: "Herramientas para eficiencia, control de tokens y desarrollo de personajes.",
        badge: "Completado",
        items: [
            'Optimizador de Tokens', 'Fusor de Personajes', 'Reductor de Redundancia', 'Asistente Arquetípico', 'Generador de Arcos Narrativos'
        ],
      },
       {
        id: "phase5",
        title: "🚀 Fase 5: Profundización Narrativa",
        description: "El siguiente gran paso: herramientas para la introspección y la resolución de conflictos internos a través de la narrativa.",
        badge: "Completado",
        items: [
            '**Senado Interno (Completado):** Una herramienta dedicada para generar diálogos dinámicos entre arquetipos internos y resolver conflictos del usuario.',
            '**Modo Observador (Completado):** Permitir que la IA genere escenas sin intervención del usuario.',
            '**Plantillas de Escenarios (Completado):** Escenarios preconfigurados y plantillas estructurales para iniciar escenas rápidamente.',
            '**Exportación Editorial (Completado):** Formatos avanzados como libretos para radio teatro.',
            'Duelos Dialécticos: Modo competitivo entre dos personajes con un objetivo definido.',
            'Análisis Estructural de Escenas: Detectar turnos, balance, "mapa emocional" y evaluar la contribución de cada personaje.',
            'Recuerdos Accionables: Extraer tareas o decisiones clave de una escena para guardarlas en el lorebook.',
            'Comentarios del Director: Insertar notas de narrador para guiar la historia.'
        ],
      },
      {
        id: "phase6",
        title: "🌐 Fase 6: Conectividad Extendida (Horde AI)",
        description: "Integración con servicios de IA distribuidos y comunitarios para ofrecer más modelos y opciones gratuitas.",
        badge: "Completado",
        items: [
            '**Conexión con AI Horde (Completado):** Se ha añadido soporte para usar AI Horde como proveedor de IA para la generación de texto.',
            '**Interfaz de Proveedor (Completado):** Los usuarios pueden ahora elegir su proveedor y configurar la clave de API de Horde.',
            'Gestión de Kudos y rendimiento de la red (Planificado).',
            'Generación de imágenes con Horde (Planificado).',
            'Exploración de otros servicios de IA distribuidos (Planificado).'
        ],
      },
      {
        id: "phase7",
        title: "🛠️ Fase 7: Generación Progresiva y Feedback Visual",
        description: "Mejorar la experiencia de generación mostrando el progreso en vivo y permitiendo el control granular.",
        badge: "Completado",
        items: [
            '**Streaming de Texto (Completado):** Las respuestas de la IA en el chat ahora aparecen palabra por palabra para una mayor fluidez.',
            'Feedback Visual en Tiempo Real: Barra de progreso por bloque y alertas visuales.',
            'Control de Generación: Posibilidad de pausar, continuar y regenerar bloques individuales.'
        ],
      },
      {
        id: "phase8",
        title: "🛡️ Fase 8: Seguridad y Control Parental",
        description: "Garantizar un uso seguro y flexible de la IA.",
        badge: "En Desarrollo",
        items: [
            '**Control de Contenido NSFW (Completado):** Se ha añadido un interruptor por personaje para relajar los filtros de seguridad de la IA.',
            'Configuración Avanzada de API: Ajustes más detallados para la conexión con APIs externas y modelos locales.'
        ],
      },
      {
        id: "phase9",
        title: "📱 Fase 9: Distribución Nativa y Funciones Avanzadas",
        description: "Empaquetar la aplicación con Capacitor para una experiencia nativa en Android/iOS y explorar funciones avanzadas.",
        badge: "Planificado",
        items: [
            'Empaquetado con Capacitor: Convertir la PWA en una app instalable para Android y iOS.',
            'Publicación en App Stores: Preparar la aplicación para una distribución opcional en la Google Play Store.',
            'Integración de API Nativas: Acceder a funciones del dispositivo como TTS avanzado, notificaciones y sistema de archivos.',
            'Exploración de Modelos Locales: Investigar la posibilidad de ejecutar modelos de IA directamente en el dispositivo.'
        ],
      },
    ];

    const phaseIcons: { [key: string]: React.ReactNode } = {
        phase0: <Building2 />,
        phase1: <CheckCircle2 />,
        phase2: <CheckCircle2 />,
        phase3: <Swords />,
        phase4: <CheckCircle2 />,
        phase5: <Landmark />,
        phase6: <Globe />,
        phase7: <Bot />,
        phase8: <ShieldCheck />,
        phase9: <Milestone />,
    };

    const handleExportPdf = () => {
        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.text("Hoja de Ruta de CharGenius", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text("Un registro del progreso y una visión clara del futuro.", 14, 28);

        let yPos = 40;

        const addPhaseSection = (title: string, items: string[], subTitle: string) => {
            if (yPos > 240) { // Add a new page if content overflows
                doc.addPage();
                yPos = 20;
            }
            doc.setFontSize(16);
            doc.text(title, 14, yPos);
            yPos += 5;
            doc.setFontSize(10);
            doc.setTextColor(150);
            const splitSubTitle = doc.splitTextToSize(subTitle, 180);
            doc.text(splitSubTitle, 14, yPos);
            yPos += (splitSubTitle.length * 5) + 2;

            (doc as any).autoTable({
                startY: yPos,
                head: [['Característica']],
                body: items.map(item => [item]),
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] },
                styles: { cellPadding: 2, fontSize: 9, overflow: 'linebreak' },
            });
            yPos = (doc as any).lastAutoTable.finalY + 15;
        };
        
        phases.forEach(phase => {
            addPhaseSection(phase.title, phase.items, phase.description);
        });

        doc.save("CharGenius_Roadmap.pdf");
        toast({ title: 'Hoja de ruta exportada como PDF.' });
    };


  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
             <div>
                 <CardTitle className="font-space-grotesk text-2xl">Hoja de Ruta de CharGenius</CardTitle>
                 <CardDescription>Un registro de nuestro progreso y una visión clara del futuro, organizado por fases de desarrollo.</CardDescription>
             </div>
             <Button onClick={handleExportPdf} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar PDF
             </Button>
          </div>
        </CardHeader>
      </Card>
      
      <div className="space-y-6">
         {phases.map(phase => (
            <PhaseCard
                key={phase.id}
                title={phase.title}
                description={phase.description}
                badgeText={phase.badge}
                badgeVariant={phase.badge === "Completado" ? "secondary" : (phase.badge === "En Desarrollo" ? "default" : "outline")}
                icon={phaseIcons[phase.id] || <FlaskConical />}
            >
                {phase.items.map(item => <li key={item} dangerouslySetInnerHTML={{ __html: item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />)}
            </PhaseCard>
         ))}
      </div>
    </div>
  );
}
