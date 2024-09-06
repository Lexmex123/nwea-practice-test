const ARLIAI_API_KEY = "16911291-fd4a-4b17-ae91-cbfc101b5aea"

let quizQuestions = [];
let userAnswers = [];
let currentQuestionIndex = 0;
let currentSection = '';
let pastTests = [];
let isReviewMode = false;
let currentGradeLevel = '';

async function startNewTest(section) {
  const gradeLevel = document.getElementById("grade-level").value;
  if (!gradeLevel) {
    alert("Please select a grade level before starting the test.");
    return;
  }

  isReviewMode = false;
  currentSection = section;
  currentGradeLevel = gradeLevel;
  
  // Save the selected grade level
  localStorage.setItem('lastSelectedGrade', currentGradeLevel);
  
  currentQuestionIndex = 0;
  userAnswers = [];
  // Show the loading overlay
  document.getElementById("loading-overlay").style.display = "flex";  
  await fetchNewQuestions();
}

function extractJsonString(input) {
  const regex = /```([\s\S]*?)```/;
  const match = input.match(regex);
  return match ? match[1].trim() : null;
}

async function fetchOpenAIKey() {
  const response = await fetch('/api/openaiKey');
  const data = await response.json();
  return data.key;
}

async function fetchNewQuestions() {
  try {
    const selectedGrade = document.getElementById("grade-level").value;
    const OPENAI_API_KEY = await fetchOpenAIKey();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {      
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert test creator who generates standardized test questions."
          },
          {"role": "user", "content": `Generate a 5-question NWEA MAP ${currentSection} multiple-choice test for Grade ${selectedGrade} students. Each question should include four choices, with one correct answer. Provide challenging, randomized questions (some questions supported bydiagrams in SVG format), choices, correct answer indexes, and explanations of why each choice is correct/incorrect in detail, in JSON format with structure [{question{index,question,diagram},correctAnswerIndex,explanations[{index,text}],choices[{index,text}]}. Double check questions and correctAnswerIndex to ensure they are correct.`},
        ],
        max_tokens: 4096,
        n: 1,
        temperature: 0.7
      })
    });

    const data = await response.json();
    console.log(data);  // Log the response for debugging

    if (data.choices && data.choices[0] && data.choices[0].message) {
      const generatedText = data.choices[0].message.content.replace('json\n','');
      console.log(generatedText);  // Log the generated text for debugging
      quizQuestions = JSON.parse(extractJsonString(generatedText.replace('\n','')));
      console.log(quizQuestions);  // Log the parsed questions for debugging
    } else {
      throw new Error("Unexpected response structure from API");
    }

    // Hide the loading overlay once questions are fetched
    document.getElementById("loading-overlay").style.display = "none";

    loadQuestion();
  } catch (error) {
    console.error("Error fetching questions:", error);
    // Hide the loading overlay and show an error message to the user
    document.getElementById("loading-overlay").style.display = "none";
    alert("An error occurred while fetching questions. Please try again.");
    document.getElementById("loading-overlay").style.display = "none";
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
console.log(questionData)
  document.getElementById("section").textContent = currentSection;
  document.getElementById("question").textContent = questionData.question.question;
  document.getElementById("question-number").innerText = currentQuestionIndex + 1;

  // Handle diagram
  const diagramContainer = document.getElementById("diagram-container");
  if (questionData.question.diagram) {
    diagramContainer.innerHTML = `${questionData.question.diagram}`;
    diagramContainer.style.display = "block";
  } else {
    diagramContainer.innerHTML = "";
    diagramContainer.style.display = "none";
  }

  const buttons = document.querySelectorAll(".choice-btn");
  buttons.forEach((button, index) => {
    button.textContent = questionData.choices[index].text;
    button.classList.remove("selected", "correct", "incorrect");
    button.disabled = isReviewMode; // Disable buttons in review mode
    button.onclick = () => selectAnswer(index); // Add click event listener
  });

  document.getElementById("main-menu").style.display = "none";
  document.getElementById("quiz-container").style.display = "block";
  
  // Hide "Back to Test Results" button during new test
  document.getElementById("back-btn").style.display = isReviewMode ? "block" : "none";
  // Show "Submit" button during new test
  document.getElementById("submit-btn").style.display = isReviewMode ? "none" : "block";

  // Disable submit button initially
  document.getElementById("submit-btn").disabled = true;

  // Clear explanations when loading a new question
  document.getElementById("explanations-container").innerHTML = "";

  updateQuestionNav();
}

