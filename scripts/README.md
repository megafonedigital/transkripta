# Scripts de Configuração

## generate-env-config.js

Este script gera automaticamente os arquivos `env-config.js` a partir das variáveis definidas no arquivo `.env`.

### Como usar

#### Via npm script (recomendado)
```bash
npm run generate-config
```

#### Diretamente
```bash
node scripts/generate-env-config.js
```

### O que faz

1. Lê todas as variáveis do arquivo `.env`
2. Gera o arquivo `public/env-config.js` com as configurações
3. Gera o arquivo `build/env-config.js` (se o diretório build existir)
4. As configurações ficam disponíveis globalmente via `window._env_`

### Integração automática

- O script é executado automaticamente antes do build (`prebuild`)
- O script de build PowerShell também executa a geração automaticamente

### Variáveis suportadas

Todas as variáveis do `.env` são incluídas, com valores padrão para:

- `REPLICATE_API_TOKEN`
- `REPLICATE_WEBHOOK_SECRET`
- `REPLICATE_WEBHOOK_URL`
- `REACT_APP_TRANSCRIPTION_WEBHOOK_URL`
- `REACT_APP_TRANSCRIPTION_WEBHOOK_SECRET`
- `REACT_APP_TRANSCRIPTION_WEBHOOK_TIMEOUT`
- `REACT_APP_SOCIAL_WEBHOOK_URL`
- `REACT_APP_SOCIAL_WEBHOOK_SECRET`
- `REACT_APP_SOCIAL_WEBHOOK_TIMEOUT`
- E todas as outras variáveis de configuração da aplicação

### Exemplo de uso no código

```javascript
// Acessar configurações no frontend
const socialWebhookUrl = window._env_.REACT_APP_SOCIAL_WEBHOOK_URL;
const replicateToken = window._env_.REPLICATE_API_TOKEN;
```

### Vantagens

- ✅ Configuração dinâmica baseada no `.env`
- ✅ Não precisa recompilar para mudar configurações
- ✅ Funciona em produção e desenvolvimento
- ✅ Integração automática com o processo de build
- ✅ Valores padrão para desenvolvimento