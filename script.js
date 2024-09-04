const quizQuestions = [
  {
    question: "What is the value of the expression: 8 × (5 + 3)?",
    choices: ["40", "56", "64", "88"],
    correct: 1,
    explanation: "The correct answer is 56 because you solve inside the parentheses first (5 + 3 = 8) and then multiply by 8."
  },
  {
    question: "Which fraction is equivalent to 4/8?",
    choices: ["2/4", "3/4", "5/8", "6/8"],
    correct: 0,
    explanation: "4/8 simplifies to 2/4, as both 4 and 8 can be divided by 2."
  },
  // ... Add more questions here, up to 40 questions ...
];

let currentQuestion = 0;
let userAnswers = [];

function loadQuestion() {
  const questionData = quizQuestions[currentQuestion];
  document.getElementById("question").textContent = questionData.question;

  const buttons = document.querySelectorAll(".choice-btn");
  buttons.forEach((button, index) => {
    button.textContent = questionData.choices[index];
  });
}

function selectAnswer(index) {
  userAnswers[currentQuestion] = index;

  // Enable the "Next" button after an answer is selected
  document.getElementById("next-btn").style.display = "block";
}

function nextQuestion() {
  currentQuestion++;

  if (currentQuestion < quizQuestions.length) {
    loadQuestion();
    document.getElementById("next-btn").style.display = "none";
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
}

function reviewQuestion(index) {
  const question = quizQuestions[index];

  document.getElementById("results-container").style.display = "none";
  document.getElementById("review-container").style.display = "block";

  document.getElementById("review-question").textContent = question.question;
  document.getElementById("review-explanation").textContent = `
    Your answer: ${question.choices[userAnswers[index]]}
    Correct answer: ${question.choices[question.correct]}
    Explanation: ${question.explanation}
  `;
}

function backToResults() {
  document.getElementById("review-container").style.display = "none";
  document.getElementById("results-container").style.display = "block";
}

function restartQuiz() {
  currentQuestion = 0;
  userAnswers = [];

  document.getElementById("results-container").style.display = "none";
  document.getElementById("quiz-container").style.display = "block";

  loadQuestion();
}

window.onload = loadQuestion;
