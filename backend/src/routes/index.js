const express = require('express');
const router = express.Router();
const logger = require('../middleware/logger');
const downloadRouter = require('./download');

// Apply logger middleware to all routes
router.use(logger);

// Use download routes
router.use('/download', downloadRouter);

// ... existing code ... 