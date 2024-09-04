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
  {
    question: "Find the perimeter of a rectangle with a length of 10 cm and a width of 6 cm.",
    choices: ["16 cm", "32 cm", "26 cm", "40 cm"],
    correct: 1,
    explanation: "The perimeter is calculated as 2 * (length + width), which equals 2 * (10 + 6) = 32 cm."
  },
  {
    question: "What is the product of 7 and 9?",
    choices: ["54", "61", "63", "72"],
    correct: 2,
    explanation: "The product of 7 and 9 is 63."
  },
  {
    question: "Round 567 to the nearest ten.",
    choices: ["560", "570", "600", "500"],
    correct: 1,
    explanation: "567 rounds up to 570 as the number in the ones place is 7."
  },
];

let currentQuestion = 0;
let score = 0;
let userAnswers = [];

function loadQuestion() {
  const questionData = quizQuestions[currentQuestion];
  document.getElementById("question").textContent = questionData.question;

  const buttons = document.querySelectorAll(".choice-btn");
  buttons.forEach((button, index) => {
    button.textContent = questionData.choices[index];
  });

  document.getElementById("feedback").textContent = "";
  document.getElementById("next-btn").style.display = "none";
}

function selectAnswer(index) {
  const questionData = quizQuestions[currentQuestion];

  userAnswers[currentQuestion] = {
    selected: index,
    correct: questionData.correct,
    explanation: questionData.explanation,
    question: questionData.question,
    choices: questionData.choices
  };

  if (index === questionData.correct) {
    document.getElementById("feedback").textContent = "Correct!";
    document.getElementById("feedback").style.color = "green";
    score++;
  } else {
    document.getElementById("feedback").textContent = "Incorrect.";
    document.getElementById("feedback").style.color = "red";
  }

  document.getElementById("next-btn").style.display = "block";
}

function nextQuestion() {
  currentQuestion++;
  if (currentQuestion < quizQuestions.length) {
    loadQuestion();
  } else {
    showScore();
  }
}

function showScore() {
  document.getElementById("quiz-container").innerHTML = `<h2>You scored ${score} out of ${quizQuestions.length}</h2>`;
  document.getElementById("review-btn").style.display = "block";
}

function showResults() {
  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("review-container").style.display = "block";

  const reviewList = document.getElementById("review-list");
  reviewList.innerHTML = "";
  
  userAnswers.forEach((answer, index) => {
    const questionReview = document.createElement("div");
    questionReview.innerHTML = `
      <h3>Question ${index + 1}: ${answer.question}</h3>
      <p>Your answer: ${answer.choices[answer.selected]} (${answer.selected === answer.correct ? "Correct" : "Incorrect"})</p>
      <p>Explanation: ${answer.explanation}</p>
    `;
    reviewList.appendChild(questionReview);
  });
}

function restartQuiz() {
  currentQuestion = 0;
  score = 0;
  userAnswers = [];
  document.getElementById("review-container").style.display = "none";
  document.getElementById("quiz-container").style.display = "block";
  document.getElementById("review-btn").style.display = "none";
  loadQuestion();
}

window.onload = loadQuestion;
