import React, { useState, useEffect, useContext } from 'react';
import { ShoppingBag, Link as LinkIcon, AlertCircle, CheckCircle, Clock, RefreshCw, Users, MessageSquare, RotateCcw, TrendingUp, Star } from 'lucide-react';
import { DataContext } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import { 
  iniciarAutenticacao, 
  isConectado, 
  desconectar,
  sincronizacaoAutomatica,
  buscarDadosUsuario,
  buscarFeedback,
  buscarDevolucoes,
  buscarClientes,
  buscarPedidos
} from '../services/mercadoLivreService';

/**
 * Aba completa de integração com Mercado Livre
 * 
 * Funcionalidades:
 * - Sincronização automática de vendas
 * - Importação de clientes
 * - Monitoramento de feedback/avaliações
 * - Gestão de devoluções
 * - Métricas em tempo real
 */
export default function MercadoLivreTab() {
  const { addVenda, addCliente, addDevolucao, updateVenda } = useContext(DataContext);
  const { theme } = useTheme();
  const [conectado, setConectado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [sincronizando, setSincronizando] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [intervaloSync, setIntervaloSync] = useState(null);
  
  // Dados do Mercado Livre
  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [vendas, setVendas] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [devolucoes, setDevolucoes] = useState([]);
  
  // Estatísticas
  const [stats, setStats] = useState({
    vendasImportadas: 0,
    clientesImportados: 0,
    feedbackRecebido: 0,
    devolucoesAbertas: 0
  });

  useEffect(() => {
    setConectado(isConectado());
    
    if (isConectado()) {
      carregarDadosIniciais();
    }
    
    // Cleanup
    return () => {
      if (intervaloSync) clearInterval(intervaloSync);
    };
  }, []);

  const carregarDadosIniciais = async () => {
    try {
      const [usuario, vendasML, clientesML, feedbackML, devolucoesML] = await Promise.all([
        buscarDadosUsuario(),
        buscarPedidos({ limit: 20 }),
        buscarClientes(),
        buscarFeedback(),
        buscarDevolucoes()
      ]);
      
      setDadosUsuario(usuario);
      setVendas(vendasML);
      setClientes(clientesML);
      setFeedback(feedbackML);
      setDevolucoes(devolucoesML);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const handleConectar = async () => {
    setCarregando(true);
    await iniciarAutenticacao();
    setCarregando(false);
  };

  const handleDesconectar = () => {
    if (confirm('Desconectar do Mercado Livre?')) {
      desconectar();
      setConectado(false);
      setAutoSync(false);
      if (intervaloSync) clearInterval(intervaloSync);
    }
  };

  const handleSincronizar = async () => {
    setSincronizando(true);
    try {
      const resultado = await sincronizacaoAutomatica({
        addVenda,
        addCliente,
        addDevolucao,
        updateVenda
      });
      
      setStats({
        vendasImportadas: resultado.vendas,
        clientesImportados: resultado.clientes,
        feedbackRecebido: resultado.feedback,
        devolucoesAbertas: resultado.devolucoes
      });
      
      // Recarregar dados
      await carregarDadosIniciais();
      
      const errosMsg = resultado.erros.length > 0 
        ? `\n\n⚠️ ${resultado.erros.length} erros encontrados` 
        : '';
      
      alert(`✅ Sincronização concluída!\n\n📦 Vendas: ${resultado.vendas}\n👥 Clientes: ${resultado.clientes}\n⭐ Feedback: ${resultado.feedback}\n🔄 Devoluções: ${resultado.devolucoes}${errosMsg}`);
    } catch (error) {
      alert('❌ Erro ao sincronizar: ' + error.message);
    } finally {
      setSincronizando(false);
    }
  };

  const toggleAutoSync = () => {
    if (!autoSync) {
      // Ativar sincronização automática a cada 5 minutos
      const id = setInterval(() => {
        console.log('🔄 Sincronização automática...');
        handleSincronizar();
      }, 300000); // 5 minutos
      
      setIntervaloSync(id);
      setAutoSync(true);
      alert('✅ Sincronização automática ativada!\nDados serão atualizados a cada 5 minutos.');
    } else {
      // Desativar
      if (intervaloSync) clearInterval(intervaloSync);
      setIntervaloSync(null);
      setAutoSync(false);
      alert('⏸️ Sincronização automática desativada.');
    }
  };

  // Calcular métricas
  const mediaFeedback = feedback.length > 0 
    ? (feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length).toFixed(1)
    : '0.0';
  
  const taxaDevolucao = vendas.length > 0
    ? ((devolucoes.length / vendas.length) * 100).toFixed(1)
    : '0.0';

  return (
    <div style={{ padding: 24, color: theme === 'light' ? '#1f2937' : '#fff', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: 'var(--aureon-gold)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShoppingBag size={28} strokeWidth={2} />
          Integração Mercado Livre
        </h2>
        <p style={{ color: theme === 'light' ? '#6b7280' : '#aaa', fontSize: 14 }}>
          {conectado 
            ? `🟢 Conectado${autoSync ? ' • Sincronização automática ATIVA' : ''}` 
            : '🔴 Não conectado - Configure as credenciais em Configurações > Integrações'
          }
        </p>
      </div>

      {/* Status de Conexão */}
      <div style={{
        background: theme === 'light' 
          ? 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
          : 'linear-gradient(135deg, var(--aureon-surface) 0%, #1a1a1d 100%)',
        border: `2px solid ${conectado ? '#4ade80' : '#fb923c'}`,
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
        textAlign: 'center'
      }}>
        {conectado ? (
          <CheckCircle size={48} color="#4ade80" style={{ margin: '0 auto 16px' }} />
        ) : (
          <AlertCircle size={48} color="#fb923c" style={{ margin: '0 auto 16px' }} />
        )}
        
        <h3 style={{ color: conectado ? '#4ade80' : '#fb923c', marginBottom: 8 }}>
          {conectado ? 'Conectado ao Mercado Livre' : 'Não Conectado'}
        </h3>
        
        <p style={{ color: theme === 'light' ? '#6b7280' : '#aaa', fontSize: 14, marginBottom: 20 }}>
          {conectado 
            ? dadosUsuario 
              ? `Bem-vindo, ${dadosUsuario.nickname}! Reputação: ${dadosUsuario.seller_reputation?.level_id || 'N/A'}`
              : 'Carregando dados da conta...'
            : 'Conecte sua conta para importar vendas, clientes e feedback automaticamente'}
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {!conectado ? (
            <button
              onClick={handleConectar}
              disabled={carregando}
              style={{
                padding: '12px 32px',
                background: 'rgba(212, 175, 55, 0.2)',
                color: 'var(--aureon-gold)',
                border: '2px solid var(--aureon-gold)',
                borderRadius: 8,
                cursor: carregando ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 'bold',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s',
                opacity: carregando ? 0.6 : 1
              }}
            >
              {carregando ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Conectando...
                </>
              ) : (
                <>
                  <LinkIcon size={16} />
                  Conectar com Mercado Livre
                </>
              )}
            </button>
          ) : (
            <>
              <button
                onClick={handleSincronizar}
                disabled={sincronizando}
                style={{
                  padding: '12px 32px',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#3b82f6',
                  border: '2px solid #3b82f6',
                  borderRadius: 8,
                  cursor: sincronizando ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 'bold',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                  opacity: sincronizando ? 0.6 : 1
                }}
              >
                {sincronizando ? (
                  <>
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Sincronizar Agora
                  </>
                )}
              </button>
              
              <button
                onClick={toggleAutoSync}
                style={{
                  padding: '12px 32px',
                  background: autoSync ? 'rgba(74, 222, 128, 0.2)' : 'rgba(156, 163, 175, 0.2)',
                  color: autoSync ? '#4ade80' : '#9ca3af',
                  border: `2px solid ${autoSync ? '#4ade80' : '#9ca3af'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 'bold',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s'
                }}
              >
                <Clock size={16} />
                {autoSync ? 'Pausar Auto-Sync' : 'Ativar Auto-Sync'}
              </button>

              <button
                onClick={handleDesconectar}
                style={{
                  padding: '12px 32px',
                  background: 'rgba(248, 113, 113, 0.2)',
                  color: '#f87171',
                  border: '2px solid #f87171',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 'bold',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s'
                }}
              >
                <LinkIcon size={16} />
                Desconectar
              </button>
            </>
          )}
        </div>
      </div>

      {conectado && (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 24 }}>
            <KPICard
              icon={ShoppingBag}
              color="#4ade80"
              titulo="Vendas Totais"
              valor={vendas.length}
              subtitulo={`${stats.vendasImportadas} importadas na última sync`}
              theme={theme}
            />
            <KPICard
              icon={Users}
              color="#60a5fa"
              titulo="Clientes"
              valor={clientes.length}
              subtitulo={`${stats.clientesImportados} novos importados`}
              theme={theme}
            />
            <KPICard
              icon={Star}
              color="#fbbf24"
              titulo="Avaliação Média"
              valor={mediaFeedback}
              subtitulo={`${feedback.length} avaliações recebidas`}
              theme={theme}
            />
            <KPICard
              icon={RotateCcw}
              color={parseFloat(taxaDevolucao) > 5 ? '#f87171' : '#4ade80'}
              titulo="Taxa de Devolução"
              valor={`${taxaDevolucao}%`}
              subtitulo={`${devolucoes.length} devoluções abertas`}
              alerta={parseFloat(taxaDevolucao) > 5}
              theme={theme}
            />
          </div>

          {/* Tabs de Dados */}
          <TabsContainer
            vendas={vendas}
            clientes={clientes}
            feedback={feedback}
            devolucoes={devolucoes}
          />
        </>
      )}

      {/* Documentação (sempre visível) */}
      <DocumentacaoML />
    </div>
  );
}

// Componente KPI Card
function KPICard({ icon: Icon, color, titulo, valor, subtitulo, alerta, theme }) {
  return (
    <div style={{
      background: theme === 'light'
        ? 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)'
        : 'linear-gradient(135deg, var(--aureon-surface) 0%, #1a1a1d 100%)',
      border: `2px solid ${alerta ? '#f87171' : 'rgba(212, 175, 55, 0.3)'}`,
      borderRadius: 12,
      padding: 20,
      transition: 'all 0.3s'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
        <Icon size={32} color={color} />
        {alerta && <AlertCircle size={20} color="#f87171" />}
      </div>
      <h4 style={{ color: theme === 'light' ? '#6b7280' : '#aaa', fontSize: 13, margin: '0 0 8px 0', fontWeight: 'normal' }}>{titulo}</h4>
      <p style={{ color: theme === 'light' ? '#1f2937' : '#fff', fontSize: 28, fontWeight: 'bold', margin: '0 0 8px 0' }}>{valor}</p>
      <p style={{ color: theme === 'light' ? '#6b7280' : '#aaa', fontSize: 12, margin: 0 }}>{subtitulo}</p>
    </div>
  );
}

// Componente Tabs
function TabsContainer({ vendas, clientes, feedback, devolucoes }) {
  const [activeTab, setActiveTab] = useState('vendas');
  
  const tabs = [
    { id: 'vendas', label: '🛒 Vendas', icon: ShoppingBag },
    { id: 'clientes', label: '👥 Clientes', icon: Users },
    { id: 'feedback', label: '⭐ Feedback', icon: MessageSquare },
    { id: 'devolucoes', label: '🔄 Devoluções', icon: RotateCcw }
  ];
  
  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--aureon-surface) 0%, #1a1a1d 100%)',
      border: '1px solid rgba(212, 175, 55, 0.3)',
      borderRadius: 12,
      padding: 24,
      marginBottom: 24
    }}>
      {/* Tab Headers */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid rgba(212, 175, 55, 0.2)', paddingBottom: 12 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              background: activeTab === tab.id ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
              color: activeTab === tab.id ? 'var(--aureon-gold)' : '#aaa',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div>
        {activeTab === 'vendas' && <VendasList vendas={vendas} />}
        {activeTab === 'clientes' && <ClientesList clientes={clientes} />}
        {activeTab === 'feedback' && <FeedbackList feedback={feedback} />}
        {activeTab === 'devolucoes' && <DevolucoesList devolucoes={devolucoes} />}
      </div>
    </div>
  );
}

// Lista de Vendas
function VendasList({ vendas }) {
  if (vendas.length === 0) {
    return <p style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>Nenhuma venda encontrada</p>;
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {vendas.slice(0, 10).map((venda, i) => (
        <div key={i} style={{
          background: 'var(--aureon-bg)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          borderRadius: 8,
          padding: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <p style={{ color: 'var(--aureon-text)', fontWeight: 'bold', marginBottom: 4 }}>
              {venda.items?.[0]?.title || 'Pedido #' + venda.id}
            </p>
            <p style={{ color: '#aaa', fontSize: 13 }}>
              Cliente: {venda.buyer?.nickname || 'N/A'} • {new Date(venda.date_created).toLocaleDateString('pt-BR')}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: '#4ade80', fontWeight: 'bold', fontSize: 18 }}>
              R$ {venda.total_amount?.toFixed(2) || '0.00'}
            </p>
            <span style={{
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 'bold',
              background: venda.status === 'paid' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(251, 146, 60, 0.2)',
              color: venda.status === 'paid' ? '#4ade80' : '#fb923c'
            }}>
              {venda.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Lista de Clientes
function ClientesList({ clientes }) {
  if (clientes.length === 0) {
    return <p style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>Nenhum cliente encontrado</p>;
  }
  
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
      {clientes.map((cliente, i) => (
        <div key={i} style={{
          background: 'var(--aureon-bg)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          borderRadius: 8,
          padding: 16
        }}>
          <p style={{ color: 'var(--aureon-text)', fontWeight: 'bold', marginBottom: 8 }}>{cliente.nome}</p>
          <p style={{ color: '#aaa', fontSize: 13, marginBottom: 4 }}>📧 {cliente.email}</p>
          <p style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>📱 {cliente.telefone}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(212, 175, 55, 0.2)' }}>
            <span style={{ color: '#aaa', fontSize: 12 }}>{cliente.totalCompras} compras</span>
            <span style={{ color: '#4ade80', fontSize: 12, fontWeight: 'bold' }}>R$ {cliente.valorTotal?.toFixed(2)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Lista de Feedback
function FeedbackList({ feedback }) {
  if (feedback.length === 0) {
    return <p style={{ color: '#aaa', textAlign: 'center', padding: 40 }}>Nenhum feedback recebido</p>;
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {feedback.map((fb, i) => (
        <div key={i} style={{
          background: 'var(--aureon-bg)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
          borderRadius: 8,
          padding: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <p style={{ color: 'var(--aureon-text)', fontWeight: 'bold', marginBottom: 4 }}>
                {fb.buyer?.nickname || 'Cliente'}
              </p>
              <p style={{ color: '#aaa', fontSize: 12 }}>
                {new Date(fb.date_created).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Star size={18} color="#fbbf24" fill="#fbbf24" />
              <span style={{ color: '#fbbf24', fontWeight: 'bold', fontSize: 18 }}>{fb.rating}</span>
            </div>
          </div>
          <p style={{ color: 'var(--aureon-text)', fontSize: 14, fontStyle: 'italic' }}>
            "{fb.message}"
          </p>
        </div>
      ))}
    </div>
  );
}

// Lista de Devoluções
function DevolucoesList({ devolucoes }) {
  if (devolucoes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <CheckCircle size={48} color="#4ade80" style={{ margin: '0 auto 16px' }} />
        <p style={{ color: '#4ade80', fontWeight: 'bold', marginBottom: 8 }}>
          🎉 Nenhuma devolução aberta!
        </p>
        <p style={{ color: '#aaa', fontSize: 13 }}>
          Excelente trabalho! Seus clientes estão satisfeitos.
        </p>
      </div>
    );
  }
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {devolucoes.map((dev, i) => (
        <div key={i} style={{
          background: 'var(--aureon-bg)',
          border: `2px solid ${dev.status === 'pending' ? '#fb923c' : dev.status === 'approved' ? '#4ade80' : '#f87171'}`,
          borderRadius: 8,
          padding: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <div>
              <p style={{ color: 'var(--aureon-text)', fontWeight: 'bold', marginBottom: 4 }}>
                Pedido #{dev.order_id}
              </p>
              <p style={{ color: '#aaa', fontSize: 13 }}>
                Cliente: {dev.buyer?.nickname || 'N/A'}
              </p>
            </div>
            <span style={{
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 'bold',
              background: dev.status === 'pending' ? 'rgba(251, 146, 60, 0.2)' : dev.status === 'approved' ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)',
              color: dev.status === 'pending' ? '#fb923c' : dev.status === 'approved' ? '#4ade80' : '#f87171',
              height: 'fit-content'
            }}>
              {dev.status === 'pending' ? '⏳ Pendente' : dev.status === 'approved' ? '✅ Aprovada' : '❌ Rejeitada'}
            </span>
          </div>
          <p style={{ color: '#aaa', fontSize: 13, marginBottom: 8 }}>
            <strong>Motivo:</strong> {dev.reason}
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(212, 175, 55, 0.2)' }}>
            <span style={{ color: '#aaa', fontSize: 12 }}>
              {new Date(dev.date_created).toLocaleDateString('pt-BR')}
            </span>
            <span style={{ color: '#f87171', fontSize: 16, fontWeight: 'bold' }}>
              R$ {dev.amount?.toFixed(2)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Documentação
function DocumentacaoML() {
  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--aureon-surface) 0%, #1a1a1d 100%)',
      border: '1px solid rgba(212, 175, 55, 0.3)',
      borderRadius: 12,
      padding: 24
    }}>
      <h3 style={{ color: 'var(--aureon-gold)', marginTop: 0, marginBottom: 16 }}>
        📚 Configuração da Integração
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[
          {
            numero: 1,
            titulo: 'Configure as Credenciais',
            descricao: 'Vá em Configurações > Integrações e adicione seu Client ID e Client Secret do Mercado Livre'
          },
          {
            numero: 2,
            titulo: 'Configure Redirect URI',
            descricao: 'No portal de desenvolvedores do ML, adicione: http://localhost:5173/mercado-livre/callback'
          },
          {
            numero: 3,
            titulo: 'Conecte sua Conta',
            descricao: 'Clique em "Conectar com Mercado Livre" e autorize o acesso à sua conta'
          },
          {
            numero: 4,
            titulo: 'Sincronize os Dados',
            descricao: 'Use "Sincronizar Agora" para importar vendas, clientes, feedback e devoluções'
          },
          {
            numero: 5,
            titulo: 'Ative Auto-Sync (Opcional)',
            descricao: 'Ative a sincronização automática para atualizar dados a cada 5 minutos'
          }
        ].map((passo) => (
          <div
            key={passo.numero}
            style={{
              background: 'var(--aureon-bg)',
              border: '1px solid rgba(212, 175, 55, 0.2)',
              borderRadius: 8,
              padding: 16,
              display: 'flex',
              gap: 16,
              alignItems: 'start'
            }}
          >
            <div style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(212, 175, 55, 0.2)',
              color: 'var(--aureon-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 14,
              flexShrink: 0
            }}>
              {passo.numero}
            </div>
            <div>
              <h4 style={{ color: 'var(--aureon-text)', margin: '0 0 4px 0', fontSize: 14 }}>{passo.titulo}</h4>
              <p style={{ color: '#aaa', margin: 0, fontSize: 12 }}>{passo.descricao}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 20,
        padding: 16,
        background: 'rgba(212, 175, 55, 0.1)',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        borderRadius: 8
      }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--aureon-gold)' }}>
          📖 <strong>Documentação Oficial:</strong>{' '}
          <a
            href="https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#4ade80', textDecoration: 'underline' }}
          >
            https://developers.mercadolivre.com.br
          </a>
        </p>
      </div>
    </div>
  );
}
