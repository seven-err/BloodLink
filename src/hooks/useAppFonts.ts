import { useEffect } from 'react';
import { Platform } from 'react-native';

export function useAppFonts() {
  // This hook is now a wrapper for web-specific font-family injection.

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'sf-pro-typography-style';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          body, button, input, select, textarea {
            font-family: "SFProText-Regular", "SFProDisplay-Regular", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);
}

