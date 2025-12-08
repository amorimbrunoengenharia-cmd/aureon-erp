// Funções utilitárias para datas

export const parseDataBR = (dataStr) => {
  if (!dataStr) return new Date(0);
  try {
    const [dia, mes, ano] = dataStr.split('/').map(Number);
    if (!dia || !mes || !ano) return new Date(0);
    return new Date(ano, mes - 1, dia);
  } catch (e) {
    return new Date(0);
  }
};

export const formatarData = (data) => {
  if (!data) return '';
  const d = new Date(data);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
};

export const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0);
};

export const calcularDiasEntre = (data1, data2) => {
  const d1 = parseDataBR(data1);
  const d2 = new Date();
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
};
