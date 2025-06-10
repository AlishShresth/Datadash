const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const logger = require('./utils/logger');
const dataRoutes = require('./routes/data');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// middleware: logging with morgan
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// middleware: cors and json parsing
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/data', dataRoutes);

// centralized error handling middleware
app.use((err, req, res, next) => {
  const errorId = uuidv4();
  logger.error(
    `Error ID: ${errorId}, Message: ${err.message}, Stack: ${err.stack}`
  );
  res.status(err.status || 500).json({
    error: {
      id: errorId,
      message: err.message || 'Internal Server Error',
    },
  });
});

// start server
app.listen(PORT, () => {
  logger.log(`Server running on port ${PORT}`);
});
