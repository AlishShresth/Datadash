const express = require('express');
const csv = require('csv-parser');
const fs = require('fs');
const pool = require('../config/db');
const upload = require('../middlewares/multerConfig');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const router = express.Router();

// CSV upload route
router.post('/upload-csv', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const results = [];

    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        // insert data into PostgreSQL
        logger.info(`Processing CSV: ${req.file.filename}`);
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          for (const row of results) {
            await client.query(
              'INSERT INTO analytics_data (id, dataset_id, data, created_at) values ($1, $2, $3, $4)',
              [uuidv4(), req.file.filename, JSON.stringify(row), new Date()]
            );
          }
          await client.query('COMMIT');
          logger.info(`CSV uploaded and processed: ${req.file.filename}`);
          res.json({
            message: 'CSV uploaded and processed successfully',
            datasetId: req.file.filename,
          });
        } catch (err) {
          await client.query('ROLLBACK');
          throw err;
        } finally {
          client.release();
        }
        // clean up uploaded file
        fs.unlinkSync(req.file.path);
      });
  } catch (err) {
    next(error);
  }
});

module.exports = router;
