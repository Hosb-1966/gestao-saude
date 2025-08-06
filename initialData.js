// Dados iniciais baseados na tabela fornecida
export const funcionarios = [
  'Marcel', 'Dayana', 'Flavia', 'Aline', 'Kelly', 'Elaine', 
  'Evelyn', 'Luciana', 'Elizane', 'Elaine F', 'Fabiana', 
  'Ursula', 'Marcelly', 'Thais', 'Jean', 'Rodrigo'
];

export const unidades = [
  { id: 'fonseca', nome: 'Fonseca', cor: '#94a3b8', medicos: 15 },
  { id: 'centro', nome: 'Centro', cor: '#10b981', medicos: 22 },
  { id: 'sg', nome: 'SG', cor: '#3b82f6', medicos: 18 },
  { id: 'icarai', nome: 'Icaraí', cor: '#f59e0b', medicos: 12 }
];

export const diasSemana = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SABADO'];

// Dados iniciais da agenda baseados na imagem fornecida
export const agendaInicial = {
  fonseca: {
    SEG: {
      'Marcel': ['Carolina'],
      'Dayana': ['Bruno N'],
      'Flavia': ['Fabricio'],
      'Elaine': ['Leonardo'],
      'Evelyn': ['Enio'],
      'Elizane': ['Danielle'],
      'Elaine F': ['Mateus'],
      'Fabiana': ['Hugo'],
      'Marcelly': ['Cynthya'],
      'Rodrigo': ['Thiago']
    },
    TER: {
      'Marcel': ['Leonardo'],
      'Flavia': ['Fabricio'],
      'Aline': ['Jose'],
      'Elaine': ['Enio'],
      'Evelyn': ['Armando'],
      'Elizane': ['Pantaleao'],
      'Elaine F': ['Ed Rangel'],
      'Fabiana': ['Magda'],
      'Ursula': ['Danielle'],
      'Marcelly': ['Elizabeth'],
      'Rodrigo': ['Fabricio C']
    },
    QUA: {
      'Marcel': ['Carolina'],
      'Dayana': ['Fabricio'],
      'Flavia': ['Danielle'],
      'Aline': ['Tatiana B'],
      'Kelly': ['Bernardo'],
      'Elaine': ['Mateus'],
      'Evelyn': ['João'],
      'Luciana': ['Ricardo'],
      'Elizane': ['Elizabeth'],
      'Elaine F': ['Fabricio C'],
      'Fabiana': ['Fernanda'],
      'Ursula': ['Ana Paula'],
      'Marcelly': ['Leonardo'],
      'Thais': ['Magda'],
      'Rodrigo': ['Ed Rangel']
    },
    QUI: {
      'Marcel': ['Elizabeth'],
      'Dayana': ['Ana Paula'],
      'Flavia': ['Caio'],
      'Elaine': ['Fabricio'],
      'Evelyn': ['Luciana'],
      'Luciana': ['Enio'],
      'Elizane': ['Daniel'],
      'Elaine F': ['Magda'],
      'Fabiana': ['Mateus'],
      'Ursula': ['Cynthya'],
      'Marcelly': ['Fabricio C'],
      'Thais': ['Carolina'],
      'Rodrigo': ['Ricardo']
    },
    SEX: {
      'Marcel': ['Mariana'],
      'Dayana': ['Elizabeth'],
      'Flavia': ['Fabricio'],
      'Aline': ['Enio'],
      'Kelly': ['Thiago'],
      'Elaine': ['Armando'],
      'Evelyn': ['Ed. Rangel'],
      'Elizane': ['Carolina'],
      'Elaine F': ['Bernardo'],
      'Fabiana': ['Pantaleão'],
      'Ursula': ['Leonardo'],
      'Marcelly': ['Fabricio C'],
      'Rodrigo': ['Danielle']
    },
    SABADO: {
      'Marcel': ['Bruno N'],
      'Dayana': ['Mahiana']
    }
  },
  centro: {
    SEG: {
      'Marcel': ['Luciana'],
      'Aline': ['Mahiana'],
      'Kelly': ['Ed Rangel'],
      'Luciana': ['Caio'],
      'Rodrigo': ['Arthur']
    },
    TER: {
      'Marcel': ['Tulio'],
      'Flavia': ['Daniel'],
      'Fabiana': ['Ed Rangel'],
      'Thais': ['Saymon'],
      'Jean': ['Alice']
    },
    QUA: {
      'Elaine': ['Mariana'],
      'Luciana': ['Mahiana']
    },
    QUI: {
      'Marcel': ['Bruno N'],
      'Kelly': ['Ed Rangel'],
      'Evelyn': ['Blanco'],
      'Ursula': ['Fernanda']
    },
    SEX: {
      'Flavia': ['Ed Rangel'],
      'Fabiana': ['Arthur'],
      'Ursula': ['Fernanda'],
      'Thais': ['Ricardo']
    }
  },
  sg: {
    SEG: {
      'Marcel': ['João'],
      'Dayana': ['Lucas'],
      'Aline': ['Thiago'],
      'Thais': ['Mahiana']
    },
    TER: {
      'Flavia': ['Tulio'],
      'Evelyn': ['Mahiana'],
      'Luciana': ['Joao'],
      'Ursula': ['Arthur'],
      'Rodrigo': ['Caio']
    },
    QUA: {
      'Elaine': ['Lucas'],
      'Fabiana': ['Arthur'],
      'Ursula': ['Hugo']
    },
    QUI: {
      'Flavia': ['Leonardo'],
      'Evelyn': ['Danielle'],
      'Ursula': ['Hugo'],
      'Marcelly': ['Helena']
    },
    SEX: {
      'Elaine': ['Thiago'],
      'Ursula': ['Livia'],
      'Thais': ['Saymon'],
      'Jean': ['Tulio'],
      'Rodrigo': ['Joao']
    },
    SABADO: {
      'Flavia': ['Caio']
    }
  },
  icarai: {
    SEG: {
      'Kelly': ['Ed Rangel'],
      'Evelyn': ['Helena'],
      'Ursula': ['Cynthia'],
      'Marcelly': ['Saymon']
    },
    TER: {
      'Elaine': ['Bruno N'],
      'Rodrigo': ['Hugo']
    },
    QUA: {
      'Elaine': ['Helena'],
      'Ursula': ['Bruno N']
    },
    QUI: {
      'Flavia': ['Mariana'],
      'Evelyn': ['Mahiana']
    },
    SEX: {
      'Fabiana': ['Hugo'],
      'Ursula': ['Danielle'],
      'Marcelly': ['Mahiana']
    }
  }
};

