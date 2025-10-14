// --- 1. Global Variables and Initial Data Setup ---

const ADMIN_USER = 'gopal@1234';
const ADMIN_PASS = 'babli33@33'; // Admin login credentials
const DEFAULT_Q_COUNT = 40;
const DEFAULT_Q_TIME_SEC = 900; // 15 minutes (15 * 60)
const Q_MARK = 1;

let studentName = '';
let currentSet = '';
let currentQuestionIndex = 0;
let userAnswers = {}; // { questionIndex: selectedOptionLabel }
let quizTimerInterval;
let quizRemainingTime = DEFAULT_Q_TIME_SEC; // In seconds

// Sample Question and Answer Key (Used for all 3 sets for simplicity)
// In a real application, this would be fetched from a backend database.
function createQuestion(index) {
    return {
        questionNo: index + 1,
        text: `This is Question No. ${index + 1} for Set ${currentSet}.`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'A' // Dummy correct answer for marking
    };
}

// Generate 40 questions dynamically
const QUESTIONS = Array.from({ length: DEFAULT_Q_COUNT }, (_, i) => createQuestion(i));

// Load Admin settings and Results from Local Storage
let adminSettings = JSON.parse(localStorage.getItem('adminSettings')) || {
    questionCount: DEFAULT_Q_COUNT,
    quizTime: DEFAULT_Q_TIME_SEC,
};
let studentResults = JSON.parse(localStorage.getItem('studentResults')) || [];


// --- 2. Utility Functions (Show/Hide Screens) ---

function showScreen(screenId) {
    document.querySelectorAll('section').forEach(section => {
        section.classList.add('hidden-section');
    });
    document.getElementById(screenId).classList.remove('hidden-section');

    // Update Navbar Active state
    document.querySelectorAll('.nav-links a').forEach(link => link.classList.remove('active'));
    if (screenId === 'home-screen' || screenId === 'quiz-screen' || screenId === 'result-screen') {
        document.getElementById('home-link').classList.add('active');
    } else if (screenId === 'admin-login-screen' || screenId === 'admin-panel') {
        document.getElementById('admin-link').classList.add('active');
    }
}

function updateLiveDate() {
    const now = new Date();
    document.getElementById('live-date').textContent = now.toLocaleString();
}
setInterval(updateLiveDate, 1000); // Live date update every second
updateLiveDate(); // Initial call


// --- 3. Home Screen Logic ---

document.querySelectorAll('.set-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        studentName = document.getElementById('student-name').value.trim();
        if (studentName.length < 3) {
            alert("Kripya apna pura naam dalen (Please enter your full name).");
            return;
        }

        currentSet = e.target.getAttribute('data-set');
        currentQuestionIndex = 0;
        userAnswers = {}; // Reset answers
        quizRemainingTime = adminSettings.quizTime; // Reset time

        document.getElementById('quiz-welcome-heading').textContent = `Welcome to Set ${currentSet}`;

        startQuiz();
    });
});

document.getElementById('back-to-home').addEventListener('click', () => {
    showScreen('home-screen');
    // Clear student name field
    document.getElementById('student-name').value = ''; 
});


// --- 4. Quiz Logic ---

function startQuiz() {
    showScreen('quiz-screen');
    loadQuestion(currentQuestionIndex);
    startQuizTimer();
}

function loadQuestion(index) {
    const qCount = adminSettings.questionCount;
    if (index >= qCount) {
        submitTest();
        return;
    }

    currentQuestionIndex = index;
    const question = createQuestion(index); // Use the question factory
    const display = document.getElementById('question-display');
    display.innerHTML = `
        <p class="question-text">Question No. ${question.questionNo}: ${question.text}</p>
        <ul class="options-list">
            ${question.options.map((opt, i) => `
                <li class="option-item" data-option="${String.fromCharCode(65 + i)}">
                    <span class="option-label">${String.fromCharCode(65 + i)}.</span> ${opt}
                </li>
            `).join('')}
        </ul>
    `;

    // Highlight selected answer (if any)
    const selected = userAnswers[index];
    if (selected) {
        document.querySelector(`.option-item[data-option="${selected}"]`).classList.add('selected');
    }

    // Attach click listeners to options
    document.querySelectorAll('.option-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const option = e.currentTarget.getAttribute('data-option');
            userAnswers[index] = option;
            document.querySelectorAll('.option-item').forEach(o => o.classList.remove('selected'));
            e.currentTarget.classList.add('selected');
        });
    });

    // Update navigation buttons
    const nextBtn = document.getElementById('next-submit-btn');
    const prevBtn = document.getElementById('prev-btn');

    // Previous button logic
    prevBtn.disabled = index === 0;

    // Next/Submit button logic
    if (index === qCount - 1) {
        nextBtn.textContent = 'Submit';
        nextBtn.classList.add('submit-btn');
    } else {
        nextBtn.textContent = 'Next';
        nextBtn.classList.remove('submit-btn');
    }
}

document.getElementById('next-submit-btn').addEventListener('click', () => {
    const qCount = adminSettings.questionCount;
    if (currentQuestionIndex === qCount - 1) {
        submitTest();
    } else {
        loadQuestion(currentQuestionIndex + 1);
    }
});

