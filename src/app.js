const express = require('express');
const routes = require('./routes');
const logger = require('./logger');

const app = express();

app.use(express.json());
app.use((req, res, next) => {
  logger.info(`[${process.pid}] ${req.method} ${req.url}`);
  next();
});

app.use('/', routes);

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
