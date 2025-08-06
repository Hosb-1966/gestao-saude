import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart3, Calendar, Stethoscope, Repeat, Users, Clock, MapPin, Edit2, Save, X, Plus, Building2, Trash2, Phone, Timer, UserCheck } from 'lucide-react';
import { funcionarios, unidades as unidadesIniciais, diasSemana, agendaInicial, funcionariosExames, examesInicial, remarcacoesInicial } from './data/initialData';
import { useLocalStorage, useDashboardData } from './hooks/useLocalStorage';
import { NotificationProvider, useNotifications, useValidationNotification } from './components/NotificationSystem';
import { Toolbar, QuickStats } from './components/Toolbar';
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
  
  // Hooks de notificação
  const { success, error, warning } = useNotifications();
  const { notifyValidationErrors } = useValidationNotification();
  
  // Cálculos para gráficos baseados em dados das tabelas
  
  // Dados de Remarcações para gráficos
  const remarcacoesStats = {
    totalDias: remarcacoes.reduce((sum, item) => sum + (item.dias || 0), 0),
    totalPacientes: remarcacoes.reduce((sum, item) => sum + (item.qtPacientes || 0), 0),
    totalHoras: remarcacoes.reduce((sum, item) => {
      if (item.horaCall) {
        const [hours, minutes] = item.horaCall.split(':').map(Number);
        return sum + hours + (minutes / 60);
      }
      return sum;
    }, 0),
    contatoDistribution: remarcacoes.reduce((acc, item) => {
      const contato = item.contato || 'Não informado';
      acc[contato] = (acc[contato] || 0) + 1;
      return acc;
    }, {}),
    prazoDistribution: remarcacoes.reduce((acc, item) => {
      const prazo = item.prazo || 'Não informado';
      acc[prazo] = (acc[prazo] || 0) + 1;
      return acc;
    }, {})
  };

  // Dados de Consultas por unidade
  const consultasDistribution = unidadesIniciais.map(unidade => ({
    nome: unidade.nome,
    total: Object.values(agenda[unidade.id] || {}).reduce((total, dia) => {
      return total + Object.values(dia).reduce((diaTotal, medicos) => diaTotal + medicos.length, 0);
    }, 0),
    cor: unidade.cor
  }));

  // Dados de Exames por unidade
  const examesDistribution = unidadesIniciais.map(unidade => ({
    nome: unidade.nome,
    total: Object.values(exames[unidade.id] || {}).reduce((total, dia) => {
      return total + Object.values(dia).reduce((diaTotal, tiposExames) => diaTotal + tiposExames.length, 0);
    }, 0),
    cor: unidade.cor
  }));

  // Dados para gráfico de Remarcações (substituindo Agendamentos por Unidade)
  const remarcacoesPorMetrica = [
    { nome: 'Total Dias', valor: remarcacoesStats.totalDias, cor: '#8b5cf6' },
    { nome: 'Total Pacientes', valor: remarcacoesStats.totalPacientes, cor: '#06b6d4' },
    { nome: 'Horas Call Center', valor: Math.round(remarcacoesStats.totalHoras), cor: '#10b981' }
  ];

  // Dados para gráfico de contato
  const contatoData = Object.entries(remarcacoesStats.contatoDistribution).map(([tipo, count]) => ({
    tipo,
    count,
    percentage: ((count / remarcacoes.length) * 100).toFixed(1)
  }));

  // Dados para gráfico de prazo
  const prazoData = Object.entries(remarcacoesStats.prazoDistribution).map(([status, count]) => ({
    status,
    count,
    percentage: ((count / remarcacoes.length) * 100).toFixed(1)
  }));

  const coresSuaves = ['#94a3b8', '#10b981', '#f59e0b', '#ef4444'];
  const coresContato = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
  const coresPrazo = ['#10b981', '#ef4444', '#94a3b8'];

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

  // Funções de edição para Dashboard
  const handleEditStat = (statKey) => {
    setEditingStats({ ...editingStats, [statKey]: true });
  };

  const handleSaveStat = (statKey, value) => {
    const validation = validateNumber(value, 0, 10000);
    if (!validation.isValid) {
      notifyValidationErrors(validation.error);
      return;
    }
    
    const newStats = { ...statsValues, [statKey]: validation.value };
    const statsValidation = validateDashboardStats(newStats);
    
    if (!statsValidation.isValid) {
      notifyValidationErrors(statsValidation.errors);
      return;
    }
    
    setStatsValues(newStats);
    setEditingStats({ ...editingStats, [statKey]: false });
    success('Estatística atualizada com sucesso!');
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

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            success('Dados importados com sucesso!');
          } catch (err) {
            error('Erro ao importar dados', 'Arquivo JSON inválido');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Função para obter cor do prazo
  const getPrazoColor = (prazo) => {
    if (prazo === 'Dentro') return 'bg-green-100 text-green-800 border-green-200';
    if (prazo === 'Fora') return 'bg-red-100 text-red-800 border-red-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Preparar dados para a toolbar
  const toolbarData = {
    statsValues,
    atividadeSemanal,
    agendamentosPorUnidade: remarcacoesPorMetrica,
    agenda,
    exames,
    remarcacoes,
    unidades: unidadesIniciais
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

  const EditableCard = ({ title, icon, value, statKey, subtitle }) => (
    <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {icon}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditStat(statKey)}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {editingStats[statKey] ? (
          <div className="flex gap-2">
            <Input
              type="number"
              defaultValue={value}
              className="h-8"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveStat(statKey, e.target.value);
                }
              }}
              autoFocus
            />
            <Button
              size="sm"
              onClick={(e) => {
                const input = e.target.parentElement.querySelector('input');
                handleSaveStat(statKey, input.value);
              }}
              className="h-8 w-8 p-0"
            >
              <Save className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <>
            <div className="text-2xl font-semibold text-slate-900">{value}</div>
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          </>
        )}
      </CardContent>
    </Card>
  );

  const Dashboard = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EditableCard
          title="Total de Médicos"
          icon={<Users className="h-4 w-4 text-slate-400" />}
          value={statsValues.totalMedicos}
          statKey="totalMedicos"
          subtitle="Profissionais ativos"
        />
        <EditableCard
          title="Remarcações"
          icon={<Repeat className="h-4 w-4 text-slate-400" />}
          value={remarcacoes.length}
          statKey="totalRemarcacoes"
          subtitle="Total de remarcações"
        />
        <EditableCard
          title="Hoje"
          icon={<Clock className="h-4 w-4 text-slate-400" />}
          value={statsValues.agendamentosHoje}
          statKey="agendamentosHoje"
          subtitle="Consultas agendadas"
        />
        <EditableCard
          title="Unidades"
          icon={<MapPin className="h-4 w-4 text-slate-400" />}
          value={statsValues.unidadesAtivas}
          statKey="unidadesAtivas"
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
                <Tooltip />
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
                      fill={entry.status === 'Dentro' ? '#10b981' : entry.status === 'Fora' ? '#ef4444' : '#94a3b8'} 
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
              <Stethoscope className="h-5 w-5" />
              Consultas por Unidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={consultasDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis dataKey="nome" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="total" fill="#06b6d4" radius={[2, 2, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-700 flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Exames por Unidade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={examesDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis dataKey="nome" tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="total" fill="#10b981" radius={[2, 2, 0, 0]} opacity={0.8} />
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

  const RemarcacoesTable = () => (
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

  return (
    <div className="min-h-screen bg-slate-50">
      <QuickStats stats={statsValues} />
      
      <Toolbar
        currentView={view}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={handleRefresh}
        data={toolbarData}
        onImport={handleImport}
      />
      
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

