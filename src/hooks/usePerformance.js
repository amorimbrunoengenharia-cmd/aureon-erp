import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for debouncing values
 * Useful for search inputs, API calls, etc
 * 
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds (default: 500)
 * @returns {any} Debounced value
 * 
 * @example
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 500);
 * 
 * useEffect(() => {
 *   // API call with debounced value
 *   searchAPI(debouncedSearch);
 * }, [debouncedSearch]);
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Custom hook for throttling function calls
 * Ensures function is called at most once per specified interval
 * 
 * @param {Function} callback - Function to throttle
 * @param {number} delay - Delay in milliseconds (default: 1000)
 * @returns {Function} Throttled function
 * 
 * @example
 * const handleScroll = useThrottle(() => {
 *   console.log('Scroll event');
 * }, 1000);
 * 
 * window.addEventListener('scroll', handleScroll);
 */
export const useThrottle = (callback, delay = 1000) => {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    const now = Date.now();
    
    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    }
  }, [callback, delay]);
};

/**
 * Custom hook for lazy loading images
 * Only loads image when it's visible in viewport
 * 
 * @param {string} src - Image source URL
 * @param {string} placeholder - Placeholder image URL
 * @returns {Object} { imageSrc, isLoading, error }
 * 
 * @example
 * const { imageSrc, isLoading } = useLazyImage('/path/to/image.jpg', '/placeholder.jpg');
 * <img src={imageSrc} alt="..." className={isLoading ? 'blur' : ''} />
 */
export const useLazyImage = (src, placeholder = '') => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
    
    img.onerror = (e) => {
      setError(e);
      setIsLoading(false);
    };
    
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { imageSrc, isLoading, error };
};

/**
 * Custom hook for infinite scroll / pagination
 * Detects when user scrolls to bottom
 * 
 * @param {Function} callback - Function to call when reached bottom
 * @param {number} threshold - Pixels from bottom to trigger (default: 100)
 * 
 * @example
 * const loadMore = () => {
 *   // Load more items
 * };
 * 
 * useInfiniteScroll(loadMore, 200);
 */
export const useInfiniteScroll = (callback, threshold = 100) => {
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;

      if (scrollTop + clientHeight >= scrollHeight - threshold) {
        callback();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [callback, threshold]);
};

/**
 * Custom hook for local storage with sync
 * Automatically syncs with localStorage
 * 
 * @param {string} key - localStorage key
 * @param {any} initialValue - Initial value
 * @returns {Array} [value, setValue, removeValue]
 * 
 * @example
 * const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

/**
 * Custom hook for previous value
 * Keeps track of previous value of a state
 * 
 * @param {any} value - Current value
 * @returns {any} Previous value
 * 
 * @example
 * const [count, setCount] = useState(0);
 * const prevCount = usePrevious(count);
 * console.log(`Count changed from ${prevCount} to ${count}`);
 */
export const usePrevious = (value) => {
  const ref = useRef();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
};

/**
 * Custom hook for media query
 * Detects if media query matches
 * 
 * @param {string} query - Media query string
 * @returns {boolean} True if matches
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};

/**
 * Custom hook for online status
 * Detects if user is online/offline
 * 
 * @returns {boolean} True if online
 * 
 * @example
 * const isOnline = useOnlineStatus();
 * {!isOnline && <div>Você está offline</div>}
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};

/**
 * Custom hook for window size
 * Tracks window width and height
 * 
 * @returns {Object} { width, height, isMobile, isTablet, isDesktop }
 * 
 * @example
 * const { width, isMobile } = useWindowSize();
 * {isMobile && <MobileMenu />}
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    ...windowSize,
    isMobile: windowSize.width < 768,
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024
  };
};

export default {
  useDebounce,
  useThrottle,
  useLazyImage,
  useInfiniteScroll,
  useLocalStorage,
  usePrevious,
  useMediaQuery,
  useOnlineStatus,
  useWindowSize
};