function selectAnswer(index) {
  userAnswers[currentQuestionIndex] = index;

  // Remove the selected class from all buttons
  const buttons = document.querySelectorAll(".choice-btn");
  buttons.forEach(button => button.classList.remove("selected"));

  // Add the selected class to the clicked button
  buttons[index].classList.add("selected");

  // Enable the submit button
  document.getElementById("submit-btn").disabled = false;
}

function submitAnswer() {
  if (isReviewMode) {
    backToTestResults();
    return;
  }

  currentQuestionIndex++;
  // Remove the selected class from all buttons
  const buttons = document.querySelectorAll(".choice-btn");
  buttons.forEach(button => button.classList.remove("selected"));

  if (currentQuestionIndex < quizQuestions.length) {
    loadQuestion();
  } else {
    saveTestResults();
    showResults();
  }
}

function showResults() {
  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("results-container").style.display = "block";

  const resultsList = document.getElementById("results-list");
  const correctAnswers = quizQuestions.filter((q, index) => userAnswers[index] === q.correctAnswerIndex).length;
  const totalQuestions = quizQuestions.length;
  const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);

  resultsList.innerHTML = `
    <h3>Grade ${currentGradeLevel} ${currentSection} Test Results:</h3>
    <div class="score-container">
      <div class="score-circle">${scorePercentage}%</div>
      <div class="score-details">${correctAnswers} out of ${totalQuestions} correct</div>
    </div>
  `;

  // Create horizontal list of question numbers
  const questionNav = document.createElement("div");
  questionNav.id = "question-nav";
  quizQuestions.forEach((question, index) => {
    const navItem = document.createElement("div");
    navItem.className = "question-nav-item";
    navItem.textContent = index + 1;
    if (userAnswers[index] === question.correctAnswerIndex) {
      navItem.classList.add("correct");
    } else {
      navItem.classList.add("incorrect");
    }
    navItem.onclick = () => reviewQuestion(index);
    questionNav.appendChild(navItem);
  });
  resultsList.appendChild(questionNav);
}

function reviewQuestion(index) {
  isReviewMode = true;
  const question = quizQuestions[index];

  document.getElementById("results-container").style.display = "none";
  document.getElementById("quiz-container").style.display = "block";
  document.getElementById("section").textContent = currentSection;
  document.getElementById("question-number").textContent = index + 1;
  document.getElementById("question").textContent = question.question.question;

  // Handle diagram
  const diagramContainer = document.getElementById("diagram-container");
  if (question.question.diagram) {
    diagramContainer.innerHTML = `<img src="${question.question.diagram}" alt="Question Diagram">`;
    diagramContainer.style.display = "block";
  } else {
    diagramContainer.innerHTML = "";
    diagramContainer.style.display = "none";
  }

  const buttons = document.querySelectorAll(".choice-btn");
  buttons.forEach((button, i) => {
    button.textContent = question.choices[i].text;
    button.classList.remove("selected", "correct", "incorrect");
    button.disabled = true; // Disable the button
    
    if (i === question.correctAnswerIndex) {
      button.classList.add("correct");
    }
    if (i === userAnswers[index]) {
      button.classList.add("selected");
      if (i !== question.correctAnswerIndex) {
        button.classList.add("incorrect");
      }
    }
  });

  // Display explanations
  const explanationsContainer = document.getElementById("explanations-container");
  explanationsContainer.innerHTML = "<h3>Explanations:</h3>";
  question.explanations.forEach((explanation, i) => {
    const explanationDiv = document.createElement("div");
    explanationDiv.innerHTML = `<strong>${String.fromCharCode(65 + i)}:</strong> ${explanation.text}`;
    explanationsContainer.appendChild(explanationDiv);
  });

  // Show "Back to Test Results" button during review
  document.getElementById("back-btn").style.display = "block";
  // Hide "Submit" button during review
  document.getElementById("submit-btn").style.display = "none";

  updateQuestionNav();
}

function backToTestResults() {
  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("results-container").style.display = "block";
}

async function saveTestResults() {
  if (isReviewMode) return;

  const newTest = {
    section: currentSection,
    gradeLevel: currentGradeLevel,
    questions: quizQuestions,
    answers: userAnswers,
    date: new Date().toISOString()
  };

  await fetch('/api/saveTest', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newTest),
  });
}

async function loadPastTests() {
  const response = await fetch('/api/pastTests');
  pastTests = await response.json();
  updatePastTestsDisplay();
}

