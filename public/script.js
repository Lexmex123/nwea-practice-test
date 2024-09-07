let quizQuestions = [];
let userAnswers = [];
let currentQuestionIndex = 0;
let currentSection = '';
let pastTests = null;
let isReviewMode = false;
let currentGradeLevel = '';
let currentTestIndex = null;
let lastAddedQuestionIndex = -1;

function updateURL(page, params = {}) {
  const url = new URL(window.location);
  url.pathname = `/${page}`;
  
  // Clear all existing parameters
  url.search = '';
  
  // Add new parameters if any
  Object.keys(params).forEach(key => url.searchParams.set(key, params[key]));
  
  history.pushState({}, '', url);
}

function handlePopState() {
  const path = window.location.pathname.slice(1);
  const params = Object.fromEntries(new URLSearchParams(window.location.search));
  
  console.log('Handling route:', path, params);

  loadSavedState();

  switch(path) {
    case '':
    case 'main':
      backToMainMenu();
      break;
    case 'quiz':
      if (params.section && params.grade && quizQuestions && quizQuestions.length > 0) {
        currentSection = params.section;
        currentGradeLevel = params.grade;
        document.getElementById('grade-level').value = params.grade;
        loadQuestion();
      } else {
        backToMainMenu();
      }
      break;
    case 'results':
      console.log('Handling results route', quizQuestions.length, params.test);
      if (quizQuestions.length > 0) {
        showResults(params.test);
      } else if (params.test) {
        loadPastTestResults(params.test);
      } else {
        backToMainMenu();
      }
      break;
    case 'review':
      console.log('Handling review route', quizQuestions.length, params.question);
      if (params.question && params.test && quizQuestions.length > 0) {
        const questionIndex = parseInt(params.question) - 1;
        if (questionIndex >= 0 && questionIndex < quizQuestions.length) {
          reviewQuestion(questionIndex, params.test);
        } else {
          showResults(params.test);
        }
      } else {
        backToMainMenu();
      }
      break;
    default:
      backToMainMenu();
  }
}

async function loadPastTestResults(testIndex) {
  if (pastTests === null) {
    await loadPastTests();
  }
  
  const testId = parseInt(testIndex);
  if (isNaN(testId) || testId < 0 || testId >= pastTests.length) {
    backToMainMenu();
    return;
  }

  const test = pastTests[testId];
  quizQuestions = test.questions;
  userAnswers = test.answers;
  currentSection = test.section;
  currentGradeLevel = test.gradeLevel;
  currentQuestionIndex = 0;
  isReviewMode = true;
  
  currentTestIndex = testId;
  showResults(testId);
  updateQuestionNav();
  saveCurrentState();
}

function loadSavedState() {
  const savedState = localStorage.getItem('quizState');
  console.log('Loading saved state:', savedState);
  if (savedState) {
    const state = JSON.parse(savedState);
    currentQuestionIndex = state.currentQuestionIndex;
    currentSection = state.currentSection;
    currentGradeLevel = state.currentGradeLevel;
    quizQuestions = state.quizQuestions || [];
    userAnswers = state.userAnswers;
    isReviewMode = state.isReviewMode;
    currentTestIndex = state.currentTestIndex;
    console.log('State loaded:', { currentQuestionIndex, currentSection, currentGradeLevel, quizQuestionsLength: quizQuestions.length, userAnswersLength: userAnswers.length, isReviewMode, currentTestIndex });
  } else {
    console.log('No saved state found');
  }
}

async function startNewTest(section) {
  const gradeLevel = document.getElementById("grade-level").value;
  if (!gradeLevel) {
    alert("Please select a grade level before starting the test.");
    return;
  }

  isReviewMode = false;
  currentSection = section;
  currentGradeLevel = gradeLevel;
  
  localStorage.setItem('lastSelectedGrade', currentGradeLevel);
  
  currentQuestionIndex = 0;
  userAnswers = [];
  quizQuestions = [];
  document.getElementById("loading-overlay").style.display = "flex";  
  
  try {
    await fetchNewQuestions(section, gradeLevel);
  } catch (error) {
    console.error("Error starting new test:", error);
    document.getElementById("loading-overlay").style.display = "none";
    alert("Failed to start a new test. Please try again.");
    backToMainMenu();
  }
}

