const OPENAI_API_KEY = "sk-svcacct-Q2g4T7rgAjw3KPmRgXLfkEu95JiiHERdlK2WIgtDWTfyskW-p-yFFGePoglom7ODvaa8T3BlbkFJQkSG4gKAeOMxb7mA9bCnm7UFuS7PHufxhuqkzEHRR8ffS1CSZKA4kFIK8HoIXv2iylgA"; // Replace with your OpenAI API key
const ARLIAI_API_KEY = "16911291-fd4a-4b17-ae91-cbfc101b5aea"

let currentQuestionIndex = 0;
let currentSection = "";
let userAnswers = [];
let quizQuestions = [];
let pastTests = [];

function startNewTest(section) {
  currentSection = section;
  currentQuestionIndex = 0;
  userAnswers = [];
  // Show the loading overlay
  document.getElementById("loading-overlay").style.display = "flex";  
  fetchNewQuestions();
}

function extractJsonString(input) {
  const regex = /```json([\s\S]*?)```/;
  const match = input.match(regex);
  return match ? match[1].trim() : null;
}

async function fetchNewQuestions() {
  try {
    const selectedGrade = document.getElementById("grade-level").value;
/*
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
*/
/*
    const response = await fetch("https://api.arliai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ARLIAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "Meta-Llama-3.1-8B-Instruct",
        "messages": [
          {"role": "system", "content": "You are an expert test creator for the NWEA MAP test who generates standardized test questions."},
          {"role": "user", "content": `Generate a 5-question NWEA MAP ${currentSection} multiple-choice test for ${selectedGrade}th-grade students. Each question should include four choices, with one correct answer clearly indicated. Provide questions, choices,  correct answer indexes, and explanations for each choice, in JSON format with questions listed in an array.`},
        ],
        "repetition_penalty": 1.1,
        "temperature": 0.7,
        "top_p": 0.9,
        "top_k": 40,
        "max_tokens": 1024,
        "stream": false
      })
    });
    const data = await response.json();
console.log(data);
*/

  const data = {
    "id": "chat-7c63294172e84b6bbecb03d4db897603",
    "object": "chat.completion",
    "created": 1725556836,
    "model": "Meta-Llama-3.1-8B-Instruct",
    "choices": [
        {
            "index": 0,
            "message": {
                "role": "assistant",
                "content": "Here is a sample 5-question NWEA MAP Math multiple-choice test for 4th-grade students:\n\n```json\n{\n  \"questions\": [\n    {\n      \"question\": \"What is the value of x in the equation: 2x + 5 = 11?\",\n      \"choices\": [\n        {\"text\": \"3\", \"index\": 0},\n        {\"text\": \"4\", \"index\": 1},\n        {\"text\": \"5\", \"index\": 2},\n        {\"text\": \"6\", \"index\": 3}\n      ],\n      \"correctAnswerIndex\": 2,\n      \"explanation\": \"To solve for x, we need to isolate the variable. We can do this by subtracting 5 from both sides of the equation, which gives us 2x = 6. Then, we divide both sides by 2 to get x = 3.\"\n    },\n    {\n      \"question\": \"A bookshelf has 5 shelves, and each shelf can hold 8 books. How many books can the bookshelf hold in total?\",\n      \"choices\": [\n        {\"text\": \"20\", \"index\": 0},\n        {\"text\": \"30\", \"index\": 1},\n        {\"text\": \"40\", \"index\": 2},\n        {\"text\": \"50\", \"index\": 3}\n      ],\n      \"correctAnswerIndex\": 2,\n      \"explanation\": \"We multiply the number of shelves (5) by the number of books each shelf can hold (8), which gives us 5 x 8 = 40.\"\n    },\n    {\n      \"question\": \"A pencil is 15 cm long. If it is divided into 5 parts, how long is each part?\",\n      \"choices\": [\n        {\"text\": \"1 cm\", \"index\": 0},\n        {\"text\": \"2 cm\", \"index\": 1},\n        {\"text\": \"3 cm\", \"index\": 2},\n        {\"text\": \"4 cm\", \"index\": 3}\n      ],\n      \"correctAnswerIndex\": 2,\n      \"explanation\": \"To find the length of each part, we need to divide the total length of the pencil (15 cm) by the number of parts (5). This gives us 15 ÷ 5 = 3 cm per part.\"\n    },\n    {\n      \"question\": \"A group of friends want to share some candy equally. If they have 48 pieces of candy and there are 8 friends, how many pieces of candy will each friend get?\",\n      \"choices\": [\n        {\"text\": \"4\", \"index\": 0},\n        {\"text\": \"6\", \"index\": 1},\n        {\"text\": \"8\", \"index\": 2},\n        {\"text\": \"10\", \"index\": 3}\n      ],\n      \"correctAnswerIndex\": 2,\n      \"explanation\": \"To find out how many pieces of candy each friend will get, we need to divide the total number of candies (48) by the number of friends (8). This gives us 48 ÷ 8 = 6 pieces per friend.\"\n    },\n    {\n      \"question\": \"A water bottle can hold 24 ounces of water. If 12 ounces of water are already in the bottle, what percentage of the bottle's capacity is filled?\",\n      \"choices\": [\n        {\"text\": \"25%\", \"index\": 0},\n        {\"text\": \"33%\", \"index\": 1},\n        {\"text\": \"50%\", \"index\": 2},\n        {\"text\": \"67%\", \"index\": 3}\n      ],\n      \"correctAnswerIndex\": 2,\n      \"explanation\": \"To find the percentage of the bottle that is filled, we need to divide the amount of water currently in the bottle (12 oz) by the total capacity of the bottle (24 oz). Then, we convert this decimal to a percentage by multiplying by 100. This gives us (12/24) x 100% = 50%. \"\n    }\n  ]\n}\n```\n\nThis test covers various math topics such as solving equations, multiplication, division, fractions, and percentages.",
                "tool_calls": []
            },
            "logprobs": null,
            "finish_reason": "stop",
            "stop_reason": null
        }
    ],
    "usage": {
        "prompt_tokens": 94,
        "total_tokens": 962,
        "completion_tokens": 868
    }
  };

    const generatedText = data.choices[0].message.content;
//    quizQuestions = JSON.parse(generatedText.replace('\n','').split('```json')[1]).questions;
  quizQuestions = JSON.parse(extractJsonString(generatedText.replace('\n',''))).questions;
console.log(quizQuestions);
    // Parsing the response from OpenAI API to extract the questions
//    quizQuestions = parseQuestionsFromAPI(generatedText);

    // Hide the loading overlay once questions are fetched
    document.getElementById("loading-overlay").style.display = "none";

    loadQuestion();
  } catch (error) {
    console.error("Error fetching questions:", error);
  }
}

function parseQuestionsFromAPI(apiResponse) {
  // This assumes the OpenAI API responds with JSON structured as
  // [{ question: "...", choices: ["A", "B", "C", "D"], correct: 1 }, ...]
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
    button.textContent = questionData.choices[index].text;
  });

  document.getElementById("main-menu").style.display = "none";
  document.getElementById("quiz-container").style.display = "block";
}

function selectAnswer(index) {
  userAnswers[currentQuestionIndex] = index;

  // Remove the selected class from all buttons
  const buttons = document.querySelectorAll(".choice-btn");
  buttons.forEach(button => button.classList.remove("selected"));

  // Add the selected class to the clicked button
  buttons[index].classList.add("selected");
}

function submitAnswer() {
  currentQuestionIndex++;
  // Remove the selected class from all buttons
  const buttons = document.querySelectorAll(".choice-btn");
  buttons.forEach(button => button.classList.remove("selected"));

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
