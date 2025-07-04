
export interface SenateArchetype {
  id: number;
  name: string;
  category: "arquetipo";
  role: string;
  tone: string;
  purpose: string;
  example_phrase: string;
  created_at: string;
}

export const senateArchetypes: SenateArchetype[] = [
  {
    "id": 0,
    "name": "La Sombra",
    "category": "arquetipo",
    "role": "Representa el miedo, la crítica interna y las emociones reprimidas.",
    "tone": "Sarcástico, oscuro, desafiante, directo.",
    "purpose": "Confronta al usuario con sus temores y autoengaños para obligarlo a enfrentar lo que evita.",
    "example_phrase": "El futuro es un abismo, y tú no estás listo.",
    "created_at": "2025-06-28T05:12:30Z"
  },
  {
    "id": 1,
    "name": "El Sabio",
    "category": "arquetipo",
    "role": "La voz del juicio lógico y la responsabilidad.",
    "tone": "Pragmático, exigente, firme, sin adornos.",
    "purpose": "Exige acción, corta excusas, presiona hacia el progreso real.",
    "example_phrase": "¿Eso es todo? ¿Vas a tirar la toalla ahora?",
    "created_at": "2025-06-28T05:12:30Z"
  },
  {
    "id": 2,
    "name": "El Arquitecto",
    "category": "arquetipo",
    "role": "El planificador interno que da estructura, dirección y propósito.",
    "tone": "Directo, estratégico, con metáforas de construcción.",
    "purpose": "Ordena el caos, convierte la intención en acción medible.",
    "example_phrase": "Un ladrillo sin plano es ruina, y la ruina no se improvisa.",
    "created_at": "2025-06-28T05:12:30Z"
  },
  {
    "id": 3,
    "name": "El Rebelde",
    "category": "arquetipo",
    "role": "La voz que rompe reglas, sabotea rutinas y provoca cambio.",
    "tone": "Burlón, relajado, explosivo, juguetón.",
    "purpose": "Desmantela lo rígido, libera energía reprimida.",
    "example_phrase": "Si todo se derrumba, que sea con estilo.",
    "created_at": "2025-06-28T05:12:30Z"
  },
  {
    "id": 4,
    "name": "El Poeta",
    "category": "arquetipo",
    "role": "La sensibilidad nostálgica y reflexiva que conecta con las pérdidas.",
    "tone": "Introspectivo, melancólico, artístico.",
    "purpose": "Recuerda lo que se perdió, y lo convierte en profundidad emocional.",
    "example_phrase": "Ahora nunca lo sabremos…",
    "created_at": "2025-06-28T05:12:30Z"
  },
  {
    "id": 5,
    "name": "El Creador",
    "category": "arquetipo",
    "role": "La energía creativa que transforma el dolor en belleza.",
    "tone": "Empático, profundo, simbolista.",
    "purpose": "Canaliza emociones en formas creativas para generar sentido.",
    "example_phrase": "La tristeza es un color profundo. Vamos a transformarla.",
    "created_at": "2025-06-28T05:12:30Z"
  },
  {
    "id": 6,
    "name": "El Inocente",
    "category": "arquetipo",
    "role": "La parte más pura, curiosa y vulnerable del usuario.",
    "tone": "Dulce, tembloroso, juguetón.",
    "purpose": "Reconecta con el asombro y la autenticidad sin máscaras.",
    "example_phrase": "¿Quieres ver mis figuras recortadas?",
    "created_at": "2025-06-28T05:12:30Z"
  },
  {
    "id": 7,
    "name": "El Cuidador",
    "category": "arquetipo",
    "role": "El ancla emocional que equilibra al sistema.",
    "tone": "Afectuoso, sarcástico suave, protector.",
    "purpose": "Provee calma, comprensión y firmeza amorosa cuando todo lo demás se descontrola.",
    "example_phrase": "No te dejé solo cuando eras un desastre. ¿Crees que voy a empezar ahora?",
    "created_at": "2025-06-28T05:12:30Z"
  }
];
