const OPENAI_API_KEY = "sk-svcacct-Q2g4T7rgAjw3KPmRgXLfkEu95JiiHERdlK2WIgtDWTfyskW-p-yFFGePoglom7ODvaa8T3BlbkFJQkSG4gKAeOMxb7mA9bCnm7UFuS7PHufxhuqkzEHRR8ffS1CSZKA4kFIK8HoIXv2iylgA"; // Replace with your OpenAI API key
const CLAUDE_API_KEY = "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"

let currentQuestionIndex = 0;
let currentSection = "";
let userAnswers = [];
let quizQuestions = [];
let pastTests = [];

// Enum to choose the model
const ModelType = {
  OPENAI: 'openai',
  CLAUDE: 'claude'
};

let currentModel = ModelType.CLAUDE; // Switch between ModelType.OPENAI and ModelType.CLAUDE

function startNewTest(section, model = ModelType.OPENAI) {
  currentSection = section;
  currentModel = model;
  currentQuestionIndex = 0;
  userAnswers = [];
  fetchNewQuestions();
}

async function fetchNewQuestions() {
  if (currentModel === ModelType.OPENAI) {
    await fetchOpenAIQuestions();
  } else if (currentModel === ModelType.CLAUDE) {
    await fetchClaudeQuestions();
  }
}

async function fetchOpenAIQuestions() {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert test creator who generates standardized test questions."
          },
          {
            role: "user",
            content: `Generate a 40-question multiple-choice ${currentSection} test for 4th-grade students. Each question should include four choices, with one correct answer clearly indicated. Provide questions, choices, and correct answer indexes in JSON format.`
          }
        ],
        max_tokens: 2000,
        n: 1,
        temperature: 0.7
      })
    });

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    // Parsing the response from OpenAI API to extract the questions
    quizQuestions = parseQuestionsFromAPI(generatedText);
    loadQuestion();
  } catch (error) {
    console.error("Error fetching questions from OpenAI:", error);
  }
}

async function fetchClaudeQuestions() {
  try {
    const response = await fetch("https://api.anthropic.com/v1/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY
      },
      body: JSON.stringify({
        prompt: `You are an expert test creator. Generate a 40-question multiple-choice ${currentSection} test for 4th-grade students. Each question should include four choices, with one correct answer clearly indicated. Provide questions, choices, and correct answer indexes in JSON format.`,
        model: "claude-2",
        max_tokens_to_sample: 2000,
        temperature: 0.7
      })
    });

    const data = await response.json();
    const generatedText = data.completion;

    // Parsing the response from Claude API to extract the questions
    quizQuestions = parseQuestionsFromAPI(generatedText);
    loadQuestion();
  } catch (error) {
    console.error("Error fetching questions from Claude:", error);
  }
}

function parseQuestionsFromAPI(apiResponse) {
  try {
    return JSON.parse(apiResponse);
  } catch (error) {
    console.error("Error parsing API response:", error);
    return [];
  }
}

function loadQuestion() {
  if (quizQuestions.length === 0) {
    alert("No questions found. Please try again.");
    return;
  }

  const questionData = quizQuestions[currentQuestionIndex];
  document.getElementById("section").textContent = currentSection;
  document.getElementById("question").textContent = questionData.question;

  const buttons = document.querySelectorAll(".choice-btn");
  buttons.forEach((button, index) => {
    button.textContent = questionData.choices[index];
  });

  document.getElementById("main-menu").style.display = "none";
  document.getElementById("quiz-container").style.display = "block";
}

function selectAnswer(index) {
  userAnswers[currentQuestionIndex] = index;
}

function submitAnswer() {
  currentQuestionIndex++;

  if (currentQuestionIndex < quizQuestions.length) {
    loadQuestion();
  } else {
    showResults();
  }
}

function showResults() {
  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("results-container").style.display = "block";

  const resultsList = document.getElementById("results-list");
  resultsList.innerHTML = "";

  quizQuestions.forEach((question, index) => {
    const resultItem = document.createElement("li");
    resultItem.innerHTML = `
      <strong>Question ${index + 1}:</strong> 
      <span>${userAnswers[index] === question.correct ? "Correct" : "Incorrect"}</span>
      <button onclick="reviewQuestion(${index})">Review</button>
    `;
    resultsList.appendChild(resultItem);
  });

  saveTestResults();
}

function reviewQuestion(index) {
  const question = quizQuestions[index];

  document.getElementById("results-container").style.display = "none";
  document.getElementById("quiz-container").style.display = "block";

  document.getElementById("question").textContent = question.question;
  const buttons = document.querySelectorAll(".choice-btn");
  buttons.forEach((button, i) => {
    button.textContent = question.choices[i];
  });

  document.getElementById("submit-btn").style.display = "none";
}

function saveTestResults() {
  const newTest = {
    section: currentSection,
    questions: quizQuestions,
    answers: userAnswers
  };

  pastTests.push(newTest);
  localStorage.setItem("pastTests", JSON.stringify(pastTests));
}

function loadPastTests() {
  const savedTests = localStorage.getItem("pastTests");
  if (savedTests) {
    pastTests = JSON.parse(savedTests);
    const pastTestsList = document.getElementById("past-tests");
    pastTests.forEach((test, index) => {
      const testItem = document.createElement("li");
      testItem.innerHTML = `
        ${test.section} Test ${index + 1}
        <button onclick="resumeTest(${index})">Resume</button>
      `;
      pastTestsList.appendChild(testItem);
    });
  }
}

function resumeTest(testIndex) {
  const test = pastTests[testIndex];
  quizQuestions = test.questions;
  userAnswers = test.answers;
  currentSection = test.section;
  currentQuestionIndex = userAnswers.length;
  loadQuestion();
}

function backToMainMenu() {
  document.getElementById("results-container").style.display = "none";
  document.getElementById("main-menu").style.display = "block";
}

// Load past tests on page load
window.onload = loadPastTests;