export const funcionariosExames = [
  'Marcia Cristina', 'Marcia Miranda', 'Isis', 'Yasmin'
];

export const examesInicial = {
  fonseca: {
    SEG: {
      'Marcia Cristina': ['ANGIO/RET/EST', 'OCT/YAG'],
      'Marcia Miranda': ['CAMPO'],
      'Isis': ['FOTO', 'TOP/BIO/PENTAC'],
      'Yasmin': ['GONIO', 'MAPA/MICRO', 'ULTRA/PAM/PAQUI']
    },
    TER: {
      'Marcia Cristina': ['GONIO', 'MAPA/MICRO', 'ULTRA/PAM/PAQUI'],
      'Marcia Miranda': ['ANGIO/RET/EST', 'YAG/TRABECULO', 'TOP/BIO/PENTAC'],
      'Isis': ['CAMPO', 'LC', 'BIO POR IMERSÃO'],
      'Yasmin': ['ORTOPTICA', 'OCT']
    },
    QUA: {
      'Marcia Cristina': ['CAMPO', 'BIO POR IMERSÃO', 'YAG'],
      'Marcia Miranda': ['ULTRA/PAM/PAQUI', 'OCT'],
      'Isis': ['ANGIO/RET/EST', 'TOP/BIO/PENTAC'],
      'Yasmin': ['MAPA/MICRO', 'LC']
    },
    QUI: {
      'Marcia Cristina': ['LC', 'GONIO', 'ERG+PEV'],
      'Marcia Miranda': ['MAPA/MICRO', 'CAMPO', 'TOP/BIO/PENTAC'],
      'Isis': ['ULTRA/PAM/PAQUI', 'BIO POR IMERSÃO'],
      'Yasmin': ['ANGIO/RET/EST', 'OCT/ TRABECULO']
    },
    SEX: {
      'Marcia Cristina': ['ANGIO/RET/EST', 'CAMPO', 'LC'],
      'Marcia Miranda': ['ULTRA/PAM/PAQUI', 'FOTO'],
      'Isis': ['OCT', 'GONIO', 'YAG'],
      'Yasmin': ['MAPA/MICRO', 'TOP/BIO/PENTAC']
    }
  },
  centro: {
    SEG: {
      'Marcia Cristina': ['Exames']
    },
    TER: {
      'Isis': ['Exames']
    },
    QUA: {
      'Yasmin': ['Exames']
    },
    QUI: {
      'Isis': ['Exames']
    },
    SEX: {
      'Marcia Cristina': ['Exames']
    }
  },
  icarai: {
    SEG: {
      'Marcia Miranda': ['Exames']
    },
    TER: {
      'Marcia Miranda': ['Exames']
    },
    QUA: {
      'Marcia Cristina': ['Exames']
    },
    QUI: {
      'Marcia Cristina': ['Exames']
    },
    SEX: {
      'Marcia Miranda': ['Exames']
    },
    SABADO: {
      'Marcia Miranda': ['Exames']
    }
  },
  sg: {
    SEG: {
      'Yasmin': ['Exames']
    },
    TER: {
      'Marcia Cristina': ['Exames']
    },
    QUA: {
      'Marcia Miranda': ['Exames']
    },
    QUI: {
      'Yasmin': ['Exames']
    },
    SEX: {
      'Isis': ['Exames']
    },
    SABADO: {
      'Yasmin': ['Exames']
    }
  }
};

