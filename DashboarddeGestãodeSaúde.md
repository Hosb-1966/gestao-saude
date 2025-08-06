# Dashboard de Gestão de Saúde

Um sistema completo de gestão para unidades de saúde, desenvolvido em React com funcionalidades avançadas de edição, persistência e exportação de dados.

## 🚀 Funcionalidades

### Dashboard Principal
- **Métricas em Tempo Real**: Total de médicos, agendamentos, unidades ativas
- **Gráficos Interativos**: Barras, pizza e linha para visualização de dados
- **Edição Inline**: Todos os valores podem ser editados diretamente na interface
- **Persistência Automática**: Dados salvos automaticamente no localStorage

### Gestão de Consultas
- **Agenda Editável**: Organização por unidade, dia e funcionário
- **Filtro por Unidade**: Visualização específica por local de atendimento
- **Adição/Edição de Médicos**: Interface intuitiva para gerenciar escalas

### Gestão de Exames
- **Cronograma de Exames**: Organizado por tipo e funcionário responsável
- **Múltiplos Tipos**: ANGIO/RET/EST, OCT/YAG, CAMPO, FOTO, etc.
- **Visualização por Unidade**: Sistema unificado de filtros

### Sistema de Remarcações
- **Controle Completo**: Médico, data, quantidade de pacientes, contato
- **Edição Inline**: Modificação direta de qualquer campo
- **Validação de Dados**: Prevenção de erros de entrada

### Funcionalidades Avançadas
- **Sistema de Notificações**: Feedback visual para todas as ações
- **Exportação de Dados**: CSV para tabelas, JSON para relatórios
- **Validação Robusta**: Verificação de tipos e formatos de dados
- **Interface Responsiva**: Adaptável para desktop e mobile

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19.1.0 + Vite 6.3.5
- **UI Framework**: Tailwind CSS 4.1.7 + Radix UI
- **Gráficos**: Recharts 2.15.3
- **Ícones**: Lucide React 0.510.0
- **Validação**: Zod 3.24.4
- **Gerenciamento de Estado**: React Hooks + localStorage

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- pnpm (recomendado) ou npm

### Passos de Instalação

1. **Clone ou extraia o projeto**
```bash
# Se usando git
git clone <repository-url>
cd dashboard-saude

# Ou extraia o arquivo ZIP fornecido
```

2. **Instale as dependências**
```bash
pnpm install
# ou
npm install
```

3. **Execute em modo de desenvolvimento**
```bash
pnpm dev
# ou
npm run dev
```

4. **Acesse a aplicação**
```
http://localhost:5173
```

### Build para Produção

```bash
pnpm build
# ou
npm run build
```

Os arquivos de produção serão gerados na pasta `dist/`.

## 🎯 Como Usar

### Dashboard Principal
1. Visualize as métricas principais no topo da página
2. Clique nos ícones de edição para modificar valores
3. Use os campos de atividade semanal para ajustar dados
4. Observe os gráficos atualizarem em tempo real

### Gestão de Consultas
1. Clique na aba "Consultas"
2. Selecione a unidade desejada
3. Clique em qualquer célula para editar
4. Digite os nomes dos médicos separados por vírgula
5. Pressione Enter ou clique em Salvar

### Exportação de Dados
1. Use o botão "Exportar" na toolbar
2. Escolha o formato desejado (CSV ou JSON)
3. O arquivo será baixado automaticamente
4. Verifique as notificações para confirmação

### Persistência de Dados
- Todos os dados são salvos automaticamente
- Use o botão "Salvar" para forçar backup
- Dados persistem entre sessões do navegador
- Sincronização automática entre abas

## 📁 Estrutura do Projeto

```
dashboard-saude/
├── public/                     # Arquivos públicos
├── src/
│   ├── components/
│   │   ├── ui/                # Componentes UI (Radix)
│   │   ├── NotificationSystem.jsx
│   │   └── Toolbar.jsx
│   ├── data/
│   │   └── initialData.js     # Dados iniciais
│   ├── hooks/
│   │   └── useLocalStorage.js # Hooks personalizados
│   ├── utils/
│   │   ├── exportUtils.js     # Utilitários de exportação
│   │   └── validationUtils.js # Utilitários de validação
│   ├── App.jsx               # Componente principal
│   ├── main.jsx              # Ponto de entrada
│   └── index.css             # Estilos globais
├── dist/                     # Build de produção
├── package.json              # Dependências
└── README.md                 # Este arquivo
```

## 🔧 Configuração

### Dados Iniciais
Os dados iniciais estão em `src/data/initialData.js`. Você pode modificar:
- Lista de funcionários
- Unidades de saúde
- Dias da semana
- Agenda inicial
- Tipos de exames

### Personalização de Cores
As cores das unidades podem ser alteradas em `src/data/initialData.js`:
```javascript
export const unidades = [
  { id: 'fonseca', nome: 'Fonseca', cor: '#94a3b8' },
  // ...
];
```

### Validações
Customize as validações em `src/utils/validationUtils.js` conforme suas necessidades.

## 📊 Funcionalidades de Exportação

### Formatos Suportados
- **CSV**: Consultas, Exames, Remarcações
- **JSON**: Dashboard, Relatório Completo

### Estrutura dos Arquivos Exportados

#### CSV de Consultas
```csv
unidade,dia,funcionario,medico,data_exportacao
Fonseca,SEG,Marcel,Carolina,31/07/2025
```

#### JSON do Dashboard
```json
{
  "estatisticas": { "totalMedicos": 67, ... },
  "atividade_semanal": [...],
  "data_exportacao": "2025-07-31T...",
  "versao": "1.0"
}
```

## 🔒 Validações Implementadas

- **Números**: Validação de range e tipo
- **Texto**: Comprimento mínimo/máximo
- **Datas**: Formato e validade
- **Emails**: Formato RFC compliant
- **Listas de Médicos**: Nomes válidos separados por vírgula
- **Sanitização**: Limpeza de caracteres perigosos

## 🎨 Sistema de Notificações

### Tipos de Notificação
- **Success** (Verde): Operações bem-sucedidas
- **Error** (Vermelho): Erros e falhas
- **Warning** (Amarelo): Avisos importantes
- **Info** (Azul): Informações gerais

### Configuração
- **Duração padrão**: 5 segundos
- **Auto-dismiss**: Sim (configurável)
- **Múltiplas notificações**: Suportado
- **Posição**: Canto superior direito

## 🚀 Melhorias Implementadas

### Versão Original vs. Melhorada

| Funcionalidade | Original | Melhorada |
|---|---|---|
| Persistência | ❌ | ✅ localStorage |
| Validação | ❌ | ✅ Completa |
| Notificações | ❌ | ✅ Sistema completo |
| Exportação | ❌ | ✅ CSV/JSON |
| Toolbar | ❌ | ✅ Funcional |
| Feedback Visual | Básico | ✅ Avançado |

## 🐛 Solução de Problemas

### Dados não são salvos
- Verifique se o localStorage está habilitado
- Limpe o cache do navegador
- Use o botão "Salvar" para forçar backup

### Gráficos não aparecem
- Verifique se há dados válidos
- Recarregue a página
- Verifique o console para erros

### Exportação não funciona
- Verifique se há dados para exportar
- Permita downloads no navegador
- Verifique as notificações para erros

## 📝 Licença

Este projeto é proprietário e destinado ao uso interno da organização de saúde.

## 👥 Suporte

Para suporte técnico ou dúvidas sobre o sistema, entre em contato com a equipe de desenvolvimento.

---

**Versão**: 2.0.0  
**Última atualização**: 31/07/2025  
**Desenvolvido com**: ❤️ e React

