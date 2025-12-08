import { useState, useEffect } from 'react';

/**
 * Custom hook para debounce de valores
 * Útil para evitar muitas requisições em buscas/filtros
 * 
 * @param {any} value - Valor a ser debounced
 * @param {number} delay - Delay em ms (default: 500ms)
 * @returns {any} - Valor debounced
 * 
 * @example
 * function SearchBar() {
 *   const [search, setSearch] = useState('');
 *   const debouncedSearch = useDebounce(search, 500);
 * 
 *   useEffect(() => {
 *     if (debouncedSearch) {
 *       fetchProducts(debouncedSearch);
 *     }
 *   }, [debouncedSearch]);
 * 
 *   return <input value={search} onChange={e => setSearch(e.target.value)} />;
 * }
 */
export function useDebounce(value, delay = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Setar timer para atualizar valor após delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup - cancelar timer se valor mudar antes do delay
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para debounce de callback (alternativa)
 * 
 * @example
 * function SearchBar() {
 *   const debouncedSearch = useDebouncedCallback((value) => {
 *     fetchProducts(value);
 *   }, 500);
 * 
 *   return <input onChange={e => debouncedSearch(e.target.value)} />;
 * }
 */
export function useDebouncedCallback(callback, delay = 500) {
  const [timer, setTimer] = useState(null);

  return (...args) => {
    if (timer) {
      clearTimeout(timer);
    }

    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimer(newTimer);
  };
}
