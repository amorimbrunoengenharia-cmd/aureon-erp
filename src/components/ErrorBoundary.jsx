import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🔴 [ErrorBoundary] Component error caught:', error, errorInfo);
    this.setState({ error, errorInfo });
    
    // Log para tracking (se disponível)
    if (window.eventLogger) {
      window.eventLogger.error('Component Error', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }

    // Auto-report bug to backend
    this.reportBug(error, errorInfo);
  }

  async reportBug(error, errorInfo) {
    try {
      const token = localStorage.getItem('aureon_token');
      if (!token) return; // User not authenticated

      const bugData = {
        title: `React Error: ${error.message || 'Unknown error'}`,
        description: `Automatic bug report from ErrorBoundary\n\nComponent Stack:\n${errorInfo.componentStack}`,
        severity: 'high',
        priority: 'high',
        category: 'Frontend',
        error_message: error.message,
        error_stack: error.stack,
        component_name: this.getComponentName(errorInfo.componentStack),
        user_agent: navigator.userAgent,
        url: window.location.href,
        metadata: {
          timestamp: new Date().toISOString(),
          auto_reported: true,
          react_version: React.version
        }
      };

      await fetch('/api/it/bug-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bugData)
      });

      console.log('✅ Bug report sent automatically');
    } catch (err) {
      console.error('Failed to auto-report bug:', err);
    }
  }

  getComponentName(componentStack) {
    if (!componentStack) return 'Unknown';
    const match = componentStack.match(/at (\w+)/);
    return match ? match[1] : 'Unknown';
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          background: '#FEE',
          border: '2px solid #C00',
          borderRadius: '8px',
          margin: '16px'
        }}>
          <h2 style={{ color: '#C00' }}>⚠️ Algo deu errado</h2>
          <p>Esta seção encontrou um erro. Tente recarregar a página.</p>
          {this.props.showDetails && (
            <details style={{ marginTop: '16px' }}>
              <summary>Detalhes técnicos</summary>
              <pre style={{ 
                background: '#FFF', 
                padding: '12px', 
                overflow: 'auto',
                fontSize: '12px' 
              }}>
                {this.state.error && this.state.error.toString()}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#007BFF',
              color: '#FFF',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
