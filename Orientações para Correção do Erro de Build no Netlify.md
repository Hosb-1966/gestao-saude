# Orientações para Correção do Erro de Build no Netlify

## Análise do Problema

O erro que você está enfrentando no Netlify indica que a plataforma não conseguiu detectar automaticamente o framework do seu projeto. A mensagem "Detected 0 framework(s)" confirma que o Netlify não identificou que se trata de um projeto React com Vite.

Analisando seu `package.json`, identifiquei que você tem um projeto React configurado com Vite como bundler, usando várias dependências modernas como Tailwind CSS, Radix UI, e outras bibliotecas. O projeto está configurado corretamente para desenvolvimento local, mas precisa de algumas configurações específicas para o deploy no Netlify.

## Soluções para Correção

### Solução 1: Configuração via Interface do Netlify (Mais Simples)

Acesse as configurações de build do seu site no Netlify e configure manualmente:

**Build Settings:**
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `22.x` (ou superior)

**Passos detalhados:**
1. Acesse o dashboard do Netlify
2. Clique no seu site "dashboard-saude"
3. Vá em "Site settings" → "Build & deploy"
4. Na seção "Build settings", clique em "Edit settings"
5. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Em "Environment variables", adicione:
   - `NODE_VERSION` = `22.18.0`

### Solução 2: Arquivo netlify.toml (Recomendada)

Crie um arquivo `netlify.toml` na raiz do seu repositório com o seguinte conteúdo:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22.18.0"
  NPM_FLAGS = "--legacy-peer-deps"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Solução 3: Verificação do package.json

Certifique-se de que seu `package.json` tenha os scripts corretos (que já estão presentes):

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## Configurações Adicionais Importantes

### 1. Arquivo vite.config.js

Verifique se você tem um arquivo `vite.config.js` na raiz do projeto. Se não tiver, crie um com:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
```

### 2. Arquivo index.html

Certifique-se de que existe um arquivo `index.html` na raiz do projeto que referencia o arquivo principal do React (geralmente `src/main.jsx`).

### 3. Estrutura de Pastas Esperada

```
dashboard-saude/
├── public/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   └── ...
├── index.html
├── package.json
├── vite.config.js
└── netlify.toml (novo arquivo)
```

## Passos para Implementar a Correção

### Passo 1: Adicionar netlify.toml
1. No seu repositório GitHub, crie um novo arquivo chamado `netlify.toml` na raiz
2. Copie o conteúdo fornecido na Solução 2

### Passo 2: Verificar vite.config.js
1. Verifique se o arquivo existe na raiz do projeto
2. Se não existir, crie conforme o exemplo fornecido

### Passo 3: Fazer novo deploy
1. Faça commit das alterações no GitHub
2. O Netlify detectará automaticamente as mudanças e iniciará um novo build

### Passo 4: Monitorar o build
1. Acesse o dashboard do Netlify
2. Vá em "Deploys" para acompanhar o progresso
3. Verifique se o build é concluído com sucesso

## Possíveis Problemas Adicionais

### Problema com Dependências
Se ainda houver erros relacionados a dependências, adicione ao `netlify.toml`:

```toml
[build.environment]
  NODE_VERSION = "22.18.0"
  NPM_FLAGS = "--legacy-peer-deps"
  CI = "false"
```

### Problema com Tailwind CSS
Se houver erros relacionados ao Tailwind, certifique-se de que existe um arquivo `tailwind.config.js` configurado corretamente.

### Problema com Rotas (SPA)
O redirect configurado no `netlify.toml` (`from = "/*"` to = `/index.html`) garante que todas as rotas sejam direcionadas para o `index.html`, essencial para aplicações React com roteamento.

## Verificação Final

Após implementar as correções:

1. **Build local**: Execute `npm run build` localmente para verificar se gera a pasta `dist`
2. **Teste local**: Execute `npm run preview` para testar a versão de produção
3. **Deploy**: Faça push para o GitHub e monitore o build no Netlify

## Resumo das Ações Necessárias

1. ✅ **Criar arquivo `netlify.toml`** na raiz do repositório
2. ✅ **Verificar/criar `vite.config.js`** se necessário
3. ✅ **Fazer commit e push** das alterações
4. ✅ **Monitorar novo build** no Netlify

Essas configurações devem resolver o problema de detecção de framework e permitir que o Netlify construa seu projeto React corretamente.

