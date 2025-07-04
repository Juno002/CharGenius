
"use client";

import React, { useEffect, useState } from 'react';
import { countTokens } from '@/lib/tokenizer';
import { cn } from "@/lib/utils";
import { useCharacter } from '@/context/CharacterContext';

interface TokenCountDisplayProps {
  text: string | undefined;
  className?: string;
}

const TOKEN_WARNING_THRESHOLD = 500;

export function TokenCountDisplay({ text, className }: TokenCountDisplayProps) {
  const { selectedTokenizer } = useCharacter();
  const [tokens, setTokens] = useState<number>(0);
  
  useEffect(() => {
    let isMounted = true;
    countTokens(text, selectedTokenizer as any).then((count) => {
        if (isMounted) setTokens(count);
    });
    return () => { isMounted = false; };
  }, [text, selectedTokenizer]);

  if (tokens === 0) {
      return null;
  }

  const isWarning = tokens > TOKEN_WARNING_THRESHOLD;

  return (
    <div className={cn(
      "text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded-sm",
      isWarning && "text-destructive-foreground bg-destructive/80 font-bold",
      className
    )}>
      {tokens} {tokens === 1 ? 'token' : 'tokens'}
    </div>
  );
}
