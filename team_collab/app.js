// --- State Management ---
let currentUser = null;
let geminiKey = '';
const STATE = {
    tasks: [],
    draggedTask: null
};

// --- DOM Elements ---
const views = {
    auth: document.getElementById('auth-view'),
    dashboard: document.getElementById('dashboard-view')
};

const authForm = document.getElementById('login-form');
const userNameEl = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');

// Kanban Elements
const columns = document.querySelectorAll('.column');
const taskLists = {
    todo: document.getElementById('list-todo'),
    'in-progress': document.getElementById('list-in-progress'),
    review: document.getElementById('list-review'),
    done: document.getElementById('list-done')
};

// Modal Elements
const taskModal = document.getElementById('task-modal');
const taskForm = document.getElementById('task-form');
const newTaskBtn = document.getElementById('new-task-btn');
const closeModalBtn = document.querySelector('.close-modal');

// Assistant Elements
const toggleAssistantBtn = document.getElementById('toggle-assistant');
const assistantPanel = document.getElementById('assistant-panel');
const closeAssistantBtn = document.getElementById('close-assistant');
const assistantMessages = document.getElementById('assistant-messages');
const assistantQuery = document.getElementById('assistant-query');
const sendQueryBtn = document.getElementById('send-query');

// --- Initialization ---
function init() {
    setupEventListeners();
    
    // Check if user is already logged in (localStorage)
    const savedUser = localStorage.getItem('syncspace_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        geminiKey = localStorage.getItem('syncspace_gemini_key') || '';
        showView('dashboard');
        userNameEl.textContent = currentUser.displayName;
        loadTasks();
    } else {
        showView('auth');
    }
}

function showView(viewName) {
    Object.values(views).forEach(v => v.classList.remove('active'));
    views[viewName].classList.add('active');
}

// --- Event Listeners ---
function setupEventListeners() {
    // Auth
    authForm.addEventListener('submit', handleAuth);
    
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('syncspace_user');
        currentUser = null;
        showView('auth');
    });

    // Modal
    newTaskBtn.addEventListener('click', () => {
        taskForm.reset();
        taskModal.classList.remove('hidden');
    });
    closeModalBtn.addEventListener('click', () => taskModal.classList.add('hidden'));
    
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('task-title').value;
        const desc = document.getElementById('task-desc').value;
        const status = document.getElementById('task-status').value;
        
        const newTask = {
            id: Date.now().toString(),
            title,
            description: desc,
            status,
            createdAt: new Date().toISOString(),
            author: currentUser ? currentUser.email : 'Guest'
        };

        STATE.tasks.push(newTask);
        saveTasks();
        renderBoard();
        
        taskModal.classList.add('hidden');
        taskForm.reset();
    });

    // Assistant
    toggleAssistantBtn.addEventListener('click', () => assistantPanel.classList.toggle('hidden'));
    closeAssistantBtn.addEventListener('click', () => assistantPanel.classList.add('hidden'));
    sendQueryBtn.addEventListener('click', handleAssistantQuery);
    assistantQuery.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAssistantQuery();
    });

    // AI Generate Description
    document.getElementById('ai-generate-desc').addEventListener('click', async () => {
        const title = document.getElementById('task-title').value;
        if (!title) return alert("Please enter a title first!");
        
        const descInput = document.getElementById('task-desc');
        descInput.value = "Generating... (Waiting for Gemini AI)";
        
        if (geminiKey) {
            const prompt = `Act as a FinTech Technical Project Manager. Break down the following broad feature request into 4 concise technical sub-tasks for a developer. Format it as markdown list with checkboxes. Feature: ${title}`;
            const aiResponse = await callGeminiAPI(prompt);
            descInput.value = aiResponse || `**Business Request:** ${title}\n\n**Technical Sub-tasks:**\n- [ ] Create secure API endpoint\n- [ ] Update UI components\n- [ ] Write unit tests for decimal math\n- [ ] Ensure KYC/AML compliance`;
        } else {
            // Fallback if no key provided
            setTimeout(() => {
                descInput.value = `**Business Request:** ${title}\n\n**Technical Sub-tasks:**\n- [ ] Create secure API endpoint for ${title}\n- [ ] Update UI components\n- [ ] Write unit tests for decimal math and edge cases\n- [ ] Ensure compliance with KYC/AML logging`;
            }, 800);
        }
    });

    // Drag and Drop
    setupDragAndDrop();
}

// --- Authentication Logic ---
function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const key = document.getElementById('gemini-key').value;

    // Local Storage Login
    currentUser = { email: email, displayName: email.split('@')[0] };
    geminiKey = key;
    
    localStorage.setItem('syncspace_user', JSON.stringify(currentUser));
    if (geminiKey) localStorage.setItem('syncspace_gemini_key', geminiKey);
    
    showView('dashboard');
    userNameEl.textContent = currentUser.displayName;
    loadTasks();
}