function updatePastTestsDisplay() {
  const pastTestsContainer = document.getElementById("past-tests-container");
  
  // Group tests by grade and section
  const groupedTests = pastTests.reduce((acc, test, index) => {
    const key = `${test.gradeLevel}-${test.section}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push({...test, index});
    return acc;
  }, {});

  // Create table
  let tableHTML = `
    <table id="past-tests-table">
      <thead>
        <tr>
          <th>Grade</th>
          <th>Section</th>
          <th>Tests</th>
        </tr>
      </thead>
      <tbody>
  `;

  for (const [key, tests] of Object.entries(groupedTests)) {
    const [grade, section] = key.split('-');
    tableHTML += `
      <tr>
        <td>${grade}</td>
        <td>${section}</td>
        <td>
    `;
    
    tests.forEach((test, i) => {
      const date = new Date(test.date).toLocaleString();
      tableHTML += `
        <div class="test-item">
          <button onclick="resumeTest(${test.index})" class="review-btn" title="${date}">
            Test ${i + 1}
          </button>
          <span class="delete-icon" onclick="deleteTest(${test.index})" title="Delete this test">🗑️</span>
        </div>
      `;
    });

    tableHTML += `
        </td>
      </tr>
    `;
  }

  tableHTML += `
      </tbody>
    </table>
  `;

  pastTestsContainer.innerHTML = tableHTML;
}

async function deleteTest(index) {
  if (confirm("Are you sure you want to delete this test?")) {
    await fetch(`/api/deleteTest/${index}`, { method: 'DELETE' });
    loadPastTests(); // Reload the list after deletion
  }
}

function resumeTest(testIndex) {
  const test = pastTests[testIndex];
  quizQuestions = test.questions;
  userAnswers = test.answers;
  currentSection = test.section;
  currentGradeLevel = test.gradeLevel;
  currentQuestionIndex = 0;
  isReviewMode = true;  // Set review mode to true
  
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("results-container").style.display = "block";
  
  showResults();

  updateQuestionNav();
}

function showResults() {
  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("results-container").style.display = "block";

  const resultsList = document.getElementById("results-list");
  const correctAnswers = quizQuestions.filter((q, index) => userAnswers[index] === q.correctAnswerIndex).length;
  const totalQuestions = quizQuestions.length;
  const scorePercentage = Math.round((correctAnswers / totalQuestions) * 100);

  resultsList.innerHTML = `
    <h3>Grade ${currentGradeLevel} ${currentSection} Test Results:</h3>
    <div class="score-container">
      <div class="score-circle">${scorePercentage}%</div>
      <div class="score-details">${correctAnswers} out of ${totalQuestions} correct</div>
    </div>
  `;

  // Create horizontal list of question numbers
  const questionNav = document.createElement("div");
  questionNav.id = "question-nav";
  quizQuestions.forEach((question, index) => {
    const navItem = document.createElement("div");
    navItem.className = "question-nav-item";
    navItem.textContent = index + 1;
    if (userAnswers[index] === question.correctAnswerIndex) {
      navItem.classList.add("correct");
    } else {
      navItem.classList.add("incorrect");
    }
    navItem.onclick = () => reviewQuestion(index);
    questionNav.appendChild(navItem);
  });
  resultsList.appendChild(questionNav);
}

function submitAnswer() {
  if (isReviewMode) {
    backToTestResults();
    return;
  }

  currentQuestionIndex++;
  // Remove the selected class from all buttons
  const buttons = document.querySelectorAll(".choice-btn");
  buttons.forEach(button => button.classList.remove("selected"));

  if (currentQuestionIndex < quizQuestions.length) {
    loadQuestion();
  } else {
    saveTestResults();  // Only save results for new tests
    showResults();
  }
}

function backToMainMenu() {
  document.getElementById("results-container").style.display = "none";
  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("main-menu").style.display = "block";
  document.getElementById("past-tests-container").style.display = "block";
  loadPastTests(); // Reload past tests
}


// Modify your initApp function to include the sync
function initApp() {
  loadPastTests();
  setLastSelectedGrade();
}

function setLastSelectedGrade() {
  const lastGrade = localStorage.getItem('lastSelectedGrade');
  if (lastGrade) {
    document.getElementById('grade-level').value = lastGrade;
  }
}

// Call initApp when the page loads
window.onload = initApp;

function updateQuestionNav() {
  const navContainer = document.getElementById("question-nav");
  navContainer.innerHTML = "";

  quizQuestions.forEach((_, index) => {
    const navItem = document.createElement("div");
    navItem.className = "question-nav-item";
    navItem.textContent = index + 1;

    if (isReviewMode) {
      if (userAnswers[index] === quizQuestions[index].correctAnswerIndex) {
        navItem.classList.add("correct");
      } else {
        navItem.classList.add("incorrect");
      }
      navItem.onclick = () => reviewQuestion(index);
    } else {
      if (index < currentQuestionIndex) {
        navItem.classList.add("completed");
      } else if (index === currentQuestionIndex) {
        navItem.classList.add("current");
      }
    }

    navContainer.appendChild(navItem);
  });
}
