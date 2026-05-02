'use strict';

/* ===== TEAM MEMBERS (4 personas) ===== */
const TEAM = [
    { id: 't1', name: 'Ananya Sharma', email: 'ananya@fintech.com', role: 'Product Manager', color: '#6366F1' },
    { id: 't2', name: 'Rahul Verma', email: 'rahul@fintech.com', role: 'Full-Stack Developer', color: '#10B981' },
    { id: 't3', name: 'Priya Nair', email: 'priya@fintech.com', role: 'Compliance Officer', color: '#F59E0B' },
    { id: 't4', name: 'Dev Kapoor', email: 'dev@fintech.com', role: 'Site Reliability Engineer', color: '#EF4444' }
];

/* ===== STATE ===== */
let currentUser = null, geminiKey = '', activityLog = [];
const STATE = { tasks: [], draggedTask: null };

/* ===== SECURITY: sanitize all user input ===== */
function escapeHTML(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(String(str)));
    return d.innerHTML;
}
function sanitizeInput(str) {
    return String(str || '').replace(/[<>\"'`]/g, '').trim().slice(0, 2000);
}
function sanitizePrompt(str) {
    const blocked = /ignore\s+(previous|above|all)|system\s*prompt|act\s+as|you\s+are\s+now|forget\s+(everything|instructions)/i;
    if (blocked.test(str)) return '[Blocked: potential prompt injection detected]';
    return String(str).slice(0, 500);
}

/* ===== TOAST ===== */
function toast(msg, type) {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = 'toast toast-' + (type || 'info');
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

/* ===== INIT ===== */
function init() {
    setupEvents();
    renderTeam();
    populateAssignee();
    const saved = localStorage.getItem('ss_user');
    if (saved) {
        currentUser = JSON.parse(saved);
        geminiKey = localStorage.getItem('ss_gkey') || '';
        showView('dashboard');
        document.getElementById('user-name').textContent = currentUser.displayName;
        document.getElementById('user-role').textContent = currentUser.role;
        loadTasks();
    } else { showView('auth'); }
}

function showView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(name === 'auth' ? 'auth-view' : 'dashboard-view').classList.add('active');
}
function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + name).classList.add('active');
    document.querySelectorAll('.nav-links li').forEach(li => {
        li.classList.toggle('active', li.dataset.page === name);
        li.setAttribute('aria-selected', li.dataset.page === name);
    });
}

/* ===== EVENTS ===== */
function setupEvents() {
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('ss_user'); currentUser = null; showView('auth');
    });
    document.querySelectorAll('.nav-links li').forEach(li => {
        li.querySelector('a').addEventListener('click', e => { e.preventDefault(); showPage(li.dataset.page); });
    });
    document.getElementById('new-task-btn').addEventListener('click', () => {
        document.getElementById('task-form').reset();
        document.getElementById('task-modal').classList.remove('hidden');
    });
    document.querySelector('.close-modal').addEventListener('click', () => document.getElementById('task-modal').classList.add('hidden'));
    document.getElementById('task-form').addEventListener('submit', handleCreateTask);
    document.getElementById('toggle-assistant').addEventListener('click', () => document.getElementById('assistant-panel').classList.toggle('hidden'));
    document.getElementById('close-assistant').addEventListener('click', () => document.getElementById('assistant-panel').classList.add('hidden'));
    document.getElementById('send-query').addEventListener('click', handleAssistant);
    document.getElementById('assistant-query').addEventListener('keypress', e => { if (e.key === 'Enter') handleAssistant(); });
    document.getElementById('ai-generate-desc').addEventListener('click', handleAIGenerate);
    document.getElementById('search-input').addEventListener('input', handleSearch);
    document.getElementById('save-gemini-key').addEventListener('click', () => {
        geminiKey = document.getElementById('settings-gemini-key').value.trim();
        if (geminiKey) { localStorage.setItem('ss_gkey', geminiKey); toast('Gemini API key saved!', 'success'); }
    });
    document.getElementById('export-data').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify({ tasks: STATE.tasks, log: activityLog }, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'syncspace_export.json'; a.click();
        toast('Data exported!', 'success');
    });
    document.getElementById('clear-data').addEventListener('click', () => {
        if (confirm('Delete ALL tasks and activity? This cannot be undone.')) {
            STATE.tasks = []; activityLog = []; saveTasks(); saveLog(); renderBoard(); renderActivity();
            toast('All data cleared.', 'error');
        }
    });
    document.querySelector('.close-detail-modal').addEventListener('click', () => document.getElementById('detail-modal').classList.add('hidden'));
    setupDragDrop();
}