document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
        loadQuestion(currentQuestionIndex - 1);
    }
});

function startQuizTimer() {
    clearInterval(quizTimerInterval);
    const timerDisplay = document.getElementById('quiz-timer');

    quizTimerInterval = setInterval(() => {
        if (quizRemainingTime <= 0) {
            clearInterval(quizTimerInterval);
            alert("Time's up! Your test will now be submitted automatically.");
            submitTest();
            return;
        }

        quizRemainingTime--;
        const minutes = Math.floor(quizRemainingTime / 60);
        const seconds = quizRemainingTime % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}


// --- 5. Submission and Result Logic ---

function submitTest() {
    clearInterval(quizTimerInterval);

    const totalQuestions = adminSettings.questionCount;
    let attempted = 0;
    let correctAnswers = 0; // The actual score calculation

    for (let i = 0; i < totalQuestions; i++) {
        const userAnswer = userAnswers[i];
        if (userAnswer) {
            attempted++;
            // Dummy check: Always true if answer is 'A' (as per dummy data)
            const question = createQuestion(i);
            if (userAnswer === question.correctAnswer) {
                correctAnswers += Q_MARK;
            }
        }
    }

    const nonAttempted = totalQuestions - attempted;
    const maxScore = totalQuestions * Q_MARK;

    // Save Result
    const result = {
        name: studentName,
        set: currentSet,
        date: new Date().toLocaleString(),
        score: correctAnswers,
        totalQ: totalQuestions,
        attemptedQ: attempted,
        nonAttemptedQ: nonAttempted,
    };
    studentResults.push(result);
    localStorage.setItem('studentResults', JSON.stringify(studentResults));

    // Display Result
    document.getElementById('total-q').textContent = totalQuestions;
    document.getElementById('attempted-q').textContent = attempted;
    document.getElementById('non-attempted-q').textContent = nonAttempted;
    document.getElementById('final-score').textContent = correctAnswers;
    document.getElementById('max-score').textContent = maxScore;

    showScreen('result-screen');
}


// --- 6. Admin Panel Logic ---

document.getElementById('admin-link').addEventListener('click', (e) => {
    e.preventDefault();
    if (document.getElementById('admin-panel').classList.contains('hidden-section')) {
        showScreen('admin-login-screen');
    } else {
        // If already logged in, show panel
        showScreen('admin-panel');
    }
});

document.getElementById('home-link').addEventListener('click', (e) => {
    e.preventDefault();
    showScreen('home-screen');
});

document.getElementById('admin-login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('admin-username').value;
    const password = document.getElementById('admin-password').value;

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        showScreen('admin-panel');
        // Load current settings into inputs
        document.getElementById('q-quantity').value = adminSettings.questionCount;
        document.getElementById('q-time').value = adminSettings.quizTime;
        document.getElementById('admin-login-form').reset();
    } else {
        alert('Invalid Login ID or Password');
    }
});

function saveAdminSettings(type) {
    if (type === 'quantity') {
        const newCount = parseInt(document.getElementById('q-quantity').value);
        if (newCount > 0) {
            adminSettings.questionCount = newCount;
            alert(`Question Quantity set to ${newCount}. (Restart App to use new count)`);
        }
    } else if (type === 'time') {
        const newTime = parseInt(document.getElementById('q-time').value);
        if (newTime >= 60) {
            adminSettings.quizTime = newTime;
            alert(`Quiz Time set to ${newTime} seconds. (Restart App to use new time)`);
        } else {
             alert('Time must be at least 60 seconds.');
        }
    }
    localStorage.setItem('adminSettings', JSON.stringify(adminSettings));
}


// --- 7. Admin Result Table Logic ---

const resultSection = document.getElementById('student-result-section');
document.getElementById('student-result-btn').addEventListener('click', () => {
    resultSection.classList.toggle('hidden-section');
    if (!resultSection.classList.contains('hidden-section')) {
        renderResultsTable(studentResults);
    }
});

document.getElementById('student-search').addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredResults = studentResults.filter(r => 
        r.name.toLowerCase().includes(searchTerm)
    );
    renderResultsTable(filteredResults);
});

function renderResultsTable(results) {
    const tableBody = document.getElementById('result-table-body');
    tableBody.innerHTML = ''; // Clear previous data

    if (results.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No results found.</td></tr>';
        return;
    }

    results.forEach(result => {
        const row = tableBody.insertRow();
        row.insertCell().textContent = result.name;
        row.insertCell().textContent = result.set;
        row.insertCell().textContent = result.date;
        row.insertCell().textContent = `${result.score} / ${result.totalQ}`;
    });
}

document.getElementById('clear-data-btn').addEventListener('click', () => {
    if (confirm("Are you sure you want to clear ALL student results? This action is permanent.")) {
        studentResults = [];
        localStorage.removeItem('studentResults');
        renderResultsTable(studentResults);
        alert("All student data cleared.");
    }
});

// Initial load: show home screen

showScreen('home-screen');

