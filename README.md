# Transkipta - Transcrição Simplificada

Aplicação de transcrição de vídeos e áudios que utiliza webhook para processamento de URLs e OpenAI para transcrição.

## 🚀 Características

- **Processamento via Webhook**: URLs processadas através de webhook configurável
- **Download Direto**: Suporte para YouTube, Instagram, TikTok via webhook
- **Transcrição de Áudio**: Integração com OpenAI Whisper API
- **Armazenamento Local**: Dados salvos no localStorage do navegador
- **Autenticação Local**: Sistema de usuários baseado em localStorage
- **Métricas e Histórico**: Acompanhamento de uso e histórico de transcrições

## 🛠️ Tecnologias

- React 18
- Material-UI
- TailwindCSS
- Chart.js
- Axios
- Docker + Nginx

## 📋 Pré-requisitos

### APIs e Serviços Necessários

1. **OpenAI API** - Para transcrição de áudio
   - Obtenha sua chave em: https://platform.openai.com/api-keys

2. **Webhook de Processamento** - Para download de vídeos
   - Configure seu próprio webhook que processa URLs de vídeo
   - O webhook deve retornar URLs diretas para download de áudio/vídeo
   - Formato de resposta esperado: `{ success: true, videoUrl: string, audioUrl: string, title?: string }`

## ⚙️ Configuração

### Implementação do Webhook

O webhook deve ser um endpoint HTTP que:

1. **Recebe** uma requisição POST com:
   ```json
   {
     "url": "https://youtube.com/watch?v=...",
     "format": "mp4",
     "quality": "720p",
     "audioOnly": false,
     "timestamp": 1234567890
   }
   ```

2. **Retorna** uma resposta JSON:
   ```json
   {
     "success": true,
     "videoUrl": "https://direct-download-url.com/video.mp4",
     "audioUrl": "https://direct-download-url.com/audio.mp3",
     "title": "Título do Vídeo",
     "duration": 180,
     "thumbnail": "https://thumbnail-url.com/thumb.jpg"
   }
   ```

3. **Autentica** usando o header `X-Webhook-Secret`

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# APIs Externas
REACT_APP_OPENAI_API_KEY=sua_chave_openai

# Webhook Configuration
REACT_APP_WEBHOOK_URL=https://seu-webhook.com/api/process
REACT_APP_WEBHOOK_SECRET=sua_chave_secreta_webhook
REACT_APP_WEBHOOK_TIMEOUT=60000

# Configurações da Aplicação
REACT_APP_APP_NAME=Transkipta
REACT_APP_APP_VERSION=2.0.0
REACT_APP_MAX_FILE_SIZE=100
REACT_APP_SUPPORTED_FORMATS=mp4,mp3,wav,m4a,webm

# Autenticação Local
REACT_APP_JWT_SECRET=seu_jwt_secret_muito_seguro
REACT_APP_SESSION_TIMEOUT=3600

# Credenciais dos Usuários Padrão
REACT_APP_ADMIN_USERNAME=admin
REACT_APP_ADMIN_EMAIL=admin@transkipta.com
REACT_APP_ADMIN_PASSWORD=sua_senha_admin
REACT_APP_USER_USERNAME=user
REACT_APP_USER_EMAIL=user@transkipta.com
REACT_APP_USER_PASSWORD=sua_senha_user

# Easypanel (Produção)
REACT_APP_ENVIRONMENT=production
REACT_APP_API_TIMEOUT=30000
```

### Para Easypanel

No Easypanel, configure as seguintes variáveis de ambiente:

```
OPENAI_API_KEY=sua_chave_openai
WEBHOOK_URL=https://seu-webhook.com/api/process
WEBHOOK_SECRET=sua_chave_secreta_webhook
WEBHOOK_TIMEOUT=60000
APP_NAME=Transkipta
APP_VERSION=2.0.0
MAX_FILE_SIZE=100
SUPPORTED_FORMATS=mp4,mp3,wav,m4a,webm
JWT_SECRET=seu_jwt_secret_muito_seguro
SESSION_TIMEOUT=3600
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@transkipta.com
ADMIN_PASSWORD=sua_senha_admin
USER_USERNAME=user
USER_EMAIL=user@transkipta.com
USER_PASSWORD=sua_senha_user
ENVIRONMENT=production
API_TIMEOUT=30000
```

## 🚀 Instalação e Execução

### Desenvolvimento Local

```bash
# Clone o repositório```bash
git clone <url-do-repositorio>
cd transkipta

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas chaves de API

# Execute em modo de desenvolvimento
npm start
```

### Produção com Docker

```bash
# Build da imagem
docker build -t transkipta-frontend .

# Execute o container
docker run -p 80:80 \
  -e OPENAI_API_KEY=sua_chave \
  -e WEBHOOK_URL=https://seu-webhook.com/api/process \
  -e WEBHOOK_SECRET=sua_chave_secreta \
  transkipta-frontend
```

### Implantação no Easypanel

1. **Crie um novo serviço** no Easypanel
2. **Configure o repositório** Git
3. **Defina as variáveis de ambiente** listadas acima
4. **Configure o Dockerfile** na raiz do projeto
5. **Defina a porta** como 80
6. **Deploy** da aplicação

## 📁 Estrutura do Projeto

```

├── public/
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── History.js
│   │   ├── Metrics.js
│   │   ├── NewTranscription.js
│   │   └── ...
│   ├── contexts/
│   │   ├── AuthContext.js
│   │   └── ThemeContext.js
│   ├── services/
│   │   ├── apiService.js      # APIs externas
│   │   ├── authService.js     # Autenticação local
│   │   └── storageService.js  # Armazenamento local
│   ├── App.js
│   └── index.js
├── Dockerfile
├── nginx.conf
├── package.json
└── README.md
```

## 🔧 Funcionalidades

### Processamento de Vídeos
- YouTube, Instagram, TikTok via webhook
- URLs processadas externamente
- Download direto de áudio/vídeo
- Suporte a múltiplos formatos

### Transcrição
- OpenAI Whisper API
- Múltiplos idiomas
- Formatos de saída: texto, SRT, VTT

### Armazenamento
- Histórico de transcrições
- Métricas de uso
- Configurações do usuário
- Exportação/importação de dados

### Autenticação
- Sistema local baseado em JWT
- Gerenciamento de usuários
- Controle de sessão

## 🔒 Segurança

- Chaves de API armazenadas como variáveis de ambiente
- Headers de segurança configurados no Nginx
- Validação de entrada nos formulários
- Sanitização de dados

## 📊 Monitoramento

- Métricas de uso em tempo real
- Logs de erro e atividade
- Histórico de transcrições
- Estatísticas de performance

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de API Key**
   - Verifique se as chaves estão corretas
   - Confirme se as APIs estão ativas

2. **Falha no Processamento**
   - Verifique a URL do vídeo
   - Confirme se o webhook está funcionando
   - Teste a conectividade com o webhook

3. **Erro de Transcrição**
   - Verifique o formato do áudio
   - Confirme o tamanho do arquivo

## 📝 Licença

Este projeto está sob a licença MIT.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para suporte, abra uma issue no repositório ou entre em contato.# transkripta