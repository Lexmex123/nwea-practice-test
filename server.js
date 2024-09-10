require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const OpenAI = require('openai');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json());

// Configure AWS
const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'LEXI_TESTPREP_TESTS';

// Endpoint to get past tests
app.get('/api/pastTests', async (req, res) => {
  try {
    const command = new ScanCommand({
      TableName: TABLE_NAME
    });
    const data = await docClient.send(command);
    res.json(data.Items);
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ error: 'Error reading data' });
  }
});

// Endpoint to save a new test
app.post('/api/saveTest', async (req, res) => {
  try {
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        id: Date.now().toString(), // Use timestamp as a unique ID
        ...req.body
      }
    });
    await docClient.send(command);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving test:', error);
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

app.post('/api/checkAnswer', async (req, res) => {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an expert test creator who generates standardized test questions who does not make mistakes or repeat the same questions very often."
                },
                {
                    role: "user",
                    content: `Check if the correctAnswerIndex to the question provided in the following object is 100% correct. Respond only with an object with correctAnswerIndex and explanation of the correct answer.\n${JSON.stringify(req.body)}`
                },
            ],
            temperature: 0.2,
            stream: false
        });
        res.json({ response: response.choices[0].message.content });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while checking answer.' });
    }
});

//Make a helpful and useful diagram used in a test (cannot give away the answers) that corresponds to this test question object:

app.post('/api/makeDiagram', async (req, res) => {
    console.log(`Requesting diagram: ${req.body.prompt}`);
    try {
        const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: 'Use this exact prompt: "' + req.body.prompt + '. Image should precise follow the prompt, simple and straightforward. Do not alter the prompt. In SVG format."',
            n: 1,
            size: "1024x1024"
        });
        if (response.error) {
            throw new Error('Error from OpenAI: ', response.error.message);
        } else {
            res.json({ response: response.data[0].url });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while making a diagram.' });
    }
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
          content: `Generate a 20-question NWEA MAP ${section} randomized multiple-choice test for Grade ${gradeLevel} students. Each question should include four unique choices, with only one correct answer. Provide challenging, randomized, self-explanatory questions (if need supporting diagrams/illustrations/images, provide a good DALL-E-3 prompt), choices, correct answer indexes, and accurate and detailed explanations of the correct answer, in JSON format with structure [{question{index,question,diagram},correctAnswerIndex,explanations[{index,text}],choices[{index,text}]}. Double check the correctAnswerIndex and explanations are correct like your life depended on it. Answer your own question with the choices provided, and if an error/duplicate is found, remake the answers. If quote/article/book/story is referenced, full passage/context/story should be provided in double quotes.` 
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
    try {
      res.status(500).json({ error: 'An error occurred while fetching questions.' });
    } catch (error) {
    }
  }
});

function extractJsonString(input) {
  const regex = /```([\s\S]*?)```/;
  const match = input.match(regex);
  return match ? match[1].trim() : null;
}

// Add this new endpoint for deleting a test
app.delete('/api/deleteTest/:id', async (req, res) => {
  try {
    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        id: req.params.id
      }
    });
    await docClient.send(command);
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