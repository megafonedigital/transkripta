import webhookService from '../../services/webhookService';
import replicateService from '../../services/replicateService';

/**
 * Endpoint para receber webhooks do Replicate
 * Verifica autenticidade e processa atualizações de transcrição
 */
export default async function handler(req, res) {
  // Apenas aceitar POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Obter headers necessários para verificação
    const webhookId = req.headers['webhook-id'];
    const webhookTimestamp = req.headers['webhook-timestamp'];
    const webhookSignature = req.headers['webhook-signature'];
    
    // Verificar se todos os headers estão presentes
    if (!webhookId || !webhookTimestamp || !webhookSignature) {
      console.warn('Headers de webhook ausentes:', {
        webhookId: !!webhookId,
        webhookTimestamp: !!webhookTimestamp,
        webhookSignature: !!webhookSignature
      });
      return res.status(400).json({ error: 'Headers de webhook ausentes' });
    }

    // Obter o corpo da requisição como string
    const rawBody = JSON.stringify(req.body);
    
    // Verificar autenticidade do webhook
    const isValid = await webhookService.verifyWebhook(
      rawBody,
      webhookId,
      webhookTimestamp,
      webhookSignature
    );
    
    if (!isValid) {
      console.warn('Webhook inválido recebido:', {
        webhookId,
        webhookTimestamp,
        ip: req.ip || req.connection.remoteAddress
      });
      return res.status(401).json({ error: 'Webhook não autorizado' });
    }

    // Processar webhook
    const result = webhookService.processWebhook(req.body);
    
    if (!result.success) {
      console.error('Erro ao processar webhook:', result.error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    // Log do webhook processado
    console.log('Webhook processado com sucesso:', {
      predictionId: result.predictionId,
      status: result.status,
      message: result.message
    });

    // Responder com sucesso
    return res.status(200).json({
      success: true,
      message: 'Webhook processado com sucesso',
      predictionId: result.predictionId,
      status: result.status
    });
    
  } catch (error) {
    console.error('Erro no endpoint de webhook:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

/**
 * Configuração para Next.js - desabilitar parsing automático do body
 * para poder acessar o raw body para verificação HMAC
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

// Para Express.js (caso não seja Next.js)
export const expressHandler = (req, res) => {
  // Middleware para capturar raw body
  if (!req.rawBody) {
    let data = '';
    req.setEncoding('utf8');
    
    req.on('data', chunk => {
      data += chunk;
    });
    
    req.on('end', () => {
      req.rawBody = data;
      req.body = JSON.parse(data);
      handler(req, res);
    });
  } else {
    handler(req, res);
  }
};