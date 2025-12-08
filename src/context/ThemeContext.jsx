import React, { createContext, useContext, useState, useEffect } from 'react';
import { DataContext } from './DataContext';

export const ThemeContext = createContext();

const themes = {
  dark: {
    id: 'dark',
    name: 'Tema Escuro (Aureon)',
    colors: {
      primary: '#D4AF37',
      secondary: '#F3E5AB',
      background: '#030305',
      surface: '#0A0A0C',
      border: 'rgba(212, 175, 55, 0.3)',
      text: '#F3E5AB',
      textSecondary: 'rgba(243, 229, 171, 0.7)',
      success: '#4ade80',
      warning: '#fb923c',
      error: '#f87171',
      gradient: 'linear-gradient(to bottom right, #030305, #0A0A0C)'
    }
  },
  light: {
    id: 'light',
    name: 'Tema Claro',
    colors: {
      primary: '#B8860B',        // Dourado escuro (DarkGoldenrod) - mantém identidade AUREON
      secondary: '#DAA520',       // Dourado médio (Goldenrod)
      background: '#FAFAF9',      // Off-white quente
      surface: '#FFFFFF',         // Branco puro para cards
      border: 'rgba(184, 134, 11, 0.2)',  // Dourado translúcido
      text: '#2C2C2C',            // Cinza escuro quente
      textSecondary: 'rgba(44, 44, 44, 0.65)',  // Cinza médio
      success: '#059669',         // Verde esmeralda
      warning: '#D97706',         // Âmbar
      error: '#DC2626',           // Vermelho
      gradient: 'linear-gradient(to bottom right, #FAFAF9, #F5F5F4)'  // Gradiente sutil quente
    }
  }
};

export const ThemeProvider = ({ children }) => {
  const dataContext = useContext(DataContext);
  const [currentTheme, setCurrentTheme] = useState(themes.dark);

  // ✅ Memoizar applyTheme com useCallback
  const applyTheme = React.useCallback((theme) => {
    const root = document.documentElement;
    
    // ✅ CRÍTICO: Aplicar data-theme attribute PRIMEIRO para ativar tokens CSS AUREON
    root.setAttribute('data-theme', theme.id);
    
    // ✅ REMOVER CSS Variables inline que podem sobrescrever os tokens
    // Os tokens CSS em theme-aureon-tokens.css têm prioridade
    const cssVarsToRemove = [
      '--color-primary', '--color-secondary', '--color-background', 
      '--color-surface', '--color-border', '--color-text',
      '--color-text-secondary', '--color-success', '--color-warning', '--color-error'
    ];
    cssVarsToRemove.forEach(cssVar => root.style.removeProperty(cssVar));
    
    // ✅ Aplicar background e color via classe CSS, não inline
    document.body.style.removeProperty('background');
    document.body.style.removeProperty('color');
    
    // ✅ Classe CSS para estilização condicional
    document.body.className = `theme-${theme.id}`;
    
    if (import.meta.env.DEV) {
      console.debug('[ThemeContext] ✅ Tema aplicado:', theme.id);
    }
  }, []);

  // ✅ Aplicar tema apenas quando theme ID realmente muda
  useEffect(() => {
    if (!dataContext?.config) return;
    
    const themeId = dataContext.config.theme || 'dark';
    const theme = themes[themeId] || themes.dark;
    
    // ✅ Comparar IDs antes de aplicar
    if (theme.id !== currentTheme.id) {
      setCurrentTheme(theme);
      applyTheme(theme);
    }
  }, [dataContext?.config?.theme]); // ✅ Removido currentTheme.id das deps

  const changeTheme = (themeId) => {
    if (import.meta.env.DEV) {
      console.debug('[ThemeContext] Mudando tema para:', themeId);
    }
    
    if (themes[themeId] && dataContext?.setConfig && dataContext?.config) {
      const newConfig = { ...dataContext.config, theme: themeId };
      dataContext.setConfig(newConfig);
      
      // Aplicar tema imediatamente
      const theme = themes[themeId];
      setCurrentTheme(theme);
      applyTheme(theme);
    } else {
      console.error('❌ [ThemeContext] Erro ao mudar tema:', {
        themeExists: !!themes[themeId],
        hasSetConfig: !!dataContext?.setConfig,
        hasConfig: !!dataContext?.config
      });
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, changeTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
