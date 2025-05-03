const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

// Authentication middleware
const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = { id: user.id, username: user.username };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Update OpenAI API key
router.put('/api-key', auth, async (req, res) => {
  try {
    const { apiKey, useCustomKey } = req.body;
    const userId = req.user.id;

    await prisma.user.update({
      where: { id: userId },
      data: { 
        openaiApiKey: apiKey,
        useCustomKey: useCustomKey ?? false
      }
    });

    res.json({ message: 'API key settings updated successfully' });
  } catch (error) {
    console.error('Error updating API key:', error);
    res.status(500).json({ error: 'Failed to update API key settings' });
  }
});

// Get OpenAI API key status
router.get('/api-key', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        openaiApiKey: true,
        useCustomKey: true
      }
    });

    // Check if user has their own key or if environment key is available
    const hasCustomKey = !!user?.openaiApiKey;
    const hasSystemKey = !!process.env.OPENAI_API_KEY;
    const isUsingCustomKey = user?.useCustomKey && hasCustomKey;

    res.json({ 
      hasCustomKey,
      hasSystemKey,
      isUsingCustomKey,
      useCustomKey: user?.useCustomKey || false,
      message: isUsingCustomKey ? 
        'Using your custom API key' : 
        (hasSystemKey ? 'Using system default API key' : 'No API key configured')
    });
  } catch (error) {
    console.error('Error fetching API key:', error);
    res.status(500).json({ error: 'Failed to fetch API key status' });
  }
});

module.exports = router; 