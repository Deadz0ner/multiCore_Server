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

module.exports = app;
