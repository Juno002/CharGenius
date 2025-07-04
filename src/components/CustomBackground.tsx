'use client';

import { useEffect } from 'react';
import { useCharacter } from '@/context/CharacterContext';

export function CustomBackground() {
  const { isCustomBgEnabled, customBgUrl, customBgFitting } = useCharacter();

  useEffect(() => {
    if (isCustomBgEnabled && customBgUrl) {
      document.body.style.backgroundImage = `url(${CSS.escape(customBgUrl)})`;
      document.body.style.backgroundAttachment = 'fixed';
      
      switch (customBgFitting) {
        case 'contain':
          document.body.style.backgroundSize = 'contain';
          document.body.style.backgroundRepeat = 'no-repeat';
          document.body.style.backgroundPosition = 'center center';
          break;
        case 'stretch':
          document.body.style.backgroundSize = '100% 100%';
          document.body.style.backgroundRepeat = 'no-repeat';
          document.body.style.backgroundPosition = 'center center';
          break;
        case 'center':
           document.body.style.backgroundSize = 'auto';
           document.body.style.backgroundRepeat = 'no-repeat';
           document.body.style.backgroundPosition = 'center center';
           break;
        case 'cover':
        default:
          document.body.style.backgroundSize = 'cover';
          document.body.style.backgroundRepeat = 'no-repeat';
          document.body.style.backgroundPosition = 'center center';
          break;
      }
    } else {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundAttachment = '';
    }

    // Cleanup function to reset styles when component unmounts
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundAttachment = '';
    };
  }, [isCustomBgEnabled, customBgUrl, customBgFitting]);

  return null;
}
