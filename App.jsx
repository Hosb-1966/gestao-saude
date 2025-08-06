import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { BarChart3, Calendar, Stethoscope, Repeat, Users, Clock, MapPin, Edit2, Save, X, Plus, Building2 } from 'lucide-react';
import { funcionarios, unidades as unidadesIniciais, diasSemana, agendaInicial, funcionariosExames, examesInicial, remarcacoesInicial } from './initialData';
import { useLocalStorage, useDashboardData } from './useLocalStorage';
import { NotificationProvider, useNotifications, useValidationNotification } from './NotificationSystem';
import { Toolbar, QuickStats } from './Toolbar';
import {
  validateNumber,
  validateText,
  validateMedicosList,
  validateRemarcacao,
  validateDashboardStats,
  sanitizeInput,
  formatName
} from './validationUtils';
import './index.css';
import { useState } from 'react';

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
    return total + unidade.length;
  }, 0);

  // Dados para os gráficos
  const dataAgendamentosPorUnidade = Object.keys(agenda).map(unidade => ({
    name: unidade.charAt(0).toUpperCase() + unidade.slice(1),
    Agendamentos: agenda[unidade].length
  }));

  const dataExamesPorTipo = Object.keys(exames).map(tipo => ({
    name: tipo.charAt(0).toUpperCase() + tipo.slice(1),
    Exames: exames[tipo].length
  }));

  const dataRemarcacoesPorMedico = remarcacoes.reduce((acc, remarcacao) => {
    acc[remarcacao.medico] = (acc[remarcacao.medico] || 0) + 1;
    return acc;
  }, {});

  const dataRemarcacoes = Object.keys(dataRemarcacoesPorMedico).map(medico => ({
    name: medico,
    Remarcacoes: dataRemarcacoesPorMedico[medico]
  }));

  // Funções de manipulação de dados
  const handleCellEdit = (rowId, colId, value) => {
    // Lógica para editar células
  };

  const handleAddRow = (table) => {
    // Lógica para adicionar linha
  };

  const handleDeleteRow = (table, rowId) => {
    // Lógica para deletar linha
  };

  const handleAddColumn = (table) => {
    // Lógica para adicionar coluna
  };

  const handleDeleteColumn = (table, colId) => {
    // Lógica para deletar coluna
  };

  const handleSaveStats = () => {
    // Lógica para salvar estatísticas
  };

  const handleExportData = () => {
    // Lógica para exportar dados
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <Toolbar setView={setView} />
      <QuickStats stats={statsValues} />

      {view === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Agendamentos por Unidade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dataAgendamentosPorUnidade}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Agendamentos" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Exames por Tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dataExamesPorTipo}
                    dataKey="Exames"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#82ca9d"
                    label
                  >
                    {dataExamesPorTipo.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Remarcações por Médico</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dataRemarcacoes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="Remarcacoes" stroke="#ffc658" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Outras views (tabelas, configurações, etc.) podem ser adicionadas aqui */}
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


