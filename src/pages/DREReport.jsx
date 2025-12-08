import React, { useState, useMemo, useContext, useRef, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { DataContext } from '../context/DataContext';
import { Calendar, Download, TrendingUp, TrendingDown, DollarSign, FileText, ChevronDown, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { Chart } from 'chart.js/auto';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Demonstração do Resultado do Exercício (DRE)
 * Relatório financeiro com receitas, despesas e resultado
 */
export default function DREReport() {
  const { despesas, contasReceber } = useFinance();
  const { vendas } = useContext(DataContext);

  const today = new Date();
  const [periodoInicio, setPeriodoInicio] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  );
  const [periodoFim, setPeriodoFim] = useState(today.toISOString().split('T')[0]);
  const [expandedSections, setExpandedSections] = useState({
    receitas: true,
    despesas: true,
    resultado: true
  });

  // Refs para os canvas dos gráficos
  const chartDespesasRef = useRef(null);
  const chartResultadoRef = useRef(null);
  const chartDespesasInstance = useRef(null);
  const chartResultadoInstance = useRef(null);

  // ============================================
  // CÁLCULOS DA DRE
  // ============================================

  const dreData = useMemo(() => {
    const inicio = new Date(periodoInicio);
    const fim = new Date(periodoFim);
    fim.setHours(23, 59, 59, 999);

    // ===== RECEITAS =====
    // Vendas realizadas no período
    const vendasPeriodo = vendas.filter(v => {
      const dataVenda = new Date(v.dataVenda);
      return dataVenda >= inicio && dataVenda <= fim;
    });

    const receitaVendas = vendasPeriodo.reduce((sum, v) => sum + v.valorTotal, 0);

    // Recebimentos realizados no período
    const recebimentosPeriodo = contasReceber.filter(c => {
      if (!c.parcelas || !Array.isArray(c.parcelas)) return false;
      return c.parcelas.some(p => {
        if (p.status !== 'recebido') return false;
        const dataRecebimento = new Date(p.dataRecebimento);
        return dataRecebimento >= inicio && dataRecebimento <= fim;
      });
    });

    const receitaRecebimentos = recebimentosPeriodo.reduce((sum, c) => {
      if (!c.parcelas || !Array.isArray(c.parcelas)) return sum;
      return sum + c.parcelas
        .filter(p => {
          if (p.status !== 'recebido') return false;
          const dataRecebimento = new Date(p.dataRecebimento);
          return dataRecebimento >= inicio && dataRecebimento <= fim;
        })
        .reduce((pSum, p) => pSum + p.valor, 0);
    }, 0);

    const receitaBruta = receitaVendas + receitaRecebimentos;

    // ===== DESPESAS =====
    const despesasPeriodo = despesas.filter(d => {
      const dataVencimento = new Date(d.dataVencimento);
      return dataVencimento >= inicio && dataVencimento <= fim;
    });

    // Agrupar despesas por categoria
    const despesasPorCategoria = {};
    let totalDespesas = 0;

    despesasPeriodo.forEach(d => {
      if (!despesasPorCategoria[d.categoria]) {
        despesasPorCategoria[d.categoria] = {
          total: 0,
          itens: []
        };
      }
      despesasPorCategoria[d.categoria].total += d.valor;
      despesasPorCategoria[d.categoria].itens.push(d);
      totalDespesas += d.valor;
    });

    // Ordenar categorias por valor (maior para menor)
    const categoriasOrdenadas = Object.entries(despesasPorCategoria)
      .sort(([, a], [, b]) => b.total - a.total);

    // ===== RESULTADO =====
    const lucroLiquido = receitaBruta - totalDespesas;
    const margemLucro = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0;

    // ===== COMPARATIVO MÊS ANTERIOR =====
    const mesAnteriorInicio = new Date(inicio);
    mesAnteriorInicio.setMonth(mesAnteriorInicio.getMonth() - 1);
    const mesAnteriorFim = new Date(inicio);
    mesAnteriorFim.setDate(mesAnteriorFim.getDate() - 1);

    const vendasMesAnterior = vendas.filter(v => {
      const dataVenda = new Date(v.dataVenda);
      return dataVenda >= mesAnteriorInicio && dataVenda <= mesAnteriorFim;
    }).reduce((sum, v) => sum + v.valorTotal, 0);

    const despesasMesAnterior = despesas.filter(d => {
      const dataVencimento = new Date(d.dataVencimento);
      return dataVencimento >= mesAnteriorInicio && dataVencimento <= mesAnteriorFim;
    }).reduce((sum, d) => sum + d.valor, 0);

    const lucroMesAnterior = vendasMesAnterior - despesasMesAnterior;

    const variacaoReceita = vendasMesAnterior > 0
      ? ((receitaBruta - vendasMesAnterior) / vendasMesAnterior) * 100
      : 0;

    const variacaoLucro = lucroMesAnterior !== 0
      ? ((lucroLiquido - lucroMesAnterior) / Math.abs(lucroMesAnterior)) * 100
      : 0;

    return {
      receitas: {
        vendas: receitaVendas,
        recebimentos: receitaRecebimentos,
        bruta: receitaBruta
      },
      despesas: {
        porCategoria: categoriasOrdenadas,
        total: totalDespesas
      },
      resultado: {
        lucro: lucroLiquido,
        margem: margemLucro
      },
      comparativo: {
        variacaoReceita,
        variacaoLucro,
        receitaMesAnterior: vendasMesAnterior,
        lucroMesAnterior
      },
      quantidades: {
        numVendas: vendasPeriodo.length,
        numRecebimentos: recebimentosPeriodo.length,
        numDespesas: despesasPeriodo.length
      }
    };
  }, [vendas, contasReceber, despesas, periodoInicio, periodoFim]);

  // ============================================
  // HANDLERS
  // ============================================

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleExportPDF = async () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 15;

      // HEADER ROXO
      doc.setFillColor(139, 92, 246);
      doc.rect(0, 0, pageWidth, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('AUREON ERP', pageWidth / 2, 15, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text('DRE - Demonstração do Resultado do Exercício', pageWidth / 2, 25, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Período: ${formatDate(periodoInicio)} a ${formatDate(periodoFim)}`, pageWidth / 2, 32, { align: 'center' });
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, 38, { align: 'center' });

      yPos = 55;

      // CARDS KPI
      const cardWidth = 60;
      const cardHeight = 25;
      const cardGap = 5;
      const startX = (pageWidth - (cardWidth * 3 + cardGap * 2)) / 2;

      // Card Receita
      doc.setFillColor(230, 244, 255);
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(0.5);
      doc.roundedRect(startX, yPos, cardWidth, cardHeight, 2, 2, 'FD');
      
      doc.setFontSize(8);
      doc.setTextColor(59, 130, 246);
      doc.setFont('helvetica', 'bold');
      doc.text('RECEITA BRUTA', startX + cardWidth / 2, yPos + 5, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text(formatCurrency(dreData.receitas.bruta), startX + cardWidth / 2, yPos + 13, { align: 'center' });
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const varText = `${dreData.comparativo.variacaoReceita >= 0 ? '+' : ''}${dreData.comparativo.variacaoReceita.toFixed(1)}%`;
      doc.text(varText, startX + cardWidth / 2, yPos + 19, { align: 'center' });

      // Card Despesas
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor(239, 68, 68);
      doc.roundedRect(startX + cardWidth + cardGap, yPos, cardWidth, cardHeight, 2, 2, 'FD');
      
      doc.setFontSize(8);
      doc.setTextColor(239, 68, 68);
      doc.setFont('helvetica', 'bold');
      doc.text('DESPESAS', startX + cardWidth + cardGap + cardWidth / 2, yPos + 5, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text(formatCurrency(dreData.despesas.total), startX + cardWidth + cardGap + cardWidth / 2, yPos + 13, { align: 'center' });
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`${dreData.quantidades.numDespesas} despesa(s)`, startX + cardWidth + cardGap + cardWidth / 2, yPos + 19, { align: 'center' });

      // Card Lucro
      const lucroColor = dreData.resultado.lucro >= 0 ? [34, 197, 94] : [239, 68, 68];
      const lucroBg = dreData.resultado.lucro >= 0 ? [240, 253, 244] : [254, 242, 242];
      
      doc.setFillColor(lucroBg[0], lucroBg[1], lucroBg[2]);
      doc.setDrawColor(lucroColor[0], lucroColor[1], lucroColor[2]);
      doc.roundedRect(startX + (cardWidth + cardGap) * 2, yPos, cardWidth, cardHeight, 2, 2, 'FD');
      
      doc.setFontSize(8);
      doc.setTextColor(lucroColor[0], lucroColor[1], lucroColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(dreData.resultado.lucro >= 0 ? 'LUCRO' : 'PREJUIZO', startX + (cardWidth + cardGap) * 2 + cardWidth / 2, yPos + 5, { align: 'center' });
      
      doc.setFontSize(14);
      doc.text(formatCurrency(dreData.resultado.lucro), startX + (cardWidth + cardGap) * 2 + cardWidth / 2, yPos + 13, { align: 'center' });
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Margem: ${dreData.resultado.margem.toFixed(1)}%`, startX + (cardWidth + cardGap) * 2 + cardWidth / 2, yPos + 19, { align: 'center' });

      yPos += cardHeight + 10;

      // GRÁFICOS
      if (chartDespesasRef.current && chartResultadoRef.current) {
        try {
          const chartDespesasImg = chartDespesasRef.current.toDataURL('image/png', 1.0);
          const chartResultadoImg = chartResultadoRef.current.toDataURL('image/png', 1.0);
          
          const chartWidth = 85;
          const chartHeight = 60;
          
          doc.addImage(chartDespesasImg, 'PNG', 15, yPos, chartWidth, chartHeight);
          doc.addImage(chartResultadoImg, 'PNG', 110, yPos, chartWidth, chartHeight);
          
          yPos += chartHeight + 10;
        } catch (error) {
          console.log('Erro ao adicionar gráficos:', error);
        }
      }

      // TABELA RECEITAS
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 92, 246);
      doc.text('RECEITAS', 15, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head: [['Descrição', 'Quantidade', 'Valor']],
        body: [
          ['Vendas', dreData.quantidades.numVendas.toString(), formatCurrency(dreData.receitas.vendas)],
          ['Recebimentos', dreData.quantidades.numRecebimentos.toString(), formatCurrency(dreData.receitas.recebimentos)],
        ],
        foot: [['RECEITA BRUTA TOTAL', '', formatCurrency(dreData.receitas.bruta)]],
        theme: 'grid',
        headStyles: { 
          fillColor: [139, 92, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        footStyles: { 
          fillColor: [59, 130, 246],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { halign: 'center', cellWidth: 40 },
          2: { halign: 'right', cellWidth: 50 }
        }
      });

      yPos = doc.lastAutoTable.finalY + 10;

      // TABELA DESPESAS
      if (yPos > pageHeight - 80) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(239, 68, 68);
      doc.text('DESPESAS POR CATEGORIA', 15, yPos);
      yPos += 5;

      const despesasData = dreData.despesas.porCategoria.map(([categoria, dados]) => {
        const percentual = ((dados.total / dreData.despesas.total) * 100).toFixed(1);
        return [categoria, dados.itens.length.toString(), `${percentual}%`, formatCurrency(dados.total)];
      });

      autoTable(doc, {
        startY: yPos,
        head: [['Categoria', 'Qtd', '% Total', 'Valor']],
        body: despesasData,
        foot: [['TOTAL DESPESAS', dreData.quantidades.numDespesas.toString(), '100%', formatCurrency(dreData.despesas.total)]],
        theme: 'grid',
        headStyles: { 
          fillColor: [239, 68, 68],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        footStyles: { 
          fillColor: [220, 38, 38],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 10
        },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { halign: 'center', cellWidth: 30 },
          2: { halign: 'center', cellWidth: 30 },
          3: { halign: 'right', cellWidth: 50 }
        }
      });

      yPos = doc.lastAutoTable.finalY + 10;

      // RESULTADO FINAL
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(139, 92, 246);
      doc.text('RESULTADO DO EXERCÍCIO', 15, yPos);
      yPos += 5;

      const resultadoColor = dreData.resultado.lucro >= 0 ? [34, 197, 94] : [239, 68, 68];

      autoTable(doc, {
        startY: yPos,
        body: [
          ['(+) Receita Bruta', formatCurrency(dreData.receitas.bruta)],
          ['(-) Despesas Totais', `(${formatCurrency(dreData.despesas.total)})`],
          [`(=) ${dreData.resultado.lucro >= 0 ? 'LUCRO' : 'PREJUÍZO'} LÍQUIDO`, formatCurrency(dreData.resultado.lucro)],
          ['Margem de Lucro', `${dreData.resultado.margem.toFixed(1)}%`]
        ],
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 4 },
        columnStyles: {
          0: { cellWidth: 120, fontStyle: 'bold' },
          1: { halign: 'right', cellWidth: 70, fontStyle: 'bold' }
        },
        didParseCell: (data) => {
          if (data.row.index === 2) {
            data.cell.styles.fillColor = resultadoColor;
            data.cell.styles.textColor = [255, 255, 255];
            data.cell.styles.fontSize = 12;
          }
        }
      });

      // RODAPÉ
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `© ${new Date().getFullYear()} AUREON ERP | Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      doc.save(`DRE_${periodoInicio}_${periodoFim}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Verifique o console para detalhes.');
    }
  };



  const handleExportExcel = async () => {
    // Criar workbook Excel simples
    const wb = XLSX.utils.book_new();
    
    // ===== ABA 1: DASHBOARD PRINCIPAL =====
    const dashboardData = [];
    
    // Header
    dashboardData.push(['AUREON ERP']);
    dashboardData.push(['DRE - Demonstração do Resultado do Exercício']);
    dashboardData.push([`Período: ${formatDate(periodoInicio)} a ${formatDate(periodoFim)} | Gerado em: ${new Date().toLocaleString('pt-BR')}`]);
    dashboardData.push([]);
    
    // CARDS KPI
    dashboardData.push(['KPI', 'Valor', 'Info']);
    dashboardData.push(['💰 RECEITA BRUTA', dreData.receitas.bruta, `↗ ${dreData.comparativo.variacaoReceita >= 0 ? '+' : ''}${dreData.comparativo.variacaoReceita.toFixed(1)}% vs mês anterior`]);
    dashboardData.push(['📉 DESPESAS TOTAIS', dreData.despesas.total, `${dreData.quantidades.numDespesas} lançamento(s)`]);
    dashboardData.push([`${dreData.resultado.lucro >= 0 ? '✅ LUCRO' : '❌ PREJUÍZO'}`, dreData.resultado.lucro, `Margem: ${dreData.resultado.margem.toFixed(1)}%`]);
    dashboardData.push([]);
    dashboardData.push([]);
    
    // RECEITAS DETALHADAS
    dashboardData.push(['💵 RECEITAS DETALHADAS']);
    dashboardData.push([]);
    dashboardData.push(['Descrição', 'Quantidade', 'Valor']);
    dashboardData.push(['Vendas', dreData.quantidades.numVendas, dreData.receitas.vendas]);
    dashboardData.push(['Recebimentos', dreData.quantidades.numRecebimentos, dreData.receitas.recebimentos]);
    dashboardData.push(['RECEITA BRUTA TOTAL', '', dreData.receitas.bruta]);
    dashboardData.push([]);
    dashboardData.push([]);
    
    // DESPESAS POR CATEGORIA
    dashboardData.push(['💳 DESPESAS POR CATEGORIA']);
    dashboardData.push([]);
    dashboardData.push(['Categoria', 'Qtd', '% Total', 'Valor']);
    
    dreData.despesas.porCategoria.forEach(([categoria, dados]) => {
      const percentual = ((dados.total / dreData.despesas.total) * 100).toFixed(1);
      dashboardData.push([categoria, dados.itens.length, `${percentual}%`, dados.total]);
    });
    
    dashboardData.push(['TOTAL DESPESAS', dreData.quantidades.numDespesas, '100%', dreData.despesas.total]);
    dashboardData.push([]);
    dashboardData.push([]);
    
    // RESULTADO DO EXERCÍCIO
    dashboardData.push(['📊 RESULTADO DO EXERCÍCIO']);
    dashboardData.push([]);
    dashboardData.push(['Item', 'Valor']);
    dashboardData.push(['(+) Receita Bruta', dreData.receitas.bruta]);
    dashboardData.push(['(-) Despesas Totais', -dreData.despesas.total]);
    dashboardData.push([`(=) ${dreData.resultado.lucro >= 0 ? 'LUCRO' : 'PREJUÍZO'} LÍQUIDO`, dreData.resultado.lucro]);
    dashboardData.push([]);
    dashboardData.push(['Margem de Lucro', `${dreData.resultado.margem.toFixed(1)}%`]);
    
    const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData);
    wsDashboard['!cols'] = [{ wch: 35 }, { wch: 20 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsDashboard, 'Dashboard');
    
    // ===== ABA 2: RECEITAS DETALHADAS =====
    const receitasData = [];
    receitasData.push(['RECEITAS - DETALHAMENTO COMPLETO']);
    receitasData.push([`Período: ${formatDate(periodoInicio)} a ${formatDate(periodoFim)}`]);
    receitasData.push([]);
    receitasData.push(['Fonte', 'Quantidade', 'Valor']);
    receitasData.push(['Vendas', dreData.quantidades.numVendas, dreData.receitas.vendas]);
    receitasData.push(['Recebimentos', dreData.quantidades.numRecebimentos, dreData.receitas.recebimentos]);
    receitasData.push([]);
    receitasData.push(['TOTAL GERAL', dreData.quantidades.numVendas + dreData.quantidades.numRecebimentos, dreData.receitas.bruta]);
    
    const wsReceitas = XLSX.utils.aoa_to_sheet(receitasData);
    wsReceitas['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsReceitas, 'Receitas');
    
    // ===== ABA 3: DESPESAS DETALHADAS =====
    const despesasData = [];
    despesasData.push(['DESPESAS - DETALHAMENTO COMPLETO']);
    despesasData.push([`Período: ${formatDate(periodoInicio)} a ${formatDate(periodoFim)}`]);
    despesasData.push([]);
    despesasData.push(['Categoria', 'Quantidade', '% Total', 'Valor']);
    
    dreData.despesas.porCategoria.forEach(([categoria, dados]) => {
      const percentual = ((dados.total / dreData.despesas.total) * 100).toFixed(1);
      despesasData.push([categoria, dados.itens.length, `${percentual}%`, dados.total]);
    });
    
    despesasData.push([]);
    despesasData.push(['TOTAL GERAL', dreData.quantidades.numDespesas, '100%', dreData.despesas.total]);
    
    const wsDespesas = XLSX.utils.aoa_to_sheet(despesasData);
    wsDespesas['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsDespesas, 'Despesas');
    
    // ===== ABA 4: DRE COMPLETO =====
    const dreCompleto = [];
    dreCompleto.push(['DRE - DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO']);
    dreCompleto.push([`Período: ${formatDate(periodoInicio)} a ${formatDate(periodoFim)}`]);
    dreCompleto.push([]);
    dreCompleto.push(['Descrição', 'Valor']);
    dreCompleto.push([]);
    dreCompleto.push(['RECEITAS']);
    dreCompleto.push(['Receita de Vendas', dreData.receitas.vendas]);
    dreCompleto.push(['Receita de Recebimentos', dreData.receitas.recebimentos]);
    dreCompleto.push(['(=) RECEITA BRUTA TOTAL', dreData.receitas.bruta]);
    dreCompleto.push([]);
    dreCompleto.push(['DESPESAS']);
    
    dreData.despesas.porCategoria.forEach(([categoria, dados]) => {
      dreCompleto.push([`Despesas - ${categoria}`, dados.total]);
    });
    
    dreCompleto.push(['(=) TOTAL DESPESAS', dreData.despesas.total]);
    dreCompleto.push([]);
    dreCompleto.push([`(=) ${dreData.resultado.lucro >= 0 ? 'LUCRO' : 'PREJUÍZO'} LÍQUIDO`, dreData.resultado.lucro]);
    dreCompleto.push([]);
    dreCompleto.push(['ANÁLISE']);
    dreCompleto.push(['Margem de Lucro (%)', `${dreData.resultado.margem.toFixed(1)}%`]);
    dreCompleto.push(['Total de Vendas', dreData.quantidades.numVendas]);
    dreCompleto.push(['Total de Despesas', dreData.quantidades.numDespesas]);
    
    const wsDRECompleto = XLSX.utils.aoa_to_sheet(dreCompleto);
    wsDRECompleto['!cols'] = [{ wch: 40 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsDRECompleto, 'DRE Completo');
    
    // ===== ABA 5: COMPARATIVO =====
    const comparativoData = [];
    comparativoData.push(['COMPARATIVO MÊS ANTERIOR']);
    comparativoData.push([]);
    comparativoData.push(['Métrica', 'Mês Atual', 'Mês Anterior', 'Variação']);
    comparativoData.push(['Receitas', dreData.receitas.bruta, dreData.comparativo.receitaMesAnterior, `${dreData.comparativo.variacaoReceita >= 0 ? '+' : ''}${dreData.comparativo.variacaoReceita.toFixed(1)}%`]);
    comparativoData.push(['Lucro/Prejuízo', dreData.resultado.lucro, dreData.comparativo.lucroMesAnterior, `${dreData.comparativo.variacaoLucro >= 0 ? '+' : ''}${dreData.comparativo.variacaoLucro.toFixed(1)}%`]);
    
    const wsComparativo = XLSX.utils.aoa_to_sheet(comparativoData);
    wsComparativo['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsComparativo, 'Comparativo');
    
    // Salvar arquivo
    XLSX.writeFile(wb, `DRE_Dashboard_${periodoInicio}_${periodoFim}.xlsx`);
  };

  const handleExportHTML = async () => {
    // Gerar HTML com gráficos e visual profissional
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DRE - ${formatDate(periodoInicio)} a ${formatDate(periodoFim)}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      color: #333;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }
    .logo {
      font-size: 48px;
      font-weight: bold;
      margin-bottom: 10px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }
    .subtitle {
      font-size: 14px;
      opacity: 0.9;
      letter-spacing: 2px;
    }
    .title {
      font-size: 32px;
      margin: 20px 0 10px;
      font-weight: 600;
    }
    .periodo {
      font-size: 16px;
      opacity: 0.95;
    }
    .content {
      padding: 40px;
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .card {
      padding: 25px;
      border-radius: 15px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      transition: transform 0.3s;
    }
    .card:hover {
      transform: translateY(-5px);
    }
    .card-receita {
      background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
      color: white;
    }
    .card-despesa {
      background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
      color: white;
    }
    .card-lucro {
      background: linear-gradient(135deg, ${dreData.resultado.lucro >= 0 ? '#22C55E 0%, #16A34A 100%' : '#EF4444 0%, #DC2626 100%'});
      color: white;
    }
    .card-label {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .card-value {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .card-info {
      font-size: 13px;
      opacity: 0.85;
    }
    .charts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 30px;
      margin-bottom: 40px;
    }
    .chart-container {
      background: #f8f9fa;
      padding: 25px;
      border-radius: 15px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }
    .chart-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #8B5CF6;
      text-align: center;
    }
    .section {
      margin-bottom: 40px;
    }
    .section-title {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #8B5CF6;
      border-bottom: 3px solid #8B5CF6;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      border-radius: 10px;
      overflow: hidden;
    }
    thead {
      background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
      color: white;
    }
    th, td {
      padding: 15px;
      text-align: left;
    }
    th {
      font-weight: 600;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 1px;
    }
    tbody tr {
      border-bottom: 1px solid #e5e7eb;
      transition: background 0.2s;
    }
    tbody tr:hover {
      background: #f3f4f6;
    }
    tbody tr:last-child {
      border-bottom: none;
    }
    .text-right {
      text-align: right;
    }
    .text-center {
      text-align: center;
    }
    .total-row {
      background: #f3f4f6;
      font-weight: bold;
      font-size: 16px;
    }
    .progress-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 10px;
      overflow: hidden;
      margin-top: 5px;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #8B5CF6 0%, #7C3AED 100%);
      transition: width 0.5s ease;
    }
    .resultado-box {
      background: linear-gradient(135deg, ${dreData.resultado.lucro >= 0 ? '#22C55E' : '#EF4444'} 0%, ${dreData.resultado.lucro >= 0 ? '#16A34A' : '#DC2626'} 100%);
      color: white;
      padding: 30px;
      border-radius: 15px;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
      margin: 30px 0;
    }
    .resultado-label {
      font-size: 18px;
      opacity: 0.9;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .resultado-value {
      font-size: 56px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    .resultado-margem {
      font-size: 20px;
      opacity: 0.95;
    }
    .footer {
      background: #f8f9fa;
      padding: 30px;
      text-align: center;
      color: #666;
      border-top: 1px solid #e5e7eb;
    }
    .footer-logo {
      font-size: 24px;
      font-weight: bold;
      color: #8B5CF6;
      margin-bottom: 10px;
    }
    .footer-text {
      font-size: 13px;
      line-height: 1.6;
    }
    @media print {
      body { background: white; padding: 0; }
      .container { box-shadow: none; }
      .card:hover, tbody tr:hover { transform: none; background: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- CABEÇALHO -->
    <div class="header">
      <div class="logo">AUREON</div>
      <div class="subtitle">ERP SYSTEM</div>
      <div class="title">DRE - Demonstração do Resultado do Exercício</div>
      <div class="periodo">Período: ${formatDate(periodoInicio)} a ${formatDate(periodoFim)}</div>
      <div class="periodo" style="margin-top: 10px; font-size: 14px;">Gerado em: ${new Date().toLocaleString('pt-BR')}</div>
    </div>

    <div class="content">
      <!-- CARDS DE RESUMO -->
      <div class="cards">
        <div class="card card-receita">
          <div class="card-label">💰 Receita Bruta</div>
          <div class="card-value">${formatCurrency(dreData.receitas.bruta)}</div>
          <div class="card-info">
            ${dreData.comparativo.variacaoReceita >= 0 ? '📈' : '📉'} 
            ${dreData.comparativo.variacaoReceita >= 0 ? '+' : ''}${dreData.comparativo.variacaoReceita.toFixed(1)}% vs mês anterior
          </div>
        </div>

        <div class="card card-despesa">
          <div class="card-label">📉 Total Despesas</div>
          <div class="card-value">${formatCurrency(dreData.despesas.total)}</div>
          <div class="card-info">${dreData.quantidades.numDespesas} despesa(s) no período</div>
        </div>

        <div class="card card-lucro">
          <div class="card-label">${dreData.resultado.lucro >= 0 ? '✅ Lucro Líquido' : '❌ Prejuízo'}</div>
          <div class="card-value">${formatCurrency(dreData.resultado.lucro)}</div>
          <div class="card-info">Margem: ${dreData.resultado.margem.toFixed(1)}%</div>
        </div>
      </div>

      <!-- GRÁFICOS -->
      <div class="charts">
        <div class="chart-container">
          <div class="chart-title">📊 Despesas por Categoria</div>
          <canvas id="chartDespesas"></canvas>
        </div>

        <div class="chart-container">
          <div class="chart-title">📈 Visão Geral do Resultado</div>
          <canvas id="chartResultado"></canvas>
        </div>
      </div>

      <!-- TABELA DE RECEITAS -->
      <div class="section">
        <div class="section-title">💵 RECEITAS</div>
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th class="text-center">Quantidade</th>
              <th class="text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Vendas</td>
              <td class="text-center">${dreData.quantidades.numVendas}</td>
              <td class="text-right">${formatCurrency(dreData.receitas.vendas)}</td>
            </tr>
            <tr>
              <td>Recebimentos</td>
              <td class="text-center">${dreData.quantidades.numRecebimentos}</td>
              <td class="text-right">${formatCurrency(dreData.receitas.recebimentos)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="2">RECEITA BRUTA TOTAL</td>
              <td class="text-right">${formatCurrency(dreData.receitas.bruta)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- TABELA DE DESPESAS -->
      <div class="section">
        <div class="section-title">💳 DESPESAS POR CATEGORIA</div>
        <table>
          <thead>
            <tr>
              <th>Categoria</th>
              <th class="text-center">Qtd</th>
              <th class="text-center">% Total</th>
              <th class="text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${dreData.despesas.porCategoria.map(([categoria, dados]) => {
              const percentual = ((dados.total / dreData.despesas.total) * 100).toFixed(1);
              return `
                <tr>
                  <td>
                    ${categoria}
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: ${percentual}%"></div>
                    </div>
                  </td>
                  <td class="text-center">${dados.itens.length}</td>
                  <td class="text-center">${percentual}%</td>
                  <td class="text-right">${formatCurrency(dados.total)}</td>
                </tr>
              `;
            }).join('')}
            <tr class="total-row">
              <td colspan="3">TOTAL DESPESAS</td>
              <td class="text-right">${formatCurrency(dreData.despesas.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- RESULTADO FINAL -->
      <div class="resultado-box">
        <div class="resultado-label">${dreData.resultado.lucro >= 0 ? 'LUCRO LÍQUIDO' : 'PREJUÍZO'}</div>
        <div class="resultado-value">${formatCurrency(dreData.resultado.lucro)}</div>
        <div class="resultado-margem">Margem de Lucro: ${dreData.resultado.margem.toFixed(1)}%</div>
      </div>

      <!-- ESTRUTURA DRE -->
      <div class="section">
        <div class="section-title">📋 ESTRUTURA DA DRE</div>
        <table>
          <tbody>
            <tr>
              <td>(+) Receita Bruta</td>
              <td class="text-right" style="color: #3B82F6; font-weight: 600;">${formatCurrency(dreData.receitas.bruta)}</td>
            </tr>
            <tr>
              <td>(-) Despesas Totais</td>
              <td class="text-right" style="color: #EF4444; font-weight: 600;">(${formatCurrency(dreData.despesas.total)})</td>
            </tr>
            <tr class="total-row" style="background: ${dreData.resultado.lucro >= 0 ? '#22C55E' : '#EF4444'}; color: white;">
              <td>(=) ${dreData.resultado.lucro >= 0 ? 'LUCRO' : 'PREJUÍZO'} LÍQUIDO</td>
              <td class="text-right" style="font-size: 20px;">${formatCurrency(dreData.resultado.lucro)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- RODAPÉ -->
    <div class="footer">
      <div class="footer-logo">AUREON ERP</div>
      <div class="footer-text">
        Relatório gerado automaticamente pelo AUREON ERP System<br>
        © ${new Date().getFullYear()} - Todos os direitos reservados
      </div>
    </div>
  </div>

  <script>
    // Gráfico de Despesas (Pizza)
    const ctxDespesas = document.getElementById('chartDespesas').getContext('2d');
    new Chart(ctxDespesas, {
      type: 'doughnut',
      data: {
        labels: ${JSON.stringify(dreData.despesas.porCategoria.map(([cat]) => cat))},
        datasets: [{
          data: ${JSON.stringify(dreData.despesas.porCategoria.map(([, dados]) => dados.total))},
          backgroundColor: [
            '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
            '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
            '#06B6D4', '#A855F7', '#F43F5E'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (context) => {
                const valor = context.parsed;
                const total = ${dreData.despesas.total};
                const percentual = ((valor / total) * 100).toFixed(1);
                return context.label + ': ' + valor.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) + ' (' + percentual + '%)';
              }
            }
          }
        }
      }
    });

    // Gráfico de Resultado (Barras)
    const ctxResultado = document.getElementById('chartResultado').getContext('2d');
    new Chart(ctxResultado, {
      type: 'bar',
      data: {
        labels: ['Receitas', 'Despesas', 'Resultado'],
        datasets: [{
          label: 'Valor (R$)',
          data: [${dreData.receitas.bruta}, ${dreData.despesas.total}, ${dreData.resultado.lucro}],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            '${dreData.resultado.lucro >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'}'
          ],
          borderColor: [
            '#3B82F6',
            '#EF4444',
            '${dreData.resultado.lucro >= 0 ? '#22C55E' : '#EF4444'}'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => context.label + ': ' + context.parsed.y.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => value.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})
            }
          }
        }
      }
    });
  </script>
</body>
</html>
    `;

    // Download como HTML
    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DRE_${periodoInicio}_${periodoFim}.html`;
    link.click();
  };

  const handlePeriodoRapido = (tipo) => {
    const hoje = new Date();
    let inicio, fim;

    switch (tipo) {
      case 'mes_atual':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        fim = hoje;
        break;
      case 'mes_anterior':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        break;
      case 'trimestre':
        inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
        fim = hoje;
        break;
      case 'ano':
        inicio = new Date(hoje.getFullYear(), 0, 1);
        fim = hoje;
        break;
      default:
        return;
    }

    setPeriodoInicio(inicio.toISOString().split('T')[0]);
    setPeriodoFim(fim.toISOString().split('T')[0]);
  };

  // ============================================
  // FORMATADORES
  // ============================================

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatPercent = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // ============================================
  // GRÁFICOS (Chart.js)
  // ============================================

  useEffect(() => {
    // Destruir gráficos existentes antes de criar novos
    if (chartDespesasInstance.current) {
      chartDespesasInstance.current.destroy();
    }
    if (chartResultadoInstance.current) {
      chartResultadoInstance.current.destroy();
    }

    // ===== GRÁFICO DE PIZZA: DESPESAS POR CATEGORIA =====
    if (chartDespesasRef.current && dreData.despesas.porCategoria.length > 0) {
      const ctx = chartDespesasRef.current.getContext('2d');
      
      const cores = [
        '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
        '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16',
        '#06B6D4', '#A855F7', '#F43F5E'
      ];

      chartDespesasInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: dreData.despesas.porCategoria.map(([cat]) => cat),
          datasets: [{
            data: dreData.despesas.porCategoria.map(([, dados]) => dados.total),
            backgroundColor: cores,
            borderColor: '#0A0A0C',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: '#F3E5AB',
                padding: 10,
                font: { size: 11 }
              }
            },
            title: {
              display: true,
              text: 'Despesas por Categoria',
              color: '#8B5CF6',
              font: { size: 14, weight: 'bold' }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const valor = context.parsed;
                  const percentual = ((valor / dreData.despesas.total) * 100).toFixed(1);
                  return `${context.label}: ${formatCurrency(valor)} (${percentual}%)`;
                }
              }
            }
          }
        }
      });
    }

    // ===== GRÁFICO DE BARRAS: RESULTADO =====
    if (chartResultadoRef.current) {
      const ctx = chartResultadoRef.current.getContext('2d');

      chartResultadoInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Receitas', 'Despesas', 'Resultado'],
          datasets: [{
            label: 'Valor (R$)',
            data: [
              dreData.receitas.bruta,
              dreData.despesas.total,
              dreData.resultado.lucro
            ],
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              dreData.resultado.lucro >= 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
            ],
            borderColor: [
              '#3B82F6',
              '#EF4444',
              dreData.resultado.lucro >= 0 ? '#22C55E' : '#EF4444'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Visão Geral do Resultado',
              color: '#8B5CF6',
              font: { size: 14, weight: 'bold' }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  return `${context.label}: ${formatCurrency(context.parsed.y)}`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                color: '#F3E5AB',
                callback: (value) => formatCurrency(value)
              },
              grid: {
                color: 'rgba(139, 92, 246, 0.1)'
              }
            },
            x: {
              ticks: {
                color: '#F3E5AB'
              },
              grid: {
                display: false
              }
            }
          }
        }
      });
    }

    // Cleanup na desmontagem
    return () => {
      if (chartDespesasInstance.current) {
        chartDespesasInstance.current.destroy();
      }
      if (chartResultadoInstance.current) {
        chartResultadoInstance.current.destroy();
      }
    };
  }, [dreData]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="p-6 bg-aureon-bg min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-aureon-purple mb-2">
            DRE - Demonstração do Resultado do Exercício
          </h1>
          <p className="text-aureon-text/70">
            Análise financeira de receitas, despesas e resultados
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors"
            title="Exportar como PDF"
          >
            <FileText size={20} />
            PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg hover:bg-green-500/20 transition-colors"
            title="Exportar como Planilha Excel"
          >
            <FileSpreadsheet size={20} />
            Excel
          </button>
          <button
            onClick={handleExportHTML}
            className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-500/20 transition-colors"
            title="Exportar como HTML Interativo"
          >
            <Download size={20} />
            HTML
          </button>
        </div>
      </div>

      {/* Filtro de Período */}
      <div className="bg-aureon-surface border border-aureon-purple/30 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-aureon-purple" size={20} />
          <h2 className="text-lg font-semibold text-aureon-text">Período de Análise</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm text-aureon-text/70 mb-2">Data Início</label>
            <input
              type="date"
              value={periodoInicio}
              onChange={(e) => setPeriodoInicio(e.target.value)}
              className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-sm text-aureon-text/70 mb-2">Data Fim</label>
            <input
              type="date"
              value={periodoFim}
              onChange={(e) => setPeriodoFim(e.target.value)}
              className="w-full bg-aureon-bg border border-aureon-purple/30 rounded-lg px-4 py-2 text-aureon-text focus:outline-none focus:border-aureon-purple"
            />
          </div>

          <div className="lg:col-span-2 flex flex-wrap gap-2">
            <button
              onClick={() => handlePeriodoRapido('mes_atual')}
              className="flex-1 min-w-[100px] bg-aureon-purple/10 hover:bg-aureon-purple/20 text-aureon-purple px-3 py-2 rounded-lg text-sm transition-colors"
            >
              Mês Atual
            </button>
            <button
              onClick={() => handlePeriodoRapido('mes_anterior')}
              className="flex-1 min-w-[100px] bg-aureon-purple/10 hover:bg-aureon-purple/20 text-aureon-purple px-3 py-2 rounded-lg text-sm transition-colors"
            >
              Mês Anterior
            </button>
            <button
              onClick={() => handlePeriodoRapido('trimestre')}
              className="flex-1 min-w-[100px] bg-aureon-purple/10 hover:bg-aureon-purple/20 text-aureon-purple px-3 py-2 rounded-lg text-sm transition-colors"
            >
              Trimestre
            </button>
            <button
              onClick={() => handlePeriodoRapido('ano')}
              className="flex-1 min-w-[100px] bg-aureon-purple/10 hover:bg-aureon-purple/20 text-aureon-purple px-3 py-2 rounded-lg text-sm transition-colors"
            >
              Ano
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Receita Bruta */}
        <div className="bg-gradient-to-br from-blue-400/20 to-aureon-bg border border-blue-400/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Receita Bruta</span>
            <DollarSign className="text-blue-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-blue-400 mb-2">
            {formatCurrency(dreData.receitas.bruta)}
          </p>
          <div className="flex items-center gap-2">
            {dreData.comparativo.variacaoReceita >= 0 ? (
              <TrendingUp className="text-green-400" size={16} />
            ) : (
              <TrendingDown className="text-red-400" size={16} />
            )}
            <span
              className={`text-sm ${
                dreData.comparativo.variacaoReceita >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {formatPercent(dreData.comparativo.variacaoReceita)} vs mês anterior
            </span>
          </div>
        </div>

        {/* Total Despesas */}
        <div className="bg-gradient-to-br from-red-400/20 to-aureon-bg border border-red-400/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Total Despesas</span>
            <TrendingDown className="text-red-400" size={24} />
          </div>
          <p className="text-3xl font-bold text-red-400 mb-2">
            {formatCurrency(dreData.despesas.total)}
          </p>
          <p className="text-sm text-aureon-text/60">
            {dreData.quantidades.numDespesas} despesa(s) no período
          </p>
        </div>

        {/* Lucro Líquido */}
        <div
          className={`bg-gradient-to-br ${
            dreData.resultado.lucro >= 0 ? 'from-green-400/20' : 'from-red-400/20'
          } to-aureon-bg border ${
            dreData.resultado.lucro >= 0 ? 'border-green-400/30' : 'border-red-400/30'
          } rounded-xl p-6`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-aureon-text/70">Lucro Líquido</span>
            {dreData.resultado.lucro >= 0 ? (
              <TrendingUp className="text-green-400" size={24} />
            ) : (
              <TrendingDown className="text-red-400" size={24} />
            )}
          </div>
          <p
            className={`text-3xl font-bold mb-2 ${
              dreData.resultado.lucro >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(dreData.resultado.lucro)}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-aureon-text/70">Margem:</span>
            <span
              className={`text-sm font-semibold ${
                dreData.resultado.margem >= 0 ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {dreData.resultado.margem.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Gráficos Visuais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Despesas por Categoria */}
        <div className="bg-aureon-surface border border-aureon-purple/30 rounded-xl p-6">
          <canvas ref={chartDespesasRef} style={{ maxHeight: '300px' }}></canvas>
        </div>

        {/* Gráfico de Resultado */}
        <div className="bg-aureon-surface border border-aureon-purple/30 rounded-xl p-6">
          <canvas ref={chartResultadoRef} style={{ maxHeight: '300px' }}></canvas>
        </div>
      </div>

      {/* Seção: RECEITAS */}
      <div className="bg-aureon-surface border border-aureon-purple/30 rounded-xl mb-6 overflow-hidden">
        <button
          onClick={() => toggleSection('receitas')}
          className="w-full flex items-center justify-between p-6 hover:bg-aureon-purple/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            {expandedSections.receitas ? (
              <ChevronDown className="text-aureon-purple" size={24} />
            ) : (
              <ChevronRight className="text-aureon-purple" size={24} />
            )}
            <h2 className="text-xl font-bold text-aureon-text">RECEITAS</h2>
          </div>
          <span className="text-2xl font-bold text-blue-400">
            {formatCurrency(dreData.receitas.bruta)}
          </span>
        </button>

        {expandedSections.receitas && (
          <div className="p-6 pt-0 space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-aureon-purple/10">
              <span className="text-aureon-text">Vendas ({dreData.quantidades.numVendas})</span>
              <span className="font-semibold text-blue-400">
                {formatCurrency(dreData.receitas.vendas)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-aureon-purple/10">
              <span className="text-aureon-text">
                Recebimentos ({dreData.quantidades.numRecebimentos})
              </span>
              <span className="font-semibold text-blue-400">
                {formatCurrency(dreData.receitas.recebimentos)}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 bg-blue-400/10 rounded-lg px-4">
              <span className="font-bold text-aureon-text">Receita Bruta Total</span>
              <span className="text-xl font-bold text-blue-400">
                {formatCurrency(dreData.receitas.bruta)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Seção: DESPESAS */}
      <div className="bg-aureon-surface border border-aureon-purple/30 rounded-xl mb-6 overflow-hidden">
        <button
          onClick={() => toggleSection('despesas')}
          className="w-full flex items-center justify-between p-6 hover:bg-aureon-purple/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            {expandedSections.despesas ? (
              <ChevronDown className="text-aureon-purple" size={24} />
            ) : (
              <ChevronRight className="text-aureon-purple" size={24} />
            )}
            <h2 className="text-xl font-bold text-aureon-text">DESPESAS</h2>
          </div>
          <span className="text-2xl font-bold text-red-400">
            ({formatCurrency(dreData.despesas.total)})
          </span>
        </button>

        {expandedSections.despesas && (
          <div className="p-6 pt-0">
            {dreData.despesas.porCategoria.length === 0 ? (
              <p className="text-aureon-text/50 text-center py-4">
                Nenhuma despesa no período selecionado
              </p>
            ) : (
              <div className="space-y-3">
                {dreData.despesas.porCategoria.map(([categoria, dados]) => {
                  const percentual = (dados.total / dreData.despesas.total) * 100;
                  return (
                    <div key={categoria} className="py-3 border-b border-aureon-purple/10">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-aureon-text font-semibold">{categoria}</span>
                          <span className="text-aureon-text/60 text-sm ml-2">
                            ({dados.itens.length} despesa{dados.itens.length > 1 ? 's' : ''})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-red-400 block">
                            {formatCurrency(dados.total)}
                          </span>
                          <span className="text-xs text-aureon-text/60">
                            {percentual.toFixed(1)}% do total
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-aureon-bg rounded-full h-2">
                        <div
                          className="bg-red-400 h-2 rounded-full transition-all"
                          style={{ width: `${percentual}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between py-3 bg-red-400/10 rounded-lg px-4">
                  <span className="font-bold text-aureon-text">Total Despesas</span>
                  <span className="text-xl font-bold text-red-400">
                    ({formatCurrency(dreData.despesas.total)})
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Seção: RESULTADO */}
      <div
        className={`bg-aureon-surface border ${
          dreData.resultado.lucro >= 0 ? 'border-green-400/30' : 'border-red-400/30'
        } rounded-xl overflow-hidden`}
      >
        <button
          onClick={() => toggleSection('resultado')}
          className="w-full flex items-center justify-between p-6 hover:bg-aureon-purple/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            {expandedSections.resultado ? (
              <ChevronDown className="text-aureon-purple" size={24} />
            ) : (
              <ChevronRight className="text-aureon-purple" size={24} />
            )}
            <h2 className="text-xl font-bold text-aureon-text">RESULTADO</h2>
          </div>
          <span
            className={`text-2xl font-bold ${
              dreData.resultado.lucro >= 0 ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {formatCurrency(dreData.resultado.lucro)}
          </span>
        </button>

        {expandedSections.resultado && (
          <div className="p-6 pt-0 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-aureon-bg border border-aureon-purple/20 rounded-lg p-4">
                <span className="text-sm text-aureon-text/70">Lucro/Prejuízo Líquido</span>
                <p
                  className={`text-3xl font-bold mt-2 ${
                    dreData.resultado.lucro >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {formatCurrency(dreData.resultado.lucro)}
                </p>
              </div>

              <div className="bg-aureon-bg border border-aureon-purple/20 rounded-lg p-4">
                <span className="text-sm text-aureon-text/70">Margem de Lucro</span>
                <p
                  className={`text-3xl font-bold mt-2 ${
                    dreData.resultado.margem >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {dreData.resultado.margem.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Comparativo */}
            <div className="bg-aureon-purple/5 border border-aureon-purple/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-aureon-text mb-3">
                Comparativo com Mês Anterior
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-aureon-text/70">Variação de Receita</span>
                  <div className="flex items-center gap-2 mt-1">
                    {dreData.comparativo.variacaoReceita >= 0 ? (
                      <TrendingUp className="text-green-400" size={20} />
                    ) : (
                      <TrendingDown className="text-red-400" size={20} />
                    )}
                    <span
                      className={`text-xl font-bold ${
                        dreData.comparativo.variacaoReceita >= 0
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {formatPercent(dreData.comparativo.variacaoReceita)}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-aureon-text/70">Variação de Lucro</span>
                  <div className="flex items-center gap-2 mt-1">
                    {dreData.comparativo.variacaoLucro >= 0 ? (
                      <TrendingUp className="text-green-400" size={20} />
                    ) : (
                      <TrendingDown className="text-red-400" size={20} />
                    )}
                    <span
                      className={`text-xl font-bold ${
                        dreData.comparativo.variacaoLucro >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {formatPercent(dreData.comparativo.variacaoLucro)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fórmula DRE */}
            <div className="bg-aureon-bg border border-aureon-purple/20 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-aureon-text mb-3">Estrutura da DRE</h3>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-aureon-text/70">(+) Receita Bruta:</span>
                  <span className="text-blue-400">{formatCurrency(dreData.receitas.bruta)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-aureon-text/70">(-) Despesas Totais:</span>
                  <span className="text-red-400">({formatCurrency(dreData.despesas.total)})</span>
                </div>
                <div className="h-px bg-aureon-purple/20 my-2" />
                <div className="flex justify-between font-bold">
                  <span className="text-aureon-text">(=) Lucro/Prejuízo Líquido:</span>
                  <span
                    className={dreData.resultado.lucro >= 0 ? 'text-green-400' : 'text-red-400'}
                  >
                    {formatCurrency(dreData.resultado.lucro)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

