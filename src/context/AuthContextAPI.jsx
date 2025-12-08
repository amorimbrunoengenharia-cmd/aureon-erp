import React, { createContext, useState, useEffect, useContext } from 'react';
import apiService from '../services/ApiService';

export const AuthContext = createContext();

/**
 * AuthContext com API Integration
 * Gerencia autenticação via JWT e RBAC
 */

// ✅ NORMALIZAÇÃO DE ROLES (Backend lowercase → Frontend uppercase)
const normalizeRole = (role) => {
  if (!role) return 'GUEST';
  const roleStr = String(role).toLowerCase();
  
  // Map backend roles to frontend roles
  const roleMap = {
    'admin': 'CEO',
    'ceo': 'CEO',
    'gerente': 'GERENTE',
    'vendas': 'VENDAS',
    'estoque': 'ESTOQUE',
    'compras': 'COMPRAS',
    'financeiro': 'FINANCEIRO'
  };
  
  return roleMap[roleStr] || roleStr.toUpperCase();
};

// ===== ROLES E PERMISSÕES =====
export const ROLES = {
  // ✅ Definição unificada (apenas uppercase)
  CEO: {
    id: 'CEO',
    nome: 'CEO',
    cor: '#D4AF37',
    permissions: { all: true }
  },
  GERENTE: {
    id: 'GERENTE',
    nome: 'Gerente',
    cor: '#0891B2',
    permissions: { all: true }
  },
  VENDAS: {
    id: 'VENDAS',
    nome: 'Vendas',
    cor: '#3B82F6',
    permissions: {
      produtos: { read: true },
      vendas: { create: true, read: true, update: true },
      clientes: { create: true, read: true, update: true },
      prescriptions: { create: true, read: true, update: true }
    }
  },
  ESTOQUE: {
    id: 'ESTOQUE',
    nome: 'Estoque',
    cor: '#10B981',
    permissions: {
      produtos: { create: true, read: true, update: true, delete: true },
      movimentacoes: { create: true, read: true }
    }
  },
  COMPRAS: {
    id: 'COMPRAS',
    nome: 'Compras',
    cor: '#F59E0B',
    permissions: {
      produtos: { read: true },
      fornecedores: { create: true, read: true, update: true },
      compras: { create: true, read: true, update: true }
    }
  },
  FINANCEIRO: {
    id: 'FINANCEIRO',
    nome: 'Financeiro',
    cor: '#8B5CF6',
    permissions: {
      finance: { create: true, read: true, update: true },
      vendas: { read: true },
      relatorios: { read: true, export: true }
    }
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authReady, setAuthReady] = useState(false); // ✅ Flag de inicialização completa

  // Load user from token on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('aureon_token');
        const savedUser = localStorage.getItem('aureon_user');
        
        if (token && savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            setIsAuthenticated(true);
          } catch (error) {
            console.error('Failed to restore session:', error);
            // Não chamar logout aqui para evitar loop
            localStorage.removeItem('aureon_token');
            localStorage.removeItem('aureon_user');
          }
        }
      } finally {
        setLoading(false);
        setAuthReady(true); // ✅ Auth inicialização completa
      }
    };
    
    initAuth();
  }, []);

  /**
   * Login via API
   */
  const login = async (username, password) => {
    try {
      const response = await apiService.login(username, password);
      
      // ✅ Normaliza role do backend (lowercase) para frontend (uppercase)
      const normalizedRole = normalizeRole(response.user.role);
      
      const userData = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email,
        role: normalizedRole, // ✅ Role normalizado
        tenant_id: response.user.tenant_id,
        settings: response.user.settings || {}
      };

      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('aureon_user', JSON.stringify(userData));

      // Log audit (sem await para não bloquear o login)
      // O token já foi configurado pelo apiService.login
      apiService.createAuditLog({
        action: 'LOGIN',
        resource_type: 'auth',
        resource_id: userData.id
      }).catch(err => {
        // Silencioso: audit log é opcional
        console.debug('Audit log skipped:', err.message);
      });

      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    try {
      // Log audit before clearing session
      if (user) {
        await apiService.createAuditLog({
          action: 'LOGOUT',
          resource_type: 'auth',
          resource_id: user.id
        }).catch(err => console.warn('Audit log failed:', err));
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    apiService.clearTokens();
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('aureon_user');
  };

  /**
   * Check permission
   */
  const checkPermission = (resource, action) => {
    if (!user) return false;
    
    const role = ROLES[user.role];
    if (!role) return false;

    // CEO has all permissions
    if (role.permissions.all) return true;

    const resourcePermissions = role.permissions[resource];
    if (!resourcePermissions) return false;

    return resourcePermissions[action] === true;
  };

  /**
   * Get role info
   */
  const getRoleInfo = () => {
    if (!user) return null;
    
    // Tentar encontrar role (case-insensitive)
    const roleKey = Object.keys(ROLES).find(
      key => key.toLowerCase() === user.role.toLowerCase()
    );
    
    if (roleKey) {
      return ROLES[roleKey];
    }
    
    // Fallback: se role não encontrado, assumir CEO para admin
    console.warn(`[AuthContext] Role '${user.role}' não encontrado, usando CEO como fallback`);
    return ROLES.CEO || ROLES.ceo || ROLES.admin;
  };

  /**
   * Update user settings
   */
  const updateSettings = (newSettings) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      settings: { ...user.settings, ...newSettings }
    };

    setUser(updatedUser);
    localStorage.setItem('aureon_user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    authReady, // ✅ Flag de inicialização completa
    isAuthenticated,
    login,
    logout,
    checkPermission,
    hasPermission: checkPermission, // ✅ Alias para compatibilidade
    getRoleInfo,
    updateSettings,
    // Legacy support - compatibilidade com código antigo
    currentUser: user, // Alias para user
    role: user?.role,
    username: user?.username,
    
    // Métodos legados que podem ser usados por componentes antigos
    addAuditLog: async (logData) => {
      try {
        return await apiService.createAuditLog(logData);
      } catch (error) {
        console.error('Error creating audit log:', error);
      }
    },
    getAuditLog: async () => {
      try {
        return await apiService.getAuditLogs();
      } catch (error) {
        console.error('Error fetching audit log:', error);
        return [];
      }
    },
    getUserSettings: () => {
      if (!user) {
        if (import.meta.env.DEV) {
          console.warn('[AuthContext] getUserSettings: no user logged in, returning default');
        }
        return { ocultarValores: false };
      }
      
      // ✅ Merge defaultSettings do role com user settings
      const role = getRoleInfo();
      const defaultSettings = {
        // CEO defaults
        metaCrescimento: 20,
        auditView: true,
        alertasCriticos: true,
        // ESTOQUE defaults
        ocultarValores: false,
        alertaEstoqueMinimo: 5,
        alertaEstoqueCritico: 0,
        notificacoesAtivas: true,
        // COMPRAS defaults
        diasSeguranca: 3,
        leadTimePadrao: 7,
        alertasReposicao: true,
        exibirFormulas: true,
        // VENDAS defaults
        metaPessoal: 0,
        mostrarLucro: true,
        ...(role?.defaultSettings || {})
      };
      
      return { ...defaultSettings, ...user.settings };
    },
    updateUserSettings: updateSettings,
    getCurrentRole: getRoleInfo,
    users: [], // Para compatibilidade, mas não usado na versão API
    resolveUserName: (userId) => userId, // Placeholder
    isFieldVisible: (field) => true, // Placeholder
    isFieldEditable: (field) => true // Placeholder
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthProvider;
