
import type { Character, LoreEntry } from '@/context/CharacterContext';
import { encode as encodeTextChunk } from 'png-chunk-text';
import extractChunks from 'png-chunks-extract';
import encodeChunks from 'png-chunks-encode';
import { v4 as getUUID } from 'uuid';

/**
 * Parses a string into a JSON object safely, returning null on error.
 */
export function parseJSONSafely(text: string): any {
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON", e);
    return null;
  }
}

interface ParsedFileResult {
    type: 'character' | 'lorebook';
    format: 'png' | 'json';
    data: any;
}

/**
 * Parses a character or lorebook file (PNG or JSON) and returns its type and data.
 */
export async function parseCharacterFile(file: File): Promise<ParsedFileResult> {
  const fileName = file.name.toLowerCase();
  const isPng = fileName.endsWith('.png');
  const isJson = fileName.endsWith('.json');

  if (isPng) {
    const buffer = await file.arrayBuffer();
    const chunks = extractChunks(new Uint8Array(buffer));
    const textChunks = chunks.filter(c => c.name === 'tEXt');
    const charaChunk = textChunks.find(c => new TextDecoder().decode(c.data).startsWith('chara\0'));
    
    if (!charaChunk) {
        throw new Error('No se encontró el chunk de metadatos de personaje ("chara") en el PNG.');
    }

    // The tEXt chunk contains keyword, null separator, and text.
    const textContent = new TextDecoder("latin1").decode(charaChunk.data);
    const nullSeparatorIndex = textContent.indexOf('\0');
    const base64JsonString = textContent.substring(nullSeparatorIndex + 1);
    
    // SillyTavern encodes the JSON as Base64, so we must decode it.
    const decodedJsonString = decodeURIComponent(escape(atob(base64JsonString)));
    const characterData = parseJSONSafely(decodedJsonString);
    
    if (!characterData) {
        throw new Error('El JSON embebido en el PNG está corrupto o es inválido.');
    }
    return { type: 'character', format: 'png', data: characterData };
  }

  if (isJson) {
    const rawText = await file.text();
    const parsed = parseJSONSafely(rawText);
    if (!parsed) throw new Error('El archivo JSON es inválido o está corrupto.');

    // Heuristic to detect if it's a lorebook
    if (parsed.entries && (Array.isArray(parsed.entries) || typeof parsed.entries === 'object')) {
      return { type: 'lorebook', format: 'json', data: parsed };
    }

    // Heuristic to detect if it's a character card
    if (parsed.spec || parsed.data?.name || parsed.name) {
       return { type: 'character', format: 'json', data: parsed };
    }
    
    throw new Error('El archivo JSON no parece ser un personaje ni un lorebook válido.');
  }

  throw new Error('Formato de archivo no soportado. Por favor, usa .png o .json.');
}


/**
 * Converts our internal character format to a SillyTavern V2 compatible card.
 * This "hybrid" format keeps the nested `data` object and adds `character_book` at the root,
 * which is the most compatible format for lorebook detection.
 */
export function convertToSillyTavernCard(character: Character): any {
    // Deep copy to avoid modifying the original character state
    const card = JSON.parse(JSON.stringify(character));

    // Remove internal-only fields that shouldn't be exported
    delete card.id;
    delete card.completionScore;

    // Set spec to v2 for base compatibility
    card.spec = 'chara_card_v2';
    card.spec_version = '2.0';
    
    // Map creator_notes to creatorcomment for V2 readers.
    if (card.data.creator_notes) {
        card.data.creatorcomment = card.data.creator_notes;
    }

    // Process lorebook and embed it *inside* the data object
    if (card.lorebook && card.lorebook.length > 0) {
        const lorebookName = `${card.data.name}_lorebook`;

        // The key change: embed character_book within data
        card.data.character_book = {
            name: lorebookName,
            // Map our internal LoreEntry format to the one SillyTavern expects.
            entries: card.lorebook.map((entry: LoreEntry) => ({
                keys: entry.key,
                secondary_keys: entry.keysecondary,
                comment: entry.comment,
                content: entry.content,
                insertion_order: entry.order,
                enabled: !entry.disable,
                constant: entry.constant,
                selective: entry.selective,
                // Adding a few other potentially useful fields for ST
                id: entry.uid,
                position: entry.position === 1 ? 'after_char' : 'before_char',
            }))
        };
        
        // As a good practice, link the book in the world info field.
        card.data.extensions.world = lorebookName;
        
        // CRITICAL: Delete the original `lorebook` array from the root of the card to avoid conflicts.
        delete card.lorebook;
    } else {
        // If there's no lorebook, ensure the world info is clear and the array is gone.
        card.data.extensions.world = '';
        if (card.lorebook) {
            delete card.lorebook;
        }
    }

    // Finally, for maximum compatibility, flatten the data object to the root.
    // This creates the hybrid V2 format that works with many tools.
    // The `data` object itself is preserved, which is what newer importers look for.
    Object.assign(card, card.data);

    return card;
}


/**
 * Exports a character object into a PNG blob with embedded metadata.
 */
export async function exportCharacterAsPng(character: Character, imageBlob: Blob): Promise<Blob> {
    const arrayBuffer = await imageBlob.arrayBuffer();
    const originalChunks = extractChunks(new Uint8Array(arrayBuffer));

    // Remove any existing 'chara' text chunks to prevent duplication
    const chunksWithoutChara = originalChunks.filter(chunk => {
        if (chunk.name !== 'tEXt') return true;
        const textContent = new TextDecoder("latin1").decode(chunk.data);
        return !textContent.startsWith('chara\0');
    });

    const v2Card = convertToSillyTavernCard(character);
    const jsonString = JSON.stringify(v2Card);
    
    // Crucial step: Encode to Base64 to match SillyTavern's format for tEXt chunks.
    const base64EncodedJson = btoa(unescape(encodeURIComponent(jsonString)));

    const textChunk = encodeTextChunk('chara', base64EncodedJson);

    // Find the IEND chunk and insert our metadata chunk right before it.
    const iendChunkIndex = chunksWithoutChara.findIndex(chunk => chunk.name === 'IEND');
    if (iendChunkIndex === -1) {
      throw new Error('El archivo PNG no es válido o está corrupto (falta el chunk IEND).');
    }

    const newChunks = [
      ...chunksWithoutChara.slice(0, iendChunkIndex),
      textChunk,
      ...chunksWithoutChara.slice(iendChunkIndex)
    ];

    const newPngBuffer = encodeChunks(newChunks);
    return new Blob([newPngBuffer], { type: 'image/png' });
}
