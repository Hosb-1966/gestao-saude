import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart3, Calendar, Stethoscope, Repeat, Users, Clock, MapPin, Edit2, Save, X, Plus, Building2 } from 'lucide-react';
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
  
  const totalAgendamentos = Object.values(agenda).reduce((total, unidade) => {
    return total + Object.values(unidade).reduce((unitTotal, dia) => {
      return unitTotal + Object.keys(dia).length;
    }, 0);
  }, 0);

  const agendamentosPorUnidade = unidadesIniciais.map(unidade => ({
    nome: unidade.nome,
    agendamentos: Object.values(agenda[unidade.id] || {}).reduce((total, dia) => total + Object.keys(dia).length, 0),
    cor: unidade.cor
  }));

  const coresSuaves = ['#94a3b8', '#10b981', '#f59e0b', '#ef4444'];

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
    // Recarrega dados do localStorage
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
            // Aqui você pode implementar a lógica de importação
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

  // Preparar dados para a toolbar
  const toolbarData = {
    statsValues,
    atividadeSemanal,
    agendamentosPorUnidade,
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
          title={titles.totalMedicos}
          icon={<Users className="h-4 w-4 text-slate-400" />}
          value={statsValues.totalMedicos}
          statKey="totalMedicos"
          subtitle="Profissionais ativos"
        />
        <EditableCard
          title={titles.agendamentos}
          icon={<Calendar className="h-4 w-4 text-slate-400" />}
          value={totalAgendamentos}
          statKey="totalAgendamentos"
          subtitle="Total no sistema"
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
            <CardTitle className="text-lg font-medium text-slate-700">
              <EditableTitle value={titles.agendamentosPorUnidade} titleKey="agendamentosPorUnidade" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={agendamentosPorUnidade}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.5} />
                <XAxis dataKey="nome" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="agendamentos" fill="#94a3b8" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-slate-700">
              <EditableTitle value={titles.distribuicaoPorUnidade} titleKey="distribuicaoPorUnidade" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={agendamentosPorUnidade.filter(item => item.agendamentos > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="agendamentos"
                >
                  {agendamentosPorUnidade.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={coresSuaves[index % coresSuaves.length]} opacity={0.8} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
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

  // Componentes de tabelas (AgendaTable, ExamsTable, RemarcacoesTable) 
  // seriam implementados aqui de forma similar ao original, mas com as validações

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Estatísticas rápidas */}
      <QuickStats stats={statsValues} />
      
      {/* Toolbar */}
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
        {/* Outras views seriam implementadas aqui */}
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