async function fetchNewQuestions(section, gradeLevel) {
  // Reset lastAddedQuestionIndex at the start of fetching new questions
  lastAddedQuestionIndex = -1;

  const response = await fetch("/api/fetchQuestions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      section: section,
      gradeLevel: gradeLevel
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch questions");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let questionCount = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    if (buffer.length) {
      buffer = buffer.replace(/data: /g,"")
      buffer = buffer.replace(/[\n\r]/g,"")
      buffer = buffer.replace(/```/g,"")
      buffer = buffer.replace(/,\s*{\s*\"question\"/g,`{ "question"`)
      const bufferParts = buffer.split(/json\[/);
      if (bufferParts.length>1) buffer = bufferParts[1];
    }
//console.log(buffer.length,buffer)
//if (buffer.length>3000) break;

    while (true) {
      try {
        const result = JSON.parse(buffer);
//console.log('OBJECT FOUND:', result);
        processQuestion(result);
        questionCount++;
        if (questionCount === 1) {
          // Start the test with the first question
          document.getElementById("loading-overlay").style.display = "none";
          updateURL('quiz', { section: section, grade: currentGradeLevel });
          loadQuestion();
          saveCurrentState();
          updateQuestionNav(); // Initial setup of question nav
        } else {
          addNewQuestionToNav(); // Add new question to nav with animation
        }
        buffer = '';
        break;
      } catch (error) {
        // If we can't parse the entire buffer, try to find a complete object
        const lastBracketIndex = buffer.lastIndexOf('}');
        if (lastBracketIndex !== -1) {
          try {
            const possibleObject = buffer.slice(0, lastBracketIndex + 1);
            const result = JSON.parse(possibleObject);
//console.log('POSSIBLE FOUND:', possibleObject)
            processQuestion(result);
            questionCount++;
            if (questionCount === 1) {
              // Start the test with the first question
              document.getElementById("loading-overlay").style.display = "none";
              updateURL('quiz', { section: section, grade: currentGradeLevel });
              loadQuestion();
              saveCurrentState();
              updateQuestionNav(); // Initial setup of question nav
            } else {
              addNewQuestionToNav(); // Add new question to nav with animation
            }
            buffer = buffer.slice(lastBracketIndex + 1);
          } catch (innerError) {
            // If we still can't parse, wait for more data
            break;
          }
        } else {
          // If we don't have a complete object yet, wait for more data
          break;
        }
      }
    }
    
    if (buffer.includes('[DONE]')) {
      console.log('All questions received');
      break;
    }
  }

  // Ensure loading overlay is hidden even if no questions were received
  document.getElementById("loading-overlay").style.display = "none";
}

function processQuestion(questionJson) {
  try {
    console.log('Received question:', questionJson);
    quizQuestions.push(questionJson);
    console.log('Processed question:', questionJson);
  } catch (error) {
    console.error('Error processing question:', error);
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
  if (!quizQuestions || quizQuestions.length === 0) {
    console.error("No questions available to load");
    alert("No questions found. Please try starting a new test.");
    backToMainMenu();
    return;
  }

  const questionData = quizQuestions[currentQuestionIndex];
  console.log(questionData);  // Add this line for debugging

  // Extract quote if present
  const questionText = questionData.question.question;
  const quoteMatch = questionText.match(/\"([^\"]+)\"/);
  
  let displayText = questionText;
  const quoteContainer = document.getElementById("quote-container");
  
  if (quoteMatch) {
    displayText = questionText.replace(quoteMatch[0], '').trim();
    quoteContainer.textContent = quoteMatch[1];
    quoteContainer.style.display = "inline-block";
  } else {
    quoteContainer.style.display = "none";
  }
  
  // Remove <svg> tags from the question text
  displayText = displayText.replace(/<svg[^>]*>|<\/svg>/g, '');

  document.getElementById("section").textContent = currentSection;
  document.getElementById("question").textContent = displayText;
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
  document.getElementById("results-container").style.display = "none";
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

  if (isReviewMode) {
    updateURL('review', { question: currentQuestionIndex + 1, test: currentTestIndex });
  } else {
    updateURL('quiz', { section: currentSection, grade: currentGradeLevel });
  }
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

  // Update the navigation to enable the next button
  updateQuestionNav();

  saveCurrentState();
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
    saveTestResults().then(() => {
      showResults();
    });
  }

  saveCurrentState();
}

function showResults(testIndex) {
  console.log('Showing results');
  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("results-container").style.display = "block";
  document.getElementById("main-menu").style.display = "none";

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
  const questionNavWrapper = document.createElement("div");
  questionNavWrapper.className = "question-nav-wrapper";
  quizQuestions.forEach((question, index) => {
    const navItem = document.createElement("div");
    navItem.className = "question-nav-item";
    navItem.textContent = index + 1;
    if (userAnswers[index] === question.correctAnswerIndex) {
      navItem.classList.add("correct");
    } else {
      navItem.classList.add("incorrect");
    }
    navItem.onclick = () => reviewQuestion(index, currentTestIndex);
    questionNavWrapper.appendChild(navItem);
  });
  questionNav.appendChild(questionNavWrapper);
  resultsList.appendChild(questionNav);

  updateURL('results', { test: currentTestIndex });
  updateQuestionNav();
}

function reviewQuestion(index, testIndex) {
  isReviewMode = true;
  currentQuestionIndex = index;
  currentTestIndex = testIndex;  // Make sure to set this
  const question = quizQuestions[index];

  // Hide all other views
  document.getElementById("results-container").style.display = "none";
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("quiz-container").style.display = "block";

  document.getElementById("section").textContent = currentSection;
  document.getElementById("question-number").textContent = index + 1;

  // Handle quote
  const questionText = question.question.question;
  const quoteMatch = questionText.match(/\"([^\"]+)\"/);
  const quoteContainer = document.getElementById("quote-container");
  
  if (quoteMatch) {
    const displayText = questionText.replace(quoteMatch[0], '').trim();
    document.getElementById("question").textContent = displayText;
    quoteContainer.textContent = quoteMatch[1];
    quoteContainer.style.display = "inline-block";
  } else {
    document.getElementById("question").textContent = questionText;
    quoteContainer.textContent = "";
    quoteContainer.style.display = "none";
  }

  // Handle diagram
  const diagramContainer = document.getElementById("diagram-container");
  if (question.question.diagram) {
    diagramContainer.innerHTML = `${question.question.diagram}`;
    diagramContainer.style.display = "block";
  } else {
    diagramContainer.innerHTML = "";
    diagramContainer.style.display = "none";
  }

  const buttons = document.querySelectorAll(".choice-btn");
  buttons.forEach((button, i) => {
    button.textContent = question.choices[i].text;
    button.classList.remove("selected", "correct", "incorrect");
    button.disabled = true; // Disable the button in review mode
    
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

  updateURL('review', { question: index + 1, test: testIndex });
}

function backToTestResults() {
  showResults(currentTestIndex);
}

function resumeTest(testIndex) {
  const test = pastTests[testIndex];
  quizQuestions = test.questions;
  userAnswers = test.answers;
  currentSection = test.section;
  currentGradeLevel = test.gradeLevel;
  currentQuestionIndex = 0;
  isReviewMode = true;
  
  document.getElementById("main-menu").style.display = "none";
  document.getElementById("results-container").style.display = "block";
  
  currentTestIndex = testIndex;
  showResults(testIndex);
  updateQuestionNav();
  saveCurrentState();
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

  console.log('Attempting to save test:', newTest);

  try {
    const response = await fetch('/api/saveTest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newTest),
    });

    if (!response.ok) {
      throw new Error('Failed to save test results');
    }

    const result = await response.json();
    console.log('Test saved successfully:', result);

    await refreshPastTests();
    console.log('Past tests refreshed, new count:', pastTests.length);

    currentTestIndex = pastTests.length - 1;
    console.log('Current test index set to:', currentTestIndex);

  } catch (error) {
    console.error('Error saving test results:', error);
    alert('Failed to save test results. Please try again.');
  }
}

async function refreshPastTests() {
  console.log('Refreshing past tests');
  const response = await fetch('/api/pastTests');
  pastTests = await response.json();
  updatePastTestsDisplay();
}

async function loadPastTests() {
  try {
    console.log('Fetching past tests from API');
    const response = await fetch('/api/pastTests');
    if (!response.ok) {
      throw new Error('Failed to fetch past tests');
    }
    pastTests = await response.json();
    updatePastTestsDisplay();
  } catch (error) {
    console.error('Error loading past tests:', error);
    pastTests = [];
    updatePastTestsDisplay();
  }
}

function updatePastTestsDisplay() {
  const pastTestsContainer = document.getElementById("past-tests-container");
  
  if (!pastTests || pastTests.length === 0) {
    pastTestsContainer.innerHTML = "<p>No past tests available.</p>";
    return;
  }

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

  // Sort grades in ascending order
  const sortedGrades = Object.keys(groupedTests).sort((a, b) => {
    const gradeA = parseInt(a.split('-')[0]);
    const gradeB = parseInt(b.split('-')[0]);
    return gradeA - gradeB;
  });

  sortedGrades.forEach(key => {
    const [grade, section] = key.split('-');
    const tests = groupedTests[key];

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
  });

  tableHTML += `
      </tbody>
    </table>
  `;

  pastTestsContainer.innerHTML = tableHTML;
}

async function deleteTest(index) {
  if (confirm("Are you sure you want to delete this test?")) {
    try {
      const testId = pastTests[index].id;
      const response = await fetch(`/api/deleteTest/${testId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete test');
      }
      pastTests.splice(index, 1);
      updatePastTestsDisplay(); // Update display without fetching again
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('Failed to delete the test. Please try again.');
    }
  }
}

function backToMainMenu() {
  console.log('Back to main menu');
  document.getElementById("results-container").style.display = "none";
  document.getElementById("quiz-container").style.display = "none";
  document.getElementById("main-menu").style.display = "block";
  document.getElementById("past-tests-container").style.display = "block";
  
  // Reset state variables
  currentQuestionIndex = 0;
  quizQuestions = [];
  userAnswers = [];
  isReviewMode = false;
  currentTestIndex = null;
  
  updatePastTestsDisplay();
  updateURL('main');
  
  // Clear the saved state in localStorage
  localStorage.removeItem('quizState');
}

function saveCurrentState() {
  const state = {
    currentQuestionIndex,
    currentSection,
    currentGradeLevel,
    quizQuestions: quizQuestions || [],
    userAnswers,
    isReviewMode,
    currentTestIndex
  };
  localStorage.setItem('quizState', JSON.stringify(state));
  console.log('State saved:', state);
}

// Modify your initApp function to include the sync
function initApp() {
  console.log('Initializing app');
  loadPastTests().catch(error => {
    console.error('Error in initApp:', error);
    pastTests = [];
    updatePastTestsDisplay();
  });
  setLastSelectedGrade();
  window.addEventListener('popstate', handlePopState);
  handlePopState(); // Handle initial URL
}

function setLastSelectedGrade() {
  const lastGrade = localStorage.getItem('lastSelectedGrade');
  if (lastGrade) {
    document.getElementById('grade-level').value = lastGrade;
  }
}

// Call initApp when the page loads
window.onload = initApp;

// Add this function to create and update the question navigation
function updateQuestionNav() {
  const navContainer = document.getElementById("question-nav");
  navContainer.innerHTML = "";

  // Add Previous button
  const prevButton = document.createElement("button");
  prevButton.textContent = "◀ Prev";
  prevButton.className = "nav-button prev-button";
  prevButton.onclick = () => navigateQuestion(-1);
  prevButton.disabled = currentQuestionIndex === 0;
  navContainer.appendChild(prevButton);

  // Question navigation items
  const questionNavWrapper = document.createElement("div");
  questionNavWrapper.className = "question-nav-wrapper";
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
      if (index === currentQuestionIndex) {
        navItem.classList.add("current");
      }
      navItem.onclick = () => reviewQuestion(index, currentTestIndex);
    } else {
      if (index < currentQuestionIndex) {
        navItem.classList.add("completed");
      } else if (index === currentQuestionIndex) {
        navItem.classList.add("current");
      }
      if (index <= currentQuestionIndex) {
        navItem.onclick = () => navigateQuestion(index - currentQuestionIndex);
      } else {
        navItem.classList.add("disabled");
      }
    }

    questionNavWrapper.appendChild(navItem);
  });
  navContainer.appendChild(questionNavWrapper);

  // Add Next button
  const nextButton = document.createElement("button");
  nextButton.textContent = "Next ▶";
  nextButton.className = "nav-button next-button";
  nextButton.onclick = () => navigateQuestion(1);
  nextButton.disabled = currentQuestionIndex === quizQuestions.length - 1 || 
                        userAnswers[currentQuestionIndex] === undefined;
  navContainer.appendChild(nextButton);
}

