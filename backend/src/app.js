const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const logger = require('./middleware/logger');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// Routes
const downloadRouter = require('./routes/download');
app.use('/download', downloadRouter);

module.exports = app; 