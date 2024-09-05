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
  fetchNewQuestions();
}

async function fetchNewQuestions() {
  try {
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
          {"role": "system", "content": "You are an expert test creator who generates standardized test questions."},
          {"role": "user", "content": "Generate a 40-question multiple-choice ${currentSection} test for 4th-grade students. Each question should include four choices, with one correct answer clearly indicated. Provide questions, choices, and correct answer indexes in JSON format."},
        ],
        "repetition_penalty": 1.1,
        "temperature": 0.7,
        "top_p": 0.9,
        "top_k": 40,
        "max_tokens": 1024,
        "stream": false
      })
    });
*/
    const response = JSON.stringify({
      "id": "chat-9c5a745864004a099cb20ca66ac5f918",
      "object": "chat.completion",
      "created": 1725552042,
      "model": "Meta-Llama-3.1-8B-Instruct",
      "choices": [
          {
              "index": 0,
              "message": {
                  "role": "assistant",
                  "content": "Here is a 40-question multiple-choice test for 4th-grade students.\n\n```json\n{\n  \"test\": [\n    {\n      \"question\": \"What is the largest planet in our solar system?\",\n      \"choices\": [\"Earth\", \"Saturn\", \"Jupiter\", \"Mars\"],\n      \"correct_index\": 2\n    },\n    {\n      \"question\": \"Which of the following is NOT a primary color?\",\n      \"choices\": [\"Red\", \"Blue\", \"Yellow\", \"Green\"],\n      \"correct_index\": 3\n    },\n    {\n      \"question\": \"What is the process called when plants make their own food from sunlight?\",\n      \"choices\": [\"Respiration\", \"Photosynthesis\", \"Decomposition\", \"Transpiration\"],\n      \"correct_index\": 1\n    },\n    {\n      \"question\": \"Which state is known as the 'Sunshine State'?\",\n      \"choices\": [\"California\", \"Florida\", \"New York\", \"Texas\"],\n      \"correct_index\": 1\n    },\n    {\n      \"question\": \"How many sides does a square have?\",\n      \"choices\": [3, 4, 5, 6],\n      \"correct_index\": 1\n    },\n    {\n      \"question\": \"Who wrote the book 'Charlotte's Web'?\",\n      \"choices\": [\"Dr. Seuss\", \"Roald Dahl\", \"E.B. White\", \"J.K. Rowling\"],\n      \"correct_index\": 2\n    },\n    {\n      \"question\": \"What is the capital of France?\",\n      \"choices\": [\"Paris\", \"London\", \"Berlin\", \"Rome\"],\n      \"correct_index\": 0\n    },\n    {\n      \"question\": \"A group of crows is called a:\",\n      \"choices\": [\"Flock\", \"School\", \"Murder\", \"Colony\"],\n      \"correct_index\": 2\n    },\n    {\n      \"question\": \"What is the largest mammal on Earth?\",\n      \"choices\": [\"Elephant\", \"Giraffe\", \"Blue Whale\", \"Lion\"],\n      \"correct_index\": 2\n    },\n    {\n      \"question\": \"What is the smallest bone in the human body?\",\n      \"choices\": [\"Stapes\", \"Malleus\", \"Incus\", \"Hyoid\"],\n      \"correct_index\": 0\n    },\n    {\n      \"question\": \"Which of the following is a type of rock?\",\n      \"choices\": [\"Igneous\", \"Sedimentary\", \"Metamorphic\", \"Fossil\"],\n      \"correct_index\": 2\n    },\n    {\n      \"question\": \"The Great Barrier Reef is located in which ocean?\",\n      \"choices\": [\"Pacific Ocean\", \"Atlantic Ocean\", \"Indian Ocean\", \"Arctic Ocean\"],\n      \"correct_index\": 0\n    },\n    {\n      \"question\": \"What is the main purpose of a seed?\",\n      \"choices\": [\"To grow into a tree\", \"To make flowers bloom\", \"To produce fruit\", \"To spread to new places\"],\n      \"correct_index\": 3\n    },\n    {\n      \"question\": \"Who painted the famous painting 'The Starry Night'?\",\n      \"choices\": [\"Leonardo da Vinci\", \"Michelangelo\", \"Vincent van Gogh\", \"Claude Monet\"],\n      \"correct_index\": 2\n    },\n    {\n      \"question\": \"A 'hydrogen atom' is made up of what three elements?\",\n      \"choices\": [\"Protons, Neutrons, Electrons\", \"Atoms, Molecules, Ions\", \"Nucleus, Protons, Neutrons\", \"Electrons, Positrons, Photons\"],\n      \"correct_index\": 0\n    },\n    {\n      \"question\": \"What is the scientific term for the 'study of the Earth'?\",\n      \"choices\": [\"Geology\", \"Meteorology\", \"Oceanography\", \"Ecology\"],\n      \"correct_index\": 0\n    },\n    {\n      \"question\": \"What is the chemical symbol for gold?\",\n      \"choices\": [\"Ag\", \"Au\", \"Hg\", \"Pb\"],\n      \"correct_index\": 1\n    },\n    {\n      \"question\": \"What is the process called when water moves through a plant, from roots to leaves?\",\n      \"choices\": [\"Transpiration\", \"Evaporation\", \"Condensation\", \"Diffusion\"],\n      \"correct_index\": 0\n    },\n    {\n      \"question\": \"The world's driest desert is the:\",\n      \"choices\": [\"Sahara Desert\", \"Gobi Desert\", \"Atacama Desert\", \"Mojave Desert\"],\n      \"correct_index\": 2\n    },\n    {\n      \"question\": \"What is the process called when animals move from one place to another at certain times of the year?\",\n      \"choices\": [\"Migration\", \"Hibernation\", \"Camouflage\", \"Adaptation",
                  "tool_calls": []
              },
              "logprobs": null,
              "finish_reason": "length",
              "stop_reason": null
          }
      ],
      "usage": {
          "prompt_tokens": 73,
          "total_tokens": 1097,
          "completion_tokens": 1024
      }
    }
    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    // Parsing the response from OpenAI API to extract the questions
    quizQuestions = parseQuestionsFromAPI(generatedText);
console.log(quizQuestions);
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