function createNavItem(index) {
  const navItem = document.createElement("div");
  navItem.className = "question-nav-item";
  navItem.textContent = index + 1;

  if (isReviewMode) {
    if (userAnswers[index] === quizQuestions[index].correctAnswerIndex) {
      navItem.classList.add("correct");
    } else {
      navItem.classList.add("incorrect");
    }
    if (index === currentQuestionIndex) {
      navItem.classList.add("current");
    }
    navItem.onclick = () => reviewQuestion(index, currentTestIndex);
  } else {
    if (index < currentQuestionIndex) {
      navItem.classList.add("completed");
    } else if (index === currentQuestionIndex) {
      navItem.classList.add("current");
    }
    if (index <= currentQuestionIndex) {
      navItem.onclick = () => navigateQuestion(index - currentQuestionIndex);
    } else {
      navItem.classList.add("disabled");
    }
  }

  return navItem;
}

function navigateQuestion(direction) {
  const newIndex = currentQuestionIndex + direction;
  if (newIndex >= 0 && newIndex < quizQuestions.length) {
    if (isReviewMode) {
      reviewQuestion(newIndex, currentTestIndex);
    } else {
      // Only allow forward navigation if the current question is answered
      if (direction > 0 && userAnswers[currentQuestionIndex] === undefined) {
        alert("Please answer the current question before moving to the next one.");
        return;
      }
      currentQuestionIndex = newIndex;
      loadQuestion();
    }
  }
}

