import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Download, 
  Upload, 
  Search, 
  Filter, 
  RefreshCw, 
  Save, 
  FileText,
  Database,
  Settings,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from './NotificationSystem';
import {
  exportConsultas,
  exportExames,
  exportRemarcacoes,
  exportDashboard,
  exportRelatorioCompleto
} from '../utils/exportUtils';

export function Toolbar({ 
  currentView, 
  searchTerm, 
  onSearchChange, 
  onRefresh,
  data,
  onImport 
}) {
  const { success, error, info } = useNotifications();
  const [isExporting, setIsExporting] = useState(false);
  
  const handleExport = async (type) => {
    setIsExporting(true);
    try {
      let count = 0;
      
      switch (type) {
        case 'consultas':
          count = exportConsultas(data.agenda, data.unidades);
          success(`${count} registros de consultas exportados com sucesso!`);
          break;
          
        case 'exames':
          count = exportExames(data.exames, data.unidades);
          success(`${count} registros de exames exportados com sucesso!`);
          break;
          
        case 'remarcacoes':
          count = exportRemarcacoes(data.remarcacoes);
          success(`${count} registros de remarcações exportados com sucesso!`);
          break;
          
        case 'dashboard':
          exportDashboard(data.statsValues, data.atividadeSemanal, data.agendamentosPorUnidade);
          success('Dados do dashboard exportados com sucesso!');
          break;
          
        case 'completo':
          exportRelatorioCompleto(data);
          success('Relatório completo exportado com sucesso!');
          break;
          
        default:
          error('Tipo de exportação não reconhecido');
      }
    } catch (err) {
      error('Erro ao exportar dados', err.message);
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleSaveData = () => {
    try {
      // Força salvamento no localStorage
      localStorage.setItem('dashboard-backup', JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      }));
      success('Dados salvos com sucesso!');
    } catch (err) {
      error('Erro ao salvar dados', err.message);
    }
  };
  
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
      info('Dados atualizados');
    }
  };
  
  const getExportOptions = () => {
    const options = [
      { key: 'dashboard', label: 'Dashboard (JSON)', icon: <Database className="h-4 w-4" /> },
      { key: 'completo', label: 'Relatório Completo (JSON)', icon: <FileText className="h-4 w-4" /> }
    ];
    
    if (currentView === 'consultas') {
      options.unshift({ key: 'consultas', label: 'Consultas (CSV)', icon: <Download className="h-4 w-4" /> });
    } else if (currentView === 'exames') {
      options.unshift({ key: 'exames', label: 'Exames (CSV)', icon: <Download className="h-4 w-4" /> });
    } else if (currentView === 'remarcacoes') {
      options.unshift({ key: 'remarcacoes', label: 'Remarcações (CSV)', icon: <Download className="h-4 w-4" /> });
    }
    
    return options;
  };
  
  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
        
        {/* Filtros */}
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Salvar */}
        <Button variant="outline" size="sm" onClick={handleSaveData}>
          <Save className="h-4 w-4 mr-2" />
          Salvar
        </Button>
        
        {/* Atualizar */}
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
        
        {/* Exportar */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={isExporting}>
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exportando...' : 'Exportar'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {getExportOptions().map((option) => (
              <DropdownMenuItem
                key={option.key}
                onClick={() => handleExport(option.key)}
                className="flex items-center gap-2"
              >
                {option.icon}
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Importar */}
        <Button variant="outline" size="sm" onClick={onImport}>
          <Upload className="h-4 w-4 mr-2" />
          Importar
        </Button>
        
        {/* Mais opções */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <FileText className="h-4 w-4 mr-2" />
              Ajuda
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Componente de estatísticas rápidas para a toolbar
export function QuickStats({ stats }) {
  return (
    <div className="flex items-center gap-6 px-4 py-2 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="font-medium">Total de Médicos:</span>
        <span className="font-semibold text-blue-600">{stats.totalMedicos}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="font-medium">Agendamentos Hoje:</span>
        <span className="font-semibold text-green-600">{stats.agendamentosHoje}</span>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span className="font-medium">Unidades Ativas:</span>
        <span className="font-semibold text-purple-600">{stats.unidadesAtivas}</span>
      </div>
    </div>
  );
}

