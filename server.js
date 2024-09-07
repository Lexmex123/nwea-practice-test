require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

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
app.post('/api/fetchQuestions', async (req, res) => {
  try {
    const { section, gradeLevel } = req.body;
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert test creator who generates standardized test questions who does not make mistakes or repeat the same questions very often."
        },
        {
          role: "user",
          content: `Generate a 15-question NWEA MAP ${section} randomized multiple-choice test for Grade ${gradeLevel} students. Each question should include four unique choices, with only one correct answer. Provide challenging, randomized questions (some questions supported by diagrams/images in SVG format), choices, correct answer indexes, and accurate, unique explanations of why each choice is correct or incorrect in detail, in JSON format with structure [{question{index,question,diagram},correctAnswerIndex,explanations[{index,text}],choices[{index,text}]}. Double check the correctAnswerIndex and explanations are correct like your life depended on it, if an error is found, redo. If quote/article/book is referenced, full passage/context should be provided in double quotes. If diagram/image is used, should be big and detailed enough to be useful.` 
        },
      ],
      max_tokens: 4096,
      n: 1,
      temperature: 0.7
    }, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      }
    });
    const generatedText = response.data.choices[0].message.content.replace('json\n','');
console.log(generatedText);    
    const questions = JSON.parse(extractJsonString(generatedText)); //.replace('\n','')

    res.json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error); //
    if (error.response && error.response.data && error.response.data.error) console.log(error.response.data.error);
    res.status(500).json({ error: 'Error fetching questions' });
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
