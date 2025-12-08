import { useEffect } from 'react';

/**
 * Hook para atalhos de teclado globais
 * @param {Object} shortcuts - Objeto com atalhos no formato { 'Ctrl+K': callback }
 */
export default function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Constrói a string do atalho
      const key = [];
      if (e.ctrlKey || e.metaKey) key.push('Ctrl');
      if (e.altKey) key.push('Alt');
      if (e.shiftKey) key.push('Shift');
      key.push(e.key.toUpperCase());
      
      const shortcut = key.join('+');
      
      // Verifica se existe callback para o atalho
      if (shortcuts[shortcut]) {
        e.preventDefault();
        shortcuts[shortcut]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
