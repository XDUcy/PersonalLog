// DOM Elements
const topicInput = document.getElementById('topic-input');
const startButton = document.getElementById('start-button');
const viewAllLink = document.getElementById('view-all-link');
const homeLogCards = document.getElementById('home-log-cards');

const focusMode = document.getElementById('focus-mode');
const focusTopic = document.getElementById('focus-topic');
const focusTime = document.getElementById('focus-time');
const focusTimer = document.getElementById('focus-timer');
const pauseButton = document.getElementById('pause-button');
const abortButton = document.getElementById('abort-button');
const doneButton = document.getElementById('done-button');

const reviewModal = document.getElementById('review-modal');
const reviewTextarea = document.getElementById('review-textarea');
const cancelReview = document.getElementById('cancel-review');
const saveReview = document.getElementById('save-review');

const historyPage = document.getElementById('history-page');
const backToHome = document.getElementById('back-to-home');
const historyList = document.getElementById('history-list');
const prevPage = document.getElementById('prev-page');
const nextPage = document.getElementById('next-page');
const paginationInfo = document.getElementById('pagination-info');

const detailPage = document.getElementById('detail-page');
const backToHistory = document.getElementById('back-to-history');
const backToHistoryBottom = document.getElementById('back-to-history-bottom');
const detailContent = document.getElementById('detail-content');

// App State
const state = {
    page: 'home', // home, focus, history, detail
    timer: {
        status: 'stopped', // stopped, running, paused
        startTime: null,
        pauseTime: null,
        totalPausedTime: 0,
        interval: null,
        seconds: 0
    },
    currentSession: {
        topic: '',
        startTime: null,
        endTime: null,
        durationSeconds: 0,
        markdown: ''
    },
    history: {
        records: [],
        currentPage: 1,
        perPage: 20,
        totalPages: 1
    },
    detailId: null
};

// Initialize the app
function init() {
    loadHistoryFromLocalStorage();
    renderHomeHistory();
    addEventListeners();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
}

// Event Listeners
function addEventListeners() {
    // Home Page
    topicInput.addEventListener('input', function () {
        startButton.disabled = !this.value.trim();
    });

    startButton.addEventListener('click', startFocus);
    viewAllLink.addEventListener('click', navigateToHistory);

    // Focus Mode
    pauseButton.addEventListener('click', togglePause);
    abortButton.addEventListener('click', confirmAbort);
    doneButton.addEventListener('click', finishFocus);

    // Review Modal
    cancelReview.addEventListener('click', cancelReviewAction);
    saveReview.addEventListener('click', saveReviewAction);

    // Handle Ctrl+Enter / Cmd+Enter in review textarea
    reviewTextarea.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            saveReviewAction();
        }
    });

    // History Page
    backToHome.addEventListener('click', navigateToHome);
    prevPage.addEventListener('click', goToPrevPage);
    nextPage.addEventListener('click', goToNextPage);

    // Detail Page
    backToHistory.addEventListener('click', navigateToHistory);
    backToHistoryBottom.addEventListener('click', navigateToHistory);

    // Global keyboard shortcuts
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && reviewModal.style.display === 'flex') {
            cancelReviewAction();
        }
    });
}

// Navigation Functions
function navigateToHome() {
    state.page = 'home';
    document.querySelector('.home-page').style.display = 'block';
    historyPage.style.display = 'none';
    detailPage.style.display = 'none';
    renderHomeHistory();
    return false;
}

function navigateToHistory() {
    state.page = 'history';
    document.querySelector('.home-page').style.display = 'none';
    historyPage.style.display = 'block';
    detailPage.style.display = 'none';
    renderHistoryPage();
    return false;
}

function navigateToDetail(id) {
    state.page = 'detail';
    state.detailId = id;
    document.querySelector('.home-page').style.display = 'none';
    historyPage.style.display = 'none';
    detailPage.style.display = 'block';
    renderDetailPage();
    return false;
}

// Timer Functions
function startFocus() {
    state.currentSession = {
        topic: topicInput.value.trim(),
        startTime: new Date(),
        endTime: null,
        durationSeconds: 0,
        markdown: ''
    };

    state.timer = {
        status: 'running',
        startTime: new Date(),
        pauseTime: null,
        totalPausedTime: 0,
        interval: setInterval(updateTimer, 1000),
        seconds: 0
    };

    focusTopic.textContent = state.currentSession.topic;
    document.querySelector('.home-page').style.display = 'none';
    focusMode.style.display = 'flex';
    state.page = 'focus';
    updateTimer();
}

function updateTimer() {
    if (state.timer.status === 'running') {
        const now = new Date();
        const elapsedMilliseconds = now - state.timer.startTime - state.timer.totalPausedTime;
        state.timer.seconds = Math.floor(elapsedMilliseconds / 1000);
        focusTimer.textContent = formatTime(state.timer.seconds);
    }
}

