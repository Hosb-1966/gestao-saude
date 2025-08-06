# Como Atualizar o Repositório GitHub

## Método 1: Interface Web (Mais Simples)

1. **Acesse seu repositório**: Vá para https://github.com/Hosb-1966/dashboard-saude
2. **Delete arquivos antigos**: Clique em cada arquivo que você quer remover e clique no ícone da lixeira
3. **Upload do novo arquivo**: 
   - Clique em "Add file" → "Upload files"
   - Arraste o arquivo `dashboard-saude-corrigido.zip` ou clique para selecionar
   - Descompacte localmente e faça upload dos arquivos individuais
4. **Commit**: Adicione uma mensagem como "Correção para deploy no Netlify" e clique em "Commit changes"

## Método 2: Git (Linha de Comando)

```bash
# Clone o repositório
git clone https://github.com/Hosb-1966/dashboard-saude.git
cd dashboard-saude

# Remova todos os arquivos antigos (exceto .git)
rm -rf * .*
# (mantenha apenas a pasta .git)

# Descompacte o arquivo corrigido
unzip ../dashboard-saude-corrigido.zip
mv dashboard-saude/* .
rmdir dashboard-saude

# Adicione os novos arquivos
git add .
git commit -m "Correção para deploy no Netlify"
git push origin main
```

## Arquivos Importantes Incluídos

- `netlify.toml` - Configuração de build para o Netlify
- `vite.config.js` - Configuração do Vite
- `src/` - Código fonte corrigido
- `package.json` - Dependências do projeto

Após fazer o upload, o Netlify detectará automaticamente as mudanças e iniciará um novo build.

