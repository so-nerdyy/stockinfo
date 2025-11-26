const express = require('express');
const cors = require('cors');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('csv'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const data = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => {
      // Parse and validate row
      const date = row.Date;
      const open = parseFloat(row.Open);
      const high = parseFloat(row.High);
      const low = parseFloat(row.Low);
      const close = parseFloat(row.Close);

      if (date && !isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close)) {
        data.push({ date, open, high, low, close });
      }
    })
    .on('end', () => {
      try {
        // Sort data chronologically by date
        data.sort((a, b) => new Date(a.date) - new Date(b.date));

        if (data.length < 2) {
          return res.status(400).json({ error: 'Not enough data points' });
        }

        const days = [];
        const overnightSeries = [];
        const intradaySeries = [];

        for (let i = 1; i < data.length; i++) {
          const today = data[i];
          const yesterday = data[i - 1];

          const overnight_change = today.open - yesterday.close;
          const overnight_percent = (overnight_change / yesterday.close) * 100;
          const intraday_change = today.close - today.open;
          const intraday_percent = (intraday_change / today.open) * 100;
          const total_percent = ((today.close - yesterday.close) / yesterday.close) * 100;

          days.push({
            date: today.date,
            overnight: {
              open: today.open,
              priorClose: yesterday.close,
              percent: overnight_percent
            },
            intraday: {
              open: today.open,
              close: today.close,
              percent: intraday_percent
            },
            total: {
              percent: total_percent
            }
          });

          overnightSeries.push({
            date: today.date,
            percent: overnight_percent
          });

          intradaySeries.push({
            date: today.date,
            percent: intraday_percent
          });
        }

        const result = {
          days,
          overnightSeries,
          intradaySeries
        };

        res.json(result);

        // Clean up
        fs.unlinkSync(req.file.path);
      } catch (parseError) {
        console.error(parseError);
        res.status(500).json({ error: 'Failed to process CSV' });
      }
    })
    .on('error', (error) => {
      console.error(error);
      res.status(500).json({ error: 'Failed to read CSV file' });
    });
});



app.listen(3001, () => {
  console.log('Server running on port 3001');
});