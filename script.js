const OPENAI_API_KEY = "sk-svcacct-Q2g4T7rgAjw3KPmRgXLfkEu95JiiHERdlK2WIgtDWTfyskW-p-yFFGePoglom7ODvaa8T3BlbkFJQkSG4gKAeOMxb7mA9bCnm7UFuS7PHufxhuqkzEHRR8ffS1CSZKA4kFIK8HoIXv2iylgA"; // Replace with your OpenAI API key

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

function fetchNewQuestions() {
  fetch("https://api.openai.com/v1/engines/davinci-codex/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      prompt: `Generate a 40-question ${currentSection} test for 4th grade students with multiple choice options.`,
      max_tokens: 2000
    })
  })
  .then(response => response.json())
  .then(data => {
    quizQuestions = parseQuestionsFromAPI(data.choices[0].text);
    loadQuestion();
  })
  .catch(error => console.error("Error fetching questions:", error));
}

function parseQuestionsFromAPI(apiResponse) {
  // Parsing logic to extract questions, options, and correct answers from the API response
  // This is just a placeholder, you would need to implement a way to correctly split and format the API's response.
  return JSON.parse(apiResponse); 
}

function loadQuestion() {
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

  // Save test results to pastTests
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
