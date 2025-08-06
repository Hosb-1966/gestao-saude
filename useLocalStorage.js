import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  // Função para obter o valor do localStorage
  const getStoredValue = () => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Erro ao ler localStorage para a chave "${key}":`, error);
      return initialValue;
    }
  };

  // Estado inicial
  const [storedValue, setStoredValue] = useState(getStoredValue);

  // Função para atualizar o valor
  const setValue = (value) => {
    try {
      // Permite que value seja uma função como no useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Salva no estado
      setStoredValue(valueToStore);
      
      // Salva no localStorage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Erro ao salvar no localStorage para a chave "${key}":`, error);
    }
  };

  // Escuta mudanças no localStorage de outras abas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error(`Erro ao sincronizar localStorage para a chave "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue];
}

// Hook específico para dados do dashboard
export function useDashboardData() {
  const [statsValues, setStatsValues] = useLocalStorage('dashboard-stats', {
    totalMedicos: 67,
    agendamentosHoje: 15,
    unidadesAtivas: 4
  });

  const [atividadeSemanal, setAtividadeSemanal] = useLocalStorage('dashboard-atividade', [
    { dia: 'SEG', agendamentos: 45 },
    { dia: 'TER', agendamentos: 52 },
    { dia: 'QUA', agendamentos: 38 },
    { dia: 'QUI', agendamentos: 61 },
    { dia: 'SEX', agendamentos: 55 },
    { dia: 'SAB', agendamentos: 28 }
  ]);

  const [titles, setTitles] = useLocalStorage('dashboard-titles', {
    systemTitle: 'Sistema de Gestão de Saúde',
    totalMedicos: 'Total de Médicos',
    agendamentos: 'Agendamentos',
    agendamentosPorUnidade: 'Agendamentos por Unidade',
    distribuicaoPorUnidade: 'Distribuição por Unidade',
    atividadeSemanal: 'Atividade Semanal'
  });

  return {
    statsValues,
    setStatsValues,
    atividadeSemanal,
    setAtividadeSemanal,
    titles,
    setTitles
  };
}