function addNewQuestionToNav() {
  const navWrapper = document.querySelector(".question-nav-wrapper");
  if (navWrapper && quizQuestions.length > lastAddedQuestionIndex + 1) {
    const newIndex = lastAddedQuestionIndex + 1;
    const newNavItem = createNavItem(newIndex);
    newNavItem.classList.add("new-question");
    navWrapper.appendChild(newNavItem);
    lastAddedQuestionIndex = newIndex;

    // Remove the "new-question" class after the animation
    setTimeout(() => {
      newNavItem.classList.remove("new-question");
    }, 500); // 500ms matches the animation duration
  }
}

function addNewQuestionToNav() {
  const navWrapper = document.querySelector(".question-nav-wrapper");
  if (navWrapper && quizQuestions.length > lastAddedQuestionIndex + 1) {
    const newIndex = lastAddedQuestionIndex + 1;
    const newNavItem = createNavItem(newIndex);
    newNavItem.classList.add("new-question");
    navWrapper.appendChild(newNavItem);
    lastAddedQuestionIndex = newIndex;

    // Remove the "new-question" class after the animation
    setTimeout(() => {
      newNavItem.classList.remove("new-question");
    }, 500); // 500ms matches the animation duration
  }
}

function navigateQuestion(direction) {
  const newIndex = currentQuestionIndex + direction;
  if (newIndex >= 0 && newIndex < quizQuestions.length) {
    // Only allow forward navigation if the current question is answered
    if (direction > 0 && userAnswers[currentQuestionIndex] === undefined) {
      alert("Please answer the current question before moving to the next one.");
      return;
    }
    currentQuestionIndex = newIndex;
    loadQuestion();
  }
}

function goHome() {
  if (confirm("Are you sure you want to go back to the main menu? Any unsaved progress will be lost.")) {
    backToMainMenu();
  }
}