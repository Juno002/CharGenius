# 🧠 CharGenius – Documentación de Arquitectura

> **Fecha de Auditoría:** 2024-07-30
> **Auditor:** App Prototyper AI
> **Versión del Sistema:** 2.0.0 "Phoenix"

---

## 1. Resumen Ejecutivo

Este documento detalla la arquitectura de la aplicación CharGenius v2. El sistema ha evolucionado de una arquitectura monolítica de IA (basada en flujos de Genkit del lado del servidor) a un **modelo de cliente ligero con proveedores de IA intercambiables**. Este cambio fundamental transfiere el procesamiento de IA al cliente, utilizando la clave de API del propio usuario para conectarse directamente a servicios externos como **Google AI**, **AI Horde** o **endpoints personalizados (compatibles con KoboldAI y OpenAI)**.

Este nuevo enfoque ofrece mayor flexibilidad, escalabilidad y control para el usuario, eliminando la dependencia de una "IA integrada". La gestión de estado se ha optimizado moviendo los datos de avatares a **IndexedDB** (`idb-keyval`), reduciendo drásticamente el uso de memoria y mejorando el rendimiento general.

---

## 2. 🗓️ Registro General de Funciones

### Funciones Principales y Hooks de Contexto

| Nombre de la Función | Tipo | Archivo | Responsable | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `useCharacter` | Hook | `src/context/CharacterContext.tsx` | AI | Hook central para gestionar el estado de la aplicación, incluyendo el personaje actual, historial, escenas, y la configuración del proveedor de IA y las claves de API. |
| `useTranslation` | Hook | `src/context/LanguageContext.tsx` | AI | Hook para acceder a la función de traducción `t()` y gestionar el idioma de la interfaz. |
| `useThemeStore` | Hook | `src/state/useThemeStore.ts` | AI | Hook de Zustand para gestionar y persistir el tema visual de la aplicación. |
| `useToast` | Hook | `src/hooks/use-toast.ts` | AI | Hook para mostrar notificaciones (toasts) en la interfaz de usuario. |
| `useIsMobile` | Hook | `src/hooks/use-mobile.tsx` | AI | Hook de utilidad que devuelve `true` si el ancho de la ventana es menor que el punto de ruptura de 768px. |

### Lógica de Negocio y Utilidades

| Nombre de la Función | Tipo | Archivo | Responsable | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `callCustomApiAction` | Acción Servidor | `src/lib/actions/call-custom-api-action.ts`| AI | Acción de servidor segura que actúa como un **despachador de API**. Recibe una carga útil y la adapta al formato requerido por el endpoint personalizado del usuario (OpenAI o KoboldAI), evitando exponer claves en el cliente. |
| `parseCharacterFile` | Utilidad | `src/lib/importExport.ts` | AI | Parsea archivos `.json` o `.png`, detecta si son personajes o lorebooks, y extrae los datos. Crucial para la importación. |
| `convertToSillyTavernCard` | Utilidad | `src/lib/importExport.ts` | AI | Convierte el estado interno del personaje al formato compatible con SillyTavern. |
| `exportCharacterAsPng` | Utilidad | `src/lib/importExport.ts` | AI | Embebe los metadatos del personaje en un archivo PNG para crear una "tarjeta de personaje" compatible. |
| `countTokens` | Tokenización | `src/lib/tokenizer.ts` | AI | Utiliza `tiktoken` para contar de forma asíncrona el número de tokens en una cadena de texto, según el codificador seleccionado. |

---

## 3. 🧠 Arquitectura de IA: Modelo de Proveedores

La v2 de CharGenius abandona la IA integrada en favor de un sistema de proveedores de IA del lado del cliente. El usuario elige y configura su proveedor preferido en los **Ajustes**.

| Proveedor | Componente que lo Invoca | Cómo Funciona |
| :--- | :--- | :--- |
| **Google AI** | La mayoría de componentes (Chat, Editor Inteligente, etc.) | Utiliza la **clave de API de Google del usuario** para hacer llamadas directas al modelo Gemini a través de su API REST. Es el proveedor recomendado para funciones que requieren un formato de salida estricto (JSON). |
| **AI Horde** | `ChatInterface.tsx` | Se conecta a la red distribuida de AI Horde. Puede funcionar de forma anónima o con la clave del usuario para usar "kudos". Ideal para la generación de texto conversacional. |
| **Custom Endpoint** | `callCustomApiAction.ts` | El usuario proporciona una **URL de API** y opcionalmente una clave. La aplicación detecta si es un formato compatible con **OpenAI** o **KoboldAI** y adapta la llamada. Esto permite usar modelos locales o servicios de terceros. |