/* ===== AUTH ===== */
function handleLogin(e) {
    e.preventDefault();
    const email = sanitizeInput(document.getElementById('login-email').value);
    const role = document.getElementById('login-role').value;
    if (!email) return;
    currentUser = { email, displayName: email.split('@')[0], role };
    geminiKey = document.getElementById('gemini-key').value.trim();
    localStorage.setItem('ss_user', JSON.stringify(currentUser));
    if (geminiKey) localStorage.setItem('ss_gkey', geminiKey);
    showView('dashboard');
    document.getElementById('user-name').textContent = currentUser.displayName;
    document.getElementById('user-role').textContent = role.replace(/-/g, ' ');
    loadTasks();
    toast('Welcome, ' + escapeHTML(currentUser.displayName) + '!', 'success');
}

/* ===== DATA ===== */
function loadTasks() {
    const s = localStorage.getItem('ss_tasks');
    if (s) { STATE.tasks = JSON.parse(s); }
    else {
        STATE.tasks = [
            { id: '1', title: 'Implement Split Payment UI', description: 'Business: Let users split payments.\nTech: Build responsive split-payment form component.', status: 'todo', priority: 'high', author: 'ananya@fintech.com', assignee: 't2', tags: ['@rahul','@priya'], createdAt: new Date().toISOString() },
            { id: '2', title: 'Create secure API for split logic', description: 'Build REST endpoint with decimal-safe math.\nEnsure PCI-DSS compliance logging.', status: 'in-progress', priority: 'critical', author: 'rahul@fintech.com', assignee: 't2', tags: ['@dev'], createdAt: new Date().toISOString() },
            { id: '3', title: 'KYC verification audit', description: 'Review all KYC verification flows.\nEnsure GDPR data handling compliance.', status: 'review', priority: 'critical', author: 'priya@fintech.com', assignee: 't3', tags: ['@ananya'], createdAt: new Date().toISOString() },
            { id: '4', title: 'Payment gateway uptime monitoring', description: 'Configure alerting for payment gateway.\nSet up dashboards for latency tracking.', status: 'done', priority: 'medium', author: 'dev@fintech.com', assignee: 't4', tags: ['@rahul'], createdAt: new Date().toISOString() },
            { id: '5', title: 'Write unit tests for decimal math', description: 'Cover edge cases: rounding, overflow, currency conversion.\nCritical for financial compliance.', status: 'todo', priority: 'high', author: 'rahul@fintech.com', assignee: 't2', tags: ['@priya','@ananya'], createdAt: new Date().toISOString() }
        ];
        saveTasks();
    }
    const l = localStorage.getItem('ss_log');
    activityLog = l ? JSON.parse(l) : [];
    renderBoard(); renderActivity();
}
function saveTasks() { localStorage.setItem('ss_tasks', JSON.stringify(STATE.tasks)); }
function saveLog() { localStorage.setItem('ss_log', JSON.stringify(activityLog.slice(-50))); }
function logActivity(text) {
    activityLog.push({ text, time: new Date().toISOString() });
    saveLog(); renderActivity();
}