// --- Data Fetching (LocalStorage) ---
function loadTasks() {
    const saved = localStorage.getItem('syncspace_tasks');
    if (saved) {
        STATE.tasks = JSON.parse(saved);
    } else {
        // Pre-fill with FinTech data if first time
        STATE.tasks = [
            { id: '1', title: 'Implement Split Payment UI', description: 'Business: Let users split payments. Tech: Update UI to show split UI.', status: 'todo', author: 'pm@fintech.com' },
            { id: '2', title: 'Create API endpoint for split logic', description: 'Ensure decimal math is secure.', status: 'in-progress', author: 'dev@fintech.com' },
            { id: '3', title: 'Write unit tests for decimal math', description: 'Crucial for financial compliance.', status: 'done', author: 'qa@fintech.com' }
        ];
        saveTasks();
    }
    renderBoard();
}

function saveTasks() {
    localStorage.setItem('syncspace_tasks', JSON.stringify(STATE.tasks));
}

// --- Board Rendering & Logic ---
function renderBoard() {
    // Clear lists
    Object.values(taskLists).forEach(list => list.innerHTML = '');
    
    // Reset counts
    const counts = { todo: 0, 'in-progress': 0, review: 0, done: 0 };

    STATE.tasks.forEach(task => {
        const list = taskLists[task.status];
        if (list) {
            counts[task.status]++;
            const card = document.createElement('div');
            card.className = 'task-card';
            card.draggable = true;
            card.dataset.id = task.id;
            
            card.innerHTML = `
                <h4>${escapeHTML(task.title)}</h4>
                <p>${escapeHTML(task.description || '')}</p>
                <div class="task-meta">
                    <span><i class="fas fa-user-circle"></i> ${escapeHTML(task.author.split('@')[0])}</span>
                </div>
            `;
            
            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragend', handleDragEnd);
            list.appendChild(card);
        }
    });

    // Update counts
    Object.keys(counts).forEach(status => {
        const col = document.querySelector(`.column[data-status="${status}"] .count`);
        if (col) col.textContent = counts[status];
    });
}

// --- Drag & Drop ---
function setupDragAndDrop() {
    columns.forEach(col => {
        const list = col.querySelector('.task-list');
        list.addEventListener('dragover', e => {
            e.preventDefault();
            list.classList.add('drag-over');
        });
        list.addEventListener('dragleave', () => list.classList.remove('drag-over'));
        list.addEventListener('drop', e => handleDrop(e, col.dataset.status));
    });
}

function handleDragStart(e) {
    STATE.draggedTask = e.target.dataset.id;
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    document.querySelectorAll('.task-list').forEach(l => l.classList.remove('drag-over'));
}

function handleDrop(e, newStatus) {
    e.preventDefault();
    document.querySelectorAll('.task-list').forEach(l => l.classList.remove('drag-over'));
    
    if (!STATE.draggedTask) return;

    const task = STATE.tasks.find(t => t.id === STATE.draggedTask);
    if (task) {
        task.status = newStatus;
        saveTasks();
        renderBoard();
    }
    STATE.draggedTask = null;
}

// --- Smart Assistant (Google Gemini API) ---
async function handleAssistantQuery() {
    const queryStr = assistantQuery.value.trim();
    if (!queryStr) return;

    addMessage(queryStr, 'user');
    assistantQuery.value = '';

    if (!geminiKey) {
        let response = "To use real AI, please add a Google Gemini API key on the login screen. Logging out and back in will let you set it.";
        if (queryStr.toLowerCase().includes('summarize')) {
            const counts = { todo: 0, 'in-progress': 0, review: 0, done: 0 };
            STATE.tasks.forEach(t => counts[t.status]++);
            response = `**Mock Summary:** You have ${counts.todo} To Do, ${counts['in-progress']} In Progress, ${counts.review} in Review, and ${counts.done} Done.`;
        }
        setTimeout(() => addMessage(response, 'ai'), 800);
        return;
    }

    addMessage('Thinking...', 'ai');
    
    const boardState = JSON.stringify(STATE.tasks);
    const prompt = `You are a FinTech Smart Assistant helping a team. Answer this user query: "${queryStr}". \nHere is the current board state in JSON: ${boardState}`;
    
    const response = await callGeminiAPI(prompt);
    
    // Remove "Thinking..." message
    assistantMessages.lastChild.remove();
    addMessage(response || "Sorry, I couldn't reach the Gemini API.", 'ai');
}

async function callGeminiAPI(prompt) {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        });
        const data = await res.json();
        return data.candidates[0].content.parts[0].text;
    } catch (err) {
        console.error(err);
        return null;
    }
}

function addMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = `message ${sender}`;
    msg.innerHTML = text.replace(/\n/g, '<br>'); // Simple formatting
    assistantMessages.appendChild(msg);
    assistantMessages.scrollTop = assistantMessages.scrollHeight;
}

// --- Utilities ---
function escapeHTML(str) {
    const p = document.createElement('p');
    p.appendChild(document.createTextNode(str));
    return p.innerHTML;
}

window.onload = init;
