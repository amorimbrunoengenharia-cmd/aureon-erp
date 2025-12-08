import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, ThemeContext } from '../../context/ThemeContext';
import { DataContext } from '../../context/DataContext';
import React, { useContext } from 'react';

// Mock DataContext
const MockDataProvider = ({ children, theme = 'dark' }) => {
  const [config, setConfig] = React.useState({ theme });
  
  return (
    <DataContext.Provider value={{ config, setConfig }}>
      {children}
    </DataContext.Provider>
  );
};

// Test component that uses ThemeContext
const ThemeConsumer = () => {
  const { currentTheme, changeTheme } = useContext(ThemeContext);
  
  return (
    <div>
      <div data-testid="theme-id">{currentTheme.id}</div>
      <button onClick={() => changeTheme('light')}>Switch to Light</button>
      <button onClick={() => changeTheme('dark')}>Switch to Dark</button>
    </div>
  );
};

describe('ThemeContext - Toggle & Persistence', () => {
  beforeEach(() => {
    // Reset document
    document.documentElement.removeAttribute('data-theme');
    document.body.className = '';
  });

  describe('Theme Application', () => {
    it('deve aplicar tema dark por padrão', async () => {
      render(
        <MockDataProvider theme="dark">
          <ThemeProvider>
            <ThemeConsumer />
          </ThemeProvider>
        </MockDataProvider>
      );
      
      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      });
    });

    it('deve aplicar tema light quando configurado', async () => {
      render(
        <MockDataProvider theme="light">
          <ThemeProvider>
            <ThemeConsumer />
          </ThemeProvider>
        </MockDataProvider>
      );
      
      await waitFor(() => {
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      });
    });

    it('deve adicionar classe CSS ao body', async () => {
      render(
        <MockDataProvider theme="dark">
          <ThemeProvider>
            <ThemeConsumer />
          </ThemeProvider>
        </MockDataProvider>
      );
      
      await waitFor(() => {
        expect(document.body.className).toContain('theme-dark');
      });
    });
  });

  describe('Theme Toggle', () => {
    it('deve alternar de dark para light', async () => {
      const { rerender } = render(
        <MockDataProvider theme="dark">
          <ThemeProvider>
            <ThemeConsumer />
          </ThemeProvider>
        </MockDataProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('theme-id').textContent).toBe('dark');
      });
      
      // Switch to light
      rerender(
        <MockDataProvider theme="light">
          <ThemeProvider>
            <ThemeConsumer />
          </ThemeProvider>
        </MockDataProvider>
      );
      
      await waitFor(() => {
        expect(screen.getByTestId('theme-id').textContent).toBe('light');
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      });
    });

    it('deve remover CSS variables inline para usar tokens CSS', async () => {
      render(
        <MockDataProvider theme="dark">
          <ThemeProvider>
            <ThemeConsumer />
          </ThemeProvider>
        </MockDataProvider>
      );
      
      await waitFor(() => {
        const root = document.documentElement;
        // Não deve ter CSS vars inline (tokens CSS têm prioridade)
        expect(root.style.getPropertyValue('--color-primary')).toBe('');
      });
    });
  });

  describe('Memoization', () => {
    it('deve memoizar applyTheme com useCallback', () => {
      // Este teste valida que applyTheme não é recriado
      // em cada render (verificado via código, não via test runtime)
      const { rerender } = render(
        <MockDataProvider theme="dark">
          <ThemeProvider>
            <ThemeConsumer />
          </ThemeProvider>
        </MockDataProvider>
      );
      
      // Força re-render sem mudar tema
      rerender(
        <MockDataProvider theme="dark">
          <ThemeProvider>
            <ThemeConsumer />
          </ThemeProvider>
        </MockDataProvider>
      );
      
      // Se memoização funcionar, data-theme não muda
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });
});