function togglePause() {
    if (state.timer.status === 'running') {
        clearInterval(state.timer.interval);
        state.timer.status = 'paused';
        state.timer.pauseTime = new Date();
        pauseButton.textContent = 'RESUME';
    } else if (state.timer.status === 'paused') {
        const now = new Date();
        state.timer.totalPausedTime += now - state.timer.pauseTime;
        state.timer.pauseTime = null;
        state.timer.status = 'running';
        state.timer.interval = setInterval(updateTimer, 1000);
        pauseButton.textContent = 'PAUSE';
        updateTimer();
    }
}

function confirmAbort() {
    if (confirm('Are you sure you want to abort this session? All progress will be lost.')) {
        abortFocus();
    }
}

function abortFocus() {
    clearInterval(state.timer.interval);
    state.timer.status = 'stopped';
    state.currentSession = {
        topic: '',
        startTime: null,
        endTime: null,
        durationSeconds: 0,
        markdown: ''
    };

    focusMode.style.display = 'none';
    document.querySelector('.home-page').style.display = 'block';
    state.page = 'home';
    topicInput.value = '';
    startButton.disabled = true;
}

function finishFocus() {
    if (state.timer.status === 'running' || state.timer.status === 'paused') {
        clearInterval(state.timer.interval);
        state.timer.status = 'stopped';
        state.currentSession.endTime = new Date();
        state.currentSession.durationSeconds = state.timer.seconds;

        // Show review modal
        reviewTextarea.value = '';
        reviewModal.style.display = 'flex';
    }
}

function cancelReviewAction() {
    reviewModal.style.display = 'none';
    abortFocus();
}

function saveReviewAction() {
    state.currentSession.markdown = reviewTextarea.value.trim();

    // Generate unique ID for the record
    const id = Date.now().toString();

    // Create record object
    const record = {
        id: id,
        topic: state.currentSession.topic,
        start: state.currentSession.startTime.toISOString(),
        end: state.currentSession.endTime.toISOString(),
        durationSeconds: state.currentSession.durationSeconds,
        markdown: state.currentSession.markdown
    };

    // Add to history
    state.history.records.unshift(record);

    // Save to localStorage
    saveHistoryToLocalStorage();

    // Close modal and navigate to home
    reviewModal.style.display = 'none';
    focusMode.style.display = 'none';
    document.querySelector('.home-page').style.display = 'block';
    state.page = 'home';

    // Reset input
    topicInput.value = '';
    startButton.disabled = true;

    // Render updated history
    renderHomeHistory();
}

// History Functions
function loadHistoryFromLocalStorage() {
    try {
        const storedData = localStorage.getItem('focuslog-records');
        if (storedData) {
            state.history.records = JSON.parse(storedData);
        } else {
            // Initialize with sample data if empty
            state.history.records = getSampleData();
            saveHistoryToLocalStorage();
        }
    } catch (error) {
        console.error('Error loading history:', error);
        state.history.records = getSampleData();
    }

    updatePagination();
}

function saveHistoryToLocalStorage() {
    try {
        localStorage.setItem('focuslog-records', JSON.stringify(state.history.records));
    } catch (error) {
        console.error('Error saving history:', error);
        alert('Failed to save your learning record. Local storage might be full or disabled.');
    }

    updatePagination();
}

function updatePagination() {
    state.history.totalPages = Math.max(1, Math.ceil(state.history.records.length / state.history.perPage));
    state.history.currentPage = Math.min(state.history.currentPage, state.history.totalPages);

    paginationInfo.textContent = `Page ${state.history.currentPage} of ${state.history.totalPages}`;
    prevPage.disabled = state.history.currentPage <= 1;
    nextPage.disabled = state.history.currentPage >= state.history.totalPages;
}

function goToPrevPage() {
    if (state.history.currentPage > 1) {
        state.history.currentPage--;
        renderHistoryPage();
    }
}

function goToNextPage() {
    if (state.history.currentPage < state.history.totalPages) {
        state.history.currentPage++;
        renderHistoryPage();
    }
}

// Rendering Functions
function renderHomeHistory() {
    const records = state.history.records.slice(0, 10);

    if (records.length === 0) {
        homeLogCards.innerHTML = `
            <div class="empty-state">
                No logs yet. Start your first session!
            </div>
        `;
        return;
    }

    homeLogCards.innerHTML = records.map(record => createLogCardHTML(record)).join('');

    // Add click event to cards
    document.querySelectorAll('.log-card').forEach(card => {
        card.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            navigateToDetail(id);
        });
    });
}

