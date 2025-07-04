
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { v4 as getUUID } from 'uuid';
import { get, set, del } from 'idb-keyval';
import { useToast } from '@/hooks/use-toast';
import type { SenateArchetype } from '@/lib/senate-archetypes';
import { useTranslation } from './LanguageContext';

// --- Types ---
export interface PersonaConnection {
  characterId: string;
}

export interface Persona {
  id: string;
  name: string;
  avatar: string;
  connections?: PersonaConnection[];
}

export interface LoreEntry {
  uid: string;
  key: string[];
  keysecondary: string[];
  comment: string;
  content: string;
  constant: boolean;
  selective: boolean;
  order: number;
  position: number;
  disable: boolean;
  displayIndex: number;
  addMemo: boolean;
  group: string;
  groupOverride: boolean;
  groupWeight: number;
  sticky: number;
  cooldown: number;
  delay: number;
  probability: number;
  depth: number;
  useProbability: boolean;
  role: null;
  vectorized: boolean;
  excludeRecursion: boolean;
  preventRecursion: boolean;
  delayUntilRecursion: boolean;
  scanDepth: null;
  caseSensitive: null;
  matchWholeWords: null;
  useGroupScoring: null;
  automationId: string;
}

export interface Character {
  id?: string; // For local DB
  spec: 'chara_card_v2' | 'chara_card_v3';
  spec_version: '2.0' | '3.0';
  avatar?: string;
  data: {
    name: string;
    description: string;
    personality: string;
    scenario: string;
    first_mes: string;
    mes_example: string;
    creator_notes: string;
    system_prompt: string;
    post_history_instructions: string;
    alternate_greetings: string[];
    tags: string[];
    creator: string;
    character_version: string;
    create_date: string;
    modification_date: string;
    extensions: {
        world: string;
        fav: boolean;
        talkativeness: number;
        nsfw: boolean;
        depth_prompt: {
            prompt: string;
            depth: number;
            role: string;
        };
        group_only_greetings: string[];
    }
  };
  lorebook: LoreEntry[];
  completionScore: number; // app-internal
}

export interface SavedScene {
    id: string;
    prompt: string;
    dialogue: string;
    characters: { id: string; name: string; avatar: string; }[];
    disabledMembers: string[];
    activationStrategy: string;
    createdAt: string;
}

export interface SavedSenateSession {
    id: string;
    objective: string;
    dialogue: string;
    archetypes: { id: number; name: string; }[];
    createdAt: string;
}

interface CharacterContextType {
  character: Character;
  characterHistory: Character[];
  savedScenes: SavedScene[];
  savedSenateSessions: SavedSenateSession[];
  undoStack: Character[];
  previewMode: 'card' | 'json';
  personas: Persona[];
  activePersonaId: string | null;
  defaultPersonaId: string | null;
  addPersona: (personaData: Omit<Persona, 'id' | 'connections'>) => void;
  updatePersona: (personaData: Persona) => void;
  deletePersona: (personaId: string) => void;
  setActivePersonaId: (personaId: string) => void;
  setDefaultPersona: (personaId: string) => void;
  togglePersonaConnection: (personaId: string, characterId: string) => void;
  apiProvider: 'google' | 'horde' | 'custom';
  googleApiKey: string;
  googleApiModel: string;
  hordeApiKey: string;
  customApiType: 'openai' | 'kobold';
  customApiUrl: string;
  customApiKey: string;
  selectedTokenizer: string;
  completionScore: number;
  isLoaded: boolean; // Flag to indicate when data has been loaded from localStorage
  isAiDisabled: boolean;
  language: string;
  isCustomBgEnabled: boolean;
  customBgUrl: string;
  customBgFitting: 'cover' | 'contain' | 'stretch' | 'center';
  setApiProvider: (provider: 'google' | 'horde' | 'custom') => void;
  setLanguage: (lang: string) => void;
  setIsAiDisabled: (disabled: boolean) => void;
  setPreviewMode: (mode: 'card' | 'json') => void;
  updateCharacter: (updater: (prev: Character) => Character) => void;
  updateMultipleCharacters: (characters: Character[]) => void;
  importCharacter: (importedChar: any) => void;
  importLorebook: (lorebookData: { entries: any }) => void;
  replaceCurrentCharacter: (newCharacter: Character) => void;
  addLoreEntry: (entry: Omit<LoreEntry, 'uid'>) => void;
  updateLoreEntry: (uid: string, updates: Partial<LoreEntry>) => void;
  removeLoreEntry: (uid: string) => void;
  saveScene: (sceneData: Omit<SavedScene, 'id' | 'createdAt'>) => void;
  deleteScene: (sceneId: string) => void;
  saveSenateSession: (sessionData: Omit<SavedSenateSession, 'id' | 'createdAt'>) => void;
  deleteSenateSession: (sessionId: string) => void;
  getMissingFields: (char: Character) => string[];
  getRarityInfo: (score: number) => { name: string; colorClass: string };
  loadCharacter: (id: string) => void;
  deleteCharacter: (id: string) => void;
  deleteMultipleCharacters: (ids: string[]) => void;
  resetCurrentCharacter: () => void;
  undo: () => void;
  setGoogleApiKey: (key: string) => void;
  setGoogleApiModel: (model: string) => void;
  setHordeApiKey: (key: string) => void;
  setCustomApiType: (type: 'openai' | 'kobold') => void;
  setCustomApiUrl: (url: string) => void;
  setCustomApiKey: (key: string) => void;
  setSelectedTokenizer: (tokenizer: string) => void;
  verifyGoogleApiKey: () => Promise<boolean>;
  verifyCustomApi: (type: string, url: string, apiKey: string) => Promise<boolean>;
  setIsCustomBgEnabled: (enabled: boolean) => void;
  setCustomBgUrl: (url: string) => void;
  setCustomBgFitting: (fitting: 'cover' | 'contain' | 'stretch' | 'center') => void;
}

