import { useEffect, useRef } from 'react';
import { Platform, ScrollView } from 'react-native';

// Inject custom scrollbar styles for web (weekly grid only). Runs once at module load.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    /* Hide scrollbar on login/auth pages */
    html::-webkit-scrollbar,
    body::-webkit-scrollbar {
      display: none;
    }
    html, body {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    /* Custom scrollbar for weekly grid */
    [data-weekly-grid-scroll]::-webkit-scrollbar {
      width: 8px;
    }
    [data-weekly-grid-scroll]::-webkit-scrollbar-track {
      background: transparent;
    }
    [data-weekly-grid-scroll]::-webkit-scrollbar-thumb {
      background: rgba(128, 128, 128, 0.3);
    }
    [data-weekly-grid-scroll]::-webkit-scrollbar-thumb:hover {
      background: rgba(128, 128, 128, 0.5);
    }
    [data-weekly-grid-scroll] {
      scrollbar-width: thin;
      scrollbar-color: rgba(128, 128, 128, 0.3) transparent;
    }
  `;
  document.head.appendChild(style);
}

// Hook to mark a ScrollView with the custom scrollbar data attribute (web only)
export const useWeeklyGridScrollbar = () => {
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && scrollRef.current) {
      // @ts-ignore - accessing DOM node on web
      const node = scrollRef.current as unknown as HTMLElement;
      if (node && node.setAttribute) {
        node.setAttribute('data-weekly-grid-scroll', 'true');
      }
    }
  }, []);

  return scrollRef;
};
