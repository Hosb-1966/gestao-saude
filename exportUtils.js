// Utilitários para exportação de dados

// Função para converter dados para CSV
export function convertToCSV(data, headers) {
  if (!data || data.length === 0) return '';
  
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header] || '';
      // Escapa aspas duplas e adiciona aspas se necessário
      const escapedValue = String(value).replace(/"/g, '""');
      return `"${escapedValue}"`;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}

// Função para baixar arquivo
export function downloadFile(content, filename, contentType = 'text/plain') {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

// Exportar agenda de consultas
export function exportConsultas(agenda, unidades) {
  const data = [];
  
  Object.keys(agenda).forEach(unidadeId => {
    const unidade = unidades.find(u => u.id === unidadeId);
    const unidadeNome = unidade ? unidade.nome : unidadeId;
    
    Object.keys(agenda[unidadeId]).forEach(dia => {
      Object.keys(agenda[unidadeId][dia]).forEach(funcionario => {
        const medicos = agenda[unidadeId][dia][funcionario];
        medicos.forEach(medico => {
          data.push({
            unidade: unidadeNome,
            dia: dia,
            funcionario: funcionario,
            medico: medico,
            data_exportacao: new Date().toLocaleDateString('pt-BR')
          });
        });
      });
    });
  });
  
  const headers = ['unidade', 'dia', 'funcionario', 'medico', 'data_exportacao'];
  const csv = convertToCSV(data, headers);
  const filename = `consultas_${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csv, filename, 'text/csv');
  
  return data.length;
}

// Exportar exames
export function exportExames(exames, unidades) {
  const data = [];
  
  Object.keys(exames).forEach(unidadeId => {
    const unidade = unidades.find(u => u.id === unidadeId);
    const unidadeNome = unidade ? unidade.nome : unidadeId;
    
    Object.keys(exames[unidadeId]).forEach(dia => {
      Object.keys(exames[unidadeId][dia]).forEach(funcionario => {
        const tiposExames = exames[unidadeId][dia][funcionario];
        tiposExames.forEach(exame => {
          data.push({
            unidade: unidadeNome,
            dia: dia,
            funcionario: funcionario,
            tipo_exame: exame,
            data_exportacao: new Date().toLocaleDateString('pt-BR')
          });
        });
      });
    });
  });
  
  const headers = ['unidade', 'dia', 'funcionario', 'tipo_exame', 'data_exportacao'];
  const csv = convertToCSV(data, headers);
  const filename = `exames_${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csv, filename, 'text/csv');
  
  return data.length;
}

// Exportar remarcações
export function exportRemarcacoes(remarcacoes) {
  const headers = ['medico', 'dataRemarcacao', 'dias', 'qtPacientes', 'horaCall', 'contato', 'data', 'prazo'];
  const data = remarcacoes.map(item => ({
    medico: item.medico || '',
    dataRemarcacao: item.dataRemarcacao || '',
    dias: item.dias || '',
    qtPacientes: item.qtPacientes || '',
    horaCall: item.horaCall || '',
    contato: item.contato || '',
    data: item.data || '',
    prazo: item.prazo || ''
  }));
  
  const csv = convertToCSV(data, headers);
  const filename = `remarcacoes_${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(csv, filename, 'text/csv');
  
  return data.length;
}

// Exportar dados do dashboard
export function exportDashboard(statsValues, atividadeSemanal, agendamentosPorUnidade) {
  const dashboardData = {
    estatisticas: statsValues,
    atividade_semanal: atividadeSemanal,
    agendamentos_por_unidade: agendamentosPorUnidade,
    data_exportacao: new Date().toISOString(),
    versao: '1.0'
  };
  
  const json = JSON.stringify(dashboardData, null, 2);
  const filename = `dashboard_${new Date().toISOString().split('T')[0]}.json`;
  downloadFile(json, filename, 'application/json');
  
  return dashboardData;
}

// Função para gerar relatório completo
export function exportRelatorioCompleto(allData) {
  const {
    statsValues,
    atividadeSemanal,
    agenda,
    exames,
    remarcacoes,
    unidades
  } = allData;
  
  const relatorio = {
    cabecalho: {
      titulo: 'Relatório Completo - Sistema de Gestão de Saúde',
      data_geracao: new Date().toISOString(),
      periodo: 'Dados atuais do sistema'
    },
    estatisticas_gerais: statsValues,
    atividade_semanal: atividadeSemanal,
    unidades: unidades,
    resumo_consultas: {
      total_agendamentos: Object.values(agenda).reduce((total, unidade) => {
        return total + Object.values(unidade).reduce((unitTotal, dia) => {
          return unitTotal + Object.keys(dia).length;
        }, 0);
      }, 0)
    },
    dados_detalhados: {
      consultas: agenda,
      exames: exames,
      remarcacoes: remarcacoes
    }
  };
  
  const json = JSON.stringify(relatorio, null, 2);
  const filename = `relatorio_completo_${new Date().toISOString().split('T')[0]}.json`;
  downloadFile(json, filename, 'application/json');
  
  return relatorio;
}

// Função para importar dados (para futuras implementações)
export function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        resolve(data);
      } catch (error) {
        reject(new Error('Arquivo JSON inválido'));
      }
    };
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsText(file);
  });
}

