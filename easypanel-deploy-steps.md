# Deploy no Easypanel - Passo a Passo

## ✅ Status: Aplicação funcionando localmente com `npm start`

Agora vamos fazer o deploy correto no Easypanel:

## Passo 1: Preparar o Repositório

### 1.1 Commit e Push das alterações
```bash
git add .
git commit -m "Fix: Correções para deploy - Dockerfile alternativo e melhorias"
git push origin main
```

## Passo 2: Configurar no Easypanel

### 2.1 Usar o Dockerfile Alternativo
- No Easypanel, vá para as configurações do seu projeto
- Na seção "Build", altere o Dockerfile para: `Dockerfile.alternative`
- Ou renomeie o arquivo atual:
  - `Dockerfile` → `Dockerfile.old`
  - `Dockerfile.alternative` → `Dockerfile`

### 2.2 Configurar Variáveis de Ambiente
No Easypanel, adicione estas variáveis de ambiente:

```env
# API Configuration
REACT_APP_OPENAI_API_KEY=your_credential_openai
REACT_APP_OPENAI_API_URL=https://api.openai.com/v1

# Webhook Configuration
REACT_APP_WEBHOOK_URL=your_webhook_url_here
REACT_APP_WEBHOOK_SECRET=your_webhook_secret_key
REACT_APP_WEBHOOK_TIMEOUT=60000

# Application Configuration
REACT_APP_API_TIMEOUT=30000
REACT_APP_MAX_FILE_SIZE=100000000
REACT_APP_SUPPORTED_FORMATS=mp4,mp3,wav,m4a

# Environment
REACT_APP_ENVIRONMENT=production
NODE_ENV=production

# URLs (ajuste conforme necessário)
REACT_APP_API_URL=https://sua-api-backend.com
REACT_APP_BASE_URL=https://seu-dominio.com
```

## Passo 3: Deploy

### 3.1 Trigger Manual Deploy
- No Easypanel, vá para a aba "Deployments"
- Clique em "Deploy" ou "Redeploy"
- Aguarde o processo de build

### 3.2 Monitorar Logs
- Acompanhe os logs de build em tempo real
- Procure por erros específicos se houver falha

## Passo 4: Verificações Pós-Deploy

### 4.1 Testar a Aplicação
- Acesse a URL do seu domínio
- Verifique se todas as funcionalidades estão funcionando
- Teste login, upload, transcrição, etc.

### 4.2 Verificar Console do Browser
- Abra F12 → Console
- Verifique se não há erros de JavaScript
- Confirme se as APIs estão sendo chamadas corretamente

## Troubleshooting

### Se o build falhar:
1. **Erro de npm install**: Use o Dockerfile.alternative
2. **Erro de variáveis**: Verifique se todas estão configuradas
3. **Erro de memória**: Aumente recursos no Easypanel

### Se a aplicação não carregar:
1. **Página em branco**: Verifique variáveis de ambiente
2. **Erro 404**: Verifique configuração do servidor web
3. **Erro de API**: Verifique REACT_APP_API_URL

## Comandos Úteis para Debug

```bash
# Verificar se o build funciona localmente
npm run build
npx serve -s build

# Testar com as mesmas variáveis de produção
export NODE_ENV=production
npm run build
```

## Próximos Passos
1. ✅ Aplicação funciona localmente
2. 🔄 Fazer commit das alterações
3. 🔄 Configurar Easypanel com Dockerfile.alternative
4. 🔄 Adicionar variáveis de ambiente
5. 🔄 Fazer deploy
6. 🔄 Testar aplicação em produção

---

**Dica**: Se ainda houver problemas, podemos fazer um deploy estático (apenas a pasta `build`) como alternativa temporária.