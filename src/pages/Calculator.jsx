import React, { useState, useEffect, useContext } from 'react';
import { DataContext } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

const CalculatorPage = () => {
  const { config, canaisVenda } = useContext(DataContext);
  const { theme } = useTheme();
  
  const [custoAlibaba, setCustoAlibaba] = useState(0);
  const [canalVenda, setCanalVenda] = useState('Pessoal');
  const [margem, setMargem] = useState(config.margemMinima || 30);
  const [precoFinal, setPrecoFinal] = useState(0);

  useEffect(() => {
    // Cálculo: Custo + Imposto + Frete + Margem
    const custoComImposto = custoAlibaba * (1 + (config.imposto / 100));
    const margemValor = custoComImposto * (margem / 100);
    const precoCalculado = custoComImposto + margemValor;
    setPrecoFinal(precoCalculado);
  }, [custoAlibaba, margem, config.imposto]);

  const imposto = custoAlibaba * (config.imposto / 100);
  const lucro = precoFinal - custoAlibaba - imposto;
  const margemPercentual = custoAlibaba > 0 ? ((lucro / precoFinal) * 100).toFixed(2) : 0;

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in min-h-screen p-6 ${
      theme === 'light' 
        ? 'bg-gradient-to-br from-gray-50 to-gray-100' 
        : 'bg-gradient-to-br from-aureon-bg to-aureon-surface'
    }`}>
      <div className="lg:col-span-2 space-y-6">
        <Card className={theme === 'light' ? 'bg-white border border-gray-200' : 'bg-aureon-surface border border-aureon-gold/20'}>
          <h2 className="font-serif text-aureon-gold text-lg mb-6 border-b border-aureon-gold/10 pb-3">Calculadora de Preços - Óculos</h2>
          
          <div className="space-y-4 mb-6">
            <Input 
              label="Custo no Alibaba (R$)" 
              type="number" 
              value={custoAlibaba} 
              onChange={e => setCustoAlibaba(Number(e.target.value))}
              placeholder="Ex: 25.00"
            />
            
            <div className="mb-4">
              <label className="block text-[0.65rem] uppercase tracking-wider text-aureon-text mb-2">Canal de Venda</label>
              <select 
                value={canalVenda} 
                onChange={e => setCanalVenda(e.target.value)}
                className="w-full bg-aureon-bg border border-aureon-gold/30 rounded p-3 text-sm text-white focus:border-aureon-gold outline-none"
              >
                {canaisVenda.map(canal => (
                  <option key={canal} value={canal}>{canal}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[0.65rem] uppercase tracking-wider text-aureon-text mb-2">
                Margem de Lucro Desejada ({margem}%)
              </label>
              <input 
                type="range" 
                min="10" 
                max="200" 
                value={margem} 
                onChange={e => setMargem(Number(e.target.value))}
                className="w-full h-2 bg-aureon-bg rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
              />
              <div className="flex justify-between text-[0.6rem] text-aureon-text mt-1">
                <span>Mínima (10%)</span>
                <span>Máxima (200%)</span>
              </div>
            </div>
          </div>

          <div className="bg-aureon-bg border border-aureon-gold/20 rounded-lg p-4 space-y-3">
            <h3 className="text-aureon-gold font-semibold text-sm mb-3">Detalhamento de Custos</h3>
            
            <div className="flex justify-between items-center pb-2 border-b border-aureon-gold/10">
              <span className="text-aureon-text text-sm">Custo Alibaba</span>
              <span className="text-white font-semibold">R$ {custoAlibaba.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center pb-2 border-b border-aureon-gold/10">
              <span className="text-aureon-text text-sm">Imposto ({config.imposto}%)</span>
              <span className="text-red-400 font-semibold">+ R$ {imposto.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-aureon-gold/10">
              <span className="text-aureon-text text-sm">Margem ({margem}%)</span>
              <span className="text-green-400 font-semibold">+ R$ {(precoFinal - custoAlibaba - imposto).toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-aureon-gold/10">
              <span className="text-white font-bold">Preço Sugerido</span>
              <span className="text-aureon-gold text-2xl font-bold">R$ {precoFinal.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        <Card className={theme === 'light' ? 'bg-white border border-gray-200' : 'bg-aureon-surface border border-aureon-gold/20'}>
          <h3 className="font-serif text-aureon-gold text-sm mb-4 border-b border-aureon-gold/10 pb-3">Informações Úteis</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-aureon-bg p-3 rounded border border-aureon-gold/20">
              <p className="text-[0.6rem] text-aureon-text uppercase mb-1">Margem Real</p>
              <p className="text-xl font-bold text-green-400">{margemPercentual}%</p>
            </div>
            
            <div className="bg-aureon-bg p-3 rounded border border-green-400/20">
              <p className="text-[0.6rem] text-aureon-text uppercase mb-1">Lucro por Unidade</p>
              <p className="text-xl font-bold text-aureon-gold">R$ {lucro.toFixed(2)}</p>
            </div>
          </div>

          <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded p-3">
            <p className="text-[0.7rem] text-blue-400 leading-relaxed">
              💡 Dica: Este cálculo inclui o imposto de {config.imposto}%. Você pode ajustar a margem conforme a concorrência de cada canal (Instagram, Mercado Livre, etc.)
            </p>
          </div>
        </Card>
      </div>

      {/* Simulador de Vendas */}
      <Card className={`lg:col-span-1 h-fit ${theme === 'light' ? 'bg-white border border-gray-200' : 'bg-aureon-surface border border-aureon-gold/20'}`}>
        <h3 className="font-serif text-aureon-gold text-sm mb-4 border-b border-aureon-gold/10 pb-3">Simulador de Venda</h3>
        
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-[#D4AF37]/20 to-transparent border border-aureon-gold/30 rounded-lg p-4">
            <p className="text-aureon-muted text-xs uppercase mb-1">Preço de Venda</p>
            <p className="text-4xl font-bold text-aureon-gold">R$ {precoFinal.toFixed(2)}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-aureon-text">Custo Real</span>
              <span className="text-white">R$ {(custoAlibaba + imposto).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-aureon-text">Seu Lucro</span>
              <span className="text-green-400 font-bold">R$ {lucro.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-aureon-gold/10 pt-2 mt-2">
              <span className="text-aureon-text">Lucro %</span>
              <span className="text-green-400 font-bold">{margemPercentual}%</span>
            </div>
          </div>

          {/* Simulação de 10 vendas */}
          <div className="bg-aureon-bg border border-aureon-gold/10 rounded-lg p-3 mt-4">
            <p className="text-[0.7rem] text-aureon-text uppercase mb-3">Se vender 10 unidades:</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-aureon-text">Faturamento</span>
                <span className="text-white font-bold">R$ {(precoFinal * 10).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-green-400">
                <span>Lucro Bruto</span>
                <span className="font-bold">R$ {(lucro * 10).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <Button className="w-full mt-4" onClick={() => alert('Preço copiado: R$ ' + precoFinal.toFixed(2))}>
            Usar este Preço
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CalculatorPage;