function renderHistoryPage() {
    const startIdx = (state.history.currentPage - 1) * state.history.perPage;
    const endIdx = Math.min(startIdx + state.history.perPage, state.history.records.length);
    const pageRecords = state.history.records.slice(startIdx, endIdx);

    updatePagination();

    if (pageRecords.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                No logs yet. Start your first session!
            </div>
        `;
        return;
    }

    historyList.innerHTML = pageRecords.map(record => createLogCardHTML(record)).join('');

    // Add click event to cards
    document.querySelectorAll('.log-card').forEach(card => {
        card.addEventListener('click', function () {
            const id = this.getAttribute('data-id');
            navigateToDetail(id);
        });
    });
}

function renderDetailPage() {
    const record = state.history.records.find(r => r.id === state.detailId);

    if (!record) {
        detailContent.innerHTML = `
            <div class="empty-state">
                Record not found.
            </div>
        `;
        return;
    }

    const startDate = new Date(record.start);
    const endDate = new Date(record.end);

    detailContent.innerHTML = `
        <div class="detail-header">
            <h1 class="detail-title">${escapeHTML(record.topic)}</h1>
            <div class="detail-meta">
                <div>Duration: ${formatTime(record.durationSeconds)}</div>
                <div>${formatDate(startDate)}</div>
            </div>
        </div>
        <div class="detail-body">
            ${renderMarkdown(record.markdown)}
        </div>
    `;
}

function createLogCardHTML(record) {
    const startDate = new Date(record.start);
    const preview = record.markdown.substring(0, 100) + (record.markdown.length > 100 ? '...' : '');

    return `
        <div class="log-card" data-id="${record.id}">
            <div class="log-header">[${formatDate(startDate)}]</div>
            <div class="log-title">${escapeHTML(record.topic)}</div>
            <div class="log-content">${escapeHTML(preview)}</div>
            <div class="log-meta">
                <div>Duration: ${formatTime(record.durationSeconds)}</div>
                <div>Click to view details</div>
            </div>
        </div>
    `;
}

// Utility Functions
function updateCurrentTime() {
    const now = new Date();
    focusTime.textContent = now.toLocaleTimeString();
}

function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        secs.toString().padStart(2, '0')
    ].join(':');
}

function formatDate(date) {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function escapeHTML(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function renderMarkdown(markdown) {
    // Very simple Markdown renderer for demo purposes
    // In a real app, use a proper Markdown library

    if (!markdown) return '<p>No notes recorded.</p>';

    let html = markdown
        // Convert headers
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')

        // Convert bold and italic
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')

        // Convert code blocks
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')

        // Convert inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')

        // Convert lists
        .replace(/^\s*\*\s(.*$)/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>')

        // Convert paragraphs
        .replace(/^\s*(\n)?([^\n]+)(\n)?$/gm, function (m) {
            if (m.match(/^<(\/)?(h1|h2|h3|ul|li|pre|code)[\s>]/)) {
                return m;
            }
            return '<p>' + m.trim() + '</p>';
        })

        // Fix nested lists
        .replace(/<\/ul>\s*<ul>/g, '');

    return html;
}

// Sample data for initial state
function getSampleData() {
    const now = new Date();

    return [
        {
            id: '1',
            topic: 'JavaScript Closures',
            start: new Date(now - 86400000).toISOString(), // 1 day ago
            end: new Date(now - 86400000 + 3600000).toISOString(),
            durationSeconds: 3600,
            markdown: `# JavaScript Closures\n\nA closure is the combination of a function bundled together with references to its surrounding state (the lexical environment).\n\n## Key Points\n\n* Closures are created every time a function is created, at function creation time\n* A closure lets you access variables from an outer function even after the outer function has finished executing\n\n## Example\n\n\`\`\`javascript\nfunction createCounter() {\n  let count = 0;\n  return function() {\n    count++;\n    return count;\n  };\n}\n\nconst counter = createCounter();\nconsole.log(counter()); // 1\nconsole.log(counter()); // 2\n\`\`\`\n\nThe inner function has access to the variables in the outer function scope, even after the outer function has returned.`
        },
        {
            id: '2',
            topic: 'Python Decorators',
            start: new Date(now - 172800000).toISOString(), // 2 days ago
            end: new Date(now - 172800000 + 4500000).toISOString(),
            durationSeconds: 4500,
            markdown: `# Python Decorators\n\nDecorators are a powerful and expressive feature in Python that allow you to modify the behavior of functions or classes.\n\n## Key Concepts\n\n* Decorators are functions that take another function as an argument and extend its behavior\n* They use the @decorator syntax above the function definition\n* Common uses include logging, timing, access control, and caching\n\n## Example\n\n\`\`\`python\ndef timing_decorator(func):\n    def wrapper(*args, **kwargs):\n        import time\n        start_time = time.time()\n        result = func(*args, **kwargs)\n        end_time = time.time()\n        print(f"Function {func.__name__} took {end_time - start_time:.2f} seconds to run")\n        return result\n    return wrapper\n\n@timing_decorator\ndef slow_function():\n    import time\n    time.sleep(1)\n    return "Function completed"\n\nslow_function()  # Will print timing information\n\`\`\``
        }
    ];
}

// Initialize the app
init();


