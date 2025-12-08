/**
 * DataContext API Adapter
 * Wrapper que permite migração gradual de localStorage para API
 * 
 * Usage:
 * 1. Modo híbrido: Usa API primeiro, fallback para localStorage
 * 2. Modo API-only: Desabilita localStorage completamente
 * 3. Sincronização: Pode sincronizar dados entre API e localStorage
 */

import apiService from '../services/ApiService';

const USE_API = import.meta.env.VITE_USE_API !== 'false'; // Default: true
const FALLBACK_TO_LOCALSTORAGE = import.meta.env.VITE_FALLBACK_LOCALSTORAGE !== 'false'; // Default: true

export class DataAdapter {
  constructor(dbPrefix = 'aureon_') {
    this.dbPrefix = dbPrefix;
    this.useAPI = USE_API;
    this.fallbackToLocalStorage = FALLBACK_TO_LOCALSTORAGE;
  }

  /**
   * Load data from localStorage
   */
  loadFromLocalStorage(key, defaultValue = []) {
    try {
      const fullKey = `${this.dbPrefix}${key}`;
      const item = localStorage.getItem(fullKey);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Failed to load ${key} from localStorage:`, error);
      return defaultValue;
    }
  }

  /**
   * Save data to localStorage
   */
  saveToLocalStorage(key, data) {
    try {
      const fullKey = `${this.dbPrefix}${key}`;
      localStorage.setItem(fullKey, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage:`, error);
      return false;
    }
  }

  /**
   * Get products - API with localStorage fallback
   */
  async getProducts(filters = {}) {
    if (this.useAPI) {
      try {
        const response = await apiService.getProducts(filters);
        // Cache to localStorage for offline access
        if (this.fallbackToLocalStorage) {
          this.saveToLocalStorage('products', response.data);
        }
        return response.data;
      } catch (error) {
        console.warn('API failed, using localStorage:', error);
        if (this.fallbackToLocalStorage) {
          return this.loadFromLocalStorage('products', []);
        }
        throw error;
      }
    }
    
    return this.loadFromLocalStorage('products', []);
  }

  /**
   * Create product
   */
  async createProduct(product) {
    if (this.useAPI) {
      try {
        const response = await apiService.createProduct(product);
        // Update localStorage cache
        if (this.fallbackToLocalStorage) {
          const products = this.loadFromLocalStorage('products', []);
          products.push(response.data);
          this.saveToLocalStorage('products', products);
        }
        return response.data;
      } catch (error) {
        if (this.fallbackToLocalStorage) {
          // Fallback: save to localStorage with temp ID
          const tempProduct = { ...product, id: `temp_${Date.now()}` };
          const products = this.loadFromLocalStorage('products', []);
          products.push(tempProduct);
          this.saveToLocalStorage('products', products);
          return tempProduct;
        }
        throw error;
      }
    }

    // localStorage only mode
    const products = this.loadFromLocalStorage('products', []);
    const newProduct = { ...product, id: `local_${Date.now()}` };
    products.push(newProduct);
    this.saveToLocalStorage('products', products);
    return newProduct;
  }

  /**
   * Update product
   */
  async updateProduct(id, updates) {
    if (this.useAPI) {
      try {
        const response = await apiService.updateProduct(id, updates);
        // Update localStorage cache
        if (this.fallbackToLocalStorage) {
          const products = this.loadFromLocalStorage('products', []);
          const index = products.findIndex(p => p.id === id);
          if (index !== -1) {
            products[index] = response.data;
            this.saveToLocalStorage('products', products);
          }
        }
        return response.data;
      } catch (error) {
        if (this.fallbackToLocalStorage) {
          const products = this.loadFromLocalStorage('products', []);
          const index = products.findIndex(p => p.id === id);
          if (index !== -1) {
            products[index] = { ...products[index], ...updates };
            this.saveToLocalStorage('products', products);
            return products[index];
          }
        }
        throw error;
      }
    }

    // localStorage only mode
    const products = this.loadFromLocalStorage('products', []);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    
    products[index] = { ...products[index], ...updates };
    this.saveToLocalStorage('products', products);
    return products[index];
  }

  /**
   * Delete product
   */
  async deleteProduct(id) {
    if (this.useAPI) {
      try {
        await apiService.deleteProduct(id);
        // Update localStorage cache
        if (this.fallbackToLocalStorage) {
          const products = this.loadFromLocalStorage('products', []);
          const filtered = products.filter(p => p.id !== id);
          this.saveToLocalStorage('products', filtered);
        }
        return true;
      } catch (error) {
        if (this.fallbackToLocalStorage) {
          const products = this.loadFromLocalStorage('products', []);
          const filtered = products.filter(p => p.id !== id);
          this.saveToLocalStorage('products', filtered);
          return true;
        }
        throw error;
      }
    }

    // localStorage only mode
    const products = this.loadFromLocalStorage('products', []);
    const filtered = products.filter(p => p.id !== id);
    this.saveToLocalStorage('products', filtered);
    return true;
  }

  /**
   * Get clients
   */
  async getClients(filters = {}) {
    if (this.useAPI) {
      try {
        const response = await apiService.getClients(filters);
        if (this.fallbackToLocalStorage) {
          this.saveToLocalStorage('clients', response.data);
        }
        return response.data;
      } catch (error) {
        if (this.fallbackToLocalStorage) {
          return this.loadFromLocalStorage('clients', []);
        }
        throw error;
      }
    }
    
    return this.loadFromLocalStorage('clients', []);
  }

  /**
   * Get sales
   */
  async getSales(filters = {}) {
    if (this.useAPI) {
      try {
        const response = await apiService.getSales(filters);
        if (this.fallbackToLocalStorage) {
          this.saveToLocalStorage('sales', response.data);
        }
        return response.data;
      } catch (error) {
        if (this.fallbackToLocalStorage) {
          return this.loadFromLocalStorage('sales', []);
        }
        throw error;
      }
    }
    
    return this.loadFromLocalStorage('sales', []);
  }

  /**
   * Create sale
   */
  async createSale(sale) {
    if (this.useAPI) {
      try {
        const response = await apiService.createSale(sale);
        if (this.fallbackToLocalStorage) {
          const sales = this.loadFromLocalStorage('sales', []);
          sales.push(response.data);
          this.saveToLocalStorage('sales', sales);
        }
        return response.data;
      } catch (error) {
        if (this.fallbackToLocalStorage) {
          const tempSale = { ...sale, id: `temp_${Date.now()}` };
          const sales = this.loadFromLocalStorage('sales', []);
          sales.push(tempSale);
          this.saveToLocalStorage('sales', sales);
          return tempSale;
        }
        throw error;
      }
    }

    const sales = this.loadFromLocalStorage('sales', []);
    const newSale = { ...sale, id: `local_${Date.now()}` };
    sales.push(newSale);
    this.saveToLocalStorage('sales', sales);
    return newSale;
  }

  /**
   * Sync localStorage to API
   * Upload all localStorage data to backend
   */
  async syncToAPI() {
    const syncResults = {
      products: { success: 0, failed: 0 },
      clients: { success: 0, failed: 0 },
      sales: { success: 0, failed: 0 },
      prescriptions: { success: 0, failed: 0 }
    };

    try {
      // Sync products
      const products = this.loadFromLocalStorage('products', []);
      for (const product of products) {
        try {
          await apiService.createProduct(product);
          syncResults.products.success++;
        } catch (error) {
          console.error('Failed to sync product:', error);
          syncResults.products.failed++;
        }
      }

      // Sync clients
      const clients = this.loadFromLocalStorage('clients', []);
      for (const client of clients) {
        try {
          await apiService.createClient(client);
          syncResults.clients.success++;
        } catch (error) {
          syncResults.clients.failed++;
        }
      }

      // Sync sales
      const sales = this.loadFromLocalStorage('sales', []);
      for (const sale of sales) {
        try {
          await apiService.createSale(sale);
          syncResults.sales.success++;
        } catch (error) {
          syncResults.sales.failed++;
        }
      }

      return syncResults;
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }

  /**
   * Clear all localStorage data
   */
  clearLocalStorage() {
    const keys = ['products', 'clients', 'sales', 'prescriptions', 'suppliers', 'finance'];
    keys.forEach(key => {
      localStorage.removeItem(`${this.dbPrefix}${key}`);
    });
  }
}

// Export singleton
const dataAdapter = new DataAdapter();
export default dataAdapter;