---

## 4. 🖱️ Botones y Acciones UI Relevantes

### `ChatInterface.tsx`
| Botón/Elemento | Acción Asociada | Propósito |
| :--- | :--- | :--- |
| **"Enviar"** | Dispara la llamada a la API configurada | Determina el proveedor activo (`Google`, `Horde`, `Custom`) y realiza la llamada `fetch` correspondiente para obtener la respuesta del personaje. |
| **"Resumir Sesión"** | `summarizeChatSession()` | Invoca una llamada a la API de Google para crear un resumen de la conversación y guardarlo como recuerdo en el lorebook. |

### `Settings.tsx`
| Botón/Elemento | Acción Asociada | Propósito |
| :--- | :--- | :--- |
| **Selector de Proveedor** | `setApiProvider()` | Permite al usuario elegir entre Google AI, AI Horde y Custom Endpoint. |
| **Inputs de API** | `setGoogleApiKey()`, `setHordeApiKey()`, etc. | Guardan de forma segura las claves de API del usuario en el `localStorage` del navegador. |
| **"Verificar"** | `verifyGoogleApiKey()` / `verifyCustomApi()` | Realiza una llamada de prueba al endpoint configurado para confirmar que la URL y la clave son válidas, mostrando un indicador de estado. |
| **"Obtener Clave"** | `Link` a Google AI Studio | Facilita al usuario la obtención de su clave de API de Gemini. |

---

## 5. 📦 Dependencias Clave

| Dependencia | Propósito |
| :--- | :--- |
| `next` | Framework principal de la aplicación (React, enrutamiento, renderizado SSR/SSG). |
| `react` | Librería para construir la interfaz de usuario. |
| `idb-keyval` | **(Nuevo)** Librería para interactuar de forma sencilla con IndexedDB. Se utiliza para **almacenar los avatares de los personajes**, separando los datos grandes de los pequeños y mejorando drásticamente el rendimiento. |
| `@radix-ui/*` / `shadcn/ui` | Colección de componentes de UI accesibles y personalizables que forman la base del sistema de diseño. |
| `tailwindcss` | Framework de CSS para estilizar la aplicación. |
| `framer-motion` | Librería para animaciones fluidas en la interfaz de usuario. |
| `zustand` | Gestor de estado ligero, utilizado para `useThemeStore`. |
| `@dqbd/tiktoken` | Librería para el conteo de tokens del lado del cliente. |
| `genkit` / `@genkit-ai/*` | **(En desuso)** Se mantiene como dependencia residual, pero sus flujos han sido reemplazados en su mayoría por llamadas directas a las APIs del lado del cliente. |

---

## 6. 💡 Sugerencias y Observaciones

- **Modelo de Cliente Ligero:** La migración a un modelo de cliente ligero que utiliza las claves del usuario ha sido un éxito. La aplicación es ahora más transparente, flexible y no depende de un backend de IA propietario.
- **Optimización de Datos:** La separación de avatares (a IndexedDB) y metadatos (a `localStorage`) ha resuelto los problemas de alto consumo de memoria y datos, haciendo la aplicación mucho más rápida y escalable.
- **Flujos de IA Obsoletos:** Se ha realizado una limpieza de los antiguos flujos de Genkit que ya no se utilizaban, simplificando la base del código y alineándola con la nueva arquitectura.
- **Experiencia de Usuario en Ajustes:** Se ha mejorado la página de ajustes con indicadores de estado de API en tiempo real y enlaces de ayuda, facilitando la configuración por parte del usuario.

---

## 7. Créditos y Agradecimientos

Muchas de las funcionalidades avanzadas de CharGenius, como el sistema de "Personas", las estrategias de activación de escenas grupales, la memoria semántica y el manejo de fondos de pantalla, fueron inspiradas por la brillante arquitectura y las ideas del proyecto open source **SillyTavern**.

Agradecemos profundamente a sus desarrolladores y a su comunidad por el increíble trabajo que han compartido. Si bien el código de CharGenius es una implementación original y adaptada a nuestra propia tecnología, la inspiración conceptual ha sido invaluable para la evolución de esta aplicación.
#   C h a r G e n i u s  
 