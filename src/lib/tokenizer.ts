
import type { Tiktoken, TiktokenEncoding } from '@dqbd/tiktoken';

// Use a Map to cache initialized encoders. This is more efficient than a single variable
// when we need to support multiple encodings.
const encoders = new Map<string, Tiktoken>();

async function getEncoder(encoding: TiktokenEncoding = 'cl100k_base') {
  if (encoders.has(encoding)) {
    return encoders.get(encoding)!;
  }

  // This check ensures we're on the client side before trying to use the library.
  if (typeof window === 'undefined') {
    // Return a mock encoder for SSR that doesn't do anything.
    // Calculations should only happen client-side.
    return {
      encode: (text: string) => new Uint32Array(Math.round(text.length / 4)),
      decode: (tokens: Uint32Array) => '',
      free: () => {},
    };
  }

  try {
    // Dynamically import to ensure it's a client-side operation.
    const { get_encoding } = await import('@dqbd/tiktoken');
    const newEncoder = get_encoding(encoding);
    encoders.set(encoding, newEncoder);
    return newEncoder;
  } catch (error) {
    console.error(`Failed to initialize tokenizer for encoding '${encoding}'.`, error);
    // Fallback to a simple character-based estimation on failure.
    return {
      encode: (text: string) => new Uint32Array(Math.round(text.length / 4)),
      decode: (tokens: Uint32Array) => '',
      free: () => {},
    };
  }
}

export async function countTokens(text: string | undefined, encoding: TiktokenEncoding = 'cl100k_base'): Promise<number> {
    if (!text) {
        return 0;
    }
    
    const enc = await getEncoder(encoding);
    return enc.encode(text).length;
}
