const express = require('express');
const router = express.Router();
const Log = require('../models/Log');
const auth = require('../middleware/auth');

// Get logs with filters
router.get('/', auth, async (req, res) => {
  try {
    const { level, startDate, endDate } = req.query;
    
    let query = {};
    
    if (level) {
      query.level = level;
    }
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    const logs = await Log.find(query)
      .sort({ createdAt: -1 })
      .limit(100);
      
    res.json(logs);
  } catch (err) {
    console.error('Error fetching logs:', err);
    res.status(500).json({ message: 'Erro ao buscar logs' });
  }
});

// Clear all logs
router.delete('/', auth, async (req, res) => {
  try {
    await Log.deleteMany({});
    res.json({ message: 'Logs limpos com sucesso' });
  } catch (err) {
    console.error('Error clearing logs:', err);
    res.status(500).json({ message: 'Erro ao limpar logs' });
  }
});

module.exports = router; 