/* ===== BOARD ===== */
function renderBoard(filter) {
    const lists = { todo: document.getElementById('list-todo'), 'in-progress': document.getElementById('list-in-progress'), review: document.getElementById('list-review'), done: document.getElementById('list-done') };
    Object.values(lists).forEach(l => l.innerHTML = '');
    const counts = { todo: 0, 'in-progress': 0, review: 0, done: 0 };
    let tasks = STATE.tasks;
    if (filter) { const f = filter.toLowerCase(); tasks = tasks.filter(t => t.title.toLowerCase().includes(f) || (t.tags || []).some(tg => tg.toLowerCase().includes(f))); }
    tasks.forEach(task => {
        const list = lists[task.status]; if (!list) return;
        counts[task.status]++;
        const member = TEAM.find(m => m.id === task.assignee);
        const card = document.createElement('div');
        card.className = 'task-card'; card.draggable = true; card.dataset.id = task.id;
        card.setAttribute('role', 'listitem'); card.setAttribute('tabindex', '0');
        card.innerHTML = `<h4>${escapeHTML(task.title)}</h4><p>${escapeHTML(task.description)}</p>
            <div class="task-meta"><span class="task-priority priority-${task.priority || 'medium'}">${escapeHTML(task.priority || 'medium')}</span>
            <span><i class="fas fa-user-circle"></i> ${member ? escapeHTML(member.name) : escapeHTML((task.author||'').split('@')[0])}</span></div>
            ${(task.tags && task.tags.length) ? '<div class="task-tags">' + task.tags.map(t => '<span class="tag">' + escapeHTML(t) + '</span>').join('') + '</div>' : ''}`;
        card.addEventListener('dragstart', e => { STATE.draggedTask = task.id; e.target.classList.add('dragging'); });
        card.addEventListener('dragend', e => { e.target.classList.remove('dragging'); document.querySelectorAll('.task-list').forEach(l => l.classList.remove('drag-over')); });
        card.addEventListener('click', () => showDetail(task.id));
        card.addEventListener('keypress', e => { if (e.key === 'Enter') showDetail(task.id); });
        list.appendChild(card);
    });
    Object.keys(counts).forEach(s => { const el = document.getElementById('count-' + s); if (el) el.textContent = counts[s]; });
}

/* ===== DRAG & DROP ===== */
function setupDragDrop() {
    document.querySelectorAll('.column').forEach(col => {
        const list = col.querySelector('.task-list');
        list.addEventListener('dragover', e => { e.preventDefault(); list.classList.add('drag-over'); });
        list.addEventListener('dragleave', () => list.classList.remove('drag-over'));
        list.addEventListener('drop', e => {
            e.preventDefault(); list.classList.remove('drag-over');
            if (!STATE.draggedTask) return;
            const task = STATE.tasks.find(t => t.id === STATE.draggedTask);
            if (task) { const old = task.status; task.status = col.dataset.status; saveTasks(); renderBoard(); logActivity(`Task "${task.title}" moved from ${old} to ${task.status}`); }
            STATE.draggedTask = null;
        });
    });
}

/* ===== CREATE TASK ===== */
function handleCreateTask(e) {
    e.preventDefault();
    const title = sanitizeInput(document.getElementById('task-title').value);
    if (!title) return;
    const task = {
        id: Date.now().toString(), title,
        description: sanitizeInput(document.getElementById('task-desc').value),
        status: document.getElementById('task-status').value,
        priority: document.getElementById('task-priority').value,
        assignee: document.getElementById('task-assignee').value,
        tags: document.getElementById('task-tags').value.split(',').map(t => sanitizeInput(t)).filter(Boolean),
        author: currentUser.email, createdAt: new Date().toISOString()
    };
    STATE.tasks.push(task); saveTasks(); renderBoard();
    document.getElementById('task-modal').classList.add('hidden');
    logActivity(`${currentUser.displayName} created task "${title}"`);
    toast('Task created!', 'success');
}

/* ===== TASK DETAIL ===== */
function showDetail(id) {
    const task = STATE.tasks.find(t => t.id === id); if (!task) return;
    const member = TEAM.find(m => m.id === task.assignee);
    const body = document.getElementById('detail-modal-body');
    body.innerHTML = `<div class="detail-header"><h2>${escapeHTML(task.title)}</h2>
        <div class="detail-meta"><span class="task-priority priority-${task.priority}">${escapeHTML(task.priority)}</span>
        <span class="badge badge-info">${escapeHTML(task.status)}</span>
        ${member ? '<span class="badge badge-role">' + escapeHTML(member.name) + '</span>' : ''}</div></div>
        <div class="detail-section"><h4>Description</h4><p>${escapeHTML(task.description)}</p></div>
        <div class="detail-section"><h4>Tags</h4><div class="task-tags">${(task.tags||[]).map(t=>'<span class="tag">'+escapeHTML(t)+'</span>').join('')||'<span style="color:var(--text-dim)">None</span>'}</div></div>
        <div class="detail-section"><h4>Author</h4><p>${escapeHTML(task.author)}</p></div>
        <div class="detail-actions"><button class="btn btn-danger btn-sm" onclick="deleteTask('${escapeHTML(task.id)}')"><i class="fas fa-trash"></i> Delete</button></div>`;
    document.getElementById('detail-modal').classList.remove('hidden');
}
function deleteTask(id) {
    STATE.tasks = STATE.tasks.filter(t => t.id !== id); saveTasks(); renderBoard();
    document.getElementById('detail-modal').classList.add('hidden');
    logActivity('Task deleted'); toast('Task deleted.', 'error');
}