export const remarcacoesInicial = [
  { medico: 'Fabricio', dataRemarcacao: '10/07/2025', dias: 2, qtPacientes: 10, horaCall: '00:30', contato: 'Email', data: '10/07/2025', prazo: 'Fora' },
  { medico: 'Carolina', dataRemarcacao: '11/07/2025', dias: 3, qtPacientes: 10, horaCall: '01:30', contato: 'Whatsapp', data: '11/07/2025', prazo: 'Dentro' },
  { medico: 'Hugo', dataRemarcacao: '12/07/2025', dias: 4, qtPacientes: 10, horaCall: '02:20', contato: 'Ligação', data: '12/07/2025', prazo: 'Fora' },
  { medico: '', dataRemarcacao: '13/07/2025', dias: 10, qtPacientes: 10, horaCall: '03:00', contato: 'Ligação', data: '13/07/2025', prazo: 'Dentro' },
  { medico: '', dataRemarcacao: '14/07/2025', dias: null, qtPacientes: 10, horaCall: '04:00', contato: 'Ligação', data: '14/07/2025', prazo: '' },
  { medico: '', dataRemarcacao: '15/07/2025', dias: null, qtPacientes: 10, horaCall: '05:00', contato: 'Whatsapp', data: '15/07/2025', prazo: '' },
  { medico: '', dataRemarcacao: '16/07/2025', dias: null, qtPacientes: 10, horaCall: '06:00', contato: 'Ligação', data: '16/07/2025', prazo: '' },
  { medico: '', dataRemarcacao: '17/07/2025', dias: null, qtPacientes: 10, horaCall: '07:00', contato: 'Ligação', data: '17/07/2025', prazo: '' },
  { medico: '', dataRemarcacao: '18/07/2025', dias: null, qtPacientes: 10, horaCall: '08:00', contato: 'Ligação', data: '18/07/2025', prazo: '' },
  { medico: '', dataRemarcacao: '19/07/2025', dias: null, qtPacientes: 10, horaCall: '09:00', contato: 'Ligação', data: '19/07/2025', prazo: '' }
];