const createDefaultCharacter = (): Character => ({
  id: getUUID(),
  spec: 'chara_card_v2',
  spec_version: '2.0',
  data: {
    name: '',
    description: '',
    personality: '',
    scenario: '',
    first_mes: '',
    mes_example: '',
    creator_notes: '',
    system_prompt: '',
    post_history_instructions: '',
    alternate_greetings: [],
    tags: [],
    creator: '',
    character_version: '1.0',
    create_date: new Date().toISOString(),
    modification_date: new Date().toISOString(),
    extensions: {
        world: '',
        fav: false,
        talkativeness: 0.5,
        nsfw: false,
        depth_prompt: {
            prompt: '',
            depth: 4,
            role: 'system',
        },
        group_only_greetings: [],
    }
  },
  avatar: `https://placehold.co/512x512.png`,
  lorebook: [],
  completionScore: 0
});

const CharacterContext = createContext<CharacterContextType | undefined>(undefined);

// --- Helper function to manage localStorage and IndexedDB ---
const saveHistory = async (history: Character[]) => {
    try {
        // Strip avatars for the main history item to keep it small
        const slimHistory = history.map(({ avatar, ...rest }) => rest);
        localStorage.setItem('characterHistory', JSON.stringify(slimHistory));

        // Save avatars separately to IndexedDB for performance and storage limits
        for (const char of history) {
            if (char.id && char.avatar && char.avatar.startsWith('data:image')) {
                await set(`avatar_${char.id}`, char.avatar);
            } else if (char.id) {
                // If avatar is a URL or empty, ensure no old base64 avatar is lingering
                await del(`avatar_${char.id}`);
            }
        }
    } catch (e) {
        console.error("Error saving history to storage.", e);
    }
};


