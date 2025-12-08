import React, { Suspense, lazy } from 'react';

/**
 * Loading fallback component
 */
const LoadingFallback = ({ message = 'Carregando...' }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600 text-lg">{message}</p>
    </div>
  </div>
);

/**
 * Error boundary fallback
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-red-50">
          <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-red-600 mb-4">⚠️ Erro ao Carregar</h2>
            <p className="text-gray-700 mb-4">
              Ocorreu um erro ao carregar este componente.
            </p>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto mb-4">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              🔄 Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Lazy load helper with error boundary
 */
export const lazyLoad = (importFunc, fallbackMessage) => {
  const LazyComponent = lazy(importFunc);

  return (props) => (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback message={fallbackMessage} />}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * Preload component function
 * Call this on hover/focus to preload before navigation
 */
export const preloadComponent = (importFunc) => {
  importFunc();
};

/**
 * Lazy loaded page components
 */
export const Dashboard = lazyLoad(
  () => import('../pages/Dashboard'),
  'Carregando Dashboard...'
);

export const SalesAnalytics = lazyLoad(
  () => import('../pages/SalesAnalytics'),
  'Carregando Analytics...'
);

export const Inventory = lazyLoad(
  () => import('../pages/Inventory'),
  'Carregando Inventário...'
);

export const Calculator = lazyLoad(
  () => import('../pages/Calculator'),
  'Carregando Calculadora...'
);

export const BackupManager = lazyLoad(
  () => import('../pages/BackupManager'),
  'Carregando Backup Manager...'
);

export const DashboardRealTime = lazyLoad(
  () => import('../pages/DashboardRealTime'),
  'Carregando Dashboard em Tempo Real...'
);

export default {
  LoadingFallback,
  ErrorBoundary,
  lazyLoad,
  preloadComponent,
  Dashboard,
  SalesAnalytics,
  Inventory,
  Calculator,
  BackupManager,
  DashboardRealTime
};
