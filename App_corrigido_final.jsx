import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart3, Calendar, Stethoscope, Repeat, Users, Clock, MapPin, Edit2, Save, X, Plus, Building2, Trash2, Phone, Timer, UserCheck, AlertTriangle, Search, Filter, Download, Settings, HelpCircle } from 'lucide-react';
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
import './App.css';

function AppContent() {
  const [view, setView] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState(false);
  
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
    hoje: 'Hoje',
    unidades: 'Unidades'
  });
  
  // Hooks de notificação
  const { success, error, warning } = useNotifications();
  const { notifyValidationErrors } = useValidationNotification();
  
  // Cálculos automáticos baseados nas tabelas (useMemo para otimização)
  const calculatedStats = useMemo(() => {
    // Total de médicos únicos das consultas
    const medicosConsultas = new Set();
    Object.values(agenda).forEach(unidade => {
      Object.values(unidade).forEach(dia => {
        Object.values(dia).forEach(medicos => {
          medicos.forEach(medico => medicosConsultas.add(medico.trim()));
        });
      });
    });
    
    // Total de funcionários únicos dos exames
    const funcionariosExamesUnicos = new Set();
    Object.values(exames).forEach(unidade => {
      Object.values(unidade).forEach(dia => {
        Object.keys(dia).forEach(funcionario => funcionariosExamesUnicos.add(funcionario));
      });
    });
    
    // Total de remarcações
    const totalRemarcacoes = remarcacoes.length;
    
    // Agendamentos hoje (baseado em remarcações com data de hoje)
    const hoje = new Date().toLocaleDateString('pt-BR');
    const agendamentosHoje = remarcacoes.filter(r => r.data === hoje).length;
    
    return {
      totalMedicos: medicosConsultas.size + funcionariosExamesUnicos.size,
      totalRemarcacoes,
      agendamentosHoje,
      unidadesAtivas: unidadesIniciais.length
    };
  }, [agenda, exames, remarcacoes]);
  
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
    
    // Médicos que mais solicitaram remarcações (ofensores) - corrigido
    const medicosRemarcacoes = remarcacoes.reduce((acc, item) => {
      if (item.medico && item.medico.trim()) {
        const medico = item.medico.trim();
        acc[medico] = (acc[medico] || 0) + 1;
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
  const prazoData = Object.entries(remarcacoesStats.prazoDistribution).map(([status, count]) => ({
    status,
    count,
    percentage: ((count / Object.values(remarcacoesStats.prazoDistribution).reduce((a, b) => a + b, 0)) * 100).toFixed(1)
  }));

  // Top 5 médicos ofensores - CORRIGIDO com escala adequada
  const topOfensores = Object.entries(remarcacoesStats.medicosRemarcacoes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([medico, count]) => ({ 
      medico: medico.length > 15 ? medico.substring(0, 15) + '...' : medico, 
      count,
      fullName: medico
    }));

  const coresSuaves = ['#94a3b8', '#10b981', '#f59e0b', '#ef4444'];
  const coresContato = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
  const coresOfensores = ['#ef4444', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981'];

  // Função de busca e filtro
  const filteredData = useMemo(() => {
    if (!searchTerm && !filterActive) return { agenda, exames, remarcacoes };
    
    const searchLower = searchTerm.toLowerCase();
    
    // Filtrar agenda
    const filteredAgenda = {};
    Object.keys(agenda).forEach(unidade => {
      filteredAgenda[unidade] = {};
      Object.keys(agenda[unidade]).forEach(dia => {
        filteredAgenda[unidade][dia] = {};
        Object.keys(agenda[unidade][dia]).forEach(funcionario => {
          const medicos = agenda[unidade][dia][funcionario].filter(medico => 
            medico.toLowerCase().includes(searchLower)
          );
          if (medicos.length > 0) {
            filteredAgenda[unidade][dia][funcionario] = medicos;
          }
        });
      });
    });
    
    // Filtrar exames
    const filteredExames = {};
    Object.keys(exames).forEach(unidade => {
      filteredExames[unidade] = {};
      Object.keys(exames[unidade]).forEach(dia => {
        filteredExames[unidade][dia] = {};
        Object.keys(exames[unidade][dia]).forEach(funcionario => {
          const tiposExames = exames[unidade][dia][funcionario].filter(exame => 
            exame.toLowerCase().includes(searchLower)
          );
          if (tiposExames.length > 0) {
            filteredExames[unidade][dia][funcionario] = tiposExames;
          }
        });
      });
    });
    
    // Filtrar remarcações
    const filteredRemarcacoes = remarcacoes.filter(item => 
      Object.values(item).some(value => 
        value && value.toString().toLowerCase().includes(searchLower)
      )
    );
    
    return { 
      agenda: filteredAgenda, 
      exames: filteredExames, 
      remarcacoes: filteredRemarcacoes 
    };
  }, [agenda, exames, remarcacoes, searchTerm, filterActive]);

  // Função para adicionar nova linha na tabela de remarcações
  const addRemarcacaoRow = () => {
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
    const newRemarcacoes = remarcacoes.filter((_, i) => i !== index);
    setRemarcacoes(newRemarcacoes);
    success('Linha removida com sucesso!');
  };

  // Funções de exportação atualizadas
  const handleExport = (type) => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    
    if (type === 'dashboard-pdf') {
      // Simular exportação PDF do dashboard
      const dashboardData = {
        stats: calculatedStats,
        charts: {
          remarcacoes: remarcacoesPorMetrica,
          contatos: contatoData,
          prazos: prazoData,
          agendas: agendaUnificada,
          ofensores: topOfensores
        },
        timestamp
      };
      
      const blob = new Blob([JSON.stringify(dashboardData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      success('Dashboard exportado como JSON (PDF em desenvolvimento)');
      
    } else if (type === 'dashboard-ppt') {
      // Simular exportação PPT do dashboard
      const presentationData = {
        slides: [
          { title: 'Dashboard Geral', data: calculatedStats },
          { title: 'Métricas de Remarcações', data: remarcacoesPorMetrica },
          { title: 'Análise de Contatos', data: contatoData },
          { title: 'Top Médicos Ofensores', data: topOfensores }
        ],
        timestamp
      };
      
      const blob = new Blob([JSON.stringify(presentationData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-presentation-${timestamp}.json`;
      a.click();
      URL.revokeObjectURL(url);
      success('Apresentação exportada como JSON (PPT em desenvolvimento)');
      
    } else if (type === 'consultas-excel') {
      // Exportar dados de consultas como CSV (Excel)
      const csvData = [];
      csvData.push(['Unidade', 'Dia', 'Funcionário', 'Médicos']);
      
      Object.keys(agenda).forEach(unidadeId => {
        const unidade = unidadesIniciais.find(u => u.id === unidadeId);
        Object.keys(agenda[unidadeId]).forEach(dia => {
          Object.keys(agenda[unidadeId][dia]).forEach(funcionario => {
            const medicos = agenda[unidadeId][dia][funcionario].join(', ');
            csvData.push([unidade?.nome || unidadeId, dia, funcionario, medicos]);
          });
        });
      });
      
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consultas-${timestamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      success('Consultas exportadas para Excel (CSV)');
      
    } else if (type === 'exames-excel') {
      // Exportar dados de exames como CSV (Excel)
      const csvData = [];
      csvData.push(['Unidade', 'Dia', 'Funcionário', 'Tipos de Exames']);
      
      Object.keys(exames).forEach(unidadeId => {
        const unidade = unidadesIniciais.find(u => u.id === unidadeId);
        Object.keys(exames[unidadeId]).forEach(dia => {
          Object.keys(exames[unidadeId][dia]).forEach(funcionario => {
            const tiposExames = exames[unidadeId][dia][funcionario].join(', ');
            csvData.push([unidade?.nome || unidadeId, dia, funcionario, tiposExames]);
          });
        });
      });
      
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `exames-${timestamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      success('Exames exportados para Excel (CSV)');
      
    } else if (type === 'remarcacoes-excel') {
      // Exportar dados de remarcações como CSV (Excel)
      const csvData = [];
      csvData.push(remarcacoesColunas);
      
      remarcacoes.forEach(item => {
        const row = [
          item.medico || '',
          item.dataRemarcacao || '',
          item.dias || '',
          item.qtPacientes || '',
          item.horaCall || '',
          item.contato || '',
          item.data || '',
          item.prazo || ''
        ];
        csvData.push(row);
      });
      
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `remarcacoes-${timestamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      success('Remarcações exportadas para Excel (CSV)');
    }
  };

  // Funções de configuração e ajuda
  const handleSettings = () => {
    const settings = {
      cardTitles,
      titles,
      unidades: unidadesIniciais.map(u => ({ id: u.id, nome: u.nome, cor: u.cor })),
      funcionarios: funcionariosEditaveis,
      funcionariosExames: funcionariosExamesEditaveis,
      dias: diasEditaveis,
      colunas: remarcacoesColunas
    };
    
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'configuracoes-dashboard.json';
    a.click();
    URL.revokeObjectURL(url);
    success('Configurações exportadas com sucesso!');
  };

  const handleHelp = () => {
    const helpContent = `
# GUIA DE USO - DASHBOARD DE SAÚDE

## FUNCIONALIDADES PRINCIPAIS:

### 1. DASHBOARD
- Cards editáveis: Clique no ícone de lápis para editar títulos
- Gráficos dinâmicos: Atualizam automaticamente com mudanças nas tabelas
- Métricas calculadas em tempo real

### 2. CONSULTAS
- Tabela editável por unidade
- Clique nas células para adicionar/editar médicos
- Funcionários editáveis nos cabeçalhos

### 3. EXAMES
- Tabela editável por unidade
- Clique nas células para adicionar/editar tipos de exames
- Funcionários editáveis nos cabeçalhos

### 4. REMARCAÇÕES
- Tabela totalmente editável
- Botão "Adicionar Linha" para novas entradas
- Cores automáticas para "Dentro" e "Fora" do prazo
- Botão de remoção individual por linha

## FERRAMENTAS:

### BUSCA E FILTRO
- Campo de busca: Filtra dados em todas as tabelas
- Botão filtros: Ativa/desativa filtros avançados

### EXPORTAÇÃO
- Dashboard PDF/PPT: Exporta gráficos e métricas
- Relatórios Excel: Exporta tabelas individuais (Consultas, Exames, Remarcações)

### CONFIGURAÇÕES
- Exporta todas as configurações personalizadas
- Backup de títulos, cores e estruturas

## DICAS:
- Todos os dados são salvos automaticamente no navegador
- Use Ctrl+F para busca rápida na página
- Gráficos são responsivos e interativos
- Hover nos gráficos para detalhes adicionais
    `;
    
    const blob = new Blob([helpContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'guia-de-uso-dashboard.txt';
    a.click();
    URL.revokeObjectURL(url);
    success('Guia de uso baixado com sucesso!');
  };

  // Funções de edição para títulos dos cards
  const handleEditCardTitle = (cardKey, value) => {
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
    const validation = validateText(value, 1, 100);
    if (!validation.isValid) {
      notifyValidationErrors(validation.error);
      return;
    }
    
    setTitles({ ...titles, [titleKey]: validation.value });
    success('Título atualizado com sucesso!');
  };

  const handleEditFuncionario = (index, value, tipo = 'consultas') => {
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

  const handleEditAtividade = (index, value) => {
    const validation = validateNumber(value, 0, 1000);
    if (!validation.isValid) {
      notifyValidationErrors(validation.error);
      return;
    }
    
    const newAtividade = [...atividadeSemanal];
    newAtividade[index].agendamentos = validation.value;
    setAtividadeSemanal(newAtividade);
  };

  // Funções de edição para tabelas
  const handleEdit = (cellKey, value) => {
    setEditingCell(cellKey);
    setEditValue(value || '');
  };

  const handleSave = (cellKey) => {
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

  // Toolbar atualizada
  const Toolbar = () => (
    <div className="bg-white border-b border-slate-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          <Button
            variant={filterActive ? "default" : "outline"}
            onClick={() => setFilterActive(!filterActive)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
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
                <div className="text-xs font-semibold text-slate-500 mb-2">Dashboard</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport('dashboard-pdf')}
                  className="w-full justify-start text-xs"
                >
                  Dashboard PDF
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport('dashboard-ppt')}
                  className="w-full justify-start text-xs"
                >
                  Dashboard PPT
                </Button>
                <div className="text-xs font-semibold text-slate-500 mb-2 mt-3">Relatórios Excel</div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport('consultas-excel')}
                  className="w-full justify-start text-xs"
                >
                  Tabela Consultas
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport('exames-excel')}
                  className="w-full justify-start text-xs"
                >
                  Tabela Exames
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport('remarcacoes-excel')}
                  className="w-full justify-start text-xs"
                >
                  Tabela Remarcações
                </Button>
              </div>
            </div>
          </div>
          
          <Button onClick={handleSettings} variant="outline" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </Button>
          <Button onClick={handleHelp} variant="outline" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Ajuda
          </Button>
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
          <span>Agendamentos Hoje: <strong>{calculatedStats.agendamentosHoje}</strong></span>
          <span>Unidades Ativas: <strong>{calculatedStats.unidadesAtivas}</strong></span>
        </div>
        <div className="text-xs text-slate-500">
          Última atualização: {new Date().toLocaleTimeString('pt-BR')}
        </div>
      </div>
    </div>
  );

  const Dashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EditableCard
          title={cardTitles.totalMedicos}
          icon={<Users className="h-4 w-4 text-slate-400" />}
          value={calculatedStats.totalMedicos}
          cardKey="totalMedicos"
          subtitle="Profissionais ativos"
        />
        <EditableCard
          title={cardTitles.remarcacoes}
          icon={<Repeat className="h-4 w-4 text-slate-400" />}
          value={calculatedStats.totalRemarcacoes}
          cardKey="remarcacoes"
          subtitle="Total de remarcações"
        />
        <EditableCard
          title={cardTitles.hoje}
          icon={<Clock className="h-4 w-4 text-slate-400" />}
          value={calculatedStats.agendamentosHoje}
          cardKey="hoje"
          subtitle="Consultas agendadas"
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
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-700 flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Prazo das Remarcações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={prazoData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="count"
                  label={({ status, percentage }) => `${status}: ${percentage}%`}
                >
                  {prazoData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.status === 'Dentro' ? '#10b981' : '#ef4444'} 
                      opacity={0.8} 
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} casos`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-700 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Agendas por Unidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={agendaUnificada}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis dataKey="nome" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="consultas" fill="#06b6d4" radius={[2, 2, 0, 0]} opacity={0.8} name="Consultas" />
                <Bar dataKey="exames" fill="#10b981" radius={[2, 2, 0, 0]} opacity={0.8} name="Exames" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Top Médicos Ofensores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topOfensores} layout="horizontal" margin={{ left: 80, right: 20, top: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 'dataMax + 1']} />
                <YAxis 
                  dataKey="medico" 
                  type="category" 
                  tick={{ fontSize: 9, fill: '#64748b' }} 
                  width={75}
                  interval={0}
                />
                <Tooltip 
                  formatter={(value, name, props) => [`${value} remarcações`, props.payload.fullName]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 2, 2, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-slate-700">
            <EditableTitle value={titles.atividadeSemanal} titleKey="atividadeSemanal" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-6 gap-2">
            {atividadeSemanal.map((item, index) => (
              <div key={item.dia} className="text-center">
                <div className="text-sm font-medium text-slate-600 mb-1">{item.dia}</div>
                <Input
                  type="number"
                  value={item.agendamentos}
                  onChange={(e) => handleEditAtividade(index, e.target.value)}
                  className="h-8 text-center"
                />
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={atividadeSemanal}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
              <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="agendamentos" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );

  const AgendaTable = () => {
    const currentData = searchTerm ? filteredData.agenda : agenda;
    
    return (
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
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setEditingCell(`header-func-consultas-${index}`); setEditValue(funcionario); }}
                                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                              >
                                <Edit2 className="h-2 w-2" />
                              </Button>
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
                        const medicos = currentData[selectedUnit]?.[dia]?.[funcionario] || [];
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
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(cellKey, medicos.join(', '))}
                                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity self-end bg-blue-50 hover:bg-blue-100"
                                >
                                  <Edit2 className="h-3 w-3 text-blue-600" />
                                </Button>
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
  };

  const ExamsTable = () => {
    const currentData = searchTerm ? filteredData.exames : exames;
    
    return (
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
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setEditingCell(`header-func-exames-${index}`); setEditValue(funcionario); }}
                                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100"
                              >
                                <Edit2 className="h-2 w-2" />
                              </Button>
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
                        const exameDia = currentData[selectedUnit]?.[dia]?.[funcionario] || [];
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
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(cellKey, exameDia.join(', '))}
                                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity self-end bg-blue-50 hover:bg-blue-100"
                                >
                                  <Edit2 className="h-3 w-3 text-blue-600" />
                                </Button>
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
  };

  const RemarcacoesTable = () => {
    const currentData = searchTerm ? filteredData.remarcacoes : remarcacoes;
    
    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        <Card className="w-full shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Repeat className="h-5 w-5" />
                Remarcações (Editável)
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
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => { setEditingCell(`header-remarcacao-${index}`); setEditValue(coluna); }}
                              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 text-purple-600 hover:text-purple-800"
                            >
                              <Edit2 className="h-2 w-2" />
                            </Button>
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
                  {currentData.map((item, index) => (
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
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEdit(cellKey, value)}
                                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="border border-gray-300 p-3 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeRemarcacaoRow(index)}
                          className="h-8 w-8 p-0 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
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
  };

  return (
    <div className="min-h-screen bg-slate-50">
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