export const CharacterProvider = ({ children }: { children: ReactNode }) => {
  const [character, setCharacter] = useState<Character>(createDefaultCharacter());
  const [characterHistory, setCharacterHistory] = useState<Character[]>([]);
  const [savedScenes, setSavedScenes] = useState<SavedScene[]>([]);
  const [savedSenateSessions, setSavedSenateSessions] = useState<SavedSenateSession[]>([]);
  const [undoStack, setUndoStack] = useState<Character[]>([]);
  const [previewMode, setPreviewMode] = useState<'card' | 'json'>('card');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const [defaultPersonaId, setDefaultPersonaId] = useState<string | null>(null);
  const [apiProvider, setApiProvider] = useState<'google' | 'horde' | 'custom'>('google');
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [googleApiModel, setGoogleApiModel] = useState('gemini-1.5-pro-latest');
  const [hordeApiKey, setHordeApiKey] = useState('');
  const [customApiType, setCustomApiType] = useState<'openai' | 'kobold'>('openai');
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [customApiKey, setCustomApiKey] = useState('');
  const [selectedTokenizer, setSelectedTokenizer] = useState('cl100k_base');
  const [completionScore, setCompletionScore] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAiDisabled, setIsAiDisabled] = useState(false);
  const [language, setLanguage] = useState('es');
  const [isCustomBgEnabled, setIsCustomBgEnabled] = useState(false);
  const [customBgUrl, setCustomBgUrl] = useState('');
  const [customBgFitting, setCustomBgFitting] = useState<'cover' | 'contain' | 'stretch' | 'center'>('cover');
  const { toast } = useToast();
  const { t } = useTranslation();


  const calculateProgress = useCallback((char: Character) => {
    let score = 0;
    const c = char.data;
    
    if (!c) {
      return 0;
    }

    if (c.name) score += 10;
    if (c.description) score += 15;
    if (c.personality) score += 15;
    if (c.scenario) score += 10;
    if (c.first_mes) score += 10;
    if (c.mes_example) score += 10;
    if (char.avatar && !char.avatar.includes('placehold.co')) score += 10;
    if (char.lorebook && char.lorebook.length > 0) score += 5;
    if (c.tags && c.tags.length >= 3) score += 5;
    if (c.system_prompt) score += 5;
    
    return Math.min(score, 100);
  }, []);

  const getMissingFields = useCallback((char: Character): string[] => {
    const missing: string[] = [];
    const c = char.data;

    if (!c) return ["Todos los campos"];

    if (!c.name) missing.push("Nombre");
    if (!c.description) missing.push("Descripción");
    if (!c.personality) missing.push("Personalidad");
    if (!c.scenario) missing.push("Escenario");
    if (!c.first_mes) missing.push("Primer Mensaje");
    if (!c.mes_example) missing.push("Ejemplos de Diálogo");
    if (!c.tags || c.tags.length < 3) missing.push("Al menos 3 etiquetas");
    if (!c.system_prompt) missing.push("Instrucciones del Sistema");
    if (!char.avatar || char.avatar.includes('placehold.co')) missing.push("Avatar personalizado");
    if (!char.lorebook || char.lorebook.length === 0) missing.push("Entrada de Lorebook");
    
    return missing;
  }, []);

  const getRarityInfo = useCallback((score: number): { name: string; colorClass: string } => {
    if (score === 100) return { name: t('characterPreview.legendary'), colorClass: 'border-yellow-400' };
    if (score >= 75) return { name: t('characterPreview.epic'), colorClass: 'border-purple-500' };
    if (score >= 50) return { name: t('characterPreview.rare'), colorClass: 'border-blue-500' };
    if (score >= 25) return { name: t('characterPreview.uncommon'), colorClass: 'border-green-500' };
    return { name: t('characterPreview.common'), colorClass: 'border-border' };
  }, [t]);


  const setCharacterAndScore = useCallback((char: Character) => {
    const score = calculateProgress(char);
    setCharacter(char);
    setCompletionScore(score);
  }, [calculateProgress]);

  const saveCharacterToHistory = useCallback((charToSave: Character) => {
    // Only save if character has a name to avoid saving blank characters
    if (!charToSave.data.name?.trim()) return;

    setCharacterHistory(prev => {
        const newHistory = [...prev.filter(c => c.id !== charToSave.id), charToSave];
        saveHistory(newHistory);
        return newHistory;
    });
  }, []);

  const handleSetApiProvider = useCallback((provider: 'google' | 'horde' | 'custom') => {
      localStorage.setItem('apiProvider', provider);
      setApiProvider(provider);
  }, []);

  const handleSetGoogleApiKey = useCallback((key: string) => {
    localStorage.setItem('user_gemini_key', key);
    setGoogleApiKey(key);
  }, []);
  
  const handleSetHordeApiKey = useCallback((key: string) => {
    localStorage.setItem('hordeApiKey', key);
    setHordeApiKey(key);
  }, []);

  const handleSetCustomApiType = useCallback((type: 'openai' | 'kobold') => {
    localStorage.setItem('customApiType', type);
    setCustomApiType(type);
  }, []);

  const handleSetCustomApiUrl = useCallback((url: string) => {
    localStorage.setItem('customApiUrl', url);
    setCustomApiUrl(url);
  }, []);

  const handleSetCustomApiKey = useCallback((key: string) => {
    localStorage.setItem('customApiKey', key);
    setCustomApiKey(key);
  }, []);

  const handleSetGoogleApiModel = useCallback((model: string) => {
    localStorage.setItem('user_gemini_model', model);
    setGoogleApiModel(model);
  }, []);
  
  const handleSetSelectedTokenizer = useCallback((tokenizer: string) => {
    localStorage.setItem('selectedTokenizer', tokenizer);
    setSelectedTokenizer(tokenizer);
  }, []);

  const handleSetIsAiDisabled = useCallback((disabled: boolean) => {
    localStorage.setItem('isAiDisabled', JSON.stringify(disabled));
    setIsAiDisabled(disabled);
  }, []);

  const handleSetLanguage = useCallback((lang: string) => {
    localStorage.setItem('selectedLanguage', lang);
    setLanguage(lang);
  }, []);
  
  const handleSetActivePersonaId = useCallback((personaId: string) => {
    localStorage.setItem('activePersonaId', personaId);
    setActivePersonaId(personaId);
  }, []);
  
  const handleSetDefaultPersona = useCallback((personaId: string) => {
    const newDefaultId = defaultPersonaId === personaId ? null : personaId;
    setDefaultPersonaId(newDefaultId);
    localStorage.setItem('defaultPersonaId', newDefaultId || '');
  }, [defaultPersonaId]);
  
  const handleTogglePersonaConnection = useCallback((personaId: string, characterId: string) => {
      setPersonas(prev => {
          const newPersonas = prev.map(p => {
              if (p.id === personaId) {
                  const connections = p.connections || [];
                  const existingConnection = connections.find(c => c.characterId === characterId);
                  
                  if (existingConnection) {
                      // Remove connection
                      return { ...p, connections: connections.filter(c => c.characterId !== characterId) };
                  } else {
                      // Add connection
                      return { ...p, connections: [...connections, { characterId }] };
                  }
              }
              return p;
          });
          localStorage.setItem('personas', JSON.stringify(newPersonas));
          return newPersonas;
      });
  }, []);

  const handleSetIsCustomBgEnabled = useCallback((enabled: boolean) => {
    localStorage.setItem('isCustomBgEnabled', JSON.stringify(enabled));
    setIsCustomBgEnabled(enabled);
  }, []);
  
  const handleSetCustomBgUrl = useCallback((url: string) => {
    localStorage.setItem('customBgUrl', url);
    setCustomBgUrl(url);
  }, []);

  const handleSetCustomBgFitting = useCallback((fitting: 'cover' | 'contain' | 'stretch' | 'center') => {
    localStorage.setItem('customBgFitting', fitting);
    setCustomBgFitting(fitting);
  }, []);

  const updateCharacter = useCallback((updater: (prev: Character) => Character) => {
    setUndoStack(prev => [...prev, character]); // Save current state for undo
    const newChar = updater(character);
    newChar.data.modification_date = new Date().toISOString();
    setCharacterAndScore(newChar);
  }, [character, setCharacterAndScore]);
  
  const updateMultipleCharacters = useCallback((charactersToUpdate: Character[]) => {
    setCharacterHistory(prev => {
        const updatedHistory = prev.map(histChar => {
            const foundUpdate = charactersToUpdate.find(c => c.id === histChar.id);
            return foundUpdate ? foundUpdate : histChar;
        });
        saveHistory(updatedHistory);
        return updatedHistory;
    });

    // Check if the current character was one of the updated ones
    const currentCharacterUpdate = charactersToUpdate.find(c => c.id === character.id);
    if (currentCharacterUpdate) {
        setCharacterAndScore(currentCharacterUpdate);
    }
}, [character.id, setCharacterAndScore]);

  const importCharacter = useCallback((importedChar: any) => {
      saveCharacterToHistory(character); // Save current work before loading
      setUndoStack([]); // Clear undo stack for the newly imported character
      
      const now = new Date().toISOString();
      
      const data = importedChar.data || {};
      const newChar = createDefaultCharacter();
      
      newChar.id = importedChar.id || getUUID();
      newChar.spec = importedChar.spec || 'chara_card_v2';
      newChar.spec_version = importedChar.spec_version || '2.0';
      newChar.avatar = importedChar.avatar === 'none' ? undefined : (importedChar.avatar || data.avatar);
      
      // --- DATA ---
      newChar.data.name = data.name || importedChar.name || '';
      newChar.data.description = data.description || importedChar.description || '';
      newChar.data.personality = data.personality || importedChar.personality || '';
      newChar.data.scenario = data.scenario || importedChar.scenario || '';
      newChar.data.first_mes = data.first_mes || importedChar.first_mes || '';
      newChar.data.mes_example = data.mes_example || importedChar.mes_example || '';
      newChar.data.creator_notes = data.creator_notes || importedChar.creatorcomment || ''; // Map creatorcomment
      newChar.data.system_prompt = data.system_prompt || importedChar.system_prompt || '';
      newChar.data.post_history_instructions = data.post_history_instructions || importedChar.post_history_instructions || '';
      newChar.data.tags = data.tags || importedChar.tags || [];
      newChar.data.creator = data.creator || importedChar.creator || '';
      newChar.data.character_version = data.character_version || importedChar.character_version || '1.0';
      newChar.data.alternate_greetings = data.alternate_greetings || importedChar.alternate_greetings || [];
      
      const createDate = data.create_date || importedChar.create_date;
      const parsedCreateDate = createDate ? new Date(String(createDate).replace('@', ' ')) : null;
      newChar.data.create_date = (parsedCreateDate && !isNaN(parsedCreateDate.getTime())) ? parsedCreateDate.toISOString() : now;
      newChar.data.modification_date = data.modification_date || importedChar.modification_date || now;

      // --- EXTENSIONS ---
      const extensions = data.extensions || {};
      newChar.data.extensions.world = extensions.world || '';
      newChar.data.extensions.fav = extensions.fav ?? (importedChar.fav === true);
      newChar.data.extensions.talkativeness = Number(extensions.talkativeness ?? importedChar.talkativeness ?? 0.5);
      newChar.data.extensions.nsfw = extensions.nsfw ?? (data.nsfw === true);
      newChar.data.extensions.depth_prompt = extensions.depth_prompt || newChar.data.extensions.depth_prompt;
      newChar.data.extensions.group_only_greetings = extensions.group_only_greetings || data.group_only_greetings || [];
      
      // --- LOREBOOK ---
      const loreSource = importedChar.data?.character_book?.entries || importedChar.lorebook;

      if (loreSource) {
          const entries = Array.isArray(loreSource) ? loreSource : Object.values(loreSource);
          newChar.lorebook = entries.map((entry: any, index: number) => {
              const loreExt = entry.extensions || {};
              const finalEntry: LoreEntry = {
                uid: String(entry.uid ?? entry.id ?? getUUID()),
                key: entry.key ?? entry.keys ?? [],
                keysecondary: entry.keysecondary ?? entry.secondary_keys ?? [],
                comment: entry.comment || '',
                content: entry.content || '',
                constant: entry.constant || false,
                selective: entry.selective ?? true,
                order: entry.order ?? entry.insertion_order ?? 100,
                position: loreExt.position ?? (entry.position === 'after_char' ? 1 : 0),
                disable: entry.disable ?? !(entry.enabled ?? true), // Handle inverted logic
                displayIndex: loreExt.displayIndex ?? index,
                addMemo: loreExt.addMemo ?? true,
                group: loreExt.group ?? '',
                groupOverride: loreExt.group_override ?? false,
                groupWeight: loreExt.group_weight ?? 100,
                sticky: loreExt.sticky ?? 0,
                cooldown: loreExt.cooldown ?? 0,
                delay: loreExt.delay ?? 0,
                probability: loreExt.probability ?? 100,
                depth: loreExt.depth ?? 4,
                useProbability: loreExt.useProbability ?? true,
                role: loreExt.role ?? null,
                vectorized: loreExt.vectorized ?? false,
                excludeRecursion: loreExt.exclude_recursion ?? false,
                preventRecursion: loreExt.prevent_recursion ?? false,
                delayUntilRecursion: loreExt.delay_until_recursion ?? false,
                scanDepth: loreExt.scan_depth ?? null,
                caseSensitive: loreExt.case_sensitive ?? null,
                matchWholeWords: loreExt.match_whole_words ?? null,
                useGroupScoring: loreExt.use_group_scoring ?? null,
                automationId: loreExt.automation_id ?? '',
              };
              return finalEntry;
          });
      }

      setCharacterAndScore(newChar);
      toast({ title: 'Personaje importado', description: `Se ha cargado a "${newChar.data.name}" en el editor.`});
  }, [character, saveCharacterToHistory, setCharacterAndScore, toast]);
  
  const importLorebook = useCallback((lorebookData: { entries: any }) => {
    setUndoStack(prev => [...prev, character]);

    const defaultLoreEntry: Omit<LoreEntry, 'uid'> = {
        key: [], keysecondary: [], comment: '', content: '', constant: false, selective: true,
        order: 100, position: 0, disable: false, displayIndex: 0, addMemo: true, group: '',
        groupOverride: false, groupWeight: 100, sticky: 0, cooldown: 0, delay: 0,
        probability: 100, depth: 4, useProbability: true, role: null, vectorized: false,
        excludeRecursion: false, preventRecursion: false, delayUntilRecursion: false,
        scanDepth: null, caseSensitive: null, matchWholeWords: null,
        useGroupScoring: null, automationId: ''
    };
    
    // Handle both array and object formats for entries
    const entriesSource = Array.isArray(lorebookData.entries) 
      ? lorebookData.entries 
      : Object.values(lorebookData.entries);

    const newEntries = entriesSource.map((entry: any, index: number) => ({
        ...defaultLoreEntry,
        ...entry,
        key: entry.key || entry.keys || [],
        keysecondary: entry.keysecondary || entry.secondary_keys || [],
        disable: entry.disable ?? !entry.enabled,
        order: entry.order ?? entry.insertion_order ?? 100,
        uid: getUUID(),
    }));

    updateCharacter(prev => ({
            ...prev,
            lorebook: [...prev.lorebook, ...newEntries],
        })
    );
  }, [character, updateCharacter]);

  const replaceCurrentCharacter = useCallback((newCharacter: Character) => {
    setUndoStack(prev => [...prev, character]);
    const updatedChar = {
        ...newCharacter,
        data: {
          ...newCharacter.data,
          modification_date: new Date().toISOString(),
        }
    };
    setCharacterAndScore(updatedChar);
  }, [character, setCharacterAndScore]);

  const resetCurrentCharacter = useCallback(() => {
    if(character.data.name) {
      saveCharacterToHistory(character);
    }
    setUndoStack([]);
    const newChar = createDefaultCharacter();
    setCharacterAndScore(newChar);
  }, [character, saveCharacterToHistory, setCharacterAndScore]);

  const loadCharacter = useCallback((id: string) => {
    const charToLoad = characterHistory.find(c => c.id === id);
    if (charToLoad) {
      if (character.data.name) {
          saveCharacterToHistory(character);
      }
      setCharacterAndScore(charToLoad);
      setUndoStack([]);
    }
  }, [characterHistory, character, saveCharacterToHistory, setCharacterAndScore]);

  const deleteCharacter = useCallback((id: string) => {
    del(`avatar_${id}`);
    setCharacterHistory(prev => {
      const newHistory = prev.filter(c => c.id !== id);
      saveHistory(newHistory);
      return newHistory;
    });
    if (character.id === id) {
      resetCurrentCharacter();
    }
  }, [character.id, resetCurrentCharacter]);
  
  const deleteMultipleCharacters = useCallback((ids: string[]) => {
    ids.forEach(id => del(`avatar_${id}`));
    setCharacterHistory(prev => {
        const newHistory = prev.filter(c => !ids.includes(c.id!));
        saveHistory(newHistory);
        return newHistory;
    });
    if (ids.includes(character.id!)) {
        resetCurrentCharacter();
    }
  }, [character.id, resetCurrentCharacter]);
  
  const undo = useCallback(() => {
    if (undoStack.length > 0) {
      const lastState = undoStack[undoStack.length - 1];
      const newUndoStack = undoStack.slice(0, undoStack.length - 1);
      
      setCharacterAndScore(lastState);
      setUndoStack(newUndoStack);
    }
  }, [undoStack, setCharacterAndScore]);

  const addLoreEntry = useCallback((entry: Omit<LoreEntry, 'uid'>) => {
    const newEntry = { ...entry, uid: getUUID() };
    updateCharacter(prev => ({
       ...prev,
       lorebook: [...prev.lorebook, newEntry]
    }));
  }, [updateCharacter]);

  const updateLoreEntry = useCallback((uid: string, updates: Partial<LoreEntry>) => {
    updateCharacter(prev => ({
        ...prev,
        lorebook: prev.lorebook.map(entry =>
            entry.uid === uid ? { ...entry, ...updates } : entry
        ),
    }));
  }, [updateCharacter]);

  const removeLoreEntry = useCallback((uid: string) => {
    updateCharacter(prev => ({
        ...prev,
        lorebook: prev.lorebook.filter(entry => entry.uid !== uid),
    }));
  }, [updateCharacter]);

  const saveScene = useCallback((sceneData: Omit<SavedScene, 'id' | 'createdAt'>) => {
      const newScene = {
          ...sceneData,
          id: getUUID(),
          createdAt: new Date().toISOString(),
      };
      setSavedScenes(prev => {
          const newScenes = [...prev, newScene];
          localStorage.setItem('savedScenes', JSON.stringify(newScenes));
          return newScenes;
      });
  }, []);

  const deleteScene = useCallback((sceneId: string) => {
      setSavedScenes(prev => {
          const newScenes = prev.filter(scene => scene.id !== sceneId);
          localStorage.setItem('savedScenes', JSON.stringify(newScenes));
          return newScenes;
      });
  }, []);
  
  const saveSenateSession = useCallback((sessionData: Omit<SavedSenateSession, 'id' | 'createdAt'>) => {
    const newSession = {
        ...sessionData,
        id: getUUID(),
        createdAt: new Date().toISOString(),
    };
    setSavedSenateSessions(prev => {
        const newSessions = [...prev, newSession];
        localStorage.setItem('savedSenateSessions', JSON.stringify(newSessions));
        return newSessions;
    });
  }, []);

  const deleteSenateSession = useCallback((sessionId: string) => {
      setSavedSenateSessions(prev => {
          const newSessions = prev.filter(session => session.id !== sessionId);
          localStorage.setItem('savedSenateSessions', JSON.stringify(newSessions));
          return newSessions;
      });
  }, []);

    const addPersona = useCallback((personaData: Omit<Persona, 'id' | 'connections'>) => {
        const newPersona: Persona = { ...personaData, id: getUUID(), connections: [] };
        setPersonas(prev => {
            const newPersonas = [...prev, newPersona];
            localStorage.setItem('personas', JSON.stringify(newPersonas));
            return newPersonas;
        });
    }, []);

    const updatePersona = useCallback((personaData: Persona) => {
        setPersonas(prev => {
            const newPersonas = prev.map(p => p.id === personaData.id ? personaData : p);
            localStorage.setItem('personas', JSON.stringify(newPersonas));
            return newPersonas;
        });
    }, []);

    const deletePersona = useCallback((personaId: string) => {
        setPersonas(prev => {
            const newPersonas = prev.filter(p => p.id !== personaId);
            localStorage.setItem('personas', JSON.stringify(newPersonas));
            
            if (activePersonaId === personaId) {
                const newActiveId = newPersonas.length > 0 ? newPersonas[0].id : null;
                setActivePersonaId(newActiveId);
                localStorage.setItem('activePersonaId', newActiveId || '');
            }
             if (defaultPersonaId === personaId) {
                setDefaultPersonaId(null);
                localStorage.removeItem('defaultPersonaId');
            }
            return newPersonas;
        });
    }, [activePersonaId, defaultPersonaId]);

  const verifyGoogleApiKey = useCallback(async (): Promise<boolean> => {
    if (!googleApiKey) return false;
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${googleApiModel}:generateContent?key=${googleApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "contents":[{"parts":[{"text":"Hola"}]}]
            })
        });
        return res.ok;
    } catch (error) {
        console.error("API Key verification failed:", error);
        return false;
    }
  }, [googleApiKey, googleApiModel]);

  const verifyCustomApi = useCallback(async (type: string, url: string, apiKey: string): Promise<boolean> => {
    if (!url) return false;
    try {
        let testUrl = url;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (type === 'openai') {
            testUrl = url.endsWith('/v1') ? `${url}/models` : `${url.replace(/\/$/, "")}/v1/models`;
            if(apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        } else { // kobold
            testUrl = url.endsWith('/') ? `${url}api/v1/model` : `${url}/api/v1/model`;
        }
        
        const res = await fetch(testUrl, { method: 'GET', headers });
        return res.ok;
    } catch (error) {
        console.error("Custom API verification failed:", error);
        return false;
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Personas
        const savedPersonas = localStorage.getItem('personas');
        let initialPersonas: Persona[] = [];
        if (savedPersonas) {
            initialPersonas = JSON.parse(savedPersonas);
        } else {
            // Migration from old single-persona system
            const oldName = localStorage.getItem('personaName');
            const oldAvatar = localStorage.getItem('personaAvatar');
            if (oldName) {
                initialPersonas = [{ id: getUUID(), name: oldName, avatar: oldAvatar || '', connections: [] }];
            } else {
                initialPersonas = [{ id: getUUID(), name: 'User', avatar: '', connections: [] }];
            }
        }
        setPersonas(initialPersonas);

        const savedActivePersonaId = localStorage.getItem('activePersonaId');
        if (savedActivePersonaId && initialPersonas.some(p => p.id === savedActivePersonaId)) {
            setActivePersonaId(savedActivePersonaId);
        } else if (initialPersonas.length > 0) {
            setActivePersonaId(initialPersonas[0].id);
        }

        const savedDefaultPersonaId = localStorage.getItem('defaultPersonaId');
        if(savedDefaultPersonaId) setDefaultPersonaId(savedDefaultPersonaId);

        // API Provider
        const savedProvider = localStorage.getItem('apiProvider');
        if (savedProvider === 'google' || savedProvider === 'horde' || savedProvider === 'custom') {
            setApiProvider(savedProvider as 'google' | 'horde' | 'custom');
        }

        // Characters
        const savedSlimHistory = localStorage.getItem('characterHistory');
        let initialHistory: Character[] = [];
        if (savedSlimHistory) {
          let parsedSlimHistory;
          try {
            parsedSlimHistory = JSON.parse(savedSlimHistory);
            if (!Array.isArray(parsedSlimHistory)) {
              console.warn("Corrupted character history found, expected an array.");
              parsedSlimHistory = [];
            }
          } catch (e) {
            console.error("Failed to parse character history, resetting.", e);
            parsedSlimHistory = [];
            localStorage.removeItem('characterHistory');
          }
          
          const validSlimHistory = parsedSlimHistory.filter((c: any) => c && typeof c === 'object' && c.data);

          if (validSlimHistory.length !== parsedSlimHistory.length) {
              console.warn("Some corrupted character entries were filtered out from history.");
          }

          const avatarPromises = validSlimHistory.map((slimChar: any) => 
            slimChar.id ? get<string>(`avatar_${slimChar.id}`) : Promise.resolve(null)
          );
          const avatars = await Promise.all(avatarPromises);

          initialHistory = validSlimHistory.map((slimChar: any, index: number) => {
            const fullChar = {
              ...slimChar,
              avatar: avatars[index] || undefined
            } as Character;
            fullChar.completionScore = calculateProgress(fullChar); 
            return fullChar;
          });
          setCharacterHistory(initialHistory);
        }
        
        const currentCharacterId = localStorage.getItem('currentCharacterId');
        const charToLoad = currentCharacterId ? initialHistory.find(c => c.id === currentCharacterId) : null;
        if (charToLoad) {
          setCharacterAndScore(charToLoad);
        } else if (initialHistory.length > 0) {
          const lastChar = [...initialHistory].sort((a, b) => {
            const dateA = a.data.modification_date ? new Date(a.data.modification_date).getTime() : 0;
            const dateB = b.data.modification_date ? new Date(b.data.modification_date).getTime() : 0;
            return dateB - dateA;
          })[0];
          if (lastChar) {
            setCharacterAndScore(lastChar);
          }
        } else {
            setCharacterAndScore(createDefaultCharacter());
        }
        
        const savedScenesData = localStorage.getItem('savedScenes');
          if (savedScenesData) {
              setSavedScenes(JSON.parse(savedScenesData));
          }

        const savedSenateSessionsData = localStorage.getItem('savedSenateSessions');
          if (savedSenateSessionsData) {
              setSavedSenateSessions(JSON.parse(savedSenateSessionsData));
          }
        
        const savedGoogleApiKey = localStorage.getItem('user_gemini_key');
          if (savedGoogleApiKey) {
              setGoogleApiKey(savedGoogleApiKey);
          }
        const savedHordeApiKey = localStorage.getItem('hordeApiKey');
          if (savedHordeApiKey) {
              setHordeApiKey(savedHordeApiKey);
          }
        const savedCustomApiType = localStorage.getItem('customApiType');
        if (savedCustomApiType === 'openai' || savedCustomApiType === 'kobold') {
            setCustomApiType(savedCustomApiType);
        }
        const savedCustomApiUrl = localStorage.getItem('customApiUrl');
        if (savedCustomApiUrl) setCustomApiUrl(savedCustomApiUrl);
        const savedCustomApiKey = localStorage.getItem('customApiKey');
        if (savedCustomApiKey) setCustomApiKey(savedCustomApiKey);
        
        const savedGoogleApiModel = localStorage.getItem('user_gemini_model');
          if (savedGoogleApiModel) {
              setGoogleApiModel(savedGoogleApiModel);
          }
        
        const savedTokenizer = localStorage.getItem('selectedTokenizer');
        if (savedTokenizer) {
              setSelectedTokenizer(savedTokenizer);
        }
        const savedIsAiDisabled = localStorage.getItem('isAiDisabled');
          if (savedIsAiDisabled) {
              setIsAiDisabled(JSON.parse(savedIsAiDisabled));
          }
        const savedLanguage = localStorage.getItem('selectedLanguage');
        if (savedLanguage) {
              setLanguage(savedLanguage);
        }
        const savedIsCustomBgEnabled = localStorage.getItem('isCustomBgEnabled');
        if (savedIsCustomBgEnabled) {
            setIsCustomBgEnabled(JSON.parse(savedIsCustomBgEnabled));
        }
        const savedCustomBgUrl = localStorage.getItem('customBgUrl');
        if (savedCustomBgUrl) {
            setCustomBgUrl(savedCustomBgUrl);
        }
        const savedCustomBgFitting = localStorage.getItem('customBgFitting');
        if (savedCustomBgFitting) {
            setCustomBgFitting(savedCustomBgFitting as any);
        }

      } catch (e) {
        console.error("Error loading data from storage", e);
      } finally {
          setIsLoaded(true);
      }
    };
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
     if (!isLoaded) return; // Don't save to history until initial load is complete
     localStorage.setItem('currentCharacterId', character.id || '');
     const timeoutId = setTimeout(() => {
        saveCharacterToHistory(character);
     }, 2000);
     return () => clearTimeout(timeoutId);
  }, [character, isLoaded, saveCharacterToHistory]);
  
  const personaName = useMemo(() => {
      return personas.find(p => p.id === activePersonaId)?.name || 'User';
  }, [personas, activePersonaId]);
  
  const contextValue = useMemo(() => ({
    character, characterHistory, savedScenes, savedSenateSessions, undoStack, previewMode, personas, activePersonaId, defaultPersonaId,
    personaName,
    addPersona, updatePersona, deletePersona, setActivePersonaId: handleSetActivePersonaId, setDefaultPersona: handleSetDefaultPersona,
    togglePersonaConnection: handleTogglePersonaConnection,
    apiProvider, googleApiKey, googleApiModel, hordeApiKey, customApiType, customApiUrl, customApiKey,
    selectedTokenizer, completionScore, isLoaded, isAiDisabled, language, isCustomBgEnabled, customBgUrl, customBgFitting, 
    setApiProvider: handleSetApiProvider,
    setLanguage: handleSetLanguage, setIsAiDisabled: handleSetIsAiDisabled,
    setPreviewMode, updateCharacter, updateMultipleCharacters, importCharacter, importLorebook, replaceCurrentCharacter, addLoreEntry, updateLoreEntry, removeLoreEntry, 
    saveScene, deleteScene, saveSenateSession, deleteSenateSession, getMissingFields, getRarityInfo, loadCharacter, deleteCharacter, deleteMultipleCharacters, 
    resetCurrentCharacter, undo, 
    setGoogleApiKey: handleSetGoogleApiKey, 
    setGoogleApiModel: handleSetGoogleApiModel,
    setHordeApiKey: handleSetHordeApiKey,
    setCustomApiType: handleSetCustomApiType,
    setCustomApiUrl: handleSetCustomApiUrl,
    setCustomApiKey: handleSetCustomApiKey,
    setSelectedTokenizer: handleSetSelectedTokenizer,
    verifyGoogleApiKey,
    verifyCustomApi,
    setIsCustomBgEnabled: handleSetIsCustomBgEnabled,
    setCustomBgUrl: handleSetCustomBgUrl,
    setCustomBgFitting: handleSetCustomBgFitting,
  }), [
    character, characterHistory, savedScenes, savedSenateSessions, undoStack, previewMode, personas, activePersonaId, defaultPersonaId,
    personaName,
    addPersona, updatePersona, deletePersona, handleSetActivePersonaId, handleSetDefaultPersona,
    handleTogglePersonaConnection,
    apiProvider, googleApiKey, googleApiModel, hordeApiKey, customApiType, customApiUrl, customApiKey,
    selectedTokenizer, completionScore, isLoaded, isAiDisabled, language, isCustomBgEnabled, customBgUrl, customBgFitting, 
    handleSetApiProvider, handleSetLanguage, handleSetIsAiDisabled,
    setPreviewMode, updateCharacter, updateMultipleCharacters, importCharacter, importLorebook, replaceCurrentCharacter, addLoreEntry, updateLoreEntry, removeLoreEntry,
    saveScene, deleteScene, saveSenateSession, deleteSenateSession, getMissingFields, getRarityInfo, loadCharacter, deleteCharacter, deleteMultipleCharacters,
    resetCurrentCharacter, undo,
    handleSetGoogleApiKey, handleSetGoogleApiModel, handleSetHordeApiKey, handleSetCustomApiType, handleSetCustomApiUrl, handleSetCustomApiKey, handleSetSelectedTokenizer,
    verifyGoogleApiKey,
    verifyCustomApi,
    handleSetIsCustomBgEnabled, handleSetCustomBgUrl, handleSetCustomBgFitting,
  ]);

  return (
    <CharacterContext.Provider value={contextValue}>
      {children}
    </CharacterContext.Provider>
  );
};

export const useCharacter = () => {
  const context = useContext(CharacterContext);
  if (context === undefined) {
    throw new Error('useCharacter must be used within a CharacterProvider');
  }
  return context;
};
