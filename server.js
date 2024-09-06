require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'pastTests.json');

// Endpoint to get past tests
app.get('/api/pastTests', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    if (data.length === 0) {
      res.json([]);
    } else {
      res.json(JSON.parse(data));
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json([]);
    } else {
      res.status(500).json({ error: 'Error reading data' });
    }
  }
});

// Endpoint to save a new test
app.post('/api/saveTest', async (req, res) => {
  try {
    let tests = [];

    // Ensure the data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });

    try {
      // Try to read existing data
      const data = await fs.readFile(DATA_FILE, 'utf8');
      tests = JSON.parse(data);
    } catch (error) {
      // If file doesn't exist or is empty, start with an empty array
      if (error.code !== 'ENOENT') {
        console.error('Error reading data file:', error);
      }
      // File doesn't exist or other error, start with an empty array
      tests = [];
    }
    
    // Add the new test
    tests.push(req.body);

    // Write the updated data back to the file
    await fs.writeFile(DATA_FILE, JSON.stringify(tests, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Error saving data' });
  }
});

// Endpoint to get OpenAI API key
app.get('/api/openaiKey', (req, res) => {
  res.json({ key: process.env.OPENAI_API_KEY });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