/* ===== SEARCH ===== */
function handleSearch() { renderBoard(document.getElementById('search-input').value); }

/* ===== TEAM PAGE ===== */
function renderTeam() {
    const grid = document.getElementById('team-grid');
    grid.innerHTML = TEAM.map(m => {
        const initials = m.name.split(' ').map(w => w[0]).join('');
        return `<div class="team-card glass-panel"><div class="team-avatar" style="background:${m.color}">${initials}</div>
        <div class="team-card-info"><h4>${escapeHTML(m.name)}</h4><p>${escapeHTML(m.email)}</p><span class="badge badge-role">${escapeHTML(m.role)}</span></div>
        <div class="team-card-stats"><strong id="stat-${m.id}">0</strong><br>tasks</div></div>`;
    }).join('');
}
function updateTeamStats() {
    TEAM.forEach(m => {
        const el = document.getElementById('stat-' + m.id);
        if (el) el.textContent = STATE.tasks.filter(t => t.assignee === m.id).length;
    });
}
function renderActivity() {
    const el = document.getElementById('activity-log'); if (!el) return;
    el.innerHTML = activityLog.slice(-20).reverse().map(a =>
        `<div class="activity-item"><span class="activity-dot"></span><span>${escapeHTML(a.text)}</span><span class="activity-time">${new Date(a.time).toLocaleTimeString()}</span></div>`
    ).join('') || '<p style="color:var(--text-dim);padding:8px">No activity yet.</p>';
    updateTeamStats();
}
function populateAssignee() {
    const sel = document.getElementById('task-assignee');
    sel.innerHTML = '<option value="">Unassigned</option>' + TEAM.map(m => `<option value="${m.id}">${escapeHTML(m.name)} (${escapeHTML(m.role)})</option>`).join('');
}

/* ===== GEMINI AI ===== */
async function callGemini(prompt) {
    if (!geminiKey) return null;
    const safe = sanitizePrompt(prompt);
    if (safe.startsWith('[Blocked')) return safe;
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + geminiKey;
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'You are a helpful FinTech project assistant. ' + safe }] }],
            safetySettings: [{ category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }] })
    });
    const data = await res.json();
    if (data.error) return 'API Error: ' + (data.error.message || 'Unknown');
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';
}

async function handleAssistant() {
    const q = document.getElementById('assistant-query').value.trim(); if (!q) return;
    addMsg(q, 'user'); document.getElementById('assistant-query').value = '';
    if (!geminiKey) { addMsg('Please add your Gemini API key in Settings to use the AI assistant.', 'ai'); return; }
    addMsg('Thinking...', 'ai thinking');
    const board = JSON.stringify(STATE.tasks.map(t => ({ title: t.title, status: t.status, priority: t.priority, assignee: TEAM.find(m => m.id === t.assignee)?.name || 'unassigned' })));
    const resp = await callGemini(`User query: "${sanitizePrompt(q)}"\nCurrent board: ${board}\nAnswer concisely.`);
    const msgs = document.getElementById('assistant-messages');
    if (msgs.lastChild?.classList?.contains('thinking')) msgs.lastChild.remove();
    addMsg(resp || 'Could not get a response.', 'ai');
}

async function handleAIGenerate() {
    const title = document.getElementById('task-title').value;
    if (!title) return alert('Enter a title first.');
    const desc = document.getElementById('task-desc');
    if (!geminiKey) { desc.value = 'Add a Gemini API key in Settings to use AI generation.'; return; }
    desc.value = 'Generating with Gemini AI...';
    const resp = await callGemini(`Break down this FinTech feature into 4 technical sub-tasks with checkboxes: "${sanitizePrompt(title)}"`);
    desc.value = resp || 'Could not generate. Try again.';
}

function addMsg(text, cls) {
    const d = document.createElement('div'); d.className = 'message ' + cls;
    d.textContent = text;
    const c = document.getElementById('assistant-messages');
    c.appendChild(d); c.scrollTop = c.scrollHeight;
}

window.onload = init;
