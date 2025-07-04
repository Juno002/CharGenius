
"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, Wand2, Users, Film, MessageCircle, Settings, Download, Upload, Users2, BookUser, Palette, SlidersHorizontal, UserCircle2, Sparkles, Cpu, GitBranch, Beaker, Combine, HeartCrack, Microscope, TrendingUp, Puzzle, Plus, BrainCircuit } from "lucide-react"
import Link from "next/link";

export function UserGuide() {
  return (
    <div className="space-y-6">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center gap-3">
            <BookUser className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="font-space-grotesk text-3xl">Guía de Usuario de CharGenius</CardTitle>
              <CardDescription className="mt-1">
                Todo lo que necesitas saber para dominar la creación de personajes con IA.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Accordion type="multiple" defaultValue={['creation']} className="w-full space-y-4">

        <AccordionItem value="creation" className="border-b-0 glass-card overflow-hidden">
          <AccordionTrigger className="p-6 hover:no-underline text-left">
            <div className="flex-1">
              <h2 className="text-2xl font-space-grotesk font-semibold tracking-tight">1. Creación y Edición de Personajes</h2>
              <p className="text-sm text-muted-foreground mt-1.5">El corazón de la aplicación, donde das vida a tus creaciones.</p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-0">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2"><Palette className="h-4 w-4" /> Editor de Personajes</h3>
                <p className="text-sm text-muted-foreground">Un formulario completo y organizado en pestañas para definir cada aspecto de tu personaje:</p>
                <ul className="list-disc list-inside pl-4 mt-2 space-y-1 text-sm">
                  <li><span className="font-semibold">Identidad y Aspecto:</span> Nombre, creador, avatar (subiendo una imagen o URL) y etiquetas (tags).</li>
                  <li><span className="font-semibold">Diálogo y Voz:</span> Su primer mensaje, saludos alternativos, y ejemplos de conversación para definir su forma de hablar.</li>
                   <li><span className="font-semibold">Personalidad:</span> Un campo detallado para sus rasgos, junto con una suite de herramientas de IA para refinarla.</li>
                   <li><span className="font-semibold">Lorebook:</span> Información adicional sobre el mundo, relaciones o eventos importantes.</li>
                   <li><span className="font-semibold">Avanzado:</span> Instrucciones directas para la IA, notas del creador, e información del mundo.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" /> Asistentes de IA en el Formulario</h3>
                 <ul className="list-disc list-inside pl-4 mt-2 space-y-1 text-sm">
                    <li><span className="font-semibold">Generación Directa:</span> Junto a cada campo relevante (Descripción, Escenario, etc.), encontrarás botones para generar contenido con IA.</li>
                    <li><span className="font-semibold">Sugerencias de Personalidad:</span> En la pestaña "Personalidad", usa el menú de "Herramientas IA" para sugerir rasgos o debilidades y enriquecer a tu personaje.</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="ai-suite" className="border-b-0 glass-card overflow-hidden">
          <AccordionTrigger className="p-6 hover:no-underline text-left">
            <div className="flex-1">
              <h2 className="text-2xl font-space-grotesk font-semibold tracking-tight">2. AI Suite: Herramientas Avanzadas</h2>
              <p className="text-sm text-muted-foreground mt-1.5">Pon a prueba, optimiza y desarrolla tus personajes con nuestro conjunto de herramientas inteligentes.</p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-0">
            <div className="space-y-4">
               <div>
                <h3 className="font-semibold flex items-center gap-2">Herramientas en la AI Suite <Sparkles className="h-4 w-4" /></h3>
                <p className="text-sm text-muted-foreground">Accede a la <Link href="/tools" className="text-primary underline">AI Suite</Link> para encontrar un arsenal de herramientas creativas y de análisis:</p>
                <ul className="list-disc list-inside pl-4 mt-2 space-y-2 text-sm">
                    <li><span className="font-semibold">Creación y Generación:</span> Generador Guiado y Generación Completa para dar vida a tus ideas.</li>
                    <li><span className="font-semibold">Interacción y Escenarios:</span> Chat Individual, Chat Grupal y Generador de Escenas para poner a tus personajes en acción.</li>
                    <li><span className="font-semibold">Optimización y Fusión:</span> Edición Inteligente, Fusor de Personajes y Generador de Relaciones para refinar y combinar tus creaciones.</li>
                    <li><span className="font-semibold">Análisis y Desarrollo:</span> Optimizador de Contenido (resumen y redundancia) y Estudio de Desarrollo (arquetipos y arcos narrativos) para añadir profundidad.</li>
                </ul>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="management" className="border-b-0 glass-card overflow-hidden">
          <AccordionTrigger className="p-6 hover:no-underline text-left">
            <div className="flex-1">
              <h2 className="text-2xl font-space-grotesk font-semibold tracking-tight">3. Gestión de Personajes y Contenido</h2>
              <p className="text-sm text-muted-foreground mt-1.5">Todo tu trabajo se guarda de forma segura y es fácil de gestionar.</p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-0">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Galería de Personajes y Escenas</h3>
                <p className="text-sm text-muted-foreground">Todos los personajes y escenas que creas se guardan en sus respectivas galerías. Puedes cargarlos, eliminarlos (individualmente o en lote), o iniciar un chat.</p>
              </div>
              <div>
                <h3 className="font-semibold">Importar y Exportar</h3>
                <p className="text-sm text-muted-foreground">Importa y exporta tus personajes en diferentes formatos. CharGenius es ahora totalmente compatible con las tarjetas V2 de SillyTavern.</p>
                <ul className="list-disc list-inside pl-4 mt-2 space-y-1 text-sm">
                  <li><Download className="inline-block h-4 w-4 mr-1" /> Exportar: Guarda tu personaje como <Badge variant="secondary">.json</Badge> (formato V2), <Badge variant="secondary">.png</Badge> (compatible con SillyTavern V2) o <Badge variant="secondary">.pdf</Badge>.</li>
                  <li><Upload className="inline-block h-4 w-4 mr-1" /> Importar: Carga personajes desde archivos <Badge variant="secondary">.json</Badge> o <Badge variant="secondary">.png</Badge> de SillyTavern.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Menú Rápido (Móvil)</h3>
                <p className="text-sm text-muted-foreground">Usa el botón central <Plus className="inline-block h-4 w-4 bg-primary/10 text-primary rounded-full p-0.5" /> en la barra de navegación inferior para crear un nuevo personaje, generarlo con IA o importar un archivo rápidamente.</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="settings" className="border-b-0 glass-card overflow-hidden">
          <AccordionTrigger className="p-6 hover:no-underline text-left">
            <div className="flex-1">
              <h2 className="text-2xl font-space-grotesk font-semibold tracking-tight">4. Configuración y Personalización</h2>
              <p className="text-sm text-muted-foreground mt-1.5">Adapta la aplicación a tu gusto y necesidades.</p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-0">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold flex items-center gap-2">Gestión de Personas <Users className="h-4 w-4" /></h3>
                <p className="text-sm text-muted-foreground">En lugar de un solo perfil de usuario, ahora puedes crear múltiples "Personas". Cada una puede tener su propio nombre y avatar. En Ajustes, puedes crear, editar, eliminar y seleccionar qué Persona está activa. Los personajes la usarán para referirse a ti en los chats.</p>
              </div>
               <div>
                <h3 className="font-semibold flex items-center gap-2">Control de IA <Bot className="h-4 w-4" /></h3>
                <p className="text-sm text-muted-foreground">Activa o desactiva todas las funciones de IA desde los Ajustes para controlar el consumo de datos y el rendimiento.</p>
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-2">Ajustes de Interfaz <Settings className="h-4 w-4" /></h3>
                <p className="text-sm text-muted-foreground">Puedes cambiar entre múltiples temas, incluyendo oscuro, claro, y los nuevos temas "Hypervisor" y "Cristal Azul".</p>
              </div>
              <div>
                <h3 className="font-semibold">Ajustes de API de IA (Avanzado)</h3>
                <p className="text-sm text-muted-foreground">Si tienes tu propia clave de API de Google AI, puedes introducirla. Para usuarios aún más avanzados, puedes conectar la aplicación a tu propio servidor de IA.</p>
              </div>
               <div>
                <h3 className="font-semibold flex items-center gap-2">Recursos <GitBranch className="h-4 w-4" /></h3>
                <p className="text-sm text-muted-foreground">En la página de ajustes encontrarás enlaces directos a esta guía de usuario y a la <Link href="/roadmap" className="text-primary underline">hoja de ruta del proyecto</Link>.</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

      </Accordion>
    </div>
  )
}
