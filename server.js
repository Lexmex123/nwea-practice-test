require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const OpenAI = require('openai');

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
    res.status(500).json({ error: 'Error saving data' });
  }
});

// Endpoint to get OpenAI API key
//app.get('/api/openaiKey', (req, res) => {
//  res.json({ key: process.env.OPENAI_API_KEY });
//});

// Add this new endpoint
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/fetchQuestions', async (req, res) => {
  const { section, gradeLevel } = req.body;

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert test creator who generates standardized test questions who does not make mistakes or repeat the same questions very often."
        },
        {
          role: "user",
          content: `Generate a 20-question NWEA MAP ${section} randomized multiple-choice test for Grade ${gradeLevel} students. Each question should include four unique choices, with only one correct answer. Provide challenging, randomized questions (some questions supported by diagrams/images in SVG tags), choices, correct answer indexes, and accurate and detailed explanations of the correct answer, in JSON format with structure [{question{index,question,diagram},correctAnswerIndex,explanations[{index,text}],choices[{index,text}]}. Double check the correctAnswerIndex and explanations are correct like your life depended on it. Answer your own question with the choices provided, and if an error is found, remake the answers. If quote/article/book is referenced, full passage/context should be provided in double quotes. If diagram/image is used, should be big and detailed enough to be useful.` 
        },
      ],
      stream: true,
    });

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        res.write(`data: ${content}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while fetching questions.' });
  }
});

function extractJsonString(input) {
  const regex = /```([\s\S]*?)```/;
  const match = input.match(regex);
  return match ? match[1].trim() : null;
}

// Add this new endpoint for deleting a test
app.delete('/api/deleteTest/:index', async (req, res) => {
  try {
    const indexToDelete = parseInt(req.params.index);
    
    // Read the current data
    let tests = [];
    try {
      const data = await fs.readFile(DATA_FILE, 'utf8');
      tests = JSON.parse(data);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    // Check if the index is valid
    if (indexToDelete < 0 || indexToDelete >= tests.length) {
      return res.status(400).json({ error: 'Invalid test index' });
    }

    // Remove the test at the specified index
    tests.splice(indexToDelete, 1);

    // Write the updated data back to the file
    await fs.writeFile(DATA_FILE, JSON.stringify(tests, null, 2));
    
    res.json({ success: true, message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Error deleting test:', error);
    res.status(500).json({ error: 'Error deleting test' });
  }
});

// For any other GET request, send the index.html file
// This allows client-side routing to work
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});