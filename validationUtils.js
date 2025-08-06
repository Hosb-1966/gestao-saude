// Utilitários para validação de dados

// Validação de números
export function validateNumber(value, min = 0, max = Infinity) {
  const num = parseInt(value);
  if (isNaN(num)) return { isValid: false, error: 'Deve ser um número válido' };
  if (num < min) return { isValid: false, error: `Deve ser maior ou igual a ${min}` };
  if (num > max) return { isValid: false, error: `Deve ser menor ou igual a ${max}` };
  return { isValid: true, value: num };
}

// Validação de texto
export function validateText(value, minLength = 1, maxLength = 100) {
  if (!value || value.trim().length === 0) {
    return { isValid: false, error: 'Campo obrigatório' };
  }
  if (value.length < minLength) {
    return { isValid: false, error: `Deve ter pelo menos ${minLength} caracteres` };
  }
  if (value.length > maxLength) {
    return { isValid: false, error: `Deve ter no máximo ${maxLength} caracteres` };
  }
  return { isValid: true, value: value.trim() };
}

// Validação de data
export function validateDate(value) {
  if (!value) return { isValid: false, error: 'Data é obrigatória' };
  
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return { isValid: false, error: 'Data inválida' };
  }
  
  return { isValid: true, value: date };
}

// Validação de hora
export function validateTime(value) {
  if (!value) return { isValid: false, error: 'Hora é obrigatória' };
  
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(value)) {
    return { isValid: false, error: 'Formato de hora inválido (HH:MM)' };
  }
  
  return { isValid: true, value };
}

// Validação de email
export function validateEmail(value) {
  if (!value) return { isValid: false, error: 'Email é obrigatório' };
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return { isValid: false, error: 'Email inválido' };
  }
  
  return { isValid: true, value: value.toLowerCase() };
}

// Validação de lista de médicos
export function validateMedicosList(value) {
  if (!value || value.trim().length === 0) {
    return { isValid: true, value: [] }; // Lista vazia é válida
  }
  
  const medicos = value.split(',').map(m => m.trim()).filter(m => m.length > 0);
  
  // Verifica se todos os nomes são válidos
  for (const medico of medicos) {
    const validation = validateText(medico, 2, 50);
    if (!validation.isValid) {
      return { isValid: false, error: `Nome inválido: ${medico}` };
    }
  }
  
  return { isValid: true, value: medicos };
}

// Validação de dados de remarcação
export function validateRemarcacao(remarcacao) {
  const errors = {};
  
  // Validar médico (opcional)
  if (remarcacao.medico) {
    const medicoValidation = validateText(remarcacao.medico, 2, 50);
    if (!medicoValidation.isValid) {
      errors.medico = medicoValidation.error;
    }
  }
  
  // Validar data de remarcação
  if (remarcacao.dataRemarcacao) {
    const dataValidation = validateDate(remarcacao.dataRemarcacao);
    if (!dataValidation.isValid) {
      errors.dataRemarcacao = dataValidation.error;
    }
  }
  
  // Validar dias
  if (remarcacao.dias !== null && remarcacao.dias !== undefined && remarcacao.dias !== '') {
    const diasValidation = validateNumber(remarcacao.dias, 0, 365);
    if (!diasValidation.isValid) {
      errors.dias = diasValidation.error;
    }
  }
  
  // Validar quantidade de pacientes
  if (remarcacao.qtPacientes) {
    const qtValidation = validateNumber(remarcacao.qtPacientes, 1, 1000);
    if (!qtValidation.isValid) {
      errors.qtPacientes = qtValidation.error;
    }
  }
  
  // Validar hora do call
  if (remarcacao.horaCall) {
    const horaValidation = validateTime(remarcacao.horaCall);
    if (!horaValidation.isValid) {
      errors.horaCall = horaValidation.error;
    }
  }
  
  // Validar contato
  if (remarcacao.contato) {
    const contatoOptions = ['Email', 'Whatsapp', 'Ligação', 'SMS'];
    if (!contatoOptions.includes(remarcacao.contato)) {
      errors.contato = 'Tipo de contato inválido';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Validação de estatísticas do dashboard
export function validateDashboardStats(stats) {
  const errors = {};
  
  if (stats.totalMedicos !== undefined) {
    const validation = validateNumber(stats.totalMedicos, 0, 10000);
    if (!validation.isValid) {
      errors.totalMedicos = validation.error;
    }
  }
  
  if (stats.agendamentosHoje !== undefined) {
    const validation = validateNumber(stats.agendamentosHoje, 0, 1000);
    if (!validation.isValid) {
      errors.agendamentosHoje = validation.error;
    }
  }
  
  if (stats.unidadesAtivas !== undefined) {
    const validation = validateNumber(stats.unidadesAtivas, 0, 100);
    if (!validation.isValid) {
      errors.unidadesAtivas = validation.error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// Função para sanitizar entrada de texto
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove caracteres potencialmente perigosos
    .substring(0, 1000); // Limita o tamanho
}

// Função para formatar nomes próprios
export function formatName(name) {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Função para formatar data brasileira
export function formatDateBR(date) {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString('pt-BR');
}

// Função para formatar hora
export function formatTime(time) {
  if (!time) return '';
  
  // Se já está no formato HH:MM, retorna como está
  if (/^\d{2}:\d{2}$/.test(time)) return time;
  
  // Tenta converter outros formatos
  const date = new Date(`2000-01-01 ${time}`);
  if (!isNaN(date.getTime())) {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }
  
  return time;
}

