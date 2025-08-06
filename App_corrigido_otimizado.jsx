import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart3, Calendar, Stethoscope, Repeat, Users, Clock, MapPin, Edit2, Save, X, Plus, Building2, Trash2, Phone, Timer, UserCheck, AlertTriangle, Download, FileText, BarChart2, Activity, Settings, Lock, LogOut } from 'lucide-react';
import { funcionarios, unidades as unidadesIniciais, diasSemana, agendaInicial, funcionariosExames, examesInicial, remarcacoesInicial } from './data/initialData';
import { useLocalStorage, useDashboardData } from './hooks/useLocalStorage';
import { NotificationProvider, useNotifications, useValidationNotification } from './components/NotificationSystem';
import { 
  validateNumber, 
  validateText, 
  validateMedicosList, 
  validateRemarcacao,
  validateDashboardStats,
  sanitizeInput,
  formatName 
} from './utils/validationUtils';
import html2canvas from 'html2canvas';
import './App.css';

function AppContent() {
  const [view, setView] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [showLogin, setShowLogin] = useState(false);
  
  // Estados com localStorage
  const { statsValues, setStatsValues, atividadeSemanal, setAtividadeSemanal, titles, setTitles } = useDashboardData();
  
  const [funcionariosEditaveis, setFuncionariosEditaveis] = useLocalStorage('funcionarios-consultas', [...funcionarios]);
  const [funcionariosExamesEditaveis, setFuncionariosExamesEditaveis] = useLocalStorage('funcionarios-exames', [...funcionariosExames]);
  const [diasEditaveis, setDiasEditaveis] = useLocalStorage('dias-semana', [...diasSemana]);
  const [remarcacoesColunas, setRemarcacoesColunas] = useLocalStorage('remarcacoes-colunas', [
    'Médico', 'Data Remarcação', 'Dias', 'Qt Pacientes', 'Hora Call', 'Contato', 'Data', 'Prazo'
  ]);
  
  // Estados para tabelas editáveis
  const [agenda, setAgenda] = useLocalStorage('agenda-consultas', agendaInicial);
  const [exames, setExames] = useLocalStorage('exames-dados', examesInicial);
  const [remarcacoes, setRemarcacoes] = useLocalStorage('remarcacoes-dados', remarcacoesInicial);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('fonseca');
  const [editingStats, setEditingStats] = useState({});
  
  // Estados para títulos editáveis dos cards
  const [cardTitles, setCardTitles] = useLocalStorage('card-titles', {
    totalMedicos: 'Total de Médicos',
    remarcacoes: 'Remarcações',
    exames: 'Exames',
    unidades: 'Unidades'
  });
  
  // Hooks de notificação
  const { success, error, warning } = useNotifications();
  const { notifyValidationErrors } = useValidationNotification();

  // Sistema de login simples
  const handleLogin = () => {
    if (loginData.username === 'admin' && loginData.password === 'admin123') {
      setIsAuthenticated(true);
      setShowLogin(false);
      success('Login realizado com sucesso! Você agora pode editar os dados.');
    } else {
      error('Usuário ou senha incorretos!');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setLoginData({ username: '', password: '' });
    success('Logout realizado com sucesso!');
  };
  
  // Cálculos automáticos baseados nas tabelas (useMemo para otimização)
  const calculatedStats = useMemo(() => {
    // Total de médicos únicos das consultas (apenas médicos com agendas)
    const medicosConsultas = new Set();
    Object.values(agenda).forEach(unidade => {
      Object.values(unidade).forEach(dia => {
        Object.values(dia).forEach(medicos => {
          medicos.forEach(medico => {
            if (medico && medico.trim()) {
              medicosConsultas.add(medico.trim());
            }
          });
        });
      });
    });
    
    // Total de exames únicos (apenas tipos de exames únicos)
    const tiposExamesUnicos = new Set();
    Object.values(exames).forEach(unidade => {
      Object.values(unidade).forEach(dia => {
        Object.values(dia).forEach(tiposExames => {
          tiposExames.forEach(tipoExame => {
            if (tipoExame && tipoExame.trim()) {
              tiposExamesUnicos.add(tipoExame.trim());
            }
          });
        });
      });
    });
    
    // Total de remarcações
    const totalRemarcacoes = remarcacoes.length;
    
    return {
      totalMedicos: medicosConsultas.size,
      totalRemarcacoes,
      totalExames: tiposExamesUnicos.size,
      unidadesAtivas: unidadesIniciais.length
    };
  }, [agenda, exames, remarcacoes]);

  // Atividade semanal calculada automaticamente das tabelas
  const atividadeSemanelCalculada = useMemo(() => {
    const diasMap = {
      'Segunda': 'SEG',
      'Terça': 'TER', 
      'Quarta': 'QUA',
      'Quinta': 'QUI',
      'Sexta': 'SEX',
      'Sábado': 'SAB'
    };

    return diasSemana.slice(0, 6).map(dia => {
      let totalAgendas = 0;
      
      // Contar consultas do dia
      Object.values(agenda).forEach(unidade => {
        if (unidade[dia]) {
          Object.values(unidade[dia]).forEach(medicos => {
            totalAgendas += medicos.length;
          });
        }
      });
      
      // Contar exames do dia
      Object.values(exames).forEach(unidade => {
        if (unidade[dia]) {
          Object.values(unidade[dia]).forEach(tiposExames => {
            totalAgendas += tiposExames.length;
          });
        }
      });
      
      return {
        dia: diasMap[dia] || dia.substring(0, 3).toUpperCase(),
        agendas: totalAgendas
      };
    });
  }, [agenda, exames]);
  
  // Cálculos para gráficos baseados em dados das tabelas
  const remarcacoesStats = useMemo(() => {
    const totalDias = remarcacoes.reduce((sum, item) => sum + (item.dias || 0), 0);
    const totalPacientes = remarcacoes.reduce((sum, item) => sum + (item.qtPacientes || 0), 0);
    const totalHoras = remarcacoes.reduce((sum, item) => {
      if (item.horaCall) {
        const [hours, minutes] = item.horaCall.split(':').map(Number);
        return sum + hours + (minutes / 60);
      }
      return sum;
    }, 0);
    
    const contatoDistribution = remarcacoes.reduce((acc, item) => {
      const contato = item.contato || 'Não informado';
      acc[contato] = (acc[contato] || 0) + 1;
      return acc;
    }, {});
    
    // Filtrar apenas "Dentro" e "Fora" para o gráfico de prazos
    const prazoDistribution = remarcacoes.reduce((acc, item) => {
      if (item.prazo === 'Dentro' || item.prazo === 'Fora') {
        acc[item.prazo] = (acc[item.prazo] || 0) + 1;
      }
      return acc;
    }, {});
    
    // Médicos com remarcações "Dentro" e "Fora" para gráfico empilhado
    const medicosRemarcacoes = remarcacoes.reduce((acc, item) => {
      if (item.medico && item.medico.trim() && (item.prazo === 'Dentro' || item.prazo === 'Fora')) {
        const medico = item.medico.trim();
        if (!acc[medico]) {
          acc[medico] = { Dentro: 0, Fora: 0 };
        }
        acc[medico][item.prazo]++;
      }
      return acc;
    }, {});
    
    return {
      totalDias,
      totalPacientes,
      totalHoras: Math.round(totalHoras * 10) / 10,
      contatoDistribution,
      prazoDistribution,
      medicosRemarcacoes
    };
  }, [remarcacoes]);

  // Dados unificados de consultas e exames por unidade
  const agendaUnificada = useMemo(() => {
    return unidadesIniciais.map(unidade => {
      const consultasCount = Object.values(agenda[unidade.id] || {}).reduce((total, dia) => {
        return total + Object.values(dia).reduce((diaTotal, medicos) => diaTotal + medicos.length, 0);
      }, 0);
      
      const examesCount = Object.values(exames[unidade.id] || {}).reduce((total, dia) => {
        return total + Object.values(dia).reduce((diaTotal, tiposExames) => diaTotal + tiposExames.length, 0);
      }, 0);
      
      return {
        nome: unidade.nome,
        consultas: consultasCount,
        exames: examesCount,
        cor: unidade.cor
      };
    });
  }, [agenda, exames]);

  // Dados para gráfico de Remarcações
  const remarcacoesPorMetrica = [
    { nome: 'Total Dias', valor: remarcacoesStats.totalDias, cor: '#8b5cf6' },
    { nome: 'Total Pacientes', valor: remarcacoesStats.totalPacientes, cor: '#06b6d4' },
    { nome: 'Horas Call Center', valor: remarcacoesStats.totalHoras, cor: '#10b981' }
  ];

  // Dados para gráfico de contato
  const contatoData = Object.entries(remarcacoesStats.contatoDistribution).map(([tipo, count]) => ({
    tipo,
    count,
    percentage: ((count / remarcacoes.length) * 100).toFixed(1)
  }));

  // Dados para gráfico de prazo (apenas "Dentro" e "Fora")
  const prazoData = Object.entries(remarcacoesStats.prazoDistribution)
    .filter(([status]) => status === 'Dentro' || status === 'Fora')
    .map(([status, count]) => {
      const total = Object.values(remarcacoesStats.prazoDistribution).reduce((a, b) => a + b, 0);
      return {
        name: status,
        value: count,
        percentage: ((count / total) * 100).toFixed(1)
      };
    });

  // Dados para gráfico empilhado de médicos com Dentro/Fora
  const medicosEmpilhadoData = Object.entries(remarcacoesStats.medicosRemarcacoes)
    .sort(([,a], [,b]) => (b.Dentro + b.Fora) - (a.Dentro + a.Fora))
    .slice(0, 5)
    .map(([medico, dados]) => ({
      name: medico.length > 12 ? medico.substring(0, 12) + '...' : medico,
      fullName: medico,
      Dentro: dados.Dentro,
      Fora: dados.Fora
    }));

  const coresSuaves = ['#94a3b8', '#10b981', '#f59e0b', '#ef4444'];
  const coresContato = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];

  // Função para adicionar nova linha na tabela de remarcações
  const addRemarcacaoRow = () => {
    if (!isAuthenticated) {
      warning('Apenas administradores podem adicionar linhas. Faça login para continuar.');
      return;
    }
    
    const newRemarcacao = {
      medico: '',
      dataRemarcacao: new Date().toLocaleDateString('pt-BR'),
      dias: null,
      qtPacientes: 10,
      horaCall: '00:00',
      contato: 'Ligação',
      data: new Date().toLocaleDateString('pt-BR'),
      prazo: ''
    };
    
    setRemarcacoes([...remarcacoes, newRemarcacao]);
    success('Nova linha adicionada com sucesso!');
  };

  // Função para remover linha da tabela de remarcações
  const removeRemarcacaoRow = (index) => {
    if (!isAuthenticated) {
      warning('Apenas administradores podem remover linhas. Faça login para continuar.');
      return;
    }
    
    const newRemarcacoes = remarcacoes.filter((_, i) => i !== index);
    setRemarcacoes(newRemarcacoes);
    success('Linha removida com sucesso!');
  };

  // CORRIGIDO: Função de exportação Dashboard PDF com imagens dos gráficos
  const handleExportDashboardPDF = async () => {
    try {
      success('Iniciando captura dos gráficos...');
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      
      // Aguardar um pouco para garantir que os gráficos estejam renderizados
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Capturar imagens dos gráficos
      const chartElements = document.querySelectorAll('.recharts-wrapper');
      const chartImages = [];
      
      for (let i = 0; i < chartElements.length; i++) {
        try {
          const canvas = await html2canvas(chartElements[i], {
            backgroundColor: '#ffffff',
            scale: 1.5,
            useCORS: true,
            allowTaint: true,
            logging: false
          });
          chartImages.push(canvas.toDataURL('image/png'));
        } catch (err) {
          console.warn(`Erro ao capturar gráfico ${i}:`, err);
          chartImages.push(''); // Placeholder vazio se falhar
        }
      }
      
      // Criar conteúdo HTML para PDF com imagens dos gráficos
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Dashboard de Saúde - ${timestamp}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
            .header { text-align: center; margin-bottom: 30px; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat-card { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .chart-section { margin: 30px 0; page-break-inside: avoid; }
            .chart-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; }
            .chart-image { max-width: 100%; height: auto; border: 1px solid #ddd; }
            .page-break { page-break-before: always; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Dashboard de Saúde - Oftalmologia</h1>
            <p>Relatório gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          
          <div class="stats">
            <div class="stat-card">
              <h3>${cardTitles.totalMedicos}</h3>
              <p>${calculatedStats.totalMedicos}</p>
            </div>
            <div class="stat-card">
              <h3>${cardTitles.remarcacoes}</h3>
              <p>${calculatedStats.totalRemarcacoes}</p>
            </div>
            <div class="stat-card">
              <h3>${cardTitles.exames}</h3>
              <p>${calculatedStats.totalExames}</p>
            </div>
            <div class="stat-card">
              <h3>${cardTitles.unidades}</h3>
              <p>${calculatedStats.unidadesAtivas}</p>
            </div>
          </div>

          ${chartImages.map((image, index) => {
            const titles = [
              'Métricas de Remarcações',
              'Meios de Contato', 
              'Prazo das Remarcações',
              'Agendas por Unidade',
              'Médicos por Prazo de Remarcação',
              'Atividade Semanal'
            ];
            return image ? `
              <div class="chart-section">
                <div class="chart-title">${titles[index] || `Gráfico ${index + 1}`}</div>
                <img src="${image}" alt="${titles[index]}" class="chart-image" />
              </div>
            ` : '';
          }).join('')}

          <div class="footer">
            <p>© Viviane Coculilo - Todos os direitos reservados</p>
          </div>
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-graficos-${timestamp}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success('Dashboard PDF exportado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao exportar dashboard:', error);
      error('Erro ao exportar dashboard. Tente novamente.');
    }
  };

  // CORRIGIDO: Função de exportação Relatório PDF com todas as tabelas
  const handleExportRelatorioPDF = () => {
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      
      // Criar conteúdo HTML para PDF com todas as tabelas
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Relatório Completo - ${timestamp}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
            .header { text-align: center; margin-bottom: 30px; }
            .section { margin: 30px 0; page-break-inside: avoid; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; font-size: 10px; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .page-break { page-break-before: always; }
            .unit-header { background-color: #e3f2fd; font-weight: bold; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Relatório Completo - Sistema de Gestão de Saúde</h1>
            <p>Relatório gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          </div>
          
          <div class="section">
            <div class="section-title">1. Tabela de Consultas</div>
            ${unidadesIniciais.map(unidade => `
              <h3 class="unit-header">Unidade: ${unidade.nome}</h3>
              <table>
                <tr>
                  <th>Dia</th>
                  ${funcionarios.map(func => `<th>${func}</th>`).join('')}
                </tr>
                ${diasSemana.map(dia => `
                  <tr>
                    <td><strong>${dia}</strong></td>
                    ${funcionarios.map(func => {
                      const medicos = agenda[unidade.id]?.[dia]?.[func] || [];
                      return `<td>${medicos.join(', ') || '-'}</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </table>
            `).join('')}
          </div>

          <div class="page-break"></div>

          <div class="section">
            <div class="section-title">2. Tabela de Exames</div>
            ${unidadesIniciais.map(unidade => `
              <h3 class="unit-header">Unidade: ${unidade.nome}</h3>
              <table>
                <tr>
                  <th>Dia</th>
                  ${funcionariosExames.map(func => `<th>${func}</th>`).join('')}
                </tr>
                ${diasSemana.map(dia => `
                  <tr>
                    <td><strong>${dia}</strong></td>
                    ${funcionariosExames.map(func => {
                      const exameDia = exames[unidade.id]?.[dia]?.[func] || [];
                      return `<td>${exameDia.join(', ') || '-'}</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </table>
            `).join('')}
          </div>

          <div class="page-break"></div>

          <div class="section">
            <div class="section-title">3. Tabela de Remarcações</div>
            <table>
              <tr>
                ${remarcacoesColunas.map(col => `<th>${col}</th>`).join('')}
              </tr>
              ${remarcacoes.map(item => `
                <tr>
                  <td>${item.medico || '-'}</td>
                  <td>${item.dataRemarcacao || '-'}</td>
                  <td>${item.dias || '-'}</td>
                  <td>${item.qtPacientes || '-'}</td>
                  <td>${item.horaCall || '-'}</td>
                  <td>${item.contato || '-'}</td>
                  <td>${item.data || '-'}</td>
                  <td>${item.prazo || '-'}</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <div class="section">
            <div class="section-title">4. Resumo Estatístico</div>
            <table>
              <tr><th>Métrica</th><th>Valor</th></tr>
              <tr><td>Total de Médicos</td><td>${calculatedStats.totalMedicos}</td></tr>
              <tr><td>Total de Remarcações</td><td>${calculatedStats.totalRemarcacoes}</td></tr>
              <tr><td>Total de Exames</td><td>${calculatedStats.totalExames}</td></tr>
              <tr><td>Unidades Ativas</td><td>${calculatedStats.unidadesAtivas}</td></tr>
            </table>
          </div>

          <div class="footer">
            <p>© Viviane Coculilo - Todos os direitos reservados</p>
          </div>
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-completo-${timestamp}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success('Relatório PDF exportado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      error('Erro ao exportar relatório. Tente novamente.');
    }
  };

  // Funções de edição para títulos dos cards
  const handleEditCardTitle = (cardKey, value) => {
    if (!isAuthenticated) {
      warning('Apenas administradores podem editar títulos. Faça login para continuar.');
      return;
    }
    
    const validation = validateText(value, 1, 50);
    if (!validation.isValid) {
      notifyValidationErrors(validation.error);
      return;
    }
    
    setCardTitles({ ...cardTitles, [cardKey]: validation.value });
    success('Título do card atualizado com sucesso!');
  };

  // Funções de edição para títulos e cabeçalhos
  const handleEditTitle = (titleKey, value) => {
    if (!isAuthenticated) {
      warning('Apenas administradores podem editar títulos. Faça login para continuar.');
      return;
    }
    
    const validation = validateText(value, 1, 100);
    if (!validation.isValid) {
      notifyValidationErrors(validation.error);
      return;
    }
    
    setTitles({ ...titles, [titleKey]: validation.value });
    success('Título atualizado com sucesso!');
  };

  const handleEditFuncionario = (index, value, tipo = 'consultas') => {
    if (!isAuthenticated) {
      warning('Apenas administradores podem editar funcionários. Faça login para continuar.');
      return;
    }
    
    const validation = validateText(value, 2, 50);
    if (!validation.isValid) {
      notifyValidationErrors(validation.error);
      return;
    }
    
    const formattedName = formatName(validation.value);
    
    if (tipo === 'consultas') {
      const newFuncionarios = [...funcionariosEditaveis];
      newFuncionarios[index] = formattedName;
      setFuncionariosEditaveis(newFuncionarios);
    } else {
      const newFuncionarios = [...funcionariosExamesEditaveis];
      newFuncionarios[index] = formattedName;
      setFuncionariosExamesEditaveis(newFuncionarios);
    }
    
    success('Funcionário atualizado com sucesso!');
  };

  const handleEditDia = (index, value) => {
    if (!isAuthenticated) {
      warning('Apenas administradores podem editar dias. Faça login para continuar.');
      return;
    }
    
    const validation = validateText(value, 2, 10);
    if (!validation.isValid) {
      notifyValidationErrors(validation.error);
      return;
    }
    
    const newDias = [...diasEditaveis];
    newDias[index] = validation.value.toUpperCase();
    setDiasEditaveis(newDias);
    success('Dia atualizado com sucesso!');
  };

  const handleEditColuna = (index, value) => {
    if (!isAuthenticated) {
      warning('Apenas administradores podem editar colunas. Faça login para continuar.');
      return;
    }
    
    const validation = validateText(value, 2, 30);
    if (!validation.isValid) {
      notifyValidationErrors(validation.error);
      return;
    }
    
    const newColunas = [...remarcacoesColunas];
    newColunas[index] = validation.value;
    setRemarcacoesColunas(newColunas);
    success('Coluna atualizada com sucesso!');
  };

  // Funções de edição para tabelas
  const handleEdit = (cellKey, value) => {
    if (!isAuthenticated) {
      warning('Apenas administradores podem editar dados. Faça login para continuar.');
      return;
    }
    
    setEditingCell(cellKey);
    setEditValue(value || '');
  };

  const handleSave = (cellKey) => {
    if (!isAuthenticated) {
      warning('Apenas administradores podem salvar alterações. Faça login para continuar.');
      return;
    }
    
    const sanitizedValue = sanitizeInput(editValue);
    
    if (cellKey.includes('agenda')) {
      const [_, unidade, dia, funcionario] = cellKey.split('-');
      const validation = validateMedicosList(sanitizedValue);
      
      if (!validation.isValid) {
        notifyValidationErrors(validation.error);
        return;
      }
      
      const newAgenda = { ...agenda };
      if (!newAgenda[unidade]) newAgenda[unidade] = {};
      if (!newAgenda[unidade][dia]) newAgenda[unidade][dia] = {};
      
      if (validation.value.length > 0) {
        newAgenda[unidade][dia][funcionario] = validation.value;
      } else {
        delete newAgenda[unidade][dia][funcionario];
      }
      
      setAgenda(newAgenda);
      success('Agenda atualizada com sucesso!');
      
    } else if (cellKey.includes('remarcacao')) {
      const [_, index, field] = cellKey.split('-');
      const newRemarcacoes = [...remarcacoes];
      
      if (field === 'dias' || field === 'qtPacientes') {
        const validation = validateNumber(sanitizedValue, 0, 1000);
        if (!validation.isValid && sanitizedValue !== '') {
          notifyValidationErrors(validation.error);
          return;
        }
        newRemarcacoes[index][field] = sanitizedValue === '' ? null : validation.value;
      } else {
        newRemarcacoes[index][field] = sanitizedValue;
      }
      
      // Validar o objeto completo
      const validation = validateRemarcacao(newRemarcacoes[index]);
      if (!validation.isValid) {
        warning('Alguns campos podem ter problemas de validação', Object.values(validation.errors).join(', '));
      }
      
      setRemarcacoes(newRemarcacoes);
      success('Remarcação atualizada com sucesso!');
      
    } else if (cellKey.includes('exame')) {
      const [_, unidade, dia, funcionario] = cellKey.split('-');
      const tiposExames = sanitizedValue.split(',').map(e => e.trim()).filter(e => e.length > 0);
      
      const newExames = { ...exames };
      if (!newExames[unidade]) newExames[unidade] = {};
      if (!newExames[unidade][dia]) newExames[unidade][dia] = {};
      
      if (tiposExames.length > 0) {
        newExames[unidade][dia][funcionario] = tiposExames;
      } else {
        delete newExames[unidade][dia][funcionario];
      }
      
      setExames(newExames);
      success('Exames atualizados com sucesso!');
    }
    
    setEditingCell(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const getUnitColor = (unitId) => {
    const unit = unidadesIniciais.find(u => u.id === unitId);
    return unit ? unit.cor : '#f3f4f6';
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // Função para obter cor do prazo
  const getPrazoColor = (prazo) => {
    if (prazo === 'Dentro') return 'bg-green-100 text-green-800 border-green-200';
    if (prazo === 'Fora') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Instruções de uso por página (mais concisas, com ícones)
  const getInstrucoesUso = () => {
    switch(view) {
      case 'dashboard':
        return (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <span><strong>Dashboard:</strong> Métricas em tempo real</span>
            </div>
            <div className="flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-green-500" />
              <span>Cards editáveis com ícone de lápis</span>
            </div>
          </div>
        );
      case 'consultas':
        return (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-purple-500" />
              <span><strong>Consultas:</strong> Clique nas células para editar</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-500" />
              <span>Separe médicos com vírgulas</span>
            </div>
          </div>
        );
      case 'exames':
        return (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-500" />
              <span><strong>Exames:</strong> Edição inline disponível</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-500" />
              <span>Tipos de exames separados por vírgulas</span>
            </div>
          </div>
        );
      case 'remarcacoes':
        return (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-red-500" />
              <span><strong>Remarcações:</strong> Tabela totalmente editável</span>
            </div>
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-green-500" />
              <span>Botão "Adicionar Linha" para novas entradas</span>
            </div>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2 text-sm">
            <Settings className="h-4 w-4 text-gray-500" />
            <span>Sistema de Gestão de Saúde - Dados salvos automaticamente</span>
          </div>
        );
    }
  };

  // Modal de Login
  const LoginModal = () => (
    showLogin && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Login de Administrador
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Usuário:</label>
              <Input
                type="text"
                value={loginData.username}
                onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                placeholder="Digite o usuário"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Senha:</label>
              <Input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                placeholder="Digite a senha"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleLogin} className="flex-1">
                Entrar
              </Button>
              <Button onClick={() => setShowLogin(false)} variant="outline" className="flex-1">
                Cancelar
              </Button>
            </div>
            <div className="text-xs text-gray-500 text-center">
              Usuário: admin | Senha: admin123
            </div>
          </div>
        </div>
      </div>
    )
  );

  const EditableTitle = ({ value, titleKey, className = "", icon = null }) => (
    <div className={`flex items-center gap-2 group ${className}`}>
      {icon}
      {editingCell === `title-${titleKey}` ? (
        <div className="flex gap-2">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleEditTitle(titleKey, editValue);
                setEditingCell(null);
              }
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <Button
            size="sm"
            onClick={() => {
              handleEditTitle(titleKey, editValue);
              setEditingCell(null);
            }}
            className="h-8 w-8 p-0"
          >
            <Save className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <>
          <span>{value}</span>
          {isAuthenticated && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setEditingCell(`title-${titleKey}`);
                setEditValue(value);
              }}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
        </>
      )}
    </div>
  );

  const EditableCard = ({ title, icon, value, cardKey, subtitle }) => (
    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600 group">
          {editingCell === `card-${cardKey}` ? (
            <div className="flex gap-2">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="h-6 text-xs"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleEditCardTitle(cardKey, editValue);
                    setEditingCell(null);
                  }
                  if (e.key === 'Escape') handleCancel();
                }}
              />
              <Button
                size="sm"
                onClick={() => {
                  handleEditCardTitle(cardKey, editValue);
                  setEditingCell(null);
                }}
                className="h-6 w-6 p-0"
              >
                <Save className="h-2 w-2" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span>{title}</span>
              {isAuthenticated && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditingCell(`card-${cardKey}`);
                    setEditValue(title);
                  }}
                  className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit2 className="h-2 w-2" />
                </Button>
              )}
            </div>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-slate-900">{value}</div>
        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
      </CardContent>
    </Card>
  );

  // Toolbar com sistema de login
  const Toolbar = () => (
    <div className="bg-white border-b border-slate-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-lg font-semibold text-slate-700">Sistema de Gestão de Saúde</span>
          {isAuthenticated && (
            <Badge className="bg-green-100 text-green-800">
              Administrador
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Button onClick={() => success('Dados salvos automaticamente!')} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Salvar
              </Button>
              <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Atualizar
              </Button>
              
              <div className="relative group">
                <Button className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExportDashboardPDF}
                      className="w-full justify-start text-xs"
                    >
                      Dashboard (PDF)
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleExportRelatorioPDF}
                      className="w-full justify-start text-xs"
                    >
                      Relatório (PDF)
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </>
          ) : (
            <Button onClick={() => setShowLogin(true)} className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Login Admin
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  // QuickStats atualizada
  const QuickStats = () => (
    <div className="bg-slate-100 border-b border-slate-200 px-6 py-2">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <div className="flex items-center gap-6">
          <span>Total de Médicos: <strong>{calculatedStats.totalMedicos}</strong></span>
          <span>Total de Exames: <strong>{calculatedStats.totalExames}</strong></span>
          <span>Unidades Ativas: <strong>{calculatedStats.unidadesAtivas}</strong></span>
        </div>
        <div className="text-xs text-slate-500">
          Última atualização: {new Date().toLocaleTimeString('pt-BR')}
        </div>
      </div>
    </div>
  );

  // CORRIGIDO: Rodapé com direitos autorais e instruções
  const Footer = () => (
    <div className="bg-gradient-to-r from-slate-100 to-slate-200 border-t border-slate-300 px-6 py-4 mt-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-slate-600" />
          <span className="font-medium text-slate-700">Instruções de Uso:</span>
        </div>
        {getInstrucoesUso()}
      </div>
      <div className="text-center mt-3 pt-3 border-t border-slate-300">
        <p className="text-xs text-slate-600">© Viviane Coculilo - Todos os direitos reservados</p>
      </div>
    </div>
  );

  // Dashboard SEM fundo oftalmológico (removido)
  const Dashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EditableCard
          title={cardTitles.totalMedicos}
          icon={<Users className="h-4 w-4 text-slate-400" />}
          value={calculatedStats.totalMedicos}
          cardKey="totalMedicos"
          subtitle="Médicos únicos com consultas"
        />
        <EditableCard
          title={cardTitles.remarcacoes}
          icon={<Repeat className="h-4 w-4 text-slate-400" />}
          value={calculatedStats.totalRemarcacoes}
          cardKey="remarcacoes"
          subtitle="Total de remarcações"
        />
        <EditableCard
          title={cardTitles.exames}
          icon={<Stethoscope className="h-4 w-4 text-slate-400" />}
          value={calculatedStats.totalExames}
          cardKey="exames"
          subtitle="Tipos de exames únicos"
        />
        <EditableCard
          title={cardTitles.unidades}
          icon={<MapPin className="h-4 w-4 text-slate-400" />}
          value={calculatedStats.unidadesAtivas}
          cardKey="unidades"
          subtitle="Locais de atendimento"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-700 flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              Métricas de Remarcações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={remarcacoesPorMetrica}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="nome" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip formatter={(value, name) => {
                  if (name === 'Horas Call Center') {
                    return [`${value}h`, name];
                  }
                  return [value, name];
                }} />
                <Bar dataKey="valor" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-700 flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Meios de Contato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={contatoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="count"
                  label={({ tipo, percentage }) => `${tipo}: ${percentage}%`}
                >
                  {contatoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={coresContato[index % coresContato.length]} opacity={0.8} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} contatos`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="border-slate-200 shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-700 flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Prazo das Remarcações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={prazoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={120}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  labelLine={true}
                  fontSize={12}
                >
                  {prazoData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.name === 'Dentro' ? '#10b981' : '#ef4444'} 
                      opacity={0.8} 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} casos`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-700 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Agendas por Unidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={agendaUnificada} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis dataKey="nome" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="consultas" fill="#06b6d4" radius={[2, 2, 0, 0]} opacity={0.8} name="Consultas" />
                <Bar dataKey="exames" fill="#10b981" radius={[2, 2, 0, 0]} opacity={0.8} name="Exames" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Médicos por Prazo de Remarcação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={medicosEmpilhadoData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip 
                  formatter={(value, name, props) => [`${value} remarcações`, name]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                />
                <Bar dataKey="Dentro" stackId="a" fill="#10b981" opacity={0.9} name="Dentro do Prazo" />
                <Bar dataKey="Fora" stackId="a" fill="#ef4444" opacity={0.9} name="Fora do Prazo" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-700">
              <EditableTitle value={titles.atividadeSemanal} titleKey="atividadeSemanal" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 text-sm text-slate-600">
              <p>Valores calculados automaticamente das tabelas de Consultas e Exames</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={atividadeSemanelCalculada}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="agendas" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  name="Agendas"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const AgendaTable = () => (
    <div className="p-6 max-w-full overflow-x-auto bg-slate-50 min-h-screen">
      <div className="mb-6">
        <div className="flex gap-2">
          {unidadesIniciais.map(unidade => (
            <Button
              key={unidade.id}
              variant={selectedUnit === unidade.id ? "default" : "outline"}
              onClick={() => setSelectedUnit(unidade.id)}
              className="capitalize flex items-center gap-2"
              style={{
                backgroundColor: selectedUnit === unidade.id ? getUnitColor(unidade.id) : 'transparent',
                borderColor: getUnitColor(unidade.id),
                color: selectedUnit === unidade.id ? '#000' : getUnitColor(unidade.id)
              }}
            >
              <Building2 className="h-4 w-4" />
              {unidade.nome}
            </Button>
          ))}
        </div>
      </div>

      <Card className="w-full shadow-lg">
        <CardHeader style={{ backgroundColor: getUnitColor(selectedUnit) }}>
          <CardTitle className="text-xl font-semibold text-center flex items-center justify-center gap-2">
            <Building2 className="h-5 w-5" />
            Consultas - Unidade: {unidadesIniciais.find(u => u.id === selectedUnit)?.nome}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-3 bg-gray-100 font-semibold min-w-[100px]">
                    <div className="flex items-center gap-2 group">
                      <Clock className="h-4 w-4" />
                      <span>Dias</span>
                    </div>
                  </th>
                  {funcionariosEditaveis.map((funcionario, index) => (
                    <th key={funcionario} className="border border-gray-300 p-3 bg-gray-100 font-semibold min-w-[140px] text-sm">
                      <div className="flex items-center gap-2 justify-center group">
                        <Users className="h-4 w-4" />
                        {editingCell === `header-func-consultas-${index}` ? (
                          <div className="flex gap-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-6 text-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleEditFuncionario(index, editValue, 'consultas');
                                  setEditingCell(null);
                                }
                                if (e.key === 'Escape') handleCancel();
                              }}
                            />
                            <Button size="sm" onClick={() => { handleEditFuncionario(index, editValue, 'consultas'); setEditingCell(null); }} className="h-6 w-6 p-0">
                              <Save className="h-2 w-2" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span>{funcionario}</span>
                            {isAuthenticated && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setEditingCell(`header-func-consultas-${index}`); setEditValue(funcionario); }}
                                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                              >
                                <Edit2 className="h-2 w-2" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {diasSemana.map(dia => (
                  <tr key={dia}>
                    <td className="border border-gray-300 p-3 bg-gray-50 font-semibold text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Calendar className="h-4 w-4" />
                        {dia}
                      </div>
                    </td>
                    {funcionarios.map(funcionario => {
                      const medicos = agenda[selectedUnit]?.[dia]?.[funcionario] || [];
                      const cellKey = `agenda-${selectedUnit}-${dia}-${funcionario}`;
                      
                      return (
                        <td key={funcionario} className="border border-gray-300 p-2 relative group min-h-[70px] align-top">
                          {editingCell === cellKey ? (
                            <div className="flex flex-col gap-2">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder="Digite os médicos separados por vírgula"
                                className="text-xs"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSave(cellKey);
                                  if (e.key === 'Escape') handleCancel();
                                }}
                              />
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleSave(cellKey)}
                                  className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancel}
                                  className="h-7 w-7 p-0 border-red-300 text-red-600 hover:bg-red-50"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="min-h-[60px] flex flex-col justify-between">
                              <div className="flex flex-wrap gap-1 mb-2">
                                {medicos.map((medico, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="secondary" 
                                    className="text-xs flex items-center gap-1"
                                    style={{ backgroundColor: `${getUnitColor(selectedUnit)}40` }}
                                  >
                                    <Users className="h-3 w-3" />
                                    {medico}
                                  </Badge>
                                ))}
                                {medicos.length === 0 && (
                                  <div className="text-xs text-gray-400 italic flex items-center gap-1">
                                    <Plus className="h-3 w-3" />
                                    Clique para adicionar
                                  </div>
                                )}
                              </div>
                              {isAuthenticated && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(cellKey, medicos.join(', '))}
                                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity self-end bg-blue-50 hover:bg-blue-100"
                                >
                                  <Edit2 className="h-3 w-3 text-blue-600" />
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ExamsTable = () => (
    <div className="p-6 max-w-full overflow-x-auto bg-slate-50 min-h-screen">
      <div className="mb-6">
        <div className="flex gap-2">
          {unidadesIniciais.map(unidade => (
            <Button
              key={unidade.id}
              variant={selectedUnit === unidade.id ? "default" : "outline"}
              onClick={() => setSelectedUnit(unidade.id)}
              className="capitalize flex items-center gap-2"
              style={{
                backgroundColor: selectedUnit === unidade.id ? getUnitColor(unidade.id) : 'transparent',
                borderColor: getUnitColor(unidade.id),
                color: selectedUnit === unidade.id ? '#000' : getUnitColor(unidade.id)
              }}
            >
              <Building2 className="h-4 w-4" />
              {unidade.nome}
            </Button>
          ))}
        </div>
      </div>

      <Card className="w-full shadow-lg">
        <CardHeader style={{ backgroundColor: getUnitColor(selectedUnit) }}>
          <CardTitle className="text-xl font-semibold text-center flex items-center justify-center gap-2">
            <Stethoscope className="h-5 w-5" />
            Exames - Unidade: {unidadesIniciais.find(u => u.id === selectedUnit)?.nome}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-3 bg-gray-100 font-semibold min-w-[100px]">
                    <div className="flex items-center gap-2 group">
                      <Clock className="h-4 w-4" />
                      <span>Dias</span>
                    </div>
                  </th>
                  {funcionariosExamesEditaveis.map((funcionario, index) => (
                    <th key={funcionario} className="border border-gray-300 p-3 bg-gray-100 font-semibold min-w-[140px] text-sm">
                      <div className="flex items-center gap-2 justify-center group">
                        <Users className="h-4 w-4" />
                        {editingCell === `header-func-exames-${index}` ? (
                          <div className="flex gap-2">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-6 text-xs"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleEditFuncionario(index, editValue, 'exames');
                                  setEditingCell(null);
                                }
                                if (e.key === 'Escape') handleCancel();
                              }}
                            />
                            <Button size="sm" onClick={() => { handleEditFuncionario(index, editValue, 'exames'); setEditingCell(null); }} className="h-6 w-6 p-0">
                              <Save className="h-2 w-2" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span>{funcionario}</span>
                            {isAuthenticated && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setEditingCell(`header-func-exames-${index}`); setEditValue(funcionario); }}
                                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                              >
                                <Edit2 className="h-2 w-2" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {diasSemana.map(dia => (
                  <tr key={dia}>
                    <td className="border border-gray-300 p-3 bg-gray-50 font-semibold text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Calendar className="h-4 w-4" />
                        {dia}
                      </div>
                    </td>
                    {funcionariosExames.map(funcionario => {
                      const exameDia = exames[selectedUnit]?.[dia]?.[funcionario] || [];
                      const cellKey = `exame-${selectedUnit}-${dia}-${funcionario}`;
                      
                      return (
                        <td key={funcionario} className="border border-gray-300 p-2 min-h-[70px] align-top group relative">
                          {editingCell === cellKey ? (
                            <div className="flex flex-col gap-2">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder="Digite os tipos de exames separados por vírgula"
                                className="text-xs"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSave(cellKey);
                                  if (e.key === 'Escape') handleCancel();
                                }}
                              />
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleSave(cellKey)}
                                  className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700"
                                >
                                  <Save className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancel}
                                  className="h-7 w-7 p-0 border-red-300 text-red-600 hover:bg-red-50"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="min-h-[60px] flex flex-col justify-between">
                              <div className="flex flex-wrap gap-1 mb-2">
                                {exameDia.map((exame, index) => (
                                  <Badge 
                                    key={index} 
                                    variant="secondary" 
                                    className="text-xs"
                                    style={{ backgroundColor: `${getUnitColor(selectedUnit)}40` }}
                                  >
                                    {exame}
                                  </Badge>
                                ))}
                                {exameDia.length === 0 && (
                                  <div className="text-xs text-gray-400 italic flex items-center gap-1">
                                    <Plus className="h-3 w-3" />
                                    Clique para adicionar
                                  </div>
                                )}
                              </div>
                              {isAuthenticated && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(cellKey, exameDia.join(', '))}
                                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity self-end bg-blue-50 hover:bg-blue-100"
                                >
                                  <Edit2 className="h-3 w-3 text-blue-600" />
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const RemarcacoesTable = () => (
    <div className="p-6 bg-slate-50 min-h-screen">
      <Card className="w-full shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Repeat className="h-5 w-5" />
              Remarcações
            </CardTitle>
            <Button
              onClick={addRemarcacaoRow}
              className="bg-white text-purple-600 hover:bg-purple-50 flex items-center gap-2"
              size="sm"
            >
              <Plus className="h-4 w-4" />
              Adicionar Linha
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-purple-100">
                  {remarcacoesColunas.map((coluna, index) => (
                    <th key={index} className="border border-purple-200 p-3 bg-purple-50 font-semibold group">
                      {editingCell === `header-remarcacao-${index}` ? (
                        <div className="flex gap-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-6 text-xs"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleEditColuna(index, editValue);
                                setEditingCell(null);
                              }
                              if (e.key === 'Escape') handleCancel();
                            }}
                          />
                          <Button size="sm" onClick={() => { handleEditColuna(index, editValue); setEditingCell(null); }} className="h-6 w-6 p-0">
                            <Save className="h-2 w-2" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-purple-800 font-semibold">{coluna}</span>
                          {isAuthenticated && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setEditingCell(`header-remarcacao-${index}`); setEditValue(coluna); }}
                              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 text-purple-600 hover:text-purple-800"
                            >
                              <Edit2 className="h-2 w-2" />
                            </Button>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                  <th className="border border-purple-200 p-3 bg-purple-50 font-semibold text-purple-800 w-16">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {remarcacoes.map((item, index) => (
                  <tr key={index} className="hover:bg-purple-25 transition-colors">
                    {Object.keys(item).map(field => {
                      const cellKey = `remarcacao-${index}-${field}`;
                      const value = item[field];
                      
                      return (
                        <td key={field} className="border border-gray-300 p-3 group relative">
                          {editingCell === cellKey ? (
                            <div className="flex gap-2">
                              {field === 'contato' ? (
                                <select
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-8 px-2 border border-gray-300 rounded text-sm flex-1"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSave(cellKey);
                                    if (e.key === 'Escape') handleCancel();
                                  }}
                                >
                                  <option value="Email">Email</option>
                                  <option value="Whatsapp">Whatsapp</option>
                                  <option value="Ligação">Ligação</option>
                                  <option value="SMS">SMS</option>
                                </select>
                              ) : field === 'prazo' ? (
                                <select
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-8 px-2 border border-gray-300 rounded text-sm flex-1"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSave(cellKey);
                                    if (e.key === 'Escape') handleCancel();
                                  }}
                                >
                                  <option value="">Selecione...</option>
                                  <option value="Dentro">Dentro</option>
                                  <option value="Fora">Fora</option>
                                </select>
                              ) : (
                                <Input
                                  type={field === 'dias' || field === 'qtPacientes' ? 'number' : 'text'}
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  className="h-8 flex-1"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSave(cellKey);
                                    if (e.key === 'Escape') handleCancel();
                                  }}
                                />
                              )}
                              <Button
                                size="sm"
                                onClick={() => handleSave(cellKey)}
                                className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancel}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              {field === 'prazo' ? (
                                <Badge className={`${getPrazoColor(value)} border`}>
                                  {value || '-'}
                                </Badge>
                              ) : (
                                <span>{value || '-'}</span>
                              )}
                              {isAuthenticated && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(cellKey, value)}
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="border border-gray-300 p-3 text-center">
                      {isAuthenticated && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeRemarcacaoRow(index)}
                          className="h-8 w-8 p-0 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <LoginModal />
      <QuickStats />
      <Toolbar />
      
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="h-8 w-8 text-slate-600" />
          <EditableTitle 
            value={titles.systemTitle} 
            titleKey="systemTitle" 
            className="text-3xl font-semibold text-slate-800"
          />
        </div>

        <div className="flex gap-3 mb-8">
          <Button
            variant={view === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setView('dashboard')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant={view === 'consultas' ? 'default' : 'outline'}
            onClick={() => setView('consultas')}
            className="flex items-center gap-2"
          >
            <Stethoscope className="h-4 w-4" />
            Consultas
          </Button>
          <Button
            variant={view === 'exames' ? 'default' : 'outline'}
            onClick={() => setView('exames')}
            className="flex items-center gap-2"
          >
            <Calendar className="h-4 w-4" />
            Exames
          </Button>
          <Button
            variant={view === 'remarcacoes' ? 'default' : 'outline'}
            onClick={() => setView('remarcacoes')}
            className="flex items-center gap-2"
          >
            <Repeat className="h-4 w-4" />
            Remarcações
          </Button>
        </div>

        {view === 'dashboard' && <Dashboard />}
        {view === 'consultas' && <AgendaTable />}
        {view === 'exames' && <ExamsTable />}
        {view === 'remarcacoes' && <RemarcacoesTable />}
      </div>
      
      <Footer />
    </div>
  );
}

function App() {
  return (
    <NotificationProvider>
      <AppContent />
    </NotificationProvider>
  );
}

export default App;

