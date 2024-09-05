const OPENAI_API_KEY = "sk-svcacct-Q2g4T7rgAjw3KPmRgXLfkEu95JiiHERdlK2WIgtDWTfyskW-p-yFFGePoglom7ODvaa8T3BlbkFJQkSG4gKAeOMxb7mA9bCnm7UFuS7PHufxhuqkzEHRR8ffS1CSZKA4kFIK8HoIXv2iylgA"; // Replace with your OpenAI API key
const CLAUDE_API_KEY = "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"

let currentQuestionIndex = 0;
let currentSection = "";
let userAnswers = [];
let quizQuestions = [];
let pastTests = [];

function startNewTest(section) {
  currentSection = section;
  currentQuestionIndex = 0;
  userAnswers = [];
  fetchNewQuestions();
}

async function fetchNewQuestions() {
  try {
    const response = await fetch("https://api.anthropic.com/v1/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY
      },
      body: JSON.stringify({
        model: "claude-2", // Specify the latest model of Claude you're using
        prompt: `Generate a 40-question multiple-choice ${currentSection} test for 4th-grade students. 
                 Each question should include four choices, with one correct answer clearly indicated. 
                 Provide questions, choices, and correct answer indexes in JSON format.`,
        max_tokens_to_sample: 2000,
        temperature: 0.7,
      })
    });

    const data = await response.json();
    const generatedText = data.completion;

    // Parsing the response from Claude API to extract the questions
    quizQuestions = parseQuestionsFromAPI(generatedText);
    loadQuestion();
  } catch (error) {
    console.error("Error fetching questions:", error);
  }
}

function parseQuestionsFromAPI(apiResponse) {
  // This assumes the Claude API responds with a JSON structure similar to OpenAI's output
  try {
    return JSON.parse(apiResponse); // The response should contain an array of questions, choices, and correct indexes.
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
    const resultItem =
