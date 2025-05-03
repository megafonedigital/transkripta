const Log = require('../models/Log');

const logger = async (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', async () => {
    const duration = Date.now() - start;
    
    try {
      await Log.create({
        level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warning' : 'info',
        message: `${req.method} ${req.originalUrl} ${res.statusCode}`,
        details: {
          method: req.method,
          duration,
          userAgent: req.get('user-agent'),
          ip: req.ip
        }
      });
    } catch (error) {
      console.error('Error saving log:', error);
    }
  });

  next();
};

module.exports = logger; 