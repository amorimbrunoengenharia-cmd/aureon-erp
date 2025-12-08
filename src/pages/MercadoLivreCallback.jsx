import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { trocarCodigoPorToken } from '../services/mercadoLivreService';

/**
 * Página de callback do Mercado Livre
 * Recebe o código de autorização e troca por token
 */
export default function MercadoLivreCallback() {
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [mensagem, setMensagem] = useState('Conectando com Mercado Livre...');

  useEffect(() => {
    const processarCallback = async () => {
      // Obter código da URL
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        setStatus('error');
        setMensagem(`Erro: ${error}`);
        setTimeout(() => {
          window.location.href = '/#mercado-livre';
        }, 3000);
        return;
      }

      if (!code) {
        setStatus('error');
        setMensagem('Código de autorização não encontrado');
        setTimeout(() => {
          window.location.href = '/#mercado-livre';
        }, 3000);
        return;
      }

      // Trocar código por token
      const token = await trocarCodigoPorToken(code);

      if (token) {
        setStatus('success');
        setMensagem('✅ Conectado com sucesso!');
        setTimeout(() => {
          window.location.href = '/#mercado-livre';
        }, 2000);
      } else {
        setStatus('error');
        setMensagem('Erro ao obter token de acesso');
        setTimeout(() => {
          window.location.href = '/#mercado-livre';
        }, 3000);
      }
    };

    processarCallback();
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, var(--aureon-bg), var(--aureon-surface))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--aureon-surface)',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        borderRadius: '16px',
        padding: '48px',
        maxWidth: '500px',
        textAlign: 'center'
      }}>
        {status === 'loading' && (
          <>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              animation: 'spin 1s linear infinite'
            }}>
              <Loader size={80} color="var(--aureon-gold)" />
            </div>
            <h2 style={{ color: 'var(--aureon-gold)', marginBottom: '12px', fontSize: '24px' }}>
              Conectando...
            </h2>
            <p style={{ color: '#aaa', fontSize: '16px' }}>
              {mensagem}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle size={80} color="#4ade80" style={{ margin: '0 auto 24px' }} />
            <h2 style={{ color: '#4ade80', marginBottom: '12px', fontSize: '24px' }}>
              Sucesso!
            </h2>
            <p style={{ color: '#aaa', fontSize: '16px' }}>
              {mensagem}
            </p>
            <p style={{ color: '#666', fontSize: '14px', marginTop: '16px' }}>
              Redirecionando...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={80} color="#f87171" style={{ margin: '0 auto 24px' }} />
            <h2 style={{ color: '#f87171', marginBottom: '12px', fontSize: '24px' }}>
              Erro
            </h2>
            <p style={{ color: '#aaa', fontSize: '16px' }}>
              {mensagem}
            </p>
            <p style={{ color: '#666', fontSize: '14px', marginTop: '16px' }}>
              Redirecionando...
            </p>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
